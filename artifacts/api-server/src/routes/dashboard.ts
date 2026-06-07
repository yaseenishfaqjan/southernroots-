import { Router, type IRouter } from "express";
import { and, eq, count, sum, sql } from "drizzle-orm";
import { db, jobsTable, assignmentsTable, subcontractorsTable, escalationsTable, notificationsTable } from "@workspace/db";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";


const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const orgId = getOrgId(req as AuthedRequest);
  const [jobCounts] = await db
    .select({
      total: count(),
      newJobs: sql<number>`count(*) filter (where ${jobsTable.status} = 'new')`,
      assignedJobs: sql<number>`count(*) filter (where ${jobsTable.status} = 'assigned')`,
      inProgressJobs: sql<number>`count(*) filter (where ${jobsTable.status} = 'in_progress')`,
      completedJobs: sql<number>`count(*) filter (where ${jobsTable.status} in ('complete', 'paid'))`,
    })
    .from(jobsTable)
    .where(eq(jobsTable.orgId, orgId));

  const [earningsSums] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${jobsTable.customerPrice}), 0)`,
    })
    .from(jobsTable)
    .where(eq(jobsTable.orgId, orgId));

  const [assignmentSums] = await db
    .select({
      totalSubPay: sql<number>`coalesce(sum(${assignmentsTable.subPay}), 0)`,
      totalOwnerProfit: sql<number>`coalesce(sum(${assignmentsTable.ownerProfit}), 0)`,
    })
    .from(assignmentsTable)
    .where(eq(assignmentsTable.orgId, orgId));

  const [subCount] = await db
    .select({ count: count() })
    .from(subcontractorsTable)
    .where(eq(subcontractorsTable.orgId, orgId));

  const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const [staleResult] = await db
    .select({ staleLeads: count() })
    .from(jobsTable)
    .where(and(eq(jobsTable.orgId, orgId), sql`${jobsTable.status} = 'new' and ${jobsTable.createdAt} <= ${staleThreshold}`));

  const [pendingEscalationsResult] = await db
    .select({ pendingEscalations: count() })
    .from(escalationsTable)
    .where(and(eq(escalationsTable.orgId, orgId), eq(escalationsTable.status, "pending")));

  const [unreadResult] = await db
    .select({ unreadNotifications: count() })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.orgId, orgId), eq(notificationsTable.read, false)));

  res.json({
    totalRevenue: parseFloat(String(earningsSums.totalRevenue)),
    totalSubPay: parseFloat(String(assignmentSums.totalSubPay)),
    totalOwnerProfit: parseFloat(String(assignmentSums.totalOwnerProfit)),
    newJobs: Number(jobCounts.newJobs),
    assignedJobs: Number(jobCounts.assignedJobs),
    inProgressJobs: Number(jobCounts.inProgressJobs),
    completedJobs: Number(jobCounts.completedJobs),
    totalJobs: Number(jobCounts.total),
    totalSubs: Number(subCount.count),
    staleLeads: Number(staleResult.staleLeads),
    pendingEscalations: Number(pendingEscalationsResult.pendingEscalations),
    unreadNotifications: Number(unreadResult.unreadNotifications),
  });
});

router.get("/dashboard/charts", async (req, res): Promise<void> => {
  const orgId = getOrgId(req as AuthedRequest);
  const byService = await db
    .select({
      name: jobsTable.serviceType,
      jobs: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${jobsTable.customerPrice}), 0)`,
    })
    .from(jobsTable)
    .where(eq(jobsTable.orgId, orgId))
    .groupBy(jobsTable.serviceType)
    .orderBy(sql`sum(${jobsTable.customerPrice}) desc nulls last`);

  const byStatus = await db
    .select({
      status: jobsTable.status,
      jobs: sql<number>`count(*)`,
    })
    .from(jobsTable)
    .where(eq(jobsTable.orgId, orgId))
    .groupBy(jobsTable.status);

  const bySub = await db
    .select({
      name: subcontractorsTable.name,
      jobs: sql<number>`count(${assignmentsTable.id})`,
      pay: sql<number>`coalesce(sum(${assignmentsTable.subPay}), 0)`,
    })
    .from(subcontractorsTable)
    .leftJoin(assignmentsTable, eq(assignmentsTable.subcontractorId, subcontractorsTable.id))
    .where(eq(subcontractorsTable.orgId, orgId))
    .groupBy(subcontractorsTable.id, subcontractorsTable.name)
    .orderBy(sql`count(${assignmentsTable.id}) desc`);

  const STATUS_ORDER = ["new", "assigned", "in_progress", "complete", "paid"];
  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, Number(s.jobs)]));
  const pipeline = STATUS_ORDER.map((s) => ({ status: s, jobs: statusMap[s] ?? 0 }));

  res.json({
    byService: byService.map((r) => ({
      name: r.name,
      jobs: Number(r.jobs),
      revenue: parseFloat(String(r.revenue)),
    })),
    pipeline,
    bySub: bySub.map((r) => ({
      name: r.name,
      jobs: Number(r.jobs),
      pay: parseFloat(String(r.pay)),
    })),
  });
});

export default router;
