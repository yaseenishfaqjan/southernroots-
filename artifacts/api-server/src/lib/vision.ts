import { getOpenAI } from "./openai";
import { logger } from "./logger";

export interface LawnMeasurement {
  sqftLawn: number;
  sqftDriveway: number;
  complexity: "simple" | "moderate" | "complex";
  confidence: number; // 0–1; below ~0.5 the quote should be flagged for human review
  reasoning: string;
}

// Measure the maintainable lawn area from a top-down satellite image using a
// vision model. `metersPerPixel` gives the model the real-world scale so its
// pixel-area estimate converts to square feet.
export async function measureLawnFromImage(
  dataUrl: string,
  metersPerPixel: number,
  sizePx: number
): Promise<LawnMeasurement | null> {
  const feetPerPixel = metersPerPixel * 3.28084;
  const sqftPerPixel = feetPerPixel * feetPerPixel;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are an expert at measuring residential lawn areas from top-down satellite imagery. ` +
            `The image is ${sizePx}x${sizePx} pixels and centered on the property. ` +
            `Each pixel covers ${sqftPerPixel.toFixed(4)} square feet of ground. ` +
            `Identify ONLY the maintainable grass/turf area (exclude the house roof, driveway, ` +
            `sidewalks, pavement, pool, decks, and dense tree canopy). Estimate that lawn area in ` +
            `square feet, estimate driveway/hardscape area separately, and rate maintenance ` +
            `complexity (simple = flat open lawn; moderate = some beds/slopes/obstacles; ` +
            `complex = steep, many obstacles, fencing, tight access). ` +
            `Return JSON exactly: {"sqftLawn": number, "sqftDriveway": number, ` +
            `"complexity": "simple"|"moderate"|"complex", "confidence": number, "reasoning": string}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Measure the lawn area for this property." },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<LawnMeasurement>;

    if (typeof parsed.sqftLawn !== "number" || parsed.sqftLawn <= 0) {
      logger.warn({ parsed }, "Vision measurement returned no usable lawn area");
      return null;
    }

    return {
      sqftLawn: Math.round(parsed.sqftLawn),
      sqftDriveway: Math.round(parsed.sqftDriveway ?? 0),
      complexity: parsed.complexity ?? "moderate",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reasoning: parsed.reasoning ?? "",
    };
  } catch (err) {
    logger.warn({ err }, "Vision lawn measurement failed");
    return null;
  }
}
