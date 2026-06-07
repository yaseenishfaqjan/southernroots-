import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, invoicesTable, jobsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const InvoiceIdParam = z.object({ id: z.coerce.number().int() });
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
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.jobId, params.data.jobId))
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
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, params.data.id))
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

  const { jobId, customerName, customerPhone, serviceType, lineItems, subtotal, tax, total, notes } = parsed.data;

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(jobId).padStart(4, "0")}-${Date.now().toString().slice(-4)}`;

  const [invoice] = await db
    .insert(invoicesTable)
    .values({
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

router.patch("/invoices/:id/status", async (req, res): Promise<void> => {
  const params = InvoiceIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInvoiceStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "sent") {
    updateData.sentAt = new Date();
  } else if (parsed.data.status === "paid") {
    updateData.paidAt = new Date();
    const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id));
    if (inv) {
      await db.update(jobsTable).set({ status: "paid" }).where(eq(jobsTable.id, inv.jobId));
    }
  }

  const [updated] = await db
    .update(invoicesTable)
    .set(updateData as Parameters<typeof db.update>[0] extends infer T ? T : never)
    .where(eq(invoicesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(formatInvoice(updated));
});

export default router;
