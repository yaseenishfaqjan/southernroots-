import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, organizationsTable } from "@workspace/db";
import { getStripe } from "../lib/stripe";
import { PLANS, isBillingConfigured, priceIdFor, type PlanKey } from "../lib/billing";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const appUrl = (): string => process.env.APP_URL ?? "http://localhost:5173";

// GET /billing/status — the org's current plan / trial / config state
router.get("/billing/status", async (req, res): Promise<void> => {
  try {
    const orgId = getOrgId(req as AuthedRequest);
    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, orgId));
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    res.json({
      plan: org.plan,
      status: org.status,
      trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
      hasSubscription: Boolean(org.stripeCustomerId),
      billingConfigured: isBillingConfigured(),
      plans: Object.values(PLANS).map((p) => ({
        key: p.key,
        name: p.name,
        monthly: p.monthly,
        blurb: p.blurb,
      })),
    });
  } catch (err) {
    logger.error({ err }, "GET /billing/status failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /billing/checkout — start a Stripe Checkout subscription for a plan
const CheckoutBody = z.object({ plan: z.enum(["starter", "growth", "enterprise"]) });

router.post("/billing/checkout", async (req, res): Promise<void> => {
  const parsed = CheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!isBillingConfigured()) {
    res.status(503).json({ error: "Billing is not configured yet. Add STRIPE_SECRET_KEY and price IDs." });
    return;
  }

  const plan = parsed.data.plan as PlanKey;
  const priceId = priceIdFor(plan);
  if (!priceId) {
    res.status(503).json({ error: `Price for plan "${plan}" not configured (set ${PLANS[plan].priceEnv}).` });
    return;
  }

  try {
    const orgId = getOrgId(req as AuthedRequest);
    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, orgId));
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    const stripe = getStripe();

    // Ensure the org has a Stripe customer.
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        metadata: { orgId: String(org.id) },
      });
      customerId = customer.id;
      await db
        .update(organizationsTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(organizationsTable.id, org.id));
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: String(org.id),
      metadata: { orgId: String(org.id), plan },
      success_url: `${appUrl()}/billing?success=1`,
      cancel_url: `${appUrl()}/billing?canceled=1`,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "POST /billing/checkout failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /billing/portal — open the Stripe customer portal to manage the subscription
router.post("/billing/portal", async (req, res): Promise<void> => {
  if (!isBillingConfigured()) {
    res.status(503).json({ error: "Billing is not configured yet." });
    return;
  }
  try {
    const orgId = getOrgId(req as AuthedRequest);
    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, orgId));
    if (!org?.stripeCustomerId) {
      res.status(400).json({ error: "No subscription to manage yet." });
      return;
    }
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${appUrl()}/billing`,
    });
    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "POST /billing/portal failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
