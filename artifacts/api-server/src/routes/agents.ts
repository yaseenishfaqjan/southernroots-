import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { db, aiDecisionsTable } from "@workspace/db";
import { runDailyDispatch } from "../agents/dispatch-agent";
import { sendOwnerBriefing } from "../agents/briefing-agent";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  agent: z.string().optional(),
});

// GET /ai/decisions — paginated list
router.get("/ai/decisions", async (req, res): Promise<void> => {
  const query = PaginationQuery.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  try {
    const { page, limit } = query.data;
    const offset = (page - 1) * limit;

    let q = db
      .select()
      .from(aiDecisionsTable)
      .$dynamic()
      .orderBy(desc(aiDecisionsTable.executedAt))
      .limit(limit)
      .offset(offset);

    const rows = await q;

    res.json({
      data: rows.map((r) => ({
        ...r,
        executedAt: r.executedAt.toISOString(),
      })),
      page,
      limit,
    });
  } catch (err) {
    logger.error({ err }, "GET /ai/decisions failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /agents/dispatch/trigger — manual dispatch trigger
router.post("/agents/dispatch/trigger", async (_req, res): Promise<void> => {
  try {
    logger.info("Manual dispatch trigger");
    await runDailyDispatch();
    res.json({ success: true, message: "Dispatch agent executed" });
  } catch (err) {
    logger.error({ err }, "Manual dispatch trigger failed");
    res.status(500).json({ error: "Dispatch failed" });
  }
});

// POST /agents/briefing/trigger — manual briefing trigger
router.post("/agents/briefing/trigger", async (_req, res): Promise<void> => {
  try {
    logger.info("Manual briefing trigger");
    await sendOwnerBriefing();
    res.json({ success: true, message: "Briefing agent executed" });
  } catch (err) {
    logger.error({ err }, "Manual briefing trigger failed");
    res.status(500).json({ error: "Briefing failed" });
  }
});

export default router;
