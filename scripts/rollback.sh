#!/usr/bin/env bash
# Run this from a dev machine to trigger a rollback over SSH. Optionally
# takes a specific backup directory path (as seen on the server) as $1;
# defaults to the most recent one. See scripts/deploy.sh for how
# DEPLOY_USER/DEPLOY_HOST are configured.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
[ -f "$SCRIPT_DIR/deploy.local.env" ] && source "$SCRIPT_DIR/deploy.local.env"

: "${DEPLOY_USER:?set DEPLOY_USER (env var, or scripts/deploy.local.env)}"
: "${DEPLOY_HOST:?set DEPLOY_HOST (env var, or scripts/deploy.local.env)}"

ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "bash ~/apps/ainaidee/scripts/rollback-server.sh $*"
