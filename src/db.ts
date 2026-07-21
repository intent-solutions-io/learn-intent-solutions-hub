import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// Runtime-agnostic DB accessor. Replaces Cloudflare's `drizzle(c.env.DB)` (D1).
// The store is a local SQLite file — the flywheel asset (captured cohort
// questions + practice results) lives on Intent Solutions infra, borg-backed,
// with no Cloudflare in the path.
export const DEFAULT_DB_PATH = "./data/cohort-hub.db";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  const dbPath = process.env.DATABASE_PATH ?? DEFAULT_DB_PATH;
  mkdirSync(dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  _db = drizzle(sqlite);
  return _db;
}
