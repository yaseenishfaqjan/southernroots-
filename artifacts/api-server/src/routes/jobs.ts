import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, eq, desc, isNotNull, lte, sql } from "drizzle-orm";
import { db, jobsTable, assignmentsTable, subcontractorsTable, customersTable, invoicesTable } from "@workspace/db";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";
import {
  ListJobsQueryParams,
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

function formatJob(job: typeof jobsTable.$inferSelect) {
  return {
    ...job,
    scheduledDate: job.scheduledDate?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

async function getJob(jobId: number, orgId: number) {
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, jobId)));
  return job ? formatJob(job) : null;
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
  res.json(jobs.map(formatJob));
});

const CreateJobInput = z.object({
  customerId: z.coerce.number().int(),
  serviceType: z.string().min(1),
  priceCents: z.coerce.number().int().nonnegative().default(0),
  scheduledDate: z.string().nullish(),
  notes: z.string().nullish(),
});

router.post("/jobs", async (req, res): Promise<void> => {
  const parsed = CreateJobInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const orgId = getOrgId(req as AuthedRequest);

  // Tenant safety: the customer must belong to this org.
  const [customer] = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(and(eq(customersTable.orgId, orgId), eq(customersTable.id, parsed.data.customerId)));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const [job] = await db
    .insert(jobsTable)
    .values({
      orgId,
      customerId: parsed.data.customerId,
      serviceType: parsed.data.serviceType,
      priceCents: parsed.data.priceCents,
      scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : null,
      notes: parsed.data.notes ?? null,
      status: "new",
    })
    .returning();

  res.status(201).json({
    ...job,
    scheduledDate: job.scheduledDate?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
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

  res.json(jobs.map(formatJob));
});

router.get("/jobs/recent", async (req, res): Promise<void> => {
  const orgId = getOrgId(req as AuthedRequest);
  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.orgId, orgId)).orderBy(desc(jobsTable.createdAt)).limit(10);
  res.json(jobs.map(formatJob));
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const job = await getJob(params.data.id, orgId);
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
  // Only set columns that actually exist on the jobs table.
  const updateData: Partial<typeof jobsTable.$inferInsert> = {};
  if (parsed.data.serviceType !== undefined) updateData.serviceType = parsed.data.serviceType;
  if (parsed.data.status !== undefined) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "complete") updateData.completedAt = new Date();
  }
  if (parsed.data.notes !== undefined && parsed.data.notes !== null) updateData.notes = parsed.data.notes;

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No updatable fields provided" });
    return;
  }

  const [updated] = await db
    .update(jobsTable)
    .set(updateData)
    .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, params.data.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  // When a job is completed, auto-generate an invoice once (powers the
  // Revenue / Outstanding Invoices KPIs and the billing flow).
  if (parsed.data.status === "complete") {
    const [existingInvoice] = await db
      .select({ id: invoicesTable.id })
      .from(invoicesTable)
      .where(and(eq(invoicesTable.orgId, orgId), eq(invoicesTable.jobId, updated.id)));
    if (!existingInvoice) {
      await db.insert(invoicesTable).values({
        orgId,
        customerId: updated.customerId,
        jobId: updated.id,
        amountCents: updated.priceCents,
        status: "sent",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
    }
  }

  const job = await getJob(params.data.id, orgId);
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
