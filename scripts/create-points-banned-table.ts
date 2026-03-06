import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Creating pointsBannedUsers table...");

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "pointsBannedUsers" (
        "userId" text PRIMARY KEY NOT NULL,
        "bannedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "bannedBy" text,
        "reason" text
      )
    `;
    console.log("Table created");

    await sql`
      DO $$ BEGIN
        ALTER TABLE "pointsBannedUsers" ADD CONSTRAINT "pointsBannedUsers_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$
    `;
    console.log("FK1 added");

    await sql`
      DO $$ BEGIN
        ALTER TABLE "pointsBannedUsers" ADD CONSTRAINT "pointsBannedUsers_bannedBy_user_id_fk" FOREIGN KEY ("bannedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$
    `;
    console.log("FK2 added");

    console.log("Done!");
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

main();
