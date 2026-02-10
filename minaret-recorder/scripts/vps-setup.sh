#!/bin/bash
# =============================================================
# Minaret Recorder - VPS Initial Setup Script
# Run this ONCE on a fresh Ubuntu/Debian VPS
# Usage: bash scripts/vps-setup.sh
# =============================================================

set -e

echo "========================================="
echo "  Minaret Recorder - VPS Setup"
echo "========================================="

# Update system
echo "[1/6] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Git
echo "[2/6] Installing Git..."
if ! command -v git &> /dev/null; then
  sudo apt install -y git
else
  echo "  Git already installed: $(git --version)"
fi

# Install Node.js 20 via NodeSource
echo "[3/6] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "  Node.js already installed: $(node -v)"
fi

# Install FFmpeg
echo "[4/6] Installing FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
  sudo apt install -y ffmpeg
else
  echo "  FFmpeg already installed: $(ffmpeg -version | head -1)"
fi

# Install PM2
echo "[5/6] Installing PM2..."
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
  pm2 startup systemd -u $USER --hp $HOME
else
  echo "  PM2 already installed: $(pm2 -v)"
fi

# Setup firewall (allow SSH + recorder port)
echo "[6/6] Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 3001/tcp
echo "y" | sudo ufw enable 2>/dev/null || true

echo ""
echo "========================================="
echo "  Setup complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Clone your repo:  git clone <your-repo-url>"
echo "  2. cd minaret-backend/minaret-recorder"
echo "  3. Run:  bash scripts/deploy.sh"
echo ""
