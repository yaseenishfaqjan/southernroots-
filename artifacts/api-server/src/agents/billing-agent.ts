import { eq, and, lte } from "drizzle-orm";
import {
  db,
  customersTable,
  jobsTable,
  invoicesTable,
  aiDecisionsTable,
} from "@workspace/db";
import { getStripe } from "../lib/stripe";
import { sendSms } from "../lib/twilio";
import { sendEmail } from "../lib/resend";
import { logger } from "../lib/logger";

export async function autoInvoiceJob(orgId: number, jobId: number): Promise<void> {
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, jobId)));
  if (!job) return;

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.orgId, orgId), eq(customersTable.id, job.customerId)));
  if (!customer) return;

  logger.info({ jobId, customerId: job.customerId }, "Auto-invoicing job");

  let stripeInvoiceId: string | undefined;
  let stripePaymentLinkUrl: string | undefined;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: job.serviceType },
            unit_amount: job.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.APP_URL ?? "http://localhost:5173"}/client/invoice/success`,
      cancel_url: `${process.env.APP_URL ?? "http://localhost:5173"}/client`,
    });
    stripeInvoiceId = session.id;
    stripePaymentLinkUrl = session.url ?? undefined;
  } catch (err) {
    logger.warn({ err }, "Stripe session creation failed");
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      orgId,
      customerId: job.customerId,
      jobId,
      stripeInvoiceId,
      stripePaymentLinkUrl,
      amountCents: job.priceCents,
      status: "sent",
      dueDate,
    })
    .returning();

  const payLink = stripePaymentLinkUrl
    ? ` Pay: ${stripePaymentLinkUrl}`
    : "";
  const smsBody = `Hi ${customer.name}! Invoice #${invoice.id} for $${(job.priceCents / 100).toFixed(2)} is ready.${payLink} -Southern Roots Turf`;

  await sendSms(customer.phone, smsBody).catch((err) =>
    logger.warn({ err }, "Invoice SMS failed")
  );

  if (customer.email) {
    await sendEmail({
      to: customer.email,
      subject: `Invoice #${invoice.id} — $${(job.priceCents / 100).toFixed(2)}`,
      html: `<p>Hi ${customer.name},</p><p>Invoice #${invoice.id} for ${job.serviceType}: <strong>$${(job.priceCents / 100).toFixed(2)}</strong></p>${stripePaymentLinkUrl ? `<p><a href="${stripePaymentLinkUrl}">Pay Now</a></p>` : ""}<p>Due: ${dueDate.toDateString()}</p>`,
    }).catch((err) => logger.warn({ err }, "Invoice email failed"));
  }
}

export async function runPaymentReminders(orgId: number): Promise<void> {
  logger.info("Running payment reminders");
  const now = new Date();

  const overdue = await db
    .select({
      invoice: invoicesTable,
      customer: customersTable,
    })
    .from(invoicesTable)
    .leftJoin(customersTable, eq(invoicesTable.customerId, customersTable.id))
    .where(
      and(
        eq(invoicesTable.orgId, orgId),
        eq(invoicesTable.status, "sent"),
        lte(invoicesTable.dueDate, now)
      )
    );

  let reminded = 0;
  for (const { invoice, customer } of overdue) {
    if (!customer) continue;

    const daysPastDue = Math.floor(
      (now.getTime() - (invoice.dueDate?.getTime() ?? 0)) / 86400000
    );
    const reminderCount = invoice.reminderCount;
    const amount = `$${(invoice.amountCents / 100).toFixed(2)}`;
    let sms = "";

    if (daysPastDue >= 14 && reminderCount < 3) {
      sms = `Final notice: Invoice #${invoice.id} for ${amount} is 14+ days overdue. Service will be suspended. Pay: ${invoice.stripePaymentLinkUrl ?? "southernrootsturf.com"}`;
      await db
        .update(customersTable)
        .set({ tier: "suspended" })
        .where(and(eq(customersTable.orgId, orgId), eq(customersTable.id, customer.id)));
      await db
        .update(invoicesTable)
        .set({ status: "overdue" })
        .where(and(eq(invoicesTable.orgId, orgId), eq(invoicesTable.id, invoice.id)));
    } else if (daysPastDue >= 7 && reminderCount < 2) {
      sms = `Reminder: Invoice #${invoice.id} for ${amount} is 7 days past due. A 5% late fee may apply. Pay: ${invoice.stripePaymentLinkUrl ?? "southernrootsturf.com"}`;
    } else if (daysPastDue >= 1 && reminderCount < 1) {
      sms = `Hi ${customer.name}! Invoice #${invoice.id} for ${amount} is due. Pay here: ${invoice.stripePaymentLinkUrl ?? "southernrootsturf.com"} -Southern Roots`;
    }

    if (sms) {
      await sendSms(customer.phone, sms).catch(() => {});
      await db
        .update(invoicesTable)
        .set({
          reminderCount: reminderCount + 1,
          lastReminderAt: new Date(),
        })
        .where(and(eq(invoicesTable.orgId, orgId), eq(invoicesTable.id, invoice.id)));
      reminded++;
    }
  }

  await db.insert(aiDecisionsTable).values({
    orgId,
    agent: "billing",
    input: { overdueCount: overdue.length },
    output: { reminded },
    reasoning: `Sent ${reminded} payment reminders`,
  });

  logger.info({ reminded }, "Payment reminders complete");
}
