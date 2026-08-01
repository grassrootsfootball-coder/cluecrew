'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { MAX_CHILD_PROFILES, captureAcademicYear, effectiveYearGroup } from '@cluecrew/core';
import { logEvent, prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import {
  CHILD_TOKEN_COOKIE,
  CHILD_TOKEN_TTL_SECONDS,
  signChildToken,
} from '@/lib/child-token';
import { hashPassword, verifyPassword } from '@/lib/passwords';

/**
 * Parent selects a child profile → child-mode scoped token → Crew HQ (§4).
 * A server action rather than a client fetch so the button is live from
 * first paint, before hydration. The API route (POST /api/child-session)
 * stays for programmatic entry; both mint the same token.
 */
export async function enterCrewAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent) redirect('/login');

  const childId = z.string().min(1).parse(formData.get('childId'));
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child || child.deletedAt || child.parentId !== parent.id) redirect('/parent/children');

  const token = await signChildToken({ childId: child.id, parentId: parent.id });
  (await cookies()).set(CHILD_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CHILD_TOKEN_TTL_SECONDS,
  });
  redirect('/crew');
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent) redirect('/login');

  const parsed = z
    .object({ currentPassword: z.string().min(1), newPassword: z.string().min(10).max(200) })
    .parse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
    });

  const valid = await verifyPassword(parent.passwordHash, parsed.currentPassword);
  if (!valid) redirect('/parent/account?password=incorrect');

  await prisma.parentAccount.update({
    where: { id: parent.id },
    data: { passwordHash: await hashPassword(parsed.newPassword) },
  });
  redirect('/parent/account?password=changed');
}

const childSchema = z.object({
  crewName: z.string().min(1).max(40),
  // Years 3–6 (Addendum D §1): Year 3 accepted as an early start.
  yearGroup: z.coerce.number().int().min(3).max(6),
  examYear: z.coerce.number().int().min(2026).max(2035).optional(),
  reducedMotion: z.boolean(),
  dyslexiaFont: z.boolean(),
  audioDefault: z.boolean(),
  soundEnabled: z.boolean(),
});

export async function addChildAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent || !parent.emailVerified) redirect('/login');

  const count = await prisma.childProfile.count({ where: { parentId: parent.id, deletedAt: null } });
  if (count >= MAX_CHILD_PROFILES) redirect('/parent/children?full=1');

  const parsed = childSchema.parse({
    crewName: formData.get('crewName'),
    yearGroup: formData.get('yearGroup'),
    examYear: formData.get('examYear') || undefined,
    reducedMotion: formData.get('reducedMotion') === 'on',
    dyslexiaFont: formData.get('dyslexiaFont') === 'on',
    audioDefault: formData.get('audioDefault') === 'on',
    soundEnabled: formData.get('soundEnabled') === 'on',
  });

  const child = await prisma.childProfile.create({
    data: {
      parentId: parent.id,
      crewName: parsed.crewName,
      // Capture pair (Addendum D §1): the form asks for the year from this
      // September, so the capture year is this calendar year.
      yearGroupAtCapture: parsed.yearGroup,
      capturedAcademicYear: captureAcademicYear(new Date()),
      examYear: parsed.examYear ?? null,
      settings: {
        reducedMotion: parsed.reducedMotion,
        dyslexiaFont: parsed.dyslexiaFont,
        audioDefault: parsed.audioDefault,
        soundEnabled: parsed.soundEnabled,
      },
    },
  });
  await prisma.consentEvent.create({
    data: { parentId: parent.id, kind: 'child_profile_created', version: 'v1.0' },
  });
  await logEvent({ name: 'child_profile_created', parentId: parent.id, childId: child.id, props: { yearGroup: parsed.yearGroup } });
  redirect('/parent/children');
}

export async function updateChildAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent) redirect('/login');

  const childId = z.string().min(1).parse(formData.get('childId'));
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parent.id) redirect('/parent/children');

  const parsed = childSchema.parse({
    crewName: formData.get('crewName'),
    yearGroup: formData.get('yearGroup'),
    examYear: formData.get('examYear') || undefined,
    reducedMotion: formData.get('reducedMotion') === 'on',
    dyslexiaFont: formData.get('dyslexiaFont') === 'on',
    audioDefault: formData.get('audioDefault') === 'on',
    soundEnabled: formData.get('soundEnabled') === 'on',
  });

  // A year-group edit is a CORRECTION (Addendum D §1): it re-captures the
  // pair against this September and leaves an audit event, so the rollover
  // beat and every derived calculation take the parent's word from here on.
  const nextCapture = {
    yearGroupAtCapture: parsed.yearGroup,
    capturedAcademicYear: captureAcademicYear(new Date()),
  };
  const yearChanged =
    effectiveYearGroup(child.yearGroupAtCapture, child.capturedAcademicYear, new Date()) !==
    parsed.yearGroup;
  if (yearChanged) {
    await logEvent({
      name: 'year_rollover_corrected',
      parentId: parent.id,
      childId,
      props: { academicYear: nextCapture.capturedAcademicYear, yearGroup: parsed.yearGroup },
    });
  }

  await prisma.childProfile.update({
    where: { id: childId },
    data: {
      crewName: parsed.crewName,
      ...nextCapture,
      examYear: parsed.examYear ?? null,
      settings: {
        reducedMotion: parsed.reducedMotion,
        dyslexiaFont: parsed.dyslexiaFont,
        audioDefault: parsed.audioDefault,
        soundEnabled: parsed.soundEnabled,
      },
    },
  });
  redirect('/parent/children');
}

export async function setWeeklyEmailAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent) redirect('/login');
  await prisma.parentAccount.update({
    where: { id: parent.id },
    data: { weeklyOptOut: formData.get('weekly') !== 'on' },
  });
  redirect('/parent/account?weekly=saved');
}

/** Archive = soft delete; the retention job hard-deletes after 30 days. */
export async function archiveChildAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent) redirect('/login');

  const childId = z.string().min(1).parse(formData.get('childId'));
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parent.id) redirect('/parent/children');

  await prisma.childProfile.update({ where: { id: childId }, data: { deletedAt: new Date() } });
  redirect('/parent/children');
}


/** One-tap confirmation of the September rollover beat (Addendum D §1). */
export async function confirmRolloverAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent) redirect('/login');
  const childId = z.string().min(1).parse(formData.get('childId'));
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parent.id) redirect('/parent');
  const { confirmRollover } = await import('@/lib/crew/readiness-io');
  await confirmRollover(parent.id, childId);
  redirect('/parent');
}


/**
 * Change plan (Amendment 1 §5.4): two-click parity with cancellation — the
 * radio pick is click one, this confirm is click two. Plus→Full downgrades
 * seamlessly, no review claw-backs; commitment re-anchors from the original
 * first payment (never restarted — no dark patterns, L5).
 */
export async function changePlanAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent) redirect('/login');
  const tier = z
    .enum(['FULL_24', 'FULL_12', 'FULL_ROLLING', 'PLUS_ROLLING'])
    .parse(formData.get('tier'));
  const subscription = await prisma.subscription.findUnique({ where: { parentId: parent.id } });
  if (!subscription || subscription.status === 'canceled') redirect('/parent/billing');

  // Plus is capacity-capped (Amendment 1 §3) on the way IN only.
  if (tier === 'PLUS_ROLLING') {
    const { PLUS_BENCH_CAPACITY } = await import('@cluecrew/core');
    const activePlus = await prisma.subscription.count({
      where: { tier: 'PLUS_ROLLING', status: 'active' },
    });
    if (activePlus >= PLUS_BENCH_CAPACITY) {
      await prisma.plusWaitlistEntry.upsert({
        where: { parentId: parent.id },
        create: { parentId: parent.id },
        update: {},
      });
      redirect('/parent/billing?plus=waitlisted');
    }
  }

  const { PRICING } = await import('@cluecrew/core');
  const months = PRICING[tier].commitmentMonths;
  const anchor = subscription.firstPaidAt ?? new Date();
  const commitmentEndsAt =
    months > 1 ? new Date(new Date(anchor).setMonth(anchor.getMonth() + months)) : null;
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { tier, commitmentEndsAt },
  });
  await logEvent({ name: 'subscription_activated', parentId: parent.id, props: { tier, changed: true } });
  redirect('/parent/billing?changed=1');
}
