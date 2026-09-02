'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { reviewSurfaceRenders, checkItemChildFacing, checkSolution, draftAssessmentSubjectHash, fingerprintItem, inactiveMisconceptions, isBlocking, mathsPlanFileSchema, publishBlockers, screenAgainstIndex, SIGNATURE_SUBJECTS, stemSchema } from '@cluecrew/core';
import mathsPlanContent from '../../../../content/maths-district-plan.json';

const mathsPlan = mathsPlanFileSchema.parse(mathsPlanContent);
import { prisma, recordSignature, type ItemStatus } from '@cluecrew/db';
import { similarityIndexSource } from '@/lib/similarity-index';
import { currentStaff, recordAudit, roleAllows } from '@/lib/staff';
import { validateVerbalRecord } from '@/lib/review-provenance';
import { writeReviewerReturn } from '@/lib/reviewer-return';

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
  const rows = await prisma.misconception.findMany({ where: { id: { in: ids } }, select: { id: true, status: true } });
  const byId = new Map(rows.map((r) => [r.id, r.status]));
  // The DECISION is `inactiveMisconceptions` in core, so the district survey screens on the same
  // rule this door enforces. A tag with no row at all is inactive here, as it was under the count.
  const inactive = inactiveMisconceptions(options, byId);
  if (inactive.length === 0) return null;
  // ONE ROUTE, THREE CAUSES (David's ruling, 2026-08-16 — R106). This returned
  // `unapproved-misconception` for all three, and the message a reviewer then read told her to
  // approve the tag in the queue. For a RETIRED tag that instruction is WRONG and the tag is not in
  // the queue to approve — the item needs retagging, which is not her job at all. Eleven English
  // items are in exactly that state. The door still refuses identically; only the reason it gives
  // is split, because the reason is the whole of what the reviewer does next.
  if (inactive.some((id) => !byId.has(id))) return 'unknown-misconception';
  if (inactive.some((id) => byId.get(id) === 'RETIRED')) return 'retired-misconception';
  return 'unapproved-misconception';
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
  const newTagFault = await assertMisconceptionsActive(parsed.options);
  if (newTagFault) {
    redirect(`/admin/items/new?error=${newTagFault}`);
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
  const editTagFault = await assertMisconceptionsActive(parsed.options);
  if (editTagFault) redirect(`/admin/items/${itemId}?error=${editTagFault}`);
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
/**
 * CONFIRM THE WRITE BEFORE REPORTING SUCCESS.
 *
 * The redirect is what a reviewer reads as "done". It fired cleanly for a signature action that
 * had THROWN and written nothing — Next.js swallowed a PrismaClientValidationError and still
 * navigated, so the form submitted, the page changed, and no error appeared. She would have signed
 * a cluster and seen nothing wrong.
 *
 * Every action here ends in an unconditional redirect after a write and none of them re-read what
 * they claim to have written, so any of them can report success on a path that wrote nothing. This
 * re-reads the row and redirects with `write-did-not-land` when it did not.
 */
async function confirmItemStatus(itemId: string, expected: ItemStatus): Promise<void> {
  const row = await prisma.item.findUnique({ where: { id: itemId }, select: { status: true } });
  if (row?.status !== expected) redirect(`/admin/items/${itemId}?error=write-did-not-land`);
}

export async function markReviewedAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const itemId = z.string().min(1).parse(formData.get('itemId'));
  const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId }, include: { options: { orderBy: { id: 'asc' } }, questionType: true } });

  /**
   * **R832 — THE SURFACE RENDERS THE ITEM OR THIS ACTION REFUSES.** Her 181st: a control that can
   * record a judgement it cannot inform manufactures attested-but-unread rows at whatever rate
   * somebody clicks, and they cannot be told apart afterwards by inspection. Refused HERE rather
   * than by hiding the button — a hidden control can be re-enabled and a refusing action cannot be
   * clicked past.
   */
  const surface = reviewSurfaceRenders(item.questionType.district);
  if (!surface.renders) redirect(`/admin/items/${itemId}?error=surface-cannot-render`);

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
  const reviewTagFault = await assertMisconceptionsActive(item.options);
  if (reviewTagFault) redirect(`/admin/items/${itemId}?error=${reviewTagFault}`);
  if (childFacingBlock(item)) redirect(`/admin/items/${itemId}?error=child-facing-copy`);

  // THE RULING BECOMES A FILE HERE (R113). Her reasoning is an AUTHORED FIELD: written down at the
  // moment of the verdict, hashed over the bytes written, and pinned to the attribution event. Every
  // other door in this repo writes state and leaves the reasoning in the conversation, which is the
  // one part a later reader cannot reconstruct — and is why six real approvals took two days to fail
  // to evidence. Reasoning is OPTIONAL and its absence is RECORDED as an absence, never elided: a
  // verdict given without a reason is a fact about the verdict.
  const reasoning = String(formData.get('reasoning') ?? '').trim();
  // WHOSE JUDGEMENT IT IS COMES FROM THE FORM, NOT THE LOGIN (R115). Annie reviews on paper and
  // never signs in; the person at this keyboard is David transcribing her ruling. Inferring the
  // reviewer from the session would name the transcriber, and a ruling channel that cannot name the
  // ruler is the gap it was built to close. Falls back to the signed-in account's own Reviewer row
  // when nothing is chosen, so a reviewer ruling on her own work is unaffected.
  const chosenReviewerId = String(formData.get('reviewerId') ?? '').trim();
  const reviewer = chosenReviewerId
    ? await prisma.reviewer.findFirst({
      where: { id: chosenReviewerId, heldUntil: null }, select: { id: true, displayName: true },
    })
    : await prisma.reviewer.findFirst({
      where: { staffEmail: staff.email.toLowerCase(), heldUntil: null },
      select: { id: true, displayName: true },
    });
  // A CHOSEN REVIEWER THAT DOES NOT RESOLVE IS A REFUSAL, not a silent fallback to nobody. Writing
  // the return anyway would produce exactly the artefact this door exists to prevent: a ruling
  // naming no one.
  if (chosenReviewerId && !reviewer) redirect(`/admin/items/${itemId}?error=not-a-named-reviewer`);
  const at = new Date().toISOString();
  const written = writeReviewerReturn({
    reviewerName: reviewer?.displayName ?? staff.email,
    reviewerId: reviewer?.id ?? 'UNRESOLVED — this staff account matches no Reviewer row',
    recordedBy: `human:${staff.email}`,
    scope: itemId,
    at,
    rulings: [{ subject: itemId, verdict: 'REVIEWED', reasoning, changedFrom: item.status, changedTo: 'REVIEWED' }],
  });

  await prisma.item.update({
    where: { id: itemId },
    data: { status: 'REVIEWED', reviewedBy: `human:${staff.email}`, reviewNotes: null },
  });
  await confirmItemStatus(itemId, 'REVIEWED');
  await prisma.attributionEvent.create({
    data: {
      reviewerId: reviewer?.id ?? null,
      // APPROVED, not a new enum value: marking REVIEWED is the reviewer approving the item for
      // the next stage, and `method` carries which door it came through.
      recordType: 'item', recordId: itemId, action: 'APPROVED',
      actor: reviewer?.displayName ?? `human:${staff.email}`,
      recordedBy: `human:${staff.email}`,
      note: reasoning || null,
      method: 'in-platform review door',
      returnArtefact: { ...written },
    },
  });
  // RE-READ WHAT WAS CLAIMED before the redirect the reviewer reads as success. A swallowed error
  // that still navigated cleanly is how a signature door reported a write it had never made.
  const landed = await prisma.attributionEvent.count({
    where: { recordType: 'item', recordId: itemId, action: 'APPROVED' },
  });
  if (landed === 0) redirect(`/admin/items/${itemId}?error=review-did-not-land`);
  await recordAudit(staff.id, 'item.review', 'Item', itemId, { returnArtefact: written.file });
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

/**
 * `publishBlockers` MOVED TO `@cluecrew/core` (2026-08-16). It was private here, so the only way to
 * ask "how many items would refuse a verdict district-wide" was to reimplement its conditions —
 * R41's fault exactly. The door and any checker now call the same function.
 */

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
  const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId }, include: { options: { orderBy: { id: 'asc' } }, questionType: true } });

  if (item.status !== 'REVIEWED' || !item.reviewedBy) {
    redirect(`/admin/items/${itemId}?error=not-reviewed`);
  }
  const failure = publishBlockers(item.options, item.reviewedBy, item.authoredBy, item.answerFlaggedAt);
  if (failure) redirect(`/admin/items/${itemId}?error=${failure}`);
  if (childFacingBlock(item)) redirect(`/admin/items/${itemId}?error=child-facing-copy`);

  await prisma.item.update({ where: { id: itemId }, data: { status: 'LIVE' } });
  await confirmItemStatus(itemId, 'LIVE');
  await recordAudit(staff.id, 'item.publish', 'Item', itemId);
  redirect(`/admin/items/${itemId}`);
}

export async function retireItemAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');
  const itemId = z.string().min(1).parse(formData.get('itemId'));
  await prisma.item.update({ where: { id: itemId }, data: { status: 'RETIRED' } });
  await confirmItemStatus(itemId, 'RETIRED');
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
  const allTagFault = await assertMisconceptionsActive(allOptions);
  if (allTagFault) redirect(`/admin/import?error=${allTagFault}`);

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
    const item = await prisma.item.findUnique({ where: { id: itemId }, include: { options: { orderBy: { id: 'asc' } }, questionType: true } });
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
    const bulkTagFault = await assertMisconceptionsActive(item.options);
    if (bulkTagFault) { skipped.push(`${itemId.slice(0, 8)}: ${bulkTagFault}`); continue; }
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
    const item = await prisma.item.findUnique({ where: { id: itemId }, include: { options: { orderBy: { id: 'asc' } }, questionType: true } });
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
    const markTagFault = await assertMisconceptionsActive(item.options);
    if (markTagFault) { skipped.push(`${itemId.slice(0, 8)}: ${markTagFault}`); continue; }
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

/**
 * THE WEB SIGNATURE DOOR — a named individual's judgement, recorded AT THE MOMENT SHE GIVES IT.
 *
 * David's ruling, 2026-08-16. Recording a signature later by script is exactly the
 * machine-verdict-under-a-person's-authority conflation this repo has spent two weeks naming, and
 * every one of the 46 existing signatures took that route. This gives the web path the same
 * protections the script path has:
 *
 *   · REVIEWER RESOLVED THROUGH THE NAMING PATH. The signed-in staff account must match a
 *     `Reviewer` row by `staffEmail`. No match, no signature — a role account can never sign.
 *   · recordedBy SEPARATE FROM reviewerId. Whose judgement it was is never merged with who typed
 *     it, even when they are the same person at the same keyboard.
 *   · subjectHash PINNED AT SIGNING, over the stem, the options in stored order with their key
 *     flags, and the tier. Change the item afterwards and the signature reads SUPERSEDED rather
 *     than going on describing an item that no longer exists.
 *   · recordSignature IS THE ONLY WRITER. This action never touches AttributionEvent itself, so
 *     `check:signing-doors` keeps holding.
 *   · IT REFUSES AN UNAPPROVED TAG. A signature over an item tagged against a misconception nobody
 *     has approved would be signing someone else's unfinished decision.
 */
export async function signItemAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const itemId = z.string().min(1).parse(formData.get('itemId'));
  const method = z.string().trim().min(8).parse(formData.get('method'));
  const item = await prisma.item.findUniqueOrThrow({
    where: { id: itemId },
    include: { options: { orderBy: { id: 'asc' } }, questionType: true },
  });

  // R832 — the surface renders the item or this action refuses. See markReviewedAction.
  const surface = reviewSurfaceRenders(item.questionType.district);
  if (!surface.renders) redirect(`/admin/items/${itemId}?error=surface-cannot-render`);

  // THE NAMING PATH. A signature names a person, so the staff account must resolve to one.
  const reviewer = await prisma.reviewer.findFirst({
    where: { staffEmail: staff.email.toLowerCase(), heldUntil: null },
  });
  if (!reviewer) redirect(`/admin/items/${itemId}?error=not-a-named-reviewer`);

  if (item.status !== 'REVIEWED') redirect(`/admin/items/${itemId}?error=not-reviewed`);
  if (item.authoredBy === `human:${staff.email}`) redirect(`/admin/items/${itemId}?error=own-item`);
  const signTagFault = await assertMisconceptionsActive(item.options);
  if (signTagFault) redirect(`/admin/items/${itemId}?error=${signTagFault}`);

  // WHAT IS BEING SIGNED, fingerprinted now. Same subject the draft self-assessment pins: the
  // child-facing item plus its tier.
  const stem = (item.stem ?? {}) as Record<string, unknown>;
  const subjectHash = draftAssessmentSubjectHash({
    prompt: typeof stem.text === 'string' ? stem.text : typeof stem.prompt === 'string' ? stem.prompt : null,
    tier: item.difficultyTier,
    options: item.options.map((o) => ({
      text: typeof o.content === 'string' ? o.content : String((o.content as { value?: unknown })?.value ?? ''),
      isCorrect: o.isCorrect,
    })),
  });

  await recordSignature(prisma, {
    recordType: 'item',
    recordId: itemId,
    reviewerId: reviewer!.id,
    // Whose judgement, and who typed it — never merged, even when they are the same person.
    recordedBy: `human:${staff.email}`,
    method,
    note: `Signed in-platform on the comprehension review surface by ${reviewer!.displayName}.`,
    subjectHash,
    // THE SUBJECT THIS PATH WRITES, DECLARED (R973). It is not the row projection, and a verifier
    // assuming that reads a sound signature as drift — which is exactly what happened to the two
    // signatures this surface had already written.
    subjectKind: SIGNATURE_SUBJECTS.DRAFT_ASSESSMENT.kind,
    subjectSpec: SIGNATURE_SUBJECTS.DRAFT_ASSESSMENT.spec,
  });
  // CONFIRM THE WRITE BEFORE REDIRECTING. The redirect is what the reviewer reads as success, and
  // it fired cleanly for an action that had thrown and written nothing: Next.js swallowed a
  // PrismaClientValidationError and still navigated. She would have signed a cluster and seen
  // nothing wrong. A door that reports success must re-read what it claims to have written.
  const landed = await prisma.attributionEvent.count({
    where: { recordType: 'item', recordId: itemId, action: 'SIGNED' },
  });
  if (landed === 0) redirect(`/admin/items/${itemId}?error=signature-did-not-land`);
  await recordAudit(staff.id, 'item.sign', 'Item', itemId);
  redirect(`/admin/items/${itemId}`);
}
