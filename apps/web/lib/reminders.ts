/**
 * Renewal/trial reminder job (§2.3, §7). Scheduled from
 * Subscription.renewalReminderAt: trials get T-2 before trial end; paid
 * monthly plans get T-14 then T-3 before commitment end. Supports staging
 * time-travel via CLUECREW_NOW (gate #5).
 */
import { REMINDER_OFFSETS_DAYS, addDays } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { billingNow } from '@/lib/billing';
import { sendEmail } from '@/lib/email';
import { renewalReminderTemplate, trialEndingTemplate } from '@/lib/email-templates';

export async function processReminders(): Promise<{ sent: number }> {
  const now = billingNow();
  const due = await prisma.subscription.findMany({
    where: {
      renewalReminderAt: { not: null, lte: now },
      status: { in: ['trialing', 'active'] },
    },
    include: { parent: true },
  });

  let sent = 0;
  for (const subscription of due) {
    const parent = subscription.parent;
    if (parent.deletedAt) continue;

    if (subscription.status === 'trialing' && subscription.trialEndsAt) {
      await sendEmail({
        to: parent.email,
        ...trialEndingTemplate(parent.displayName, subscription.tier, subscription.trialEndsAt),
      });
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { renewalReminderAt: null },
      });
      sent += 1;
      continue;
    }

    if (subscription.status === 'active' && subscription.commitmentEndsAt) {
      const t3 = addDays(subscription.commitmentEndsAt, -REMINDER_OFFSETS_DAYS[1]);
      // Was this the T-14 or the T-3 slot? If the T-3 slot is still ahead,
      // this send was T-14 and T-3 is scheduled next; otherwise we are done.
      const isT14Slot = now.getTime() < t3.getTime();
      const daysAhead = Math.max(
        1,
        Math.round((subscription.commitmentEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
      );
      await sendEmail({
        to: parent.email,
        ...renewalReminderTemplate(parent.displayName, subscription.tier, subscription.commitmentEndsAt, daysAhead),
      });
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { renewalReminderAt: isT14Slot ? t3 : null },
      });
      sent += 1;
    }
  }
  return { sent };
}
