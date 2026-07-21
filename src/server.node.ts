import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./index.js";

// Node entry (replaces the Workers `export default app`). Loads .env for local
// dev; in production the systemd unit supplies env via its EnvironmentFile.
try {
  process.loadEnvFile?.();
} catch {
  /* no .env present — fine, env comes from the environment */
}

// Static hub assets. This is the swap for Cloudflare's `c.env.ASSETS.fetch`.
// It is registered LAST so the /api/* and /community routes in ./index.ts win.
// In production Caddy serves ./public directly and only reverse-proxies /api/*
// to this process, so this middleware mainly matters for `npm run dev`.
app.use("*", serveStatic({ root: "./public" }));

const port = Number(process.env.PORT ?? 8093);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[learn-hub] listening on http://127.0.0.1:${info.port}`);
});
