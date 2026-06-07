import { Router, type IRouter } from "express";
import { eq, sql, count, and } from "drizzle-orm";
import { db, subcontractorsTable, assignmentsTable, jobsTable } from "@workspace/db";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

const DispatchSuggestionsParams = z.object({ jobId: z.coerce.number().int() });

router.get("/dispatch/suggestions/:jobId", async (req, res): Promise<void> => {
  const params = DispatchSuggestionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const [job] = await db.select().from(jobsTable).where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, params.data.jobId)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const subs = await db.select().from(subcontractorsTable).where(eq(subcontractorsTable.orgId, orgId));

  const suggestions = await Promise.all(
    subs.map(async (sub) => {
      const [activeResult] = await db
        .select({ activeJobs: count() })
        .from(assignmentsTable)
        .where(
          and(
            eq(assignmentsTable.orgId, orgId),
            eq(assignmentsTable.subcontractorId, sub.id),
            sql`${assignmentsTable.status} in ('pending', 'in_progress')`
          )
        );

      const [todayResult] = await db
        .select({ jobsToday: count() })
        .from(assignmentsTable)
        .where(
          and(
            eq(assignmentsTable.orgId, orgId),
            eq(assignmentsTable.subcontractorId, sub.id),
            sql`${assignmentsTable.assignedAt} >= ${todayStart}`
          )
        );

      const activeJobs = Number(activeResult.activeJobs);
      const jobsToday = Number(todayResult.jobsToday);

      const specialtyMatch =
        sub.specialty.toLowerCase().includes(job.serviceType.toLowerCase()) ||
        job.serviceType.toLowerCase().includes(sub.specialty.toLowerCase());

      return {
        subcontractorId: sub.id,
        name: sub.name,
        phone: sub.phone,
        specialty: sub.specialty,
        activeJobs,
        jobsToday,
        isOverbooked: activeJobs >= 5,
        score: (specialtyMatch ? 100 : 0) - activeJobs * 10 - jobsToday * 5,
        recommended: specialtyMatch && activeJobs < 5,
      };
    })
  );

  suggestions.sort((a, b) => b.score - a.score);

  res.json(suggestions);
});

export default router;
