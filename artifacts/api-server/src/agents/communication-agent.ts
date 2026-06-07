import { eq, and } from "drizzle-orm";
import {
  db,
  customersTable,
  jobsTable,
  invoicesTable,
  conversationsTable,
  escalationsTable,
  aiDecisionsTable,
} from "@workspace/db";
import { getOpenAI } from "../lib/openai";
import { getRedis } from "../lib/redis";
import { sendSms } from "../lib/twilio";
import { logger } from "../lib/logger";

const CONV_TTL = 86400; // 24h
const MAX_HISTORY = 20;

interface Message {
  role: "user" | "assistant";
  content: string;
}

async function getHistory(phone: string): Promise<Message[]> {
  const redis = getRedis();
  const raw = await redis.get(`conv:${phone}`);
  return raw ? (JSON.parse(raw) as Message[]) : [];
}

async function saveHistory(phone: string, messages: Message[]): Promise<void> {
  const redis = getRedis();
  const trimmed = messages.slice(-MAX_HISTORY);
  await redis.setex(`conv:${phone}`, CONV_TTL, JSON.stringify(trimmed));
}

export async function handleInboundSms(
  from: string,
  body: string
): Promise<void> {
  logger.info({ from }, "Handling inbound SMS");

  const phone = from.replace(/\D/g, "");
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.phone, phone));

  if (!customer) {
    logger.info({ from }, "Inbound SMS from unknown customer — ignoring");
    return;
  }

  const orgId = customer.orgId;

  // Log inbound
  await db.insert(conversationsTable).values({
    orgId,
    customerPhone: phone,
    direction: "inbound",
    message: body,
    aiHandled: true,
  });

  // Load context
  const jobs = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.customerId, customer.id)))
    .limit(5);

  const invoices = await db
    .select()
    .from(invoicesTable)
    .where(and(eq(invoicesTable.orgId, orgId), eq(invoicesTable.customerId, customer.id)))
    .limit(3);

  const history = await getHistory(phone);
  history.push({ role: "user", content: body });

  const systemPrompt = `You are the AI customer service agent for Southern Roots Turf.
Customer: ${customer ? `${customer.name} (${customer.tier} tier)` : "Unknown customer"}
Recent jobs: ${JSON.stringify(
    jobs
      .slice(0, 3)
      .map((j) => ({
        id: j.id,
        service: j.serviceType,
        status: j.status,
        date: j.scheduledDate,
      }))
  )}
Outstanding invoices: ${invoices.filter((i) => i.status !== "paid").length}

Rules:
- Reply in under 160 chars
- Never make up data
- If you need to take action, include [ACTION:{"type":"reschedule","jobId":1,"newDate":"2025-01-15"}] OR [ACTION:{"type":"cancel","jobId":1}] OR [ACTION:{"type":"escalate","reason":"..."}] OR [ACTION:{"type":"send_payment_link","invoiceId":1}]
- Be warm, helpful, brief`;

  let reply =
    "Thanks for reaching out! Our team will follow up shortly. -Southern Roots Turf";
  let actionExecuted = false;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, ...history],
    });
    const raw = completion.choices[0].message.content ?? reply;

    // Parse and execute [ACTION:{...}]
    const actionMatch = raw.match(/\[ACTION:(\{.*?\})\]/);
    if (actionMatch) {
      try {
        const action = JSON.parse(actionMatch[1]) as {
          type: string;
          jobId?: number;
          newDate?: string;
          reason?: string;
          invoiceId?: number;
        };
        if (action.type === "reschedule" && action.jobId && action.newDate) {
          await db
            .update(jobsTable)
            .set({ scheduledDate: new Date(action.newDate) })
            .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, action.jobId)));
          actionExecuted = true;
        } else if (action.type === "cancel" && action.jobId) {
          await db
            .update(jobsTable)
            .set({ status: "cancelled" })
            .where(and(eq(jobsTable.orgId, orgId), eq(jobsTable.id, action.jobId)));
          actionExecuted = true;
        } else if (action.type === "escalate" && action.reason) {
          await db.insert(escalationsTable).values({
            orgId,
            customerId: customer.id,
            reason: action.reason,
          });
          actionExecuted = true;
        }
      } catch {
        /* ignore parse errors */
      }
    }

    reply = raw
      .replace(/\[ACTION:.*?\]/g, "")
      .trim()
      .slice(0, 160);
  } catch (err) {
    logger.warn({ err }, "GPT-4o communication failed");
  }

  history.push({ role: "assistant", content: reply });
  await saveHistory(phone, history);

  await sendSms(from, reply).catch((err) =>
    logger.warn({ err }, "Reply SMS failed")
  );

  await db.insert(conversationsTable).values({
    orgId,
    customerPhone: phone,
    direction: "outbound",
    message: reply,
    aiHandled: true,
  });

  await db.insert(aiDecisionsTable).values({
    orgId,
    agent: "communication",
    input: { from, body },
    output: { reply, actionExecuted },
    reasoning: "Inbound SMS handled by GPT-4o",
  });
}
