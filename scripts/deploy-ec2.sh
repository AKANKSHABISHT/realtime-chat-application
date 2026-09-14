#!/bin/bash
set -e

echo "==> Installing frontend dependencies..."
npm install

echo "==> Building frontend..."
npm run build

echo "==> Installing server dependencies..."
cd server && npm install && cd ..

echo "==> Restarting app with PM2..."
if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrRestart ecosystem.config.cjs
  pm2 save
  echo "==> Deployed. App running on port 3001"
else
  echo "PM2 not found. Install with: npm install -g pm2"
  echo "Then run: pm2 start ecosystem.config.cjs"
  exit 1
fi
