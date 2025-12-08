# MusicScan Video Render Worker

Een kleine Node.js microservice die video's rendert voor MusicScan.

## Architectuur

```
Supabase DB (render_jobs) → Worker polls → ffmpeg render → Upload to Storage → Update job
```

## Setup

### 1. Installeer dependencies

```bash
cd worker
npm install
```

### 2. Configureer environment

Maak `.env` file:

```env
SUPABASE_URL=https://ssxbpyqnjfiyubsuonar.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
WORKER_ID=worker-1
POLL_INTERVAL_MS=5000
```

### 3. Installeer ffmpeg

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Alpine (Docker)
apk add ffmpeg
```

### 4. Start de worker

```bash
npm start
```

## Deployment opties

### Hetzner CX11 (€4.50/maand)
1. Maak een CX11 server aan
2. SSH naar de server
3. Clone dit project
4. `npm install && npm start`
5. Gebruik PM2 voor process management: `pm2 start npm --name "render-worker" -- start`

### Fly.io (gratis tier)
```bash
flyctl launch
flyctl deploy
```

### Railway
1. Connect GitHub repo
2. Deploy vanuit `/worker` directory
3. Set environment variables

### Docker
```bash
docker build -t musicscan-worker .
docker run -d --env-file .env musicscan-worker
```

## Monitoring

De worker logt naar stdout:
- `[POLL]` - Checking for jobs
- `[CLAIM]` - Job claimed
- `[RENDER]` - Rendering video
- `[UPLOAD]` - Uploading to storage
- `[DONE]` - Job completed
- `[ERROR]` - Job failed

## Kosten

| Provider | Specs | Prijs |
|----------|-------|-------|
| Hetzner CX11 | 1 vCPU, 2GB RAM | €4.50/maand |
| Fly.io | 256MB RAM | Gratis |
| Railway | 512MB RAM | ~$5/maand |
| Render.com | 512MB RAM | Gratis tier |
