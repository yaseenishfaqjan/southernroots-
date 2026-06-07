import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { jobsTable } from "./jobs";
import { workersTable } from "./workers";

export const assignmentsTable = pgTable("assignments", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  jobId: integer("job_id").notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
  workerId: integer("worker_id").notNull().references(() => workersTable.id),
  status: text("status").notNull().default("pending"), // pending | in_progress | complete
  workerNotes: text("worker_notes"),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertAssignmentSchema = createInsertSchema(assignmentsTable).omit({ id: true, orgId: true, assignedAt: true });
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignmentsTable.$inferSelect;
