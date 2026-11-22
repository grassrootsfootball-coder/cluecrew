/**
 * vr18-partial-rule CROSSES WITH BOTH DERIVATIONS AND NO VERDICT FROM EITHER STORE (her 201st).
 *
 * **A check cannot condemn on the property the checked thing is supposed to have.** The refusal
 * evidence in every other pattern is UNIFORMITY — and partial-rule's genuine products are uniform,
 * because applying half a rule everywhere is exactly what the misconception IS. The instrument's
 * fingerprint and the entry's mechanism are the same property, so computation cannot separate them.
 *
 * So this artefact computes BOTH accounts on every row and states neither as the answer:
 *   - THE STATED HALF-RULE: performing the rule on only one of the two outer numbers.
 *   - KEY-PLUS-NOISE: the key with a constant added.
 * **The reading is hers, and stating both in advance makes it a check rather than a hunt.**
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const parseSum = (s: string) => {
  const m = s.match(/\((\d+) \[(\d+)\] (\d+)\)\s+\((\d+) \[\?\] (\d+)\)/);
  return m ? { a1: +m[1]!, mid1: +m[2]!, c1: +m[3]!, a2: +m[4]!, c2: +m[5]! } : null;
};

async function run() {
  assertFixture('vr18-parse', [
    { name: 'a well-formed sum parses to five numbers', input: '(2 [5] 3)    (4 [?] 2)', mustBeCaught: true },
    { name: 'a sum with no question mark does not parse', input: '(2 [5] 3)    (4 [6] 2)', mustBeCaught: false },
    { name: 'prose does not parse', input: 'the middle number is made from the outer numbers', mustBeCaught: false },
  ], (s) => parseSum(s) !== null);

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-18-related-numbers', status: 'DRAFT' },
    select: { id: true, difficultyTier: true, stem: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } },
    orderBy: { id: 'asc' } });
  const entry = await prisma.misconception.findUniqueOrThrow({ where: { id: 'vr18-partial-rule' },
    select: { id: true, description: true, childHint: true, approvedBy: true } });
  requirePopulation('cross:vr18-derivations', { 'row(s)': rows.length });

  const analysed = rows.map((r) => {
    const p = parseSum(String((r.stem as { sum: string }).sum));
    const key = Number((r.options.find((o) => o.isCorrect)!.content as { value: unknown }).value);
    const carrier = r.options.find((o) => o.misconceptionId === 'vr18-partial-rule');
    const value = carrier ? Number((carrier.content as { value: unknown }).value) : null;
    if (!p || value === null) return { itemId: r.id, unparsed: true };
    const isMultiply = p.mid1 === p.a1 * p.c1;
    const rule = (a: number, c: number) => (isMultiply ? a * c : a + c);
    return {
      itemId: r.id, tier: r.difficultyTier, sum: (r.stem as { sum: string }).sum,
      theRule: isMultiply ? `a x c (${p.a1} x ${p.c1} = ${p.mid1})` : `a + c (${p.a1} + ${p.c1} = ${p.mid1})`,
      outerNumbers: [p.a2, p.c2], key, THE_CARRIERS_VALUE: value,
      DERIVATION_ONE_THE_STATED_HALF_RULE: {
        what: 'the rule performed on only ONE of the two outer numbers',
        usingFirstOuterAlone: p.a2, usingSecondOuterAlone: p.c2,
        andCARRYINGTHEPREVIOUSPAIRSOTHEROUTER: { withFirst: rule(p.a2, p.c1), withSecond: rule(p.a1, p.c2) },
        anyOfTheseEqualTheCarrier: [p.a2, p.c2, rule(p.a2, p.c1), rule(p.a1, p.c2)].includes(value),
      },
      DERIVATION_TWO_KEY_PLUS_NOISE: {
        what: 'the key with a constant added',
        keyPlusOne: key + 1, keyPlusTwo: key + 2, keyPlusThree: key + 3,
        equalsTheCarrier: value === key + 1 ? 'key + 1' : value === key + 2 ? 'key + 2' : value === key + 3 ? 'key + 3' : null,
      },
    };
  });

  const full = {
    kind: 'vr18-partial-rule-both-derivations',
    TO: 'Annie. No verdict from either store.',
    WHY_THIS_IS_NOT_DECIDED_BY_THE_INSTRUMENT: 'the refusal evidence in every other pattern is uniformity, and partial-rule\'s genuine products are uniform, because applying half a rule everywhere is what the misconception is. The test\'s fingerprint and the entry\'s mechanism are the same property — a check cannot condemn on the property the checked thing is supposed to have (her 201st).',
    THE_ENTRY: entry,
    THE_DECIDING_QUESTION_STATED_IN_ADVANCE: 'if performing the stated half of the rule on each item determines each option\'s value, the pattern performs and rejoins the two. If the values fall out only of key-plus-noise, it refuses like the thirteen.',
    THE_GENERATORS_ACCOUNT: {
      source: 'packages/db/prisma/generate-content.ts, function relatedNumbers',
      theCarrierIsWrittenAs: 'rule(a2, c2) + 1',
      andTHESIBLINGISWRITTENAS: 'otherRule — the wrong-operation slip, which is vr18-rule-swap',
      whatThisStoreDoesNOTSay: 'what that means for the entry. The line is quoted because you asked for the store\'s account of what the generator actually did; the reading of it is yours.',
    },
    rows: analysed,
    SUMMARY_OF_BOTH_DERIVATIONS_ACROSS_THE_ROWS: {
      carrierMatchesTheStatedHalfRule: analysed.filter((a) => !a.unparsed && a.DERIVATION_ONE_THE_STATED_HALF_RULE!.anyOfTheseEqualTheCarrier).length,
      carrierMatchesKeyPlusAConstant: analysed.filter((a) => !a.unparsed && a.DERIVATION_TWO_KEY_PLUS_NOISE!.equalsTheCarrier !== null).length,
      of: analysed.filter((a) => !a.unparsed).length,
      andNOVERDICT: 'both figures are stated. Which one settles the pattern is the reading, and it is yours.',
    },
  };
  const lines = analysed.filter((a) => !a.unparsed).map((a) => `${a.itemId}\t${a.THE_CARRIERS_VALUE}\thalf-rule:${a.DERIVATION_ONE_THE_STATED_HALF_RULE!.anyOfTheseEqualTheCarrier}\tkey-plus:${a.DERIVATION_TWO_KEY_PLUS_NOISE!.equalsTheCarrier ?? 'no'}`);
  const d = digestOverText('one line per row, "<itemId>\\t<carrier>\\thalf-rule:<bool>\\tkey-plus:<which>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['rows', 'SUMMARY_OF_BOTH_DERIVATIONS_ACROSS_THE_ROWS', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('vr18-partial-rule-both-derivations', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'vr18-partial-rule-both-derivations');
  const s = full.SUMMARY_OF_BOTH_DERIVATIONS_ACROSS_THE_ROWS;
  console.log(`\n  ${s.of} rows · carrier matches the stated half-rule on ${s.carrierMatchesTheStatedHalfRule} · matches key-plus-a-constant on ${s.carrierMatchesKeyPlusAConstant} · NO VERDICT`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
