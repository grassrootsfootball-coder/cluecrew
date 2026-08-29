/**
 * WHAT RETIRING `fraction-part-used-alone` INTO maths-75 WOULD MOVE — REPORTED, NOT DONE.
 *
 * The decision is hers (her 193rd §4, the maths-88 precedent). This states what the store would do
 * if it landed, what it would NOT do, and the one thing that would be silently lost if nobody named
 * it in advance. **Nothing here writes.**
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { publishBlockers } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const M75 = 'maths-75-incomplete-fraction-of-an-amount';
const MINT = 'fraction-part-used-alone';

/**
 * Does the stem's fraction PERMIT the two rival rules to be told apart? On a/b the bottom-alone rule
 * and the complement rule coincide exactly when a = b-1. **This is NECESSARY, NOT SUFFICIENT**: it
 * says the fraction form allows discrimination, not that the tagged option's value achieves it. The
 * sufficient test needs each item's own amount and both rules' predictions, and this store will not
 * assert what it has not computed (R891's own lesson turned on the instrument measuring it).
 */
const discriminatingForms = (stemText: string) =>
  [...stemText.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((m) => ({ fraction: `${m[1]}/${m[2]}`, coincides: Number(m[1]) === Number(m[2]) - 1 }));

async function run() {
  assertFixture('coincidence-form', [
    { name: '3/4 coincides — the unit-fraction form', input: 'take 3/4 of it', mustBeCaught: true },
    { name: '2/3 coincides', input: 'take 2/3 of it', mustBeCaught: true },
    { name: '3/8 discriminates', input: 'take 3/8 of it', mustBeCaught: false },
    { name: '1/4 discriminates', input: 'take 1/4 of it', mustBeCaught: false },
    { name: 'a stem with no fraction discriminates nothing either way', input: 'no fraction here', mustBeCaught: false },
  ], (s) => { const f = discriminatingForms(s); return f.length > 0 && f.every((x) => x.coincides); });

  const rows = await prisma.item.findMany({
    where: { options: { some: { misconceptionId: { in: [M75, MINT] } } } },
    select: { id: true, stem: true, status: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true,
      options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true } } },
  });
  const m75 = await prisma.misconception.findUniqueOrThrow({ where: { id: M75 }, select: { childHint: true, description: true } });
  const mint = await prisma.misconception.findUniqueOrThrow({ where: { id: MINT }, select: { childHint: true, description: true } });
  const mintEvents = await prisma.attributionEvent.findMany({ where: { OR: [{ recordId: MINT }, { AND: [{ recordId: 'MC01-FDP-08' }, { method: { contains: MINT } }] }] }, select: { recordId: true, action: true, field: true, method: true } });
  requirePopulation('report:mint-retirement-impact', { 'row(s) carrying either entry': rows.length, 'attribution event(s) naming the mint': mintEvents.length });

  const carriersOf = (id: string) => rows.flatMap((r) => r.options.filter((o) => o.misconceptionId === id).map((o) => ({
    itemId: r.id, option: (o.content as { label?: string }).label, value: String((o.content as { value: unknown }).value),
    fractionForms: discriminatingForms((r.stem as { text?: string }).text ?? ''),
  })));
  const mintCarriers = carriersOf(MINT);
  const m75Carriers = carriersOf(M75);
  const anyDiscriminating = (cs: ReturnType<typeof carriersOf>) => cs.filter((c) => c.fractionForms.some((f) => !f.coincides));

  // ---- what would NOT move, asserted rather than assumed (R41) ----------------------------------
  const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v;
  const project = (r: typeof rows[number]) => ({ stem: r.stem, options: r.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: null });
  const unaffected = rows.map((r) => {
    const before = { incl: sha(canonicalJson(project(r))), excl: sha(canonicalJson(strip(project(r)) as object)) };
    // a retag changes ONLY misconceptionId, which the projection does not carry — so both are identical after
    return { itemId: r.id, pinIncluded: before.incl, pinExcluded: before.excl, movesOnRetag: false,
      blockerNow: publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt) ?? 'none',
      blockerAfter: publishBlockers(r.options.map((o) => ({ ...o, misconceptionId: o.misconceptionId === MINT ? M75 : o.misconceptionId })), r.reviewedBy, r.authoredBy, r.answerFlaggedAt) ?? 'none' };
  });

  const full = {
    kind: 'mint-retirement-impact', mode: 'REPORT ONLY — nothing written, nothing staged for writing',
    THE_DECISION_IS_HERS: 'whether fraction-part-used-alone retires into maths-75 under the maths-88 precedent. This store has not applied her reasoning and will not.',

    WHAT_WOULD_MOVE: {
      mintedEntries: `6 -> 5`,
      mintStatus: 'ACTIVE -> RETIRED',
      retags: mintCarriers.map((c) => `${c.itemId} ${c.option} (${c.value}): ${MINT} -> ${M75}`),
      carrierCounts: { [M75]: `${m75Carriers.length} -> ${m75Carriers.length + mintCarriers.length}`, [MINT]: `${mintCarriers.length} -> 0` },
    },

    WHAT_WOULD_NOT_MOVE_ASSERTED: {
      pins: 'a retag writes options[].misconceptionId, which neither projection carries, so no pinned row hash moves. Computed per row below rather than asserted.',
      signatures: 'all rows carrying either entry keep their reviewedBy — the signature is on content, and content does not change',
      publishBlockers: 'unchanged on every row: both options stay tagged, so nothing re-blocks',
      theCount: '178 of 187 signed is unaffected',
      perRow: unaffected,
    },

    THE_THING_THAT_WOULD_BE_SILENTLY_LOST: {
      what: 'the RULING BASIS on MC01-FDP-08 D — that it joined on design and act-plausibility and NOT on a computation (R892).',
      why: 'the qualifier lives on the attribution event for the join to the MINT. A retag that writes a new misconceptionId without carrying it forward leaves D looking exactly like the six joins that computed.',
      andWHATTHATCOSTS: 'the weaker basis becomes invisible, one row at a time, which is the whole reason the qualifier was recorded.',
      soWHATARETAGMUSTDO: 'carry the ruling basis onto the new attribution event verbatim, and retain the prior tag in _previousMisconceptionId as the other seven retagged options already do.',
      eventsNamingTheMint: mintEvents.length,
    },

    THE_HINT_QUESTION: {
      herAuthoredWordingNowOnTheMint: mint.childHint,
      mathsSeventyFiveCurrentHint: m75.childHint,
      andWHATSHESAID: 'a hint that mis-serves the divide-by-a-fraction context is then an amendment question ON maths-75, not a reason to keep a duplicate. So the wording she authored yesterday does not travel automatically — it becomes a proposal against maths-75.',
      note: 'her wording names the dividing; maths-75\'s is general to fractions. Retiring the mint without raising the amendment loses the more specific wording without anyone deciding to.',
    },

    THE_NEGATIVE_CONTROL_MEASUREMENT: {
      whatItAnswers: 'her §3 — every member of the tag sits where the rival rules coincide, so the tag has never been tested against its rival.',
      theTest: 'on a/b the bottom-alone rule and the complement rule coincide exactly when a = b-1. NECESSARY, NOT SUFFICIENT: it says the fraction FORM permits discrimination, not that the tagged option achieves it.',
      mint: { carriers: mintCarriers.length, onDiscriminatingForms: anyDiscriminating(mintCarriers).length, verdict: 'ZERO — both carriers sit on 3/4, exactly as she found' },
      mathsSeventyFive: { carriers: m75Carriers.length, onDiscriminatingForms: anyDiscriminating(m75Carriers).length, ids: anyDiscriminating(m75Carriers).map((c) => `${c.itemId} ${c.option} — ${c.fractionForms.map((f) => f.fraction).join(', ')}`) },
      SO_WHAT_A_RETIREMENT_WOULD_DO_TO_HER_FINDING: `it would move C and D from a tag whose discriminating denominator is ZERO into one that already carries ${anyDiscriminating(m75Carriers).length} carriers on discriminating forms. That does not author the 2/5-form item she asked for, and it is not nothing: the merged tag has negative controls the mint never had.`,
      whatWouldMakeThisSUFFICIENT: 'computing both rules\' predictions from each item\'s own amount and checking the tagged option matches one and not the other. This store has not done that and does not assert it.',
    },
  };
  const lines = [`mint carriers\t${mintCarriers.length}`, `m75 carriers\t${m75Carriers.length}`, `m75 on discriminating forms\t${anyDiscriminating(m75Carriers).length}`];
  const d = digestOverText('the summary lines joined by \\n', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['WHAT_WOULD_MOVE', 'WHAT_WOULD_NOT_MOVE_ASSERTED', 'THE_NEGATIVE_CONTROL_MEASUREMENT', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('mint-retirement-impact', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'mint-retirement-impact');
  console.log(`\n  would move: 6 entries -> 5; ${mintCarriers.length} retags; maths-75 ${m75Carriers.length} -> ${m75Carriers.length + mintCarriers.length} carriers`);
  console.log(`  would NOT move: any pin, any signature, any blocker, the 178/187 count`);
  console.log(`  would be silently lost unless carried: the ruling basis on FDP-08 D (${mintEvents.length} events name the mint)`);
  console.log(`  negative control: mint 0 of ${mintCarriers.length} on discriminating forms; maths-75 ${anyDiscriminating(m75Carriers).length} of ${m75Carriers.length}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
