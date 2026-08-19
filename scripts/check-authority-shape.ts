/**
 * DOES THE RECORDED AUTHORITY MATCH WHAT PRODUCED THE FINDING? — `pnpm check:authority-shape`
 *
 * Eight items were one delivery away from travelling under a reviewer's authority for a verdict a
 * GATE produced. `check:word-puzzles` sets `answerFlagNote` by executing the item's own rule
 * against its key; a ruling named a reviewer as the source, a report repeated it, and a register
 * entry nearly recorded it. **The database was right the whole time** — `answerFlagNote` has no
 * reviewer field on it, by design — and the conflation happened entirely in prose.
 *
 * THAT IS THE LIMIT OF THIS CHECK, STATED FIRST. It screens the STORE. It cannot screen a ruling,
 * a report or a register entry, and the one instance we have came through exactly that channel.
 * A green run here means the rows are shaped right; it says nothing about what anybody wrote about
 * them.
 *
 * WHAT IT DOES SCREEN, in both directions:
 *   · A MACHINE verdict wearing a person's authority — a row carrying a gate-set flag AND a
 *     reviewer attribution for the same finding.
 *   · A PERSON-SHAPED authority that resolves to nobody — an approver or reviewer id that looks
 *     like a human and matches no `Reviewer` row. It reads as a named individual and is not one,
 *     which is the same conflation with the arrow reversed.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/**
 * Columns a MACHINE writes, and the gate that writes each. A reviewer attribution for the same
 * finding on the same row would be a person's name on a computed verdict.
 */
const MACHINE_SET: Readonly<Record<string, string>> = {
  answerFlagNote: 'check:word-puzzles — executes the item\'s own rule against its key',
  similarityFlaggedAt: 'similarity:scan — a score, never matched text',
  calibrationFlaggedAt: 'the nightly calibration job',
};

/**
 * Person-shaped ids that are DECLARED not to be individuals, with what they actually are. An
 * undeclared one is the finding; a declared one is a decision someone can disagree with.
 */
const DECLARED_NON_INDIVIDUAL: Readonly<Record<string, string>> = {
  'human:fixtures@cluecrew.test': 'the e2e fixture account — never a real decision',
  'human:david@cluecrew.test': 'David, who records rulings rather than making them; recordedBy by design',
};

async function main(): Promise<void> {
  const reviewers = await prisma.reviewer.findMany({ select: { id: true, resolvesActor: true, displayName: true } });
  const resolvable = new Set([
    ...reviewers.map((r) => r.id),
    ...reviewers.map((r) => r.resolvesActor).filter((a): a is string => a !== null),
  ]);

  const items = await prisma.item.findMany({
    select: {
      id: true, reviewedBy: true, reviewRecordedBy: true,
      answerFlagNote: true, similarityFlaggedAt: true, calibrationFlaggedAt: true,
      similarityClearedBy: true,
    },
  });
  const misconceptions = await prisma.misconception.findMany({
    select: { id: true, approvedBy: true, proposedBy: true, approvalMethod: true },
  });
  requirePopulation('check:authority-shape', {
    items: items.length, misconceptions: misconceptions.length, 'reviewer rows': reviewers.length,
  });

  // --- 1. A MACHINE VERDICT WEARING A PERSON'S AUTHORITY -----------------------------------
  const wearing: string[] = [];
  let machineFindings = 0;
  for (const it of items) {
    for (const col of Object.keys(MACHINE_SET)) {
      if ((it as unknown as Record<string, unknown>)[col] == null) continue;
      machineFindings += 1;
      // similarityClearedBy is the ONE case where a person may legitimately act on a machine
      // finding — the gate scores, the reviewer judges coincidence. answerFlagNote has no such
      // route by design, which is exactly why a reviewer attribution beside it would be wrong.
      if (col === 'answerFlagNote' && it.reviewedBy) {
        wearing.push(`${it.id}: ${col} is machine-set (${MACHINE_SET[col]}) and reviewedBy=${it.reviewedBy}`);
      }
    }
  }

  // --- 2. EVERY AUTHORITY VALUE, WHATEVER ITS SHAPE ----------------------------------------
  /**
   * **THIS SCREENED ONE SHAPE AND FOUR WALKED PAST IT** (David, 2026-08-19 — R228). The guard was
   * `who.startsWith('human:')`, so only the email form was ever inspected. The store records the
   * SAME PERSON five ways — `human:staff-reviewer@…`, `reviewer:rev-0001`, `rev-0001`,
   * `current-reviewer`, and null — and three of those five were skipped before any test ran.
   * **An allow-list keyed on one shape is not a screen; it is a screen with four doors beside it**,
   * and it is R57's finding (a door that drops what it cannot name) wearing checking clothes.
   *
   * Inverted: EVERY non-null value in an authority column is classified and counted. A value is
   * clean only if it RESOLVES to a Reviewer row or is DECLARED. Nothing passes for having an
   * unfamiliar prefix.
   */
  const unresolved = new Map<string, { rows: number; where: Set<string> }>();
  const everyValue = new Map<string, { rows: number; where: Set<string>; resolvesTo: { id: string; label: string; via: string } | null }>();

  /**
   * The shapes a value can resolve through, each named. `reviewer:<id>` and a bare `<id>` both
   * point at a Reviewer row; `<resolvesActor>` is the placeholder a row maps to a person.
   */
  // Returns the PERSON, not a sentence about the person. The first version returned a formatted
  // string including the route ('via actor …'), so grouping by it split one reviewer into two
  // people and under-reported her shapes as 2 when they are 3 — a key built out of display text.
  const resolveWho = (who: string): { id: string; label: string; via: string } | null => {
    const bare = who.startsWith('reviewer:') ? who.slice('reviewer:'.length) : who;
    const byId = reviewers.find((r) => r.id === bare);
    if (byId) return { id: byId.id, label: `${byId.displayName} (${byId.id})`, via: who === bare ? 'bare id' : 'reviewer: prefix' };
    const byActor = reviewers.find((r) => r.resolvesActor === who);
    if (byActor) return { id: byActor.id, label: `${byActor.displayName} (${byActor.id})`, via: `actor '${who}'` };
    return null;
  };

  const note = (who: string | null, where: string): void => {
    if (!who) return;
    const resolvesTo = resolveWho(who);
    const seen = everyValue.get(who) ?? { rows: 0, where: new Set<string>(), resolvesTo };
    seen.rows += 1; seen.where.add(where);
    everyValue.set(who, seen);
    if (resolvesTo !== null || who in DECLARED_NON_INDIVIDUAL) return;
    const e = unresolved.get(who) ?? { rows: 0, where: new Set<string>() };
    e.rows += 1; e.where.add(where);
    unresolved.set(who, e);
  };
  for (const it of items) { note(it.reviewedBy, 'Item.reviewedBy'); note(it.similarityClearedBy, 'Item.similarityClearedBy'); }
  for (const m of misconceptions) { note(m.approvedBy, 'Misconception.approvedBy'); }

  console.log(`  machine-set findings on items: ${machineFindings}`);
  console.log(`  ${wearing.length} wearing a reviewer's authority`);
  for (const w of wearing) console.error(`    x ${w}`);

  // The census first, so the denominator is visible before any verdict about part of it.
  console.log(`\n  EVERY distinct authority value: ${everyValue.size}`);
  for (const [who, e] of [...everyValue].sort((a, b) => b[1].rows - a[1].rows)) {
    const verdict = e.resolvesTo ? `-> ${e.resolvesTo.label} via ${e.resolvesTo.via}` : who in DECLARED_NON_INDIVIDUAL ? '-> DECLARED not an individual' : '-> RESOLVES TO NOBODY';
    console.log(`    ${String(e.rows).padStart(4)} ${who.padEnd(38)} ${verdict}`);
  }

  /**
   * ONE PERSON UNDER SEVERAL SHAPES IS ITS OWN FAULT. Every value below resolves correctly, so the
   * check above is silent on it — and a store that records the same reviewer five ways cannot be
   * queried for "what did she approve" by any single predicate. It is the conflation family again:
   * not a name that means nothing, a person who means several names.
   */
  const byPerson = new Map<string, string[]>();
  for (const [who, e] of everyValue) {
    if (!e.resolvesTo) continue;
    const list = byPerson.get(e.resolvesTo.label) ?? [];
    list.push(who);
    byPerson.set(e.resolvesTo.label, list);
  }
  const multiShaped = [...byPerson].filter(([, shapes]) => shapes.length > 1);
  if (multiShaped.length > 0) {
    console.log(`\n  ${multiShaped.length} PERSON(S) RECORDED UNDER MORE THAN ONE SHAPE:`);
    for (const [person, shapes] of multiShaped) {
      console.log(`    ! ${person} is written ${shapes.length} ways: ${shapes.sort().join(', ')}`);
    }
    console.log('    No single predicate answers "what did this person approve". Pick one shape per');
    console.log('    person and migrate the rest, or the question stays unanswerable by query.');
  }

  const total = [...unresolved.values()].reduce((a, e) => a + e.rows, 0);
  console.log(`\n  authority values resolving to NO Reviewer row: ${unresolved.size} distinct, ${total} row(s)`);
  for (const [who, e] of [...unresolved].sort((a, b) => b[1].rows - a[1].rows)) {
    console.log(`    ? ${who} — ${e.rows} row(s) via ${[...e.where].join(', ')}`);
  }
  if (unresolved.size > 0) {
    console.log('    Each names an authority and matches no reviewer. Either add the Reviewer row,');
    console.log('    or declare what it actually is in DECLARED_NON_INDIVIDUAL with a reason.');
    console.log('    NOTE: this now screens EVERY shape, not just `human:` — four shapes used to pass');
    console.log('    without inspection, which is why the distinct count can rise without anything');
    console.log('    in the store having changed.');
  }

  /**
   * THE THIRD SHAPE: A NAMED PERSON BOUND TO A SHARED CREDENTIAL (R116).
   *
   * The other two are a machine verdict wearing a person's name, and a person-shaped string that
   * resolves to nobody. This is neither: the Reviewer row is real, the person is real, and the
   * ACCOUNT is shared — so every holder of one login signs as one named individual. R94's
   * conflation with the direction reversed, and nothing above catches it because every row it
   * produces resolves correctly.
   *
   * Printed EVERY RUN and not once at set-up time, because a caveat that appeared in a single
   * console output on the day it was created is exactly the kind of warning that is true, recorded,
   * and unread at the moment it matters.
   */
  const shared = await prisma.reviewer.findMany({
    where: { staffEmail: { not: null }, heldUntil: null },
    select: { id: true, displayName: true, staffEmail: true },
  });
  const roleAccounts = shared.filter((r) => /^staff-[a-z]+@/.test(r.staffEmail ?? ''));
  if (roleAccounts.length) {
    console.log(`\n  ${roleAccounts.length} NAMED REVIEWER(S) BOUND TO A SHARED ROLE ACCOUNT:`);
    for (const r of roleAccounts) {
      console.log(`    ! ${r.displayName} (${r.id}) signs as ${r.staffEmail}`);
    }
    console.log('    ANYONE HOLDING THAT LOGIN SIGNS AS THAT PERSON. Correct for development and');
    console.log('    wrong for anything real: a named reviewer needs her own account before any');
    console.log('    door writes a signature outside dev. This is the 463-row conflation reversed —');
    console.log('    there a role string wore a person\'s shape; here a person wears a role\'s login.');
  }

  console.log('\n  THIS SCREENS THE STORE, NOT THE PROSE. The one instance we have — eight gate-set');
  console.log('  flags described as a reviewer\'s — was correct in every row and wrong in a ruling,');
  console.log('  a report and nearly a register entry. Nothing here can see that channel.');

  if (wearing.length > 0) {
    console.error('\nA computed verdict is carrying a person\'s name. Fix the row or the gate.');
    await prisma.$disconnect();
    process.exit(1);
  }
  await prisma.$disconnect();
}

void main();
