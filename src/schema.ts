import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// The question queue — one row per submitted question.
// This is the flywheel's capture layer: Claude reads it for the weekly ranking.
export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lane: text("lane").notNull(), // The exam | Tools & how-to | My project | Program & logistics
  question: text("question").notNull(),
  context: text("context"),
  urgency: text("urgency"), // blocking | general
  name: text("name"),
  anonymous: integer("anonymous", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("new"), // new | answered
  createdAt: text("created_at").notNull(), // ISO 8601
});

// Practice-test results — the diagnostic instrument. Scored by domain; feeds "where the cohort fails".
export const practiceResults = sqliteTable("practice_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  examCode: text("exam_code").notNull().default("CCAR-F"), // CCAO-F | CCDV-F | CCAR-F | CCAR-P
  score: integer("score").notNull(), // scaled to the 1000-point exam scale
  correct: integer("correct").notNull(),
  total: integer("total").notNull(),
  domainBreakdown: text("domain_breakdown"), // JSON: { "<domain>": { correct, total } }
  name: text("name"),
  anonymous: integer("anonymous", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(), // ISO 8601
});
