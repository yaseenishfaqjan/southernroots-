import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  customersTable,
  jobsTable,
  invoicesTable,
  quotesTable,
} from "@workspace/db";
import { getAgentQueue } from "../queues";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const CreateCustomerBody = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().min(1),
  tier: z.enum(["standard", "premium"]).optional(),
});

const PatchCustomerBody = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().min(1).optional(),
  tier: z.enum(["standard", "premium", "suspended"]).optional(),
  mrr: z.number().int().optional(),
});

const CustomerIdParam = z.object({ id: z.coerce.number().int() });

const CreateLeadBody = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().min(1),
  servicesWanted: z.array(z.string()).optional(),
});

function formatCustomer(row: typeof customersTable.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /customers
router.get("/customers", async (_req, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(customersTable)
      .orderBy(desc(customersTable.createdAt));
    res.json(rows.map(formatCustomer));
  } catch (err) {
    logger.error({ err }, "GET /customers failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /customers
router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [customer] = await db
      .insert(customersTable)
      .values({
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email ?? null,
        address: parsed.data.address,
        tier: parsed.data.tier ?? "standard",
      })
      .returning();
    res.status(201).json(formatCustomer(customer));
  } catch (err) {
    logger.error({ err }, "POST /customers failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /customers/:id — with jobs + invoices
router.get("/customers/:id", async (req, res): Promise<void> => {
  const params = CustomerIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, params.data.id));

    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const jobs = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.customerId, params.data.id))
      .orderBy(desc(jobsTable.createdAt));

    const invoices = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.customerId, params.data.id))
      .orderBy(desc(invoicesTable.createdAt));

    res.json({
      ...formatCustomer(customer),
      jobs: jobs.map((j) => ({
        ...j,
        scheduledDate: j.scheduledDate?.toISOString() ?? null,
        completedAt: j.completedAt?.toISOString() ?? null,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString(),
      })),
      invoices: invoices.map((i) => ({
        ...i,
        dueDate: i.dueDate?.toISOString() ?? null,
        paidAt: i.paidAt?.toISOString() ?? null,
        lastReminderAt: i.lastReminderAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    logger.error({ err }, "GET /customers/:id failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /customers/:id
router.patch("/customers/:id", async (req, res): Promise<void> => {
  const params = CustomerIdParam.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = PatchCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [updated] = await db
      .update(customersTable)
      .set(parsed.data)
      .where(eq(customersTable.id, params.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    res.json(formatCustomer(updated));
  } catch (err) {
    logger.error({ err }, "PATCH /customers/:id failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/leads — create customer + enqueue ai-quote job
router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [customer] = await db
      .insert(customersTable)
      .values({
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
        customerId: customer.id,
        services: parsed.data.servicesWanted ?? [],
        totalCents: 0,
        status: "draft",
      })
      .returning();

    await getAgentQueue().add("ai-quote", {
      type: "ai-quote",
      customerId: customer.id,
      quoteId: quote.id,
    });

    logger.info(
      { customerId: customer.id, quoteId: quote.id },
      "Lead created, ai-quote job enqueued"
    );

    res.status(201).json({
      customer: formatCustomer(customer),
      quoteId: quote.id,
      message: "Lead received. AI quote is being generated.",
    });
  } catch (err) {
    logger.error({ err }, "POST /leads failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
