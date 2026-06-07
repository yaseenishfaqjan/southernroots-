import { gte, lte, eq, and, lt, sql } from "drizzle-orm";
import {
  db,
  jobsTable,
  invoicesTable,
  customersTable,
  kpiSnapshotsTable,
  aiDecisionsTable,
} from "@workspace/db";
import { getOpenAI } from "../lib/openai";
import { sendSms } from "../lib/twilio";
import { sendEmail } from "../lib/resend";
import { logger } from "../lib/logger";

export async function sendOwnerBriefing(orgId: number): Promise<void> {
  logger.info("Running owner briefing agent");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const today = new Date(yesterday);
  today.setDate(today.getDate() + 1);

  const completedJobs = await db
    .select()
    .from(jobsTable)
    .where(
      and(
        eq(jobsTable.orgId, orgId),
        gte(jobsTable.completedAt, yesterday),
        lt(jobsTable.completedAt, today)
      )
    );

  const revenueResult = await db
    .select({ total: sql<string>`sum(price_cents)` })
    .from(jobsTable)
    .where(
      and(
        eq(jobsTable.orgId, orgId),
        gte(jobsTable.completedAt, yesterday),
        eq(jobsTable.status, "paid")
      )
    );

  const totalRevenueCents = parseInt(revenueResult[0]?.total ?? "0");

  const newLeads = await db
    .select()
    .from(customersTable)
    .where(
      and(
        eq(customersTable.orgId, orgId),
        gte(customersTable.createdAt, yesterday),
        lte(customersTable.createdAt, today)
      )
    );

  const outstandingInvoices = await db
    .select({
      total: sql<string>`sum(amount_cents)`,
      count: sql<string>`count(*)`,
    })
    .from(invoicesTable)
    .where(and(eq(invoicesTable.orgId, orgId), eq(invoicesTable.status, "sent")));

  const allWorkerJobs = await db
    .select()
    .from(jobsTable)
    .where(
      and(
        eq(jobsTable.orgId, orgId),
        gte(jobsTable.scheduledDate, yesterday),
        lte(jobsTable.scheduledDate, today)
      )
    );

  const utilization =
    allWorkerJobs.length > 0
      ? completedJobs.length / allWorkerJobs.length
      : 0;

  const mrrResult = await db
    .select({ total: sql<string>`sum(mrr)` })
    .from(customersTable)
    .where(and(eq(customersTable.orgId, orgId), eq(customersTable.tier, "standard")));
  const mrrCents = parseInt(mrrResult[0]?.total ?? "0");

  const kpiData = {
    revenue: totalRevenueCents,
    jobsCompleted: completedJobs.length,
    newLeads: newLeads.length,
    utilization,
    mrrCents,
    outstandingCents: parseInt(outstandingInvoices[0]?.total ?? "0"),
    outstandingCount: parseInt(outstandingInvoices[0]?.count ?? "0"),
  };

  // GPT-4o briefing
  let briefingText = `Southern Roots Turf Daily Briefing\n\nRevenue: $${(totalRevenueCents / 100).toFixed(0)}\nJobs completed: ${completedJobs.length}\nNew leads: ${newLeads.length}\nUtilization: ${Math.round(utilization * 100)}%\nMRR: $${(mrrCents / 100).toFixed(0)}`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a business intelligence AI. Write a concise daily briefing for a lawn care business owner. Include 1 sentence performance summary, 5 key metrics with context, any anomalies, and 1 specific recommendation. Tone: professional, direct.",
        },
        {
          role: "user",
          content: `Yesterday's data: ${JSON.stringify(kpiData)}`,
        },
      ],
    });
    briefingText = completion.choices[0].message.content ?? briefingText;
  } catch (err) {
    logger.warn({ err }, "GPT briefing failed");
  }

  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPhone = process.env.OWNER_PHONE_NUMBER;

  if (ownerEmail) {
    await sendEmail({
      to: ownerEmail,
      subject: `Southern Roots Turf — Daily Briefing ${yesterday.toDateString()}`,
      html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${briefingText}</pre>`,
    }).catch((err) => logger.warn({ err }, "Briefing email failed"));
  }

  if (ownerPhone) {
    const shortMsg = `SRT Briefing: $${(totalRevenueCents / 100).toFixed(0)} revenue, ${completedJobs.length} jobs, ${newLeads.length} leads. MRR $${(mrrCents / 100).toFixed(0)}/mo`;
    await sendSms(ownerPhone, shortMsg).catch((err) =>
      logger.warn({ err }, "Briefing SMS failed")
    );
  }

  // Save KPI snapshot
  await db.insert(kpiSnapshotsTable).values({
    orgId,
    date: yesterday,
    totalRevenueCents,
    jobsCompleted: completedJobs.length,
    newLeads: newLeads.length,
    crewUtilization: utilization,
    mrrCents,
    churnCount: 0,
  });

  await db.insert(aiDecisionsTable).values({
    orgId,
    agent: "briefing",
    input: kpiData,
    output: { briefingText },
    reasoning: "Daily KPI briefing generated",
  });

  logger.info("Owner briefing complete");
}
