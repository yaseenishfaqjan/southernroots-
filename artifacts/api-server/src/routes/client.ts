import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, jobsTable, assignmentsTable, subcontractorsTable } from "@workspace/db";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

const ClientLookupBody = z.object({
  phone: z.string().min(1),
  jobId: z.number().int(),
});

const CreateJobBody = z.object({
  customerName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  serviceType: z.string().min(1),
  planName: z.string().nullable().optional(),
  customerPrice: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

function formatJob(
  job: typeof jobsTable.$inferSelect,
  assignment: {
    id: number;
    jobId: number;
    subcontractorId: number;
    subName: string | null;
    subPay: string;
    ownerProfit: string;
    status: string;
    assignedAt: Date;
    completedAt: Date | null;
  } | null
) {
  return {
    ...job,
    customerPrice: job.customerPrice ? parseFloat(job.customerPrice) : null,
    createdAt: job.createdAt.toISOString(),
    assignment: assignment
      ? {
          ...assignment,
          subPay: parseFloat(assignment.subPay),
          ownerProfit: parseFloat(assignment.ownerProfit),
          assignedAt: assignment.assignedAt.toISOString(),
          completedAt: assignment.completedAt ? assignment.completedAt.toISOString() : null,
        }
      : null,
  };
}

router.post("/client/lookup", async (req, res): Promise<void> => {
  const parsed = ClientLookupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Normalize phone: strip all non-digits for comparison so (678) 555-0114, 6785550114, 678-555-0114 all match
  const digitsOnly = parsed.data.phone.replace(/\D/g, "");

  const orgId = getOrgId(req as AuthedRequest);
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(
      and(
        eq(jobsTable.orgId, orgId),
        eq(jobsTable.id, parsed.data.jobId),
        sql`regexp_replace(${jobsTable.phone}, '[^0-9]', '', 'g') = ${digitsOnly}`
      )
    );

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

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
    .where(and(eq(assignmentsTable.orgId, orgId), eq(assignmentsTable.jobId, job.id)));

  res.json(formatJob(job, assignmentRow ?? null));
});

router.post("/client/request", async (req, res): Promise<void> => {
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

  res.status(201).json(formatJob(job, null));
});

export default router;
