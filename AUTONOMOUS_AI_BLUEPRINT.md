# Southern Roots Turf — Complete Autonomous AI Business Blueprint
## From Demo to Billion-Dollar Agentic System

---

## WHAT YOU HAVE RIGHT NOW (The Demo)

This ZIP contains a fully working **5-app monorepo** built on:
- pnpm workspaces (monorepo)
- React + Vite (all frontends)
- Express 5 + Node.js 24 (API server)
- PostgreSQL + Drizzle ORM (database)
- TypeScript 5.9 end-to-end
- Tailwind CSS + shadcn/ui (design system)
- Framer Motion (animations)
- Recharts + Leaflet (data viz + maps)

The 5 apps: **Main Marketing Site · AI Quote System · Client Portal · Worker Portal · Dispatch Portal**

---

## PART 1 — FULL TECHNOLOGY STACK

### Frontend Stack
```
React 18+              — UI framework
Vite 5                 — Build tool (fast HMR, production bundler)
TypeScript 5.9         — Type safety across all apps
Tailwind CSS 3         — Utility-first styling
shadcn/ui              — Accessible component library (built on Radix)
Framer Motion          — Animations and transitions
Wouter v3              — Lightweight client-side router
Recharts               — Charts and data visualization
Leaflet + React-Leaflet — Interactive maps
TanStack Query v5      — Server state, caching, background refetch
Zod                    — Runtime schema validation (shared with backend)
date-fns               — Date formatting and arithmetic
Lucide React           — Icon library
```

### Backend Stack
```
Node.js 24             — Runtime
Express 5              — HTTP framework (async-native)
TypeScript 5.9         — Type-safe routes
Drizzle ORM            — SQL query builder + schema manager
PostgreSQL 16          — Primary relational database
Zod                    — Request/response validation
Pino                   — Structured JSON logging
esbuild                — Production bundler for the API server
```

### Monorepo Tooling
```
pnpm workspaces        — Package management + workspace linking
pnpm catalog           — Shared dependency version pinning
Orval                  — OpenAPI → React Query hooks + Zod schemas codegen
tsc --build            — Composite TypeScript project references
```

### Infrastructure (What You Need to Add for Production)
```
Docker / Docker Compose — Container orchestration for local dev
Railway / Render / Fly.io — PaaS deployment (easiest)
  OR
AWS ECS + RDS          — Scalable cloud (enterprise)
  OR
Vercel (frontend) + Railway (API) — Split deployment
Nginx / Caddy          — Reverse proxy + TLS termination
Redis                  — Session store + job queue + caching
BullMQ                 — Background job queue (runs on Redis)
S3 / Cloudflare R2     — File/image storage (property photos, documents)
Cloudflare             — CDN + DDoS protection + DNS
SendGrid / Resend      — Transactional email
Twilio                 — SMS notifications (quotes, reminders, updates)
Stripe                 — Payments, subscriptions, invoicing
```

---

## PART 2 — THE AGENTIC AI LAYER (This Is the Real Billion-Dollar Piece)

### What "Agentic AI" Means for a Lawn Care Business

A traditional lawn care business requires humans to:
- Answer phone calls and qualify leads
- Generate quotes manually
- Dispatch crews and track jobs
- Follow up with overdue customers
- Upsell services
- Handle complaints
- Analyze business performance

An **Agentic AI system** replaces or augments every one of these with autonomous agents that think, decide, and act — with humans only approving edge cases.

---

## PART 3 — AGENTS TO BUILD (One by One)

### Agent 1: Lead Qualification & Intake Agent
**What it does:** Receives new leads from the website, qualifies them, extracts property info, and schedules follow-up without any human.

**Stack:**
```
LLM Backend:     OpenAI GPT-4o or Anthropic Claude 3.5 Sonnet
Orchestration:   LangChain or LlamaIndex or CrewAI
Trigger:         Webhook from quote form submission
Tools:           Google Maps API (property lookup), Zillow API (lot size)
Output:          Structured lead record inserted into PostgreSQL
Notification:    SMS to dispatcher via Twilio if high-priority lead
```

**Code pattern (Node.js + LangChain):**
```typescript
import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";

const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });
const tools = [googleMapsLookupTool, zillowPropertyTool, insertLeadTool];
const agent = createToolCallingAgent({ llm, tools, prompt });
const executor = new AgentExecutor({ agent, tools });

// Runs on every new lead form submission
const result = await executor.invoke({ input: leadFormData });
```

---

### Agent 2: AI Quote Generation Agent
**What it does:** Uses satellite imagery + property data to auto-generate accurate lawn care quotes with zero human input.

**Stack:**
```
Computer Vision:  Google Gemini Vision API or GPT-4 Vision
                  (analyzes satellite images for lawn area measurement)
Satellite Images: Google Maps Static API or Nearmap API
Pricing Engine:   Custom rules engine in PostgreSQL (service × sqft × region)
LLM:              Claude 3.5 Sonnet (writes personalized quote narrative)
Delivery:         Auto-email via Resend + SMS via Twilio
```

**Flow:**
```
Address entered
  → Fetch satellite image (Google Maps Static API)
  → Send image to GPT-4 Vision: "Measure the lawn area in this image"
  → Get sqft estimate + yard complexity score
  → Query pricing engine: base_price × sqft_multiplier × service_type
  → LLM generates: "Hi Sarah, based on your 4,200 sqft lawn at 42 Oak St..."
  → PDF quote generated (Puppeteer or pdfmake)
  → Sent via email + SMS instantly
  → Lead record updated in DB with quote_sent status
```

---

### Agent 3: Crew Dispatch & Route Optimization Agent
**What it does:** Every morning at 6 AM, automatically assigns jobs to crews based on location, skill, availability, and workload — then generates optimized routes.

**Stack:**
```
Scheduling:      BullMQ cron job (runs daily at 6 AM)
LLM:             GPT-4o with function calling (makes assignment decisions)
Routing:         Google Maps Directions API (optimize multi-stop routes)
  OR             OpenRouteService (self-hosted, free)
  OR             Valhalla (open-source routing engine)
Notification:    Push notification to Worker Portal (web push or Expo)
                 + SMS confirmation to each worker via Twilio
```

**Decision logic the LLM uses:**
```
For each job:
  - Worker proximity to job location
  - Worker skill set vs. job requirements
  - Worker current workload (jobs already assigned today)
  - Job priority (urgency, customer tier, overdue status)
  - Equipment availability
  - Weather forecast (OpenWeatherMap API)
```

---

### Agent 4: Customer Communication Agent
**What it does:** Handles all inbound customer messages, answers questions, schedules appointments, and escalates only when truly necessary.

**Stack:**
```
Channels:        Twilio SMS, email (IMAP parsing), WhatsApp Business API
LLM:             GPT-4o with RAG (retrieval-augmented generation)
Vector DB:       Pinecone or pgvector (stores FAQs, service descriptions,
                 customer history, job status)
Memory:          Redis (short-term conversation context per customer)
Escalation:      If agent confidence < 70%, route to human dispatcher
CRM Write:       Agent updates PostgreSQL with conversation outcomes
```

**Example conversation (fully autonomous):**
```
Customer SMS: "When is my next mowing?"
Agent: queries DB for customer by phone number
      retrieves upcoming jobs for that customer
      replies: "Hi Sarah! Your next lawn mowing is scheduled for
               Thursday, May 22 between 9–11 AM. Marcus Webb's
               crew will handle it. Reply RESCHEDULE to change."

Customer: "Can you move it to Friday?"
Agent: checks crew availability for Friday
      if available: updates job in DB, confirms via SMS
      if not: "Friday is fully booked. Next available is Saturday
               May 24 at 10 AM — shall I book that?"
```

---

### Agent 5: Payment & Collections Agent
**What it does:** Sends invoices automatically, follows up on overdue payments, and handles payment disputes — all without human involvement.

**Stack:**
```
Payments:        Stripe (invoicing, subscriptions, ACH, credit cards)
Automation:      BullMQ scheduled jobs
LLM:             GPT-4o (writes personalized follow-up messages)
Escalation:      After 3 failed attempts → legal/collections workflow
Accounting:      QuickBooks API or Xero API (sync all transactions)
```

**Payment escalation ladder:**
```
Day 1 (due date):  Auto-invoice sent via email + SMS
Day 3 (overdue):   Friendly reminder: "Just a heads up, invoice #1042..."
Day 7:             Firm reminder + 5% late fee applied automatically
Day 14:            Final notice + service suspension warning
Day 21:            Service paused + collections agent escalation
```

---

### Agent 6: Upsell & Retention Agent
**What it does:** Identifies upsell opportunities, churning customers, and seasonal promotions — then acts on them autonomously.

**Stack:**
```
Analytics:       Custom SQL queries on PostgreSQL (identifies patterns)
ML:              scikit-learn or simple rule-based scoring (churn prediction)
LLM:             Claude 3.5 Sonnet (writes personalized outreach)
A/B Testing:     Statsig or GrowthBook (tests message variants)
```

**Triggers:**
```
Upsell trigger:   Customer has mowing only + weather shows no rain in 14 days
                  → Agent sends: "Noticed it's been dry — your lawn could
                    use our deep fertilization treatment. Book now for 20% off."

Churn trigger:    Customer hasn't responded in 45 days or cancelled 2 jobs
                  → Winback campaign: personalized discount offer

Seasonal:         March → aeration & seeding promotions
                  October → leaf cleanup campaigns
                  December → prepay next year discount
```

---

### Agent 7: Business Intelligence Agent (Owner Dashboard)
**What it does:** Monitors business KPIs in real time, surfaces anomalies, and sends daily briefings to the owner — like having a CFO/COO in your pocket.

**Stack:**
```
Analytics DB:    PostgreSQL + materialized views (fast aggregations)
  OR             ClickHouse (columnar DB for analytics at scale)
LLM:             GPT-4o (writes natural language business summaries)
Scheduling:      BullMQ (daily 7 AM briefing)
Delivery:        Email + SMS + push notification
Anomaly detect:  Simple z-score alerts (revenue drop, cancellation spike)
Visualization:   Recharts (already in your app), Observable Plot
```

**Daily briefing example:**
```
"Good morning. Here's your Tuesday summary:

Revenue: $2,340 today (↑18% vs last Tuesday)
Jobs completed: 12 of 14 scheduled (2 delayed — weather)
New leads: 8 (3 high-priority, quotes sent automatically)
Overdue payments: 2 customers ($680 total) — follow-up scheduled
Crew utilization: 81% (above 75% target)
Alert: Marcus Webb has 6 jobs tomorrow — consider redistributing
       2 jobs to Devon Price who has capacity.

Recommended action: Approve the $4,200 estate job quote for
311 Peachtree Hills Ave (waiting your sign-off — over $3k threshold)."
```

---

## PART 4 — AGENTIC AI ORCHESTRATION FRAMEWORKS

Choose one of these to wire your agents together:

### Option A: LangGraph (Recommended — Most Flexible)
```
npm install @langchain/langgraph @langchain/openai @langchain/anthropic
```
- Builds agents as state machines (nodes + edges)
- Supports human-in-the-loop at any decision point
- Best for complex multi-step workflows
- Can run multiple agents in parallel
- Has built-in persistence (agent memory between runs)

### Option B: CrewAI (Best for Multi-Agent Teams)
```
pip install crewai crewai-tools
```
- Define agents as "crew members" with roles and goals
- Agents collaborate and hand off tasks to each other
- Python-based (you'd run a separate Python microservice)
- Good for: lead qualification crew, dispatch crew, etc.

### Option C: AutoGen (Microsoft — Best for Autonomous Tasks)
```
pip install pyautogen
```
- Agents converse with each other to solve problems
- Good for complex reasoning tasks
- Strong tool-use capabilities

### Option D: Mastra (Node.js Native — Closest to Your Stack)
```
npm install @mastra/core
```
- TypeScript-native agent framework
- Integrates directly with your existing Express + Drizzle stack
- Has built-in workflow engine, memory, and tool calling
- Best choice if you want to stay in Node.js/TypeScript

---

## PART 5 — COMPLETE DATABASE SCHEMA (Production)

Add these tables to your existing Drizzle schema:

```typescript
// New tables to add to lib/db/src/schema.ts

export const ai_conversations = pgTable("ai_conversations", {
  id:           serial("id").primaryKey(),
  customer_id:  integer("customer_id"),
  channel:      text("channel"),        // 'sms' | 'email' | 'chat'
  direction:    text("direction"),       // 'inbound' | 'outbound'
  content:      text("content").notNull(),
  agent_id:     text("agent_id"),       // which AI agent handled it
  confidence:   real("confidence"),     // 0-1, escalate if < 0.7
  escalated:    boolean("escalated").default(false),
  created_at:   timestamp("created_at").defaultNow(),
});

export const ai_decisions = pgTable("ai_decisions", {
  id:           serial("id").primaryKey(),
  agent:        text("agent").notNull(),  // 'dispatch' | 'quote' | 'billing'
  input:        jsonb("input"),
  output:       jsonb("output"),
  reasoning:    text("reasoning"),       // LLM chain of thought
  approved_by:  text("approved_by"),     // null = autonomous, else user id
  created_at:   timestamp("created_at").defaultNow(),
});

export const agent_tasks = pgTable("agent_tasks", {
  id:           uuid("id").defaultRandom().primaryKey(),
  agent:        text("agent").notNull(),
  status:       text("status").default("pending"), // pending|running|done|failed
  payload:      jsonb("payload"),
  result:       jsonb("result"),
  error:        text("error"),
  scheduled_at: timestamp("scheduled_at"),
  started_at:   timestamp("started_at"),
  completed_at: timestamp("completed_at"),
});

export const properties = pgTable("properties", {
  id:           serial("id").primaryKey(),
  address:      text("address").notNull(),
  lat:          real("lat"),
  lng:          real("lng"),
  sqft_lawn:    integer("sqft_lawn"),    // from satellite + AI
  sqft_total:   integer("sqft_total"),
  complexity:   text("complexity"),      // 'simple' | 'moderate' | 'complex'
  satellite_img: text("satellite_img_url"),
  last_analyzed: timestamp("last_analyzed"),
});

export const customers = pgTable("customers", {
  id:           serial("id").primaryKey(),
  name:         text("name").notNull(),
  email:        text("email"),
  phone:        text("phone"),
  address:      text("address"),
  property_id:  integer("property_id"),
  tier:         text("tier").default("standard"), // 'standard' | 'premium' | 'vip'
  mrr:          integer("mrr").default(0),
  ltv:          integer("ltv").default(0),
  churn_risk:   real("churn_risk").default(0),    // 0-1, ML model output
  created_at:   timestamp("created_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id:           serial("id").primaryKey(),
  customer_id:  integer("customer_id"),
  property_id:  integer("property_id"),
  services:     jsonb("services"),               // [{name, price, qty}]
  total:        integer("total"),               // cents
  ai_generated: boolean("ai_generated").default(true),
  pdf_url:      text("pdf_url"),
  status:       text("status").default("sent"), // sent|viewed|accepted|declined
  sent_at:      timestamp("sent_at"),
  accepted_at:  timestamp("accepted_at"),
});

export const invoices = pgTable("invoices", {
  id:           serial("id").primaryKey(),
  customer_id:  integer("customer_id"),
  job_id:       integer("job_id"),
  stripe_id:    text("stripe_invoice_id"),
  amount:       integer("amount"),              // cents
  status:       text("status").default("draft"),
  due_date:     timestamp("due_date"),
  paid_at:      timestamp("paid_at"),
  reminder_count: integer("reminder_count").default(0),
});
```

---

## PART 6 — ALL DEPENDENCIES TO INSTALL

### Core App (Already in Your ZIP)
```bash
# Already installed — just run:
pnpm install
```

### AI / Agentic Layer (Add These)
```bash
# LLM SDKs
pnpm add openai @anthropic-ai/sdk @google/generative-ai

# LangChain ecosystem (if using LangGraph)
pnpm add langchain @langchain/core @langchain/openai @langchain/anthropic langgraph

# OR Mastra (TypeScript-native, stays in your stack)
pnpm add @mastra/core @mastra/rag

# Vector database client
pnpm add @pinecone-database/pinecone
# OR use pgvector (stays in PostgreSQL)
pnpm add pgvector

# Background jobs
pnpm add bullmq ioredis

# Document generation (PDF quotes/invoices)
pnpm add puppeteer pdfmake @types/pdfmake

# Email
pnpm add resend
# OR
pnpm add @sendgrid/mail

# SMS
pnpm add twilio

# Payments
pnpm add stripe

# Maps / Geocoding
pnpm add @googlemaps/google-maps-services-js

# Accounting integrations
pnpm add node-quickbooks

# Web scraping / property data
pnpm add cheerio playwright-core

# Scheduling
pnpm add node-cron

# Validation (already have zod)

# Auth
pnpm add jsonwebtoken bcryptjs @types/jsonwebtoken @types/bcryptjs
```

### Python Microservices (If Using CrewAI / AutoGen)
```bash
pip install crewai crewai-tools openai anthropic langchain
pip install fastapi uvicorn pydantic
pip install psycopg2-binary sqlalchemy alembic
pip install celery redis flower  # background tasks
pip install scikit-learn pandas numpy  # ML models
pip install pillow requests  # image processing
```

---

## PART 7 — API KEYS YOU NEED

Get these accounts and API keys before you start:

```
OPENAI_API_KEY          — platform.openai.com (GPT-4o for agents)
ANTHROPIC_API_KEY       — console.anthropic.com (Claude for writing)
GOOGLE_MAPS_API_KEY     — console.cloud.google.com (maps + satellite)
TWILIO_ACCOUNT_SID      — twilio.com (SMS)
TWILIO_AUTH_TOKEN       — twilio.com
TWILIO_PHONE_NUMBER     — your Twilio number
RESEND_API_KEY          — resend.com (email, 3,000/month free)
STRIPE_SECRET_KEY       — dashboard.stripe.com
STRIPE_WEBHOOK_SECRET   — for payment event handling
PINECONE_API_KEY        — pinecone.io (vector DB, free tier available)
REDIS_URL               — Upstash Redis (free tier) or self-hosted
DATABASE_URL            — your PostgreSQL connection string
SESSION_SECRET          — random 64-char secret (already in your app)
```

---

## PART 8 — DEPLOYMENT ARCHITECTURE (PRODUCTION)

### Option A: Simple / Startup (Lowest Cost to Launch)
```
Frontend Apps:    Vercel (free tier → $20/mo)
API Server:       Railway ($5/mo → scales automatically)
Database:         Railway PostgreSQL ($5/mo)
Redis:            Upstash (free → $10/mo)
File Storage:     Cloudflare R2 ($0.015/GB)
DNS + CDN:        Cloudflare (free)
Email:            Resend (3k/mo free → $20/mo)
SMS:              Twilio ($0.0079/message)
Total startup:    ~$40-80/month
```

### Option B: Scalable / Growth (When You Hit $50k+ MRR)
```
All apps:         AWS ECS (containerized, auto-scaling)
Database:         AWS RDS PostgreSQL (Multi-AZ for reliability)
Cache:            AWS ElastiCache (Redis)
Storage:          AWS S3
CDN:              CloudFront
Load Balancer:    AWS ALB
Monitoring:       Datadog or Grafana + Prometheus
Logs:             AWS CloudWatch or Papertrail
Total:            ~$500-2,000/month depending on traffic
```

### Docker Compose (Local Development)
```yaml
# docker-compose.yml
version: '3.9'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: southern_roots
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  api:
    build: ./artifacts/api-server
    ports: ["3001:3001"]
    environment:
      DATABASE_URL: postgres://postgres:postgres@postgres:5432/southern_roots
      REDIS_URL: redis://redis:6379
    depends_on: [postgres, redis]

volumes:
  pgdata:
```

---

## PART 9 — STEP-BY-STEP LAUNCH PLAN

### Phase 1: Foundation (Week 1-2)
```
1. Clone your ZIP and run pnpm install
2. Set up PostgreSQL locally (or use Neon.tech free tier)
3. Run pnpm --filter @workspace/db run push  (creates all tables)
4. Start all apps: restart each workflow
5. Verify all 5 apps run and connect to your real DB
6. Set up Stripe test account + webhook
7. Set up Twilio trial account
8. Get OpenAI API key
```

### Phase 2: Go Real (Week 3-4)
```
1. Replace all mock data with real DB queries
2. Build the quote submission form → writes to DB
3. Connect Stripe to invoicing system
4. Set up Twilio SMS for job confirmations
5. Deploy to Railway (push to GitHub → auto-deploy)
6. Point your domain to Railway
7. Onboard first 5 real customers manually
```

### Phase 3: First Agent (Week 5-6)
```
1. Build Lead Qualification Agent (easiest win)
   - Webhook from quote form
   - LLM extracts address, property type, services needed
   - Auto-sends quote via email
   - No human needed for standard leads

2. Build Payment Reminder Agent
   - BullMQ cron: daily at 9 AM
   - Finds all overdue invoices
   - Sends personalized SMS reminder
   - Updates DB with reminder_count
```

### Phase 4: Full Automation (Month 2-3)
```
1. Satellite quote agent (GPT-4 Vision)
2. Crew dispatch optimizer (runs every morning)
3. Customer communication agent (handles inbound SMS)
4. Upsell campaign agent (weekly scan for opportunities)
5. BI briefing agent (daily owner summary)
```

### Phase 5: Scale (Month 4+)
```
1. Multi-city expansion (agents handle all markets the same way)
2. White-label the platform (sell to other lawn care companies)
3. Franchise model (each franchisee gets their own instance)
4. Raise money or bootstrap to $1M ARR
```

---

## PART 10 — THE PATH TO A BILLION DOLLARS

The real money is NOT in running your own lawn care company. It's in:

### Model 1: SaaS Platform
Sell this entire platform to other lawn care / home services companies.
- $299/mo per company (small)
- $999/mo per company (medium, with AI agents)
- $2,999/mo per company (enterprise, full autonomous stack)
- 10,000 lawn care companies in the US
- If you capture 1% = 100 companies × $999/mo = **$1.2M ARR**
- If you capture 5% = 500 companies × $999/mo = **$6M ARR**

### Model 2: AI Agent Marketplace
Build specialized agents and sell them as add-ons:
- "AI Quote Agent" — $199/mo
- "Dispatch Optimizer" — $299/mo
- "Customer Communication Agent" — $399/mo
- Each is self-contained and resellable

### Model 3: Vertical AI Platform
Expand beyond lawn care to all home services:
- Pool cleaning
- Pest control
- HVAC
- House cleaning
- Snow removal
The agent architecture is identical — just swap the service data.

### Model 4: Acquisition Play
Build to $3-5M ARR with strong AI differentiation.
Private equity firms pay 8-12× ARR for profitable SaaS.
$5M ARR × 10× = **$50M exit**.

---

## PART 11 — HOW TO RUN THE PROJECT FROM YOUR ZIP

```bash
# 1. Unzip the project
unzip southern-roots-turf-complete.zip -d southern-roots-turf
cd southern-roots-turf

# 2. Install Node.js 20+ (use nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# 3. Install pnpm
npm install -g pnpm@9

# 4. Install all dependencies
pnpm install

# 5. Set up your .env file
cp .env.example .env
# Edit .env with your DATABASE_URL and SESSION_SECRET

# 6. Set up the database
# Option A: Local PostgreSQL
createdb southern_roots
export DATABASE_URL="postgresql://localhost/southern_roots"
pnpm --filter @workspace/db run push

# Option B: Neon.tech (free cloud PostgreSQL)
# Create account at neon.tech, copy connection string to .env

# 7. Run the API server
pnpm --filter @workspace/api-server run dev

# 8. Run any frontend (in separate terminals)
pnpm --filter @workspace/greens-landscape run dev
pnpm --filter @workspace/portal run dev
pnpm --filter @workspace/client-portal run dev
pnpm --filter @workspace/worker-portal run dev
pnpm --filter @workspace/lawn-quotes run dev
```

---

## PART 12 — RECOMMENDED LEARNING RESOURCES

To build the Agentic AI layer yourself:

```
LangChain docs:     python.langchain.com / js.langchain.com
LangGraph:          langchain-ai.github.io/langgraph
OpenAI:             platform.openai.com/docs
Anthropic:          docs.anthropic.com
Mastra (TS agents): mastra.ai/docs
BullMQ (queues):    docs.bullmq.io
Drizzle ORM:        orm.drizzle.team
Stripe integration: stripe.com/docs/billing
Twilio SMS:         twilio.com/docs/sms
pgvector:           github.com/pgvector/pgvector
```

---

## SUMMARY CHEAT SHEET

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | React + Vite + Tailwind | Free |
| Backend API | Express 5 + Node.js | Free |
| Database | PostgreSQL + Drizzle | Free / $5-20/mo |
| Cache + Queues | Redis + BullMQ | Free / $10/mo |
| LLM (Agents) | OpenAI GPT-4o | ~$0.01-0.05/request |
| LLM (Writing) | Anthropic Claude | ~$0.003-0.015/request |
| Satellite Maps | Google Maps API | $2/1,000 calls |
| SMS | Twilio | $0.0079/message |
| Email | Resend | Free / $20/mo |
| Payments | Stripe | 2.9% + $0.30 |
| Deployment | Railway / Vercel | $20-50/mo |
| Agent Framework | Mastra or LangGraph | Free (open source) |

**Total monthly infra cost to launch:** $50-100/month
**Revenue potential at scale:** $1M-$50M ARR

---

*Built on: pnpm workspaces · TypeScript 5.9 · React 18 · Express 5 · PostgreSQL · Drizzle ORM*
*Ready to be your billion-dollar foundation.*
