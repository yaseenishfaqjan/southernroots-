import cron from "node-cron";
import { runDailyDispatch } from "./agents/dispatch-agent";
import { sendOwnerBriefing } from "./agents/briefing-agent";
import { runPaymentReminders } from "./agents/billing-agent";
import { runUpsellScan } from "./agents/upsell-agent";
import { runChurnPrevention } from "./agents/churn-agent";
import { logger } from "./lib/logger";

export function startCronJobs(): void {
  // 6 AM ET — assign today's jobs to workers
  cron.schedule(
    "0 6 * * *",
    async () => {
      logger.info("CRON: daily dispatch");
      await runDailyDispatch().catch((err) =>
        logger.error({ err }, "Dispatch cron failed")
      );
    },
    { timezone: "America/New_York" }
  );

  // 7 AM ET — send owner daily briefing
  cron.schedule(
    "0 7 * * *",
    async () => {
      logger.info("CRON: owner briefing");
      await sendOwnerBriefing().catch((err) =>
        logger.error({ err }, "Briefing cron failed")
      );
    },
    { timezone: "America/New_York" }
  );

  // 9 AM ET — payment reminders for overdue invoices
  cron.schedule(
    "0 9 * * *",
    async () => {
      logger.info("CRON: payment reminders");
      await runPaymentReminders().catch((err) =>
        logger.error({ err }, "Payment reminder cron failed")
      );
    },
    { timezone: "America/New_York" }
  );

  // 8 AM ET every Sunday — weekly upsell scan
  cron.schedule(
    "0 8 * * 0",
    async () => {
      logger.info("CRON: upsell scan");
      await runUpsellScan().catch((err) =>
        logger.error({ err }, "Upsell cron failed")
      );
    },
    { timezone: "America/New_York" }
  );

  // 8 AM ET every Monday — churn prevention
  cron.schedule(
    "0 8 * * 1",
    async () => {
      logger.info("CRON: churn prevention");
      await runChurnPrevention().catch((err) =>
        logger.error({ err }, "Churn cron failed")
      );
    },
    { timezone: "America/New_York" }
  );

  logger.info("All cron jobs scheduled");
}
