# Roadmap — From Demo to Vertical AI Platform

**Industry:** Home & field services → lawn care / landscaping (~$150B US, ~600k
mostly-tiny operators, almost none with software).

**Core problem we solve:** the owner-operator is the bottleneck. Their day is eaten by
quoting, scheduling, dispatching, chasing payments, and answering texts instead of
growing the business. Our agents replace that back-office labor so a solo operator
runs like a 20-person company.

**Why it can be a billion-dollar business:** we don't get rich running one lawn company.
We sell the operating system to the 600k that have none, then expand the *same* agent
architecture into adjacent verticals (pest, pool, HVAC, snow, cleaning). The moat is a
data flywheel — quote → job outcome → better pricing models nobody else has — plus
deep workflow lock-in.

---

## The wedge → platform → moat

1. **Wedge** — *Instant AI quoting.* Respond to a lead in seconds with an accurate,
   measured quote. Whoever quotes first usually wins. Clear, measurable ROI to get
   operators in the door.
2. **Platform** — the agents then run the whole back office (dispatch, billing,
   comms, retention, BI). Now we're indispensable, not a feature.
3. **Moat** — proprietary pricing/outcome data + multi-vertical expansion.

---

## Phased plan

### Phase 0 — Foundation ✅ (in progress)
- [x] Version control + baseline snapshot
- [x] Auth (users, JWT, login, RBAC middleware)
- [x] Webhook signature verification (Twilio + Stripe)
- [x] CORS lockdown
- [ ] Frontend login flow + `AUTH_ENABLED=true`
- [ ] Remove stale mockup apps, de-nest the repo
- [ ] Rate limiting on auth + public endpoints

### Phase 1 — Make the headline feature real (the wedge)
- [ ] **Real lawn measurement**: Google Maps Static API (satellite) → vision model
      (GPT-4o / Gemini Vision) → sqft + complexity. Today the quote agent *guesses*
      sqft from the address text — this is the single most important fix for a
      business that sells on quote accuracy.
- [ ] Deterministic pricing engine (service × sqft × region) so quotes are
      explainable and auditable, with the LLM only writing the narrative.
- [ ] Quote acceptance → job creation → first invoice, end to end.

### Phase 2 — Multi-tenant SaaS (the product to sell)
- [ ] `organizations` table; add `org_id` to every business table.
- [ ] Tenant isolation enforced in every query (row-level scoping or RLS).
- [ ] Org-scoped onboarding + per-tenant settings (pricing, branding, hours).
- [ ] Stripe Billing for **our** subscription tiers ($299 / $999 / $2,999 mo).
- [ ] Self-serve signup + 14-day trial.

### Phase 3 — Trust, scale, observability
- [ ] Human-in-the-loop approval queue for high-value agent actions (>$ threshold).
- [ ] Agent decision audit log surfaced in the dashboard (partly built: `ai_decisions`).
- [ ] Metrics/alerting (revenue drop, agent failure rate), error tracking.
- [ ] Load testing; move secrets to a vault; backups + DR.

### Phase 4 — Flywheel & expansion
- [ ] Pricing model trained on accumulated quote→outcome data (per region).
- [ ] A/B test agent message variants; optimize conversion + collections.
- [ ] Vertical templates: pest control, pool, HVAC, snow removal — swap the
      service catalog, reuse the agents.

---

## Unit economics (illustrative, from the blueprint)

| Tier | Price/mo | Target segment |
|---|---|---|
| Starter | $299 | solo operator |
| Growth (AI agents) | $999 | 2–10 crews |
| Enterprise | $2,999 | multi-location |

- 1% of 10k targeted companies × $999 = **$1.2M ARR**
- 5% × $999 = **$6M ARR**
- $5M ARR × ~10× SaaS multiple = **~$50M exit**

The number isn't the point — the structure is: a sticky, data-compounding,
multi-vertical AI platform in a huge fragmented market with almost no incumbent software.

---

## Immediate next 3 actions
1. Wire frontend login → turn `AUTH_ENABLED` on (closes the critical security gap end-to-end).
2. Build the real satellite-measurement quote path (makes the wedge honest).
3. Introduce `org_id` multi-tenancy (unlocks selling to more than one company).
