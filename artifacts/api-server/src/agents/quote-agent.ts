import { and, eq } from "drizzle-orm";
import {
  db,
  customersTable,
  propertiesTable,
  quotesTable,
  aiDecisionsTable,
} from "@workspace/db";
import { getAnthropic } from "../lib/anthropic";
import { geocodeAddress, fetchSatelliteImage } from "../lib/maps";
import { measureLawnFromImage, type LawnMeasurement } from "../lib/vision";
import { priceQuote, type PricedService } from "../lib/pricing";
import { sendSms } from "../lib/twilio";
import { sendEmail } from "../lib/resend";
import { logger } from "../lib/logger";

// Confidence below this gets flagged on the quote for a human to eyeball.
const LOW_CONFIDENCE_THRESHOLD = 0.5;

export async function runQuoteAgent(
  orgId: number,
  customerId: number,
  quoteId: number
): Promise<void> {
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.orgId, orgId), eq(customersTable.id, customerId)));
  if (!customer) {
    logger.error({ orgId, customerId }, "Quote agent: customer not found");
    return;
  }

  const [quote] = await db
    .select()
    .from(quotesTable)
    .where(and(eq(quotesTable.orgId, orgId), eq(quotesTable.id, quoteId)));
  if (!quote) {
    logger.error({ quoteId }, "Quote agent: quote not found");
    return;
  }

  logger.info({ customerId, quoteId }, "Running quote agent (satellite + vision)");

  const servicesWanted = Array.isArray(quote.services)
    ? (quote.services as unknown[]).map((s) => String(s))
    : [];

  // ── Step 1: Geocode the address ──────────────────────────────────────────
  const geo = await geocodeAddress(customer.address);

  // ── Step 2: Fetch satellite image + measure the lawn with a vision model ──
  let measurement: LawnMeasurement | null = null;
  let measured = false;
  if (geo) {
    const sat = await fetchSatelliteImage(geo.lat, geo.lng);
    if (sat) {
      measurement = await measureLawnFromImage(
        sat.dataUrl,
        sat.metersPerPixel,
        sat.sizePx
      );
      measured = measurement !== null;
    }
  }

  // Fallback when maps/vision are unavailable: a conservative heuristic so the
  // pipeline still produces a quote rather than failing the lead.
  if (!measurement) {
    logger.warn(
      { customerId },
      "Falling back to heuristic measurement (geocode/satellite/vision unavailable)"
    );
    measurement = {
      sqftLawn: 4000,
      sqftDriveway: 600,
      complexity: "moderate",
      confidence: 0.2,
      reasoning: "Heuristic estimate — satellite measurement unavailable.",
    };
  }

  // ── Step 3: Deterministic pricing engine ─────────────────────────────────
  const pricing = priceQuote({
    sqftLawn: measurement.sqftLawn,
    complexity: measurement.complexity,
    servicesWanted,
  });

  const totalCents = Math.round(
    (pricing.totalMonthly + pricing.totalOneTime) * 100
  );
  const lowConfidence = measurement.confidence < LOW_CONFIDENCE_THRESHOLD;

  // ── Step 4: Persist property measurement ─────────────────────────────────
  const [existingProperty] = await db
    .select()
    .from(propertiesTable)
    .where(and(eq(propertiesTable.orgId, orgId), eq(propertiesTable.customerId, customerId)));

  const propertyValues = {
    orgId,
    customerId,
    address: geo?.formattedAddress ?? customer.address,
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
    sqftLawn: measurement.sqftLawn,
    sqftDriveway: measurement.sqftDriveway,
    complexity: measurement.complexity,
    lastAnalyzedAt: new Date(),
  };

  if (existingProperty) {
    await db
      .update(propertiesTable)
      .set(propertyValues)
      .where(and(eq(propertiesTable.orgId, orgId), eq(propertiesTable.id, existingProperty.id)));
  } else {
    await db.insert(propertiesTable).values(propertyValues);
  }

  // ── Step 5: Update the quote record ──────────────────────────────────────
  const reasoning =
    `Lawn ${measurement.sqftLawn.toLocaleString()} sqft, ${measurement.complexity} complexity ` +
    `(confidence ${(measurement.confidence * 100).toFixed(0)}%). ${measurement.reasoning}`;

  await db
    .update(quotesTable)
    .set({
      services: pricing.services,
      totalCents,
      status: lowConfidence ? "needs_review" : "sent",
      aiReasoning: reasoning,
      sentAt: new Date(),
    })
    .where(and(eq(quotesTable.orgId, orgId), eq(quotesTable.id, quoteId)));

  // ── Step 6: Claude writes the customer-facing SMS (numbers come from us) ──
  let smsBody = buildFallbackSms(customer.name, customer.address, pricing.totalMonthly);
  try {
    const anthropic = getAnthropic();
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content:
            `Write a friendly SMS quote under 160 chars for lawn-care customer ${customer.name} ` +
            `at ${customer.address.split(",")[0]}. We measured their lawn at ` +
            `${measurement.sqftLawn.toLocaleString()} sqft. Services: ` +
            `${pricing.services.map((s) => `${s.name} $${s.price}${s.unit === "monthly" ? "/mo" : ""}`).join(", ")}. ` +
            `Monthly total: $${pricing.totalMonthly}/mo. Include a soft call-to-action. ` +
            `Sign off as "Southern Roots Turf".`,
        },
      ],
    });
    const claudeText = msg.content[0]?.type === "text" ? msg.content[0].text : smsBody;
    if (claudeText.length <= 160) smsBody = claudeText;
  } catch (err) {
    logger.warn({ err }, "Claude SMS failed, using template");
  }

  // ── Step 7: Send SMS + email ─────────────────────────────────────────────
  if (customer.phone && !lowConfidence) {
    await sendSms(customer.phone, smsBody).catch((err) =>
      logger.warn({ err }, "SMS send failed")
    );
  }
  if (customer.email && !lowConfidence) {
    await sendEmail({
      to: customer.email,
      subject: `Your Southern Roots Turf Quote — $${pricing.totalMonthly}/mo`,
      html: buildQuoteEmail(customer.name, measurement, pricing.services, pricing.totalMonthly, quoteId),
    }).catch((err) => logger.warn({ err }, "Email send failed"));
  }

  // ── Step 8: Log the AI decision for auditability ─────────────────────────
  await db.insert(aiDecisionsTable).values({
    orgId,
    agent: "quote",
    input: { customerId, address: customer.address, servicesWanted },
    output: { measurement, pricing, measured, lowConfidence },
    reasoning,
  });

  logger.info(
    { customerId, quoteId, totalCents, measured, confidence: measurement.confidence, lowConfidence },
    "Quote agent complete"
  );
}

function buildFallbackSms(name: string, address: string, totalMonthly: number): string {
  return (
    `Hi ${name}! Your Southern Roots Turf quote for ${address.split(",")[0]}: ` +
    `$${totalMonthly}/mo. Reply YES to book!`
  );
}

function buildQuoteEmail(
  name: string,
  measurement: LawnMeasurement,
  services: PricedService[],
  totalMonthly: number,
  quoteId: number
): string {
  const rows = services
    .map(
      (s) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${s.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${s.description}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${s.price}${s.unit === "monthly" ? "/mo" : ""}</td>
    </tr>`
    )
    .join("");
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <h1 style="color:#16a34a">Southern Roots Turf</h1>
    <p>Hi ${name},</p>
    <p>We measured your property from satellite imagery — lawn area <strong>${measurement.sqftLawn.toLocaleString()} sqft</strong> (${measurement.complexity} complexity). Here is your personalized quote:</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f0fdf4">
        <th style="padding:8px;text-align:left">Service</th>
        <th style="padding:8px;text-align:left">Description</th>
        <th style="padding:8px;text-align:right">Price</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="2" style="padding:8px;font-weight:bold">Monthly Total</td>
        <td style="padding:8px;font-weight:bold;text-align:right;color:#16a34a">$${totalMonthly}/mo</td></tr></tfoot>
    </table>
    <p style="margin-top:20px"><a href="${process.env.APP_URL ?? "http://localhost:5173"}/client/request?quoteId=${quoteId}"
      style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Accept This Quote</a></p>
    <p style="color:#666;font-size:12px">Southern Roots Turf — Professional Lawn Care</p>
  </body></html>`;
}
