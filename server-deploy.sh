#!/bin/bash
set -e
echo "=== Pulling latest code ==="
cd /opt/SchweizerMakler
git pull origin master

echo "=== Installing dependencies ==="
cd webapp
npm install 2>&1 | tail -3

echo "=== Building ==="
source .env.local
DATABASE_URL="$DATABASE_URL" JWT_SECRET="$JWT_SECRET" npx next build 2>&1 | tail -5

echo "=== Restarting service ==="
systemctl restart maklertoolkit
sleep 3
systemctl status maklertoolkit --no-pager | head -5

echo ""
echo "=== Deploy fertig! ==="
echo "http://91.107.232.255"
