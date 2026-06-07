import { z } from "zod";
import { addDays } from "date-fns";

// ── Services ───────────────────────────────────────────────────────────────
export const servicesList = [
  { id: "mowing",      name: "Lawn Mowing",       icon: "scissors",  basePrice: 0.015, priceMin: 45,  monthlyMin: 160, description: "Weekly or bi-weekly cut, trim, and blow." },
  { id: "landscaping", name: "Landscaping",        icon: "trees",     basePrice: 0.025, priceMin: 120, monthlyMin: 350, description: "Full design, planting, and bed shaping." },
  { id: "mulch",       name: "Mulch Installation", icon: "layers",    basePrice: 0.018, priceMin: 90,  monthlyMin: 0,   description: "Premium hardwood mulch, 2–3\" depth." },
  { id: "trimming",    name: "Bush Trimming",      icon: "scissors",  basePrice: 0.02,  priceMin: 80,  monthlyMin: 120, description: "Professional pruning for shape and health." },
  { id: "pressure",    name: "Pressure Washing",   icon: "droplets",  basePrice: 0.10,  priceMin: 150, monthlyMin: 0,   description: "Driveway, patio, and walkway deep clean." },
  { id: "seasonal",    name: "Seasonal Cleanup",   icon: "wind",      basePrice: 0.022, priceMin: 95,  monthlyMin: 0,   description: "Leaf removal, bed cleanup, edge refresh." },
];

// ── Quote Wizard Demo Scenarios ────────────────────────────────────────────
export const DEMO_SCENARIOS = [
  {
    label: "Large Bundle — Atlanta",
    address: "1824 Peachtree Rd NW, Atlanta, GA 30309",
    lawnSqFt: 6200, drivewaySqFt: 840, trees: 4, beds: 2,
    services: ["mowing", "landscaping", "mulch"],
    customer: { name: "Sarah Jenkins", email: "sarah.j@gmail.com", phone: "(404) 555-0192", startDate: addDays(new Date(), 7), notes: "Gate code #4821. Two dogs in backyard." },
  },
  {
    label: "Starter Mow — Savannah",
    address: "562 Magnolia Dr, Savannah, GA 31401",
    lawnSqFt: 3400, drivewaySqFt: 480, trees: 1, beds: 0,
    services: ["mowing"],
    customer: { name: "Michael Chang", email: "mchang@outlook.com", phone: "(912) 555-0344", startDate: addDays(new Date(), 3), notes: "" },
  },
  {
    label: "Full Estate — Augusta",
    address: "3310 Piedmont Ave, Augusta, GA 30909",
    lawnSqFt: 9100, drivewaySqFt: 1200, trees: 8, beds: 5,
    services: ["mowing", "landscaping", "trimming", "seasonal"],
    customer: { name: "Kevin Park", email: "kpark@gmail.com", phone: "(706) 555-0801", startDate: addDays(new Date(), 14), notes: "HOA requires work between 9am–5pm." },
  },
  {
    label: "Pressure + Mow — Roswell",
    address: "220 Cedar Court, Roswell, GA 30075",
    lawnSqFt: 4800, drivewaySqFt: 620, trees: 3, beds: 1,
    services: ["mowing", "pressure"],
    customer: { name: "Emily Robinson", email: "emily.r@icloud.com", phone: "(770) 555-0617", startDate: addDays(new Date(), 5), notes: "Focus pressure wash on back patio." },
  },
];

// ── Route Optimization Mock Data ───────────────────────────────────────────
export const ROUTE_STOPS = [
  { id: 1, label: "Stop 1", address: "1824 Peachtree Rd NW, Atlanta", customer: "Sarah Jenkins",   service: "Lawn Mowing + Landscaping", duration: 75, lat: 33.8136, lng: -84.3814, crewId: "A" },
  { id: 2, label: "Stop 2", address: "562 W Paces Ferry Rd, Atlanta", customer: "David Kim",       service: "Mulch Installation",        duration: 45, lat: 33.8388, lng: -84.4074, crewId: "A" },
  { id: 3, label: "Stop 3", address: "4142 Roswell Rd NE, Atlanta",   customer: "Tanya Brooks",    service: "Lawn Mowing",               duration: 50, lat: 33.8614, lng: -84.3878, crewId: "A" },
  { id: 4, label: "Stop 4", address: "220 Cedar Court, Roswell",      customer: "Emily Robinson",  service: "Pressure Washing + Mowing", duration: 90, lat: 34.0232, lng: -84.3616, crewId: "B" },
  { id: 5, label: "Stop 5", address: "882 Maple Ave, Marietta",       customer: "James Whitfield", service: "Seasonal Cleanup",          duration: 60, lat: 33.9526, lng: -84.5499, crewId: "B" },
];

export const CREWS = [
  { id: "A", name: "Crew Alpha", members: ["Marcus W.", "Luis T."], truck: "F-250 #1" },
  { id: "B", name: "Crew Beta",  members: ["Devon P.", "Ana R."],   truck: "F-250 #2" },
];

// ── Recurring Maintenance Customers ───────────────────────────────────────
export const MAINTENANCE_CUSTOMERS = [
  { id: "C001", name: "Sarah Jenkins",   address: "1824 Peachtree Rd NW, Atlanta",    services: ["Lawn Mowing", "Landscaping"], frequency: "Weekly",    nextDate: addDays(new Date(), 2),  mrr: 280, paymentStatus: "paid",    reminderEnabled: true,  lastCompleted: addDays(new Date(), -7) },
  { id: "C002", name: "David Kim",       address: "562 W Paces Ferry Rd, Atlanta",    services: ["Mulch Installation"],          frequency: "Monthly",   nextDate: addDays(new Date(), 12), mrr: 90,  paymentStatus: "paid",    reminderEnabled: true,  lastCompleted: addDays(new Date(), -28) },
  { id: "C003", name: "Tanya Brooks",    address: "4142 Roswell Rd NE, Atlanta",      services: ["Lawn Mowing"],                 frequency: "Bi-weekly", nextDate: addDays(new Date(), 5),  mrr: 160, paymentStatus: "overdue", reminderEnabled: true,  lastCompleted: addDays(new Date(), -9) },
  { id: "C004", name: "Emily Robinson",  address: "220 Cedar Court, Roswell",         services: ["Mowing", "Pressure Washing"],  frequency: "Weekly",    nextDate: addDays(new Date(), 1),  mrr: 265, paymentStatus: "paid",    reminderEnabled: false, lastCompleted: addDays(new Date(), -7) },
  { id: "C005", name: "Kevin Park",      address: "3310 Piedmont Ave, Augusta",       services: ["Lawn Mowing", "Landscaping", "Trimming"], frequency: "Weekly", nextDate: addDays(new Date(), 3), mrr: 480, paymentStatus: "paid", reminderEnabled: true, lastCompleted: addDays(new Date(), -7) },
  { id: "C006", name: "James Whitfield", address: "882 Maple Ave, Marietta",          services: ["Seasonal Cleanup"],            frequency: "Monthly",   nextDate: addDays(new Date(), 18), mrr: 95,  paymentStatus: "paid",    reminderEnabled: true,  lastCompleted: addDays(new Date(), -12) },
  { id: "C007", name: "Linda Okafor",    address: "742 Magnolia Dr, Savannah",        services: ["Lawn Mowing", "Trimming"],     frequency: "Bi-weekly", nextDate: addDays(new Date(), 8),  mrr: 220, paymentStatus: "paid",    reminderEnabled: true,  lastCompleted: addDays(new Date(), -6) },
  { id: "C008", name: "Marcus Webb",     address: "215 Vinings Vintage Dr, Smyrna",  services: ["Lawn Mowing"],                 frequency: "Weekly",    nextDate: addDays(new Date(), 0),  mrr: 157, paymentStatus: "overdue", reminderEnabled: false, lastCompleted: addDays(new Date(), -8) },
];

// ── Neighborhood Leads ─────────────────────────────────────────────────────
export const NEIGHBORHOOD_LEADS = [
  { id: "L01", address: "311 Peachtree Hills Ave NE", lat: 33.8265, lng: -84.3693, yardSqFt: 7200,  opportunity: "Lawn Mowing + Landscaping", priority: 94, tags: ["large-yard", "high-income"],            hasNearbyCx: true  },
  { id: "L02", address: "2840 Habersham Rd NW",       lat: 33.8381, lng: -84.3851, yardSqFt: 5800,  opportunity: "Pressure Washing",           priority: 78, tags: ["dirty-driveway"],                      hasNearbyCx: false },
  { id: "L03", address: "415 Blackland Rd NW",        lat: 33.8441, lng: -84.4002, yardSqFt: 9400,  opportunity: "Full-Service Bundle",         priority: 96, tags: ["large-yard", "high-income"],            hasNearbyCx: true  },
  { id: "L04", address: "1050 Andrews Dr NW",         lat: 33.8315, lng: -84.3942, yardSqFt: 4100,  opportunity: "Seasonal Cleanup + Mulch",    priority: 62, tags: ["existing-cx-nearby"],                  hasNearbyCx: true  },
  { id: "L05", address: "3380 Tuxedo Rd NW",          lat: 33.8511, lng: -84.4065, yardSqFt: 12800, opportunity: "Landscaping + Mowing",        priority: 98, tags: ["large-yard", "high-income"],            hasNearbyCx: false },
  { id: "L06", address: "620 Valley Rd NW",           lat: 33.8199, lng: -84.3760, yardSqFt: 3200,  opportunity: "Lawn Mowing",                 priority: 55, tags: ["existing-cx-nearby"],                  hasNearbyCx: true  },
  { id: "L07", address: "1724 Wesley Rd NW",          lat: 33.8348, lng: -84.4127, yardSqFt: 6500,  opportunity: "Pressure Washing + Mowing",   priority: 82, tags: ["dirty-driveway", "existing-cx-nearby"], hasNearbyCx: true  },
  { id: "L08", address: "945 Club Dr NW",             lat: 33.8585, lng: -84.3988, yardSqFt: 8900,  opportunity: "Full-Service Bundle",         priority: 91, tags: ["large-yard", "high-income", "dirty-driveway"], hasNearbyCx: false },
  { id: "L09", address: "2105 Loring Rd NE",          lat: 33.8147, lng: -84.3620, yardSqFt: 2800,  opportunity: "Mulch Installation",          priority: 48, tags: [],                                      hasNearbyCx: false },
  { id: "L10", address: "480 Tuxedo Cir NW",          lat: 33.8475, lng: -84.4123, yardSqFt: 11200, opportunity: "Landscaping + Trimming",      priority: 97, tags: ["large-yard", "high-income"],            hasNearbyCx: false },
];

// ── Owner Dashboard KPIs ───────────────────────────────────────────────────
export const DASHBOARD_KPIS = {
  quotesGenerated:    { value: 47,    change: "+12 this week",  up: true  },
  recurringCustomers: { value: 23,    change: "+3 this month",  up: true  },
  routeEfficiency:    { value: "87%", change: "+4% vs last wk", up: true  },
  mrr:                { value: 8240,  change: "+$640 MoM",      up: true  },
  crewUtilization:    { value: "74%", change: "-3% vs last wk", up: false },
  upsellOpportunities:{ value: 11,    change: "4 high priority", up: true  },
};

export const REVENUE_BY_NEIGHBORHOOD = [
  { name: "Buckhead",       revenue: 3200, customers: 8,  color: "#16a34a" },
  { name: "Sandy Springs",  revenue: 1980, customers: 5,  color: "#2563eb" },
  { name: "Marietta",       revenue: 1240, customers: 4,  color: "#7c3aed" },
  { name: "Roswell",        revenue: 890,  customers: 3,  color: "#ea580c" },
  { name: "Decatur",        revenue: 560,  customers: 2,  color: "#0891b2" },
  { name: "Smyrna",         revenue: 370,  customers: 1,  color: "#be123c" },
];

export const WEEKLY_REVENUE = [
  { day: "Mon", revenue: 1240, quotes: 6 },
  { day: "Tue", revenue: 1680, quotes: 9 },
  { day: "Wed", revenue: 980,  quotes: 5 },
  { day: "Thu", revenue: 2100, quotes: 11 },
  { day: "Fri", revenue: 1920, quotes: 10 },
  { day: "Sat", revenue: 640,  quotes: 4  },
  { day: "Sun", revenue: 280,  quotes: 2  },
];

// ── Customer Form Schema ───────────────────────────────────────────────────
export const customerFormSchema = z.object({
  name:      z.string().min(2, "Name is required"),
  email:     z.string().email("Invalid email address"),
  phone:     z.string().min(10, "Valid phone number required"),
  startDate: z.date({ required_error: "A preferred start date is required." }),
  notes:     z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
