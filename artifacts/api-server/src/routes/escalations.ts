import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db, escalationsTable, jobsTable, notificationsTable, auditLogsTable } from "@workspace/db";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

const CreateEscalationBody = z.object({
  jobId: z.number().int().nullable().optional(),
  category: z.string().min(1),
  description: z.string().min(1),
});

const UpdateEscalationBody = z.object({
  status: z.string().optional(),
  resolution: z.string().nullable().optional(),
});

const EscalationParams = z.object({ id: z.coerce.number().int() });

function formatEscalation(e: typeof escalationsTable.$inferSelect) {
  return {
    ...e,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

router.get("/escalations", async (req, res): Promise<void> => {
  const orgId = getOrgId(req as AuthedRequest);
  let query = db.select().from(escalationsTable).$dynamic();
  if (req.query.status) {
    query = query.where(and(eq(escalationsTable.orgId, orgId), eq(escalationsTable.status, req.query.status as string)));
  } else {
    query = query.where(eq(escalationsTable.orgId, orgId));
  }
  const rows = await query.orderBy(desc(escalationsTable.createdAt));
  res.json(rows.map(formatEscalation));
});

router.post("/escalations", async (req, res): Promise<void> => {
  const parsed = CreateEscalationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  let customerName: string | null = null;
  if (parsed.data.jobId) {
    const [job] = await db.select().from(jobsTable).where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, parsed.data.jobId)));
    if (job) customerName = job.customerName;
  }

  const [row] = await db
    .insert(escalationsTable)
    .values({
      orgId,
      jobId: parsed.data.jobId ?? null,
      category: parsed.data.category,
      description: parsed.data.description,
      customerName,
    })
    .returning();

  await db.insert(notificationsTable).values({
    orgId,
    type: "escalation",
    title: "Escalation Needs Admin Review",
    body: `${parsed.data.category}: ${parsed.data.description.substring(0, 80)}`,
    entityType: "escalation",
    entityId: row.id,
  });

  await db.insert(auditLogsTable).values({
    orgId,
    actionType: "escalation_created",
    entityType: "escalation",
    entityId: row.id,
    description: `Escalation created: ${parsed.data.category}`,
  });

  res.status(201).json(formatEscalation(row));
});

router.patch("/escalations/:id", async (req, res): Promise<void> => {
  const params = EscalationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEscalationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const updateData: Record<string, unknown> = {};
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if ("resolution" in parsed.data) updateData.resolution = parsed.data.resolution;

  const [updated] = await db
    .update(escalationsTable)
    .set(updateData as Parameters<typeof db.update>[0] extends infer T ? T : never)
    .where(and(eq(escalationsTable.orgId, orgId), eq(escalationsTable.id, params.data.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Escalation not found" });
    return;
  }

  await db.insert(auditLogsTable).values({
    orgId,
    actionType: "escalation_updated",
    entityType: "escalation",
    entityId: params.data.id,
    description: `Escalation status changed to: ${parsed.data.status ?? "updated"}`,
  });

  res.json(formatEscalation(updated));
});

export default router;
