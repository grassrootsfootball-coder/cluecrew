import { NextResponse } from 'next/server';
import { currentParent } from '@/lib/auth';
import { cancelSubscription } from '@/lib/billing';

/** Click 2 of the two-click cancel flow (§2.4). */
export async function POST() {
  const parent = await currentParent();
  if (!parent) return NextResponse.json({ error: 'parent_session_required' }, { status: 401 });
  const result = await cancelSubscription(parent.id);
  if (!result.applied && result.reason !== 'awaiting_webhook') {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }
  return NextResponse.json({ ok: true, ...result });
}
