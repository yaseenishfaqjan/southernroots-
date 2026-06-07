import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const aiDecisionsTable = pgTable("ai_decisions", {
  id: serial("id").primaryKey(),
  agent: text("agent").notNull(), // quote | dispatch | communication | billing | briefing | upsell | churn
  input: jsonb("input"),
  output: jsonb("output"),
  reasoning: text("reasoning"),
  executedAt: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiDecisionSchema = createInsertSchema(aiDecisionsTable).omit({ id: true, executedAt: true });
export type InsertAiDecision = z.infer<typeof insertAiDecisionSchema>;
export type AiDecision = typeof aiDecisionsTable.$inferSelect;
