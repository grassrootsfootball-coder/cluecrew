import { NextResponse } from 'next/server';
import { processReminders } from '@/lib/reminders';

/** Scheduled trigger for trial/renewal reminders (§2.3). */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await processReminders();
  return NextResponse.json({ ok: true, ...result });
}
