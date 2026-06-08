# Deploy via Docker Hub (build once → push → pull on the VPS)

This is the "build images once, run anywhere" flow. You build 3 images, push them
to your Docker Hub, then the VPS just pulls and runs (no slow build on the server).

The 3 images:
- `srt-api` — the backend (self-contained bundle)
- `srt-web` — the frontend (nginx)
- `srt-migrate` — a one-off image with drizzle-kit to create the DB schema

---

## A) On your build machine (where Docker is)

```bash
cd <project root>
docker login                      # your Docker Hub account
export U=YOUR_DOCKERHUB_USERNAME

# Build the 3 images
docker build -f Dockerfile.api               -t $U/srt-api:latest .
docker build -f Dockerfile.api --target build -t $U/srt-migrate:latest .
docker build -f web-app/Dockerfile.prod      -t $U/srt-web:latest .

# Push them to Docker Hub
docker push $U/srt-api:latest
docker push $U/srt-migrate:latest
docker push $U/srt-web:latest
```

## B) On the VPS

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Get the compose file + env (clone the repo, or just scp these 2 files)
git clone <YOUR_REPO> srt && cd srt
cp .env.production.example .env
nano .env     # fill in: DOCKERHUB_USER, JWT_SECRET, POSTGRES_PASSWORD,
              #          domain (APP_URL/PUBLIC_APP_URL/CORS_ORIGINS),
              #          OPENAI/GOOGLE_MAPS/RESEND keys, EMAIL_FROM, OWNER_EMAIL

# Pull + run the whole stack
docker compose -f docker-compose.hub.yml up -d

# Create your first owner
docker compose -f docker-compose.hub.yml run --rm migrate \
  node --import tsx/esm artifacts/api-server/src/scripts/create-owner.ts \
  you@email.com 'StrongPass1!' "Your Name" "Your Company"
```

The app is now live on **port 80**. Point your domain's A-record at the VPS IP,
add HTTPS (Caddy or Cloudflare — see DEPLOY-VPS.md), and share the link with your client.

## Updating later
After code changes: rebuild + push the images (step A), then on the VPS:
```bash
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```
