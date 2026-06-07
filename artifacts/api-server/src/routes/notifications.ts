import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const NotificationIdParams = z.object({ id: z.coerce.number().int() });

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    ...n,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(notificationsTable)
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

  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(formatNotification(updated));
});

router.patch("/notifications/read-all", async (_req, res): Promise<void> => {
  const result = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.read, false))
    .returning({ id: notificationsTable.id });

  res.json({ updated: result.length });
});

export default router;
