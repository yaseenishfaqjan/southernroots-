import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Single-use tokens for password reset and email verification.
export const authTokensTable = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // reset | verify
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuthTokenSchema = createInsertSchema(authTokensTable).omit({ id: true, createdAt: true });
export type InsertAuthToken = z.infer<typeof insertAuthTokenSchema>;
export type AuthToken = typeof authTokensTable.$inferSelect;
