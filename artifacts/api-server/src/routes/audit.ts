import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const ListAuditLogsQueryParams = z.object({
  entityType: z.string().optional(),
  entityId: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

router.get("/audit-logs", async (req, res): Promise<void> => {
  const parsed = ListAuditLogsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let query = db.select().from(auditLogsTable).$dynamic();

  if (parsed.data.entityType) {
    query = query.where(eq(auditLogsTable.entityType, parsed.data.entityType));
  }

  if (parsed.data.entityId != null) {
    query = query.where(eq(auditLogsTable.entityId, parsed.data.entityId));
  }

  query = query.orderBy(desc(auditLogsTable.createdAt));

  if (parsed.data.limit) {
    query = query.limit(parsed.data.limit);
  } else {
    query = query.limit(100);
  }

  const rows = await query;
  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

export default router;
