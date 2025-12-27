import { defineConfig } from "drizzle-kit";

console.log(process.env.DATABASE_URL);

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
