'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { PRICING, addMonths, bursaryCapacity } from '@cluecrew/core';
import { logEvent, prisma } from '@cluecrew/db';
import { billingNow } from '@/lib/billing';
import { sendEmail } from '@/lib/email';
import {
  bursaryApprovedTemplate,
  bursaryWaitlistTemplate,
} from '@/lib/email-templates';
import { currentStaff, recordAudit } from '@/lib/staff';

const EVIDENCE_RETENTION_DAYS = 30;

function purgeDate(decidedAt: Date): Date {
  return new Date(decidedAt.getTime() + EVIDENCE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

async function loadApplication(formData: FormData) {
  const applicationId = z.string().min(1).parse(formData.get('applicationId'));
  return prisma.bursaryApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: { parent: true },
  });
}

/** Bursary decisions are admin-only (§5, §6). */
export async function approveBursaryAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || staff.effectiveRole !== 'ADMIN') redirect('/admin');

  const application = await loadApplication(formData);
  if (application.status === 'APPROVED') redirect('/admin/bursaries');

  // Capacity check (§1): 1 place per 10 paid subscriptions; waitlist when full.
  const [paidSubs, approved] = await Promise.all([
    prisma.subscription.count({ where: { status: 'active', isBursary: false } }),
    prisma.bursaryApplication.count({ where: { status: 'APPROVED' } }),
  ]);
  if (approved >= bursaryCapacity(paidSubs)) redirect('/admin/bursaries?error=capacity');

  const now = billingNow();
  await prisma.$transaction([
    prisma.bursaryApplication.update({
      where: { id: application.id },
      data: {
        status: 'APPROVED',
        decidedAt: now,
        decidedById: staff.id,
        evidencePurgeAt: purgeDate(now),
      },
    }),
    prisma.subscription.upsert({
      where: { parentId: application.parentId },
      create: {
        parentId: application.parentId,
        tier: 'FULL_24', // bursary is Full Crew on the 24-month term (Amendment 1 §1)
        status: 'active',
        isBursary: true,
        commitmentEndsAt: addMonths(now, PRICING.BURSARY.commitmentMonths),
      },
      update: {
        tier: 'FULL_24',
        status: 'active',
        isBursary: true,
        trialEndsAt: null,
        renewalReminderAt: null,
        commitmentEndsAt: addMonths(now, PRICING.BURSARY.commitmentMonths),
      },
    }),
  ]);

  await recordAudit(staff.id, 'bursary.approve', 'BursaryApplication', application.id);
  await logEvent({ name: 'bursary_decided', parentId: application.parentId, props: { decision: 'approved' } });
  await sendEmail({ to: application.parent.email, ...bursaryApprovedTemplate(application.parent.displayName) });
  redirect('/admin/bursaries');
}

export async function waitlistBursaryAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || staff.effectiveRole !== 'ADMIN') redirect('/admin');

  const application = await loadApplication(formData);
  await prisma.bursaryApplication.update({
    where: { id: application.id },
    data: { status: 'WAITLISTED' },
  });
  await recordAudit(staff.id, 'bursary.waitlist', 'BursaryApplication', application.id);
  await logEvent({ name: 'bursary_decided', parentId: application.parentId, props: { decision: 'waitlisted' } });
  await sendEmail({ to: application.parent.email, ...bursaryWaitlistTemplate(application.parent.displayName) });
  redirect('/admin/bursaries');
}

export async function declineBursaryAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || staff.effectiveRole !== 'ADMIN') redirect('/admin');

  const application = await loadApplication(formData);
  const now = billingNow();
  await prisma.bursaryApplication.update({
    where: { id: application.id },
    data: { status: 'DECLINED', decidedAt: now, decidedById: staff.id, evidencePurgeAt: purgeDate(now) },
  });
  await recordAudit(staff.id, 'bursary.decline', 'BursaryApplication', application.id);
  await logEvent({ name: 'bursary_decided', parentId: application.parentId, props: { decision: 'declined' } });
  redirect('/admin/bursaries');
}
