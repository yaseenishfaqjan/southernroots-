import { Router, type IRouter } from "express";
import { and, eq, desc, isNotNull, lte, sql } from "drizzle-orm";
import { db, jobsTable, assignmentsTable, subcontractorsTable } from "@workspace/db";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";
import {
  ListJobsQueryParams,
  CreateJobBody,
  GetJobParams,
  UpdateJobParams,
  UpdateJobBody,
  DeleteJobParams,
  AssignJobParams,
  AssignJobBody,
  UpdateAssignmentParams,
  UpdateAssignmentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getJobWithAssignment(jobId: number, orgId: number) {
  const [job] = await db.select().from(jobsTable).where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, jobId)));
  if (!job) return null;

  const [assignmentRow] = await db
    .select({
      id: assignmentsTable.id,
      jobId: assignmentsTable.jobId,
      subcontractorId: assignmentsTable.subcontractorId,
      subName: subcontractorsTable.name,
      subPay: assignmentsTable.subPay,
      ownerProfit: assignmentsTable.ownerProfit,
      status: assignmentsTable.status,
      assignedAt: assignmentsTable.assignedAt,
      completedAt: assignmentsTable.completedAt,
    })
    .from(assignmentsTable)
    .leftJoin(subcontractorsTable, eq(assignmentsTable.subcontractorId, subcontractorsTable.id))
    .where(and(eq(assignmentsTable.orgId, orgId), eq(assignmentsTable.jobId, jobId)));

  return {
    ...job,
    customerPrice: job.customerPrice ? parseFloat(job.customerPrice) : null,
    assignment: assignmentRow
      ? {
          ...assignmentRow,
          subPay: parseFloat(assignmentRow.subPay),
          ownerProfit: parseFloat(assignmentRow.ownerProfit),
          assignedAt: assignmentRow.assignedAt.toISOString(),
          completedAt: assignmentRow.completedAt ? assignmentRow.completedAt.toISOString() : null,
        }
      : null,
    createdAt: job.createdAt.toISOString(),
  };
}

router.get("/jobs", async (req, res): Promise<void> => {
  const parsed = ListJobsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  let query = db.select().from(jobsTable).$dynamic();
  if (parsed.data.status) {
    query = query.where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.status, parsed.data.status)));
  } else {
    query = query.where(eq(jobsTable.orgId, orgId));
  }

  const jobs = await query.orderBy(desc(jobsTable.createdAt));

  const jobIds = jobs.map((j) => j.id);
  const assignments =
    jobIds.length > 0
      ? await db
          .select({
            id: assignmentsTable.id,
            jobId: assignmentsTable.jobId,
            subcontractorId: assignmentsTable.subcontractorId,
            subName: subcontractorsTable.name,
            subPay: assignmentsTable.subPay,
            ownerProfit: assignmentsTable.ownerProfit,
            status: assignmentsTable.status,
            assignedAt: assignmentsTable.assignedAt,
            completedAt: assignmentsTable.completedAt,
          })
          .from(assignmentsTable)
          .leftJoin(subcontractorsTable, eq(assignmentsTable.subcontractorId, subcontractorsTable.id))
          .where(eq(assignmentsTable.orgId, orgId))
      : [];

  const assignmentMap = new Map(assignments.map((a) => [a.jobId, a]));

  res.json(
    jobs.map((job) => {
      const asgn = assignmentMap.get(job.id);
      return {
        ...job,
        customerPrice: job.customerPrice ? parseFloat(job.customerPrice) : null,
        assignment: asgn
          ? {
              ...asgn,
              subPay: parseFloat(asgn.subPay),
              ownerProfit: parseFloat(asgn.ownerProfit),
              assignedAt: asgn.assignedAt.toISOString(),
              completedAt: asgn.completedAt ? asgn.completedAt.toISOString() : null,
            }
          : null,
        createdAt: job.createdAt.toISOString(),
      };
    })
  );
});

router.post("/jobs", async (req, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const [job] = await db
    .insert(jobsTable)
    .values({
      orgId,
      ...parsed.data,
      customerPrice: parsed.data.customerPrice != null ? String(parsed.data.customerPrice) : null,
    })
    .returning();

  res.status(201).json({
    ...job,
    customerPrice: job.customerPrice ? parseFloat(job.customerPrice) : null,
    assignment: null,
    createdAt: job.createdAt.toISOString(),
  });
});

router.get("/jobs/stale", async (req, res): Promise<void> => {
  const orgId = getOrgId(req as AuthedRequest);
  const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const jobs = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.orgId, orgId), sql`${jobsTable.status} = 'new' and ${jobsTable.createdAt} <= ${staleThreshold}`))
    .orderBy(desc(jobsTable.createdAt));

  res.json(
    jobs.map((job) => ({
      ...job,
      customerPrice: job.customerPrice ? parseFloat(job.customerPrice) : null,
      assignment: null,
      createdAt: job.createdAt.toISOString(),
    }))
  );
});

router.get("/jobs/recent", async (req, res): Promise<void> => {
  const orgId = getOrgId(req as AuthedRequest);
  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.orgId, orgId)).orderBy(desc(jobsTable.createdAt)).limit(10);

  const jobIds = jobs.map((j) => j.id);
  const assignments =
    jobIds.length > 0
      ? await db
          .select({
            id: assignmentsTable.id,
            jobId: assignmentsTable.jobId,
            subcontractorId: assignmentsTable.subcontractorId,
            subName: subcontractorsTable.name,
            subPay: assignmentsTable.subPay,
            ownerProfit: assignmentsTable.ownerProfit,
            status: assignmentsTable.status,
            assignedAt: assignmentsTable.assignedAt,
            completedAt: assignmentsTable.completedAt,
          })
          .from(assignmentsTable)
          .leftJoin(subcontractorsTable, eq(assignmentsTable.subcontractorId, subcontractorsTable.id))
          .where(eq(assignmentsTable.orgId, orgId))
      : [];

  const assignmentMap = new Map(assignments.map((a) => [a.jobId, a]));

  res.json(
    jobs.map((job) => {
      const asgn = assignmentMap.get(job.id);
      return {
        ...job,
        customerPrice: job.customerPrice ? parseFloat(job.customerPrice) : null,
        assignment: asgn
          ? {
              ...asgn,
              subPay: parseFloat(asgn.subPay),
              ownerProfit: parseFloat(asgn.ownerProfit),
              assignedAt: asgn.assignedAt.toISOString(),
              completedAt: asgn.completedAt ? asgn.completedAt.toISOString() : null,
            }
          : null,
        createdAt: job.createdAt.toISOString(),
      };
    })
  );
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const job = await getJobWithAssignment(params.data.id, orgId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(job);
});

router.patch("/jobs/:id", async (req, res): Promise<void> => {
  const params = UpdateJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.customerPrice != null) {
    updateData.customerPrice = String(parsed.data.customerPrice);
  }

  const [updated] = await db
    .update(jobsTable)
    .set(updateData as Parameters<typeof db.update>[0] extends infer T ? T : never)
    .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, params.data.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const job = await getJobWithAssignment(params.data.id, orgId);
  res.json(job);
});

router.delete("/jobs/:id", async (req, res): Promise<void> => {
  const params = DeleteJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const [deleted] = await db.delete(jobsTable).where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, params.data.id))).returning();

  if (!deleted) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/jobs/:id/assign", async (req, res): Promise<void> => {
  const params = AssignJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AssignJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const [job] = await db.select().from(jobsTable).where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, params.data.id)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const [sub] = await db
    .select()
    .from(subcontractorsTable)
    .where(and(eq(subcontractorsTable.orgId, orgId), eq(subcontractorsTable.id, parsed.data.subcontractorId)));
  if (!sub) {
    res.status(404).json({ error: "Subcontractor not found" });
    return;
  }

  const customerPrice = parsed.data.customerPrice ?? (job.customerPrice ? parseFloat(job.customerPrice) : 0);
  const ownerProfit = customerPrice - parsed.data.subPay;

  if (parsed.data.customerPrice != null) {
    await db
      .update(jobsTable)
      .set({ customerPrice: String(customerPrice), status: "assigned" })
      .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, params.data.id)));
  } else {
    await db.update(jobsTable).set({ status: "assigned" }).where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, params.data.id)));
  }

  const [assignment] = await db
    .insert(assignmentsTable)
    .values({
      orgId,
      jobId: params.data.id,
      subcontractorId: parsed.data.subcontractorId,
      subPay: String(parsed.data.subPay),
      ownerProfit: String(ownerProfit),
    })
    .returning();

  res.status(201).json({
    ...assignment,
    subName: sub.name,
    subPay: parseFloat(assignment.subPay),
    ownerProfit: parseFloat(assignment.ownerProfit),
    assignedAt: assignment.assignedAt.toISOString(),
    completedAt: null,
  });
});

router.patch("/assignments/:id", async (req, res): Promise<void> => {
  const params = UpdateAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const updateData: Record<string, unknown> = {};
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if (parsed.data.completedAt != null) updateData.completedAt = new Date(parsed.data.completedAt);

  const [updated] = await db
    .update(assignmentsTable)
    .set(updateData as Parameters<typeof db.update>[0] extends infer T ? T : never)
    .where(and(eq(assignmentsTable.orgId, orgId), eq(assignmentsTable.id, params.data.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  const [subRow] = await db
    .select({ name: subcontractorsTable.name })
    .from(subcontractorsTable)
    .where(and(eq(subcontractorsTable.orgId, orgId), eq(subcontractorsTable.id, updated.subcontractorId)));

  res.json({
    ...updated,
    subName: subRow?.name ?? null,
    subPay: parseFloat(updated.subPay),
    ownerProfit: parseFloat(updated.ownerProfit),
    assignedAt: updated.assignedAt.toISOString(),
    completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
  });
});

export default router;
