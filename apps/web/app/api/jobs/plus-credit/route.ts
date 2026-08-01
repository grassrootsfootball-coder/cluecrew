import { NextResponse } from 'next/server';
import { PLUS_MISSED_REVIEW_CREDIT_PENCE, formatPence } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';

/**
 * The under-promise machinery (AMENDMENT-1 §3): a Plus month that ended
 * without a released review auto-credits the premium WITHOUT BEING ASKED.
 * Runs monthly, after month end.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const lastMonth = new Date();
  lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1);
  const month = lastMonth.toISOString().slice(0, 7);

  const unfulfilled = await prisma.reviewRecording.findMany({
    where: { month, status: { in: ['QUEUED', 'RECORDED'] } },
  });
  for (const review of unfulfilled) {
    await prisma.reviewRecording.update({
      where: { id: review.id },
      data: { status: 'CREDITED' },
    });
    // Dev provider: the credit is recorded; live Stripe wiring issues a
    // customer balance credit here.
    console.log(
      `plus-credit: ${formatPence(PLUS_MISSED_REVIEW_CREDIT_PENCE)} credited for ${review.childId} ${month}`,
    );
  }
  return NextResponse.json({ ok: true, credited: unfulfilled.length, month });
}
