import { eq, ne, and } from "drizzle-orm";
import {
  db,
  customersTable,
  jobsTable,
  invoicesTable,
  escalationsTable,
  aiDecisionsTable,
} from "@workspace/db";
import { getOpenAI } from "../lib/openai";
import { sendEmail } from "../lib/resend";
import { logger } from "../lib/logger";

function calcChurnRisk(
  daysSinceLastJob: number,
  latePayments: number,
  totalJobs: number,
  escalations: number
): number {
  let score = 0;
  score += Math.min(daysSinceLastJob / 60, 1) * 0.4; // 40% weight
  score += Math.min(latePayments / 3, 1) * 0.3; // 30% weight
  score += (totalJobs < 3 ? 0.2 : 0) * 0.2; // 20% weight
  score += Math.min(escalations / 2, 1) * 0.1; // 10% weight
  return Math.min(score, 1.0);
}

export async function runChurnPrevention(orgId: number): Promise<void> {
  logger.info("Running churn prevention agent");

  const customers = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.orgId, orgId), ne(customersTable.tier, "suspended")));

  let highRiskCount = 0;

  for (const customer of customers) {
    const jobs = await db
      .select()
      .from(jobsTable)
      .where(
        and(
          eq(jobsTable.orgId, orgId),
          eq(jobsTable.customerId, customer.id),
          ne(jobsTable.status, "cancelled")
        )
      );

    const overdueInvoices = await db
      .select()
      .from(invoicesTable)
      .where(
        and(
          eq(invoicesTable.orgId, orgId),
          eq(invoicesTable.customerId, customer.id),
          eq(invoicesTable.status, "overdue")
        )
      );

    const escalations = await db
      .select()
      .from(escalationsTable)
      .where(and(eq(escalationsTable.orgId, orgId), eq(escalationsTable.customerId, customer.id)));

    const lastJob = jobs.sort(
      (a, b) =>
        (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    )[0];
    const daysSinceLastJob = lastJob
      ? Math.floor(
          (Date.now() - (lastJob.createdAt?.getTime() ?? 0)) / 86400000
        )
      : 999;

    const churnRisk = calcChurnRisk(
      daysSinceLastJob,
      overdueInvoices.length,
      jobs.length,
      escalations.length
    );

    // Update churn risk
    await db
      .update(customersTable)
      .set({ churnRisk })
      .where(and(eq(customersTable.orgId, orgId), eq(customersTable.id, customer.id)));

    if (churnRisk > 0.7) {
      highRiskCount++;

      // Get retention recommendation
      let retentionAction = "Offer a 10% discount on next service";
      let smsBody = `Hi ${customer.name}! We miss you! Book your next lawn service and get 10% off. Call or text us anytime. -Southern Roots`;

      try {
        const openai = getOpenAI();
        const rec = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a customer retention specialist. Suggest one specific retention action.",
            },
            {
              role: "user",
              content: `Customer ${customer.name}: ${jobs.length} jobs, ${daysSinceLastJob} days since last, ${overdueInvoices.length} overdue invoices, ${escalations.length} escalations. Churn risk: ${churnRisk.toFixed(2)}`,
            },
          ],
        });
        retentionAction =
          rec.choices[0].message.content ?? retentionAction;
      } catch {
        /* use default */
      }

      try {
        const ai = getOpenAI();
        const winback = await ai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 180,
          messages: [
            {
              role: "user",
              content: `Write a warm win-back email (2-3 sentences) for ${customer.name}. Context: ${daysSinceLastJob} days since last service. Retention plan: ${retentionAction}. Tone: caring, never desperate. Sign as "Southern Roots Turf".`,
            },
          ],
        });
        const text = winback.choices[0]?.message?.content;
        if (text) smsBody = text;
      } catch {
        /* use template */
      }

      if (customer.email) {
        await sendEmail({
          to: customer.email,
          subject: "We'd love to have you back 🌱",
          html: `<p>${smsBody.replace(/\n/g, "<br>")}</p>`,
        }).catch(() => {});
      }

      await db.insert(aiDecisionsTable).values({
        orgId,
        agent: "churn",
        input: {
          customerId: customer.id,
          churnRisk,
          daysSinceLastJob,
        },
        output: { retentionAction, smsSent: true },
        reasoning: `High churn risk ${churnRisk.toFixed(2)} — retention outreach triggered`,
      });
    }
  }

  logger.info({ highRiskCount }, "Churn prevention complete");
}
