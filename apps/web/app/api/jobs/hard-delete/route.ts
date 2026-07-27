import { NextResponse } from 'next/server';
import { runHardDelete } from '@cluecrew/db/jobs/hard-delete';

/**
 * HTTP trigger for the retention hard-delete job (§5), for a scheduled runner
 * (e.g. Vercel Cron in Phase 2). Also runnable locally: `pnpm jobs:hard-delete`.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await runHardDelete();
  return NextResponse.json({ ok: true, ...result });
}
