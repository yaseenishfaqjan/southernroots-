# Southern Roots Turf — Autonomous AI Lawn Care Platform

A complete, production-ready autonomous business system. Every lead, quote, dispatch, invoice,
and follow-up is handled by AI agents — zero human input required for standard operations.

---

## What's Built

| Layer | Description |
|---|---|
| **API Server** (`artifacts/api-server`) | Express 5 + TypeScript. 30+ routes. All business logic. |
| **Owner Dashboard** (`web-app`) | React + Vite. 8 pages. Real-time KPIs, charts, dispatch board. |
| **Client Portal** (`artifacts/client-portal`) | Customer self-service: track jobs, pay invoices, request service. |
| **Worker Portal** (`artifacts/worker-portal`) | Mobile-first crew app: view jobs, update status, track earnings. |
| **Database** (`lib/db`) | PostgreSQL + Drizzle ORM. 13 tables fully typed. |

## The 7 AI Agents (run autonomously)

| Agent | Schedule | What it does |
|---|---|---|
| **Quote Agent** | On every lead | GPT-4o analyzes property → Claude writes SMS → PDF emailed |
| **Dispatch Agent** | 6 AM daily | GPT-4o assigns workers to jobs, optimizes routes, sends SMS |
| **Communication Agent** | Every inbound SMS | GPT-4o reads customer texts, takes actions, replies <160 chars |
| **Billing Agent** | After job complete + 9 AM daily | Auto-invoices, Stripe links, 4-step overdue reminder ladder |
| **Briefing Agent** | 7 AM daily | GPT-4o KPI summary → email + SMS to owner |
| **Upsell Agent** | Sunday 8 AM | Claude writes personalized upsell SMS to top 20 opportunities |
| **Churn Agent** | Monday 8 AM | Scores every customer 0-1, Claude writes win-back SMS for high-risk |

---

## Quick Start

### 1. Prerequisites

```bash
node --version   # Must be 20+
npm install -g pnpm@9
docker --version # Must be installed
```

### 2. Start infrastructure

```bash
docker-compose up -d
# PostgreSQL on :5432, Redis on :6379
```

### 3. Set up environment

```bash
cp .env.example .env
# Edit .env — add your API keys (see "API Keys You Need" below)
```

### 4. Install dependencies

```bash
pnpm install
```

### 5. Push database schema

```bash
pnpm --filter @workspace/db run push
```

### 6. Start all services (4 terminals)

```bash
# Terminal 1 — API Server (port 3001)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Owner Dashboard (port 5173)
pnpm --filter @workspace/web-app run dev

# Terminal 3 — Client Portal (port 5174)
pnpm --filter @workspace/client-portal run dev

# Terminal 4 — Worker Portal (port 5175)
pnpm --filter @workspace/worker-portal run dev
```

### 7. Verify everything is working

```
http://localhost:3001/api/healthz     → {"ok":true}
http://localhost:5173                  → Owner Dashboard
http://localhost:5174                  → Client Portal
http://localhost:5175                  → Worker Portal
```

---

## API Keys You Need (Manual Steps)

These require accounts. Everything else is code — only these need your manual setup.

### Required for core functionality

| Key | Where to get it | Cost |
|---|---|---|
| `OPENAI_API_KEY` | platform.openai.com | ~$0.01–0.05/request |
| `ANTHROPIC_API_KEY` | console.anthropic.com | ~$0.003–0.015/request |
| `DATABASE_URL` | Set automatically if using docker-compose | Free locally |
| `REDIS_URL` | Set automatically if using docker-compose | Free locally |

### Required for SMS (Twilio)

1. Sign up at twilio.com
2. Get a phone number (~$1.15/mo)
3. Copy: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
4. Configure webhook: Phone Numbers → Your number → Messaging → "A message comes in" → `https://yourapp.com/api/webhook/sms` (HTTP POST)

### Required for Email (Resend)

1. Sign up at resend.com (3,000 emails/month free)
2. Copy: `RESEND_API_KEY`

### Required for Payments (Stripe)

1. Sign up at stripe.com
2. Copy: `STRIPE_SECRET_KEY` (use test key `sk_test_...` for development)
3. Configure webhook: Developers → Webhooks → Add endpoint → `https://yourapp.com/api/webhook/stripe`
   Events: `invoice.paid`, `payment_intent.payment_failed`
4. Copy: `STRIPE_WEBHOOK_SECRET`

### Required for Maps (Google)

1. Go to console.cloud.google.com
2. Enable: Maps JavaScript API, Directions API, Geocoding API
3. Copy: `GOOGLE_MAPS_API_KEY`

### Owner contact info

Set in `.env`:
```
OWNER_PHONE_NUMBER=+1xxxxxxxxxx   # Your mobile number for daily briefings
OWNER_EMAIL=you@email.com         # Your email for daily briefings
APP_URL=https://yourapp.com       # Your deployed URL (use localhost:3001 for dev)
```

---

## Deployment (Railway — cheapest option, ~$20/mo)

1. Push to GitHub
2. Create account at railway.app
3. New project → Deploy from GitHub
4. Add PostgreSQL service + Redis service
5. Set all env vars from `.env.example`
6. Deploy — Railway auto-builds and runs

For custom domain: railway.app → Settings → Domains

---

## Database Schema

13 tables:
`customers` · `properties` · `quotes` · `jobs` · `workers` · `assignments` ·
`invoices` · `escalations` · `conversations` · `ai_decisions` · `agent_tasks` ·
`kpi_snapshots` · `notifications`

Push changes: `pnpm --filter @workspace/db run push`

---

## Typecheck entire monorepo

```bash
pnpm run typecheck
```

---

## Architecture

```
Client SMS/Email
    ↓
Twilio Webhook → Communication Agent (GPT-4o) → Reply SMS + DB actions
    
Quote Form → POST /api/leads → BullMQ → Quote Agent → SMS + Email + PDF

6 AM Cron → Dispatch Agent (GPT-4o) → Worker assignments + SMS routes

7 AM Cron → Briefing Agent → Daily summary email/SMS to owner

9 AM Cron → Billing Agent → Payment reminders + Stripe links

Sunday 8 AM → Upsell Agent (Claude) → Personalized upsell SMS × 20

Monday 8 AM → Churn Agent → Risk scoring + win-back SMS
```

---

*Built with: pnpm workspaces · TypeScript 5.9 · React 18 · Express 5 · PostgreSQL 16 · Drizzle ORM · GPT-4o · Claude 3.5 · BullMQ · Stripe · Twilio · Resend*
