import { NextResponse } from 'next/server';
import { currentParent } from '@/lib/auth';
import { coolingOffRefund } from '@/lib/billing';

/** Self-serve cooling-off refund (§2.2): full amount, no questions. */
export async function POST() {
  const parent = await currentParent();
  if (!parent) return NextResponse.json({ error: 'parent_session_required' }, { status: 401 });
  const result = await coolingOffRefund(parent.id);
  if (!result.applied) return NextResponse.json({ error: result.reason }, { status: 409 });
  return NextResponse.json({ ok: true, refundedPence: result.refundedPence });
}
