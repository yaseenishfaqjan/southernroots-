import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  customerPhone: text("customer_phone").notNull(),
  direction: text("direction").notNull(), // inbound | outbound
  message: text("message").notNull(),
  aiHandled: boolean("ai_handled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({ id: true, createdAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;
