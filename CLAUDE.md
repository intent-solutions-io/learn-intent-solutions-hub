# CLAUDE.md

## Project Overview

**learn-intent-solutions-hub** — The Intent Solutions cohort learning hub. Exam tracks and practice tests with readiness gates. Deploys to learn.intentsolutions.io.

- **Language**: node
- **Repo**: https://github.com/intent-solutions-io/learn-intent-solutions-hub
- **License**: Apache-2.0

## Task Tracking with Beads (bd)

**Beads provides post-compaction recovery.** Run `/beads` at session start.

**Workflow:** `bd update <id> --status in_progress` → work → `bd close <id> --reason "evidence"`

Key commands: `bd prime` (LLM context), `bd ready`, `bd list --status in_progress`, `bd doctor`

## Build & Test

Self-hosted Hono/Node app with a local SQLite store (no Cloudflare).

```bash
npm install          # compiles better-sqlite3 (native)
npm run migrate      # apply ./drizzle migrations to DATABASE_PATH
npm run dev          # tsx watch — hub on :8093
npm run build        # tsc -> dist/
npm run typecheck    # tsc --noEmit (also `npm test`)
npm start            # node dist/server.node.js (prod entry)
```

Env: `PORT` (8093), `DATABASE_PATH` (`./data/cohort-hub.db` dev; `/srv/learn-intentsolutions/data/cohort-hub.db` prod), `EXPORT_TOKEN` (bearer for `GET /api/questions`). Prod env comes from the systemd `EnvironmentFile`, not `.env`.

## Deploy

`main` → GitHub Actions → Tailscale-OIDC SSH → VPS force-command (build + migrate + restart the `learn-intentsolutions` systemd service on :8093) → Caddy serves `public/` + proxies `/api/*` → `/api/health` smoke. Full runbook + systemd unit + Caddy block: **`deploy/`**. Ops authority: `intent-os/ops/deploy`.

## Project Structure

```
learn-intent-solutions-hub/
├── src/                # index.ts (Hono app+routes), db.ts, server.node.ts, migrate.ts, schema.ts
├── public/             # static hub UI + question banks (Caddy-served)
├── drizzle/            # SQLite migrations (dialect: sqlite)
├── deploy/             # systemd unit, VPS deploy script, Caddy snippet, self-host runbook
├── 000-docs/           # Enterprise documentation (doc-filing v4)
├── .github/            # CI/CD, issue templates, PR template
└── README.md           # Project overview
```

## Conventions

- Commit messages: `<type>(<scope>): <subject>`
- Branch naming: `feature/`, `fix/`, `docs/`
- PR workflow: feature branch → PR → review → merge
- Doc filing: `000-docs/` with v4 naming convention
