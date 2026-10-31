#!/bin/bash
# ==============================================================
# CloudZones Grocery - Update Backend IP in Frontend
# Usage: ./update-backend-ip.sh http://<BACKEND_PUBLIC_IP>:5000
# ==============================================================

BACKEND_URL="$1"

if [ -z "$BACKEND_URL" ]; then
    echo "Error: Backend URL is required!"
    echo "Usage: ./update-backend-ip.sh http://<BACKEND_PUBLIC_IP>:5000"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$REPO_ROOT/cloudzones_mern_grocery_frontend-master"

cd "$FRONTEND_DIR" || exit 1

echo "Updating backend target to: $BACKEND_URL"
echo "REACT_APP_API_URL=$BACKEND_URL" > .env
cat .env

echo "Rebuilding frontend..."
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build

echo "Restarting frontend service..."
sudo pm2 restart cloudzones-frontend || sudo pm2 start "serve -s build -l 80" --name "cloudzones-frontend"
sudo pm2 save

echo "Backend IP successfully updated in Frontend!"
