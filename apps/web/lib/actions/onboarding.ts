'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { MAX_CHILD_PROFILES, MAX_YEAR_GROUP, MIN_YEAR_GROUP, captureAcademicYear } from '@cluecrew/core';
import { logEvent, prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { startTrial } from '@/lib/billing';

const POLICY_VERSION = 'v1.0';

const childSchema = z.object({
  crewName: z.string().min(1).max(40),
  // "Which year group is [name] in from this September?" (Addendum D §1) —
  // Years 3–6; Year 3 accepted as an early start, never marketed.
  yearGroup: z.coerce.number().int().min(MIN_YEAR_GROUP).max(MAX_YEAR_GROUP),
  reducedMotion: z.coerce.boolean(),
  dyslexiaFont: z.coerce.boolean(),
  audioDefault: z.coerce.boolean(),
});

export async function createChildProfileAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent || !parent.emailVerified) redirect('/login');

  const parsed = childSchema.parse({
    crewName: formData.get('crewName'),
    yearGroup: formData.get('yearGroup'),
    reducedMotion: formData.get('reducedMotion') === 'on',
    dyslexiaFont: formData.get('dyslexiaFont') === 'on',
    audioDefault: formData.get('audioDefault') === 'on',
  });

  const childCount = await prisma.childProfile.count({
    where: { parentId: parent.id, deletedAt: null },
  });
  if (childCount >= MAX_CHILD_PROFILES) redirect('/parent/children?full=1');

  const child = await prisma.childProfile.create({
    data: {
      parentId: parent.id,
      crewName: parsed.crewName,
      // The capture pair (Addendum D §1): the wizard asks for the year FROM
      // THIS SEPTEMBER, so the capture year is this calendar year whether
      // September has happened yet or not — the summer-ambiguity fix.
      yearGroupAtCapture: parsed.yearGroup,
      capturedAcademicYear: captureAcademicYear(new Date()),
      settings: {
        reducedMotion: parsed.reducedMotion,
        dyslexiaFont: parsed.dyslexiaFont,
        audioDefault: parsed.audioDefault,
      },
    },
  });

  await prisma.consentEvent.createMany({
    data: [
      { parentId: parent.id, kind: 'child_profile_created', version: POLICY_VERSION },
      // Writing Room disclosure shown now, long before the feature ships (S4).
      { parentId: parent.id, kind: 'writing_review_notice', version: POLICY_VERSION },
    ],
  });
  await logEvent({ name: 'child_profile_created', parentId: parent.id, childId: child.id, props: { yearGroup: parsed.yearGroup } });

  redirect('/onboarding');
}

const regionSchema = z.object({
  regionCode: z.string().min(1).max(60),
  examYear: z.coerce.number().int().min(2026).max(2035),
  targetSchools: z.string().max(400).optional(),
});

export async function saveRegionAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent) redirect('/login');

  const parsed = regionSchema.parse({
    regionCode: formData.get('regionCode'),
    examYear: formData.get('examYear'),
    targetSchools: formData.get('targetSchools') ?? undefined,
  });

  const schools = (parsed.targetSchools ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((name) => ({ name }));

  await prisma.parentAccount.update({
    where: { id: parent.id },
    data: { regionCode: parsed.regionCode, targetSchools: schools },
  });
  await prisma.childProfile.updateMany({
    where: { parentId: parent.id, deletedAt: null, examYear: null },
    data: { examYear: parsed.examYear },
  });

  redirect('/onboarding');
}

// The optional Full Crew preview (Amendment 1 §1): 7 days, no card, chosen at
// onboarding — or the family simply stays on Crew, which needs no action.
const trialSchema = z.object({ tier: z.enum(['FULL_24', 'FULL_12', 'FULL_ROLLING', 'PLUS_ROLLING', 'SUMMER']) });

export async function startTrialAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent) redirect('/login');

  const parsed = trialSchema.parse({ tier: formData.get('tier') });
  await startTrial(parent.id, parsed.tier);
  await logEvent({ name: 'onboarding_completed', parentId: parent.id, props: { tier: parsed.tier } });
  redirect('/parent');
}
