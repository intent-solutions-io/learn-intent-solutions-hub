# Learn Intent Solutions

The learning hub for the Intent Solutions cohort (CCA R1, under the Claude
Partner Network). Deploys to **learn.intentsolutions.io**.

Exam tracks, practice tests with readiness gates, an Ask form that captures
cohort questions, and the front door of the funnel: video → learn → certify →
bench → paid client work through Intent Solutions.

## Stack (self-hosted — no Cloudflare)

- **App:** [Hono](https://hono.dev) + [Drizzle ORM](https://orm.drizzle.team),
  TypeScript, running on Node via `@hono/node-server`.
- **Data:** local SQLite (`better-sqlite3`) — the flywheel store (captured
  questions + practice results) lives on Intent Solutions infra, borg-backed.
- **Ingress:** Caddy on the Contabo VPS serves `public/` statically and
  reverse-proxies `/api/*` to the Node service on loopback `:8093`.

The app began on Cloudflare Workers + D1; it was ported to run on the estate's
own infrastructure. Only four runtime/hosting seams changed (Workers entry, D1 →
SQLite file, static asset serving, and the export token) — the schema, routes,
question banks, and product behaviour are unchanged. See `deploy/README.md`.

## Develop

```bash
npm install                 # compiles the better-sqlite3 native module
cp .env.example .env        # set EXPORT_TOKEN for the export endpoint
npm run migrate             # create ./data/cohort-hub.db from ./drizzle
npm run dev                 # hub on http://127.0.0.1:8093
```

API: `POST /api/ask` (question capture), `POST /api/practice` (result capture),
`GET /api/questions` (bearer-token export), `GET /api/health` (liveness).

## Deploy

`main` deploys automatically to learn.intentsolutions.io on the Contabo VPS:
pre-deploy build gate → Tailscale-OIDC SSH → VPS force-command
(build + migrate + restart the systemd service) → `/api/health` smoke check.
Work happens on branches via pull request. Deploy contract: `deploy/README.md`
and `intent-os/ops/deploy`.
