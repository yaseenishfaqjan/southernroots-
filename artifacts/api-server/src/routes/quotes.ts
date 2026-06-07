import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db, quotesTable, jobsTable, customersTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const QuoteIdParam = z.object({ id: z.coerce.number().int() });
const ListQuotesQuery = z.object({
  status: z.string().optional(),
});

function formatQuote(row: typeof quotesTable.$inferSelect) {
  return {
    ...row,
    sentAt: row.sentAt?.toISOString() ?? null,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /quotes?status=
router.get("/quotes", async (req, res): Promise<void> => {
  const query = ListQuotesQuery.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  try {
    let q = db.select().from(quotesTable).$dynamic();
    if (query.data.status) {
      q = q.where(eq(quotesTable.status, query.data.status));
    }
    const rows = await q.orderBy(desc(quotesTable.createdAt));
    res.json(rows.map(formatQuote));
  } catch (err) {
    logger.error({ err }, "GET /quotes failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /quotes/:id
router.get("/quotes/:id", async (req, res): Promise<void> => {
  const params = QuoteIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [quote] = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.id, params.data.id));

    if (!quote) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }

    res.json(formatQuote(quote));
  } catch (err) {
    logger.error({ err }, "GET /quotes/:id failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /quotes/:id/accept — creates a job record from the quote
router.post("/quotes/:id/accept", async (req, res): Promise<void> => {
  const params = QuoteIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [quote] = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.id, params.data.id));

    if (!quote) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }

    if (quote.status === "declined") {
      res.status(400).json({ error: "Quote has already been declined" });
      return;
    }

    // Mark quote accepted
    const [updatedQuote] = await db
      .update(quotesTable)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(quotesTable.id, params.data.id))
      .returning();

    // Determine service type from services array
    const services = (quote.services as Array<{ name: string; price: number }>) ?? [];
    const primaryService =
      services.length > 0
        ? services[0].name.toLowerCase().replace(/\s+/g, "_")
        : "mowing";

    // Create job
    const [job] = await db
      .insert(jobsTable)
      .values({
        customerId: quote.customerId,
        propertyId: quote.propertyId ?? undefined,
        quoteId: quote.id,
        serviceType: primaryService,
        status: "new",
        priceCents: quote.totalCents,
      })
      .returning();

    res.status(201).json({
      quote: formatQuote(updatedQuote),
      job: {
        ...job,
        scheduledDate: job.scheduledDate?.toISOString() ?? null,
        completedAt: job.completedAt?.toISOString() ?? null,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    logger.error({ err }, "POST /quotes/:id/accept failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /quotes/:id/decline
router.post("/quotes/:id/decline", async (req, res): Promise<void> => {
  const params = QuoteIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [updated] = await db
      .update(quotesTable)
      .set({ status: "declined" })
      .where(eq(quotesTable.id, params.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }

    res.json(formatQuote(updated));
  } catch (err) {
    logger.error({ err }, "POST /quotes/:id/decline failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
