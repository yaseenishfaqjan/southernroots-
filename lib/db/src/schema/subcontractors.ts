import { pgTable, text, serial, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subcontractorsTable = pgTable("subcontractors", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  specialty: text("specialty").notNull(),
  notes: text("notes"),
  // Marketplace fields
  isOnline: boolean("is_online").notNull().default(false),
  latitude: numeric("latitude", { precision: 10, scale: 6 }),
  longitude: numeric("longitude", { precision: 10, scale: 6 }),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("5.00"),
  completionRate: numeric("completion_rate", { precision: 5, scale: 2 }).notNull().default("100.00"),
  totalJobs: integer("total_jobs").notNull().default(0),
  totalEarnings: numeric("total_earnings", { precision: 10, scale: 2 }).notNull().default("0.00"),
  avgResponseTimeSecs: integer("avg_response_time_secs"),
  // Trust / onboarding
  licenseUploaded: boolean("license_uploaded").notNull().default(false),
  insuranceUploaded: boolean("insurance_uploaded").notNull().default(false),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSubcontractorSchema = createInsertSchema(subcontractorsTable).omit({ id: true, orgId: true, createdAt: true, updatedAt: true });
export type InsertSubcontractor = z.infer<typeof insertSubcontractorSchema>;
export type Subcontractor = typeof subcontractorsTable.$inferSelect;
