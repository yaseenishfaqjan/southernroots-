import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, organizationsTable, customersTable, quotesTable } from "@workspace/db";
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

export default router;
