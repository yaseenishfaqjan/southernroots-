import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, invoicesTable, jobsTable, customersTable } from "@workspace/db";
import { getOrgId, type AuthedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { z } from "zod";

const router: IRouter = Router();

const InvoiceIdParam = z.object({ id: z.coerce.number().int() });

// ── Real-schema list + resend (the legacy handlers below use an old model) ──
function formatInvoiceRow(row: typeof invoicesTable.$inferSelect, customerName: string | null) {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName,
    jobId: row.jobId,
    amountCents: row.amountCents,
    status: row.status,
    dueDate: row.dueDate?.toISOString() ?? null,
    paidAt: row.paidAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

const ListInvoicesQuery = z.object({ status: z.string().optional() });

router.get("/invoices", async (req, res): Promise<void> => {
  const q = ListInvoicesQuery.safeParse(req.query);
  if (!q.success) {
    res.status(400).json({ error: q.error.message });
    return;
  }
  try {
    const orgId = getOrgId(req as AuthedRequest);
    const rows = await db
      .select({ inv: invoicesTable, customerName: customersTable.name })
      .from(invoicesTable)
      .leftJoin(customersTable, eq(invoicesTable.customerId, customersTable.id))
      .where(
        q.data.status
          ? and(eq(invoicesTable.orgId, orgId), eq(invoicesTable.status, q.data.status))
          : eq(invoicesTable.orgId, orgId)
      )
      .orderBy(desc(invoicesTable.createdAt));
    res.json(rows.map((r) => formatInvoiceRow(r.inv, r.customerName)));
  } catch (err) {
    logger.error({ err }, "GET /invoices failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/invoices/:id/resend", async (req, res): Promise<void> => {
  const params = InvoiceIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const orgId = getOrgId(req as AuthedRequest);
    const [updated] = await db
      .update(invoicesTable)
      .set({ reminderCount: sql`${invoicesTable.reminderCount} + 1`, lastReminderAt: new Date() })
      .where(and(eq(invoicesTable.orgId, orgId), eq(invoicesTable.id, params.data.id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /invoices/:id/resend failed");
    res.status(500).json({ error: "Internal server error" });
  }
});
const JobIdParam = z.object({ jobId: z.coerce.number().int() });

const CreateInvoiceBody = z.object({
  jobId: z.number().int(),
  customerName: z.string(),
  customerPhone: z.string(),
  serviceType: z.string(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    amount: z.number(),
  })),
  subtotal: z.number(),
  tax: z.number().default(0),
  total: z.number(),
  notes: z.string().optional(),
});

const UpdateInvoiceStatusBody = z.object({
  status: z.enum(["draft", "sent", "paid"]),
});

function formatInvoice(row: typeof invoicesTable.$inferSelect) {
  return {
    id: row.id,
    jobId: row.jobId,
    invoiceNumber: row.invoiceNumber,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    serviceType: row.serviceType,
    lineItems: JSON.parse(row.lineItems || "[]"),
    subtotal: parseFloat(row.subtotal),
    tax: parseFloat(row.tax),
    total: parseFloat(row.total),
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt ? row.sentAt.toISOString() : null,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
  };
}

router.get("/invoices/job/:jobId", async (req, res): Promise<void> => {
  const params = JobIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const orgId = getOrgId(req as AuthedRequest);
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(and(eq(invoicesTable.orgId, orgId), eq(invoicesTable.jobId, params.data.jobId)))
    .limit(1);

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(formatInvoice(invoice));
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const params = InvoiceIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const orgId = getOrgId(req as AuthedRequest);
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(and(eq(invoicesTable.orgId, orgId), eq(invoicesTable.id, params.data.id)))
    .limit(1);

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(formatInvoice(invoice));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const orgId = getOrgId(req as AuthedRequest);
  const { jobId, customerName, customerPhone, serviceType, lineItems, subtotal, tax, total, notes } = parsed.data;

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(jobId).padStart(4, "0")}-${Date.now().toString().slice(-4)}`;

  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      orgId,
      jobId,
      invoiceNumber,
      customerName,
      customerPhone,
      serviceType,
      lineItems: JSON.stringify(lineItems),
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      status: "draft",
      notes: notes ?? null,
    })
    .returning();

  res.status(201).json(formatInvoice(invoice!));
});

const UpdateStatusBody = z.object({ status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]) });

router.patch("/invoices/:id/status", async (req, res): Promise<void> => {
  const params = InvoiceIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const orgId = getOrgId(req as AuthedRequest);
    const updateData: Partial<typeof invoicesTable.$inferInsert> = { status: parsed.data.status };
    if (parsed.data.status === "paid") updateData.paidAt = new Date();

    const [updated] = await db
      .update(invoicesTable)
      .set(updateData)
      .where(and(eq(invoicesTable.orgId, orgId), eq(invoicesTable.id, params.data.id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    // Mark the linked job paid too.
    if (parsed.data.status === "paid" && updated.jobId) {
      await db
        .update(jobsTable)
        .set({ status: "paid" })
        .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, updated.jobId)));
    }
    res.json(formatInvoiceRow(updated, null));
  } catch (err) {
    logger.error({ err }, "PATCH /invoices/:id/status failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
