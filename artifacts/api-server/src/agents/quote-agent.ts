import { eq } from "drizzle-orm";
import {
  db,
  customersTable,
  propertiesTable,
  quotesTable,
  aiDecisionsTable,
} from "@workspace/db";
import { getOpenAI } from "../lib/openai";
import { getAnthropic } from "../lib/anthropic";
import { sendSms } from "../lib/twilio";
import { sendEmail } from "../lib/resend";
import { logger } from "../lib/logger";

interface QuoteService {
  name: string;
  price: number;
  description: string;
}

interface GPTQuoteResult {
  sqftEstimate: number;
  complexity: "simple" | "moderate" | "complex";
  services: QuoteService[];
  totalMonthly: number;
  totalOneTime: number;
  reasoning: string;
}

export async function runQuoteAgent(
  customerId: number,
  quoteId: number
): Promise<void> {
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, customerId));
  if (!customer) {
    logger.error({ customerId }, "Quote agent: customer not found");
    return;
  }

  const [quote] = await db
    .select()
    .from(quotesTable)
    .where(eq(quotesTable.id, quoteId));
  if (!quote) {
    logger.error({ quoteId }, "Quote agent: quote not found");
    return;
  }

  logger.info({ customerId, quoteId }, "Running quote agent");

  // Step 1: GPT-4o property analysis
  let gptResult: GPTQuoteResult | null = null;
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a professional lawn care estimator. Analyze the address and return a JSON quote with this exact shape:
{
  "sqftEstimate": number,
  "complexity": "simple" | "moderate" | "complex",
  "services": [{"name": string, "price": number, "description": string}],
  "totalMonthly": number,
  "totalOneTime": number,
  "reasoning": string
}
Pricing: mowing $45-$120, landscaping $150-$400, pressure_washing $80-$250, aeration $100-$200, hedges $60-$150.
Use realistic values based on neighborhood type and address.`,
        },
        {
          role: "user",
          content: `Customer: ${customer.name}, Address: ${customer.address}. Services requested: ${JSON.stringify(quote.services)}`,
        },
      ],
    });
    gptResult = JSON.parse(
      completion.choices[0].message.content ?? "{}"
    ) as GPTQuoteResult;
  } catch (err) {
    logger.warn({ err }, "GPT-4o quote failed, using fallback pricing");
    gptResult = {
      sqftEstimate: 3500,
      complexity: "moderate",
      services: [
        {
          name: "Lawn Mowing",
          price: 75,
          description: "Regular weekly mowing service",
        },
      ],
      totalMonthly: 75,
      totalOneTime: 0,
      reasoning: "Fallback pricing (AI unavailable)",
    };
  }

  // Save property data
  const [existing] = await db
    .select()
    .from(propertiesTable)
    .where(eq(propertiesTable.customerId, customerId));
  if (!existing) {
    await db.insert(propertiesTable).values({
      customerId,
      address: customer.address,
      sqftLawn: gptResult.sqftEstimate,
      complexity: gptResult.complexity,
      lastAnalyzedAt: new Date(),
    });
  }

  const totalCents = Math.round(
    (gptResult.totalMonthly + gptResult.totalOneTime) * 100
  );

  // Update quote record
  await db
    .update(quotesTable)
    .set({
      services: gptResult.services,
      totalCents,
      status: "sent",
      aiReasoning: gptResult.reasoning,
      sentAt: new Date(),
    })
    .where(eq(quotesTable.id, quoteId));

  // Step 2: Claude writes SMS
  let smsBody = `Hi ${customer.name}! Your quote for ${customer.address.split(",")[0]}: `;
  smsBody += gptResult.services.map((s) => s.name).join(", ");
  smsBody += ` = $${gptResult.totalMonthly}/mo. Reply YES to book! -Southern Roots Turf`;

  try {
    const anthropic = getAnthropic();
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Write a friendly SMS quote under 160 chars for lawn care customer ${customer.name} at ${customer.address.split(",")[0]}. Services: ${gptResult.services.map((s) => `${s.name} $${s.price}`).join(", ")}. Monthly total: $${gptResult.totalMonthly}. Include a soft call-to-action. Sign off as "Southern Roots Turf".`,
        },
      ],
    });
    const claudeText =
      msg.content[0].type === "text" ? msg.content[0].text : smsBody;
    if (claudeText.length <= 160) smsBody = claudeText;
  } catch (err) {
    logger.warn({ err }, "Claude SMS failed, using template");
  }

  // Step 3: Send SMS
  if (customer.phone) {
    await sendSms(customer.phone, smsBody).catch((err) =>
      logger.warn({ err }, "SMS send failed")
    );
  }

  // Step 4: Send email
  const emailHtml = buildQuoteEmail(customer.name, gptResult, quoteId);
  if (customer.email) {
    await sendEmail({
      to: customer.email,
      subject: `Your Southern Roots Turf Quote — $${gptResult.totalMonthly}/mo`,
      html: emailHtml,
    }).catch((err) => logger.warn({ err }, "Email send failed"));
  }

  // Step 5: Log AI decision
  await db.insert(aiDecisionsTable).values({
    agent: "quote",
    input: {
      customerId,
      address: customer.address,
      services: quote.services,
    },
    output: gptResult,
    reasoning: gptResult.reasoning,
  });

  logger.info({ customerId, quoteId, totalCents }, "Quote agent complete");
}

function buildQuoteEmail(
  name: string,
  quote: GPTQuoteResult,
  quoteId: number
): string {
  const rows = quote.services
    .map(
      (s) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${s.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${s.description}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${s.price}</td>
    </tr>`
    )
    .join("");
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <h1 style="color:#16a34a">Southern Roots Turf</h1>
    <p>Hi ${name},</p>
    <p>Here is your personalized lawn care quote. Estimated lawn size: <strong>${quote.sqftEstimate.toLocaleString()} sqft</strong> (${quote.complexity} complexity).</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f0fdf4">
        <th style="padding:8px;text-align:left">Service</th>
        <th style="padding:8px;text-align:left">Description</th>
        <th style="padding:8px;text-align:right">Price</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="2" style="padding:8px;font-weight:bold">Monthly Total</td>
        <td style="padding:8px;font-weight:bold;text-align:right;color:#16a34a">$${quote.totalMonthly}/mo</td></tr></tfoot>
    </table>
    <p style="margin-top:20px"><a href="${process.env.APP_URL ?? "http://localhost:5173"}/client/request?quoteId=${quoteId}"
      style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Accept This Quote</a></p>
    <p style="color:#666;font-size:12px">Southern Roots Turf — Professional Lawn Care</p>
  </body></html>`;
}
