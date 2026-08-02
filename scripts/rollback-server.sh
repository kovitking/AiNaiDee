#!/usr/bin/env bash
# Run this ON the deploy server to undo the most recent deploy — or trigger it
# from a dev machine with scripts/rollback.sh. Optionally takes a specific
# backup directory as $1; defaults to the most recent ainaidee_backup_*.
#
# Mirrors deploy-server.sh's swap, in reverse. The bug this fixes: Compose
# derives the network name from the directory name, so bringing a backup
# checkout up *in place* (without renaming it back to the live path first)
# starts a container Caddy can't reach — same network name in the Caddyfile's
# expectations, but a different directory means a different Compose project,
# hence a different actual network. The backup directory must become the live
# directory again before `docker compose up` runs — same as deploy does it,
# just backwards. Rebuilds before starting, because `docker compose build`
# always retags `ainaidee:latest`, so the tag from the deploy being rolled
# back is gone by the time this runs.
set -euo pipefail

APPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LIVE_DIR="$APPS_DIR/ainaidee"

BACKUP_DIR="${1:-}"
if [ -z "$BACKUP_DIR" ]; then
  BACKUP_DIR="$(ls -dt "$APPS_DIR"/ainaidee_backup_* 2>/dev/null | head -1)"
fi
if [ -z "$BACKUP_DIR" ] || [ ! -d "$BACKUP_DIR" ]; then
  echo "no backup directory found — pass one explicitly: rollback-server.sh <path>" >&2
  exit 1
fi

FAILED_DIR="$APPS_DIR/ainaidee_failed_$(date +%Y%m%d_%H%M%S)"
mv "$LIVE_DIR" "$FAILED_DIR"
mv "$BACKUP_DIR" "$LIVE_DIR"

cd "$LIVE_DIR"
docker compose build app
docker compose up -d app

echo "rolled back to $LIVE_DIR (was $BACKUP_DIR). the version rolled back from is kept at $FAILED_DIR."
