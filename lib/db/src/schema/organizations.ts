import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

// A tenant. Every business row in the system belongs to exactly one organization.
export const organizationsTable = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("trial"), // trial | starter | growth | enterprise
  status: text("status").notNull().default("active"), // active | suspended | cancelled
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  stripeCustomerId: text("stripe_customer_id"),
  settings: jsonb("settings"), // per-tenant config: branding, pricing region, hours
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrganizationSchema = createInsertSchema(organizationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const selectOrganizationSchema = createSelectSchema(organizationsTable);
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizationsTable.$inferSelect;
