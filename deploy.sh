#!/usr/bin/env bash
set -euo pipefail

# ==== EDITUJ TADY ====
SERVER="kuba@72.62.149.19"
APP_DIR="/var/www/origio-app"
APP_NAME="origio-app"
PORT="3001"
# =====================

echo "🧱 Build (lokálně)…"
npm run build

echo "📁 Připravím cílové složky na serveru…"
ssh "$SERVER" "mkdir -p '$APP_DIR/standalone/.next' '$APP_DIR/standalone/public'"

# zdroj standalone
if [ -d ".next/standalone" ]; then
  STANDALONE_SRC=".next/standalone/"
elif [ -d "standalone" ]; then
  STANDALONE_SRC="standalone/"
else
  echo "❌ Nenalezeno .next/standalone ani standalone/. Spusť build a ověř output: 'standalone'."
  exit 1
fi

echo "🚚 Nahrávám standalone…"
rsync -az --delete "$STANDALONE_SRC" "$SERVER:$APP_DIR/standalone/"

# .next/static → standalone/.next/static
if [ -d ".next/static" ]; then
  echo "🚚 Nahrávám .next/static → standalone/.next/static…"
  rsync -az --delete ".next/static/" "$SERVER:$APP_DIR/standalone/.next/static/"
fi

# public → standalone/public
if [ -d "public" ]; then
  echo "🚚 Nahrávám public → standalone/public…"
  rsync -az --delete "public/" "$SERVER:$APP_DIR/standalone/public/"
fi

# .env(.production) → server
if [ -f ".env.production" ]; then
  echo "🔐 Nahrávám .env.production → .env…"
  rsync -az ".env.production" "$SERVER:$APP_DIR/.env"
elif [ -f ".env" ]; then
  echo "🔐 Nahrávám .env…"
  rsync -az ".env" "$SERVER:$APP_DIR/.env"
else
  echo "⚠️  Nenalezen .env ani .env.production – pokračuju bez env souboru."
fi

echo "🚀 Restart/Start PM2…"
ssh "$SERVER" "bash -lc '
  set -e

  # Načti NVM (kvůli node/npm/pm2 v PATH i přes non-interactive SSH)
  export NVM_DIR=\"\$HOME/.nvm\"
  if [ -s \"\$NVM_DIR/nvm.sh\" ]; then . \"\$NVM_DIR/nvm.sh\"; fi

  command -v node >/dev/null 2>&1 || { echo \"❌ Node není dostupný (NVM se nenačetlo)\"; exit 1; }
  command -v pm2  >/dev/null 2>&1 || { echo \"❌ PM2 není dostupný (nainstaluj: npm i -g pm2)\"; exit 1; }

  # zajistit PORT v .env
  if [ -f \"'$APP_DIR'/.env\" ]; then
    grep -q \"^PORT=\" \"'$APP_DIR'/.env\" || echo \"PORT='$PORT'\" >> \"'$APP_DIR'/.env\"
  else
    echo \"PORT='$PORT'\" > \"'$APP_DIR'/.env\"
  fi

  if pm2 describe \"'$APP_NAME'\" >/dev/null 2>&1; then
    pm2 restart \"'$APP_NAME'\" --update-env
  else
    cd \"'$APP_DIR'\"
    pm2 start \"'$APP_DIR'/standalone/server.js\" --name \"'$APP_NAME'\" --cwd \"'$APP_DIR'/standalone\" --env production
    pm2 save
  fi

  pm2 status \"'$APP_NAME'\"
'"

echo "✅ Hotovo. Nasazeno!"
