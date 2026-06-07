import { eq, ne, and } from "drizzle-orm";
import {
  db,
  customersTable,
  jobsTable,
  aiDecisionsTable,
} from "@workspace/db";
import { getOpenAI } from "../lib/openai";
import { sendEmail } from "../lib/resend";
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
    let body = `Hi ${opp.customer.name}, it could be a great time to add ${opp.suggestedService} to your lawn care. Just reply to this email for a free quote! — Southern Roots Turf`;

    try {
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 180,
        messages: [
          {
            role: "user",
            content: `Write a warm, brief email (2-3 sentences) for lawn-care customer ${opp.customer.name}. Upsell opportunity: ${opp.trigger}. Suggested service: ${opp.suggestedService}. Never be pushy. Soft call-to-action. Sign as "Southern Roots Turf".`,
          },
        ],
      });
      const text = completion.choices[0]?.message?.content;
      if (text) body = text;
    } catch {
      /* use template */
    }

    if (opp.customer.email) {
      await sendEmail({
        to: opp.customer.email,
        subject: "A quick idea for your lawn 🌱",
        html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
      }).catch(() => {});
      sent++;
    }
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
