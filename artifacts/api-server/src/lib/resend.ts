import { Resend } from "resend";

let _client: Resend | null = null;

export function getResend(): Resend {
  if (!_client) {
    _client = new Resend(process.env.RESEND_API_KEY);
  }
  return _client;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  const resend = getResend();
  await resend.emails.send({
    from: "Southern Roots Turf <noreply@southernrootsturf.com>",
    ...opts,
  });
}
