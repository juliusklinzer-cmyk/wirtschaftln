#!/usr/bin/env bash
# Staging deployen: lokalen Stand (z. B. Design-Experimente) nach
# /opt/wirtschaftln-staging schieben und dort bauen. Prod bleibt unberührt.
# Aufruf aus dem Repo-Root: ./deploy/staging-deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

rsync -az --delete --exclude node_modules --exclude .next --exclude 'app/data' \
  --exclude .git --exclude 'deploy/.env' ./ root@178.105.234.52:/opt/wirtschaftln-staging/

ssh root@178.105.234.52 "cd /opt/wirtschaftln-staging && docker compose -f docker-compose.staging.yml --env-file deploy/.env up -d --build"

echo "Staging deployt: https://staging.wirtschaftln.de"
