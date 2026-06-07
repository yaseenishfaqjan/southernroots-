import { pgTable, text, serial, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workersTable = pgTable("workers", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  specialty: text("specialty").notNull().default("general"), // general | landscaping | pressure_washing | aeration
  rating: real("rating").notNull().default(5.0), // 1–5
  completionRate: real("completion_rate").notNull().default(1.0), // 0–1
  currentJobCount: integer("current_job_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  homeAddress: text("home_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWorkerSchema = createInsertSchema(workersTable).omit({ id: true, orgId: true, createdAt: true, updatedAt: true });
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Worker = typeof workersTable.$inferSelect;
