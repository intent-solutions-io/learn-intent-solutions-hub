#!/bin/bash
# /usr/local/sbin/deploy-learn-intentsolutions
#
# Force-command deploy for learn-intent-solutions-hub (Node/Hono + SQLite).
# Invoked ONLY as the forced command for the learn deploy key in
# ~intentsolutions/.ssh/authorized_keys — the CI SSH connection triggers it;
# any args sent are ignored.
#
# Node variant (replaces the earlier static git-fetch/reset-only script):
#   git reset -> npm ci -> build (tsc) -> apply migrations -> prune dev deps
#   -> restart the systemd service. Caddy serves ./public/ statically and
#   reverse-proxies /api/* to the service on :8093.
#
# The SQLite DB (/srv/learn-intentsolutions/data/cohort-hub.db) is untracked
# and survives `git reset --hard` (reset only touches tracked files).
set -euo pipefail
export CI=true

SRV=/srv/learn-intentsolutions
LOG=/var/log/deploy-learn-intentsolutions.log

{
  echo "=== Deploy started $(date -u +%FT%TZ) ==="
  cd "$SRV"

  # 1. Sync source to origin/main (untracked data/ + node_modules preserved).
  git fetch --quiet origin main
  OLD=$(git rev-parse --short HEAD)
  git reset --quiet --hard origin/main
  NEW=$(git rev-parse --short HEAD)
  echo "Source: $OLD -> $NEW"

  # 2. Install (full — the build needs tsc) and compile to dist/.
  npm ci
  npm run build

  # 3. Apply drizzle migrations to the SQLite file (idempotent).
  npm run migrate

  # 4. Drop dev deps now that dist/ is built (keeps the runtime footprint lean).
  npm prune --omit=dev

  # 5. Restart the service (needs a sudoers entry for this exact command).
  sudo systemctl restart learn-intentsolutions

  echo "=== Deploy completed $(date -u +%FT%TZ) ==="
} 2>&1 | sudo tee -a "$LOG"
