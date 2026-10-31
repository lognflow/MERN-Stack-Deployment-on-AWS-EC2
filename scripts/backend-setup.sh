#!/bin/bash
# ==============================================================
# CloudZones Grocery Backend - Auto Setup Script for AWS EC2
# Compatible with: Amazon Linux 2023 (dnf) & Ubuntu 22.04/24.04 (apt)
# ==============================================================

echo "=================================================="
echo " Starting Backend Deployment on AWS EC2...        "
echo "=================================================="

# Detect Package Manager
if command -v dnf &> /dev/null; then
    echo "[1/5] Detected Amazon Linux 2023 (dnf). Updating packages..."
    sudo dnf update -y
    sudo dnf install -y git
    # Install Node.js 18/20 on Amazon Linux
    sudo dnf install -y nodejs npm
elif command -v apt-get &> /dev/null; then
    echo "[1/5] Detected Ubuntu (apt). Updating packages..."
    sudo apt-get update -y
    sudo apt-get install -y git curl
    # Install Node.js 18 on Ubuntu
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Unknown OS package manager, continuing with existing node..."
fi

echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"

# Optional MongoDB Installation
echo "[2/5] Setting up MongoDB..."
if command -v apt-get &> /dev/null; then
    sudo apt-get install -y mongodb-org || sudo apt-get install -y mongodb || true
    sudo systemctl start mongod || sudo systemctl start mongodb || true
    sudo systemctl enable mongod || sudo systemctl enable mongodb || true
fi

# Locate backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$REPO_ROOT/cloudzones_mern_grocery_backend-master/cloudzones_mern_grocery_backend-master/cloudzones-grocery/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "Backend directory not found at $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR" || exit 1
echo "[3/5] Installing backend npm packages in $BACKEND_DIR..."
npm install

echo "[4/5] Installing PM2 process manager..."
sudo npm install -g pm2

# Stop any previous backend instance
pm2 delete cloudzones-backend 2>/dev/null || true

echo "[5/5] Starting CloudZones Backend on Port 5000..."
PORT=5000 pm2 start server.js --name "cloudzones-backend"
pm2 save

echo ""
echo "=================================================="
echo " Backend Successfully Deployed and Running!       "
echo " Testing API health locally...                    "
echo "=================================================="
sleep 2
curl -s http://localhost:5000/products | head -c 120
echo ""
echo ""
echo "To test from your browser, open:"
echo "http://<YOUR_EC2_BACKEND_PUBLIC_IP>:5000/products"
echo "=================================================="
