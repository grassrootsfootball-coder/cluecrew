/**
 * Recording a reviewer's decisions that were made away from the platform.
 *
 * ONE implementation, called by both doors: the admin CMS bulk-record action
 * and the offline review-pack import. David's rule of 2026-08-02 is the whole
 * point of putting it here — whose judgement it was (`approvedBy`) and who
 * typed it in (`recordedBy`) are different people doing different things, and
 * the record must never merge them. Two copies of that logic would eventually
 * disagree, and the way they would disagree is by dropping the distinction.
 *
 * "Never set approvedBy from a script as if they had clicked": a caller here
 * MUST supply both identities and a method. The database CHECK constraints
 * refuse a row where they are equal or where either is missing, so a script
 * cannot impersonate a click even by accident.
 */
import { checkChildFacingText } from '@cluecrew/core';
import { prisma } from './index';

export interface RecordedApproval {
  /** "human:<email>" — the reviewer whose judgement this is. */
  approvedBy: string;
  /** "human:<email>" — whoever entered it. Must differ from approvedBy. */
  recordedBy: string;
  /** e.g. "written review, 2026-08-02". Never blank. */
  method: string;
  /** What the reviewer actually said. */
  note: string;
}

export interface RecordOutcome {
  recorded: string[];
  skipped: Array<{ id: string; reason: string }>;
}

const IDENTITY = /^human:[^\s@]+@[^\s@]+$/;

/** The guards, in one place, so neither door can be the lenient one. */
export function assertRecordable(record: RecordedApproval): string[] {
  const problems: string[] = [];
  if (!IDENTITY.test(record.approvedBy)) problems.push('approvedBy must be human:<email>');
  if (!IDENTITY.test(record.recordedBy)) problems.push('recordedBy must be human:<email>');
  if (record.approvedBy === record.recordedBy) {
    problems.push(
      'approvedBy and recordedBy cannot be the same person — a decision recorded by its own author is an in-platform approval, not a recorded one',
    );
  }
  if (!record.method.trim()) problems.push('method must say how the decision reached you');
  if (!record.note.trim()) problems.push('note must capture what the reviewer said');
  return problems;
}

/**
 * Approves misconceptions on a reviewer's behalf. The named approver must be
 * a real REVIEWER account — without that check the field is free text and the
 * audit trail can name anyone at all.
 */
export async function recordMisconceptionApprovals(input: {
  ids: string[];
  record: RecordedApproval;
  /** Writes one audit row PER RECORD; a batch is never a unit of accountability. */
  audit: (id: string, detail: Record<string, unknown>) => Promise<void>;
  /**
   * Escape hatch for an explicit human instruction to approve regardless —
   * used once, for the 34 cleared on the first English pack, whose copy pass
   * was still outstanding. Every use is a decision someone has to own.
   */
  skipCopyGate?: boolean;
}): Promise<RecordOutcome> {
  const problems = assertRecordable(input.record);
  if (problems.length > 0) throw new Error(`cannot record: ${problems.join('; ')}`);

  const approverEmail = input.record.approvedBy.replace(/^human:/, '');
  const approver = await prisma.parentAccount.findUnique({
    where: { email: approverEmail },
    select: { staffRole: true },
  });
  if (!approver || approver.staffRole !== 'REVIEWER') {
    throw new Error(`cannot record: ${approverEmail} is not a REVIEWER account`);
  }

  const outcome: RecordOutcome = { recorded: [], skipped: [] };
  for (const id of input.ids) {
    const entry = await prisma.misconception.findUnique({ where: { id } });
    if (!entry) {
      outcome.skipped.push({ id, reason: 'no such misconception' });
      continue;
    }
    if (entry.status !== 'PROPOSED') {
      // Never overwritten: re-recording would silently restate someone
      // else's decision.
      outcome.skipped.push({ id, reason: `already ${entry.status}` });
      continue;
    }
    // Approving makes the child hint SERVE. Until 2026-08-02 nothing checked
    // it on the way through, so a hint could go live carrying banned
    // vocabulary or a sentence no nine-year-old can hold. The reviewer judges
    // the pedagogy; this judges the copy, and both have to pass.
    const copyFailures = checkChildFacingText({
      role: 'hint',
      label: `misconception:${id} childHint`,
      text: entry.childHint,
    });
    if (copyFailures.length > 0 && !input.skipCopyGate) {
      outcome.skipped.push({ id, reason: `child hint fails the gates — ${copyFailures[0]!.detail}` });
      continue;
    }
    await prisma.misconception.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approvedBy: input.record.approvedBy,
        recordedBy: input.record.recordedBy,
        approvalMethod: input.record.method,
        approvalNote: input.record.note,
      },
    });
    await input.audit(id, {
      approvedBy: input.record.approvedBy,
      recordedBy: input.record.recordedBy,
      method: input.record.method,
      note: input.record.note,
    });
    outcome.recorded.push(id);
  }
  return outcome;
}

/** The rejection half of the same pass, kept soft (status, never a delete). */
export async function recordMisconceptionRejections(input: {
  decisions: Array<{ id: string; note: string }>;
  record: RecordedApproval;
  audit: (id: string, detail: Record<string, unknown>) => Promise<void>;
}): Promise<RecordOutcome> {
  const problems = assertRecordable(input.record);
  if (problems.length > 0) throw new Error(`cannot record: ${problems.join('; ')}`);

  const outcome: RecordOutcome = { recorded: [], skipped: [] };
  for (const decision of input.decisions) {
    const entry = await prisma.misconception.findUnique({ where: { id: decision.id } });
    if (!entry || entry.status !== 'PROPOSED') {
      outcome.skipped.push({ id: decision.id, reason: entry ? `already ${entry.status}` : 'no such misconception' });
      continue;
    }
    await prisma.misconception.update({
      where: { id: decision.id },
      data: {
        status: 'REJECTED',
        rejectedBy: input.record.approvedBy,
        rejectedAt: new Date(),
        rejectionNote: `${decision.note} [${input.record.method}; entered by ${input.record.recordedBy}]`,
      },
    });
    await input.audit(decision.id, {
      rejectedBy: input.record.approvedBy,
      recordedBy: input.record.recordedBy,
      method: input.record.method,
      note: decision.note,
    });
    outcome.recorded.push(decision.id);
  }
  return outcome;
}
