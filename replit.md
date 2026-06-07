# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Clean&Green landscaping & pressure washing company ecosystem with 5 front-end apps and one shared API backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (use `zod` import, NOT `zod/v4` — esbuild cannot resolve the subpath)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (bundle for API server)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

| Artifact | Path | Purpose |
|---|---|---|
| `greens-landscape` | `/greens-landscape` | Public landing page for Clean&Green |
| `portal` | `/portal` | Internal sub-dispatcher portal |
| `api-server` | `/api` | Shared REST API backend |
| `client-portal` | `/client-portal` | Customer-facing job tracker & service request |
| `worker-portal` | `/worker-portal` | Crew member field portal (mobile-friendly) |

## API Routes (all under /api)

- `GET /healthz` — health check
- `GET/POST /jobs` — list/create jobs
- `GET /jobs/recent` — 10 most recent jobs
- `GET /jobs/stale` — leads 48+ hrs old with no contact
- `GET/PATCH/DELETE /jobs/:id` — job CRUD
- `POST /jobs/:id/assign` — assign job to subcontractor
- `PATCH /assignments/:id` — update assignment status
- `GET/POST /subcontractors` — list/create subs
- `GET/PATCH/DELETE /subcontractors/:id` — sub CRUD
- `GET /subcontractors/:id/workload` — sub workload
- `GET /dashboard/summary` — dashboard KPIs (includes staleLeads, pendingEscalations, unreadNotifications)
- `GET /dispatch/suggestions/:jobId` — ranked sub suggestions
- `GET/POST /escalations` — list/create escalations
- `PATCH /escalations/:id` — update escalation
- `GET /kpi/summary` — KPI stats
- `POST /kpi/log` — log KPI entry
- `GET /audit-logs` — audit trail
- `GET /notifications` — list notifications
- `PATCH /notifications/:id/read` — mark one read
- `PATCH /notifications/read-all` — mark all read
- `POST /client/lookup` — client looks up job by phone+ID
- `POST /client/request` — client submits service request
- `GET /worker/jobs/:subId` — worker's assigned jobs
- `PATCH /worker/assignments/:id/status` — worker updates status

## DB Schema Tables

- `jobs_table` — core job records
- `subcontractors_table` — crew/subs
- `assignments_table` — job-to-sub assignments
- `escalations_table` — complaint/issue escalations
- `kpi_logs_table` — dispatcher KPI activity
- `audit_logs_table` — audit trail entries
- `notifications_table` — system notifications

## Important Rules

- Portal hooks: import from `@workspace/api-client-react`, NEVER relative paths
- Numeric DB columns come back as strings — always use `parseFloat()` in route handlers
- Wouter v3: `Link` renders `<a>` directly — never wrap in `<a>`
- Job statuses: "new" | "assigned" | "in_progress" | "complete" | "paid"
- Assignment statuses: "pending" | "in_progress" | "complete"
- zod import: always `import { z } from "zod"` not `"zod/v4"` in api-server routes
- JSX in hooks files: must use `.tsx` extension, not `.ts`
