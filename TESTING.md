# Manual Testing Guide

Open **http://localhost:5173** and log in (`jim@jobtest.com` / `password123`, or sign up your own).
If a page ever shows "can't be reached", the dev servers dropped — ask to restart them.

---

## ⭐ The Golden Path (tests the whole product in 2 minutes)

This is the demo to show a client — it proves "lead → cash, autonomously":

1. **Customers** → **New Customer** → add one (use `powerwealthenterprise@gmail.com` as the email so you receive things) → ✅ green toast, appears in table
2. **Jobs** → **New Job** → pick that customer, set a service + price → **Create** → ✅ toast
3. **Jobs** → click the new job row → drawer → **Assign → Start → Mark Complete** → ✅ status changes each click
4. **Invoices** → an invoice auto-appeared → click **Mark Paid** → ✅ toast
5. **Dashboard** → **Revenue (MTD)** and **Jobs This Week** went up → ✅ the money loop is closed
6. **AI Decisions** → see the agents' logged work

**The autonomy test (the "wow"):** submit a lead with a real residential address →
the AI measures the lawn from satellite, prices it, and emails the quote. (Done via the
API today; the in-app public lead form is the next build.)

---

## Page-by-page

| Page | What to do | Expected result |
|---|---|---|
| **Homepage** (logged out) | Scroll; click nav links; open FAQ; click "Start free trial" | Smooth scroll, animations, count-up stats, signup |
| **Sign up / Login** | Create account → dashboard; log out (sidebar) → log back in | Lands on dashboard; back-to-home link works |
| **Dashboard** | Just view it | Real KPIs (Revenue, MRR, Jobs, Leads, etc.) + Recent Jobs |
| **Customers** | **New Customer** (toast); **click a row** | Add works; detail drawer slides in with jobs + invoices |
| **Jobs** | **New Job** (toast); **click a row**; Assign → Start → Complete | Modal works; drawer with workflow buttons; status changes |
| **Workers** | **New Crew Member** (toast) | Add works; member shows as "active" |
| **Invoices** | **Mark Paid** on an invoice; filter tabs | Status → paid; Dashboard Revenue updates |
| **Escalations** | View (likely empty) | "No open escalations — all clear" empty state |
| **Dispatch** | **Run AI Dispatch** + **Send Briefing** (toasts) | Status cards update; unassigned jobs + active crews show |
| **AI Decisions** | View; expand a row's JSON | Lists agent runs (quote, briefing); JSON expands |
| **Billing** | View; click **Choose plan** | Trial + 3 plans; "not configured" until Stripe keys |

---

## What "pass" looks like
- No blank/white pages
- Every "New / Add" button opens a working form and shows a green toast on save
- Clicking a Customer or Job row opens a detail drawer
- The Dashboard numbers move as you add data
- Submitting a real residential address produces a real AI-measured quote

## Known/expected (not bugs)
- **Escalations empty** = the AI is handling everything (correct)
- **A commercial address** quote → "needs review" (no lawn to measure — correct)
- **Resend test mode** only emails your own verified address (`powerwealthenterprise@gmail.com`); verify a domain to email anyone
- **Billing "Choose plan"** says not-configured until Stripe keys are added
