# Minaret Backend - GCP Staging Deployment

Google Cloud Platform staging environment using $300 free credit.

---

## 1. Create GCP Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project → Name: `minaret-staging`
3. Enable billing (attach $300 trial credit)
4. Enable APIs: Compute Engine, Cloud Storage

---

## 2. Create VM Instance

```bash
# Using gcloud CLI (or use Console UI)
gcloud compute instances create minaret-staging \
  --project=minaret-staging \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server
```

**Specs (e2-medium):**

- 2 vCPU, 4GB RAM
- ~$25/month
- Good for testing with 50-100 listeners

---

## 3. Configure Firewall

```bash
# Allow HTTP/HTTPS
gcloud compute firewall-rules create allow-web \
  --allow=tcp:80,tcp:443 \
  --target-tags=http-server,https-server

# Allow Icecast (optional, if not proxying through Nginx)
gcloud compute firewall-rules create allow-icecast \
  --allow=tcp:8000 \
  --target-tags=http-server
```

---

## 4. SSH and Initial Setup

```bash
# SSH via gcloud
gcloud compute ssh minaret-staging --zone=us-central1-a

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2, Nginx, Icecast
sudo npm install -g pm2
sudo apt install -y nginx icecast2

# Create deploy directory
mkdir -p ~/minaret-backend ~/logs
```

---

## 5. Deploy Application

```bash
# Clone your repo
git clone https://github.com/varletint/minaret-.git ~/minaret-backend
cd ~/minaret-backend

# Install and build
npm install
npm run build

# Create .env
cp .env.example .env
nano .env
```

### Staging .env

```env
PORT=3000
NODE_ENV=staging

MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/minaret-staging

JWT_SECRET=staging-secret-change-this
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

ICECAST_HOST=127.0.0.1
ICECAST_PORT=8000
```

---

## 6. Configure Nginx (Staging)

```bash
sudo nano /etc/nginx/sites-available/minaret
```

```nginx
server {
    listen 80;
    server_name YOUR_GCP_IP;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /stream {
        proxy_pass http://127.0.0.1:8000;
        proxy_buffering off;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/minaret /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. Configure Icecast

```bash
sudo nano /etc/icecast2/icecast.xml
```

Change these values:

- `<admin-password>`: Your admin password
- `<source-password>`: Your source password
- `<hostname>`: Your GCP IP or domain

```bash
sudo systemctl enable icecast2
sudo systemctl start icecast2
```

---

## 8. Start with PM2

```bash
cd ~/minaret-backend
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Run the command it outputs
```

---

## 9. Verify

```bash
# API
curl http://localhost:3000/api/v1/health

# Icecast
curl http://localhost:8000/status.xsl
```

---

## 10. Optional: Cloud Storage for Recordings

```bash
# Create bucket
gsutil mb gs://minaret-recordings-staging

# Upload recording
gsutil cp recording.mp3 gs://minaret-recordings-staging/

# Make public (optional)
gsutil iam ch allUsers:objectViewer gs://minaret-recordings-staging
```

---

## Cost Estimate (50 listeners, 2.5 hrs/day)

| Item            | Monthly  |
| --------------- | -------- |
| e2-medium VM    | $25      |
| Egress (216 GB) | $26      |
| Storage (50 GB) | $1       |
| **Total**       | **~$52** |

**$300 credit → ~5-6 months of staging**

---

## Staging vs Production

|           | GCP (Staging)     | Hetzner (Production)       |
| --------- | ----------------- | -------------------------- |
| Purpose   | Testing           | Live users                 |
| Cost      | ~$52/mo (credit)  | €3.29/mo                   |
| Bandwidth | Pay per GB        | 20 TB included             |
| SSL       | Self-signed or IP | Cloudflare + Let's Encrypt |
