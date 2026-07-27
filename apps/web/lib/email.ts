/**
 * Transactional email only in Phase 1 (verification + lockout notices).
 * Uses Resend when RESEND_API_KEY is set; otherwise logs to the server
 * console so dev needs no external account.
 */
interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:dev] to=${message.to} subject="${message.subject}"\n${message.text}`);
    return;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'ClueCrew <onboarding@resend.dev>',
      to: message.to,
      subject: message.subject,
      text: message.text,
    }),
  });
  if (!response.ok) {
    console.error(`Email send did not succeed (${response.status}): ${await response.text()}`);
  }
}
