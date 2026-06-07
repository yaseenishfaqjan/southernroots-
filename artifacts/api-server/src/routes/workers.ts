import { Router, type IRouter } from "express";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db, workersTable, jobsTable, assignmentsTable } from "@workspace/db";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const WorkerIdParam = z.object({ id: z.coerce.number().int() });

const CreateWorkerBody = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  specialty: z
    .enum(["general", "landscaping", "pressure_washing", "aeration"])
    .optional(),
  homeAddress: z.string().optional(),
});

const PatchWorkerBody = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  specialty: z
    .enum(["general", "landscaping", "pressure_washing", "aeration"])
    .optional(),
  isActive: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  homeAddress: z.string().nullable().optional(),
});

function formatWorker(row: typeof workersTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    specialty: row.specialty,
    rating: row.rating,
    completionRate: row.completionRate,
    activeJobCount: row.currentJobCount,
    todayJobCount: 0,
    status: row.isActive ? "active" : "inactive",
    homeAddress: row.homeAddress,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /workers
router.get("/workers", async (req, res): Promise<void> => {
  try {
    const orgId = getOrgId(req as AuthedRequest);
    const rows = await db
      .select()
      .from(workersTable)
      .where(eq(workersTable.orgId, orgId))
      .orderBy(desc(workersTable.createdAt));
    res.json(rows.map(formatWorker));
  } catch (err) {
    logger.error({ err }, "GET /workers failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /workers
router.post("/workers", async (req, res): Promise<void> => {
  const parsed = CreateWorkerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const orgId = getOrgId(req as AuthedRequest);
    const [worker] = await db
      .insert(workersTable)
      .values({
        orgId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email ?? null,
        specialty: parsed.data.specialty ?? "general",
        homeAddress: parsed.data.homeAddress ?? null,
      })
      .returning();
    res.status(201).json(formatWorker(worker));
  } catch (err) {
    logger.error({ err }, "POST /workers failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /workers/:id — with today's jobs
router.get("/workers/:id", async (req, res): Promise<void> => {
  const params = WorkerIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const orgId = getOrgId(req as AuthedRequest);
    const [worker] = await db
      .select()
      .from(workersTable)
      .where(and(eq(workersTable.orgId, orgId), eq(workersTable.id, params.data.id)));

    if (!worker) {
      res.status(404).json({ error: "Worker not found" });
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Jobs assigned to this worker today via assignments
    const todayAssignments = await db
      .select({
        assignment: assignmentsTable,
        job: jobsTable,
      })
      .from(assignmentsTable)
      .leftJoin(jobsTable, eq(assignmentsTable.jobId, jobsTable.id))
      .where(
        and(
          eq(assignmentsTable.orgId, orgId),
          eq(assignmentsTable.workerId, params.data.id),
          gte(jobsTable.scheduledDate, todayStart),
          lte(jobsTable.scheduledDate, todayEnd)
        )
      );

    res.json({
      ...formatWorker(worker),
      todayJobs: todayAssignments.map((row) => ({
        ...row.job,
        scheduledDate: row.job?.scheduledDate?.toISOString() ?? null,
        completedAt: row.job?.completedAt?.toISOString() ?? null,
        createdAt: row.job?.createdAt.toISOString(),
        updatedAt: row.job?.updatedAt.toISOString(),
        assignmentStatus: row.assignment.status,
        assignedAt: row.assignment.assignedAt.toISOString(),
      })),
    });
  } catch (err) {
    logger.error({ err }, "GET /workers/:id failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /workers/:id
router.patch("/workers/:id", async (req, res): Promise<void> => {
  const params = WorkerIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = PatchWorkerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const orgId = getOrgId(req as AuthedRequest);
    const [updated] = await db
      .update(workersTable)
      .set(parsed.data)
      .where(and(eq(workersTable.orgId, orgId), eq(workersTable.id, params.data.id)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Worker not found" });
      return;
    }

    res.json(formatWorker(updated));
  } catch (err) {
    logger.error({ err }, "PATCH /workers/:id failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /workers/:id/jobs — all jobs assigned to this worker
router.get("/workers/:id/jobs", async (req, res): Promise<void> => {
  const params = WorkerIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const orgId = getOrgId(req as AuthedRequest);
    const rows = await db
      .select({
        assignment: assignmentsTable,
        job: jobsTable,
      })
      .from(assignmentsTable)
      .leftJoin(jobsTable, eq(assignmentsTable.jobId, jobsTable.id))
      .where(and(eq(assignmentsTable.orgId, orgId), eq(assignmentsTable.workerId, params.data.id)))
      .orderBy(desc(jobsTable.scheduledDate));

    res.json(
      rows.map((row) => ({
        ...row.job,
        scheduledDate: row.job?.scheduledDate?.toISOString() ?? null,
        completedAt: row.job?.completedAt?.toISOString() ?? null,
        createdAt: row.job?.createdAt.toISOString(),
        updatedAt: row.job?.updatedAt.toISOString(),
        assignmentId: row.assignment.id,
        assignmentStatus: row.assignment.status,
        assignedAt: row.assignment.assignedAt.toISOString(),
        completedAt2: row.assignment.completedAt?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    logger.error({ err }, "GET /workers/:id/jobs failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
