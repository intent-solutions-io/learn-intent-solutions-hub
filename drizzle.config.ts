import type { Config } from "drizzle-kit";

// Schema is already dialect:"sqlite" — the same migrations that ran on D1 apply
// unchanged to the local better-sqlite3 file. `npm run db:generate` writes new
// migrations to ./drizzle; the deploy script applies them via `npm run migrate`.
export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
} satisfies Config;
