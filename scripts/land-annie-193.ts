/**
 * HER 193rd: D JOINS C ON A RULING, NOT ON A COMPUTATION — AND THE ARTEFACT SAYS SO.
 *
 * **On this fraction the two rival rules are arithmetically indistinguishable.** 15 × 4 = 60 (the
 * bottom used alone) and 15 ÷ (1/4) = 60 (the complement, which on a fraction of the form
 * (b−1)/b equals the unit fraction by coincidence). Arithmetic cannot separate them, so **the join
 * does not land on determination (R885) and must not be recorded as though it did.**
 *
 * It lands on her ruling, on three grounds outside the arithmetic, in her words:
 *   - the item's own architecture pairs C and D as one act in two halves;
 *   - the complement is not an act this stem invites — no remainder is in view;
 *   - *uses the complement* describes the VALUE 1/4, not a route a child took to it.
 *
 * **THE INDISCRIMINABILITY IS STATED, NEVER SMOOTHED.** Her sentence: *that is a weaker sentence
 * than a computed join and it is the true one.* A join recorded without that qualifier reads
 * identically to the six that computed, and the reader has no way back to the difference — which is
 * R203, where the fact is doubt and the doubt must travel with the value.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkChildFacingText } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { carrierWorking } from './lib/crossed-carrier-working';
import { determines } from './lib/determination';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const RETURN = '/Users/davidb/Downloads/annie-193-for-code.md';
const RETURN_SHA = '1c3de71c5e1ce1fec8a9b39c2bdcff085ce884cc712eedc284c1840eab3aaa75';

const ENTRY = 'fraction-part-used-alone';
const REPLACED = 'Only one part of the fraction was used. Dividing by a fraction needs both parts.';
const AUTHORED = 'The dividing was not done by the fraction in the question. Use the whole fraction, top and bottom.';

async function run() {
  const bytes = readFileSync(RETURN, 'utf8');
  if (sha(bytes) !== RETURN_SHA) throw new Error(`the return does not hash to ${RETURN_SHA} — refusing`);

  assertFixture('indiscriminability', [
    { name: 'the two rival rules coincide on 3/4 — arithmetic cannot separate them', input: '3/4', mustBeCaught: true },
    { name: 'on 2/5 they part company, which is the discriminating item she asks for', input: '2/5', mustBeCaught: false },
  ], (f) => {
    const [n, d] = f.split('/').map(Number);
    const bottomAlone = 15 * d;                 // the rule her entry names
    const complement = 15 / (1 - n / d);        // the rival reading
    return Math.abs(bottomAlone - complement) < 1e-9;
  });

  const row = await prisma.item.findUniqueOrThrow({ where: { id: 'MC01-FDP-08' }, select: { id: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true } } } });
  const D = row.options.find((o) => (o.content as { label?: string }).label === 'D');
  const C = row.options.find((o) => (o.content as { label?: string }).label === 'C');
  if (!D || !C) throw new Error('MC01-FDP-08 has no option D or C — refusing a shape I cannot parse (R173)');
  requirePopulation('land:annie-193', { 'join(s) to land on a ruling': 1, 'hint amendment(s)': 1 });

  const refusals: string[] = [];
  if (D.isCorrect) refusals.push('option D is the KEY');
  if (D.misconceptionId) refusals.push(`option D already carries ${D.misconceptionId}`);
  if (C.misconceptionId !== ENTRY) refusals.push(`option C carries ${C.misconceptionId ?? 'nothing'}, not ${ENTRY} — "beside C" names a sibling that is not there`);

  // The computation is run and REPORTED, precisely so the record shows it did not decide.
  const own = carrierWorking('MC01-FDP-08', 'D');
  const stemText = String((row.stem as { text?: unknown })?.text ?? '');
  const det = determines(own.verbatim ?? '', String((D.content as { value: unknown }).value), stemText);

  // The amendment: gated before it lands, and asserted against the text it replaces.
  const live = await prisma.misconception.findUniqueOrThrow({ where: { id: ENTRY }, select: { childHint: true } });
  if (live.childHint !== REPLACED) refusals.push(`the entry's childHint is not the text her amendment replaces — live ${JSON.stringify(live.childHint)}`);
  const gate = checkChildFacingText({ role: 'hint', label: `${ENTRY}.childHint`, text: AUTHORED });
  if (gate.length > 0) refusals.push(`her authored hint fails the child-facing gate: ${gate.map((f) => f.message).join(' | ')}`);

  if (refusals.length === 0 && APPLY) {
    await prisma.$transaction(async (tx) => {
      await tx.itemOption.update({ where: { id: D.id }, data: { misconceptionId: ENTRY } });
      await tx.attributionEvent.create({ data: {
        recordType: 'item', recordId: row.id, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie',
        recordedBy: 'human:david', field: 'options[].misconceptionId', returnArtefact: RETURN_SHA,
        method: 'LANDED ON A RULING, NOT ON A COMPUTATION. Her 193rd: on this fraction the rival rules are arithmetically indistinguishable, so D joins C beside it on DESIGN and ACT-PLAUSIBILITY — the item pairs C and D as one act in two halves, the stem invites no complement, and "uses the complement" describes the value 1/4 rather than a route to it.',
        note: `the indiscriminability is on the record, not smoothed: 15 x 4 = 60 and 15 / (1 - 3/4) = 60 coincide on 3/4. This join is weaker than the six that computed and the artefact says which. Her words: "that is a weaker sentence than a computed join and it is the true one."`,
      } });
      await tx.misconception.update({ where: { id: ENTRY }, data: {
        childHint: AUTHORED,
        textProvenance: {
          state: 'RECORDED', date: '2026-08-29', text: 'childHint',
          authority: `annie-193-for-code.md, sha256 ${RETURN_SHA}`,
          approvedBy: { kind: 'person', name: 'Annie' },
          authoredBy: { kind: 'person', name: 'Annie' },
          method: 'authored verbatim in her 193rd amendment block; asserted against the text it replaces before writing',
          previous: { childHint: REPLACED },
          why: 'the replaced wording ASSERTS the mechanism — only one part was used — and if a complement child exists that sentence lies to her. This wording survives a mistag (the WIW-19 rule) at no cost to the flip-slip child, and still names the fault rather than the key.',
          servingSha256: sha(AUTHORED),
        },
      } });
      await tx.attributionEvent.create({ data: {
        recordType: 'misconception', recordId: ENTRY, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie',
        recordedBy: 'human:david', field: 'childHint', returnArtefact: RETURN_SHA, subjectHash: sha(AUTHORED),
        method: 'her 193rd, authored verbatim; the replaced text was asserted against the live row before the write',
        note: 'a wording that survives a mistag — the hint must not lie to a child the taxonomy has not yet been tested against',
      } });
    });
  }

  const full = {
    kind: 'annie-193-landing', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    return: 'annie-193-for-code.md', returnSha256: RETURN_SHA,
    returnSha256Spec: 'sha256 over the return file bytes exactly as delivered, unparsed',
    outcome: refusals.length ? 'REFUSED' : (APPLY ? 'LANDED' : 'WOULD LAND'), refusals,

    THE_JOIN: {
      carrier: 'MC01-FDP-08 option D, value 60', entry: ENTRY, beside: 'option C, value 5, on the same entry',
      LANDED_ON: 'HER RULING — design and act-plausibility',
      NOT_LANDED_ON_COMPUTATION: true,
      andWHYNOT: 'on this fraction the two rival rules are arithmetically INDISTINGUISHABLE. 15 x 4 = 60 (the bottom used alone) and 15 / (1 - 3/4) = 60 (the complement) are the same number, because on a fraction of the form (b-1)/b the complement equals the unit fraction by coincidence.',
      whatTheComputationSAYS: det.detail,
      andWHYTHATDOESNOTDECIDE: 'it verifies equally well for the rule she refused. A determination test separates an act from the alternatives; here there are none to separate, so the check that would normally decide is silent and saying otherwise would be a false record (R885).',
      HER_THREE_GROUNDS: [
        'the item\'s own architecture pairs C and D as one act in two halves: 15 divided by the top alone gives C, 15 times the bottom alone gives D, and a drafter who built both seats built them as siblings',
        'the complement is not an act this stem invites — complements arise where a remainder is in view and bags-from-rice has none',
        '"uses the complement" reads as a description of the VALUE 1/4, not of a route a child took to it — the letter-count class; the flagNote described the coincidence, the authoredValue described the act',
      ],
      THE_QUALIFIER_TRAVELS_WITH_IT: 'her words — "that is a weaker sentence than a computed join and it is the true one". A join recorded without this reads identically to the six that computed (R203).',
    },

    THE_HINT_AMENDMENT: {
      target: `library:${ENTRY}:childHint`, replaced: REPLACED, authored: AUTHORED,
      assertedBeforeWriting: 'the live childHint was compared against her `replaced` text and matched byte for byte',
      childFacingGate: gate.length === 0 ? 'PASSES' : gate.map((f) => f.message),
      why: 'the replaced wording ASSERTS the mechanism and would lie to a complement child if one exists. R586 — a hint that asserts a feature must be true of every carrier, and this taxonomy has never been tested against its rival.',
    },

    STILL_OPEN_AND_NOT_THIS_STORE_S: {
      question: 'whether fraction-part-used-alone retires into maths-75 under the maths-88 precedent',
      whatSheAskedFor: 'maths-75 whole, behaviour and childHint, as bytes',
      crossedSeparately: 'yes — the store holds it and it crosses unaltered',
      andWHATTHEBYTESSHOW: 'maths-75\'s description names BOTH parts and cites this very item: "15 divided by 3/4 = 5 where the answer is 20, using only the denominator". That is option C\'s value. The reading is hers; this store states the bytes and stops.',
    },
  };
  const lines = [`join\tMC01-FDP-08 D\t${full.outcome}\tON A RULING`, `hint\t${ENTRY}\t${full.outcome}`];
  const d = digestOverText('the result lines joined by \\n', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['THE_JOIN', 'THE_HINT_AMENDMENT', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'annie-193-landing' : 'annie-193-landing-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n  ${full.outcome}${refusals.length ? ': ' + refusals.join('; ') : ''}`);
  console.log(`  the computation says: ${det.detail}`);
  console.log(`  and it does not decide — it verifies equally well for the rule she refused.`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
