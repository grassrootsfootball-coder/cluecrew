'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkItemChildFacing, checkSolution, fingerprintItem, isBlocking, mathsPlanFileSchema, screenAgainstIndex, stemSchema } from '@cluecrew/core';
import mathsPlanContent from '../../../../content/maths-district-plan.json';

const mathsPlan = mathsPlanFileSchema.parse(mathsPlanContent);
import { prisma } from '@cluecrew/db';
import { similarityIndexSource } from '@/lib/similarity-index';
import { currentStaff, recordAudit, roleAllows } from '@/lib/staff';
import { validateVerbalRecord } from '@/lib/review-provenance';

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

/**
 * CANONICAL PASSAGE FIELDS (David's ratified correction, 2026-08-02).
 *
 * `passageRef` (string) and `lineRefs` (integer array) mean the same thing in
 * both item models — this MC/GL one and the English open-response one. An MC
 * item carries them inside its `stem`, so the import door is where the shape
 * is held: a stem may omit them, but if it names them it names them
 * correctly. Rejecting `{from, to}` here is deliberate — that WAS the
 * open-response shape until this correction, so it is the exact drift most
 * likely to arrive in an authored batch.
 */
// The stem schema now lives in packages/core/src/item-stem.ts — ONE definition shared with
// every import door (R57). It moved rather than being duplicated: two doors that enumerate
// separately drift, which is exactly what R55 found between this door and the script one.

const itemInputSchema = z.object({
  questionTypeId: z.string().min(1),
  difficultyTier: z.coerce.number().int().min(1).max(5),
  stem: stemSchema,
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
  if (!staff || !roleAllows(staff.effectiveRole, ['AUTHOR'])) redirect('/admin');

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
  if (!staff || !roleAllows(staff.effectiveRole, ['AUTHOR'])) redirect('/admin');

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
  const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId }, include: { options: true, questionType: true } });

  if (item.authoredBy === `human:${staff.email}`) {
    redirect(`/admin/items/${itemId}?error=own-item`);
  }
  // ADDENDUM-E §3: a similarity-flagged item is blocked from REVIEWED until a
  // reviewer clears the flag with a note — a separate, deliberate act.
  if (item.similarityFlaggedAt && !item.similarityClearedBy) {
    redirect(`/admin/items/${itemId}?error=similarity-review`);
  }
  const failure = publishBlockers(item.options, `human:${staff.email}`, item.authoredBy, item.answerFlaggedAt);
  if (failure) redirect(`/admin/items/${itemId}?error=${failure}`);
  if (await assertMisconceptionsActive(item.options)) {
    redirect(`/admin/items/${itemId}?error=unapproved-misconception`);
  }
  if (childFacingBlock(item)) redirect(`/admin/items/${itemId}?error=child-facing-copy`);

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
  /**
   * THE ANSWERABILITY FLAG (David's ruling, 2026-08-02). Set by
   * `pnpm check:word-puzzles` when an item's own stated rule does not produce
   * its key — no valid answer at all, or a different one.
   *
   * There is no clearing path and that is deliberate. A similarity flag is a
   * judgement a reviewer can make: coincidence or derivation. This is not a
   * judgement. The child cannot answer the question correctly, so a signature
   * saying otherwise would only record that someone did not check. The flag
   * lifts when the item is fixed and the gate stops setting it.
   *
   * Checked in `publishBlockers` rather than at each call site because all
   * three routes to REVIEWED already run this, and a fourth route added later
   * gets it for free.
   */
  answerFlaggedAt?: Date | null,
): string | null {
  if (answerFlaggedAt) return 'unanswerable';
  if (!options.some((option) => option.isCorrect)) return 'no-correct-option';
  if (options.some((option) => !option.isCorrect && !option.misconceptionId)) {
    return 'missing-misconceptions';
  }
  if (reviewer && reviewer === authoredBy) return 'own-item';
  return null;
}

/**
 * The child-facing COPY gate for a whole item — the same `checkItemChildFacing`
 * the serving sweep runs (packages/core). Every door to REVIEWED or LIVE calls
 * this, so a door can never let through copy the sweep would fail. It was the
 * absence of exactly this at the publish door — the door checked structure,
 * tagging and keys but never the words — that let six vr-06 items reach LIVE on
 * a stem.sentence the serving sweep then flagged.
 */
function childFacingBlock(item: {
  id: string; stem: unknown; explanation: unknown;
  questionType: { mechanic: string }; options: Array<{ content: unknown }>;
}): string | null {
  const faults = checkItemChildFacing({ id: item.id, stem: item.stem, explanation: item.explanation, mechanic: item.questionType.mechanic, options: item.options }).filter(isBlocking);
  return faults[0]?.detail ?? null;
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
  const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId }, include: { options: true, questionType: true } });

  if (item.status !== 'REVIEWED' || !item.reviewedBy) {
    redirect(`/admin/items/${itemId}?error=not-reviewed`);
  }
  const failure = publishBlockers(item.options, item.reviewedBy, item.authoredBy, item.answerFlaggedAt);
  if (failure) redirect(`/admin/items/${itemId}?error=${failure}`);
  if (childFacingBlock(item)) redirect(`/admin/items/${itemId}?error=child-facing-copy`);

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
  if (!staff || !roleAllows(staff.effectiveRole, ['AUTHOR'])) redirect('/admin');

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
  // D7 clarification (manifesto v1.4): commerce shapes are banned in ALL
  // item content; bare currency only in money-strand-tagged slots.
  const COMMERCE = /£\s*\d+(\.\d{2})?\s*(\/|\bper\s|a\s)?(month|mo\b|year|week)|\bpaywall\b|\bupgrade|\bsubscri|\bpremium\b|\btrial\b|\bcheckout\b|\bbilling\b|\bfree tier\b|\bfull crew\b|\bcrew plus\b|\bfounding rate\b/i;
  const currencyAllowed = new Set(
    mathsPlan.slots.filter((slot) => slot.allowsCurrency).map((slot) => slot.id),
  );
  items.forEach((entry, position) => {
    if (!mathsTypes.has(entry.questionTypeId)) return;
    if (!entry.solution) {
      solutionFailures.push(`${position}:missing-solution`);
      return;
    }
    const verdict = checkSolution(entry.solution, entry.options);
    if (!verdict.ok) solutionFailures.push(`${position}:${verdict.reason ?? 'mismatch'}`);
    const text = JSON.stringify([entry.stem, entry.options, entry.explanation]);
    if (COMMERCE.test(text)) solutionFailures.push(`${position}:commerce-shape-in-item (D7)`);
    else if (text.includes('£') && !currencyAllowed.has(entry.questionTypeId)) {
      solutionFailures.push(`${position}:currency-outside-money-strand (D7 v1.4)`);
    }
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

/**
 * Bulk recording of item reviews decided elsewhere (David's ruling,
 * 2026-08-02) — the item-review twin of the misconception action.
 *
 * Every guard the single-item reviewer path applies still applies here, per
 * item: a reviewer may not review their own authoring (P3/AI-QC), a
 * similarity-flagged item stays blocked until cleared, and an item whose
 * distractors reference unapproved misconceptions cannot pass. Items that
 * fail are SKIPPED WITH A REASON rather than quietly dropped — a bulk tool
 * that hides its refusals is worse than no bulk tool.
 */
export async function bulkRecordItemReviewsAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || staff.effectiveRole !== 'ADMIN') redirect('/admin');

  const itemIds = formData.getAll('itemIds').map(String).filter(Boolean);
  const reviewerId = String(formData.get('reviewedByStaffId') ?? '');
  const method = String(formData.get('method') ?? '');
  const note = String(formData.get('note') ?? '');
  if (itemIds.length === 0) redirect('/admin/items?error=nothing-selected');

  const reviewer = await prisma.parentAccount.findUnique({
    where: { id: reviewerId },
    select: { email: true, staffRole: true },
  });
  if (!reviewer || reviewer.staffRole !== 'REVIEWER') {
    redirect('/admin/items?error=reviewer-not-a-reviewer');
  }

  const record = {
    reviewedBy: `human:${reviewer.email}`,
    recordedBy: `human:${staff.email}`,
    method,
    note,
  };
  const failures = validateVerbalRecord({
    approvedBy: record.reviewedBy,
    recordedBy: record.recordedBy,
    method,
    note,
  });
  if (failures.length > 0) {
    redirect(`/admin/items?error=${encodeURIComponent(failures[0]!.reason)}`);
  }

  let recorded = 0;
  const skipped: string[] = [];
  for (const itemId of itemIds) {
    const item = await prisma.item.findUnique({ where: { id: itemId }, include: { options: true, questionType: true } });
    if (!item || item.status !== 'DRAFT') {
      skipped.push(`${itemId.slice(0, 8)}: not a draft`);
      continue;
    }
    if (item.authoredBy === record.reviewedBy) {
      skipped.push(`${itemId.slice(0, 8)}: that reviewer wrote it`);
      continue;
    }
    if (item.similarityFlaggedAt && !item.similarityClearedBy) {
      skipped.push(`${itemId.slice(0, 8)}: similarity flag not cleared`);
      continue;
    }
    const blocker = publishBlockers(item.options, record.reviewedBy, item.authoredBy, item.answerFlaggedAt);
    if (blocker) {
      skipped.push(`${itemId.slice(0, 8)}: ${blocker}`);
      continue;
    }
    const copyBlock = childFacingBlock(item);
    if (copyBlock) { skipped.push(`${itemId.slice(0, 8)}: child-facing copy — ${copyBlock}`); continue; }
    if (await assertMisconceptionsActive(item.options)) {
      skipped.push(`${itemId.slice(0, 8)}: uses an unapproved misconception`);
      continue;
    }
    await prisma.item.update({
      where: { id: itemId },
      data: {
        status: 'REVIEWED',
        reviewedBy: record.reviewedBy,
        reviewRecordedBy: record.recordedBy,
        reviewMethod: method,
        reviewRecordNote: note,
        reviewNotes: null,
      },
    });
    await recordAudit(staff.id, 'item.review_recorded', 'Item', itemId, {
      reviewedBy: record.reviewedBy,
      recordedBy: record.recordedBy,
      method,
      note,
    });
    recorded += 1;
  }

  redirect(
    `/admin/items?status=DRAFT&recorded=${recorded}${
      skipped.length ? `&skipped=${encodeURIComponent(skipped.join(' · '))}` : ''
    }`,
  );
}

/**
 * BULK MARK REVIEWED, AS YOURSELF (David's ruling, 2026-08-02). The reviewer's
 * own click sets `reviewedBy`; there is no recorder, because nothing is being
 * transcribed. Every per-item guard the single-item path applies still
 * applies, and anything refused is reported rather than dropped — a reviewer
 * needs to know which three of their forty did not go through, and why.
 */
export async function bulkMarkReviewedAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const itemIds = formData.getAll('itemIds').map(String).filter(Boolean);
  if (itemIds.length === 0) redirect('/admin/items?status=DRAFT&error=Select+at+least+one+first.');

  const reviewedBy = `human:${staff.email}`;
  let reviewed = 0;
  const skipped: string[] = [];

  for (const itemId of itemIds) {
    const item = await prisma.item.findUnique({ where: { id: itemId }, include: { options: true, questionType: true } });
    if (!item || item.status !== 'DRAFT') {
      skipped.push(`${itemId.slice(0, 8)}: not a draft`);
      continue;
    }
    if (item.authoredBy === reviewedBy) {
      skipped.push(`${itemId.slice(0, 8)}: you wrote it`);
      continue;
    }
    if (item.similarityFlaggedAt && !item.similarityClearedBy) {
      skipped.push(`${itemId.slice(0, 8)}: similarity flag not cleared`);
      continue;
    }
    const blocker = publishBlockers(item.options, reviewedBy, item.authoredBy, item.answerFlaggedAt);
    if (blocker) {
      skipped.push(`${itemId.slice(0, 8)}: ${blocker}`);
      continue;
    }
    const copyBlock = childFacingBlock(item);
    if (copyBlock) { skipped.push(`${itemId.slice(0, 8)}: child-facing copy — ${copyBlock}`); continue; }
    if (await assertMisconceptionsActive(item.options)) {
      skipped.push(`${itemId.slice(0, 8)}: uses a misconception you have not approved yet`);
      continue;
    }
    await prisma.item.update({
      where: { id: itemId },
      data: { status: 'REVIEWED', reviewedBy, reviewMethod: 'in-platform', reviewNotes: null },
    });
    await recordAudit(staff.id, 'item.review', 'Item', itemId, { reviewedBy });
    reviewed += 1;
  }

  redirect(
    `/admin/items?status=DRAFT&reviewed=${reviewed}${
      skipped.length ? `&skipped=${encodeURIComponent(skipped.join(' · '))}` : ''
    }`,
  );
}
