'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@cluecrew/db';
import { currentStaff, recordAudit, roleAllows } from '@/lib/staff';

const optionSchema = z.object({
  content: z.record(z.unknown()),
  isCorrect: z.boolean(),
  misconceptionId: z.string().nullable().optional(),
});

const itemInputSchema = z.object({
  questionTypeId: z.string().min(1),
  difficultyTier: z.coerce.number().int().min(1).max(5),
  stem: z.record(z.unknown()),
  explanation: z.record(z.unknown()).default({}),
  options: z.array(optionSchema).min(2).max(6),
});

function parseItemForm(formData: FormData) {
  return itemInputSchema.parse({
    questionTypeId: formData.get('questionTypeId'),
    difficultyTier: formData.get('difficultyTier'),
    stem: JSON.parse(String(formData.get('stem') || '{}')),
    explanation: JSON.parse(String(formData.get('explanation') || '{}')),
    options: JSON.parse(String(formData.get('options') || '[]')),
  });
}

export async function createItemAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['AUTHOR', 'REVIEWER'])) redirect('/admin');

  const parsed = parseItemForm(formData);
  const item = await prisma.item.create({
    data: {
      questionTypeId: parsed.questionTypeId,
      difficultyTier: parsed.difficultyTier,
      stem: parsed.stem as object,
      explanation: parsed.explanation as object,
      status: 'DRAFT',
      authoredBy: `human:${staff.email}`,
      options: {
        create: parsed.options.map((option) => ({
          content: option.content as object,
          isCorrect: option.isCorrect,
          misconceptionId: option.misconceptionId ?? null,
        })),
      },
    },
  });
  await recordAudit(staff.id, 'item.create', 'Item', item.id);
  redirect(`/admin/items/${item.id}`);
}

export async function updateItemAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['AUTHOR', 'REVIEWER'])) redirect('/admin');

  const itemId = z.string().min(1).parse(formData.get('itemId'));
  const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });
  if (item.status === 'LIVE' || item.status === 'RETIRED') redirect(`/admin/items/${itemId}?error=locked`);

  const parsed = parseItemForm(formData);
  await prisma.$transaction([
    prisma.itemOption.deleteMany({ where: { itemId } }),
    prisma.item.update({
      where: { id: itemId },
      data: {
        questionTypeId: parsed.questionTypeId,
        difficultyTier: parsed.difficultyTier,
        stem: parsed.stem as object,
        explanation: parsed.explanation as object,
        // Any edit invalidates a prior review (P3).
        status: 'DRAFT',
        reviewedBy: null,
        options: {
          create: parsed.options.map((option) => ({
            content: option.content as object,
            isCorrect: option.isCorrect,
            misconceptionId: option.misconceptionId ?? null,
          })),
        },
      },
    }),
  ]);
  await recordAudit(staff.id, 'item.update', 'Item', itemId);
  redirect(`/admin/items/${itemId}`);
}

/** Reviewer marks REVIEWED — must be a different person from the author (§5). */
export async function markReviewedAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const itemId = z.string().min(1).parse(formData.get('itemId'));
  const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId }, include: { options: true } });

  if (item.authoredBy === `human:${staff.email}`) {
    redirect(`/admin/items/${itemId}?error=own-item`);
  }
  const failure = publishBlockers(item.options, `human:${staff.email}`, item.authoredBy);
  if (failure) redirect(`/admin/items/${itemId}?error=${failure}`);

  await prisma.item.update({
    where: { id: itemId },
    data: { status: 'REVIEWED', reviewedBy: `human:${staff.email}`, reviewNotes: null },
  });
  await recordAudit(staff.id, 'item.review', 'Item', itemId);
  redirect(`/admin/items/${itemId}`);
}

export async function returnWithNotesAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const itemId = z.string().min(1).parse(formData.get('itemId'));
  const notes = z.string().min(1).max(2000).parse(formData.get('notes'));
  await prisma.item.update({
    where: { id: itemId },
    data: { status: 'DRAFT', reviewedBy: null, reviewNotes: notes },
  });
  await recordAudit(staff.id, 'item.return', 'Item', itemId, { notes });
  redirect(`/admin/items/${itemId}`);
}

function publishBlockers(
  options: Array<{ isCorrect: boolean; misconceptionId: string | null }>,
  reviewer: string | null,
  authoredBy: string,
): string | null {
  if (!options.some((option) => option.isCorrect)) return 'no-correct-option';
  if (options.some((option) => !option.isCorrect && !option.misconceptionId)) {
    return 'missing-misconceptions';
  }
  if (reviewer && reviewer === authoredBy) return 'own-item';
  return null;
}

/**
 * Publish to LIVE (§5) — P3 as a hard server-side constraint: blocked unless
 * every incorrect option has a misconceptionId AND reviewedBy is set (and is
 * not the author). This is the ONLY path to LIVE; bulk import cannot skip it.
 */
export async function publishItemAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const itemId = z.string().min(1).parse(formData.get('itemId'));
  const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId }, include: { options: true } });

  if (item.status !== 'REVIEWED' || !item.reviewedBy) {
    redirect(`/admin/items/${itemId}?error=not-reviewed`);
  }
  const failure = publishBlockers(item.options, item.reviewedBy, item.authoredBy);
  if (failure) redirect(`/admin/items/${itemId}?error=${failure}`);

  await prisma.item.update({ where: { id: itemId }, data: { status: 'LIVE' } });
  await recordAudit(staff.id, 'item.publish', 'Item', itemId);
  redirect(`/admin/items/${itemId}`);
}

export async function retireItemAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');
  const itemId = z.string().min(1).parse(formData.get('itemId'));
  await prisma.item.update({ where: { id: itemId }, data: { status: 'RETIRED' } });
  await recordAudit(staff.id, 'item.retire', 'Item', itemId);
  redirect(`/admin/items/${itemId}`);
}

const bulkImportSchema = z.array(
  itemInputSchema.extend({
    authoredBy: z
      .string()
      .regex(/^(human:.+|ai-draft:.+)$/, 'authoredBy must be "human:<name>" or "ai-draft:<model>"'),
  }),
);

/** Bulk import (§5): validated, lands as DRAFT, provenance preserved. */
export async function bulkImportAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['AUTHOR', 'REVIEWER'])) redirect('/admin');

  let items: z.infer<typeof bulkImportSchema>;
  try {
    items = bulkImportSchema.parse(JSON.parse(String(formData.get('payload') || '[]')));
  } catch {
    redirect('/admin/import?error=invalid');
  }
  if (items.length === 0 || items.length > 500) redirect('/admin/import?error=invalid');

  for (const entry of items) {
    await prisma.item.create({
      data: {
        questionTypeId: entry.questionTypeId,
        difficultyTier: entry.difficultyTier,
        stem: entry.stem as object,
        explanation: entry.explanation as object,
        status: 'DRAFT', // imports NEVER skip review, especially ai-draft (§5)
        authoredBy: entry.authoredBy,
        options: {
          create: entry.options.map((option) => ({
            content: option.content as object,
            isCorrect: option.isCorrect,
            misconceptionId: option.misconceptionId ?? null,
          })),
        },
      },
    });
  }
  await recordAudit(staff.id, 'item.bulk_import', 'Item', 'batch', { count: items.length });
  redirect(`/admin/items?imported=${items.length}`);
}
