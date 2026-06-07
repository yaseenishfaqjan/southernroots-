import cron from "node-cron";
import { eq } from "drizzle-orm";
import { db, organizationsTable } from "@workspace/db";
import { runDailyDispatch } from "./agents/dispatch-agent";
import { sendOwnerBriefing } from "./agents/briefing-agent";
import { runPaymentReminders } from "./agents/billing-agent";
import { runUpsellScan } from "./agents/upsell-agent";
import { runChurnPrevention } from "./agents/churn-agent";
import { logger } from "./lib/logger";

async function activeOrgIds(): Promise<{ id: number }[]> {
  return db
    .select({ id: organizationsTable.id })
    .from(organizationsTable)
    .where(eq(organizationsTable.status, "active"));
}

export function startCronJobs(): void {
  // 6 AM ET — assign today's jobs to workers
  cron.schedule(
    "0 6 * * *",
    async () => {
      logger.info("CRON: daily dispatch");
      const orgs = await activeOrgIds();
      for (const o of orgs) {
        await runDailyDispatch(o.id).catch((err) =>
          logger.error({ err, orgId: o.id }, "Dispatch cron failed")
        );
      }
    },
    { timezone: "America/New_York" }
  );

  // 7 AM ET — send owner daily briefing
  cron.schedule(
    "0 7 * * *",
    async () => {
      logger.info("CRON: owner briefing");
      const orgs = await activeOrgIds();
      for (const o of orgs) {
        await sendOwnerBriefing(o.id).catch((err) =>
          logger.error({ err, orgId: o.id }, "Briefing cron failed")
        );
      }
    },
    { timezone: "America/New_York" }
  );

  // 9 AM ET — payment reminders for overdue invoices
  cron.schedule(
    "0 9 * * *",
    async () => {
      logger.info("CRON: payment reminders");
      const orgs = await activeOrgIds();
      for (const o of orgs) {
        await runPaymentReminders(o.id).catch((err) =>
          logger.error({ err, orgId: o.id }, "Payment reminder cron failed")
        );
      }
    },
    { timezone: "America/New_York" }
  );

  // 8 AM ET every Sunday — weekly upsell scan
  cron.schedule(
    "0 8 * * 0",
    async () => {
      logger.info("CRON: upsell scan");
      const orgs = await activeOrgIds();
      for (const o of orgs) {
        await runUpsellScan(o.id).catch((err) =>
          logger.error({ err, orgId: o.id }, "Upsell cron failed")
        );
      }
    },
    { timezone: "America/New_York" }
  );

  // 8 AM ET every Monday — churn prevention
  cron.schedule(
    "0 8 * * 1",
    async () => {
      logger.info("CRON: churn prevention");
      const orgs = await activeOrgIds();
      for (const o of orgs) {
        await runChurnPrevention(o.id).catch((err) =>
          logger.error({ err, orgId: o.id }, "Churn cron failed")
        );
      }
    },
    { timezone: "America/New_York" }
  );

  logger.info("All cron jobs scheduled");
}
