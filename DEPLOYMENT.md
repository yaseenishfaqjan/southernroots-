# Deployment & Launch Runbook

Two parts: **(A) test everything locally** before you touch a server, then **(B) deploy to a VPS**.

---

## A. Test locally (do this first)

The local stack is already wired. One command brings it all up on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\dev-up.ps1
```

That starts Postgres (`srt_pg`, port 5433) + Redis (`srt_redis`, port 6380), pushes the
schema, seeds an owner, and starts the API on **http://localhost:3001**.

> On this machine ports 5432/6379 are taken by another project, so we use 5433/6380.
> On a clean VPS the standard 5432/6379 are free — see Part B.

### 1. Run the owner dashboard
```bash
pnpm --filter @workspace/web-app run dev      # http://localhost:5173
```
Open it and click through:
- **Sign up** → creates an org on a 14-day trial → lands in the dashboard
- **Customers / Leads** → submit a lead → a quote appears (AI-priced)
- **Billing** → shows your plan + trial; "Choose plan" says "not configured" until Stripe keys are set
- **Log out / log back in**

### 2. Test the API directly
```bash
curl http://localhost:3001/api/healthz                       # {"status":"ok"}
# signup
curl -X POST http://localhost:3001/api/auth/signup -H "Content-Type: application/json" \
  -d '{"orgName":"Test Co","name":"You","email":"you@test.com","password":"password123"}'
```

### 3. Test the real AI / integrations (optional but recommended before launch)
Add real keys to `.env`, then restart the API. With keys present:
- `OPENAI_API_KEY` + `GOOGLE_MAPS_API_KEY` → quotes use **real satellite + vision** measurement (instead of the fallback that flags `needs_review`)
- `RESEND_API_KEY` → signup verification + password-reset emails actually send
- `TWILIO_*` → quote/invoice SMS send
- `STRIPE_SECRET_KEY` + `STRIPE_PRICE_*` → the Billing page can start a real checkout

### 4. Test the production build locally (proves the artifacts a server will run)
```bash
# API: bundle, then run the bundle (not the dev runner)
node artifacts/api-server/build.mjs
node --env-file=.env --enable-source-maps artifacts/api-server/dist/index.mjs

# Dashboard: build static files
cd web-app && ./node_modules/.bin/vite build      # outputs web-app/dist/
```
If `dist/index.mjs` runs and serves `/api/healthz`, and `web-app/dist/index.html` exists,
the server build is good.

### Pre-deploy checklist
- [ ] Signup → dashboard works
- [ ] Lead → quote works
- [ ] Login / logout / password reset work
- [ ] (with keys) real quote, email, SMS, Stripe checkout work
- [ ] `node build.mjs` + `vite build` both succeed

---

## B. Deploy to a VPS (Ubuntu example)

> ⚠️ **Build note:** do NOT run the root `pnpm build` — it runs a typecheck that fails on
> pre-existing api-server type noise. Build **per package** (`build.mjs` + `vite build`),
> which skip the typecheck and work (verified). Runtime is unaffected.

### 1. Provision
```bash
# On a fresh Ubuntu 22.04+ VPS
sudo apt update && sudo apt install -y curl git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm i -g pnpm@9
# Docker (for Postgres + Redis) — or use a managed DB instead
curl -fsSL https://get.docker.com | sh
```

### 2. Get the code + dependencies
```bash
git clone <your-repo> srt && cd srt
pnpm install            # pulls the linux-x64 native binaries automatically
```

### 3. Infrastructure (Postgres + Redis)
On a clean VPS the standard ports are free, so the bundled compose works as-is:
```bash
docker compose up -d    # Postgres :5432, Redis :6379 (see docker-compose.yml)
```
(Or point `DATABASE_URL`/`REDIS_URL` at a managed Postgres/Redis instead.)

### 4. Configure `.env` (production)
```ini
NODE_ENV=production
PORT=3001
APP_URL=https://app.yourdomain.com
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/southern_roots
REDIS_URL=redis://localhost:6379
JWT_SECRET=<64 random hex chars>          # openssl rand -hex 32
CORS_ORIGINS=https://app.yourdomain.com
# Real keys:
OPENAI_API_KEY=...
GOOGLE_MAPS_API_KEY=...
RESEND_API_KEY=...
TWILIO_ACCOUNT_SID=...  TWILIO_AUTH_TOKEN=...  TWILIO_PHONE_NUMBER=...
STRIPE_SECRET_KEY=...   STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_STARTER=price_...  STRIPE_PRICE_GROWTH=price_...  STRIPE_PRICE_ENTERPRISE=price_...
```
> In production the Stripe and Twilio webhooks **fail closed** — you MUST set
> `STRIPE_WEBHOOK_SECRET` and `TWILIO_AUTH_TOKEN` or those endpoints return 500.

### 5. Create the database schema + first owner
```bash
pnpm --filter @workspace/db run push                         # creates all tables
node --env-file=.env --import tsx/esm \
  artifacts/api-server/src/scripts/create-owner.ts you@you.com 'StrongPass1!' "You" "Your Company"
```

### 6. Build + run the API (keep it alive)
```bash
node artifacts/api-server/build.mjs                           # -> dist/index.mjs
sudo npm i -g pm2
pm2 start "node --enable-source-maps dist/index.mjs" --name srt-api \
  --cwd artifacts/api-server --node-args="--env-file=../../.env"
pm2 save && pm2 startup                                       # restart on reboot
```

### 7. Build + serve the dashboard
```bash
cd web-app && ./node_modules/.bin/vite build                 # -> web-app/dist
```
Serve the static `dist/` via nginx and proxy `/api` to the node process (same origin →
the dashboard's relative `/api` calls work with no CORS headaches):

```nginx
server {
  server_name app.yourdomain.com;
  root /var/www/srt/web-app/dist;
  index index.html;

  location /api/ { proxy_pass http://127.0.0.1:3001; proxy_set_header Host $host; }
  location /     { try_files $uri /index.html; }   # SPA fallback
}
```

### 8. TLS + DNS
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.yourdomain.com          # auto HTTPS
```
Point an A record for `app.yourdomain.com` at the VPS IP.

### 9. Wire the webhooks (in the provider dashboards)
- **Stripe** → Developers → Webhooks → `https://app.yourdomain.com/api/webhook/stripe`
  Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.paid`, `payment_intent.payment_failed`. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
- **Twilio** → your number → Messaging → "A message comes in" →
  `https://app.yourdomain.com/api/webhook/sms` (HTTP POST).

### 10. Production smoke test
```bash
curl https://app.yourdomain.com/api/healthz          # {"status":"ok"}
```
Then in a browser: sign up → submit a lead → confirm a quote appears → open Billing →
start a Stripe test checkout → confirm the org's plan updates after payment.

---

## Notes / current gaps before "full" GA
- **Owner dashboard** is the launch surface. The **client & worker portals** are locked
  (they need their own login) — wire those before inviting customers/crews.
- Each tenant currently shares the platform's Twilio/Stripe for *their* customers; true
  per-tenant messaging/payments (Stripe Connect, per-org Twilio numbers) is a follow-up.
- For ongoing schema changes prefer versioned migrations (`drizzle-kit generate` +
  `migrate`) over `push`.
- Add rate limiting and off-`.env` secrets management before heavy traffic.
