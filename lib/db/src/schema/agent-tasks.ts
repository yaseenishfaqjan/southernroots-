import { pgTable, text, uuid, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentTasksTable = pgTable("agent_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: integer("org_id").notNull(),
  agent: text("agent").notNull(),
  status: text("status").notNull().default("pending"), // pending | running | done | failed
  payload: jsonb("payload"),
  result: jsonb("result"),
  error: text("error"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAgentTaskSchema = createInsertSchema(agentTasksTable).omit({ id: true, orgId: true, createdAt: true });
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type AgentTask = typeof agentTasksTable.$inferSelect;
