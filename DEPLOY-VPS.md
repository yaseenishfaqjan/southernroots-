# Deploy to a VPS — one-command Docker stack

This runs the **entire platform** (API + frontend + Postgres + Redis) on any Linux
VPS with one command. Everything auto-restarts, so it never "drops" like the local
dev servers do.

## What you need
- A VPS (Ubuntu 22.04+) — e.g. Hetzner / DigitalOcean / Vultr (~$6–20/mo, 2GB+ RAM)
- A domain pointed at the VPS IP (an A record, e.g. `app.yourdomain.com`)

---

## Steps (≈15 minutes)

### 1. Install Docker on the VPS
```bash
ssh root@YOUR_VPS_IP
curl -fsSL https://get.docker.com | sh
```

### 2. Get the code + set your env
```bash
git clone <YOUR_REPO_URL> srt && cd srt
cp .env.production.example .env
nano .env          # fill in: domain, JWT_SECRET, POSTGRES_PASSWORD, OPENAI/MAPS/RESEND keys
```

### 3. Build & start everything (one command)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
This builds the API + frontend images, starts Postgres + Redis, runs the DB
migration, and serves the app on **port 80**.

### 4. Create your first owner account
```bash
docker compose -f docker-compose.prod.yml run --rm migrate \
  node --import tsx/esm artifacts/api-server/src/scripts/create-owner.ts \
  you@email.com 'StrongPass1!' "Your Name" "Your Company"
```

### 5. Add HTTPS (free SSL) — recommended
Easiest is Caddy as a reverse proxy, or use Cloudflare in front. Quick Caddy:
```bash
# point 'web' to listen on 8080 instead of 80 in docker-compose, then:
sudo apt install -y caddy
echo 'app.yourdomain.com { reverse_proxy localhost:8080 }' | sudo tee /etc/caddy/Caddyfile
sudo systemctl restart caddy
```
(Or simplest: put the site behind Cloudflare and enable "Flexible/Full" SSL.)

### 6. Done — visit it
```
http://YOUR_VPS_IP        (or https://app.yourdomain.com)
```
Sign in with the owner you created. Share the customer link `…/q/<org-slug>`
and crew links from the Workers page.

---

## Day-2 operations
```bash
docker compose -f docker-compose.prod.yml logs -f api     # view API logs
docker compose -f docker-compose.prod.yml up -d --build   # redeploy after code changes
docker compose -f docker-compose.prod.yml run --rm migrate \
  node lib/db/node_modules/.bin/drizzle-kit push --force \
  --dialect=postgresql --schema=lib/db/src/schema/index.ts \
  --url="$DATABASE_URL"                                    # apply schema changes
```

## Notes
- **Email:** keep `EMAIL_FROM` on your verified domain (`quotes@scalaro.io`) so the
  AI can email any customer.
- **First build** pulls images + installs deps — give it a few minutes.
- **Stripe:** leave the Stripe vars blank for the client test; add them later to take
  real payments (billing endpoints stay safely disabled until then).
- This is a single-VPS setup ideal for a pilot / client test. For scale, split the
  DB to a managed Postgres and run multiple API replicas behind a load balancer.
