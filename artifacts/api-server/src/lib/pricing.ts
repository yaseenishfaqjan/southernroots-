// Deterministic pricing engine.
// Quotes must be explainable and auditable, so price is computed by rules here —
// the LLM only writes the customer-facing narrative, it never invents the numbers.

export type ServiceType =
  | "mowing"
  | "fertilization"
  | "hedge_trimming"
  | "aeration"
  | "landscaping"
  | "pressure_washing"
  | "leaf_removal";

export interface PricedService {
  name: string;
  type: ServiceType;
  price: number; // USD
  unit: "monthly" | "one_time";
  description: string;
}

export interface PricingInput {
  sqftLawn: number;
  complexity: "simple" | "moderate" | "complex";
  servicesWanted: string[]; // free-form text from the lead
  regionMultiplier?: number; // cost-of-living adjustment; 1.0 = baseline
}

export interface PricingResult {
  services: PricedService[];
  totalMonthly: number;
  totalOneTime: number;
}

interface RateCard {
  name: string;
  type: ServiceType;
  base: number; // flat component (USD)
  perKSqft: number; // added per 1,000 sqft of lawn
  recurring: boolean; // true = monthly, false = one-time
  description: string;
}

// Base rates calibrated to US residential lawn-care norms (2025).
const RATE_CARDS: Record<ServiceType, RateCard> = {
  mowing: {
    name: "Lawn Mowing",
    type: "mowing",
    base: 120,
    perKSqft: 14,
    recurring: true,
    description: "Weekly mowing, edging, and blowing",
  },
  fertilization: {
    name: "Fertilization & Weed Control",
    type: "fertilization",
    base: 45,
    perKSqft: 8,
    recurring: true,
    description: "Seasonal fertilizer and weed treatment program",
  },
  hedge_trimming: {
    name: "Hedge & Shrub Trimming",
    type: "hedge_trimming",
    base: 60,
    perKSqft: 0,
    recurring: true,
    description: "Shaping and trimming of hedges and shrubs",
  },
  aeration: {
    name: "Aeration & Overseeding",
    type: "aeration",
    base: 120,
    perKSqft: 18,
    recurring: false,
    description: "Core aeration and overseeding for a thicker lawn",
  },
  landscaping: {
    name: "Landscaping & Mulch",
    type: "landscaping",
    base: 200,
    perKSqft: 25,
    recurring: false,
    description: "Bed cleanup, planting, and fresh mulch",
  },
  pressure_washing: {
    name: "Pressure Washing",
    type: "pressure_washing",
    base: 150,
    perKSqft: 0,
    recurring: false,
    description: "Driveway, walkway, and patio pressure washing",
  },
  leaf_removal: {
    name: "Leaf Removal",
    type: "leaf_removal",
    base: 90,
    perKSqft: 10,
    recurring: false,
    description: "Full-property leaf cleanup and haul-away",
  },
};

const COMPLEXITY_MULTIPLIER: Record<PricingInput["complexity"], number> = {
  simple: 1.0,
  moderate: 1.25,
  complex: 1.6,
};

// Map free-form lead text to service types.
const KEYWORDS: Array<[RegExp, ServiceType]> = [
  [/mow|mowing|grass|cut/i, "mowing"],
  [/fertiliz|weed|treatment|nutrient/i, "fertilization"],
  [/hedge|shrub|bush|trim/i, "hedge_trimming"],
  [/aerat|overseed|seeding/i, "aeration"],
  [/landscap|mulch|bed|plant|design/i, "landscaping"],
  [/pressure|wash|power.?wash/i, "pressure_washing"],
  [/leaf|leaves|cleanup|fall/i, "leaf_removal"],
];

function resolveServiceTypes(servicesWanted: string[]): ServiceType[] {
  const text = servicesWanted.join(" ");
  const found = new Set<ServiceType>();
  for (const [re, type] of KEYWORDS) {
    if (re.test(text)) found.add(type);
  }
  // Default to mowing if nothing recognized — every lawn customer needs mowing.
  if (found.size === 0) found.add("mowing");
  return [...found];
}

export function priceQuote(input: PricingInput): PricingResult {
  const region = input.regionMultiplier ?? 1.0;
  const complexity = COMPLEXITY_MULTIPLIER[input.complexity];
  const kSqft = Math.max(0, input.sqftLawn) / 1000;

  const services: PricedService[] = resolveServiceTypes(input.servicesWanted).map(
    (type) => {
      const card = RATE_CARDS[type];
      const raw = (card.base + card.perKSqft * kSqft) * complexity * region;
      return {
        name: card.name,
        type: card.type,
        price: Math.round(raw),
        unit: card.recurring ? "monthly" : "one_time",
        description: card.description,
      };
    }
  );

  const totalMonthly = services
    .filter((s) => s.unit === "monthly")
    .reduce((sum, s) => sum + s.price, 0);
  const totalOneTime = services
    .filter((s) => s.unit === "one_time")
    .reduce((sum, s) => sum + s.price, 0);

  return { services, totalMonthly, totalOneTime };
}
