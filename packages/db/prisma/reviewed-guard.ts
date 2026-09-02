/**
 * REVIEWED CONTENT IS IMMUTABLE TO CODE CHANGES (annie, 2026-08-12). Full stop.
 *
 * Not versioned, not diffed, not warned about. A re-derivation that would alter a signed item
 * FAILS rather than writes, and the resolution is an explicit re-review — never an automatic
 * update with a note. Anything softer reintroduces the same path with a paper trail attached,
 * and the trail does not help if nobody reads it before the item is served.
 *
 * THE COUPLING THIS BREAKS. `seedItems` and `generate-content` both upsert with an `update`
 * clause that rewrites `stem` and option content unconditionally. The values written are computed
 * by derivation functions (`buildDerivedVrDistractors`, the maths executors), so a change to one
 * of those functions silently rewrites every item it owns — including items a reviewer has
 * approved. `seed-vr09-12` and `seed-vr09-13` are the demonstration: both APPROVED, both had
 * their options re-derived by a seed run, and their reviewed walk scripts were left naming
 * options no longer on the card. Nothing failed; a gate caught it afterwards, by luck of the
 * script check existing.
 *
 * WHAT COUNTS AS REVIEWED. A row carrying a review STATUS (LIVE or RETIRED — a retired item was
 * reviewed and withdrawn, and re-deriving it would quietly change what a ruling was made about)
 * or ANY attribution event. DRAFT rows with no attribution are an authoring queue and are
 * rewritten freely, which is what keeps the seed re-runnable.
 *
 * WHAT THIS DOES NOT BREAK, which is the point. An unchanged re-derivation is a NO-OP, not a
 * failure: re-running the seed against reviewed rows whose derivation still produces the same
 * values does nothing and reports nothing. Measured before building this — across the 127 signed
 * derived items, 0 currently diverge — so a seed run today passes this guard untouched. It only
 * fires when a derivation function has actually changed what a reviewed item says, and that is
 * exactly the moment a human is needed.
 */
import type { PrismaClient } from '@prisma/client';

export interface DerivedItemWrite {
  id: string;
  stem: unknown;
  options: Array<{ content: unknown; isCorrect: boolean; misconceptionId?: string | null }>;
}

export interface GuardOutcome {
  /** Reviewed rows whose re-derivation matches what is stored — nothing to do. */
  unchangedReviewed: string[];
  /** Rows free to write: DRAFT, unattributed, or absent. */
  writable: string[];
  /** Reviewed rows the re-derivation WOULD have altered. Any entry here fails the run. */
  blocked: Array<{ id: string; detail: string }>;
}

function canonical(value: unknown): string {
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.keys(v as Record<string, unknown>)
          .sort()
          .map((k) => [k, walk((v as Record<string, unknown>)[k])]),
      );
    }
    return v;
  };
  return JSON.stringify(walk(value));
}

/**
 * Classify a batch of derived writes against what the database already holds.
 *
 * Read-only: it decides nothing about writing, so a caller can report the whole picture before
 * changing anything rather than failing partway through a half-applied run.
 */
export async function classifyDerivedWrites(
  prisma: PrismaClient,
  writes: DerivedItemWrite[],
): Promise<GuardOutcome> {
  const ids = writes.map((w) => w.id);
  const existing = await prisma.item.findMany({
    where: { id: { in: ids } },
    include: { options: { orderBy: { id: 'asc' } } },
  });
  const byId = new Map(existing.map((i) => [i.id, i]));
  const attributed = new Set(
    (
      await prisma.attributionEvent.findMany({
        where: { recordType: 'item', recordId: { in: ids } },
        select: { recordId: true },
      })
    ).map((e) => e.recordId),
  );

  const outcome: GuardOutcome = { unchangedReviewed: [], writable: [], blocked: [] };
  for (const write of writes) {
    const row = byId.get(write.id);
    if (!row) {
      outcome.writable.push(write.id);
      continue;
    }
    const reviewed = row.status === 'LIVE' || row.status === 'RETIRED' || attributed.has(write.id);
    if (!reviewed) {
      outcome.writable.push(write.id);
      continue;
    }
    const differences: string[] = [];
    if (canonical(row.stem) !== canonical(write.stem)) differences.push('stem');
    const storedOptions = row.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect }));
    const nextOptions = write.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect }));
    if (canonical(storedOptions) !== canonical(nextOptions)) {
      differences.push(
        `options (stored [${row.options.map((o) => String((o.content as { value?: unknown })?.value)).join(', ')}]` +
          ` → would write [${write.options.map((o) => String((o.content as { value?: unknown })?.value)).join(', ')}])`,
      );
    }
    if (differences.length === 0) outcome.unchangedReviewed.push(write.id);
    else {
      outcome.blocked.push({
        id: write.id,
        detail: `${row.status}${attributed.has(write.id) ? ' + attributed' : ''}: ${differences.join('; ')}`,
      });
    }
  }
  return outcome;
}

/** Thrown when a re-derivation would alter reviewed content. Never caught by a writer. */
export class ReviewedContentError extends Error {}

/**
 * Report the classification, and REFUSE the whole run if any reviewed row would change.
 *
 * Fails before anything is written, so a blocked run leaves the database exactly as it was —
 * a partially-applied re-derivation would be a worse state than either endpoint.
 */
export function assertNoReviewedRewrite(outcome: GuardOutcome, door: string): void {
  console.log(
    `  ${door}: ${outcome.writable.length} writable · ${outcome.unchangedReviewed.length} reviewed and unchanged · ` +
      `${outcome.blocked.length} reviewed and WOULD CHANGE`,
  );
  if (outcome.blocked.length === 0) return;
  const lines = outcome.blocked.map((b) => `  ✗ ${b.id} — ${b.detail}`).join('\n');
  throw new ReviewedContentError(
    `${door} REFUSED: a derivation function would rewrite ${outcome.blocked.length} REVIEWED item(s).\n${lines}\n\n` +
      'Reviewed content is immutable to code changes. A derivation function has changed what these\n' +
      'items say since a reviewer approved them — that is a content change, and it needs an explicit\n' +
      're-review, not an automatic update with a note in the log. Nothing was written; the database is\n' +
      'as it was. To proceed: take the change to review, and apply the outcome through the written-\n' +
      'review path. Do not relax this guard to make a run go green.',
  );
}

/**
 * THE SANCTIONED OVERRIDE — how a reviewer's own ruling still reaches reviewed content.
 *
 * The client guard below refuses content writes to reviewed rows. That must not block the review
 * PIPELINE itself: the CMS, and the scripts that apply a written ruling, exist precisely to change
 * what a reviewer approved. They declare it, loudly and with a reason, the same shape as
 * `emergencyOverridePilotFile` — because the fault being closed was a change nobody could tell
 * apart from noise, and a quiet override would be that fault again one level up.
 *
 * Deliberately NOT an allowlist of script names. A door that means to rewrite reviewed content
 * says so at the point it does it; a list somewhere else drifts from the doors it names (R42).
 */
let overrideReason: string | null = null;

export function allowReviewedContentWrites(reason: string): void {
  if (!reason || reason.trim().length < 12) {
    throw new Error('allowReviewedContentWrites needs a real reason — name the ruling being applied.');
  }
  overrideReason = reason;
  console.warn(
    '\n  ⚠ REVIEWED-CONTENT WRITES ENABLED for this run.\n' +
      `    Reason: ${reason}\n` +
      '    Every content write to a reviewed row is now permitted. This is the review path doing\n' +
      "    its job; it is not a way around the guard. If you did not mean to enable it, stop.\n",
  );
}

export function reviewedContentWritesAllowed(): string | null {
  return overrideReason;
}

/* ------------------------------------------------------------------------------------------- */

/**
 * A SIGNATURE NAMES A PERSON — `recordSignature` is the only way to write one (R65).
 *
 * 46 signatures resolved to a role account, not a human, and annie raised it at 13, 33 and 46 —
 * the one item that gets worse purely by waiting. The backfill fixed the history; this stops the
 * next one being written the same way. Same shape as the derived-write guard: a property of the
 * PATH, enforced by `check:signing-doors`, not a policy someone has to remember.
 */
export interface SignatureRecord {
  recordType: string;
  recordId: string;
  reviewerId: string;
  recordedBy: string;
  method: string;
  note?: string;
  subjectHash?: string;
  /**
   * WHAT THE HASH IS OVER (Annie's 216th — R973). Required whenever `subjectHash` is given: a
   * signature that does not say what it is over is an assertion with an unstated referent, and
   * eleven sound rows were read as drift because one column held several kinds of hash. Take both
   * from `SIGNATURE_SUBJECTS` in @cluecrew/core rather than writing a string here — an
   * undeclared subject is one nobody can re-derive.
   */
  subjectKind?: string;
  subjectSpec?: string;
}

export async function recordSignature(
  prisma: PrismaClient,
  signature: SignatureRecord,
): Promise<void> {
  const reviewer = await prisma.reviewer.findUnique({ where: { id: signature.reviewerId } });
  if (!reviewer) {
    throw new Error(
      `Refusing to record a signature for unknown reviewer "${signature.reviewerId}". A signature ` +
        'names a PERSON — create the Reviewer row first, with the evidence for who they are.',
    );
  }
  if (!signature.method || signature.method.trim().length < 8) {
    throw new Error('Refusing to record a signature with no method — say how the review happened.');
  }
  if (signature.subjectHash && (!signature.subjectKind || !signature.subjectSpec)) {
    throw new Error(
      'Refusing to record a signature that carries a subjectHash without naming its SUBJECT (R973).\n' +
      '  A hash with an unstated referent is what read eleven sound rows as drift: one column held a row\n' +
      '  projection, an execution text and the review surface\'s own subject, with nothing to tell them apart.\n' +
      '  Pass subjectKind and subjectSpec from SIGNATURE_SUBJECTS in @cluecrew/core.',
    );
  }
  await prisma.attributionEvent.create({
    data: {
      recordType: signature.recordType,
      recordId: signature.recordId,
      action: 'SIGNED',
      // `actor` stays the human-readable cache it now is; `reviewerId` carries identity.
      actor: reviewer.displayName.toLowerCase(),
      reviewerId: reviewer.id,
      recordedBy: signature.recordedBy,
      method: signature.method,
      note: signature.note ?? null,
      subjectHash: signature.subjectHash ?? null,
      subjectKind: signature.subjectKind ?? null,
      subjectSpec: signature.subjectSpec ?? null,
    },
  });
}

/**
 * THE PAIRED STATEMENT, DERIVED (annie's wording, 2026-08-12 — R65).
 *
 * The signature count cannot be printed without the event-log figure beside it, because the two
 * were reported separately and the gap between them is the finding: 46 signatures look like 46
 * reviews until you read that only 25 of the events behind them carry a written review.
 *
 * Generated rather than hand-written, so it cannot go stale. Her original wording carried a third
 * clause — that the signatures resolve to a role account. The naming path has fixed that, so the
 * clause is DROPPED when it stops being true rather than repeated as though nothing changed; when
 * a signature has no named reviewer it reappears, naming the number.
 */
export async function signatureProvenanceStatement(prisma: PrismaClient): Promise<string> {
  const signatures = await prisma.attributionEvent.count({ where: { action: 'SIGNED' } });
  // ITEM events, which is the population annie's figures describe (301 at the time of her
  // statement: 25 + 276). The discriminator is METHOD, not the null-ness of note/field/hash — a
  // handover row is empty BECAUSE it is a backfill, so method is the cause and the empty columns
  // are the symptom. Reading the symptom gave 77/484 against her 25/276, which is how this was
  // caught: a derived figure that disagrees with the reviewer's own is wrong until it is
  // explained, not published.
  const events = await prisma.attributionEvent.findMany({
    where: { recordType: 'item' },
    select: { method: true },
  });
  const backfill = events.filter((e) => /backfill/i.test(e.method ?? '')).length;
  // A null method is neither a written review nor a backfill. Folding it into "written" would
  // inflate the very figure this statement exists to keep honest, so it gets its own clause.
  const unmethodded = events.filter((e) => !e.method).length;
  const written = events.length - backfill - unmethodded;
  const unnamed = await prisma.attributionEvent.count({
    where: { action: 'SIGNED', reviewerId: null },
  });

  return (
    `${signatures} generator signatures on record. The attribution log behind them holds ` +
    `${written} events carrying a written review; the remaining ${backfill} are handover ` +
    `provenance backfill with null field, note and hash.` +
    (unmethodded > 0 ? ` ${unmethodded} record no method at all.` : '') +
    (unnamed > 0
      ? ` ${unnamed} of the signatures still resolve to a role account rather than a named reviewer.`
      : '')
  );
}
