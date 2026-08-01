import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PLUS_BENCH_CAPACITY } from '@cluecrew/core';
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
  const parsed = z
    .object({ tier: z.enum(['FULL_24', 'FULL_12', 'FULL_ROLLING', 'PLUS_ROLLING', 'SUMMER']) })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  // Crew Plus is capacity-capped to the teacher bench (Amendment 1 §3):
  // when full, the parent joins the public waitlist instead of paying for a
  // review month that cannot happen. Under-promise machinery, in code.
  if (parsed.data.tier === 'PLUS_ROLLING') {
    const activePlus = await prisma.subscription.count({
      where: { tier: 'PLUS_ROLLING', status: 'active' },
    });
    if (activePlus >= PLUS_BENCH_CAPACITY) {
      await prisma.plusWaitlistEntry.upsert({
        where: { parentId: parent.id },
        create: { parentId: parent.id },
        update: {},
      });
      return NextResponse.json({ error: 'plus_waitlisted' }, { status: 409 });
    }
  }

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
    // Amendment 1: Crew IS the trial — a family may go straight from free to
    // paid with no preview subscription row existing yet.
    await (await import('@/lib/billing')).startTrial(parent.id, parsed.data.tier);
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
