import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logEvent, prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { getPaymentProvider } from '@/lib/payments/provider';

/**
 * Starts checkout for trial conversion (§2). The card is collected here and
 * only here — never during the trial (§1). The DMCC pre-contract summary is
 * rendered by the billing page above the button that calls this.
 */
export async function POST(request: Request) {
  const parent = await currentParent();
  if (!parent) return NextResponse.json({ error: 'parent_session_required' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = z.object({ tier: z.enum(['TWO_YEAR', 'ONE_YEAR', 'SUMMER']) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const subscription = await prisma.subscription.findUnique({ where: { parentId: parent.id } });
  if (subscription && subscription.status === 'active') {
    return NextResponse.json({ error: 'already_active' }, { status: 409 });
  }
  // Conversion keeps the trial tier unless the parent explicitly picked another.
  if (subscription && subscription.tier !== parsed.data.tier) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { tier: parsed.data.tier },
    });
  }
  if (!subscription) {
    return NextResponse.json({ error: 'trial_required_first' }, { status: 409 });
  }

  const { url } = await getPaymentProvider().createCheckoutSession({
    parentId: parent.id,
    tier: parsed.data.tier,
    customerEmail: parent.email,
    origin: new URL(request.url).origin,
  });

  await logEvent({ name: 'checkout_started', parentId: parent.id, props: { tier: parsed.data.tier } });
  return NextResponse.json({ url });
}
