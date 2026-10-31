#!/bin/bash
# ==============================================================
# CloudZones Grocery Frontend - Auto Setup Script for AWS EC2
# Usage: ./frontend-setup.sh [http://<BACKEND_PUBLIC_IP>:5000]
# Compatible with: Amazon Linux 2023 (dnf) & Ubuntu 22.04/24.04 (apt)
# ==============================================================

BACKEND_URL="$1"

if [ -z "$BACKEND_URL" ]; then
    echo "Notice: No backend URL passed. Defaulting to local backend."
    echo "Usage: ./frontend-setup.sh http://<BACKEND_PUBLIC_IP>:5000"
    BACKEND_URL="http://localhost:5000"
fi

echo "=================================================="
echo " Starting Frontend Deployment on AWS EC2...       "
echo " Backend Target: $BACKEND_URL                     "
echo "=================================================="

# Detect Package Manager
if command -v dnf &> /dev/null; then
    echo "[1/5] Detected Amazon Linux 2023 (dnf). Updating packages..."
    sudo dnf update -y
    sudo dnf install -y git
    sudo dnf install -y nodejs npm
elif command -v apt-get &> /dev/null; then
    echo "[1/5] Detected Ubuntu (apt). Updating packages..."
    sudo apt-get update -y
    sudo apt-get install -y git curl
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"

# Locate frontend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$REPO_ROOT/cloudzones_mern_grocery_frontend-master"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR" || exit 1

echo "[2/5] Setting backend connection in .env..."
echo "REACT_APP_API_URL=$BACKEND_URL" > .env
cat .env

echo "[3/5] Installing frontend dependencies..."
npm install

echo "[4/5] Building production React bundle..."
# Allocate 2GB memory for node build on micro instances if needed
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build

echo "[5/5] Serving frontend on Port 80 with PM2..."
sudo npm install -g pm2 serve

# Stop previous frontend instance if running
pm2 delete cloudzones-frontend 2>/dev/null || true

# Serve build folder on port 80 (HTTP) and port 3000
sudo pm2 start "serve -s build -l 80" --name "cloudzones-frontend"
pm2 save

echo ""
echo "=================================================="
echo " Frontend Successfully Deployed!                  "
echo " You can now visit your website at:               "
echo " http://<YOUR_EC2_FRONTEND_PUBLIC_IP>             "
echo "=================================================="
