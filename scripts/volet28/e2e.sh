#!/usr/bin/env bash
# E2E VOLET 28 — serveur standalone (PORT 3100) + sondes API audit + scraping.
set -u
mkdir -p /tmp/render
cd /home/z/my-project/SteveMarketing
export NODE_ENV=production
export PORT=3100
export ADMIN_PASSWORD="MotDePasseTest-Volet28"
export NEXT_PUBLIC_SITE_URL="https://stevensakpovi.vercel.app"
export PUPPETEER_EXECUTABLE_PATH="$HOME/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome"

bun .next/standalone/server.js > /tmp/render/serveur-3100.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT

code=000
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/ 2>/dev/null || echo 000)
  if [ "$code" = "200" ]; then break; fi
  sleep 0.5
done
echo "serveur prêt (code $code)"
if [ "$code" != "200" ]; then
  tail -20 /tmp/render/serveur-3100.log
  exit 1
fi

python3 /home/z/my-project/SteveMarketing/scripts/volet28/e2e-api.py
EXIT_API=$?
echo
echo "=== verdict API : $EXIT_API ==="
exit $EXIT_API
