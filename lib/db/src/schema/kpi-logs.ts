import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const kpiLogsTable = pgTable("kpi_logs", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(),
  jobId: integer("job_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKpiLogSchema = createInsertSchema(kpiLogsTable).omit({ id: true, createdAt: true });
export type InsertKpiLog = z.infer<typeof insertKpiLogSchema>;
export type KpiLog = typeof kpiLogsTable.$inferSelect;
