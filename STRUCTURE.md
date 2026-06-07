# Project Structure

Southern Roots Turf is a **pnpm-workspace monorepo**. Everything below lives under
the project root (`southern-roots-turf-complete/`).

> ⚠️ This project is currently nested one level deep:
> `southern-roots-turf-complete/southern-roots-turf-complete/`. The inner folder is
> the real root. See "Cleanup" below.

```
.
├── artifacts/                  # Deployable applications
│   ├── api-server/             # ◀ BACKEND — Express 5 + TypeScript
│   │   └── src/
│   │       ├── agents/         #   7 autonomous AI agents
│   │       ├── routes/         #   HTTP API (20 route modules)
│   │       ├── middlewares/    #   auth (NEW)
│   │       ├── queues/         #   BullMQ background jobs
│   │       ├── lib/            #   integrations: openai, anthropic, twilio,
│   │       │                   #   stripe, resend, redis, auth (NEW)
│   │       ├── scripts/        #   create-owner seed (NEW)
│   │       ├── cron.ts         #   scheduled agent triggers
│   │       └── index.ts        #   entrypoint
│   │
│   ├── client-portal/          # ◀ FRONTEND — customer self-service (React/Vite)
│   ├── worker-portal/          # ◀ FRONTEND — mobile crew app (React/Vite)
│   │
│   ├── greens-landscape/       # ⚠ STALE mockup (pre-production)
│   ├── lawn-quotes/            # ⚠ STALE mockup
│   ├── portal/                 # ⚠ STALE mockup
│   └── mockup-sandbox/         # ⚠ STALE mockup
│
├── web-app/                    # ◀ FRONTEND — owner dashboard (React/Vite)
│
├── lib/                        # Shared workspace packages
│   ├── db/                     # ◀ DATABASE — Drizzle ORM + Postgres schema
│   │   └── src/schema/         #   19 typed tables (users NEW)
│   ├── api-spec/               #   OpenAPI spec
│   ├── api-types/              #   shared TS types
│   ├── api-zod/                #   shared Zod schemas
│   ├── api-client-react/       #   generated React Query hooks (Orval)
│   └── brand/                  #   design tokens
│
├── scripts/                    # workspace-level scripts
├── docker-compose.yml          # Postgres + Redis for local dev
├── pnpm-workspace.yaml         # workspace definition
└── *.md                        # docs (README, BLUEPRINT, this file, ROADMAP)
```

## The three layers you asked about

| Layer | Where | Stack |
|---|---|---|
| **Frontend** | `web-app` (owner), `artifacts/client-portal` (customer), `artifacts/worker-portal` (crew) | React 18 · Vite · Tailwind · shadcn/ui |
| **Backend** | `artifacts/api-server` | Express 5 · TypeScript · BullMQ · node-cron |
| **Database** | `lib/db` | PostgreSQL 16 · Drizzle ORM |

The three frontends share types and API hooks through `lib/*`, so the contract
between frontend and backend is generated, not hand-written.

## Cleanup (recommended, not yet applied)

These are safe to remove once confirmed — they are early mockups not referenced by
the README run instructions:

```
artifacts/greens-landscape
artifacts/lawn-quotes
artifacts/portal
artifacts/mockup-sandbox
```

And the project should be de-nested so the root is one level up. Both are reversible
git operations now that the repo is initialized.
