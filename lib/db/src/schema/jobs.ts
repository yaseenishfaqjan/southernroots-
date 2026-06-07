import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { customersTable } from "./customers";
import { propertiesTable } from "./properties";
import { quotesTable } from "./quotes";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").references(() => propertiesTable.id),
  quoteId: integer("quote_id").references(() => quotesTable.id),
  serviceType: text("service_type").notNull(), // mowing | landscaping | pressure_washing | aeration | hedges
  status: text("status").notNull().default("new"), // new | assigned | in_progress | complete | paid | cancelled
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  priceCents: integer("price_cents").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, orgId: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
