import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { db, workersTable, jobsTable, assignmentsTable } from "@workspace/db";
import { autoInvoiceJob } from "../agents/billing-agent";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const WorkerIdParam = z.object({ workerId: z.coerce.number().int() });
const AssignmentIdParam = z.object({ id: z.coerce.number().int() });

const UpdateAssignmentStatusBody = z.object({
  status: z.enum(["pending", "in_progress", "complete"]),
  workerNotes: z.string().optional(),
});

function formatJob(row: typeof jobsTable.$inferSelect) {
  return {
    ...row,
    scheduledDate: row.scheduledDate?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /worker/jobs/:workerId — assigned jobs for worker
router.get("/worker/jobs/:workerId", async (req, res): Promise<void> => {
  const params = WorkerIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const orgId = getOrgId(req as AuthedRequest);
    const assignments = await db
      .select({
        assignment: assignmentsTable,
        job: jobsTable,
      })
      .from(assignmentsTable)
      .leftJoin(jobsTable, eq(assignmentsTable.jobId, jobsTable.id))
      .where(and(eq(assignmentsTable.orgId, orgId), eq(assignmentsTable.workerId, params.data.workerId)))
      .orderBy(desc(jobsTable.scheduledDate));

    res.json(
      assignments.map((row) => ({
        ...formatJob(row.job!),
        assignmentId: row.assignment.id,
        assignmentStatus: row.assignment.status,
        workerNotes: row.assignment.workerNotes,
        assignedAt: row.assignment.assignedAt.toISOString(),
        completedAt: row.assignment.completedAt?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    logger.error({ err }, "GET /worker/jobs/:workerId failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /worker/assignments/:id/status
// Worker updates assignment status: pending → in_progress → complete
router.patch(
  "/worker/assignments/:id/status",
  async (req, res): Promise<void> => {
    const params = AssignmentIdParam.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateAssignmentStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    try {
      const orgId = getOrgId(req as AuthedRequest);
      const updateData: Record<string, unknown> = {
        status: parsed.data.status,
      };
      if (parsed.data.workerNotes !== undefined) {
        updateData.workerNotes = parsed.data.workerNotes;
      }
      if (parsed.data.status === "complete") {
        updateData.completedAt = new Date();
      }

      const [updated] = await db
        .update(assignmentsTable)
        .set(updateData as Parameters<typeof db.update>[0] extends infer T ? T : never)
        .where(and(eq(assignmentsTable.orgId, orgId), eq(assignmentsTable.id, params.data.id)))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Assignment not found" });
        return;
      }

      // Sync job status
      if (parsed.data.status === "in_progress") {
        await db
          .update(jobsTable)
          .set({ status: "in_progress" })
          .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, updated.jobId)));
      } else if (parsed.data.status === "complete") {
        await db
          .update(jobsTable)
          .set({ status: "complete", completedAt: new Date() })
          .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, updated.jobId)));

        // Update worker job count
        await db
          .update(workersTable)
          .set({
            currentJobCount: 0, // reset since completed
          })
          .where(and(eq(workersTable.orgId, orgId), eq(workersTable.id, updated.workerId)));

        // Auto-invoice
        await autoInvoiceJob(orgId, updated.jobId).catch((err) =>
          logger.warn({ err, jobId: updated.jobId }, "Auto-invoice failed")
        );
      }

      res.json({
        ...updated,
        assignedAt: updated.assignedAt.toISOString(),
        completedAt: updated.completedAt?.toISOString() ?? null,
      });
    } catch (err) {
      logger.error({ err }, "PATCH /worker/assignments/:id/status failed");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
