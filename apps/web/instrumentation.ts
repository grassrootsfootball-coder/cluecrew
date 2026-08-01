/**
 * Error alerting (LIVE-LAUNCH-PACK-V3 §4 Step 1, wired at production
 * promotion 2026-08-01): unhandled server errors email the admins, at most
 * one alert per error signature per ten minutes. Uses the existing
 * transactional transport — with RESEND_API_KEY unset the alert lands in
 * the function logs instead, which is still a visible trail.
 */
export function register(): void {
  // No setup needed; onRequestError is the hook that matters.
}

const lastAlert = new Map<string, number>();
const ALERT_WINDOW_MS = 10 * 60 * 1000;

export async function onRequestError(
  error: { digest?: string } & Error,
  request: { path: string; method: string },
): Promise<void> {
  if (process.env.APP_ENV !== 'production') return;
  const signature = `${error.name}:${request.path}`;
  const last = lastAlert.get(signature) ?? 0;
  if (Date.now() - last < ALERT_WINDOW_MS) return;
  lastAlert.set(signature, Date.now());

  try {
    const { sendEmail } = await import('@/lib/email');
    const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim()).filter(Boolean);
    for (const admin of admins) {
      await sendEmail({
        to: admin,
        subject: `[ClueCrew production] ${error.name} on ${request.method} ${request.path}`,
        text: `${error.message}\n\ndigest: ${error.digest ?? 'n/a'}\n\nFirst occurrence in this 10-minute window; check the Vercel function logs for the stack.`,
      });
    }
  } catch {
    console.error('[alerting] failed to send error alert', error);
  }
}
