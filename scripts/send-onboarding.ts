/**
 * Send the Hacker Information Email (onboarding) to all accepted users who have RSVP'd.
 *
 * Usage:
 *   tsx scripts/send-onboarding.ts [--env <file>] [email1 email2 ...]
 *
 * Examples:
 *   tsx scripts/send-onboarding.ts --env .env.local me@test.com    # test run
 *   tsx scripts/send-onboarding.ts --env .env.production           # full run
 *   tsx scripts/send-onboarding.ts                                  # uses process env as-is
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ── Parse CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

let envFile: string | undefined;
const emailArgs: string[] = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--env" && args[i + 1]) {
    envFile = args[++i];
  } else {
    emailArgs.push(args[i]);
  }
}

// ── Load env file (unconditional override) ────────────────────────────────────
if (envFile) {
  const resolved = path.resolve(process.cwd(), envFile);

  if (!fs.existsSync(resolved)) {
    console.error(`❌ Env file not found: ${resolved}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolved, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = val;
  }

  console.log(`📂 Loaded env from: ${resolved}\n`);
}

// ── Imports (after env is loaded) ─────────────────────────────────────────────
import { eq, inArray } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../lib/db/schema";
import { users } from "../lib/db/schema";
import { SES } from "@aws-sdk/client-ses";

// React + email component — imported statically so JSX transform works
import { createElement, Suspense } from "react";
import { renderToReadableStream } from "react-dom/server";
import OnboardingEmail from "../components/Emails/OnboardingEmail";

// ── Create DB + SES from env ──────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const ses = new SES({
  region: process.env.AWS_SES_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ── Render email to HTML using Bun-compatible renderToReadableStream ──────────
async function renderEmail(name: string, userId: string): Promise<string> {
  const element = createElement(
    Suspense,
    null,
    createElement(OnboardingEmail, { name, userId }),
  );

  const stream = await renderToReadableStream(element, {
    onError(error: unknown) {
      console.error("Render error:", error);
    },
  });
  await stream.allReady;

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const html = Buffer.concat(chunks).toString("utf-8");
  const doc = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html.replace(/<!DOCTYPE.*?>/, "")}`;
  return doc;
}

// ── Send one email via SES ────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, body: string) {
  await ses.sendEmail({
    Source: `Hack Canada <${process.env.AWS_SES_NO_REPLY_EMAIL!}>`,
    Destination: { ToAddresses: [to] },
    Message: {
      Body: {
        Html: { Charset: "UTF-8", Data: body },
        Text: { Charset: "UTF-8", Data: body.replace(/<[^>]+>/g, "") },
      },
      Subject: { Charset: "UTF-8", Data: subject },
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const prompt = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
};

const maskDbUrl = (url: string) => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username}:****@${u.host}${u.pathname}`;
  } catch {
    return url.slice(0, 40) + "…";
  }
};

// ── Main ──────────────────────────────────────────────────────────────────────
const main = async () => {
  const isTestRun = emailArgs.length > 0;

  // ── Show DB URL and confirm ───────────────────────────────────────────────
  const rawDbUrl = process.env.DATABASE_URL ?? "(DATABASE_URL not set)";
  console.log("━".repeat(60));
  console.log("  DATABASE_URL →", maskDbUrl(rawDbUrl));
  console.log("━".repeat(60));

  const dbOk = await prompt("\n✅ Is this the correct database? (yes/no): ");
  if (dbOk !== "yes" && dbOk !== "y") {
    console.log("\n⛔ Aborted — no emails were sent.");
    process.exit(0);
  }
  console.log("");

  // ── Fetch recipients ──────────────────────────────────────────────────────
  if (isTestRun) {
    console.log(`🧪 TEST RUN — targeting ${emailArgs.length} specific address(es):`);
    emailArgs.forEach((e) => console.log(`   • ${e}`));
  } else {
    console.log("🔍 Fetching all accepted users...");
  }

  const recipients = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(
      isTestRun
        ? inArray(users.email, emailArgs)
        : eq(users.applicationStatus, "accepted"),
    );

  if (!recipients.length) {
    console.log("✨ No matching users found. Nothing to send.");
    process.exit(0);
  }

  // ── Pre-send summary ────────────────────────────────────────────────────
  const estSeconds = Math.ceil((recipients.length * 150) / 1000);

  console.log("\n" + "━".repeat(60));
  console.log("  📬  SEND PREVIEW");
  console.log("━".repeat(60));
  console.log(`  Mode          : ${isTestRun ? "🧪 Test run (specific addresses)" : "🌐 Full run (all accepted users)"}`);
  console.log(`  Template      : Hacker Information Email`);
  console.log(`  Recipients    : ${recipients.length}`);
  console.log(`  Est. duration : ~${estSeconds}s (150ms delay between sends)`);
  console.log("━".repeat(60));
  console.log("  Recipients:");
  recipients.forEach((u, i) =>
    console.log(`   ${String(i + 1).padStart(3)}. ${u.email.padEnd(42)} ${u.name}`),
  );
  console.log("━".repeat(60));

  if (isTestRun && recipients.length !== emailArgs.length) {
    const notFound = emailArgs.filter(
      (e) => !recipients.some((u) => u.email === e),
    );
    console.warn(`\n⚠️  ${notFound.length} address(es) not found in DB (skipped):`);
    notFound.forEach((e) => console.warn(`   • ${e}`));
  }

  const go = await prompt(`\n🚀 Confirm: send to all ${recipients.length} recipient(s)? (yes/no): `);
  if (go !== "yes" && go !== "y") {
    console.log("\n⛔ Aborted — no emails were sent.");
    process.exit(0);
  }
  console.log("");

  // ── Verify render works before sending to everyone ────────────────────
  const testHtml = await renderEmail("Test", "test-user-id");
  if (!testHtml || testHtml.length < 500) {
    console.error("❌ Email render produced empty/invalid HTML. Aborting.");
    console.error(`   Rendered length: ${testHtml?.length ?? 0}`);
    process.exit(1);
  }
  console.log(`✓ Render check passed (${testHtml.length} chars)\n`);

  // ── Send ──────────────────────────────────────────────────────────────
  const subject = "Important Links and Information for Hack Canada 2026";
  let successCount = 0;
  let failureCount = 0;
  const failed: string[] = [];

  for (const user of recipients) {
    try {
      const firstName = user.name.split(" ")[0] || "Hacker";
      const html = await renderEmail(firstName, user.id);
      await sendEmail(user.email, subject, html);

      console.log(`✅ Sent → ${user.email} (${firstName})`);
      successCount++;
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (error) {
      console.error(`❌ Failed → ${user.email}:`, error);
      failed.push(user.email);
      failureCount++;
    }
  }

  console.log("\n📊 Summary");
  console.log("━".repeat(40));
  console.log(`Total:   ${recipients.length}`);
  console.log(`Sent:    ${successCount}`);
  console.log(`Failed:  ${failureCount}`);

  if (failed.length) {
    console.log("\n❌ Failed addresses:");
    failed.forEach((e) => console.log(`   • ${e}`));
  }
};

main()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
