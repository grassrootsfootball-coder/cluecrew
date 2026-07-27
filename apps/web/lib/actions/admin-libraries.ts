'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@cluecrew/db';
import { currentStaff, recordAudit, roleAllows } from '@/lib/staff';

const misconceptionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  district: z.enum(['VR', 'NVR', 'MATHS', 'ENGLISH']),
  description: z.string().min(1).max(500),
  childHint: z.string().min(1).max(300),
});

export async function upsertMisconceptionAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['AUTHOR', 'REVIEWER'])) redirect('/admin');

  const parsed = misconceptionSchema.parse({
    id: formData.get('id'),
    district: formData.get('district'),
    description: formData.get('description'),
    childHint: formData.get('childHint'),
  });
  const { id, ...rest } = parsed;
  await prisma.misconception.upsert({ where: { id }, create: { id, ...rest }, update: rest });
  await recordAudit(staff.id, 'misconception.upsert', 'Misconception', id);
  redirect('/admin/misconceptions');
}

const wordSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  headword: z.string().min(1).max(40),
  definitionChild: z.string().min(3).max(160),
  sentence: z.string().min(3).max(200),
  rootFamily: z.string().max(40).optional(),
  imageRef: z.string().max(300).optional(),
  tier: z.coerce.number().int().min(1).max(5),
});

export async function upsertWordAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['AUTHOR', 'REVIEWER'])) redirect('/admin');

  const parsed = wordSchema.parse({
    id: formData.get('id'),
    headword: formData.get('headword'),
    definitionChild: formData.get('definitionChild'),
    sentence: formData.get('sentence'),
    rootFamily: formData.get('rootFamily') || undefined,
    imageRef: formData.get('imageRef') || undefined,
    tier: formData.get('tier'),
  });
  const { id, rootFamily, imageRef, ...rest } = parsed;
  const data = { ...rest, rootFamily: rootFamily ?? null, imageRef: imageRef ?? null };
  await prisma.word.upsert({ where: { id }, create: { id, ...data }, update: data });
  await recordAudit(staff.id, 'word.upsert', 'Word', id);
  redirect('/admin/words');
}

const regionUpdateSchema = z.object({
  id: z.string().min(1),
  formatSummary: z.string().min(1).max(300),
  typicalTestMonth: z.string().min(1).max(40),
  notes: z.string().max(500).optional(),
  sourceUrl: z.string().url(),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Region edits always require a source URL and a fresh last-verified date (§5). */
export async function updateRegionAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['AUTHOR', 'REVIEWER'])) redirect('/admin');

  const parsed = regionUpdateSchema.parse({
    id: formData.get('id'),
    formatSummary: formData.get('formatSummary'),
    typicalTestMonth: formData.get('typicalTestMonth'),
    notes: formData.get('notes') || undefined,
    sourceUrl: formData.get('sourceUrl'),
    lastVerified: formData.get('lastVerified'),
  });
  await prisma.region.update({
    where: { id: parsed.id },
    data: {
      formatSummary: parsed.formatSummary,
      typicalTestMonth: parsed.typicalTestMonth,
      notes: parsed.notes ?? null,
      sourceUrl: parsed.sourceUrl,
      lastVerified: new Date(parsed.lastVerified),
    },
  });
  await recordAudit(staff.id, 'region.update', 'Region', parsed.id);
  redirect('/admin/regions');
}
