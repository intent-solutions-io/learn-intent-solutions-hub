import { Hono } from "hono";
import { cors } from "hono/cors";
import { desc } from "drizzle-orm";
import { getDb } from "./db.js";
import { questions, practiceResults } from "./schema.js";

// Self-host port of Max Sheahan's cohort-hub (originally Cloudflare Workers + D1).
// Runtime seams that were Cloudflare-specific are swapped for Node primitives:
//   drizzle(c.env.DB)   -> getDb()                (better-sqlite3 file, ./db.ts)
//   c.env.EXPORT_TOKEN  -> process.env.EXPORT_TOKEN
//   c.env.ASSETS.fetch  -> serve-static in server.node.ts (prod: Caddy serves public/)
//   export default app  -> consumed by server.node.ts via @hono/node-server
// The Hono app, the schema, and every route/behaviour are otherwise unchanged.

const app = new Hono();

// API is CORS-open so the hub works even when embedded on another origin.
app.use("/api/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

const LANES = ["The exam", "Tools & how-to", "My project", "Program & logistics"];
const EXAM_CODES = ["CCAO-F", "CCDV-F", "CCAR-F", "CCAR-P"];

// Liveness — proves the Node service (not just Caddy static) is answering.
// The deploy smoke test curls this through the /api/* reverse_proxy.
app.get("/api/health", (c) => c.json({ ok: true, service: "learn-hub" }));

// Capture — the native Ask form posts here.
app.post("/api/ask", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const question = String(body?.question ?? "").trim();
  if (!question) return c.json({ error: "A question is required." }, 400);

  const anonymous = Boolean(body?.anonymous);
  const lane = LANES.includes(body?.lane) ? body.lane : "Program & logistics";

  const row = {
    lane,
    question: question.slice(0, 4000),
    context: String(body?.context ?? "").trim().slice(0, 4000) || null,
    urgency: body?.urgency === "blocking" ? "blocking" : "general",
    name: anonymous ? null : (String(body?.name ?? "").trim().slice(0, 120) || null),
    anonymous,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  try {
    const db = getDb();
    const inserted = await db.insert(questions).values(row).returning({ id: questions.id });
    return c.json({ ok: true, id: inserted[0]?.id });
  } catch (err) {
    console.error("insert failed", err);
    return c.json({ error: "Could not save your question. Please try again." }, 500);
  }
});

// Export — the weekly pull Claude ranks. Bearer-token protected (EXPORT_TOKEN env).
app.get("/api/questions", async (c) => {
  const auth = c.req.header("Authorization") ?? "";
  const token = process.env.EXPORT_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = getDb();
  const rows = await db.select().from(questions).orderBy(desc(questions.createdAt));
  return c.json({ count: rows.length, questions: rows });
});

// Practice-test result capture — the diagnostic instrument that feeds the flywheel.
app.post("/api/practice", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const correct = Math.max(0, Math.floor(Number(body?.correct) || 0));
  const total = Math.max(0, Math.floor(Number(body?.total) || 0));
  if (total <= 0) return c.json({ error: "No answers submitted." }, 400);
  const capped = Math.min(correct, total);
  const score = Math.round((capped / total) * 1000);
  const anonymous = Boolean(body?.anonymous);
  const row = {
    examCode: EXAM_CODES.includes(body?.examCode) ? body.examCode : "CCAR-F",
    score,
    correct: capped,
    total,
    domainBreakdown: body?.domainBreakdown ? JSON.stringify(body.domainBreakdown).slice(0, 4000) : null,
    name: anonymous ? null : (String(body?.name ?? "").trim().slice(0, 120) || null),
    anonymous,
    createdAt: new Date().toISOString(),
  };
  try {
    const db = getDb();
    const ins = await db.insert(practiceResults).values(row).returning({ id: practiceResults.id });
    return c.json({ ok: true, id: ins[0]?.id, score });
  } catch (err) {
    console.error("practice insert failed", err);
    return c.json({ error: "Could not save your result." }, 500);
  }
});

// Community folded into the hub home (index); keep the shared link working.
app.get("/community", (c) => c.redirect("/", 302));

export default app;
