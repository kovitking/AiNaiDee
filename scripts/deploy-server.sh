#!/usr/bin/env bash
# Run this ON the deploy server, inside ~/apps/ainaidee — or trigger it from a
# dev machine with scripts/deploy.sh (reads DEPLOY_HOST/DEPLOY_USER; see that
# file for how to configure the target without committing it).
#
# Blue-green-ish swap, validated by hand on production 2026-08-02 (~23s
# downtime, every check passed):
#   1. fresh `git clone` into a staging directory — never touches the live one
#   2. build the image there
#   3. smoke-test the built image on an isolated port (18587), not the public one
#   4. only if that passes: swap the live directory for the staging one and
#      restart just the `app` container
# `caddy`/`ghost`/`ghost-db` are never touched — only `app` is targeted, so
# they keep running throughout. `.env` is copied into staging before building
# so build-time ARGs (SITE_URL, GHOST_URL, GHOST_CONTENT_API_KEY) bake right.
#
# Safe to keep this script inside the directory it swaps: on Linux, `mv`
# within the same filesystem renames in place, so a bash process already
# reading this file keeps its open file descriptor valid regardless of what
# path becomes "live" underneath it.
set -euo pipefail

REPO_URL="https://github.com/kovitking/AiNaiDee.git"
VERIFY_PORT=18587

APPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LIVE_DIR="$APPS_DIR/ainaidee"
STAGING_DIR="$APPS_DIR/ainaidee_staging"
BACKUP_DIR="$APPS_DIR/ainaidee_backup_$(date +%Y%m%d_%H%M%S)"

rm -rf "$STAGING_DIR"
git clone --quiet "$REPO_URL" "$STAGING_DIR"
cp "$LIVE_DIR/.env" "$STAGING_DIR/.env"

cd "$STAGING_DIR"
docker compose build app

docker rm -f ainaidee_verify >/dev/null 2>&1 || true
trap 'docker rm -f ainaidee_verify >/dev/null 2>&1 || true' EXIT
docker run --rm -d --name ainaidee_verify -p "$VERIFY_PORT:4321" ainaidee:latest
sleep 2

smoke_test_failed=0
curl -sf "http://127.0.0.1:$VERIFY_PORT/api/models" >/dev/null || smoke_test_failed=1
curl -sf -X POST "http://127.0.0.1:$VERIFY_PORT/api/compatibility" \
  -H 'content-type: application/json' \
  -d '{"hardware":{"ramGb":32,"gpu":{"name":"NVIDIA RTX 3060"}},"modelId":"llama3.1-8b"}' \
  >/dev/null || smoke_test_failed=1

if [ "$smoke_test_failed" -eq 1 ]; then
  echo "smoke test failed against the freshly built image — aborting, live site untouched" >&2
  exit 1
fi

docker rm -f ainaidee_verify >/dev/null 2>&1 || true
trap - EXIT

mv "$LIVE_DIR" "$BACKUP_DIR"
mv "$STAGING_DIR" "$LIVE_DIR"
cd "$LIVE_DIR"
docker compose up -d app
docker image prune -f

echo "deployed. previous version kept at $BACKUP_DIR — remove it once you're confident, or roll back with rollback-server.sh."
