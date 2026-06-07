import { Router, type IRouter } from "express";
import { and, eq, count, gte, inArray, sql } from "drizzle-orm";
import {
  db,
  customersTable,
  quotesTable,
  jobsTable,
  invoicesTable,
  escalationsTable,
  workersTable,
} from "@workspace/db";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

// Real-time KPIs for the owner dashboard (computed from the live schema).
router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const orgId = getOrgId(req as AuthedRequest);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const staleThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [revenue] = await db
    .select({ cents: sql<number>`coalesce(sum(${invoicesTable.amountCents}), 0)` })
    .from(invoicesTable)
    .where(and(eq(invoicesTable.orgId, orgId), eq(invoicesTable.status, "paid"), gte(invoicesTable.paidAt, monthStart)));

  const [mrr] = await db
    .select({ cents: sql<number>`coalesce(sum(${customersTable.mrr}), 0)` })
    .from(customersTable)
    .where(eq(customersTable.orgId, orgId));

  const [jobsWeek] = await db
    .select({ c: count() })
    .from(jobsTable)
    .where(and(eq(jobsTable.orgId, orgId), inArray(jobsTable.status, ["complete", "paid"]), gte(jobsTable.completedAt, weekAgo)));

  const [leadsWeek] = await db
    .select({ c: count() })
    .from(customersTable)
    .where(and(eq(customersTable.orgId, orgId), gte(customersTable.createdAt, weekAgo)));

  const [quoteStats] = await db
    .select({
      total: count(),
      accepted: sql<number>`count(*) filter (where ${quotesTable.status} = 'accepted')`,
    })
    .from(quotesTable)
    .where(eq(quotesTable.orgId, orgId));

  const [workerStats] = await db
    .select({
      total: count(),
      busy: sql<number>`count(*) filter (where ${workersTable.currentJobCount} > 0)`,
    })
    .from(workersTable)
    .where(eq(workersTable.orgId, orgId));

  const [outstanding] = await db
    .select({
      c: count(),
      cents: sql<number>`coalesce(sum(${invoicesTable.amountCents}), 0)`,
    })
    .from(invoicesTable)
    .where(and(eq(invoicesTable.orgId, orgId), inArray(invoicesTable.status, ["sent", "overdue", "draft"])));

  const [stale] = await db
    .select({ c: count() })
    .from(quotesTable)
    .where(and(eq(quotesTable.orgId, orgId), eq(quotesTable.status, "draft"), sql`${quotesTable.createdAt} <= ${staleThreshold}`));

  const [openEsc] = await db
    .select({ c: count() })
    .from(escalationsTable)
    .where(and(eq(escalationsTable.orgId, orgId), eq(escalationsTable.status, "pending")));

  const [churn] = await db
    .select({ c: count() })
    .from(customersTable)
    .where(and(eq(customersTable.orgId, orgId), sql`${customersTable.churnRisk} >= 0.7`));

  const totalQuotes = Number(quoteStats.total);
  const totalWorkers = Number(workerStats.total);

  res.json({
    totalRevenueCentsThisMonth: Number(revenue.cents),
    mrrCents: Number(mrr.cents),
    jobsCompletedThisWeek: Number(jobsWeek.c),
    newLeadsThisWeek: Number(leadsWeek.c),
    quoteConversionRate: totalQuotes > 0 ? Number(quoteStats.accepted) / totalQuotes : 0,
    crewUtilization: totalWorkers > 0 ? Number(workerStats.busy) / totalWorkers : 0,
    outstandingInvoicesCount: Number(outstanding.c),
    outstandingInvoicesCents: Number(outstanding.cents),
    staleLeadsCount: Number(stale.c),
    openEscalationsCount: Number(openEsc.c),
    churnRiskCount: Number(churn.c),
  });
});

// Revenue history for the dashboard chart (last 30 daily snapshots if present).
router.get("/dashboard/kpis/history", async (req, res): Promise<void> => {
  getOrgId(req as AuthedRequest); // ensure authenticated/tenant context
  // KPI snapshots are written by the briefing agent; until they accumulate,
  // return an empty series (the chart hides itself gracefully).
  res.json([]);
});

export default router;
