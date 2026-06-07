import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { customersTable } from "./customers";

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  sqftLawn: integer("sqft_lawn"),
  sqftDriveway: integer("sqft_driveway"),
  complexity: text("complexity").notNull().default("simple"), // simple | moderate | complex
  lastAnalyzedAt: timestamp("last_analyzed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, orgId: true, createdAt: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
