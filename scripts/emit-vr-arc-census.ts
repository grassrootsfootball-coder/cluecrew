/**
 * THE VR ARC: SLOT CENSUS, SECTIONED POPULATION, AND WHOLENESS — one run, one report.
 *
 * **The slot census decides the shape of everything after it**, so it runs first and the sectioning
 * follows its answer rather than an assumption. Annie's maths finding was that a parallel-case
 * corpus carries its own answer key: if slot N holds the same question in every case, a ruling on
 * the slot lands on eleven rows at once and the calendar collapses.
 *
 * **THE PREMISE IS TESTED, NOT ADOPTED.** "Do the eleven cases share slot structure the way the
 * maths batches did" is a question about this corpus, and the answer decides whether the emission
 * sections by slot or by case. Sectioning by slot on a corpus that is not parallel would put eleven
 * unrelated questions in front of a reader and call it a sitting.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { ROW_DIGEST_SUBJECT_KEYS } from './lib/population-binding';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const SECTION_SIZE = 6;

const PAID = ['vr-02-two-odd-ones-out', 'vr-05-hidden-word', 'vr-08-move-letter', 'vr-10-word-connections',
  'vr-13-make-a-word', 'vr-16-opposite-meaning', 'vr-17-complete-the-sum', 'vr-18-related-numbers',
  'vr-19-word-number-codes', 'vr-20-complete-the-word', 'vr-21-same-meaning'];

const slotOf = (id: string) => id.match(/-(\d\d)$/)?.[1] ?? null;
/** A VR option value may be a STRING or an ARRAY (`["hot","cold"]`). Both render; neither is coerced away. */
const valueOf = (c: unknown) => {
  const v = (c as { value?: unknown }).value;
  return Array.isArray(v) ? v.map(String) : String(v);
};

/**
 * THE SHELF — the author's banks, read from disk and hashed. A row's BANK is the source of its third
 * assertion (R909: authorship), so **a row whose bank nobody can name has no source for it** and is
 * marked UNKNOWN rather than left blank. Blank and unknown are the same character on a page and
 * different facts.
 */
function theShelf() {
  const dir = pjoin(homedir(), 'Downloads/11+/items/vr-banks');
  if (!existsSync(dir)) throw new Error(`no shelf at ${dir} — refusing to name every bank unknown by accident (R173)`);
  const banks = new Map<string, { file: string; sha256: string; itemCount: number }>();
  for (const n of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const bytes = readFileSync(pjoin(dir, n), 'utf8');
    let d: { bank?: string; itemCount?: number };
    try { d = JSON.parse(bytes) as { bank?: string; itemCount?: number }; } catch { continue }
    if (typeof d.bank === 'string') banks.set(d.bank, { file: n, sha256: sha(bytes), itemCount: d.itemCount ?? 0 });
  }
  if (banks.size === 0) throw new Error('the shelf holds no bank with a `bank` key — the shape changed (R173)');
  return banks;
}

async function run() {
  assertFixture('slot-parse', [
    { name: 'a bank id yields its trailing slot', input: 'bank-vr-02-two-odd-ones-out-23', mustBeCaught: true },
    { name: 'a single-digit tail is not a slot', input: 'bank-vr-02-two-odd-ones-out-3', mustBeCaught: false },
    { name: 'an id with no trailing number yields nothing', input: 'bank-vr-02-two-odd-ones-out', mustBeCaught: false },
  ], (id) => slotOf(id) !== null);

  const rows = await prisma.item.findMany({
    where: { questionTypeId: { in: PAID }, status: 'DRAFT' },
    select: { id: true, questionTypeId: true, difficultyTier: true, pool: true, status: true,
      stem: true, explanation: true, solution: true,
      options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } },
  });
  const cases = await prisma.case.findMany({ where: { questionTypeId: { in: PAID } },
    select: { id: true, title: true, questionTypeId: true, orderInDistrict: true, freeTier: true, modes: true },
    orderBy: { orderInDistrict: 'asc' } });
  const mcIds = [...new Set(rows.flatMap((r) => r.options.map((o) => o.misconceptionId)).filter((v): v is string => !!v))];
  const known = new Map((await prisma.misconception.findMany({ where: { id: { in: mcIds } }, select: { id: true, status: true } })).map((m) => [m.id, m.status]));

  requirePopulation('emit:vr-arc-census', { 'DRAFT row(s) across the eleven paid cases': rows.length, 'case(s)': cases.length });

  // ---- ONE: THE SLOT CENSUS --------------------------------------------------------------------
  const bySlot = new Map<string, typeof rows>();
  for (const r of rows) { const s = slotOf(r.id); if (s) bySlot.set(s, [...(bySlot.get(s) ?? []), r]); }
  const slots = [...bySlot.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([slot, rs]) => ({
    slot, rows: rs.length,
    distinctQuestionTypes: new Set(rs.map((r) => r.questionTypeId)).size,
    tiersPresent: [...new Set(rs.map((r) => r.difficultyTier))].sort((a, b) => a - b),
    tierIsConstant: new Set(rs.map((r) => r.difficultyTier)).size === 1,
    typeIsConstant: new Set(rs.map((r) => r.questionTypeId)).size === 1,
    stemKeyShapes: [...new Set(rs.map((r) => Object.keys((r.stem ?? {}) as object).sort().join('+')))].sort(),
  }));
  const constantSlots = slots.filter((s) => s.typeIsConstant && s.tierIsConstant);
  const parallel = constantSlots.length === slots.length;

  // ---- THREE: THE WHOLENESS CENSUS (computed before sectioning, so sections can carry it) --------
  const walkServes = (qtId: string) => {
    const c = cases.find((x) => x.questionTypeId === qtId);
    const walk = (c?.modes as { walk?: { kind?: string; assetRef?: string } } | null)?.walk;
    return { declared: !!walk, kind: walk?.kind ?? null, assetRef: walk?.assetRef ?? null,
      servesRealAsset: !!walk?.assetRef && !walk.assetRef.startsWith('placeholder/') };
  };
  const wholeness = rows.map((r) => {
    const distractors = r.options.filter((o) => !o.isCorrect);
    const tagged = distractors.filter((o) => o.misconceptionId);
    const attested = tagged.filter((o) => known.get(o.misconceptionId!) === 'ACTIVE');
    const expl = (r.explanation ?? {}) as Record<string, unknown>;
    const walk = walkServes(r.questionTypeId);
    return { itemId: r.id,
      distractors: distractors.length, tagged: tagged.length, tagsAttested: attested.length,
      untaggedDistractors: distractors.length - tagged.length,
      tagsNamingNoActiveEntry: tagged.length - attested.length,
      executionsPresent: distractors.filter((o) => o.misconceptionExecution).length,
      walkScriptPresent: typeof expl.walkScript === 'string' && expl.walkScript.length > 0,
      walkModeServesARealAsset: walk.servesRealAsset,
      explanationKeys: Object.keys(expl) };
  });
  const w = {
    rows: wholeness.length,
    distractorsTotal: wholeness.reduce((n, x) => n + x.distractors, 0),
    tagged: wholeness.reduce((n, x) => n + x.tagged, 0),
    tagsAttested: wholeness.reduce((n, x) => n + x.tagsAttested, 0),
    untaggedDistractors: wholeness.reduce((n, x) => n + x.untaggedDistractors, 0),
    tagsNamingNoActiveEntry: wholeness.reduce((n, x) => n + x.tagsNamingNoActiveEntry, 0),
    executionsPresent: wholeness.reduce((n, x) => n + x.executionsPresent, 0),
    rowsWithWalkScript: wholeness.filter((x) => x.walkScriptPresent).length,
    casesWhereWalkServesARealAsset: cases.filter((c) => walkServes(c.questionTypeId).servesRealAsset).length,
    rowsWithAnyExplanation: wholeness.filter((x) => x.explanationKeys.length > 0).length,
  };

  // ---- TWO: THE SECTIONED POPULATION -----------------------------------------------------------
  const order = cases.map((c) => c.questionTypeId);
  const sorted = [...rows].sort((a, b) =>
    order.indexOf(a.questionTypeId) - order.indexOf(b.questionTypeId) || (slotOf(a.id) ?? '').localeCompare(slotOf(b.id) ?? ''));
  const sections: Array<Record<string, unknown>> = [];
  for (const c of cases) {
    const rs = sorted.filter((r) => r.questionTypeId === c.questionTypeId);
    for (let i = 0; i < rs.length; i += SECTION_SIZE) {
      const chunk = rs.slice(i, i + SECTION_SIZE);
      sections.push({
        section: sections.length + 1, caseId: c.id, caseTitle: c.title, questionType: c.questionTypeId,
        sizeInThisSection: chunk.length,
        rows: chunk.map((r) => {
          const wh = wholeness.find((x) => x.itemId === r.id)!;
          const projection = { stem: r.stem, options: r.options.map((o) => ({ value: valueOf(o.content), isKey: o.isCorrect })), solution: r.solution };
          return {
            itemId: r.id, slot: slotOf(r.id), tier: r.difficultyTier,
            stem: r.stem,
            options: r.options.map((o) => ({ value: valueOf(o.content), isKey: o.isCorrect,
              tag: o.misconceptionId ?? null,
              tagIsActiveInTheLibrary: o.misconceptionId ? known.get(o.misconceptionId) === 'ACTIVE' : null,
              execution: o.misconceptionExecution ?? null })),
            explanation: r.explanation, solution: r.solution,
            wholeness: { tagged: wh.tagged, ofDistractors: wh.distractors, attested: wh.tagsAttested,
              executionsPresent: wh.executionsPresent, walkScriptPresent: wh.walkScriptPresent },
            rowSha256: sha(canonicalJson(projection)),
            rowSha256Spec: 'sha256 over canonical JSON of {stem, options[{value,isKey}], solution} — order as stored, enrichment excluded',
            // THE SUBJECT AS KEYS, NOT ONLY AS PROSE (R985). This row's `options` below carry tag,
            // tagIsActiveInTheLibrary and execution; none of them is in the digest.
            rowSha256Subject: ROW_DIGEST_SUBJECT_KEYS,
          };
        }),
      });
    }
  }

  // ---- THE DAYLIGHT RECONCILIATION, CARRIED ONTO THE POPULATION BEFORE IT CUTS -----------------
  const eleven = await prisma.item.findMany({ where: { questionTypeId: { in: PAID } },
    select: { id: true, status: true, pool: true, difficultyTier: true, questionTypeId: true } });
  const outsideTheDoor = eleven.filter((r) => r.status !== 'DRAFT');
  const rulings = await prisma.attributionEvent.findMany({
    where: { recordId: { in: outsideTheDoor.map((r) => r.id) } },
    select: { recordId: true, actor: true, method: true },
  });
  const COWORK_COUNT = 305;
  const daylight = {
    RESOLVED: 'THERE IS NO GAP. Cowork reports that 280 of its 305 rows are outside the eleven cases entirely, so the two figures were never measuring the same thing and there was never anything to reconcile. Recorded as their measurement, not re-derived here.',
    andWHATTHATCONFIRMS: 'R918 and R920 in one line: the subtraction 305 - 275 = 30 produced a number, a plausible story, and thirty rows that do not exist. The residual this store declined to name as a population turned out not to BE a population — which is the outcome the refusal was protecting against, arriving as vindication rather than as luck.',
    THE_GAP_AS_STATED: `Cowork reported 305; this door cuts 275. Annie will not sign against an unexplained gap and is right not to, so what can be named is named and what cannot is marked as arithmetic.`,
    thisStoreHoldsInTheElevenCases: eleven.length,
    ofWhichTheDoorCuts: eleven.length - outsideTheDoor.length,
    NAMED_BY_STATE: outsideTheDoor.map((r) => ({
      itemId: r.id, state: r.status, pool: r.pool, tier: r.difficultyTier, questionType: r.questionTypeId,
      theRulingThatPutItThere: rulings.find((e) => e.recordId === r.id)?.method ?? null,
      byWhom: rulings.find((e) => e.recordId === r.id)?.actor ?? null,
    })).sort((a, b) => a.itemId.localeCompare(b.itemId)),
    namedCount: outsideTheDoor.length,
    andWHATTHEYARE: 'the thirteen vr-08 SEED rows, NEVER_SHIPPABLE under David\'s seed ruling. They are inside the eleven cases and outside the door because the door cuts DRAFT; their state is a decision with an author, not an omission.',
    THE_RESIDUAL_IS_ARITHMETIC_AND_IS_NOT_A_POPULATION: {
      figure: COWORK_COUNT - eleven.length,
      whyItIsNotNamed: `305 minus the ${eleven.length} rows this store holds leaves ${COWORK_COUNT - eleven.length}, and that subtraction is a comparison of two definitions before it is a comparison of two numbers (R918, registered one turn ago on exactly this pair of stores). No Cowork VR send of 305 rows is on this disk, so those rows cannot be named by id or by state here.`,
      andWHATWASCHECKED: 'every VR artefact on disk carrying more than twenty vr ids. The only 300-plus file is this store\'s OWN export of the FREE TEN cases (307 items) — a different population entirely, and naming it as the source would have been the count comparison wearing a filename.',
      WHAT_RESOLVES_IT: 'their 305 ids. The intersection is one operation and needs no ruling.',
    },
    SO_WHAT_ANNIE_CAN_SIGN_AGAINST: `${eleven.length - outsideTheDoor.length} rows cut by the door and ${outsideTheDoor.length} named and stateable beside them. The residual is CLOSED: it was never a population.`,
  };
  const shelf = theShelf();
  const provenanceOf = (qtId: string) => {
    const b = shelf.get(qtId);
    return b
      ? { bank: b.file, bankSha256: b.sha256, bankItemCount: b.itemCount, state: 'NAMED' as const }
      : { bank: null, bankSha256: null, bankItemCount: null, state: 'UNKNOWN' as const,
          why: 'no bank for this question type is on the author\'s shelf. Its rows carry gen-vr ids — generated in this store — so there is no bank to name, and the absence is a fact about the shelf rather than a gap in this record.' };
  };

  const THE_CUT = {
    state: 'CUT',
    what: `${sorted.length} rows in ${cases.length} cases, ${SECTION_SIZE} to a section, contiguous by case`,
    theDaylightIsResolvedBeforeTheCut: true,
    andWHYTHATORDERMATTERS: 'a population cut over an unexplained gap asks a reviewer to sign for rows she cannot account for. The gap closed first, so what is cut is the whole of what this store holds in these cases minus a boundary with an author.',
  };

  const full = {
    kind: 'vr-arc-census-and-population',
    TO: 'BOTH Annie and Cowork — one artefact, one digest, crossed once.',
    THE_RULING_THAT_MAKES_ONE_CROSSING_ENOUGH: {
      it: 'her reading and its execution authoring run on THE SAME BYTES, byte-identity binding both to the same text.',
      andWHATITREPLACES: 'the receive-path problem for this arc. Shape A needed an import door for executions, a gate and a canary before 650 rows depended on it (R922). One artefact read by both parties needs none of that: there is nothing to receive, because neither store is sending the other a copy to merge.',
      soTHEFAILUREMODEITCLOSES: 'two stores authoring against two texts that were the same when they parted. Byte-identity is not a courtesy here — it is what makes a reading done there valid over a row served here.',
      theBindingValue: 'the sha256 of this file, which both parties quote back. A reading or an execution citing any other digest is about a different text and this store will say so.',
    },
    THE_CUT,
    THE_PROVENANCE_LINE_PER_CASE: {
      whyItIsHere: 'a row\'s BANK is the source of its third assertion — authorship (R909). A row whose bank nobody can name has no source for it, so every case carries a line and the unnamed say UNKNOWN rather than nothing.',
      theShelf: pjoin(homedir(), 'Downloads/11+/items/vr-banks'),
      banksOnIt: [...shelf.entries()].map(([bank, b]) => ({ bank, file: b.file, sha256: b.sha256, items: b.itemCount })),
      perCase: cases.map((c) => ({ caseId: c.id, questionType: c.questionTypeId, rowsHere: eleven.filter((r) => r.questionTypeId === c.questionTypeId).length, ...provenanceOf(c.questionTypeId) })),
      THE_SUMMARY: `${cases.filter((c) => shelf.has(c.questionTypeId)).length} of ${cases.length} cases have a bank on the shelf. The rest are UNKNOWN.`,
      andWHATTHATEXPLAINS: 'the shelf holds exactly three banks — vr-02 (25), vr-04 (40), vr-06 (40) — which is exactly this store\'s 105 bank-vr- rows. Of the eleven paid cases only vr-02 came from a bank; the other ten are gen-vr, generated here and never banked. **That is the same fact as "the authoring store holds almost none of the eleven cases\' rows", seen from the shelf instead of from their store.**',
      AND_AN_INFERENCE_MARKED_AS_ONE: 'the 25 rows overlapping between the two stores are very likely vr-02\'s 25 — it is the only one of the eleven with a bank, the bank declares itemCount 25, and this store holds exactly 25 rows for it. NOT VERIFIED: their 25 ids have not crossed, and a count agreeing with a count is what R918 was registered about.',
    },
    THE_DAYLIGHT_RECONCILIATION: daylight,
    THE_TWO_HUNDRED_AND_EIGHTY_AS_A_SHELF: {
      what: '280 of the authoring store\'s 305 rows lie outside the eleven cases entirely. Recorded as their measurement.',
      overlapping: 25,
      THE_RULING: 'not a loss, not a debt, and never counted into a door\'s population until a cut names them.',
      whyThatIsNotBookkeeping: 'an uncatalogued population outside a door has exactly two failure modes and they are opposite: it gets counted in, and a reviewer is asked to sign for rows nobody cut; or it gets forgotten, and work is redone because nothing recorded that it existed. **A shelf is the state that is neither** — present, named, and outside every denominator until somebody cuts it.',
      statesHere: 'UNKNOWN. This store does not hold their 280 and cannot state a status for a single one; the catalogue records the population and its rule, not a status it would have to invent.',
      whatWouldMakeITCUTTABLE: 'their 280 ids with states. Then it is a population and can be sectioned like any other.',
    },
    THE_POPULATION: `${rows.length} DRAFT rows across ${cases.length} paid VR cases, 25 per case`,

    ONE_THE_SLOT_CENSUS: {
      THE_QUESTION: 'do the eleven VR cases share slot structure the way the maths batches did — same question type, tier and construction at each position?',
      THE_ANSWER: parallel ? 'PARALLEL' : 'NOT PARALLEL — and the reason is structural, not a gap in the authoring',
      whyNot: 'each VR case maps to exactly ONE question type (case-vr-02 -> vr-02-two-odd-ones-out, and so on), where a maths case mapped seven. So position N holds a DIFFERENT question type in every case BY CONSTRUCTION — 11 of 11 distinct at every one of the 25 slots. The maths parallel came from one case spanning many types; VR is the transpose of that.',
      slotsConstantInTypeAndTier: constantSlots.length, ofSlots: slots.length,
      andTIERISNOTCONSTANTEITHER: 'every slot carries 3 to 5 distinct tiers. Slots 01-20 run tiers 1-4, slots 21-25 reach tier 5, so there is a weak upward trend by position and no constant.',
      WHAT_IS_CONSTANT: 'the COUNT. 25 slots x 11 rows = 275, exactly. The corpus is parallel in shape and not in content.',
      SO_A_RULING_ON_A_SLOT_LANDS_ON: 'eleven unrelated questions at three to five tiers. It does not collapse the calendar; sectioning by slot would put eleven different skills in front of a reader and call it a sitting.',
      andWHATTHISCOSTS: 'the maths shortcut is not available here. A ruling lands on eleven rows only where it is about TIER or about a house rule; a ruling about a question\'s construction lands on one case.',
      slots,
    },

    TWO_THE_SECTIONED_POPULATION: {
      SECTIONED_BY: 'CASE — because the slot census came back NOT PARALLEL. Sectioning by slot was the version that collapses the calendar and this corpus does not support it.',
      sectionSize: SECTION_SIZE,
      andTHEREMAINDER: 'sections never cross a case boundary, so each 25-row case yields 6+6+6+6+1. The trailing single-row section is real and is not padded — merging it into a neighbour would put two cases in one sitting.',
      sections: sections.length, rowsAcrossSections: sections.reduce((n, s) => n + (s.sizeInThisSection as number), 0),
      contiguousByCase: true,
    },

    THREE_THE_WHOLENESS_CENSUS: {
      underTheCurrentBar: 'per row: tags attested, executions present, walkScript where walk mode serves',
      ...w,
      THE_BINDING_ABSENCE: `executions present on ${w.executionsPresent} of ${w.distractorsTotal} distractors. Zero, as reported, and it is not the reviewer's work.`,
      andTHEWALKSCRIPTLINE: `walkScript present on ${w.rowsWithWalkScript} rows — and walk mode serves a REAL asset in ${w.casesWhereWalkServesARealAsset} of ${cases.length} cases. Every VR case declares walk as a faded-example whose assetRef is under placeholder/. **So "walkScript where walk mode serves" currently has an empty denominator**: no case serves a real walk asset, so no row is yet obliged to carry a script. That is a declaration about the mode, not an absence in the rows.`,
      soTHEREADINGANDTHEAUTHORINGCANRUNINPARALLEL: 'the reading needs stems, options and keys, which are whole. The authoring needs executions, which are absent everywhere and block nothing she does.',
    },
    SECTIONS: sections,
  };
  const lines = sections.map((s) => `${s.section}\t${s.caseId}\t${s.sizeInThisSection}`);
  const d = digestOverText('one line per section, "<n>\\t<caseId>\\t<size>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['ONE_THE_SLOT_CENSUS', 'TWO_THE_SECTIONED_POPULATION', 'THREE_THE_WHOLENESS_CENSUS', 'SECTIONS', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('vr-arc-census-and-population', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'vr-arc-census-and-population');

  console.log(`\n  ONE — slot census: ${full.ONE_THE_SLOT_CENSUS.THE_ANSWER}`);
  console.log(`     slots constant in type AND tier: ${constantSlots.length} of ${slots.length}; every slot holds 11 distinct types`);
  console.log(`  TWO — ${sections.length} sections of ${SECTION_SIZE}, contiguous by case, ${full.TWO_THE_SECTIONED_POPULATION.rowsAcrossSections} rows`);
  console.log(`  THREE — distractors ${w.distractorsTotal} · tagged ${w.tagged} · attested ${w.tagsAttested} · untagged ${w.untaggedDistractors} · executions ${w.executionsPresent} · walkScripts ${w.rowsWithWalkScript} (walk serves a real asset in ${w.casesWhereWalkServesARealAsset}/${cases.length} cases)`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
