import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, jobsTable, assignmentsTable, subcontractorsTable } from "@workspace/db";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

const WorkerJobsParams = z.object({ subId: z.coerce.number().int() });
const WorkerAssignmentParams = z.object({ id: z.coerce.number().int() });

const UpdateStatusBody = z.object({
  status: z.string().min(1),
  completedAt: z.string().nullable().optional(),
  etaMinutes: z.number().optional(),
  declineReason: z.string().optional(),
});

const ToggleOnlineBody = z.object({
  isOnline: z.boolean(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

function formatAssignmentRow(a: {
  assignmentId: number;
  jobId: number;
  subPay: string;
  ownerProfit: string;
  assignmentStatus: string;
  assignedAt: Date;
  acceptedAt: Date | null;
  enRouteAt: Date | null;
  arrivedAt: Date | null;
  completedAt: Date | null;
  declinedAt: Date | null;
  declineReason: string | null;
  etaMinutes: number | null;
}, subId: number, job: typeof jobsTable.$inferSelect) {
  return {
    ...job,
    customerPrice: job.customerPrice ? parseFloat(String(job.customerPrice)) : null,
    latitude: job.latitude ? parseFloat(String(job.latitude)) : null,
    longitude: job.longitude ? parseFloat(String(job.longitude)) : null,
    surgePriceMultiplier: job.surgePriceMultiplier ? parseFloat(String(job.surgePriceMultiplier)) : 1.0,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    assignment: {
      id: a.assignmentId,
      jobId: a.jobId,
      subcontractorId: subId,
      subPay: parseFloat(a.subPay),
      ownerProfit: parseFloat(a.ownerProfit),
      status: a.assignmentStatus,
      assignedAt: a.assignedAt.toISOString(),
      acceptedAt: a.acceptedAt?.toISOString() ?? null,
      enRouteAt: a.enRouteAt?.toISOString() ?? null,
      arrivedAt: a.arrivedAt?.toISOString() ?? null,
      completedAt: a.completedAt?.toISOString() ?? null,
      declinedAt: a.declinedAt?.toISOString() ?? null,
      declineReason: a.declineReason,
      etaMinutes: a.etaMinutes,
    },
  };
}

// GET /worker/profile/:subId
router.get("/worker/profile/:subId", async (req, res): Promise<void> => {
  const params = WorkerJobsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const orgId = getOrgId(req as AuthedRequest);
  const [sub] = await db.select().from(subcontractorsTable).where(and(eq(subcontractorsTable.orgId, orgId), eq(subcontractorsTable.id, params.data.subId)));
  if (!sub) { res.status(404).json({ error: "Subcontractor not found" }); return; }

  res.json({
    ...sub,
    rating: parseFloat(String(sub.rating)),
    completionRate: parseFloat(String(sub.completionRate)),
    totalEarnings: parseFloat(String(sub.totalEarnings)),
    latitude: sub.latitude ? parseFloat(String(sub.latitude)) : null,
    longitude: sub.longitude ? parseFloat(String(sub.longitude)) : null,
  });
});

// PATCH /worker/profile/:subId/toggle-online
router.patch("/worker/profile/:subId/toggle-online", async (req, res): Promise<void> => {
  const params = WorkerJobsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = ToggleOnlineBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const orgId = getOrgId(req as AuthedRequest);
  const updateData: Record<string, unknown> = { isOnline: parsed.data.isOnline };
  if (parsed.data.latitude !== undefined) updateData.latitude = String(parsed.data.latitude);
  if (parsed.data.longitude !== undefined) updateData.longitude = String(parsed.data.longitude);

  const [updated] = await db
    .update(subcontractorsTable)
    .set(updateData as any)
    .where(and(eq(subcontractorsTable.orgId, orgId), eq(subcontractorsTable.id, params.data.subId)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Subcontractor not found" }); return; }
  res.json({ isOnline: updated.isOnline, id: updated.id });
});

// GET /worker/jobs/:subId
router.get("/worker/jobs/:subId", async (req, res): Promise<void> => {
  const params = WorkerJobsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const orgId = getOrgId(req as AuthedRequest);
  const assignments = await db
    .select({
      assignmentId: assignmentsTable.id,
      jobId: assignmentsTable.jobId,
      subPay: assignmentsTable.subPay,
      ownerProfit: assignmentsTable.ownerProfit,
      assignmentStatus: assignmentsTable.status,
      assignedAt: assignmentsTable.assignedAt,
      acceptedAt: assignmentsTable.acceptedAt,
      enRouteAt: assignmentsTable.enRouteAt,
      arrivedAt: assignmentsTable.arrivedAt,
      completedAt: assignmentsTable.completedAt,
      declinedAt: assignmentsTable.declinedAt,
      declineReason: assignmentsTable.declineReason,
      etaMinutes: assignmentsTable.etaMinutes,
    })
    .from(assignmentsTable)
    .where(and(eq(assignmentsTable.orgId, orgId), eq(assignmentsTable.subcontractorId, params.data.subId)));

  if (assignments.length === 0) { res.json([]); return; }

  const jobIds = assignments.map((a) => a.jobId);
  const jobMap = new Map(
    await Promise.all(
      jobIds.map(async (id) => {
        const [j] = await db.select().from(jobsTable).where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, id)));
        return [id, j] as [number, typeof j];
      })
    )
  );

  res.json(
    assignments
      .map((a) => {
        const job = jobMap.get(a.jobId);
        if (!job) return null;
        return formatAssignmentRow(a, params.data.subId, job);
      })
      .filter(Boolean)
  );
});

// GET /worker/earnings/:subId
router.get("/worker/earnings/:subId", async (req, res): Promise<void> => {
  const params = WorkerJobsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const orgId = getOrgId(req as AuthedRequest);
  const rows = await db
    .select({
      subPay: assignmentsTable.subPay,
      status: assignmentsTable.status,
      completedAt: assignmentsTable.completedAt,
      serviceType: jobsTable.serviceType,
    })
    .from(assignmentsTable)
    .leftJoin(jobsTable, eq(assignmentsTable.jobId, jobsTable.id))
    .where(and(eq(assignmentsTable.orgId, orgId), eq(assignmentsTable.subcontractorId, params.data.subId)));

  const completed = rows.filter((r) => r.status === "complete");
  const totalEarned = completed.reduce((s, r) => s + parseFloat(String(r.subPay)), 0);
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const monthEarned = completed
    .filter((r) => r.completedAt && r.completedAt >= thisMonth)
    .reduce((s, r) => s + parseFloat(String(r.subPay)), 0);

  const byService: Record<string, { jobs: number; earned: number }> = {};
  for (const r of completed) {
    const key = r.serviceType ?? "Other";
    if (!byService[key]) byService[key] = { jobs: 0, earned: 0 };
    byService[key].jobs++;
    byService[key].earned += parseFloat(String(r.subPay));
  }

  res.json({
    totalEarned,
    monthEarned,
    totalJobs: completed.length,
    pendingJobs: rows.filter((r) => ["pending", "accepted", "en_route", "arrived"].includes(r.status)).length,
    byService: Object.entries(byService).map(([name, v]) => ({ name, ...v })),
  });
});

// PATCH /worker/assignments/:id/status
router.patch("/worker/assignments/:id/status", async (req, res): Promise<void> => {
  const params = WorkerAssignmentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const orgId = getOrgId(req as AuthedRequest);
  const now = new Date();
  const updateData: Record<string, unknown> = { status: parsed.data.status };

  if (parsed.data.status === "accepted") updateData.acceptedAt = now;
  else if (parsed.data.status === "en_route") updateData.enRouteAt = now;
  else if (parsed.data.status === "arrived") updateData.arrivedAt = now;
  else if (parsed.data.status === "complete") {
    updateData.completedAt = now;
  } else if (parsed.data.status === "declined") {
    updateData.declinedAt = now;
    if (parsed.data.declineReason) updateData.declineReason = parsed.data.declineReason;
  }

  if (parsed.data.etaMinutes !== undefined) updateData.etaMinutes = parsed.data.etaMinutes;

  const [updated] = await db
    .update(assignmentsTable)
    .set(updateData as any)
    .where(and(eq(assignmentsTable.orgId, orgId), eq(assignmentsTable.id, params.data.id)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Assignment not found" }); return; }

  // Sync job status
  if (parsed.data.status === "accepted") {
    await db.update(jobsTable).set({ status: "assigned" }).where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, updated.jobId)));
  } else if (parsed.data.status === "en_route" || parsed.data.status === "arrived") {
    await db.update(jobsTable).set({ status: "in_progress" }).where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, updated.jobId)));
  } else if (parsed.data.status === "complete") {
    await db.update(jobsTable).set({ status: "complete" }).where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, updated.jobId)));
    // Update sub stats
    await db
      .update(subcontractorsTable)
      .set({
        totalJobs: sql`total_jobs + 1`,
        totalEarnings: sql`total_earnings + ${updated.subPay}`,
      })
      .where(and(eq(subcontractorsTable.orgId, orgId), eq(subcontractorsTable.id, updated.subcontractorId)));
  }

  const [subRow] = await db
    .select({ name: subcontractorsTable.name })
    .from(subcontractorsTable)
    .where(and(eq(subcontractorsTable.orgId, orgId), eq(subcontractorsTable.id, updated.subcontractorId)));

  res.json({
    ...updated,
    subName: subRow?.name ?? null,
    subPay: parseFloat(String(updated.subPay)),
    ownerProfit: parseFloat(String(updated.ownerProfit)),
    assignedAt: updated.assignedAt.toISOString(),
    acceptedAt: updated.acceptedAt?.toISOString() ?? null,
    enRouteAt: updated.enRouteAt?.toISOString() ?? null,
    arrivedAt: updated.arrivedAt?.toISOString() ?? null,
    completedAt: updated.completedAt?.toISOString() ?? null,
  });
});

// POST /worker/assignments/:id/rate — customer rates the job
const RateBody = z.object({ jobId: z.number(), rating: z.number().min(1).max(5), review: z.string().optional() });

router.post("/worker/rate", async (req, res): Promise<void> => {
  const parsed = RateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const orgId = getOrgId(req as AuthedRequest);
  const [job] = await db
    .update(jobsTable)
    .set({ customerRating: parsed.data.rating, customerReview: parsed.data.review ?? null, ratedAt: new Date() })
    .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, parsed.data.jobId)))
    .returning();

  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  // Update contractor's average rating (simple rolling approach using stored total)
  const [assignment] = await db
    .select({ subcontractorId: assignmentsTable.subcontractorId })
    .from(assignmentsTable)
    .where(and(eq(assignmentsTable.orgId, orgId), eq(assignmentsTable.jobId, parsed.data.jobId)));

  if (assignment) {
    const [sub] = await db.select().from(subcontractorsTable).where(and(eq(subcontractorsTable.orgId, orgId), eq(subcontractorsTable.id, assignment.subcontractorId)));
    if (sub) {
      const oldRating = parseFloat(String(sub.rating));
      const totalJobs = sub.totalJobs || 1;
      const newRating = ((oldRating * (totalJobs - 1)) + parsed.data.rating) / totalJobs;
      await db
        .update(subcontractorsTable)
        .set({ rating: String(Math.min(5, Math.max(1, newRating)).toFixed(2)) })
        .where(and(eq(subcontractorsTable.orgId, orgId), eq(subcontractorsTable.id, sub.id)));
    }
  }

  res.json({ success: true, rating: parsed.data.rating });
});

export default router;
