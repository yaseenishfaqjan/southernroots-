import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { customersTable } from "./customers";
import { jobsTable } from "./jobs";

export const escalationsTable = pgTable("escalations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customersTable.id),
  jobId: integer("job_id").references(() => jobsTable.id),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"), // open | in_review | resolved
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEscalationSchema = createInsertSchema(escalationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEscalation = z.infer<typeof insertEscalationSchema>;
export type Escalation = typeof escalationsTable.$inferSelect;
