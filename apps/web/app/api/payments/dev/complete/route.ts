import { NextResponse } from 'next/server';
import { currentParent } from '@/lib/auth';
import { applyBillingEvent, devEvent } from '@/lib/billing';

/**
 * Dev/staging-only checkout completion: synthesizes the same
 * checkout.session.completed event the Stripe webhook would deliver, through
 * the same idempotent applier. Disabled in production and in real-Stripe mode.
 */
export async function POST() {
  if (process.env.APP_ENV === 'production' || process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'not_available' }, { status: 404 });
  }
  const parent = await currentParent();
  if (!parent) return NextResponse.json({ error: 'parent_session_required' }, { status: 401 });

  const result = await applyBillingEvent(
    devEvent('checkout.session.completed', {
      stripeCustomerId: `cus_dev_${parent.id}`,
      stripeSubId: `sub_dev_${parent.id}`,
    }),
    { parentId: parent.id },
  );
  return NextResponse.json(result);
}
