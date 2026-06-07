import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, invoicesTable, customersTable } from "@workspace/db";
import { getStripe } from "../lib/stripe";
import { handleInboundSms } from "../agents/communication-agent";
import { sendSms } from "../lib/twilio";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// POST /webhook/stripe — Stripe webhook handler
// NOTE: Express raw body middleware is applied at app level for this path
router.post("/webhook/stripe", async (req, res): Promise<void> => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn("STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
    res.json({ received: true });
    return;
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig as string,
      webhookSecret
    );
  } catch (err) {
    logger.warn({ err }, "Stripe webhook signature verification failed");
    res.status(400).json({ error: "Webhook signature verification failed" });
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as { id: string; payment_status: string };

      if (session.payment_status === "paid") {
        // Find invoice by stripeInvoiceId (session.id)
        const [invoice] = await db
          .select()
          .from(invoicesTable)
          .where(eq(invoicesTable.stripeInvoiceId, session.id));

        if (invoice) {
          await db
            .update(invoicesTable)
            .set({ status: "paid", paidAt: new Date() })
            .where(eq(invoicesTable.id, invoice.id));

          // Send thank-you SMS
          const [customer] = await db
            .select()
            .from(customersTable)
            .where(eq(customersTable.id, invoice.customerId));

          if (customer?.phone) {
            const thankYou = `Thank you ${customer.name}! Payment received for invoice #${invoice.id}. We appreciate your business! -Southern Roots Turf`;
            await sendSms(customer.phone, thankYou).catch((err) =>
              logger.warn({ err }, "Thank-you SMS failed")
            );
          }

          logger.info(
            { invoiceId: invoice.id, sessionId: session.id },
            "Invoice marked paid via Stripe webhook"
          );
        }
      }
    }

    if (event.type === "invoice.paid") {
      // Handle Stripe Invoice (subscription) paid event
      const stripeInvoice = event.data.object as { id: string; customer: string };
      logger.info({ stripeInvoiceId: stripeInvoice.id }, "Stripe invoice.paid event received");
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Stripe webhook processing failed");
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// POST /webhook/sms — Twilio inbound SMS webhook
router.post("/webhook/sms", async (req, res): Promise<void> => {
  try {
    // Twilio sends form-encoded body
    const from = (req.body as Record<string, string>)["From"] ?? "";
    const body = (req.body as Record<string, string>)["Body"] ?? "";

    if (!from || !body) {
      res.status(400).send("Missing From or Body");
      return;
    }

    logger.info({ from }, "Inbound SMS received via webhook");

    // Handle async — respond to Twilio immediately
    handleInboundSms(from, body).catch((err) =>
      logger.error({ err }, "handleInboundSms failed")
    );

    // Twilio expects TwiML or empty 200
    res.set("Content-Type", "text/xml");
    res.send("<Response></Response>");
  } catch (err) {
    logger.error({ err }, "SMS webhook handler failed");
    res.status(500).send("Error");
  }
});

export default router;
