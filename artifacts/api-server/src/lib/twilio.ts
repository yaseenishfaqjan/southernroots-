import { logger } from "./logger";

// SMS is intentionally DISABLED — this product is email-first (Resend).
// sendSms is a safe no-op so existing call sites never invoke Twilio.
export async function sendSms(to: string, _body: string): Promise<void> {
  logger.debug({ to }, "SMS disabled (email-first) — skipping");
}
