/**
 * THREE CROSSINGS (David, 2026-09-02, on her ruling that a signature is over content, not an
 * arrangement).
 *
 *   1. TO ANNIE, FIRST — the four signatures whose order has no witness but the live database.
 *      They are WITNESSED HERE: their current order is recorded as bytes, so the witness exists
 *      outside the thing that moves. Recording, never changing.
 *   2. TO ANNIE, ON ITS OWN — ENG-001-WIW-15, the one genuinely unexplained signature, LIVE.
 *   3. TO THE AUTHORING STORE — the publication report and the six, with its denominator
 *      question answered: which estate does twenty-eight enumerate?
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { draftAssessmentSubjectHash } from '../packages/core/src/index';
import { ORDERED_OPTION_READ, pinHashes } from './lib/pin-projection';
import { requirePopulation } from './lib/population';
import { canonicalJson, findingsDigest } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

function cross(base: string, payload: Record<string, unknown>, keys: string[]): { name: string; sha256: string } {
  const clean = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  Object.assign(clean, findingsDigest(clean, keys));
  const p = pjoin(REPO, 'content/exports', stampedName(base, String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const landed = deliver(p, base);
  const name = landed.split('/').pop()!;
  const bytes = readFileSync(pjoin(LANE, name));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${sha(bytes)}  ${name}\n`);
  writeFileSync(pjoin(DL, name), bytes);
  return { name, sha256: sha(bytes) };
}

async function main() {
  console.log('THREE CROSSINGS\n');

  // ---- 1. THE FOUR, WITNESSED ------------------------------------------------------------------
  const FOUR = ['MC05-FDP-08', 'MC01-FDP-04', 'MC02-NPV-07', 'MC05-MEAS-02'];
  const four = await prisma.item.findMany({ where: { id: { in: FOUR } },
    select: { id: true, status: true, pool: true, stem: true, explanation: true, questionTypeId: true, options: ORDERED_OPTION_READ } });
  requirePopulation('cross:the-four', { 'unwitnessed signed row(s)': four.length });
  const witnessed = await Promise.all(four.map(async (r) => {
    const sigs = await prisma.attributionEvent.findMany({ where: { recordId: r.id, action: 'SIGNED', subjectHash: { not: null } }, select: { subjectHash: true, method: true, at: true } });
    const h = pinHashes(r);
    const order = r.options.map((o) => String((o.content as { value?: unknown }).value ?? ''));
    return {
      itemId: r.id, questionTypeId: r.questionTypeId, status: r.status, pool: r.pool,
      THE_ORDER_AS_IT_STANDS: order,
      isValueSorted: JSON.stringify(order) === JSON.stringify([...order].sort((a, b) => a.localeCompare(b))),
      reproducesUnderThisOrder: sigs.some((s) => s.subjectHash === h.retentionIncluded || s.subjectHash === h.retentionExcluded),
      retentionIncluded: h.retentionIncluded, retentionExcluded: h.retentionExcluded,
      storedSignatures: sigs.map((s) => ({ subjectHash: s.subjectHash, method: s.method, at: s.at })),
      optionsInFull: r.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })),
    };
  }));
  const a1 = cross('the-four-unwitnessed-witnessed', {
    kind: 'THE-FOUR-UNWITNESSED-SIGNATURES-NOW-WITNESSED', TO: 'Annie, first', date: '2026-09-02',
    THE_RULING_THIS_SERVES: 'a signature is over content, not an arrangement (Annie, 2026-09-02). B and C are done; A waits on her word.',
    WHY_THESE_FOUR_FIRST: 'of 440 ordering-relevant signatures, 436 have the order they were signed in recorded in a crossed population artefact. THESE FOUR HAVE NO WITNESS BUT THE LIVE DATABASE — and the live database is the thing that moves. All four are LIVE and serving children; three verify today under an order that is NOT value-sorted, so each is one write to any of its options away from becoming unverifiable with nothing anywhere able to say what it was.',
    WHAT_THIS_ARTEFACT_DOES: 'it WITNESSES them. Their exact current option order is recorded here as bytes, with both retention hashes and the stored signature beside it. Nothing is changed: this is a photograph, taken before anything can move, so that option C — verify against the recorded order — becomes available for these four as it already is for the other 436.',
    andWHATITDOESNOT: 'it does not re-issue, re-order or canonicalise anything. If she rules A, these four re-issue with the rest; if she does not, they now have the witness the other 436 always had.',
    THE_FOUR: witnessed,
  }, ['THE_FOUR']);
  console.log(`  1. the four, witnessed -> ${a1.name}`);

  // ---- 2. ENG-001-WIW-15, ON ITS OWN -----------------------------------------------------------
  const w = await prisma.item.findUniqueOrThrow({ where: { id: 'ENG-001-WIW-15' },
    select: { status: true, pool: true, stem: true, explanation: true, difficultyTier: true, reviewedBy: true, reviewMethod: true, options: ORDERED_OPTION_READ } });
  const wSigs = await prisma.attributionEvent.findMany({ where: { recordId: 'ENG-001-WIW-15' }, orderBy: { at: 'asc' },
    select: { at: true, action: true, field: true, actor: true, reviewerId: true, subjectHash: true, method: true } });
  const wh = pinHashes(w);
  const s = w.stem as Record<string, unknown>;
  const optText = w.options.map((o) => ({ text: String((o.content as { text?: unknown; value?: unknown }).text ?? (o.content as { value?: unknown }).value ?? ''), isCorrect: o.isCorrect }));
  const a2 = cross('eng-001-wiw-15-unexplained-signature', {
    kind: 'ONE-UNEXPLAINED-SIGNATURE-LIVE', TO: 'Annie', date: '2026-09-02',
    THE_ITEM: 'ENG-001-WIW-15 — LIVE, PRACTICE, serving children. The ONLY signature in 477 that no reading of this store can explain.',
    WHAT_WAS_ELIMINATED: {
      one: 'it is not an ORDERING difference. Every permutation of its five options was hashed under both retention projections; none reproduces the stored hash.',
      two: 'it is not an EXECUTION-TEXT subject (R970). No execution on the row hashes to it.',
      three: 'it is not the MIGRATIONS. The three schema migrations that rewrote this stem (lineRefs to item, prompt to text, itemModel) all landed 2026-08-16 between 11:38 and 11:53; the signature was taken at 16:07, after them.',
    },
    WHAT_IS_KNOWN: {
      theSigningPath: 'the in-platform comprehension review surface (apps/web/lib/actions/admin-items.ts), which does NOT use the pin projection. It calls draftAssessmentSubjectHash, whose subject is {prompt, tier, options:[{isCorrect, text}]} hashed with plain JSON.stringify — not canonical JSON, no stem, no explanation, `text` rather than `content`.',
      soITISATHIRDSUBJECT: 'R970 recorded subjectHash carrying two subjects. This is a THIRD, and it is the one the product itself writes when a reviewer signs in the admin surface — which makes it the most likely subject in the estate, not an exception.',
      andYETITSTILLDOESNOTREPRODUCE: 'recomputed under that surface\'s own subject definition, with the prompt taken from stem.text and again from stem.prompt, neither reproduces the stored hash. So the subject is identified and the value still disagrees.',
      theStoredHash: '425245f09b627e89…', signedTwice: 'two SIGNED events four minutes apart carry the identical hash, so the value was stable at signing',
    },
    WHAT_THAT_LEAVES: 'either a field that subject hashes changed after signing without an attribution event, or the surface hashed values that differ from what is stored — a rendering again, one level further out. This store cannot tell which from here, and does not guess.',
    THE_EVIDENCE_IN_FULL: {
      currentPinHashes: wh, difficultyTier: w.difficultyTier, reviewedBy: w.reviewedBy, reviewMethod: w.reviewMethod,
      stemKeys: Object.keys(s), stem: s, optionsAsTheSurfaceWouldSeeThem: optText,
      recomputedUnderTheSurfacesSubject: {
        fromStemText: draftAssessmentSubjectHash({ prompt: (s.text as string) ?? null, tier: w.difficultyTier, options: optText }),
        fromStemPrompt: draftAssessmentSubjectHash({ prompt: (s.prompt as string) ?? null, tier: w.difficultyTier, options: optText }),
      },
      everyEvent: wSigs,
    },
    WHAT_IS_NOT_DONE: 'nothing. The row is LIVE and stays LIVE: an unverifiable signature is not a wrong answer, and pulling a served row on an instrument question would be the manufactured work R961 warns about. It crosses for her reading.',
  }, ['THE_EVIDENCE_IN_FULL', 'WHAT_IS_KNOWN']);
  console.log(`  2. the one unexplained -> ${a2.name}`);

  // ---- 3. TO THE AUTHORING STORE: THE SIX, THE REPORT, AND THE DENOMINATOR ----------------------
  const cases = await prisma.case.findMany({ select: { id: true, title: true, questionTypeId: true, freeTier: true }, orderBy: { id: 'asc' } });
  const vrCases = cases.filter((c) => c.id.startsWith('case-vr-'));
  const named = ['round-one-report-45c6ccf7d59fefa5', 'round-two-report-62cf94d5c58fc0ae', 'one-run-report-e7ec3c2376b77409',
    'seventeen-and-serve-figure-90b3e859a6aa9563', 'mint-lands-door-derives-e28b4ea9953e3ee5', 'the-final-door-report-9080295ef41fecb9',
    'vr10-publication-5634dc59053cab88'];
  const files = named.map((n) => {
    const b = readFileSync(pjoin(LANE, `${n}.json`));
    return { name: `${n}.json`, sha256: sha(b), nameAgreesWithBytes: sha(b).startsWith(n.slice(-16)) };
  });
  const a3 = cross('to-the-authoring-store-the-seven-and-the-denominator', {
    kind: 'THE-SEVEN-AND-THE-DENOMINATOR-ANSWERED', TO: 'the authoring store; the desk by relay', date: '2026-09-02',
    THE_SEVEN: { why: 'six reports stalled under 64-hex names and the publication report had never been placed. All seven now carry conforming 16-hex stamps, sit in the lane and on the desk floor, and each name equals its own bytes.', files },
    YOUR_DENOMINATOR_QUESTION_ANSWERED: {
      theQuestion: 'which estate does TWENTY-EIGHT enumerate? Your bound population holds eleven cases.',
      theAnswer: `twenty-eight is EVERY Case row in this store, across every district — not the eleven. It breaks down as ${cases.filter((c) => c.id.startsWith('case-en-')).length} English, ${cases.filter((c) => c.id.startsWith('case-maths-')).length} maths and ${vrCases.length} VR; ${cases.filter((c) => !c.freeTier).length} paid and ${cases.filter((c) => c.freeTier).length} free.`,
      andWHERETHEELEVENSIT: `your eleven are the PAID VR subset the arc was cut over — a subset of the ${vrCases.length} VR cases, which are themselves a subset of the 28. So "18 of 28 servable" and "eleven cases" are not two readings of one number: they are two different populations, and the figures were never meant to meet (R918).`,
      theTwentyEightInFull: cases.map((c) => ({ id: c.id, title: c.title, paid: !c.freeTier })),
      whatServableMeansThere: 'servableCaseIds derives visibility from the LIVE + PRACTICE pool at request time, so "18 of 28" counts cases with a non-empty pool across the whole store — English and maths included, which is why it is larger than anything the VR arc alone could explain.',
    },
  }, ['THE_SEVEN', 'YOUR_DENOMINATOR_QUESTION_ANSWERED']);
  console.log(`  3. to the authoring store -> ${a3.name}`);
  console.log(`\n  ${[a1, a2, a3].map((a) => `${a.name} (${a.sha256.slice(0, 16)})`).join('\n  ')}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
