import { Router, type IRouter } from "express";
import { and, eq, desc, sql } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { z } from "zod";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

const NotificationIdParams = z.object({ id: z.coerce.number().int() });

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    ...n,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", async (req, res): Promise<void> => {
  const orgId = getOrgId(req as AuthedRequest);
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.orgId, orgId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(rows.map(formatNotification));
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = NotificationIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.orgId, orgId), eq(notificationsTable.id, params.data.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(formatNotification(updated));
});

router.patch("/notifications/read-all", async (req, res): Promise<void> => {
  const orgId = getOrgId(req as AuthedRequest);
  const result = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.orgId, orgId), eq(notificationsTable.read, false)))
    .returning({ id: notificationsTable.id });

  res.json({ updated: result.length });
});

export default router;
