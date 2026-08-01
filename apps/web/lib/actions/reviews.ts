'use server';

/**
 * Crew Plus teacher-review tooling (AMENDMENT-1 §3): queue → record →
 * checklist self-attest → DSL/admin spot-check → release to Parent HQ.
 * The review is a recorded video addressed to the PARENT about the child —
 * never child-facing, checked before release, deleted 12 months after the
 * subscription ends. Reviews failing the checklist re-record.
 */
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@cluecrew/db';
import { currentStaff, recordAudit, roleAllows } from '@/lib/staff';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Lazily queue this month's reviews for every active Plus child. */
export async function ensureMonthlyQueue(): Promise<void> {
  const month = currentMonth();
  const plusParents = await prisma.subscription.findMany({
    where: { tier: 'PLUS_ROLLING', status: 'active' },
    select: { parentId: true },
  });
  const children = await prisma.childProfile.findMany({
    where: { parentId: { in: plusParents.map((row) => row.parentId) }, deletedAt: null },
    select: { id: true },
  });
  for (const child of children) {
    await prisma.reviewRecording.upsert({
      where: { childId_month: { childId: child.id, month } },
      create: { childId: child.id, month },
      update: {},
    });
  }
}

const recordSchema = z.object({
  id: z.string().min(1),
  videoRef: z.string().min(3).max(300),
  checklist: z.literal('on'), // the self-attestation checkbox (§3)
});

export async function recordReviewAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');
  const parsed = recordSchema.parse({
    id: formData.get('id'),
    videoRef: formData.get('videoRef'),
    checklist: formData.get('checklist'),
  });
  await prisma.reviewRecording.update({
    where: { id: parsed.id },
    data: {
      videoRef: parsed.videoRef,
      checklistAttestedBy: `human:${staff.email}`,
      status: 'RECORDED',
    },
  });
  await recordAudit(staff.id, 'review.record', 'ReviewRecording', parsed.id);
  redirect('/admin/reviews');
}

/** Spot-check + release: a SECOND set of eyes (DSL/admin), never the recorder. */
export async function releaseReviewAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['ADMIN'])) redirect('/admin');
  const id = z.string().min(1).parse(formData.get('id'));
  const review = await prisma.reviewRecording.findUniqueOrThrow({ where: { id } });
  if (review.status !== 'RECORDED') redirect('/admin/reviews');
  if (review.checklistAttestedBy === `human:${staff.email}`) {
    // The recorder cannot spot-check their own work (same discipline as P3).
    redirect('/admin/reviews?error=own-recording');
  }
  await prisma.reviewRecording.update({
    where: { id },
    data: { status: 'RELEASED', spotCheckedBy: `human:${staff.email}`, releasedAt: new Date() },
  });
  await recordAudit(staff.id, 'review.release', 'ReviewRecording', id);
  redirect('/admin/reviews');
}

/** Failed checklist → back to the queue for re-recording (§3). */
export async function rerecordReviewAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['ADMIN'])) redirect('/admin');
  const id = z.string().min(1).parse(formData.get('id'));
  await prisma.reviewRecording.update({
    where: { id },
    data: { status: 'QUEUED', videoRef: null, checklistAttestedBy: null },
  });
  await recordAudit(staff.id, 'review.rerecord', 'ReviewRecording', id);
  redirect('/admin/reviews');
}
