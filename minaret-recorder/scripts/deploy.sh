#!/bin/bash
# =============================================================
# Minaret Recorder - Deploy / Update Script
# Run this each time you want to deploy or update on the VPS
# Usage: cd minaret-recorder && bash scripts/deploy.sh
# =============================================================

set -e

echo "========================================="
echo "  Minaret Recorder - Deploy"
echo "========================================="

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
  echo "Error: Run this from the minaret-recorder directory"
  exit 1
fi

# Check prerequisites
echo "[1/5] Checking prerequisites..."

if ! command -v node &> /dev/null; then
  echo "Error: Node.js not found. Run scripts/vps-setup.sh first."
  exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
  echo "Error: FFmpeg not found. Run scripts/vps-setup.sh first."
  exit 1
fi

if ! command -v pm2 &> /dev/null; then
  echo "Error: PM2 not found. Run: npm install -g pm2"
  exit 1
fi

# Check for required files
if [ ! -f ".env" ]; then
  echo "Error: .env file not found."
  echo "  cp .env.example .env"
  echo "  Then edit .env with your values."
  exit 1
fi



# Pull latest changes
echo "[2/5] Pulling latest changes..."
cd "$(git rev-parse --show-toplevel)" 2>/dev/null && git pull && cd - > /dev/null || echo "  Skipping git pull (not a git repo or no upstream)"

# Install dependencies
echo "[3/5] Installing dependencies..."
npm install --production=false

# Build TypeScript
echo "[4/5] Building..."
npm run build

# Restart with PM2
echo "[5/5] Restarting service..."
if pm2 describe minaret-recorder > /dev/null 2>&1; then
  pm2 restart minaret-recorder
  echo "  Service restarted."
else
  pm2 start dist/index.js --name "minaret-recorder" --cwd "$(pwd)"
  pm2 save
  echo "  Service started for the first time."
fi

echo ""
echo "========================================="
echo "  Deploy complete!"
echo "========================================="
echo ""
echo "Useful commands:"
echo "  pm2 logs minaret-recorder    - View logs"
echo "  pm2 status                   - Check status"
echo "  pm2 restart minaret-recorder - Restart"
echo "  pm2 stop minaret-recorder    - Stop"
echo ""

# Quick health check
sleep 2
PORT=$(grep -oP 'PORT=\K[0-9]+' .env 2>/dev/null || echo "3001")
echo "Health check:"
curl -s "http://localhost:${PORT}/health" 2>/dev/null && echo "" || echo "  Waiting for service to start..."
echo ""
