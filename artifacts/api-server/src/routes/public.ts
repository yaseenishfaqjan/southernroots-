import { Router, type IRouter } from "express";
import { and, eq, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, organizationsTable, customersTable, quotesTable, jobsTable, workersTable, invoicesTable } from "@workspace/db";
import { getAgentQueue } from "../queues";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const PublicLeadBody = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().min(1),
  servicesWanted: z.array(z.string()).optional(),
});

// POST /public/leads/:orgSlug
// Unauthenticated lead intake for a tenant's marketing site / quote form.
// The org is identified by its public slug; the AI quote then runs for that org.
router.post("/public/leads/:orgSlug", async (req, res): Promise<void> => {
  const parsed = PublicLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const slug = String(req.params.orgSlug).toLowerCase();
    const [org] = await db
      .select({ id: organizationsTable.id, status: organizationsTable.status })
      .from(organizationsTable)
      .where(and(eq(organizationsTable.slug, slug), eq(organizationsTable.status, "active")));

    if (!org) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const orgId = org.id;

    const [customer] = await db
      .insert(customersTable)
      .values({
        orgId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email ?? null,
        address: parsed.data.address,
        tier: "standard",
      })
      .returning();

    const [quote] = await db
      .insert(quotesTable)
      .values({
        orgId,
        customerId: customer.id,
        services: parsed.data.servicesWanted ?? [],
        totalCents: 0,
        status: "draft",
      })
      .returning();

    await getAgentQueue().add("ai-quote", {
      type: "ai-quote",
      orgId,
      customerId: customer.id,
      quoteId: quote.id,
    });

    logger.info({ orgId, customerId: customer.id, quoteId: quote.id }, "Public lead captured");
    res.status(201).json({ message: "Thanks! Your quote is on the way." });
  } catch (err) {
    logger.error({ err }, "POST /public/leads failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Public quote view + accept (reached from the quote email; no login) ─────
const QuoteIdParam = z.object({ id: z.coerce.number().int() });

router.get("/public/quotes/:id", async (req, res): Promise<void> => {
  const params = QuoteIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const [row] = await db
      .select({
        id: quotesTable.id,
        services: quotesTable.services,
        totalCents: quotesTable.totalCents,
        status: quotesTable.status,
        customerName: customersTable.name,
        orgName: organizationsTable.name,
      })
      .from(quotesTable)
      .leftJoin(customersTable, eq(quotesTable.customerId, customersTable.id))
      .leftJoin(organizationsTable, eq(quotesTable.orgId, organizationsTable.id))
      .where(eq(quotesTable.id, params.data.id));
    if (!row) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    logger.error({ err }, "GET /public/quotes failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/public/quotes/:id/accept", async (req, res): Promise<void> => {
  const params = QuoteIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const [quote] = await db.select().from(quotesTable).where(eq(quotesTable.id, params.data.id));
    if (!quote) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }
    if (quote.status === "accepted") {
      res.json({ ok: true, alreadyAccepted: true });
      return;
    }
    if (quote.status === "declined") {
      res.status(400).json({ error: "This quote was declined" });
      return;
    }
    await db
      .update(quotesTable)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(quotesTable.id, quote.id));

    const services = (quote.services as Array<{ name: string }>) ?? [];
    const primaryService =
      services.length > 0 ? services[0].name.toLowerCase().replace(/\s+/g, "_") : "mowing";
    await db.insert(jobsTable).values({
      orgId: quote.orgId,
      customerId: quote.customerId,
      propertyId: quote.propertyId ?? undefined,
      quoteId: quote.id,
      serviceType: primaryService,
      status: "new",
      priceCents: quote.totalCents,
    });
    logger.info({ quoteId: quote.id, orgId: quote.orgId }, "Quote accepted by customer (public) — job created");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /public/quotes/accept failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Worker portal (phone link; no login — identified by the worker's token) ──
router.get("/public/worker/:token", async (req, res): Promise<void> => {
  try {
    const token = String(req.params.token);
    const [worker] = await db.select().from(workersTable).where(eq(workersTable.accessToken, token));
    if (!worker) {
      res.status(404).json({ error: "Invalid link" });
      return;
    }
    const [org] = await db
      .select({ name: organizationsTable.name })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, worker.orgId));
    const jobs = await db
      .select({
        id: jobsTable.id,
        serviceType: jobsTable.serviceType,
        status: jobsTable.status,
        priceCents: jobsTable.priceCents,
        scheduledDate: jobsTable.scheduledDate,
        notes: jobsTable.notes,
        customerName: customersTable.name,
        address: customersTable.address,
      })
      .from(jobsTable)
      .leftJoin(customersTable, eq(jobsTable.customerId, customersTable.id))
      .where(and(eq(jobsTable.orgId, worker.orgId), inArray(jobsTable.status, ["new", "assigned", "in_progress"])))
      .orderBy(desc(jobsTable.createdAt));
    res.json({
      worker: { name: worker.name },
      orgName: org?.name ?? "Southern Roots Turf",
      jobs: jobs.map((j) => ({ ...j, scheduledDate: j.scheduledDate?.toISOString() ?? null })),
    });
  } catch (err) {
    logger.error({ err }, "GET /public/worker failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

const WorkerStatusBody = z.object({ status: z.enum(["assigned", "in_progress", "complete"]) });

router.post("/public/worker/:token/jobs/:jobId", async (req, res): Promise<void> => {
  const parsed = WorkerStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const token = String(req.params.token);
    const jobId = Number(req.params.jobId);
    const [worker] = await db.select().from(workersTable).where(eq(workersTable.accessToken, token));
    if (!worker) {
      res.status(404).json({ error: "Invalid link" });
      return;
    }
    const updateData: Partial<typeof jobsTable.$inferInsert> = { status: parsed.data.status };
    if (parsed.data.status === "complete") updateData.completedAt = new Date();
    const [updated] = await db
      .update(jobsTable)
      .set(updateData)
      .where(and(eq(jobsTable.orgId, worker.orgId), eq(jobsTable.id, jobId)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    // Completing a job auto-invoices (same as the owner flow).
    if (parsed.data.status === "complete") {
      const [existing] = await db
        .select({ id: invoicesTable.id })
        .from(invoicesTable)
        .where(and(eq(invoicesTable.orgId, worker.orgId), eq(invoicesTable.jobId, updated.id)));
      if (!existing) {
        await db.insert(invoicesTable).values({
          orgId: worker.orgId,
          customerId: updated.customerId,
          jobId: updated.id,
          amountCents: updated.priceCents,
          status: "sent",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /public/worker job status failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
