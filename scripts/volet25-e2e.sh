#!/usr/bin/env bash
# E2E 28/11 — serveur standalone (PORT 3100) + sondes API et UI.
# Le sandbox tue tout processus enfant à la fin d'une commande : le
# serveur, les sondes et l'arrêt vivent dans la MÊME invocation.
set -u
cd /home/z/my-project/SteveMarketing
export NODE_ENV=production
export PORT=3100
export ADMIN_PASSWORD="MotDePasseTest-Volet25"
export NEXT_PUBLIC_SITE_URL="https://stevensakpovi.vercel.app"
export GITHUB_DOCS_TOKEN="${GITHUB_DOCS_TOKEN:?token requis}"
export GITHUB_DOCS_REPO="STEVECROWN01/SteveMarketing-Documents"
export PUPPETEER_EXECUTABLE_PATH="$HOME/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome"

bun .next/standalone/server.js > /tmp/render/serveur-3100.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT

# attendre que le serveur réponde (30 s max)
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/ 2>/dev/null || echo 000)
  if [ "$code" = "200" ]; then break; fi
  sleep 0.5
done
echo "serveur prêt (code $code)"

cd /home/z/my-project/scripts/verif-portfolio
python3 e2e-28-11.py
EXIT_API=$?
echo
NODE_PATH=/home/z/.npm-global/lib/node_modules node e2e-28-11.js
EXIT_UI=$?

echo
echo "=== verdict : API $EXIT_API · UI $EXIT_UI ==="
[ "$EXIT_API" = "0" ] && [ "$EXIT_UI" = "0" ]
