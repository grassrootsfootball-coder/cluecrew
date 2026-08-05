/**
 * Recording a decision that was made somewhere else (David's ruling,
 * 2026-08-02).
 *
 * The specialist reviewer works in a sitting, with paper and conversation.
 * Some of what they decide never gets typed into the platform by them. An
 * admin entering it afterwards is legitimate — but it is a DIFFERENT KIND of
 * record from an approval made in the platform, and the difference must
 * survive: `approvedBy` is whose professional judgement this was,
 * `recordedBy` is who typed it in. Collapsing them would let the audit trail
 * claim a reviewer clicked something they never saw.
 *
 * Three layers hold the line, deliberately:
 *   1. these pure checks, so the rule is testable and the error messages are
 *      written for a person rather than a stack trace;
 *   2. the server action, which additionally proves the named approver really
 *      is a reviewer account;
 *   3. CHECK constraints on the tables, so no future code path can merge them.
 */

/** The shape identities take everywhere in the CMS. */
export const IDENTITY_PATTERN = /^human:[^\s@]+@[^\s@]+$/;

export interface VerbalRecord {
  /** "human:<email>" — the reviewer whose judgement this is. */
  approvedBy: string;
  /** "human:<email>" — the admin entering it. */
  recordedBy: string;
  /** How the decision reached us, e.g. "verbal — sitting #1, 2026-08-01". */
  method: string;
  /** What the reviewer actually said. */
  note: string;
}

export interface ProvenanceFailure {
  field: keyof VerbalRecord;
  /** Written for the admin at the keyboard, not for a log. */
  reason: string;
}

/** A method string is "verbal" if it says so — the word is the claim. */
export function isVerbalMethod(method: string): boolean {
  return /verbal/i.test(method);
}

/**
 * A verbal method must say WHICH occasion and WHEN, because "verbal" alone
 * is unfalsifiable a year later. A date in the string is the cheapest thing
 * that makes the record checkable against a calendar.
 */
export function methodNamesOccasion(method: string): boolean {
  return /\d{4}-\d{2}-\d{2}/.test(method) || /\bsitting\b/i.test(method);
}

export function validateVerbalRecord(record: VerbalRecord): ProvenanceFailure[] {
  const failures: ProvenanceFailure[] = [];
  const approvedBy = record.approvedBy.trim();
  const recordedBy = record.recordedBy.trim();
  const method = record.method.trim();
  const note = record.note.trim();

  if (!IDENTITY_PATTERN.test(approvedBy)) {
    failures.push({
      field: 'approvedBy',
      reason: 'Name the reviewer whose decision this was, as human:<their email>.',
    });
  }
  if (!IDENTITY_PATTERN.test(recordedBy)) {
    failures.push({
      field: 'recordedBy',
      reason: 'The person entering this must be signed in as a staff account.',
    });
  }
  if (approvedBy && approvedBy === recordedBy) {
    failures.push({
      field: 'recordedBy',
      reason:
        'You cannot record your own decision as if someone else made it. If this is your judgement, approve it in the platform as yourself.',
    });
  }
  if (method === '') {
    failures.push({ field: 'method', reason: 'Say how the decision reached you.' });
  } else if (isVerbalMethod(method) && !methodNamesOccasion(method)) {
    failures.push({
      field: 'method',
      reason:
        'A verbal decision needs the occasion and date, e.g. "verbal — sitting #1, 2026-08-01". "Verbal" on its own cannot be checked later.',
    });
  }
  if (isVerbalMethod(method) && note.length < 3) {
    failures.push({
      field: 'note',
      reason:
        'Write what the reviewer said. For a verbal decision this note is the only record of it, so even a short line matters.',
    });
  }
  return failures;
}

/**
 * One line for the audit log and the record itself. Deliberately reads as two
 * people doing two things: anyone scanning the log should see the difference
 * without being told what to look for.
 */
export function describeProvenance(input: {
  approvedBy: string | null;
  recordedBy: string | null;
  method: string | null;
}): string {
  if (!input.approvedBy) return 'not approved';
  if (!input.recordedBy) return `approved by ${input.approvedBy} in the platform`;
  return `decided by ${input.approvedBy}, entered by ${input.recordedBy} (${input.method ?? 'method not stated'})`;
}

/** The preset the sitting-#1 backlog needs, so nobody retypes it 71 times. */
export function verbalMethodFor(sitting: string, isoDate: string): string {
  return `verbal — ${sitting}, ${isoDate}`;
}
