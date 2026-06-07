import { pgTable, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const kpiSnapshotsTable = pgTable("kpi_snapshots", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  totalRevenueCents: integer("total_revenue_cents").notNull().default(0),
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  newLeads: integer("new_leads").notNull().default(0),
  crewUtilization: real("crew_utilization").notNull().default(0), // 0–1
  mrrCents: integer("mrr_cents").notNull().default(0),
  churnCount: integer("churn_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKpiSnapshotSchema = createInsertSchema(kpiSnapshotsTable).omit({ id: true, orgId: true, createdAt: true });
export type InsertKpiSnapshot = z.infer<typeof insertKpiSnapshotSchema>;
export type KpiSnapshot = typeof kpiSnapshotsTable.$inferSelect;
