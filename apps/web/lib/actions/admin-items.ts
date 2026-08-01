'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkSolution, fingerprintItem, screenAgainstIndex } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { similarityIndexSource } from '@/lib/similarity-index';
import { currentStaff, recordAudit, roleAllows } from '@/lib/staff';

/**
 * ADDENDUM-E §2: a misconception must be ACTIVE before any item may reference
 * it. Corpus-proposed misconceptions land PROPOSED and stay unusable until a
 * named reviewer approves — server-enforced here, on every item-writing path.
 */
async function assertMisconceptionsActive(
  options: Array<{ misconceptionId?: string | null }>,
): Promise<string | null> {
  const ids = [...new Set(options.map((option) => option.misconceptionId).filter(Boolean))] as string[];
  if (ids.length === 0) return null;
  const active = await prisma.misconception.count({ where: { id: { in: ids }, status: 'ACTIVE' } });
  return active === ids.length ? null : 'unapproved-misconception';
}

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
  // BUILD-DISTRICT-MATHS §5: required for MATHS items, enforced below —
  // the key is computed from this, never asserted.
  solution: z.string().max(200).optional(),
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
  if (await assertMisconceptionsActive(parsed.options)) {
    redirect('/admin/items/new?error=unapproved-misconception');
  }
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
  if (await assertMisconceptionsActive(parsed.options)) {
    redirect(`/admin/items/${itemId}?error=unapproved-misconception`);
  }
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
  // ADDENDUM-E §3: a similarity-flagged item is blocked from REVIEWED until a
  // reviewer clears the flag with a note — a separate, deliberate act.
  if (item.similarityFlaggedAt && !item.similarityClearedBy) {
    redirect(`/admin/items/${itemId}?error=similarity-review`);
  }
  const failure = publishBlockers(item.options, `human:${staff.email}`, item.authoredBy);
  if (failure) redirect(`/admin/items/${itemId}?error=${failure}`);
  if (await assertMisconceptionsActive(item.options)) {
    redirect(`/admin/items/${itemId}?error=unapproved-misconception`);
  }

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

  // ADDENDUM-E §2: un-approved misconception ids are rejected at the door.
  const allOptions = items.flatMap((entry) => entry.options);
  if (await assertMisconceptionsActive(allOptions)) {
    redirect('/admin/import?error=unapproved-misconception');
  }

  // BUILD-DISTRICT-MATHS §5: a MATHS item's key is COMPUTED from its
  // solution expression. Missing or mismatching solutions reject the whole
  // batch, naming positions — the same door-policy as the similarity gate.
  const mathsTypes = new Set(
    (
      await prisma.questionType.findMany({ where: { district: 'MATHS' }, select: { id: true } })
    ).map((row) => row.id),
  );
  const solutionFailures: string[] = [];
  items.forEach((entry, position) => {
    if (!mathsTypes.has(entry.questionTypeId)) return;
    if (!entry.solution) {
      solutionFailures.push(`${position}:missing-solution`);
      return;
    }
    const verdict = checkSolution(entry.solution, entry.options);
    if (!verdict.ok) solutionFailures.push(`${position}:${verdict.reason ?? 'mismatch'}`);
  });
  if (solutionFailures.length > 0) {
    await recordAudit(staff.id, 'item.bulk_import_rejected', 'Item', 'batch', {
      solutionFailures,
    });
    redirect(
      `/admin/import?error=solution&items=${encodeURIComponent(solutionFailures.join(','))}`,
    );
  }

  // ADDENDUM-E §3: the similarity gate. Exact/near-exact anywhere rejects the
  // WHOLE batch, naming failures by batch position + type id only — matched
  // source text never appears anywhere in this flow, by construction.
  const index = await similarityIndexSource().load();
  const flagged = new Map<number, number>(); // batch position → score
  if (index) {
    const failures: string[] = [];
    items.forEach((entry, position) => {
      const verdict = screenAgainstIndex(
        fingerprintItem({
          stem: entry.stem,
          optionContents: entry.options.map((option) => option.content),
        }),
        index,
      );
      if (verdict.kind === 'fail') failures.push(`${position}:${entry.questionTypeId}`);
      else if (verdict.kind === 'review') flagged.set(position, verdict.score);
    });
    if (failures.length > 0) {
      await recordAudit(staff.id, 'item.bulk_import_rejected', 'Item', 'batch', {
        similarityFailures: failures,
      });
      redirect(`/admin/import?error=similarity&items=${encodeURIComponent(failures.join(','))}`);
    }
  } else {
    console.warn('similarity index not configured — bulk import ran ungated (Addendum E §3)');
  }

  let position = -1;
  for (const entry of items) {
    position += 1;
    await prisma.item.create({
      data: {
        questionTypeId: entry.questionTypeId,
        difficultyTier: entry.difficultyTier,
        stem: entry.stem as object,
        explanation: entry.explanation as object,
        status: 'DRAFT', // imports NEVER skip review, especially ai-draft (§5)
        authoredBy: entry.authoredBy,
        solution: entry.solution ?? null,
        ...(flagged.has(position)
          ? { similarityFlaggedAt: new Date(), similarityScore: flagged.get(position) }
          : {}),
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


/**
 * ADDENDUM-E §3: the false-positive escape. Some resemblance is inevitable —
 * there are only so many ways to ask a T1 letter-code question. The gate
 * protects against derivation; the reviewer judges coincidence, with a note,
 * logged.
 */
export async function clearSimilarityAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const itemId = z.string().min(1).parse(formData.get('itemId'));
  const note = z.string().min(5).max(1000).parse(formData.get('note'));
  const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });
  if (!item.similarityFlaggedAt) redirect(`/admin/items/${itemId}`);

  await prisma.item.update({
    where: { id: itemId },
    data: { similarityClearedBy: `human:${staff.email}`, similarityClearNote: note },
  });
  await recordAudit(staff.id, 'item.similarity_clear', 'Item', itemId, { note });
  redirect(`/admin/items/${itemId}`);
}
