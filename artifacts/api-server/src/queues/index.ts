import { Queue, Worker } from "bullmq";
import { getRedis } from "../lib/redis";
import { logger } from "../lib/logger";
import { runQuoteAgent } from "../agents/quote-agent";

export type AgentJobData =
  | { type: "ai-quote"; orgId: number; customerId: number; quoteId: number }
  | { type: "send-invoice"; orgId: number; invoiceId: number }
  | { type: "payment-reminder"; orgId: number; invoiceId: number }
  | { type: "upsell-outreach"; orgId: number; customerId: number; trigger: string };

let _queue: Queue | null = null;

export function getAgentQueue(): Queue {
  if (!_queue) {
    _queue = new Queue("ai-agents", {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 7 * 86400 },
      },
    });
  }
  return _queue;
}

export function startQueueWorker(): void {
  const worker = new Worker<AgentJobData>(
    "ai-agents",
    async (job) => {
      logger.info({ jobId: job.id, type: job.data.type }, "Processing agent job");
      if (job.data.type === "ai-quote") {
        await runQuoteAgent(job.data.orgId, job.data.customerId, job.data.quoteId);
      }
      // Other job types are handled by agents that enqueue themselves
    },
    { connection: getRedis(), concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, "Agent job failed");
  });

  logger.info("BullMQ worker started");
}
