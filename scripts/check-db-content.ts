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
  checkWordCard,
  isBlocking,
  type ContentFailure,
} from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

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

function record(isServing: boolean, found: ContentFailure[]): void {
  for (const failure of found) {
    if (!isBlocking(failure)) failures.warn.push(failure);
    else (isServing ? failures.serving : failures.draft).push(failure);
  }
}


async function main(): Promise<void> {
  // --- Word cards ---------------------------------------------------------
  for (const word of await prisma.word.findMany()) {
    counted.words += 1;
    record(word.status === 'LIVE', checkWordCard(word));
  }

  // --- Items: stems and options, by role ----------------------------------
  const items = await prisma.item.findMany({ include: { options: true, questionType: true } });
  for (const item of items) {
    counted.items += 1;
    const serving = item.status === 'LIVE';
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
    record(
      entry.status === 'ACTIVE',
      // A misconception may carry tested tokens — vocabulary its hint is ABOUT
      // (isosceles/equilateral), exempt from the long-word ceiling on that hint.
      checkChildFacingText({ role: 'hint', label: `misconception:${entry.id} childHint`, text: entry.childHint, testedTokens: entry.testedTokens ?? [] }),
    );
  }

  // --- Case narrative intros (always serving once the Case exists) --------
  for (const kase of await prisma.case.findMany()) {
    counted.cases += 1;
    const intro = (kase.narrativeIntro as { text?: string } | null)?.text;
    if (!intro) continue;
    record(true, checkChildFacingText({ role: 'narrative', label: `case:${kase.id} narrative`, text: intro }));
  }

  // Staff-facing strings still obey the everywhere rules (L1/L2/L6): a claim
  // is a claim wherever it is written.
  for (const entry of await prisma.misconception.findMany({ where: { status: 'ACTIVE' } })) {
    record(true, checkBannedVocabulary(`misconception:${entry.id} description`, entry.description, 'everywhere'));
  }

  console.log(
    `Database content gate: ${counted.words} words · ${counted.items} items · ` +
      `${counted.misconceptions} misconceptions · ${counted.cases} cases screened.`,
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

  console.log('\nEverything currently serving passes the child-facing gates.');
  await prisma.$disconnect();
}

void main();
