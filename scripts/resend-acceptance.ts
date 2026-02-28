/**
 * Resend the acceptance email to all accepted users (or specific addresses).
 *
 * Usage:
 *   tsx scripts/resend-acceptance.ts [--env <file>] [email1 email2 ...]
 *
 * Examples:
 *   tsx scripts/resend-acceptance.ts --env .env.local me@test.com        # test run
 *   tsx scripts/resend-acceptance.ts --env .env.production               # full run
 *   tsx scripts/resend-acceptance.ts                                      # uses process env as-is
 */

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

// ── Load env file BEFORE importing db / ses ───────────────────────────────────
if (envFile) {
  const { loadEnvConfig } = await import("@next/env");
  const envPath = envFile.replace(/\/[^/]+$/, "") || "."; // directory portion
  const fileName = envFile.split("/").pop()!;
  loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });
  // @next/env always loads from cwd; for a custom path we fall back to dotenv-style manual load
  const fs = await import("fs");
  const path = await import("path");
  const resolved = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(resolved)) {
    const raw = fs.readFileSync(resolved, "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
    console.log(`📂 Loaded env from: ${resolved}\n`);
  } else {
    console.error(`❌ Env file not found: ${resolved}`);
    process.exit(1);
  }
}

// ── Imports that depend on env being loaded ───────────────────────────────────
const { db } = await import("../lib/db");
const { users } = await import("../lib/db/schema");
const { eq, inArray } = await import("drizzle-orm");
const { sendAcceptanceEmail } = await import("../lib/ses");

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
    return url.slice(0, 30) + "…";
  }
};

// ── Main ──────────────────────────────────────────────────────────────────────
const resendAcceptanceEmails = async () => {
  const isTestRun = emailArgs.length > 0;

  // ── Show DB URL and ask for confirmation ──────────────────────────────────
  const rawDbUrl = process.env.DATABASE_URL ?? "(DATABASE_URL not set)";
  console.log("━".repeat(60));
  console.log("  DATABASE_URL →", maskDbUrl(rawDbUrl));
  console.log("━".repeat(60));

  const confirm = await prompt("\n✅ Is this the correct database? (yes/no): ");
  if (confirm !== "yes" && confirm !== "y") {
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

  try {
    const accepted = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(
        isTestRun
          ? inArray(users.email, emailArgs)
          : eq(users.applicationStatus, "accepted"),
      );

    if (!accepted.length) {
      console.log("✨ No matching users found. Nothing to send.");
      return;
    }

    // ── Pre-send summary ──────────────────────────────────────────────────
    const estSeconds = Math.ceil((accepted.length * 150) / 1000);

    console.log("\n" + "━".repeat(60));
    console.log("  📬  SEND PREVIEW");
    console.log("━".repeat(60));
    console.log(`  Mode          : ${isTestRun ? "🧪 Test run (specific addresses)" : "🌐 Full run (all accepted users)"}`);
    console.log(`  Template      : Acceptance Email (corrected)`);
    console.log(`  Recipients    : ${accepted.length}`);
    console.log(`  Est. duration : ~${estSeconds}s (150ms delay between sends)`);
    console.log("━".repeat(60));
    console.log("  Recipients:");
    accepted.forEach((u, i) =>
      console.log(`   ${String(i + 1).padStart(3)}. ${u.email.padEnd(40)} ${u.name}`),
    );
    console.log("━".repeat(60));

    if (isTestRun && accepted.length !== emailArgs.length) {
      const notFound = emailArgs.filter(
        (e) => !accepted.some((u) => u.email === e),
      );
      console.warn(`\n⚠️  ${notFound.length} address(es) not found in the DB (will be skipped):`);
      notFound.forEach((e) => console.warn(`   • ${e}`));
    }

    const go = await prompt(`\n🚀 Confirm: send acceptance email to all ${accepted.length} recipient(s)? (yes/no): `);
    if (go !== "yes" && go !== "y") {
      console.log("\n⛔ Aborted — no emails were sent.");
      process.exit(0);
    }
    console.log("");

    // ── Send ──────────────────────────────────────────────────────────────
    let successCount = 0;
    let failureCount = 0;
    const failed: string[] = [];

    for (const user of accepted) {
      try {
        const firstName = user.name.split(" ")[0] || "Hacker";
        const result = await sendAcceptanceEmail(firstName, user.email);

        if ("error" in result) throw new Error(result.error);

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
    console.log(`Total:   ${accepted.length}`);
    console.log(`Sent:    ${successCount}`);
    console.log(`Failed:  ${failureCount}`);

    if (failed.length) {
      console.log("\n❌ Failed addresses:");
      failed.forEach((e) => console.log(`   • ${e}`));
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

resendAcceptanceEmails()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
