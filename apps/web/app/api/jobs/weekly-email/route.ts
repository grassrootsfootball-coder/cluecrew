import { NextResponse } from 'next/server';
import { sendWeeklyEmails } from '@/lib/parent/weekly-email';

/** Scheduled Sunday 17:00 Europe/London (cron config); CRON_SECRET-guarded. */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const origin = new URL(request.url).origin;
  return NextResponse.json({ ok: true, ...(await sendWeeklyEmails(origin)) });
}
