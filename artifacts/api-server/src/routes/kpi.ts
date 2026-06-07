import { Router, type IRouter } from "express";
import { and, eq, sql, count } from "drizzle-orm";
import { db, kpiLogsTable } from "@workspace/db";
import { z } from "zod";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

const LogKpiBody = z.object({
  metricType: z.string().min(1),
  jobId: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

router.get("/kpi/summary", async (req, res): Promise<void> => {
  const orgId = getOrgId(req as AuthedRequest);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayCounts] = await db
    .select({
      totalToday: count(),
      callsToday: sql<number>`count(*) filter (where ${kpiLogsTable.metricType} = 'call')`,
      jobsClosedToday: sql<number>`count(*) filter (where ${kpiLogsTable.metricType} = 'job_closed')`,
      quotesToday: sql<number>`count(*) filter (where ${kpiLogsTable.metricType} = 'quote_sent')`,
    })
    .from(kpiLogsTable)
    .where(and(eq(kpiLogsTable.orgId, orgId), sql`${kpiLogsTable.createdAt} >= ${todayStart}`));

  const [overallCounts] = await db
    .select({
      total: count(),
      calls: sql<number>`count(*) filter (where ${kpiLogsTable.metricType} = 'call')`,
      jobsClosed: sql<number>`count(*) filter (where ${kpiLogsTable.metricType} = 'job_closed')`,
      quotes: sql<number>`count(*) filter (where ${kpiLogsTable.metricType} = 'quote_sent')`,
    })
    .from(kpiLogsTable)
    .where(eq(kpiLogsTable.orgId, orgId));

  res.json({
    today: {
      total: Number(todayCounts.totalToday),
      calls: Number(todayCounts.callsToday),
      jobsClosed: Number(todayCounts.jobsClosedToday),
      quotes: Number(todayCounts.quotesToday),
    },
    overall: {
      total: Number(overallCounts.total),
      calls: Number(overallCounts.calls),
      jobsClosed: Number(overallCounts.jobsClosed),
      quotes: Number(overallCounts.quotes),
    },
  });
});

router.post("/kpi/log", async (req, res): Promise<void> => {
  const parsed = LogKpiBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const [entry] = await db
    .insert(kpiLogsTable)
    .values({
      orgId,
      metricType: parsed.data.metricType,
      jobId: parsed.data.jobId ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
  });
});

export default router;
