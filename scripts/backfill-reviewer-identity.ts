/**
 * RESOLVE THE PLACEHOLDER ACTORS TO NAMED REVIEWERS — `pnpm backfill:reviewers [--write]`
 *
 * THE ARGUMENT, in full, because someone will come to this without the conversation:
 *
 *   1. All 46 SIGNED attribution events carry `actor: 'current-reviewer'`. Not most — all.
 *   2. An explicit `actor-identity` REASSIGNED event, written by `backfill-attribution.ts` on
 *      2026-08-06, maps `current-reviewer` → annie. That is a RECORDED mapping, not an inference
 *      from context.
 *   3. None of joan's 97 `previous-reviewer` events is a SIGNED event. So there is no window in
 *      which the two could be confused on a signature — the ambiguity the placeholders create
 *      does not reach the thing being backfilled.
 *   4. Dates CANNOT carry this and must not be used to: measured, joan's 97 events span
 *      13:24:01.242–.361 and annie's begin at 13:24:01.278 — they interleave inside 120
 *      milliseconds, because one backfill pass wrote both. `at` is when an event was RECORDED,
 *      not when the work happened. The placeholder is the only discriminator, and it suffices.
 *
 * That is evidence, not a guess, which is the whole reason this is a separate commit from the
 * schema and from the door guard. EVERY CLAIM ABOVE IS RE-CHECKED AT RUN TIME below — if the
 * database no longer supports one of them, this refuses rather than writing. A backfill whose
 * justification is only in a comment is a backfill nobody can audit later.
 *
 * DRY RUN BY DEFAULT. `--write` applies. `actor` is never touched: the placeholders and the
 * REASSIGNED events ARE the evidence, and normalising them would destroy the record being used
 * to justify this.
 */
import { prisma } from '../packages/db/src/index';

const DAVID = 'human:david@cluecrew.test';

/** The two reviewers the log knows about, and the placeholder each one held. */
const REVIEWERS = [
  {
    id: 'rev-0001',
    displayName: 'Annie',
    resolvesActor: 'current-reviewer',
    heldFrom: new Date('2026-08-01T00:00:00Z'),
    heldUntil: null as Date | null,
    evidence:
      'actor-identity REASSIGNED event (2026-08-06) maps current-reviewer → annie. All 46 SIGNED ' +
      'events carry this placeholder; the three signing sittings (2026-08-06/07/08) fall inside ' +
      'this window.',
  },
  {
    id: 'rev-0002',
    displayName: 'Joan',
    resolvesActor: 'previous-reviewer',
    heldFrom: new Date('2026-01-01T00:00:00Z'),
    heldUntil: new Date('2026-08-06T13:24:01Z'),
    evidence:
      'actor-identity REASSIGNED event (2026-08-06) maps previous-reviewer → joan. Predecessor: ' +
      'all 97 events NONE of which is SIGNED. heldUntil is the handover backfill instant, not a ' +
      'measured end of tenure — her events were RECORDED then, describing earlier work.',
  },
];

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  const problems: string[] = [];

  // --- Re-check every claim the argument rests on ---------------------------
  const signed = await prisma.attributionEvent.findMany({
    where: { action: 'SIGNED' },
    select: { id: true, actor: true, recordType: true, at: true },
  });
  const notCurrent = signed.filter((e) => e.actor !== 'current-reviewer');
  if (notCurrent.length > 0) {
    problems.push(
      `claim 1 FAILS: ${notCurrent.length} of ${signed.length} SIGNED events do not carry ` +
        `'current-reviewer' (${[...new Set(notCurrent.map((e) => e.actor))].join(', ')}). ` +
        'The backfill assumes a single signer; it is not safe to apply.',
    );
  }

  const mappings = await prisma.attributionEvent.findMany({
    where: { recordType: 'actor-identity', action: 'REASSIGNED' },
    select: { recordId: true, actor: true },
  });
  for (const reviewer of REVIEWERS) {
    const found = mappings.find((m) => m.recordId === reviewer.resolvesActor);
    if (!found) {
      problems.push(`claim 2 FAILS: no actor-identity mapping for '${reviewer.resolvesActor}'.`);
    } else if (found.actor.toLowerCase() !== reviewer.displayName.toLowerCase()) {
      problems.push(
        `claim 2 FAILS: the log maps '${reviewer.resolvesActor}' → '${found.actor}', ` +
          `not '${reviewer.displayName}'. The log wins; fix this file.`,
      );
    }
  }

  const joanSigned = await prisma.attributionEvent.count({
    where: { actor: 'previous-reviewer', action: 'SIGNED' },
  });
  if (joanSigned > 0) {
    problems.push(
      `claim 3 FAILS: ${joanSigned} SIGNED event(s) carry 'previous-reviewer'. The two reviewers ` +
        'DO overlap on signatures, so the placeholder cannot be resolved by role alone.',
    );
  }

  if (problems.length > 0) {
    console.error('BACKFILL REFUSED — the evidence no longer holds:\n');
    for (const p of problems) console.error(`  ✗ ${p}`);
    console.error('\nNothing was written. Re-establish the argument before backfilling identity.');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(
    `Evidence holds: all ${signed.length} SIGNED events carry 'current-reviewer'; ` +
      `${mappings.length} actor-identity mapping(s) recorded; 0 SIGNED events carry 'previous-reviewer'.`,
  );

  // --- Apply -----------------------------------------------------------------
  for (const reviewer of REVIEWERS) {
    // SELECTION IS BY PLACEHOLDER, NOT BY DATE — and the measurement forced this correction.
    // joan's 97 events span 13:24:01.242–.361 and annie's begin at 13:24:01.278: they INTERLEAVE
    // inside the same 120 milliseconds, because one backfill pass wrote both. `at` is when an
    // event was RECORDED, not when the work happened, so for backfilled history it carries no
    // information about who did what. The placeholder string does, and it is unambiguous.
    //
    // heldFrom/heldUntil on the Reviewer row therefore describe the REAL-WORLD role tenure. They
    // exist so a THIRD reviewer inheriting 'current-reviewer' later cannot retroactively claim
    // these events — a guard on future resolution, never a discriminator for this backfill.
    const where = { actor: reviewer.resolvesActor, reviewerId: null };
    const n = await prisma.attributionEvent.count({ where });
    const signedN = await prisma.attributionEvent.count({ where: { ...where, action: 'SIGNED' } });
    if (write) {
      await prisma.reviewer.upsert({
        where: { id: reviewer.id },
        create: { ...reviewer },
        update: { displayName: reviewer.displayName, heldUntil: reviewer.heldUntil, evidence: reviewer.evidence },
      });
      await prisma.attributionEvent.updateMany({ where, data: { reviewerId: reviewer.id } });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'actor-identity', recordId: reviewer.resolvesActor!, action: 'REASSIGNED',
          actor: reviewer.displayName.toLowerCase(), recordedBy: DAVID, field: 'reviewerId',
          method: 'R65 reviewer-identity backfill, 2026-08-12',
          note:
            `Resolved '${reviewer.resolvesActor}' to reviewer ${reviewer.id} (${reviewer.displayName}) ` +
            `across ${n} event(s), ${signedN} of them SIGNED, bounded to ` +
            `${reviewer.heldFrom.toISOString().slice(0, 10)}–${reviewer.heldUntil?.toISOString().slice(0, 10) ?? 'present'}. ` +
            `Evidence: ${reviewer.evidence} The actor column is unchanged.`,
        },
      });
    }
    console.log(
      `  ${write ? 'RESOLVED' : 'would resolve'}  ${reviewer.id} ${reviewer.displayName.padEnd(6)} ` +
        `← '${reviewer.resolvesActor}'  ${String(n).padStart(3)} events (${signedN} SIGNED)`,
    );
  }

  const stillNull = await prisma.attributionEvent.count({ where: { reviewerId: null, action: 'SIGNED' } });
  console.log(`\nSIGNED events still without a named reviewer: ${stillNull}`);
  if (!write) console.log('Dry run. Re-run with --write to apply.');
  await prisma.$disconnect();
}

void main();
