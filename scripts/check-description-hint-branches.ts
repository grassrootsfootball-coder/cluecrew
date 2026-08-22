/**
 * THE DESCRIPTION NAMES TWO BRANCHES AND THE HINT COVERS ONE (Annie, 2026-08-22 — R580).
 *
 * **Two fields in one row, disagreeing, and nothing was comparing them.**
 *
 *     en-attribute-transfer
 *       description: "Assigns one character's described attribute to another, OR THE RIGHT
 *                     ATTRIBUTE AT THE WRONG VALUE."
 *       childHint  : "Two people are being described. Check which one each detail belongs to."
 *
 * **The second branch needs no second person at all.** The hint addresses one half of its own
 * entry's definition, and that is established from the two fields without reading a single carrier.
 *
 * **THIS IS NOT THE WIDENED-WITHOUT-HINT CHECK, AND THE DIFFERENCE MATTERS.** Nothing was widened
 * here. There was no moment when the description grew and the hint failed to follow — **the
 * description was always broader than its hint**, from the day both were written. A change-detector
 * cannot see a disagreement that was never a change, which is why 274 entries could be audited for
 * drift and this sit inside one of them untouched.
 *
 * **THE BOUND.** Findable where a description states a DISJUNCTION — two branches joined by *or*,
 * each substantial enough to be its own case. Unfindable where a description states one thing
 * loosely, or where the branches are a single case worded twice (*"one letter short or long"*).
 * Every row carries the branch words it matched on and the branch words it did not (R569), so a
 * disagreement costs one look.
 *
 * Every row is a CANDIDATE. Whether a hint must cover both branches is her judgement (R94).
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const STOP = new Set(
  ('a an the and or but of in on at to for from with is are was were be been being it its this that these'
  + ' those what which who whom how why when where do does did not no so as if then than you your he she'
  + ' they them his her their there here one two more most just also very can could would should will'
  + ' about into out up down over under again still had has have chooses choose picks pick child').split(' '),
);
const contentWords = (s: string) => [...new Set(
  s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)),
)];

/**
 * **A DISJUNCTION, NOT EVERY `or`.** *"Grouped by look or sound"* is one case worded twice; the
 * branches must each stand as a case, which is what the length floor tests. A comma before `or`
 * is her form for the real thing and is accepted at a lower floor.
 */
function branches(description: string): string[] | null {
  /**
   * **COMMA-OR ONLY, WITHIN ONE SENTENCE — and the bare-`or` version is recorded as refused.**
   * Allowing any ` or ` raised recall and destroyed the thing the count is for. It split
   * *"the spelling or punctuation error"* — one noun phrase — and it split ACROSS SENTENCES, so
   * `en-article-definiteness` reported its trailing *"Distinct from en-a-an-by-spelling"* note as an
   * unaddressed branch. Two of three English findings were the splitter, not the entry.
   *
   * `, or ` is her form for a real second case, and `en-attribute-transfer` uses it. A tight
   * findable population with its size printed beats a loose one that needs a reader to sort.
   */
  const firstSentence = description.split(/(?<=[.!?])\s+/)[0] ?? description;
  const commaOr = firstSentence.split(/,\s+or\s+/i);
  if (commaOr.length >= 2 && commaOr.every((b) => contentWords(b).length >= 2)) return commaOr;
  return null;
}

async function main() {
  const lib = await prisma.misconception.findMany({ select: { id: true, childHint: true, description: true } });
  const withBoth = lib.filter((m) => String(m.description ?? '').trim() && String(m.childHint ?? '').trim());
  const disjunctive = withBoth.filter((m) => branches(String(m.description)) !== null);

  requirePopulation('check:description-hint-branches', {
    'entr(ies) with both a description and a hint': withBoth.length,
    'of those, description states a DISJUNCTION — THE POPULATION': disjunctive.length,
  });

  const findings: string[] = [];
  for (const m of disjunctive.sort((a, b) => a.id.localeCompare(b.id))) {
    const hint = String(m.childHint);
    const hw = contentWords(hint);
    const bs = (branches(String(m.description)) as string[]).map((b) => {
      const bw = contentWords(b);
      return { text: b.trim(), words: bw, covered: bw.filter((w) => hw.includes(w)) };
    });
    const addressed = bs.filter((b) => b.covered.length > 0);
    const unaddressed = bs.filter((b) => b.covered.length === 0);
    // Every branch uncovered is a hint phrased in words the description never uses — common, and
    // not this fault. The fault is ONE branch reached and another left.
    if (addressed.length === 0 || unaddressed.length === 0) continue;

    findings.push(
      `  BRANCH LEFT  ${m.id}\n      hint       : ${hint}\n      description: ${m.description}`
      + bs.map((b) => `\n      ${b.covered.length ? 'ADDRESSED ' : 'NOT REACHED'}: "${b.text}"`
        + `\n            ${b.covered.length ? `hint shares: ${b.covered.join(', ')}` : `hint shares none of: ${b.words.join(', ')}`}`).join(''),
    );
  }

  console.log(`\n${findings.length} CANDIDATE(S) — each a row worth her reading, never a verdict.\n`);
  for (const f of findings) console.log(`${f}\n`);
  console.log(
    '  THE BOUND, AS A COUNT:\n'
    + `      ${disjunctive.length} of ${withBoth.length} description(s) state a disjunction — FINDABLE, and the population.\n`
    + `      ${withBoth.length - disjunctive.length} state one case, or state a single case worded twice — UNFINDABLE. There\n`
    + '                                        is no second branch to test the hint against.\n'
    + '\n  NOT A DRIFT CHECK. Nothing here was widened. These descriptions were broader than their\n'
    + '  hints from the day both were written, and a change-detector cannot see a disagreement that\n'
    + '  was never a change.',
  );
  await prisma.$disconnect();
}

void main();
