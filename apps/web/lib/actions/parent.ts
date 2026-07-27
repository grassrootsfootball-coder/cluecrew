'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { MAX_CHILD_PROFILES } from '@cluecrew/core';
import { logEvent, prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/passwords';

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
  yearGroup: z.coerce.number().int().min(4).max(6),
  examYear: z.coerce.number().int().min(2026).max(2035).optional(),
  reducedMotion: z.boolean(),
  dyslexiaFont: z.boolean(),
  audioDefault: z.boolean(),
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
  });

  const child = await prisma.childProfile.create({
    data: {
      parentId: parent.id,
      crewName: parsed.crewName,
      yearGroup: parsed.yearGroup,
      examYear: parsed.examYear ?? null,
      settings: {
        reducedMotion: parsed.reducedMotion,
        dyslexiaFont: parsed.dyslexiaFont,
        audioDefault: parsed.audioDefault,
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
  });

  await prisma.childProfile.update({
    where: { id: childId },
    data: {
      crewName: parsed.crewName,
      yearGroup: parsed.yearGroup,
      examYear: parsed.examYear ?? null,
      settings: {
        reducedMotion: parsed.reducedMotion,
        dyslexiaFont: parsed.dyslexiaFont,
        audioDefault: parsed.audioDefault,
      },
    },
  });
  redirect('/parent/children');
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
