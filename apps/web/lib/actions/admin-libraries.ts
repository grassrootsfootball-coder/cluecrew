'use server';

import { redirect } from 'next/navigation';
import { misconceptionImportSchema } from '@cluecrew/core';
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


/**
 * ADDENDUM-E §2: corpus misconception import. Entries land PROPOSED — the CMS
 * shows a review queue, approval activates. Corpus findings are evidence, not
 * instructions; the named approval is the door.
 */
export async function importMisconceptionsAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  let entries;
  try {
    entries = misconceptionImportSchema.parse(
      JSON.parse(String(formData.get('payload') || '[]')),
    );
  } catch {
    redirect('/admin/misconceptions?error=invalid-import');
  }
  if (entries.length === 0 || entries.length > 200) {
    redirect('/admin/misconceptions?error=invalid-import');
  }

  let imported = 0;
  for (const entry of entries) {
    const existing = await prisma.misconception.findUnique({ where: { id: entry.id } });
    if (existing) continue; // never overwrite an ACTIVE (or queued) entry
    await prisma.misconception.create({
      data: {
        id: entry.id,
        district: entry.district,
        description: entry.description,
        childHint: entry.childHint,
        status: 'PROPOSED',
        proposedBy: entry.proposedBy,
        sourcePattern: entry.sourcePattern,
      },
    });
    imported += 1;
  }
  await recordAudit(staff.id, 'misconception.import_proposed', 'Misconception', 'batch', {
    imported,
    skipped: entries.length - imported,
  });
  redirect(`/admin/misconceptions?proposed=${imported}`);
}

/** Approval activates (Addendum E §2); the approver is named on the row. */
export async function approveMisconceptionAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const id = z.string().min(1).parse(formData.get('id'));
  const entry = await prisma.misconception.findUniqueOrThrow({ where: { id } });
  if (entry.status !== 'PROPOSED') redirect('/admin/misconceptions');

  await prisma.misconception.update({
    where: { id },
    data: { status: 'ACTIVE', approvedBy: `human:${staff.email}` },
  });
  await recordAudit(staff.id, 'misconception.approve', 'Misconception', id);
  redirect('/admin/misconceptions');
}

/** A proposed entry the reviewer rejects simply leaves the queue. */
export async function rejectMisconceptionAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const id = z.string().min(1).parse(formData.get('id'));
  const entry = await prisma.misconception.findUniqueOrThrow({ where: { id } });
  if (entry.status !== 'PROPOSED') redirect('/admin/misconceptions');

  await prisma.misconception.delete({ where: { id } });
  await recordAudit(staff.id, 'misconception.reject_proposed', 'Misconception', id);
  redirect('/admin/misconceptions');
}
