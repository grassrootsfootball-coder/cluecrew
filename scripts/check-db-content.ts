/**
 * THE DATABASE CONTENT GATE (David's ruling, 2026-08-02 — the priority one).
 *
 * The reading-age lint reads /content and the vocabulary scanner reads source
 * files. Neither has ever looked at a database row, so anything imported
 * straight into a table walked past both — which is exactly what the 180-card
 * vault import did. This sweep closes that route.
 *
 * The policy is deliberate, and it is not "fail on everything":
 *
 *   SERVING rows (a LIVE word, a LIVE item, an ACTIVE misconception's hint)
 *   are content a child can meet RIGHT NOW. A violation there is live and the
 *   sweep FAILS the build.
 *
 *   DRAFT rows are a queue of work. They cannot reach a child — the serving
 *   filters see to that — so failing CI on an authoring backlog would just
 *   train people to skip the gate. They are REPORTED, with counts, so the
 *   backlog is visible rather than silent.
 *
 * The door that actually stops bad content going live is the publish gate in
 * lib/actions, which calls the same shared rules. This sweep is the net under
 * it: if anything ever reached LIVE another way, CI says so.
 *
 * Run: pnpm check:db-content
 */
import {
  checkBannedVocabulary,
  checkChildFacingText,
  checkItemChildFacing,
  checkStoryWrapperCopy,
  checkWordCard,
  isBlocking,
  storyWrapperSchema,
  type ContentFailure,
} from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';
import { declareMayBeEmpty } from './lib/population';

interface Bucket {
  serving: ContentFailure[];
  draft: ContentFailure[];
  /**
   * Sense-dependent UK spelling ('practice' the noun, 'meter' the gas meter).
   * Only a person can tell which sense is meant, so these are reported
   * wherever they are and never fail the build — including on SERVING rows.
   */
  warn: ContentFailure[];
}
const failures: Bucket = { serving: [], draft: [], warn: [] };
const counted = { words: 0, items: 0, misconceptions: 0, cases: 0 };
/**
 * The pass line makes a claim about the SERVING subset, so that subset's SIZE has to
 * be visible too. The totals above do not stand in for it: a status rename or a
 * broken filter leaves them large while the serving population drops to zero, and
 * the gate would print "everything currently serving passes" having screened nothing.
 * That is the fail-open shape the import doors were fixed for (R57), one level up.
 */
const screened = { words: 0, items: 0, misconceptions: 0, cases: 0 };

function record(isServing: boolean, found: ContentFailure[]): void {
  for (const failure of found) {
    if (!isBlocking(failure)) failures.warn.push(failure);
    else (isServing ? failures.serving : failures.draft).push(failure);
  }
}


/**
 * THE CONTENT RULES THAT LIVE IN THE DATABASE, ASSERTED HERE SO THEY CANNOT BE DROPPED QUIETLY.
 *
 * Two rules are enforced by CHECK constraints rather than by application code, because each has
 * too many creation doors for a per-door rule to survive (R42/R57):
 *   word_live_needs_reviewer                  — a LIVE word needs a named reviewer.
 *   misconception_needs_description_and_hint  — a placeholder is not a proposal (annie, 2026-08-12).
 *
 * A constraint is invisible in the Prisma schema, so nothing else in CI would notice its removal:
 * a migration that drops one leaves every gate green while the rule silently stops existing. This
 * is the canary for that — it fails if the constraint is not on the table.
 */
const REQUIRED_CONSTRAINTS = [
  'word_live_needs_reviewer',
  'misconception_needs_description_and_hint',
];

async function assertConstraints(): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint WHERE contype = 'c'
  `;
  const present = new Set(rows.map((r) => r.conname));
  const missing = REQUIRED_CONSTRAINTS.filter((name) => !present.has(name));
  if (missing.length > 0) {
    console.error('DATABASE CONTENT CONSTRAINTS MISSING — a rule has been dropped:');
    for (const name of missing) console.error(`  ${name}`);
    console.error(
      'These are enforced in the database precisely because they have too many creation doors\n' +
        'to be enforced per-door. Without them the rule does not exist anywhere. Restore the\n' +
        'constraint in a migration; do not delete this check.',
    );
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`Database content constraints present: ${REQUIRED_CONSTRAINTS.join(', ')}.`);
}

async function main(): Promise<void> {
  await assertConstraints();
  // --- Word cards ---------------------------------------------------------
  for (const word of await prisma.word.findMany()) {
    counted.words += 1;
    const live = word.status === 'LIVE';
    if (live) screened.words += 1;
    record(live, checkWordCard(word));
  }

  // --- Items: stems and options, by role ----------------------------------
  const items = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } }, questionType: true } });
  for (const item of items) {
    counted.items += 1;
    /**
     * ENG-003 GATES BLOCKING-GRADE WHILE STILL DRAFT (Annie's ruling, 2026-08-19 — R209). The
     * cluster is packet-and-render ready and publication waits only on her reads, so its 34 rows
     * sat in the DRAFT backlog — 34 rows that had never been HELD to the child gate, visible in
     * the backlog totals and blocking nothing. A bank one signature from a child gates as if
     * serving, BEFORE the signature: this precedes any ENG-003 reachability regardless of it.
     */
    const prePublication = item.id.startsWith('ENG-003');
    const serving = item.status === 'LIVE' || prePublication;
    if (serving) screened.items += 1;
    // The ONE shared item gate (packages/core) — the same call the publish door
    // and the import gates make, so this sweep can never read a field a door
    // skips (the vr-06 stem.sentence leak).
    record(
      serving,
      checkItemChildFacing({ id: item.id, stem: item.stem, explanation: item.explanation, mechanic: item.questionType.mechanic, options: item.options }),
    );
  }

  // --- Misconception child hints ------------------------------------------
  for (const entry of await prisma.misconception.findMany()) {
    counted.misconceptions += 1;
    const active = entry.status === 'ACTIVE';
    if (active) screened.misconceptions += 1;
    record(
      active,
      // A misconception may carry tested tokens — vocabulary its hint is ABOUT
      // (isosceles/equilateral), exempt from the long-word ceiling on that hint.
      checkChildFacingText({ role: 'hint', label: `misconception:${entry.id} childHint`, text: entry.childHint, testedTokens: entry.testedTokens ?? [] }),
    );
  }

  // --- Case narrative intros (always serving once the Case exists) --------
  // …and the story skin beside them. `Case.storyWrapper` is `Json?`, so the DATABASE cannot hold
  // its shape: the zod schema was enforced at the seed door alone, and a second door — a CMS
  // route, an import script, a raw update — would have written anything at all and been believed.
  // That is R57 one level up, and the answer is the same: the shape is re-derived HERE, off the
  // row itself, so a door that forgets is caught by a gate reading the artefact rather than the
  // file it was supposed to come from.
  let wrappers = 0;
  for (const kase of await prisma.case.findMany()) {
    counted.cases += 1;
    const intro = (kase.narrativeIntro as { text?: string } | null)?.text;
    if (intro) {
      screened.cases += 1;
      record(true, checkChildFacingText({ role: 'narrative', label: `case:${kase.id} narrative`, text: intro }));
    }
    if (kase.storyWrapper === null || kase.storyWrapper === undefined) continue;
    wrappers += 1;
    const parsed = storyWrapperSchema.safeParse(kase.storyWrapper);
    if (!parsed.success) {
      // A malformed wrapper is SERVING content: it is attached to a case a child can open, and
      // the reader has no schema of its own to fall back on.
      for (const issue of parsed.error.issues) {
        failures.serving.push({
          where: `case:${kase.id} storyWrapper.${issue.path.join('.') || '(root)'}`,
          rule: 'placeholder-tag',
          detail: `${issue.message} — the row does not match storyWrapperSchema, so some door wrote it without the gate.`,
        });
      }
      continue;
    }
    record(true, checkStoryWrapperCopy(kase.id, parsed.data));
  }
  // R61: this population may legitimately be empty, and the reason is printed on every empty run
  // so "no wrappers authored yet" cannot quietly become "wrappers are checked".
  declareMayBeEmpty(
    'check:db-content (story wrappers)',
    'Case.storyWrapper rows',
    wrappers,
    'No case has been authored with a story skin yet (STORY BIBLE §4). The field shipped in phase 1 ' +
      'and its Case-mode consumer did not — a gap awaiting David\'s ruling, recorded in docs/pedagogy-decisions.md.',
  );

  // Staff-facing strings still obey the everywhere rules (L1/L2/L6): a claim
  // is a claim wherever it is written.
  for (const entry of await prisma.misconception.findMany({ where: { status: 'ACTIVE' } })) {
    record(true, checkBannedVocabulary(`misconception:${entry.id} description`, entry.description, 'everywhere'));
  }

  console.log(
    `Database content gate: ${counted.words} words · ${counted.items} items · ` +
      `${counted.misconceptions} misconceptions · ${counted.cases} cases read.`,
  );
  console.log(
    `  of those, SERVING: ${screened.words} LIVE words · ${screened.items} LIVE items · ` +
      `${screened.misconceptions} ACTIVE misconceptions · ${screened.cases} case narratives.`,
  );

  if (failures.warn.length > 0) {
    const rows = new Set(failures.warn.map((failure) => failure.where.split(' ')[0]));
    console.log(
      `\nUK spelling to check by hand (not blocking): ${failures.warn.length} across ${rows.size} row(s)`,
    );
    for (const failure of failures.warn.slice(0, 10)) console.log(`  · ${failure.where}: ${failure.detail}`);
    if (failures.warn.length > 10) console.log(`  … and ${failures.warn.length - 10} more`);
  }

  if (failures.draft.length > 0) {
    const byRule = failures.draft.reduce<Record<string, number>>((acc, failure) => {
      acc[failure.rule] = (acc[failure.rule] ?? 0) + 1;
      return acc;
    }, {});
    const rows = new Set(failures.draft.map((failure) => failure.where.split(' ')[0]));
    console.log(
      `\nDRAFT backlog (not serving, not blocking): ${failures.draft.length} issue(s) across ${rows.size} row(s) — ` +
        Object.entries(byRule).map(([rule, count]) => `${rule}: ${count}`).join(', '),
    );
    for (const failure of failures.draft.slice(0, 10)) {
      console.log(`  · ${failure.where}: ${failure.detail}`);
    }
    if (failures.draft.length > 10) console.log(`  … and ${failures.draft.length - 10} more`);
  }

  if (failures.serving.length > 0) {
    console.error(`\nSERVING content FAILED the gate (${failures.serving.length}):`);
    for (const failure of failures.serving) console.error(`  ✗ ${failure.where}: ${failure.detail}`);
    console.error('\nThis content can reach a child now. Fix it or take it out of service.');
    await prisma.$disconnect();
    process.exit(1);
  }

  const servingTotal =
    screened.words + screened.items + screened.misconceptions + screened.cases;
  console.log(
    `\nAll ${servingTotal} serving row(s) pass the child-facing gates.` +
      (servingTotal === 0
        ? ' NOTHING IS SERVING — this gate screened no live content, so it has asserted nothing.'
        : ''),
  );
  await prisma.$disconnect();
}

void main();
