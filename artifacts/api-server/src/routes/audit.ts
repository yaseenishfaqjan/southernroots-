import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";
import { z } from "zod";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";

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

  const orgId = getOrgId(req as AuthedRequest);
  const conditions = [eq(auditLogsTable.orgId, orgId)];

  if (parsed.data.entityType) {
    conditions.push(eq(auditLogsTable.entityType, parsed.data.entityType));
  }

  if (parsed.data.entityId != null) {
    conditions.push(eq(auditLogsTable.entityId, parsed.data.entityId));
  }

  let query = db.select().from(auditLogsTable).$dynamic().where(and(...conditions));

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
