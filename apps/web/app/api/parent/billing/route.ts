import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';

/**
 * Billing summary (Stripe wiring is Phase 2). Exists now so the child-token
 * isolation test has a real billing route to be locked out of (gate #4).
 */
export async function GET() {
  const parent = await currentParent();
  if (!parent) return NextResponse.json({ error: 'parent_session_required' }, { status: 401 });

  const subscription = await prisma.subscription.findUnique({
    where: { parentId: parent.id },
    select: { tier: true, status: true, commitmentEndsAt: true, renewalReminderAt: true },
  });
  return NextResponse.json({ subscription: subscription ?? null });
}
