// Subscription billing config. Everything is keyed off env vars so that once you
// add your Stripe account keys + price IDs, billing works with no code changes.
//
// Required env to go live:
//   STRIPE_SECRET_KEY        sk_live_... (or sk_test_...)
//   STRIPE_WEBHOOK_SECRET    whsec_...
//   STRIPE_PRICE_STARTER     price_...   ($299/mo recurring price in your Stripe)
//   STRIPE_PRICE_GROWTH      price_...   ($999/mo)
//   STRIPE_PRICE_ENTERPRISE  price_...   ($2,999/mo)

export interface PlanDef {
  key: PlanKey;
  name: string;
  priceEnv: string; // env var holding the Stripe price id
  monthly: number; // display price in USD
  blurb: string;
}

export type PlanKey = "starter" | "growth" | "enterprise";

export const PLANS: Record<PlanKey, PlanDef> = {
  starter: {
    key: "starter",
    name: "Starter",
    priceEnv: "STRIPE_PRICE_STARTER",
    monthly: 299,
    blurb: "Solo operator — AI quoting + dashboard",
  },
  growth: {
    key: "growth",
    name: "Growth",
    priceEnv: "STRIPE_PRICE_GROWTH",
    monthly: 999,
    blurb: "2–10 crews — full autonomous agents",
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    priceEnv: "STRIPE_PRICE_ENTERPRISE",
    monthly: 2999,
    blurb: "Multi-location — priority support",
  },
};

export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function priceIdFor(plan: PlanKey): string | undefined {
  return process.env[PLANS[plan].priceEnv] || undefined;
}

// Map a Stripe price id back to our plan key (for webhook handling).
export function planForPriceId(priceId: string | undefined): PlanKey | undefined {
  if (!priceId) return undefined;
  return (Object.keys(PLANS) as PlanKey[]).find((k) => priceIdFor(k) === priceId);
}
