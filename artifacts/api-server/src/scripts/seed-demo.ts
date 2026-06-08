// Seed a full, realistic DEMO dataset for showing the product to clients.
// Creates (or reuses) the owner login jim@jobtest.com / password123 and fills
// every dashboard page with customers, properties, quotes, jobs, crews,
// assignments, invoices, AI decisions and escalations.
//
// Idempotent: re-running wipes this org's business data and re-seeds it fresh.
//
// Usage:  node --import tsx/esm artifacts/api-server/src/scripts/seed-demo.ts
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  organizationsTable,
  customersTable,
  propertiesTable,
  quotesTable,
  jobsTable,
  workersTable,
  assignmentsTable,
  invoicesTable,
  escalationsTable,
  aiDecisionsTable,
  kpiSnapshotsTable,
} from "@workspace/db";
import { hashPassword } from "../lib/auth";

const OWNER_EMAIL = "jim@jobtest.com";
const OWNER_PASSWORD = "password123";
const OWNER_NAME = "Jim Carter";
const ORG_NAME = "Southern Roots Turf";

const now = Date.now();
const days = (n: number) => new Date(now - n * 86_400_000);
const fromNow = (n: number) => new Date(now + n * 86_400_000);
const token = (i: number) => `demo-crew-${i}-${(now % 1_000_000).toString(36)}`;

async function main() {
  // ── 1. Org + owner (reuse if present) ────────────────────────────────────
  let [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.slug, "southern-roots-turf"));
  if (!org) {
    [org] = await db
      .insert(organizationsTable)
      .values({ name: ORG_NAME, slug: "southern-roots-turf", plan: "growth", status: "active", trialEndsAt: fromNow(14) })
      .returning();
  }
  const orgId = org.id;

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, OWNER_EMAIL));
  if (!existingUser) {
    await db.insert(usersTable).values({
      orgId,
      email: OWNER_EMAIL,
      passwordHash: await hashPassword(OWNER_PASSWORD),
      name: OWNER_NAME,
      role: "owner",
      emailVerified: true,
    });
  }

  // ── 2. Wipe this org's business data (FK-safe order) so re-runs are clean ─
  await db.delete(assignmentsTable).where(eq(assignmentsTable.orgId, orgId));
  await db.delete(invoicesTable).where(eq(invoicesTable.orgId, orgId));
  await db.delete(escalationsTable).where(eq(escalationsTable.orgId, orgId));
  await db.delete(jobsTable).where(eq(jobsTable.orgId, orgId));
  await db.delete(quotesTable).where(eq(quotesTable.orgId, orgId));
  await db.delete(propertiesTable).where(eq(propertiesTable.orgId, orgId));
  await db.delete(aiDecisionsTable).where(eq(aiDecisionsTable.orgId, orgId));
  await db.delete(kpiSnapshotsTable).where(eq(kpiSnapshotsTable.orgId, orgId));
  await db.delete(customersTable).where(eq(customersTable.orgId, orgId));
  await db.delete(workersTable).where(eq(workersTable.orgId, orgId));

  // ── 3. Crew (workers) ─────────────────────────────────────────────────────
  const crewSeed = [
    { name: "Marcus Reed", phone: "+14045550112", email: "marcus@srt.demo", specialty: "general", rating: 4.9, completionRate: 0.98, currentJobCount: 2, homeAddress: "Decatur, GA" },
    { name: "Tyler Brooks", phone: "+14045550133", email: "tyler@srt.demo", specialty: "landscaping", rating: 4.7, completionRate: 0.95, currentJobCount: 1, homeAddress: "Marietta, GA" },
    { name: "Diego Santos", phone: "+14045550148", email: "diego@srt.demo", specialty: "pressure_washing", rating: 4.8, completionRate: 0.97, currentJobCount: 1, homeAddress: "Smyrna, GA" },
    { name: "Andre Wilson", phone: "+14045550159", email: "andre@srt.demo", specialty: "aeration", rating: 4.6, completionRate: 0.92, currentJobCount: 0, homeAddress: "Roswell, GA" },
    { name: "Cody Nguyen", phone: "+14045550171", email: "cody@srt.demo", specialty: "general", rating: 4.85, completionRate: 0.96, currentJobCount: 0, homeAddress: "Sandy Springs, GA" },
  ];
  const crew = await db.insert(workersTable).values(
    crewSeed.map((w, i) => ({ ...w, orgId, isActive: true, accessToken: token(i) })),
  ).returning();

  // ── 4. Customers ──────────────────────────────────────────────────────────
  const custSeed = [
    { name: "Sarah Mitchell", email: "powerwealthenterprise@gmail.com", phone: "+14045550201", address: "412 Oakdale Rd NE, Atlanta, GA 30307", tier: "premium", mrr: 18900, churnRisk: 0.08, lat: 33.769, lng: -84.338, sqft: 6200 },
    { name: "James Patterson", email: "jpatterson@example.com", phone: "+14045550202", address: "88 Lakeshore Dr, Marietta, GA 30062", tier: "premium", mrr: 24900, churnRisk: 0.05, lat: 33.952, lng: -84.549, sqft: 9100 },
    { name: "Linda Howard", email: "lhoward@example.com", phone: "+14045550203", address: "1505 Pine Valley Ct, Roswell, GA 30075", tier: "standard", mrr: 9900, churnRisk: 0.74, lat: 34.023, lng: -84.361, sqft: 4300 },
    { name: "Robert Chen", email: "rchen@example.com", phone: "+14045550204", address: "27 Magnolia St, Decatur, GA 30030", tier: "standard", mrr: 9900, churnRisk: 0.12, lat: 33.774, lng: -84.296, sqft: 3800 },
    { name: "Emily Davis", email: "edavis@example.com", phone: "+14045550205", address: "660 Brookhaven Ave, Atlanta, GA 30319", tier: "premium", mrr: 21900, churnRisk: 0.18, lat: 33.866, lng: -84.337, sqft: 7400 },
    { name: "Michael Torres", email: "mtorres@example.com", phone: "+14045550206", address: "313 Willow Bend, Smyrna, GA 30080", tier: "standard", mrr: 9900, churnRisk: 0.81, lat: 33.884, lng: -84.514, sqft: 4100 },
    { name: "Jessica Lee", email: "jlee@example.com", phone: "+14045550207", address: "905 Highland Park Dr, Sandy Springs, GA 30328", tier: "premium", mrr: 18900, churnRisk: 0.09, lat: 33.924, lng: -84.378, sqft: 6800 },
    { name: "David Brooks", email: "dbrooks@example.com", phone: "+14045550208", address: "144 Sycamore Ln, Alpharetta, GA 30009", tier: "standard", mrr: 0, churnRisk: 0.33, lat: 34.075, lng: -84.294, sqft: 5200 },
    { name: "Amanda White", email: "awhite@example.com", phone: "+14045550209", address: "72 Riverside Dr NW, Atlanta, GA 30328", tier: "standard", mrr: 9900, churnRisk: 0.21, lat: 33.913, lng: -84.421, sqft: 4600 },
    { name: "Chris Walker", email: "cwalker@example.com", phone: "+14045550210", address: "501 Dogwood Trce, Kennesaw, GA 30144", tier: "standard", mrr: 0, churnRisk: 0.45, lat: 34.025, lng: -84.615, sqft: 5000 },
  ];
  const customers = await db.insert(customersTable).values(
    custSeed.map((c) => ({ orgId, name: c.name, email: c.email, phone: c.phone, address: c.address, tier: c.tier, mrr: c.mrr, churnRisk: c.churnRisk })),
  ).returning();

  // Properties (one per customer, AI-measured)
  const properties = await db.insert(propertiesTable).values(
    customers.map((c, i) => ({
      orgId, customerId: c.id, address: custSeed[i].address,
      lat: custSeed[i].lat, lng: custSeed[i].lng, sqftLawn: custSeed[i].sqft,
      sqftDriveway: Math.round(custSeed[i].sqft * 0.12),
      complexity: custSeed[i].sqft > 7000 ? "complex" : custSeed[i].sqft > 4500 ? "moderate" : "simple",
      lastAnalyzedAt: days(i + 1),
    })),
  ).returning();
  const propOf = (ci: number) => properties.find((p) => p.customerId === customers[ci].id)?.id;

  // ── 5. Quotes (drives conversion rate) ────────────────────────────────────
  const quoteSeed = [
    { ci: 0, status: "accepted", cents: 18900, svc: "Weekly mowing + edging", days: 9 },
    { ci: 1, status: "accepted", cents: 24900, svc: "Full landscaping package", days: 12 },
    { ci: 4, status: "accepted", cents: 21900, svc: "Bi-weekly mowing + hedges", days: 6 },
    { ci: 6, status: "accepted", cents: 18900, svc: "Weekly mowing", days: 4 },
    { ci: 7, status: "sent", cents: 14500, svc: "One-time cleanup + aeration", days: 2 },
    { ci: 9, status: "sent", cents: 16000, svc: "Mowing + pressure washing", days: 1 },
    { ci: 8, status: "draft", cents: 9900, svc: "Weekly mowing", days: 3 },
  ];
  await db.insert(quotesTable).values(
    quoteSeed.map((q) => ({
      orgId, customerId: customers[q.ci].id, propertyId: propOf(q.ci),
      services: [{ name: q.svc, price: q.cents / 100, description: "AI-measured from satellite imagery" }],
      totalCents: q.cents, status: q.status,
      aiReasoning: `Measured ${custSeed[q.ci].sqft.toLocaleString()} sqft of lawn from satellite. Priced at market rate for ${custSeed[q.ci].address.split(",")[1]?.trim()} with ${q.svc.toLowerCase()}.`,
      sentAt: q.status === "draft" ? null : days(q.days),
      acceptedAt: q.status === "accepted" ? days(q.days - 1) : null,
    })),
  ).returning();

  // ── 6. Jobs (across the workflow) + assignments + invoices ────────────────
  const jobSeed = [
    { ci: 0, svc: "mowing", status: "paid", cents: 18900, crew: 0, doneDaysAgo: 5 },
    { ci: 1, svc: "landscaping", status: "paid", cents: 24900, crew: 1, doneDaysAgo: 3 },
    { ci: 4, svc: "hedges", status: "complete", cents: 21900, crew: 2, doneDaysAgo: 2 },
    { ci: 6, svc: "mowing", status: "complete", cents: 18900, crew: 0, doneDaysAgo: 1 },
    { ci: 3, svc: "mowing", status: "in_progress", cents: 9900, crew: 1, schedIn: 0 },
    { ci: 8, svc: "mowing", status: "assigned", cents: 9900, crew: 2, schedIn: 1 },
    { ci: 2, svc: "aeration", status: "new", cents: 13500, crew: null, schedIn: 2 },
    { ci: 5, svc: "pressure_washing", status: "new", cents: 16000, crew: null, schedIn: 3 },
  ];
  for (const j of jobSeed) {
    const [job] = await db.insert(jobsTable).values({
      orgId, customerId: customers[j.ci].id, propertyId: propOf(j.ci),
      serviceType: j.svc, status: j.status, priceCents: j.cents,
      scheduledDate: j.schedIn != null ? fromNow(j.schedIn) : days(j.doneDaysAgo!),
      completedAt: j.doneDaysAgo != null ? days(j.doneDaysAgo) : null,
      notes: "Demo job",
    }).returning();

    if (j.crew != null) {
      const aStatus = j.status === "in_progress" ? "in_progress" : ["complete", "paid"].includes(j.status) ? "complete" : "pending";
      await db.insert(assignmentsTable).values({
        orgId, jobId: job.id, workerId: crew[j.crew].id, status: aStatus,
        assignedAt: days(j.doneDaysAgo ?? 0),
        completedAt: ["complete", "paid"].includes(j.status) ? days(j.doneDaysAgo!) : null,
      });
    }

    // Invoices for finished work
    if (j.status === "paid") {
      await db.insert(invoicesTable).values({
        orgId, customerId: customers[j.ci].id, jobId: job.id, amountCents: j.cents,
        status: "paid", dueDate: days(j.doneDaysAgo! - 7), paidAt: days(j.doneDaysAgo! - 1),
      });
    } else if (j.status === "complete") {
      await db.insert(invoicesTable).values({
        orgId, customerId: customers[j.ci].id, jobId: job.id, amountCents: j.cents,
        status: "sent", dueDate: fromNow(7),
      });
    }
  }
  // An overdue invoice (so the billing agent has something to chase)
  await db.insert(invoicesTable).values({
    orgId, customerId: customers[2].id, amountCents: 9900, status: "overdue",
    dueDate: days(10), reminderCount: 2, lastReminderAt: days(2),
  });

  // ── 7. AI decisions (the autonomy story) ──────────────────────────────────
  await db.insert(aiDecisionsTable).values([
    { orgId, agent: "quote", reasoning: "New lead at 412 Oakdale Rd. Measured 6,200 sqft lawn from satellite, priced weekly mowing at $189/mo, emailed quote.", input: { address: "412 Oakdale Rd NE, Atlanta, GA" }, output: { totalCents: 18900, status: "sent" }, executedAt: days(9) },
    { orgId, agent: "quote", reasoning: "Lead at 88 Lakeshore Dr — 9,100 sqft complex lot. Recommended full landscaping package at $249/mo.", input: { address: "88 Lakeshore Dr, Marietta, GA" }, output: { totalCents: 24900 }, executedAt: days(12) },
    { orgId, agent: "dispatch", reasoning: "Assigned Marcus Reed to the Mitchell mowing job — closest crew (Decatur) with capacity and 4.9 rating.", input: { jobId: 1 }, output: { workerId: crew[0].id, worker: "Marcus Reed" }, executedAt: days(5) },
    { orgId, agent: "billing", reasoning: "Job #1 marked complete → auto-generated invoice for $189 and emailed payment link to customer.", input: { jobId: 1 }, output: { amountCents: 18900, status: "sent" }, executedAt: days(4) },
    { orgId, agent: "billing", reasoning: "Howard invoice 10 days overdue. Sent 2nd reminder email; flagged for review if unpaid in 3 days.", input: { invoiceId: 99 }, output: { reminderCount: 2 }, executedAt: days(2) },
    { orgId, agent: "churn", reasoning: "Michael Torres churn risk rose to 0.81 (2 missed visits + no reply). Recommended retention offer.", input: { customerId: customers[5].id }, output: { churnRisk: 0.81, action: "retention_offer" }, executedAt: days(1) },
    { orgId, agent: "upsell", reasoning: "Patterson lawn shows summer growth surge. Suggested adding bi-weekly hedge trimming (+$60/mo).", input: { customerId: customers[1].id }, output: { upsell: "hedge_trimming", addMrr: 6000 }, executedAt: days(3) },
    { orgId, agent: "briefing", reasoning: "Daily owner briefing: 4 jobs completed, $437 collected, 2 quotes pending, 1 overdue invoice, crew utilization 60%.", input: { date: days(0).toISOString().slice(0, 10) }, output: { revenue: 43700, jobsDone: 4 }, executedAt: days(0) },
    { orgId, agent: "communication", reasoning: "Customer Davis replied asking to reschedule. Moved hedge job to next available slot and confirmed by email.", input: { customerId: customers[4].id }, output: { rescheduled: true }, executedAt: days(2) },
  ]);

  // ── 8. Escalations (a couple, so the page isn't empty) ────────────────────
  await db.insert(escalationsTable).values([
    { orgId, customerId: customers[5].id, reason: "Customer disputed last invoice amount — needs owner review.", status: "open" },
    { orgId, customerId: customers[2].id, reason: "Repeat no-access at property; crew couldn't complete service twice.", status: "open" },
  ]);

  // ── 9. KPI snapshots (last 14 days, for trends) ───────────────────────────
  await db.insert(kpiSnapshotsTable).values(
    Array.from({ length: 14 }, (_, k) => {
      const d = 13 - k;
      return { orgId, date: days(d), totalRevenueCents: 35000 + k * 4200, jobsCompleted: 2 + (k % 4), newLeads: 1 + (k % 3), crewUtilization: 0.5 + (k % 5) * 0.08, mrrCents: 138000 + k * 2000, churnCount: k % 3 === 0 ? 1 : 0 };
    }),
  );

  console.log("✅ Demo seeded for org", orgId, "(" + ORG_NAME + ")");
  console.log("   Login:", OWNER_EMAIL, "/", OWNER_PASSWORD);
  console.log("   " + customers.length + " customers, " + crew.length + " crew, " + jobSeed.length + " jobs, quotes, invoices, AI decisions.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
