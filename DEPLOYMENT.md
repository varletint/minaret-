# Minaret Backend - Hetzner Deployment Guide

Complete guide to deploy Minaret radio backend on Hetzner Cloud CX22 (€3.29/month).

---

## 1. Create Hetzner Server

1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud)
2. Create new project → Add Server
3. Settings:
   - **Location**: Falkenstein (EU) or Ashburn (US)
   - **Image**: Ubuntu 22.04
   - **Type**: CX22 (2 vCPU, 4GB RAM, 40GB, 20TB traffic)
   - **SSH Key**: Add your public key
4. Note your server IP: `YOUR_SERVER_IP`

---

## 2. Initial Server Setup

```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Create deploy user
adduser deploy
usermod -aG sudo deploy

# Setup SSH for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Setup firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Switch to deploy user
su - deploy
```

---

## 3. Install Dependencies

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be v20.x
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Icecast
sudo apt install -y icecast2
# When prompted: Configure Icecast? → Yes
# Hostname: stream.minaret.fm
# Source password: YOUR_SOURCE_PASSWORD
# Relay password: YOUR_RELAY_PASSWORD
# Admin password: YOUR_ADMIN_PASSWORD

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

---

## 4. Configure Domain DNS

Add these DNS records (at your registrar or Cloudflare):

| Type | Name   | Value          | TTL  |
| ---- | ------ | -------------- | ---- |
| A    | @      | YOUR_SERVER_IP | Auto |
| A    | api    | YOUR_SERVER_IP | Auto |
| A    | stream | YOUR_SERVER_IP | Auto |
| A    | www    | YOUR_SERVER_IP | Auto |

Wait for DNS propagation (5-30 minutes).

---

## 5. Deploy Application

```bash
# Create directories
mkdir -p ~/minaret-backend ~/logs

# Clone repository (or upload via scp)
cd ~
git clone https://github.com/YOUR_USERNAME/minaret-backend.git

# Install dependencies
cd minaret-backend
npm install

# Create production build
npm run build

# Create .env file
cp .env.example .env
nano .env  # Edit with production values
```

### Production .env

```env
PORT=3000
NODE_ENV=production

MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/minaret?retryWrites=true&w=majority

JWT_SECRET=your-production-secret-key-change-this
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

ICECAST_HOST=127.0.0.1
ICECAST_PORT=8000
ICECAST_ADMIN_USER=admin
ICECAST_ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
```

---

## 6. Configure Icecast

```bash
# Backup default config
sudo cp /etc/icecast2/icecast.xml /etc/icecast2/icecast.xml.bak

# Copy our config
sudo cp ~/minaret-backend/deployment/icecast.xml /etc/icecast2/icecast.xml

# Edit passwords (IMPORTANT!)
sudo nano /etc/icecast2/icecast.xml
# Change: CHANGE_THIS_ADMIN_PASSWORD
# Change: CHANGE_THIS_SOURCE_PASSWORD

# Enable and start Icecast
sudo systemctl enable icecast2
sudo systemctl start icecast2
sudo systemctl status icecast2
```

---

## 7. Configure Nginx

```bash
# Copy nginx config
sudo cp ~/minaret-backend/deployment/nginx.conf /etc/nginx/sites-available/minaret

# Create symlink
sudo ln -s /etc/nginx/sites-available/minaret /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

---

## 8. Get SSL Certificates

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Get certificates for all domains
sudo certbot certonly --standalone \
  -d minaret.fm \
  -d www.minaret.fm \
  -d api.minaret.fm \
  -d stream.minaret.fm

# Start Nginx
sudo systemctl start nginx

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 9. Start Application with PM2

```bash
cd ~/minaret-backend

# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs!

# Check status
pm2 status
pm2 logs minaret-api
```

---

## 10. Verify Deployment

```bash
# Test API locally
curl http://localhost:3000/api/v1/health

# Test via Nginx
curl https://api.minaret.fm/api/v1/health

# Test Icecast
curl http://localhost:8000/status.xsl
```

---

## 11. Configure Cloudflare (Optional but Recommended)

1. Add your domain to Cloudflare
2. Update DNS records (Cloudflare will provide nameservers)
3. Enable:
   - **SSL/TLS**: Full (strict)
   - **Always Use HTTPS**: On
   - **Auto Minify**: JavaScript, CSS, HTML
4. Page Rules for stream:
   - URL: `stream.minaret.fm/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 10 seconds

---

## 12. Broadcasting with Larix

1. Download **Larix Broadcaster** (iOS/Android)
2. Settings → Connections → Add:
   - **URL**: `icecast://stream.minaret.fm:8000/live`
   - **Username**: `source`
   - **Password**: Your source password
3. Audio Settings:
   - **Bitrate**: 128 kbps
   - **Sample Rate**: 44100 Hz
4. Start broadcasting!

---

## Useful Commands

```bash
# View API logs
pm2 logs minaret-api

# Restart API
pm2 restart minaret-api

# Reload without downtime
pm2 reload minaret-api

# View Icecast logs
sudo tail -f /var/log/icecast2/error.log

# Restart Icecast
sudo systemctl restart icecast2

# Restart Nginx
sudo systemctl restart nginx

# Check server resources
htop

# Check disk space
df -h
```

---

## Troubleshooting

| Issue              | Solution                                                |
| ------------------ | ------------------------------------------------------- |
| API not responding | `pm2 restart minaret-api`                               |
| 502 Bad Gateway    | Check if PM2 is running: `pm2 status`                   |
| Stream not working | Check Icecast: `sudo systemctl status icecast2`         |
| SSL error          | Renew certs: `sudo certbot renew`                       |
| MongoDB connection | Check .env MONGODB_URI and whitelist server IP in Atlas |

---

## Monthly Cost

| Item                 | Cost                |
| -------------------- | ------------------- |
| Hetzner CX22         | €3.29               |
| Domain (.fm)         | ~€8/year = €0.67/mo |
| MongoDB Atlas (free) | €0                  |
| Cloudflare (free)    | €0                  |
| **Total**            | **~€4/month**       |
