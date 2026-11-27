#!/usr/bin/env bash
# VOLET 24 — serveur standalone (PORT 3100) + sonde, MÊME invocation
# shell (le sandbox tue tout processus enfant à la fin d'une commande).
set -e
cd /home/z/my-project/SteveMarketing
export NODE_ENV=production
export PORT=3100
export ADMIN_PASSWORD="MotDePasseTest-Volet24"
export NEXT_PUBLIC_SITE_URL="https://stevensakpovi.vercel.app"
if [ -n "$GITHUB_DOCS_TOKEN" ]; then
  export GITHUB_DOCS_TOKEN
  export GITHUB_DOCS_REPO="STEVECROWN01/SteveMarketing-Documents"
fi
node .next/standalone/server.js > /tmp/render/serveur-3100.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT
sleep 4
node scripts/sonde-volet24.js
EXIT=$?
exit $EXIT
