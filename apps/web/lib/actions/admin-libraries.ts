'use server';

import { redirect } from 'next/navigation';
import { checkWordCard, misconceptionImportSchema } from '@cluecrew/core';
import { z } from 'zod';
import { prisma, recordMisconceptionApprovals } from '@cluecrew/db';
import { currentStaff, recordAudit, roleAllows } from '@/lib/staff';
import { validateVerbalRecord } from '@/lib/review-provenance';


const misconceptionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  district: z.enum(['VR', 'NVR', 'MATHS', 'ENGLISH']),
  description: z.string().min(1).max(500),
  childHint: z.string().min(1).max(300),
});

export async function upsertMisconceptionAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['AUTHOR'])) redirect('/admin');

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
  if (!staff || !roleAllows(staff.effectiveRole, ['AUTHOR'])) redirect('/admin');

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
  if (!staff || !roleAllows(staff.effectiveRole, [])) redirect('/admin');

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
    data: { status: 'ACTIVE', approvedBy: `human:${staff.email}`, approvalMethod: 'in-platform' },
  });
  await recordAudit(staff.id, 'misconception.approve', 'Misconception', id, {
    approvedBy: `human:${staff.email}`,
  });
  // Back to the QUEUE, not the top of the page: approving seventy in a row
  // used to mean re-finding your place seventy times.
  redirect('/admin/misconceptions?approved=1');
}

/**
 * SOFT REJECT (David's ruling, 2026-08-02). Rejection used to DELETE the row:
 * one mis-click in a review sitting destroyed a corpus proposal with no undo
 * and no confirmation. It now sets a status. A REJECTED entry is exactly as
 * unusable by items as a PROPOSED one — only ACTIVE serves — so nothing is
 * risked by keeping it, and the evidence survives a slip of the hand.
 *
 * The confirmation step is in the page: rejecting is a two-click act.
 */
export async function rejectMisconceptionAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const id = z.string().min(1).parse(formData.get('id'));
  const note = String(formData.get('note') ?? '').slice(0, 500);
  const entry = await prisma.misconception.findUniqueOrThrow({ where: { id } });
  if (entry.status !== 'PROPOSED') redirect('/admin/misconceptions?rejected=0');

  await prisma.misconception.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectedBy: `human:${staff.email}`,
      rejectedAt: new Date(),
      rejectionNote: note || null,
    },
  });
  await recordAudit(staff.id, 'misconception.reject', 'Misconception', id, { note });
  redirect('/admin/misconceptions?rejected=1');
}

/** Puts a rejected entry back in the queue, with the rejection history cleared. */
export async function restoreMisconceptionAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || staff.effectiveRole !== 'ADMIN') redirect('/admin');

  const id = z.string().min(1).parse(formData.get('id'));
  const entry = await prisma.misconception.findUniqueOrThrow({ where: { id } });
  if (entry.status !== 'REJECTED') redirect('/admin/misconceptions');

  await prisma.misconception.update({
    where: { id },
    data: { status: 'PROPOSED', rejectedBy: null, rejectedAt: null, rejectionNote: null },
  });
  await recordAudit(staff.id, 'misconception.restore', 'Misconception', id, {
    wasRejectedBy: entry.rejectedBy,
  });
  redirect('/admin/misconceptions?restored=1');
}

/**
 * BULK APPROVE AS YOURSELF (David's ruling, 2026-08-02): from the next sitting
 * the reviewer works the platform directly, so their own click sets
 * `approvedBy` and there is no recorder — this is an in-platform decision, not
 * a transcribed one. `recordedBy` stays null, which is exactly what
 * distinguishes it in the audit log and on the record.
 */
export async function bulkApproveMisconceptionsAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const ids = formData.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) redirect('/admin/misconceptions?error=Select+at+least+one+first.');

  let approved = 0;
  let skipped = 0;
  for (const id of ids) {
    const entry = await prisma.misconception.findUnique({ where: { id } });
    if (!entry || entry.status !== 'PROPOSED') {
      skipped += 1;
      continue;
    }
    await prisma.misconception.update({
      where: { id },
      data: { status: 'ACTIVE', approvedBy: `human:${staff.email}`, approvalMethod: 'in-platform' },
    });
    await recordAudit(staff.id, 'misconception.approve', 'Misconception', id, {
      approvedBy: `human:${staff.email}`,
    });
    approved += 1;
  }
  redirect(`/admin/misconceptions?approved=${approved}&skipped=${skipped}`);
}

/**
 * BULK RECORDING OF A DECISION MADE ELSEWHERE (David's ruling, 2026-08-02).
 *
 * Sitting #1 happened with the reviewer in the room and the decisions in
 * conversation. Entering 71 of those one form at a time invites two failures:
 * the admin gives up partway, or they start clicking without reading. So the
 * action is bulk — but every record it writes carries the full provenance
 * individually, and the audit log gets one row PER RECORD, not one per batch.
 * A batch is a convenience for the typist, never a unit of accountability.
 *
 * ADMIN-only on purpose. A reviewer approving their own judgement uses the
 * ordinary in-platform button; this path exists precisely for the case where
 * the decider and the typist are different people, and the action refuses if
 * they turn out to be the same.
 */
export async function bulkRecordMisconceptionApprovalsAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  // Not roleAllows: this is ADMIN-only, and roleAllows lets ADMIN through
  // every reviewer gate, which is the opposite of what we need to check.
  if (!staff || staff.effectiveRole !== 'ADMIN') redirect('/admin');

  const ids = formData.getAll('ids').map(String).filter(Boolean);
  const approverId = String(formData.get('approvedByStaffId') ?? '');
  const method = String(formData.get('method') ?? '');
  const note = String(formData.get('note') ?? '');

  if (ids.length === 0) redirect('/admin/misconceptions?error=Select+at+least+one+first.');

  // The named approver must be a real REVIEWER account. Without this the
  // field is free text and the audit trail can name anyone at all.
  const approver = await prisma.parentAccount.findUnique({
    where: { id: approverId },
    select: { email: true, staffRole: true },
  });
  if (!approver || approver.staffRole !== 'REVIEWER') {
    redirect('/admin/misconceptions?error=approver-not-a-reviewer');
  }

  const record = {
    approvedBy: `human:${approver.email}`,
    recordedBy: `human:${staff.email}`,
    method,
    note,
  };
  const failures = validateVerbalRecord(record);
  if (failures.length > 0) {
    redirect(`/admin/misconceptions?error=${encodeURIComponent(failures[0]!.reason)}`);
  }

  // The shared implementation (packages/db review-recording) — the same code
  // the offline review-pack import calls, so the two doors cannot drift into
  // disagreeing about what a recorded decision is.
  const outcome = await recordMisconceptionApprovals({
    ids,
    record,
    audit: (id, detail) => recordAudit(staff.id, 'misconception.approve_recorded', 'Misconception', id, detail),
  });
  const recorded = outcome.recorded.length;
  const skipped = outcome.skipped.length;

  redirect(`/admin/misconceptions?recorded=${recorded}&skipped=${skipped}`);
}

/**
 * THE WORD PUBLISH DOOR (David's ruling, 2026-08-02).
 *
 * A card reaches a child only through here, and only if it passes the same
 * child-facing gates the file lint and the database sweep apply — the shared
 * implementation in @cluecrew/core, so there is one definition of "passes"
 * and no route around it. Approving is what makes a card servable, so this is
 * the right place for the check to bite: before, not after.
 *
 * Role-aware per the same ruling: a Word card's sentence is not length-capped,
 * because disambiguating a meaning is its job.
 */
export async function approveWordAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const ids = formData.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) redirect('/admin/words?error=Select+at+least+one+first.');

  let approved = 0;
  const refused: string[] = [];
  for (const id of ids) {
    const word = await prisma.word.findUnique({ where: { id } });
    if (!word || word.status !== 'DRAFT') continue;

    const failures = checkWordCard(word);
    if (failures.length > 0) {
      // Named, not silently skipped: the reviewer needs to know which card
      // and which rule, so it can go back for redraft.
      refused.push(`${word.headword}: ${failures[0]!.detail}`);
      continue;
    }
    await prisma.word.update({
      where: { id },
      data: { status: 'LIVE', reviewedBy: `human:${staff.email}`, reviewNotes: null },
    });
    await recordAudit(staff.id, 'word.approve', 'Word', id, { reviewedBy: `human:${staff.email}` });
    approved += 1;
  }

  redirect(
    `/admin/words?approved=${approved}${
      refused.length ? `&refused=${encodeURIComponent(refused.slice(0, 5).join(' · '))}` : ''
    }`,
  );
}

/** Sends a card back for redraft with the reviewer's reason attached. */
export async function returnWordForRedraftAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, ['REVIEWER'])) redirect('/admin');

  const id = z.string().min(1).parse(formData.get('id'));
  const note = z.string().min(1).max(1000).parse(formData.get('note'));
  await prisma.word.update({ where: { id }, data: { status: 'DRAFT', reviewNotes: note } });
  await recordAudit(staff.id, 'word.return_for_redraft', 'Word', id, { note });
  redirect('/admin/words?returned=1');
}
