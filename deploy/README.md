# Self-host runbook — Intent Solutions Learn Hub

The hub runs on the Intent Solutions VPS (`intentsolutions`, 167.86.106.29) with
**no Cloudflare dependency**: a Node/Hono systemd service on loopback `:8093`,
Caddy for ingress + static assets, and a local SQLite file (borg-backed) as the
data store. Ops authority for the deploy contract: `intent-os/ops/deploy/`.

| Piece | Where |
|---|---|
| systemd unit | `/etc/systemd/system/learn-intentsolutions.service` (from `deploy/learn-intentsolutions.service`) |
| deploy force-command | `/usr/local/sbin/deploy-learn-intentsolutions` (from `deploy/deploy-learn-intentsolutions.sh`) |
| Caddy vhost | block in `/etc/caddy/Caddyfile` (from `deploy/Caddyfile.snippet`) |
| checkout | `/srv/learn-intentsolutions` (existing) |
| data (flywheel) | `/srv/learn-intentsolutions/data/cohort-hub.db` — untracked, borg-backed |
| secrets | `/etc/intentsolutions/learn-hub.env` (640, `EXPORT_TOKEN`, SOPS-managed) |

## Runtime / hosting seams (what the port swapped)

| Cloudflare (Max's original) | Self-host |
|---|---|
| Workers `export default app` | `@hono/node-server` `serve()` in `src/server.node.ts` |
| `drizzle(c.env.DB)` (D1) | `drizzle-orm/better-sqlite3` file, `src/db.ts` (`DATABASE_PATH`) |
| `c.env.ASSETS.fetch()` | Caddy `file_server` on `public/` (dev: node serve-static) |
| `c.env.EXPORT_TOKEN` | `process.env.EXPORT_TOKEN` (systemd EnvironmentFile) |

## First-time install on the VPS

```bash
# 1. EXPORT_TOKEN secret (SOPS-managed; 640 root:adm like notify.env)
sudo install -m 640 -o root -g adm /dev/stdin /etc/intentsolutions/learn-hub.env <<'EOF'
EXPORT_TOKEN=<generate: openssl rand -hex 32>
EOF

# 2. systemd unit
sudo install -m 644 deploy/learn-intentsolutions.service \
  /etc/systemd/system/learn-intentsolutions.service
sudo systemctl daemon-reload

# 3. deploy force-command (swap the static one)
sudo install -m 755 deploy/deploy-learn-intentsolutions.sh \
  /usr/local/sbin/deploy-learn-intentsolutions

# 4. sudoers: let the deploy user restart just this service
echo 'intentsolutions ALL=(root) NOPASSWD: /bin/systemctl restart learn-intentsolutions' \
  | sudo install -m 440 /dev/stdin /etc/sudoers.d/learn-intentsolutions

# 5. build once + apply migrations, then start
cd /srv/learn-intentsolutions
git fetch origin main && git reset --hard origin/main
npm ci && npm run build && npm run migrate && npm prune --omit=dev
sudo systemctl enable --now learn-intentsolutions

# 6. Caddy: replace the learn.intentsolutions.io block, then reload (never restart)
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Verify

```bash
systemctl is-active learn-intentsolutions
curl -s https://learn.intentsolutions.io/api/health          # {"ok":true,...}
curl -sI https://learn.intentsolutions.io/ | head -1         # 200, real hub
# export pull (bearer):
curl -s https://learn.intentsolutions.io/api/questions \
  -H "Authorization: Bearer $(sudo sed -n 's/^EXPORT_TOKEN=//p' /etc/intentsolutions/learn-hub.env)"
dig +short learn.intentsolutions.io                          # VPS IP, not Cloudflare
```

## Ongoing deploys

Merge to `main` → GitHub Actions (`.github/workflows/deploy.yml`) → Tailscale
OIDC → force-command → the deploy script above → post-deploy smoke against
`/api/health`. Same pattern as the rest of the estate.

## Notes

- `better-sqlite3` is a native module; `npm ci` compiles it on the VPS (build
  toolchain already present — used by the DiagnosticPro deploy).
- `wrangler.toml` is kept for reference only; **nothing at deploy time uses
  Cloudflare / wrangler / D1**.
- Source app authored by Max Sheahan (`blueandyellow44/cohort-hub`); this is the
  runtime/hosting port, product behaviour unchanged.
