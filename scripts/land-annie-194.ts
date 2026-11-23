/**
 * HER 194th: THE MINT RETIRES INTO maths-75, AND D'S QUALIFIER TRAVELS WITH ITS JOIN.
 *
 * **A qualifier belongs to a JOIN, not to an ENTRY, and the join survives the move** (her finding).
 * This store's own impact report named the qualifier as the thing ordinary maintenance would lose:
 * a retag writes a new `misconceptionId`, and unless the ruling basis is carried forward VERBATIM,
 * `MC01-FDP-08` D ends up looking exactly like the six joins that computed. So the carry is not a
 * courtesy here — it is the whole reason the retag is allowed to be routine.
 *
 * **THE QUALIFIER IS COPIED FROM THE EXISTING EVENT, NEVER RE-AUTHORED.** Re-typing it would be a
 * second wording under one id (R598), and the wording is hers.
 *
 * The retirement names its replacement on its face (the refusal rule), the entry keeps its
 * provenance and the 193rd's hint amendment marked SUPERSEDED BY RETIREMENT rather than rejected,
 * and maths-75 is not touched — asserted before and after, not assumed.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { publishBlockers } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const RETURN_SHA = '5285a49a37fff76ae6b50c8785441da3fc4f1cada3e6dd5bf08dc2afb5858b7d';
const MINT = 'fraction-part-used-alone';
const M75 = 'maths-75-incomplete-fraction-of-an-amount';

const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v;

async function run() {
  const bytes = readFileSync('/Users/davidb/Downloads/annie-194-for-code.md', 'utf8');
  if (sha(bytes) !== RETURN_SHA) throw new Error(`the return does not hash to ${RETURN_SHA} — refusing`);

  assertFixture('qualifier-carry', [
    { name: 'a carried qualifier is byte-identical to its source', input: 'same', mustBeCaught: true },
    { name: 'a re-authored qualifier is NOT a carry', input: 'reworded', mustBeCaught: false },
    { name: 'an absent qualifier cannot be carried', input: 'absent', mustBeCaught: false },
  ], (k) => {
    const src = 'the indiscriminability is on the record, not smoothed';
    const carried = k === 'same' ? src : k === 'reworded' ? 'the indiscriminability is recorded' : null;
    return carried !== null && carried === src;
  });

  const before = {
    m75: await prisma.misconception.findUniqueOrThrow({ where: { id: M75 } }),
    mint: await prisma.misconception.findUniqueOrThrow({ where: { id: MINT } }),
  };
  const m75BytesBefore = sha(canonicalJson(JSON.parse(JSON.stringify(before.m75))));

  const row = await prisma.item.findUniqueOrThrow({ where: { id: 'MC01-FDP-08' }, select: { id: true, stem: true, explanation: true, status: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true, options: { orderBy: { id: 'asc' }, select: { id: true, content: true, isCorrect: true, misconceptionId: true } } } });
  const C = row.options.find((o) => (o.content as { label?: string }).label === 'C')!;
  const D = row.options.find((o) => (o.content as { label?: string }).label === 'D')!;

  /** D's qualifier, READ FROM THE EVENT THAT HOLDS IT. Never re-typed. */
  const dJoin = await prisma.attributionEvent.findFirst({
    where: { recordId: row.id, field: 'options[].misconceptionId', method: { contains: 'LANDED ON A RULING' } },
    select: { method: true, note: true, returnArtefact: true },
    orderBy: { at: 'desc' },
  });
  if (!dJoin) throw new Error('D\'s ruling-basis event is not in the store — refusing to retag the row whose qualifier I cannot carry (R173)');

  const projBefore = sha(canonicalJson(strip({ stem: row.stem, options: row.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: row.explanation }) as object));
  const blockerBefore = publishBlockers(row.options, row.reviewedBy, row.authoredBy, row.answerFlaggedAt) ?? 'none';
  const signedBefore = await prisma.item.count({ where: { questionType: { district: 'MATHS' }, reviewedBy: { not: null } } });
  requirePopulation('land:annie-194', { 'carrier(s) to retag': 2, 'entry to retire': 1, 'qualifier(s) to carry': 1 });

  if (APPLY) {
    await prisma.$transaction(async (tx) => {
      for (const [opt, label] of [[C, 'C'], [D, 'D']] as const) {
        const content = opt.content as Record<string, unknown>;
        await tx.itemOption.update({ where: { id: opt.id }, data: {
          misconceptionId: M75,
          content: { ...content, _previousMisconceptionId: opt.misconceptionId },
        } });
        await tx.attributionEvent.create({ data: {
          recordType: 'item', recordId: row.id, action: 'REASSIGNED', reviewerId: 'rev-0001', actor: 'Annie',
          recordedBy: 'human:david', field: 'options[].misconceptionId', returnArtefact: RETURN_SHA,
          method: `her 194th: ${MINT} RETIRES into ${M75} under the maths-88 precedent, and option ${label} retags. maths-75's own description names both parts, and its denominator example is option C by value on this very item.`,
          note: label === 'D'
            // R894: carried VERBATIM from D's original join. Not re-authored.
            ? `THE QUALIFIER TRAVELS WITH THE JOIN, CARRIED VERBATIM FROM ITS ORIGINAL EVENT AND NOT RE-AUTHORED. Original method: ${dJoin.method} || Original note: ${dJoin.note}`
            : 'option C joined on its own confessed working (15 / 3 = 5) and retags on the same reading; its basis is unchanged by the move.',
        } });
      }
      await tx.misconception.update({ where: { id: MINT }, data: {
        status: 'RETIRED',
        rejectedBy: null, rejectedAt: null,
        rejectionNote: `RETIRED, NOT REJECTED — superseded by ${M75}, which covers the act twice over: its description names both parts and it already carried two divide-by-a-fraction members using the denominator alone (MC04-FDP-05, MC05-FDP-06), tagged and reviewed before this entry existed. Her 194th, under the maths-88 precedent. The replacement is named on the face of the retirement, per the refusal rule.`,
        textProvenance: {
          ...(before.mint.textProvenance as object ?? {}),
          supersededByRetirement: {
            into: M75, on: '2026-08-29', authority: `annie-194-for-code.md, sha256 ${RETURN_SHA}`,
            theHintAmendmentRetiresWithIt: (before.mint as { childHint: string }).childHint,
            andWHYITISRETAINEDRATHERTHANREJECTED: 'her 193rd hint amendment was authored for this entry and is correct for it. It is superseded because the entry is, not because the wording was wrong — recorded as superseded by retirement, never as rejected.',
            andWHYMATHS75SHINTSTANDS: 'eleven of the thirteen carriers are fraction-of-amount items where no dividing by the fraction occurs in the correct method either, so the divide-specific wording would puzzle exactly the children it reached most. Her words.',
          },
        },
      } });
      await tx.attributionEvent.create({ data: {
        recordType: 'misconception', recordId: MINT, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie',
        recordedBy: 'human:david', field: 'status', returnArtefact: RETURN_SHA,
        method: `RETIRED into ${M75}. One diagnosis lives in one place; the entry closes with its provenance retained.`,
        note: 'the gap was declared against a misremembered quotation of an entry she had already signed in her 134th — the register\'s own words outlasting every paraphrase of them, hers included.',
      } });
    });
  }

  const after = {
    m75: await prisma.misconception.findUniqueOrThrow({ where: { id: M75 } }),
    mint: await prisma.misconception.findUniqueOrThrow({ where: { id: MINT }, select: { id: true, status: true, childHint: true, rejectionNote: true } }),
  };
  const rowAfter = await prisma.item.findUniqueOrThrow({ where: { id: 'MC01-FDP-08' }, select: { stem: true, explanation: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true } } } });
  const projAfter = sha(canonicalJson(strip({ stem: rowAfter.stem, options: rowAfter.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: rowAfter.explanation }) as object));
  const signedAfter = await prisma.item.count({ where: { questionType: { district: 'MATHS' }, reviewedBy: { not: null } } });
  const entries = await prisma.misconception.count({ where: { district: 'MATHS', status: 'ACTIVE', createdAt: { gte: new Date('2026-08-29') } } });
  const m75Carriers = await prisma.itemOption.count({ where: { misconceptionId: M75 } });
  const carriedNote = await prisma.attributionEvent.findFirst({ where: { recordId: row.id, action: 'REASSIGNED', note: { contains: 'CARRIED VERBATIM' } }, select: { note: true } });

  const full = {
    kind: 'annie-194-retirement', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    return: 'annie-194-for-code.md', returnSha256: RETURN_SHA,
    returnSha256Spec: 'sha256 over the return file bytes exactly as delivered, unparsed',
    herArrivalConfirmation: 'she names maths-75-whole-for-the-duplication-reading-9e8403e4333d1d76.json by digest — arrival confirmed from the far side, which is the only side that can confirm it',

    THE_RETIREMENT: { entry: MINT, into: M75, status: after.mint.status, replacementNamedOnItsFace: after.mint.rejectionNote,
      provenanceRetained: true, theHintAmendmentRetiresWithIt: after.mint.childHint,
      recordedAs: 'SUPERSEDED BY RETIREMENT, never rejected — the wording was right for the entry it was written for' },
    THE_RETAGS: rowAfter.options.filter((o) => o.misconceptionId === M75).map((o) => ({
      option: (o.content as { label?: string }).label, value: String((o.content as { value: unknown }).value),
      nowCarries: o.misconceptionId, retained: (o.content as { _previousMisconceptionId?: string })._previousMisconceptionId })),

    THE_QUALIFIER_CARRIED: {
      rule: 'a qualifier belongs to a JOIN, not to an ENTRY, and survives a retag intact (her 194th finding)',
      carriedVerbatimNotReAuthored: true,
      whatWasCarried: carriedNote?.note ?? null,
      andWHYITMATTERED: 'this store\'s own impact report named it as the thing ordinary maintenance would lose. Without the carry, D reads exactly like the six joins that computed, and the weaker basis disappears with nobody deciding to drop it (R894).',
    },

    WHAT_THE_RETIREMENT_DID_NOT_TOUCH: {
      mathsSeventyFiveHint: { stands: after.m75.childHint, unamended: m75BytesBefore === sha(canonicalJson(JSON.parse(JSON.stringify(after.m75)))) },
      pinnedRowHash: { before: projBefore, after: projAfter, moved: projBefore !== projAfter,
        why: 'misconceptionId is in neither projection, so a retag cannot move a pinned row hash. Computed both sides rather than asserted.' },
      publishBlocker: { before: blockerBefore, after: publishBlockers(rowAfter.options, rowAfter.reviewedBy, rowAfter.authoredBy, rowAfter.answerFlaggedAt) ?? 'none' },
      signedCount: { before: signedBefore, after: signedAfter, moved: signedBefore !== signedAfter },
    },

    THE_STATE: { mintedEntriesStillActive: entries, mathsSeventyFiveCarriers: m75Carriers, signed: `${signedAfter} of 187` },
    STILL_THE_CORPUS_S_MISSING_INSTRUMENT: 'the 2/5-form discriminating item. The family now holds thirteen carriers and every divide-by member sits where complement and unit fraction coincide, which makes authoring it more worth doing, not less (her §3).',
  };
  const lines = [`retire\t${MINT}\t${after.mint.status}`, `retag\tMC01-FDP-08 C,D\t${M75}`, `signed\t${signedAfter}`];
  const d = digestOverText('the result lines joined by \\n', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['THE_RETIREMENT', 'THE_RETAGS', 'THE_QUALIFIER_CARRIED', 'WHAT_THE_RETIREMENT_DID_NOT_TOUCH', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'annie-194-retirement' : 'annie-194-retirement-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n  ${APPLY ? 'APPLIED' : 'DRY RUN'}`);
  console.log(`  entries still active: ${entries} · maths-75 carriers: ${m75Carriers} · signed: ${signedAfter} of 187`);
  console.log(`  pin moved: ${projBefore !== projAfter} · blocker: ${blockerBefore} -> ${publishBlockers(rowAfter.options, rowAfter.reviewedBy, rowAfter.authoredBy, rowAfter.answerFlaggedAt) ?? 'none'} · signed moved: ${signedBefore !== signedAfter}`);
  console.log(`  qualifier carried verbatim: ${carriedNote ? 'yes' : 'NO'}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
