import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const kpiLogsTable = pgTable("kpi_logs", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  metricType: text("metric_type").notNull(),
  jobId: integer("job_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKpiLogSchema = createInsertSchema(kpiLogsTable).omit({ id: true, orgId: true, createdAt: true });
export type InsertKpiLog = z.infer<typeof insertKpiLogSchema>;
export type KpiLog = typeof kpiLogsTable.$inferSelect;
