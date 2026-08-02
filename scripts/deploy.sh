#!/usr/bin/env bash
# Run this from a dev machine to trigger a deploy over SSH.
#
# Needs DEPLOY_USER and DEPLOY_HOST. Either export them yourself, or copy
# scripts/deploy.local.env.example to scripts/deploy.local.env (gitignored)
# and fill in the real values there — this script sources it automatically
# if present. Never hardcode the real host/user in a committed script: this
# repo is public, and a leaked internal IP already cost a full git-history
# rewrite once (see docs/STATUS.md, "แก้ IP leak แล้ว").
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
[ -f "$SCRIPT_DIR/deploy.local.env" ] && source "$SCRIPT_DIR/deploy.local.env"

: "${DEPLOY_USER:?set DEPLOY_USER (env var, or scripts/deploy.local.env)}"
: "${DEPLOY_HOST:?set DEPLOY_HOST (env var, or scripts/deploy.local.env)}"

ssh "${DEPLOY_USER}@${DEPLOY_HOST}" 'bash ~/apps/ainaidee/scripts/deploy-server.sh'
