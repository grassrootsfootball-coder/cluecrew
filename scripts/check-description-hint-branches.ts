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
import { branches, contentWords } from './lib/description-branches';
import { requirePopulation } from './lib/population';

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

  /**
   * **ONE-SIDED, ON HER RULING (R584). A CONTRADICTION IS EVIDENCE; AN AGREEMENT IS EVIDENCE OF
   * NOTHING**, because both fields can be stale together — which is exactly what the unlanded-
   * amendment scope correction showed: a description and a hint can sit in perfect accord and both
   * be wrong, and nothing in their agreement says otherwise.
   *
   * So a passing row is NOT a checked row, and this says so where a reader will meet it, rather than
   * leaving seventy silent rows to be counted as seventy clean ones.
   */
  console.log(`\n${findings.length} CANDIDATE(S) — each a row worth her reading, never a verdict.\n`);
  for (const f of findings) console.log(`${f}\n`);
  if (findings.length === 0) {
    console.log(
      '  A CLEAN RUN HERE MEANS NOTHING. This check is ONE-SIDED: a contradiction between the two\n'
      + '  fields is evidence, and their agreement is evidence of nothing, because BOTH CAN BE STALE\n'
      + '  TOGETHER. Zero findings says no description was caught contradicting its own hint. It does\n'
      + '  NOT say the hints fit, and it must never be reported as rows checked.\n',
    );
  }
  console.log(
    '  ONE-SIDED: the rows NOT listed above are not passing rows. A description and its hint can\n'
    + '  agree perfectly and both be wrong, so agreement is not evidence and is never coverage.\n'
    + '\n  THE BOUND, AS A COUNT:\n'
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
