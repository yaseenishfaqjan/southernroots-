# Production Hardening — Round 1

This document records the security foundation added on top of the baseline demo,
and the exact steps to turn it on.

## What was broken (baseline)

| # | Issue | Severity |
|---|---|---|
| 1 | **No authentication** on any API route — all customer data, invoices, dispatch, and agent controls were public | 🔴 Critical |
| 2 | **Twilio SMS webhook unverified** — anyone could spoof a customer's phone number and drive the communication agent to mutate the DB | 🔴 Critical |
| 3 | **Stripe webhook failed open** — if the secret was unset it accepted unsigned events (could mark invoices paid) | 🔴 Critical |
| 4 | **CORS fully open** (`cors()` with no config) | 🟠 High |

## What was added

- **`lib/db` → `users` table** (`schema/users.ts`): staff accounts with bcrypt password hashes and roles (`owner` / `dispatcher` / `worker`).
- **`api-server/src/lib/auth.ts`**: bcrypt hashing + JWT sign/verify. Refuses to issue tokens if the secret is < 32 chars.
- **`api-server/src/middlewares/auth.ts`**: `requireAuth` and `requireRole(...)`.
- **`api-server/src/routes/auth.ts`**: `POST /api/auth/login`, `GET /api/auth/me`.
- **`api-server/src/scripts/create-owner.ts`**: seed the first owner.
- **Twilio webhook**: now validates `x-twilio-signature`; rejects in production if unconfigured.
- **Stripe webhook**: now fails **closed** in production when the secret is missing.
- **CORS**: restricted to `CORS_ORIGINS` (comma-separated allowlist).

## How to turn it on

```bash
# 1. Apply the new users table
pnpm --filter @workspace/db run push

# 2. Set secrets in .env
#    JWT_SECRET=<64 random hex chars>
#    AUTH_ENABLED=true
#    CORS_ORIGINS=https://yourdashboard.com,https://portal.yourdomain.com

# 3. Create the first owner
pnpm --filter @workspace/api-server run create-owner you@email.com 'StrongPassw0rd!' "Your Name"

# 4. Log in to get a token
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@email.com","password":"StrongPassw0rd!"}'
```

`AUTH_ENABLED` defaults to **false** so the existing dashboards keep working. Once the
frontends attach the token (below), flip it to `true`.

## Remaining frontend work (next increment)

The API is ready; the 3 React apps still send no token. To complete auth:

1. Add a login page to `web-app` (owner) — POST to `/api/auth/login`, store the JWT.
2. In each app's `src/lib/api.ts`, attach `Authorization: Bearer <token>`.
3. Redirect to login on a `401` response.
4. Then set `AUTH_ENABLED=true`.

## Still open (tracked in ROADMAP.md)

- Multi-tenancy (org/tenant isolation) — required to sell as SaaS.
- Real AI lawn measurement (satellite + vision) — currently GPT guesses sqft from the address string.
- Rate limiting on `/auth/login` and public endpoints.
- Secrets management (move off `.env` to a vault in production).
