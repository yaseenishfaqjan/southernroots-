import { eq, ne, and } from "drizzle-orm";
import {
  db,
  customersTable,
  jobsTable,
  aiDecisionsTable,
} from "@workspace/db";
import { getAnthropic } from "../lib/anthropic";
import { sendSms } from "../lib/twilio";
import { logger } from "../lib/logger";

interface Opportunity {
  customer: typeof customersTable.$inferSelect;
  trigger: string;
  suggestedService: string;
  estimatedRevenue: number;
}

export async function runUpsellScan(orgId: number): Promise<void> {
  logger.info("Running upsell scan");

  const customers = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.orgId, orgId), ne(customersTable.tier, "suspended")));

  const month = new Date().getMonth() + 1; // 1-12
  const opportunities: Opportunity[] = [];

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

    const serviceTypes = new Set(jobs.map((j) => j.serviceType));

    if (
      serviceTypes.has("mowing") &&
      !serviceTypes.has("landscaping")
    ) {
      opportunities.push({
        customer,
        trigger: "has_mowing_no_landscaping",
        suggestedService: "Landscaping Package",
        estimatedRevenue: 300,
      });
    }
    if (
      serviceTypes.has("mowing") &&
      !serviceTypes.has("pressure_washing")
    ) {
      opportunities.push({
        customer,
        trigger: "has_mowing_no_pressure_washing",
        suggestedService: "Pressure Washing",
        estimatedRevenue: 150,
      });
    }
    if ([3, 4].includes(month)) {
      opportunities.push({
        customer,
        trigger: "spring_season",
        suggestedService: "Spring Aeration & Fertilization",
        estimatedRevenue: 200,
      });
    }
    if (month === 10) {
      opportunities.push({
        customer,
        trigger: "fall_season",
        suggestedService: "Leaf Cleanup & Winterization",
        estimatedRevenue: 250,
      });
    }

    // Winback
    const lastJob = jobs.sort(
      (a, b) =>
        (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    )[0];
    if (lastJob && jobs.length >= 2) {
      const daysSince = Math.floor(
        (Date.now() - (lastJob.createdAt?.getTime() ?? 0)) / 86400000
      );
      if (daysSince >= 45) {
        opportunities.push({
          customer,
          trigger: "winback",
          suggestedService: "Re-engagement discount",
          estimatedRevenue: 100,
        });
      }
    }
  }

  // Sort by revenue potential, take top 20
  opportunities.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
  const top20 = opportunities.slice(0, 20);

  let sent = 0;
  for (const opp of top20) {
    let smsBody = `Hi ${opp.customer.name}! Time to upgrade your lawn care with ${opp.suggestedService}. Reply for a free quote! -Southern Roots`;

    try {
      const anthropic = getAnthropic();
      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Write a warm, brief SMS under 140 chars for lawn care customer ${opp.customer.name}. Upsell opportunity: ${opp.trigger}. Suggested service: ${opp.suggestedService}. Never be pushy. Soft call-to-action. Sign as "Southern Roots".`,
          },
        ],
      });
      const text =
        msg.content[0].type === "text" ? msg.content[0].text : smsBody;
      if (text.length <= 140) smsBody = text;
    } catch {
      /* use template */
    }

    await sendSms(opp.customer.phone, smsBody).catch(() => {});
    sent++;
  }

  await db.insert(aiDecisionsTable).values({
    orgId,
    agent: "upsell",
    input: {
      customersScanned: customers.length,
      opportunitiesFound: opportunities.length,
    },
    output: {
      sent,
      top20: top20.map((o) => ({
        customerId: o.customer.id,
        trigger: o.trigger,
        service: o.suggestedService,
      })),
    },
    reasoning: `Sent ${sent} upsell messages from ${opportunities.length} opportunities`,
  });

  logger.info({ sent }, "Upsell scan complete");
}
