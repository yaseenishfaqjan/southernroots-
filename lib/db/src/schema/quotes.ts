import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { customersTable } from "./customers";
import { propertiesTable } from "./properties";

export const quotesTable = pgTable("quotes", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").references(() => propertiesTable.id),
  services: jsonb("services"), // [{name, price, description}]
  totalCents: integer("total_cents").notNull().default(0),
  status: text("status").notNull().default("draft"), // draft | sent | accepted | declined
  aiReasoning: text("ai_reasoning"),
  pdfUrl: text("pdf_url"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQuoteSchema = createInsertSchema(quotesTable).omit({ id: true, orgId: true, createdAt: true, updatedAt: true });
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotesTable.$inferSelect;
