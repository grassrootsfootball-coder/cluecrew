import { NextResponse } from 'next/server';
import { purgeBursaryEvidence } from '@cluecrew/db/jobs/purge-bursary-evidence';

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await purgeBursaryEvidence();
  return NextResponse.json({ ok: true, ...result });
}
