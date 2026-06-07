import app from "./app";
import { startCronJobs } from "./cron";
import { startQueueWorker } from "./queues";
import { logger } from "./lib/logger";

const PORT = parseInt(process.env.PORT ?? "3001");

app.listen(PORT, () => {
  logger.info({ port: PORT }, "API server started");
  startCronJobs();
  startQueueWorker();
});
