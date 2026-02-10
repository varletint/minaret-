# Minaret Recorder

VPS recording service for Minaret - records Icecast live streams and uploads to Cloudflare R2 Storage.

> This service runs on a **separate VPS** (e.g. Kamatera) from the main Minaret API (Railway).
> It needs FFmpeg installed locally to process audio streams.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   Main API          │         │   Minaret Recorder   │
│   (Railway)         │────────►│   (Kamatera VPS)     │
│                     │◄────────│                      │
│   - Show CRUD       │callback │   - FFmpeg recording │
│   - Recording meta  │         │   - R2 upload        │
│   - Public API      │         │   - Chunk processing │
└─────────────────────┘         └──────────────────────┘
```

## Prerequisites

- Ubuntu/Debian VPS (e.g. Kamatera)
- Node.js 20+
- FFmpeg (`apt install ffmpeg`)
- Cloudflare account with R2 Storage enabled

## VPS Deployment

### First-time setup

1. **SSH into your VPS:**

   ```bash
   ssh root@your-vps-ip
   ```

2. **Run the setup script** (installs Node.js, FFmpeg, PM2, firewall):

   ```bash
   # Clone the repo
   git clone https://github.com/your-username/minaret-backend.git
   cd minaret-backend/minaret-recorder

   # Run one-time setup
   bash scripts/vps-setup.sh
   ```

3. **Set up Cloudflare R2:**

   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 Object Storage
   - Create a bucket (e.g. `minaret-recordings`)
   - Go to bucket **Settings** → **Public access** → enable **r2.dev subdomain**
   - Go to **R2 Overview** → **Manage R2 API Tokens** → **Create API Token**
     - Permissions: Object Read & Write
     - Scope: your bucket
   - Note down: **Account ID**, **Access Key ID**, **Secret Access Key**, and **Public URL**

4. **Configure environment:**

   ```bash
   cp .env.example .env
   nano .env  # Fill in your values
   ```

   | Variable               | Description                             |
   | ---------------------- | --------------------------------------- |
   | `PORT`                 | Server port (default: 3001)             |
   | `MAIN_API_URL`         | Your Railway API URL                    |
   | `MAIN_API_KEY`         | Shared secret (must match main API)     |
   | `ICECAST_HOST`         | Icecast server host (usually localhost) |
   | `ICECAST_PORT`         | Icecast server port (usually 8000)      |
   | `R2_ACCOUNT_ID`        | Cloudflare account ID                   |
   | `R2_ACCESS_KEY_ID`     | R2 API token access key ID              |
   | `R2_SECRET_ACCESS_KEY` | R2 API token secret access key          |
   | `R2_BUCKET_NAME`       | R2 bucket name                          |
   | `R2_PUBLIC_URL`        | R2 public bucket URL (r2.dev subdomain) |

5. **Deploy:**

   ```bash
   bash scripts/deploy.sh
   ```

### Updating (after code changes)

Just SSH in and run the deploy script again:

```bash
ssh root@your-vps-ip
cd minaret-backend/minaret-recorder
bash scripts/deploy.sh
```

The script will `git pull`, rebuild, and restart PM2 automatically.

## Local Development

```bash
npm install
npm run dev
```

## PM2 Commands

| Command                        | Description     |
| ------------------------------ | --------------- |
| `pm2 logs minaret-recorder`    | View logs       |
| `pm2 status`                   | Check status    |
| `pm2 restart minaret-recorder` | Restart service |
| `pm2 stop minaret-recorder`    | Stop service    |
| `pm2 delete minaret-recorder`  | Remove from PM2 |
| `pm2 monit`                    | Live monitoring |

## API Endpoints

| Endpoint               | Method | Description          |
| ---------------------- | ------ | -------------------- |
| `/health`              | GET    | Health check         |
| `/start`               | POST   | Start recording      |
| `/stop/:recordingId`   | POST   | Stop recording       |
| `/status/:recordingId` | GET    | Get recording status |

All endpoints (except `/health`) require `X-API-Key` header matching `MAIN_API_KEY`.

## How It Works

1. **Main API** (Railway) sends a `POST /start` request when a show begins
2. **Recorder** spawns FFmpeg to capture the Icecast stream
3. Audio is split into **30-minute chunks** (`.ts` segments)
4. Each chunk is **remuxed** (no re-encoding) to `.mp3` or `.m4a`
5. Chunks are **uploaded to Cloudflare R2** with public URLs
6. **Callbacks** are sent to the main API with chunk metadata
7. When recording stops, a final callback marks it as `ready`
