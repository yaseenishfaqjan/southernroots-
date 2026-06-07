import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { jobsTable } from "./jobs";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  jobId: integer("job_id").references(() => jobsTable.id),
  stripeInvoiceId: text("stripe_invoice_id"),
  stripePaymentLinkUrl: text("stripe_payment_link_url"),
  amountCents: integer("amount_cents").notNull().default(0),
  status: text("status").notNull().default("draft"), // draft | sent | paid | overdue | cancelled
  dueDate: timestamp("due_date", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  reminderCount: integer("reminder_count").notNull().default(0),
  lastReminderAt: timestamp("last_reminder_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, orgId: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
