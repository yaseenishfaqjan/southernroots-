import { Router, type IRouter } from "express";
import { and, eq, desc, count } from "drizzle-orm";
import { z } from "zod";
import { db, aiDecisionsTable, jobsTable, workersTable } from "@workspace/db";
import { runDailyDispatch } from "../agents/dispatch-agent";
import { sendOwnerBriefing } from "../agents/briefing-agent";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// GET /agents/dispatch/status — quick status for the Dispatch page
router.get("/agents/dispatch/status", async (req, res): Promise<void> => {
  try {
    const orgId = getOrgId(req as AuthedRequest);
    const [assigned] = await db
      .select({ c: count() })
      .from(jobsTable)
      .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.status, "assigned")));
    const [activeWorkers] = await db
      .select({ c: count() })
      .from(workersTable)
      .where(and(eq(workersTable.orgId, orgId), eq(workersTable.isActive, true)));
    const [lastDispatch] = await db
      .select({ at: aiDecisionsTable.executedAt })
      .from(aiDecisionsTable)
      .where(and(eq(aiDecisionsTable.orgId, orgId), eq(aiDecisionsTable.agent, "dispatch")))
      .orderBy(desc(aiDecisionsTable.executedAt))
      .limit(1);
    const [lastBriefing] = await db
      .select({ at: aiDecisionsTable.executedAt })
      .from(aiDecisionsTable)
      .where(and(eq(aiDecisionsTable.orgId, orgId), eq(aiDecisionsTable.agent, "briefing")))
      .orderBy(desc(aiDecisionsTable.executedAt))
      .limit(1);
    res.json({
      lastDispatchAt: lastDispatch?.at ? lastDispatch.at.toISOString() : null,
      lastBriefingAt: lastBriefing?.at ? lastBriefing.at.toISOString() : null,
      jobsDispatched: Number(assigned.c),
      workersNotified: Number(activeWorkers.c),
    });
  } catch (err) {
    logger.error({ err }, "GET /agents/dispatch/status failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

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
    const orgId = getOrgId(req as AuthedRequest);
    const { page, limit } = query.data;
    const offset = (page - 1) * limit;

    let q = db
      .select()
      .from(aiDecisionsTable)
      .$dynamic()
      .where(eq(aiDecisionsTable.orgId, orgId))
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
router.post("/agents/dispatch/trigger", async (req, res): Promise<void> => {
  try {
    const orgId = getOrgId(req as AuthedRequest);
    logger.info("Manual dispatch trigger");
    await runDailyDispatch(orgId);
    res.json({ success: true, message: "Dispatch agent executed" });
  } catch (err) {
    logger.error({ err }, "Manual dispatch trigger failed");
    res.status(500).json({ error: "Dispatch failed" });
  }
});

// POST /agents/briefing/trigger — manual briefing trigger
router.post("/agents/briefing/trigger", async (req, res): Promise<void> => {
  try {
    const orgId = getOrgId(req as AuthedRequest);
    logger.info("Manual briefing trigger");
    await sendOwnerBriefing(orgId);
    res.json({ success: true, message: "Briefing agent executed" });
  } catch (err) {
    logger.error({ err }, "Manual briefing trigger failed");
    res.status(500).json({ error: "Briefing failed" });
  }
});

export default router;
