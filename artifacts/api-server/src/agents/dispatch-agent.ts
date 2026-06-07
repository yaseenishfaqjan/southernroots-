import { eq, and, gte, lte } from "drizzle-orm";
import {
  db,
  jobsTable,
  workersTable,
  assignmentsTable,
  aiDecisionsTable,
} from "@workspace/db";
import { getOpenAI } from "../lib/openai";
import { sendSms } from "../lib/twilio";
import { logger } from "../lib/logger";

interface DispatchAssignment {
  jobId: number;
  workerId: number;
  reasoning: string;
}

export async function runDailyDispatch(orgId: number): Promise<void> {
  logger.info("Running daily dispatch agent");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Unassigned jobs for today
  const unassignedJobs = await db
    .select()
    .from(jobsTable)
    .where(
      and(
        eq(jobsTable.orgId, orgId),
        eq(jobsTable.status, "new"),
        gte(jobsTable.scheduledDate, today),
        lte(jobsTable.scheduledDate, tomorrow)
      )
    );

  if (unassignedJobs.length === 0) {
    logger.info("No unassigned jobs for today — dispatch skipped");
    return;
  }

  // Active workers
  const workers = await db
    .select()
    .from(workersTable)
    .where(and(eq(workersTable.orgId, orgId), eq(workersTable.isActive, true)));

  if (workers.length === 0) {
    logger.warn("No active workers for dispatch");
    return;
  }

  // GPT-4o dispatch decision
  let assignments: DispatchAssignment[] = [];
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a lawn care dispatch optimizer. Assign workers to jobs optimally.
Rules: max 6 jobs per worker per day, balance workload, match specialty when possible, cluster geographically.
Return JSON: { "assignments": [{ "jobId": number, "workerId": number, "reasoning": string }] }`,
        },
        {
          role: "user",
          content: JSON.stringify({ jobs: unassignedJobs, workers }),
        },
      ],
    });
    const parsed = JSON.parse(
      completion.choices[0].message.content ?? "{}"
    ) as { assignments: DispatchAssignment[] };
    assignments = parsed.assignments ?? [];
  } catch (err) {
    logger.warn({ err }, "GPT-4o dispatch failed — round-robin fallback");
    assignments = unassignedJobs.map((job, i) => ({
      jobId: job.id,
      workerId: workers[i % workers.length].id,
      reasoning: "Round-robin fallback assignment",
    }));
  }

  // Execute assignments
  for (const a of assignments) {
    await db
      .insert(assignmentsTable)
      .values({ orgId, jobId: a.jobId, workerId: a.workerId })
      .catch(() => {});
    await db
      .update(jobsTable)
      .set({ status: "assigned" })
      .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, a.jobId)));
  }

  // Group by worker and send SMS
  const byWorker = new Map<number, typeof assignments>();
  for (const a of assignments) {
    if (!byWorker.has(a.workerId)) byWorker.set(a.workerId, []);
    byWorker.get(a.workerId)!.push(a);
  }

  for (const [workerId, workerJobs] of byWorker) {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker?.phone) continue;
    const msg = `Good morning ${worker.name}! You have ${workerJobs.length} job${workerJobs.length > 1 ? "s" : ""} today. View your route: ${process.env.APP_URL ?? "http://localhost:5174"}/jobs`;
    await sendSms(worker.phone, msg).catch((err) =>
      logger.warn({ err }, "Dispatch SMS failed")
    );
  }

  await db.insert(aiDecisionsTable).values({
    orgId,
    agent: "dispatch",
    input: {
      jobCount: unassignedJobs.length,
      workerCount: workers.length,
    },
    output: { assignments },
    reasoning: `Assigned ${assignments.length} jobs to ${byWorker.size} workers`,
  });

  logger.info({ assigned: assignments.length }, "Dispatch agent complete");
}
