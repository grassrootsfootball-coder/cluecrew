'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { MAX_CHILD_PROFILES } from '@cluecrew/core';
import { logEvent, prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { startTrial } from '@/lib/billing';

const POLICY_VERSION = 'v1.0';

const childSchema = z.object({
  crewName: z.string().min(1).max(40),
  yearGroup: z.coerce.number().int().min(4).max(6),
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
      yearGroup: parsed.yearGroup,
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

const trialSchema = z.object({ tier: z.enum(['TWO_YEAR', 'ONE_YEAR', 'SUMMER']) });

export async function startTrialAction(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent) redirect('/login');

  const parsed = trialSchema.parse({ tier: formData.get('tier') });
  await startTrial(parent.id, parsed.tier);
  await logEvent({ name: 'onboarding_completed', parentId: parent.id, props: { tier: parsed.tier } });
  redirect('/parent');
}
