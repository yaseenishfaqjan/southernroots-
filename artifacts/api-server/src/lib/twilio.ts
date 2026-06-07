import twilio from "twilio";

let _client: ReturnType<typeof twilio> | null = null;

export function getTwilio() {
  if (!_client) {
    _client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return _client;
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    return; // skip if not configured
  }
  const client = getTwilio();
  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
    body,
  });
}
