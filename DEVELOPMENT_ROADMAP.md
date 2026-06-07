# Development Roadmap — Building an Industry-Leading AI Field-Services Platform

This is the full build plan to take Southern Roots Turf from demo to a product that
competes with ServiceTitan / Jobber / Housecall Pro — but **AI-native**. It covers
every layer: **database, backend, frontend, AI/agents, and infrastructure**, phase by
phase, with a clear "definition of done" for each.

---

## 0. Positioning — why we win

| | Incumbents (ServiceTitan, Jobber) | Us |
|---|---|---|
| Built | Pre-AI; "software the owner operates" | AI-native; "software that operates the business" |
| Quoting | Manual / templated | Satellite + vision measured, instant |
| Back office | Human does it | 7 autonomous agents do it |
| Moat | Scale + integrations | Proprietary quote→outcome pricing data per region |

**Wedge:** instant, accurate AI quoting → **Platform:** agents run the whole back office →
**Moat:** data flywheel + multi-vertical expansion (pest, pool, HVAC, snow, cleaning).

---

## 1. Target architecture (end state)

```
                         ┌─────────────────────────────────────────┐
   Marketing site ──────▶│  API Gateway (Express 5 / Fastify)        │
   Owner dashboard ─────▶│   • Auth (JWT + RBAC, multi-tenant)       │
   Client portal ──────▶ │   • REST + OpenAPI (typed, generated)     │
   Worker portal ──────▶ │   • Rate limiting, validation (Zod)       │
                         └───────┬──────────────────┬────────────────┘
                                 │                  │
                    ┌────────────▼─────┐   ┌────────▼───────────────┐
                    │ Domain services  │   │ Agent runtime (BullMQ) │
                    │ quotes, jobs,    │   │ 7 agents + vision      │
                    │ billing, dispatch│   │ quoting engine         │
                    └────────┬─────────┘   └────────┬───────────────┘
                             │                      │
              ┌──────────────▼──────────────────────▼──────────────┐
              │ PostgreSQL (multi-tenant, Drizzle)  │  Redis (queue,│
              │ + pgvector (RAG memory)             │  cache, rate) │
              └─────────────────────────────────────┴───────────────┘
   External: OpenAI · Anthropic · Google Maps · Twilio · Stripe · Resend · R2/S3
```

---

## 2. DATABASE track (`lib/db`)

**Current:** 19 single-tenant tables, Drizzle + Postgres. Build does not pass `tsc`
(zod 3.25 vs drizzle-zod 0.8 mismatch).

| Step | Work | Done when |
|---|---|---|
| D1 | **Fix the zod/drizzle-zod build** — align on one zod major across the monorepo | `tsc --build` passes clean |
| D2 | **Multi-tenancy** — add `organizations` table; add `orgId` (FK, indexed) to every business table | Every row belongs to an org |
| D3 | **Tenant isolation** — a query helper / Postgres RLS so no query can cross tenants | Cross-tenant read is impossible by construction |
| D4 | **Indexes & constraints** — FKs, unique (email per org), composite indexes on hot paths (orgId+status, dueDate) | Explain plans hit indexes |
| D5 | **pgvector** — `embeddings` table for RAG (FAQs, customer history) for the comms agent | Comms agent retrieves context |
| D6 | **Migrations** — switch from `drizzle-kit push` to versioned migrations (`drizzle-kit generate`) | Reproducible, reviewable migrations in git |
| D7 | **Auditability** — `ai_decisions`, `audit_logs` enriched; soft-delete + `updatedAt` everywhere | Every agent action is traceable |

---

## 3. BACKEND track (`artifacts/api-server`)

**Current:** Express 5, 20 route modules, 7 agents, BullMQ queue, node-cron. Auth + webhook
verification added (round 1).

| Step | Work | Done when |
|---|---|---|
| B1 | **Auth end-to-end** — frontends attach JWT; flip `AUTH_ENABLED=true`; refresh tokens; password reset | No route is publicly readable |
| B2 | **Tenant context middleware** — resolve `orgId` from the JWT and scope every query | Requests are tenant-bound |
| B3 | **Rate limiting** — `express-rate-limit` + Redis on `/auth/*` and public endpoints | Brute-force + abuse blocked |
| B4 | **Real AI quote engine** *(Phase A — see §6)* — geocode → satellite → vision → pricing | Quotes are measured, not guessed |
| B5 | **Service layer** — extract business logic from routes into `services/` (testable, reusable by agents + API) | Routes are thin controllers |
| B6 | **Agent hardening** — idempotency keys, retries, dead-letter queue, per-agent budgets/timeouts | Agents never double-charge or loop |
| B7 | **Human-in-the-loop** — approval queue for actions over a $ threshold (`escalations` already exists) | Big decisions need sign-off |
| B8 | **Observability** — OpenTelemetry traces, error tracking (Sentry), structured logs (have Pino), `/metrics` | We can debug prod incidents |
| B9 | **Testing** — Vitest unit + Supertest integration + a seeded test DB; CI gate | PRs can't merge red |
| B10 | **API docs** — keep OpenAPI (`lib/api-spec`) authoritative; regenerate client (`lib/api-client-react`) | Frontend types are generated |

---

## 4. FRONTEND track (`web-app`, `client-portal`, `worker-portal`, + marketing)

**Current:** 3 React/Vite apps hitting `/api`, no auth, no login.

| Step | Work | Done when |
|---|---|---|
| F1 | **Auth UI** — login page, token storage, `Authorization` header in `api.ts`, 401→redirect, route guards | Apps require login |
| F2 | **Owner dashboard** — real-time KPIs, dispatch board, agent-decision feed, approval inbox | Owner runs the business from one screen |
| F3 | **Client portal** — quote view/accept, job tracking, pay invoice (Stripe), request service | Customers self-serve |
| F4 | **Worker portal** — mobile-first job list, status updates, photo upload, earnings, route map | Crews work from their phone |
| F5 | **Marketing + lead form** — public site; lead form POSTs `/api/leads` → triggers AI quote | Leads flow in autonomously |
| F6 | **Design system** — consolidate `lib/brand` tokens; shared shadcn/ui components across apps | Consistent, branded UI |
| F7 | **State & data** — TanStack Query everywhere, optimistic updates, error/empty/loading states | No raw fetch, no flicker |
| F8 | **Onboarding flow** — org signup wizard (multi-tenant) | A new company self-onboards in minutes |

---

## 5. AI / AGENT track (`artifacts/api-server/src/agents`)

| Agent | Productionization work |
|---|---|
| **Quote** | *(Phase A)* satellite + vision measurement, deterministic pricing engine, PDF, A/B tested narrative |
| **Dispatch** | Real Google Directions route optimization, weather-aware, skill matching |
| **Communication** | RAG over pgvector (FAQs + history), confidence-based escalation |
| **Billing** | Full Stripe invoicing, the 4-step reminder ladder, dunning, late fees |
| **Briefing** | Anomaly detection (z-score), daily owner summary |
| **Upsell** | Trigger rules + A/B tested outreach |
| **Churn** | Scoring model trained on real retention data |
| **Cross-cutting** | Every agent: idempotent, budgeted, logged to `ai_decisions`, evaluated against a golden set |

---

## 6. INFRA / DEVOPS track

| Step | Work |
|---|---|
| I1 | **Local dev** — `docker-compose` (Postgres + Redis) ✅; seed script with realistic demo data |
| I2 | **CI** — GitHub Actions: typecheck, lint, test, build on every PR |
| I3 | **Environments** — dev / staging / prod with separate secrets |
| I4 | **Deploy** — Railway/Render (start) → containerized; frontends on Vercel/CDN |
| I5 | **Secrets** — move off `.env` to a managed vault in prod |
| I6 | **Storage** — Cloudflare R2 / S3 for photos, PDFs, satellite snapshots |
| I7 | **Monitoring** — uptime, error tracking, log aggregation, alerting |
| I8 | **Backups + DR** — automated Postgres backups, restore drills |
| I9 | **Security** — dependency scanning, secret scanning, pen-test before GA |

---

## 7. Phased milestones (the order we actually build)

### Phase A — The Wedge: Real AI Quoting  ← **WE START HERE**
Geocode address → fetch satellite image → vision model measures the lawn →
deterministic pricing engine → Claude writes the quote → SMS + email + PDF.
**DoD:** submit a real address, get an accurate measured quote in seconds.

### Phase B — Production Foundation
Frontend auth (F1) + `AUTH_ENABLED=true`, rate limiting (B3), zod build fix (D1),
service layer (B5), CI + tests (B9, I2). **DoD:** secure, green build, tested.

### Phase C — Multi-Tenant SaaS
Organizations + `orgId` everywhere (D2–D4), tenant middleware (B2), org signup (F8),
our own Stripe subscription billing. **DoD:** two companies use it, fully isolated.

### Phase D — Full Autonomy
Productionize all 7 agents (§5), human-in-the-loop approvals (B7), RAG comms (D5).
**DoD:** a day of operations runs with zero human input on standard cases.

### Phase E — Flywheel & Scale
Regional pricing models from accumulated data, A/B testing, observability (B8),
vertical templates (pest/pool/HVAC). **DoD:** quotes improve as data grows; new vertical in days.

---

## 8. The 80% nobody codes: go-to-market (parallel track)

Software is ~20% of a billion-dollar outcome. In parallel with engineering:
land 5–10 real lawn-care operators, prove "+X% jobs won" and "−Y hours/week admin,"
turn that into case studies, then a repeatable sales motion. **Retention > features.**

---

*Start: Phase A. Everything else compounds on a quoting engine that actually impresses.*
