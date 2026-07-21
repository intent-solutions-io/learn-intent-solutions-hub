import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DEFAULT_DB_PATH } from "./db.js";

// Applies the drizzle migrations (./drizzle) to the SQLite file. Idempotent —
// the deploy script runs it on every release; already-applied migrations are
// skipped via drizzle's __drizzle_migrations bookkeeping table.
try {
  process.loadEnvFile?.();
} catch {
  /* no .env present */
}

const dbPath = process.env.DATABASE_PATH ?? DEFAULT_DB_PATH;
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: "./drizzle" });
console.log(`[migrate] applied migrations to ${dbPath}`);
sqlite.close();
