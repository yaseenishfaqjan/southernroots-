import { Router, type IRouter } from "express";
import { eq, and, sql, ne } from "drizzle-orm";
import { db, jobsTable, assignmentsTable, subcontractorsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

// Haversine distance in miles between two lat/lng points
function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /matching/contractors-near/:jobId  — find online contractors near a job
router.get("/matching/contractors-near/:jobId", async (req, res): Promise<void> => {
  const jobId = parseInt(req.params.jobId);
  if (isNaN(jobId)) { res.status(400).json({ error: "Invalid job ID" }); return; }

  const radiusMiles = parseFloat(String(req.query.radius ?? "10"));

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  if (!job.latitude || !job.longitude) { res.status(400).json({ error: "Job has no location" }); return; }

  const subs = await db.select().from(subcontractorsTable).where(eq(subcontractorsTable.isOnline, true));

  const jLat = parseFloat(String(job.latitude));
  const jLng = parseFloat(String(job.longitude));

  const allSubs = await db.select().from(subcontractorsTable);

  const nearby = allSubs
    .filter((s) => s.latitude && s.longitude)
    .map((s) => {
      const distanceMiles = haversineMiles(jLat, jLng, parseFloat(String(s.latitude)), parseFloat(String(s.longitude)));
      const etaMinutes = Math.round(distanceMiles * 4);
      const rating = parseFloat(String(s.rating ?? 4.0));
      const cr = parseFloat(String(s.completionRate ?? 0.85));
      const score = rating + cr * 2 - distanceMiles * 0.1;
      return { ...s, distanceMiles, etaMinutes, score: parseFloat(score.toFixed(2)) };
    })
    .filter((s) => s.distanceMiles <= radiusMiles || !s.isOnline === false)
    .filter((s) => s.distanceMiles <= radiusMiles * 2) // show offline subs up to 2x radius
    .sort((a, b) => {
      // Online first, then by score
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return b.score - a.score;
    });

  res.json({ job, contractors: nearby, radiusMiles });
});

// POST /matching/dispatch  — auto-dispatch or manual dispatch to a specific contractor
const DispatchBody = z.object({
  jobId: z.number().int(),
  contractorId: z.number().int().optional(),
});

router.post("/matching/dispatch", async (req, res): Promise<void> => {
  const parsed = DispatchBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { jobId, contractorId } = parsed.data;

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  let selectedSub: typeof subcontractorsTable.$inferSelect | undefined;

  if (contractorId) {
    const [s] = await db.select().from(subcontractorsTable).where(eq(subcontractorsTable.id, contractorId));
    selectedSub = s;
  } else {
    // Auto-dispatch: pick the best online contractor nearby
    const subs = await db.select().from(subcontractorsTable).where(eq(subcontractorsTable.isOnline, true));
    const jLat = job.latitude ? parseFloat(String(job.latitude)) : null;
    const jLng = job.longitude ? parseFloat(String(job.longitude)) : null;

    if (subs.length === 0) {
      res.json({ success: false, message: "No online contractors available" });
      return;
    }

    const scored = subs.map((s) => {
      let score = parseFloat(String(s.rating ?? 4.0));
      const cr = parseFloat(String(s.completionRate ?? 0.85));
      score += cr * 2;
      if (jLat && jLng && s.latitude && s.longitude) {
        const dist = haversineMiles(jLat, jLng, parseFloat(String(s.latitude)), parseFloat(String(s.longitude)));
        score -= dist * 0.1;
      }
      return { ...s, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);
    selectedSub = scored[0];
  }

  if (!selectedSub) {
    res.json({ success: false, message: "Contractor not found" });
    return;
  }

  // Calculate pay based on job price with 30% owner margin
  const customerPrice = job.customerPrice ? parseFloat(String(job.customerPrice)) : 120;
  const subPay = parseFloat((customerPrice * 0.7).toFixed(2));
  const ownerProfit = parseFloat((customerPrice - subPay).toFixed(2));

  // Delete any previous assignment
  await db.delete(assignmentsTable).where(eq(assignmentsTable.jobId, jobId));

  const [assignment] = await db
    .insert(assignmentsTable)
    .values({
      jobId,
      subcontractorId: selectedSub.id,
      subPay: String(subPay),
      ownerProfit: String(ownerProfit),
      status: "pending",
    })
    .returning();

  await db.update(jobsTable).set({ status: "assigned" }).where(eq(jobsTable.id, jobId));

  res.json({ success: true, assignment, contractorName: selectedSub.name, subPay, ownerProfit });
});

// GET /matching/surge-price/:jobId  — calculate surge multiplier suggestion
router.get("/matching/surge-price/:jobId", async (req, res): Promise<void> => {
  const jobId = parseInt(req.params.jobId);
  if (isNaN(jobId)) { res.status(400).json({ error: "Invalid job ID" }); return; }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const onlineSubs = await db
    .select({ count: sql<number>`count(*)` })
    .from(subcontractorsTable)
    .where(eq(subcontractorsTable.isOnline, true));

  const pendingJobs = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobsTable)
    .where(eq(jobsTable.status, "new"));

  const onlineCount = Number(onlineSubs[0]?.count ?? 0);
  const demandCount = Number(pendingJobs[0]?.count ?? 0);

  let multiplier = 1.0;
  let reason = "Normal pricing";

  if (onlineCount === 0) {
    multiplier = 1.5;
    reason = "No contractors online — high surge";
  } else {
    const ratio = demandCount / onlineCount;
    if (ratio > 3) { multiplier = 1.35; reason = "High demand, limited supply"; }
    else if (ratio > 2) { multiplier = 1.20; reason = "Moderate demand surge"; }
    else if (ratio > 1.5) { multiplier = 1.10; reason = "Slight surge"; }
  }

  if (job.urgency === "urgent") multiplier = Math.max(multiplier, 1.15);
  multiplier = Math.min(multiplier, 2.0);

  res.json({
    multiplier,
    reason,
    basePrice: job.customerPrice ? parseFloat(String(job.customerPrice)) : null,
    suggestedPrice: job.customerPrice ? parseFloat((parseFloat(String(job.customerPrice)) * multiplier).toFixed(2)) : null,
    onlineContractors: onlineCount,
    pendingJobs: demandCount,
  });
});

export default router;
