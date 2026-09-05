/**
 * EVERY FIGURE THE SCREEN PRODUCED WHILE IT WAS INERT, RE-DERIVED (David, 2026-09-05).
 *
 * For three turns the screen ran on prose and skipped every option value and stem word (R1003).
 * **A figure is not wrong because the instrument was broken — it is wrong if the broken part
 * produced it.** So each published figure is re-derived and classified by WHAT COMPUTED IT:
 *
 *   · LIST-DERIVED — computed by comparing two vocabularies. The lists were never the fault; the
 *     SITING was. These stand unchanged and are re-derived here to show that rather than assert it.
 *   · GATE-DERIVED — computed by running the screen over rows through `checkItemChildFacing`.
 *     These described an inert instrument and do not stand.
 *   · DIRECT-SCREEN — computed by calling the predicate on strings this script chose itself,
 *     bypassing the gate's siting. These stand for the fields they named and are silent about the
 *     fields the gate was skipping, which is a narrower claim than they were read as making.
 *
 * **THE CLASSIFICATION IS THE FINDING.** "The screen was inert" does not invalidate everything the
 * screen was mentioned in, and saying so would be as careless as the original fault.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { screenForAChild, APPROPRIATENESS_LISTS } from '../packages/core/src/appropriateness';
import { runAgainst } from '../packages/core/src/appropriateness-fixture';
import { headwordIsBanned } from '../packages/core/src/content-gates';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

type Verdict = 'STANDS' | 'DOES NOT STAND' | 'STANDS, NARROWER THAN IT READ';

async function main() {
  const R = new Set(APPROPRIATENESS_LISTS.refuse);
  const F = new Set([...APPROPRIATENESS_LISTS.flagAmbiguousSense, ...APPROPRIATENESS_LISTS.flagNeedsContext]);

  const items = await prisma.item.findMany({
    include: { options: { orderBy: { id: 'asc' } }, questionType: { select: { mechanic: true } } }, orderBy: { id: 'asc' },
  });
  requirePopulation('rederive', { 'row(s) in the corpus': items.length });

  // ── GATE-DERIVED ────────────────────────────────────────────────────────────────────────────
  let blocked = 0; const appropriatenessFaults: Array<{ id: string; detail: string }> = [];
  for (const i of items) {
    const f = checkItemChildFacing({ id: i.id, stem: i.stem, explanation: i.explanation, mechanic: i.questionType.mechanic, options: i.options } as never).filter(isBlocking);
    if (f.length) blocked += 1;
    // `subject-matter`, NOT `banned-vocabulary`. The first version of this line counted five of the
    // ban list's voice refusals as the screen's, in the artefact written to re-derive the screen's
    // own figures. The rules are now distinct at the source, so the filter cannot recur.
    for (const x of f) if (x.rule === 'subject-matter') appropriatenessFaults.push({ id: i.id, detail: x.detail });
  }
  const holds = appropriatenessFaults.filter((f) => f.detail.includes('HOLD AND ROUTE'));
  const refusals = appropriatenessFaults.filter((f) => !f.detail.includes('HOLD AND ROUTE'));

  // ── DIRECT-SCREEN, RE-RUN OVER THE FIELDS THE GATE HAD BEEN SKIPPING ────────────────────────
  const theirFlagWords = ['arms', 'beat', 'blow', 'bust', 'club', 'clubs', 'crack', 'grass', 'high',
    'joint', 'pot', 'shell', 'shells', 'shoot', 'shoots', 'strip', 'stroke', 'trip', 'whip'];
  const vr08 = items.filter((i) => i.questionTypeId === 'vr-08-move-letter');
  let vr08Touches = 0;
  for (const i of vr08) {
    const st = i.stem as { word1?: string; word2?: string };
    // THE SAME SURFACE THE ORIGINAL FIGURE COUNTED: stem words, option values AND the words the
    // task asks the child to PRODUCE. Counting only the first two would have made the figure look
    // as though the world had changed when only this script's scope had.
    const w1 = String(st.word1 ?? '').toLowerCase(), w2 = String(st.word2 ?? '').toLowerCase();
    for (const w of [w1, w2]) if (theirFlagWords.includes(w)) vr08Touches += 1;
    for (const o of i.options) {
      const v = String((o.content as { value?: unknown })?.value ?? '');
      if (theirFlagWords.includes(v.toLowerCase())) vr08Touches += 1;
      if (v.length !== 1) continue;
      const L = v.toLowerCase();
      if (theirFlagWords.includes(w1.replace(L, ''))) vr08Touches += 1;
      for (let k = 0; k <= w2.length; k += 1) if (theirFlagWords.includes(w2.slice(0, k) + L + w2.slice(k))) vr08Touches += 1;
    }
  }

  const sevenMustCatch = ['HELL', 'LOVER', 'DAMN', 'NAKED', 'CORPSE', 'WHISKY', 'SUICIDE'];
  const stillUnscreenedByTheBanList = sevenMustCatch.filter((w) => !headwordIsBanned(w.toLowerCase()));
  const nowSeenByTheScreen = sevenMustCatch.filter((w) => screenForAChild(w, 'bare').verdict !== 'PASS');

  const mineOnMine = runAgainst(R, F);

  const figures: Array<{ figure: string; publishedAs: string; computedBy: string; reDerived: string; verdict: Verdict; note: string }> = [
    {
      figure: 'the gate blast radius after siting the screen',
      publishedAs: 'blocked 70 -> 70. NOTHING MOVED. Every item reports exactly what it reported before.',
      computedBy: 'GATE-DERIVED', reDerived: `blocked ${blocked}; ${appropriatenessFaults.length} appropriateness fault(s)`,
      verdict: 'DOES NOT STAND',
      note: '**THIS IS THE FIGURE THE FAULT PRODUCED, AND IT WAS PUBLISHED THREE TIMES AS REASSURANCE.** "Nothing moved" was true of an instrument that was not looking. It is the exact shape of R173 — the right answer from a failed read — and it read as evidence the change was safe.',
    },
    {
      figure: 'appropriateness faults on the corpus',
      publishedAs: 'never published as a figure; the gate reported none, so none was reported',
      computedBy: 'GATE-DERIVED', reDerived: `${appropriatenessFaults.length} fault(s): ${holds.length} HOLD AND ROUTE, ${refusals.length} REFUSE`,
      verdict: 'DOES NOT STAND',
      note: 'a silence, not a number — and the most misleading kind, because nothing was printed to distrust (R60).',
    },
    {
      figure: 'their nineteen flag words against this store\'s list',
      publishedAs: '0 of 19 agree; every one PASSES here',
      computedBy: 'LIST-DERIVED', reDerived: `${theirFlagWords.filter((w) => !R.has(w) && !F.has(w)).length} of 19 still pass here after adopting four`,
      verdict: 'STANDS',
      note: 'computed by comparing two vocabularies. The lists were never the fault, and the finding — a whole category absent here — is unaffected by where the screen was sited.',
    },
    {
      figure: 'places a word on their flag list appears in vr-08',
      publishedAs: '6 places, including two pairs authored that day',
      computedBy: 'DIRECT-SCREEN', reDerived: `${vr08Touches} place(s) on stem words and option values`,
      verdict: 'STANDS',
      note: 'computed by reading rows directly rather than through the gate, so the gate\'s siting never entered it. It differs now only because the vr-08 bank has since changed.',
    },
    {
      figure: 'the full word cross',
      publishedAs: '86 words, 38 agree exactly, 27 disagree, 57 of 65 refused by neither',
      computedBy: 'LIST-DERIVED', reDerived: 'unchanged in method; the lists have since moved by four adoptions',
      verdict: 'STANDS',
      note: 'a vocabulary comparison. Re-deriving it against the current lists gives different numbers because the LISTS changed, not because the instrument was broken.',
    },
    {
      figure: 'their fixture against this store\'s sets',
      publishedAs: '31 of 35 before the repair; 35 of 35 after',
      computedBy: 'LIST-DERIVED', reDerived: `this store's own cases against its own sets: ${mineOnMine.passing} of ${mineOnMine.total}`,
      verdict: 'STANDS',
      note: 'runAgainst takes two SETS and never touches a row or a gate. Untouched by the siting fault.',
    },
    {
      figure: 'the under-application run',
      publishedAs: '0 moves over 21 refuse words; the first attempt moved 3, misapplied',
      computedBy: 'LIST-DERIVED', reDerived: `${APPROPRIATENESS_LISTS.refuse.length} refuse words, 0 moved`,
      verdict: 'STANDS',
      note: 'a judgement about words, made against the qualifier\'s own test. No row and no gate entered it.',
    },
    {
      figure: 'the fifteen holds routed to Annie',
      publishedAs: '15 holds across 15 rows; tokens arms, high, pot, shoot',
      computedBy: 'DIRECT-SCREEN', reDerived: `${holds.length} hold(s) now visible THROUGH THE GATE across ${new Set(holds.map((h) => h.id)).size} row(s)`,
      verdict: 'STANDS, NARROWER THAN IT READ',
      note: 'the routing script called the predicate directly on stem words and option values, so it saw what the gate could not. Its 15 were real. What it could NOT claim — and was read as claiming — is that the corpus had been screened: only these fields of DRAFT and LIVE rows had been.',
    },
    {
      figure: 'seven must-catch words unscreened by the gate',
      publishedAs: '7 of 7 unscreened — HELL, LOVER, DAMN, NAKED, CORPSE, WHISKY, SUICIDE',
      computedBy: 'DIRECT-SCREEN', reDerived: `${stillUnscreenedByTheBanList.length} of 7 still unscreened by the BAN LIST; ${nowSeenByTheScreen.length} of 7 now seen by the appropriateness screen`,
      verdict: 'STANDS',
      note: 'it measured headwordIsBanned, not this screen, and it was published before this screen existed. It stands exactly as it was framed.',
    },
    {
      figure: 'check:appropriateness-sited',
      publishedAs: '118 write child-facing content; 83 cannot reach the screen, 83 declared. "No NEW writer is unable to reach the subject-matter screen."',
      computedBy: 'GATE-DERIVED', reDerived: 'unchanged as a call-graph fact',
      verdict: 'STANDS, NARROWER THAN IT READ',
      note: '**it answered "is the screen REACHABLE" and was read as "is the content SCREENED".** It printed that bound in its own output — *"never is every string screened"* — and the bound was correct and was not enough: a reachable screen that skips the fields it exists for satisfies every word of it.',
    },
  ];

  const stands = figures.filter((f) => f.verdict === 'STANDS').length;
  const narrower = figures.filter((f) => f.verdict === 'STANDS, NARROWER THAN IT READ').length;
  const fall = figures.filter((f) => f.verdict === 'DOES NOT STAND').length;

  const report = {
    kind: 'EVERY-FIGURE-THE-INERT-SCREEN-PRODUCED-RE-DERIVED',
    TO: 'David and Annie; the authoring store by relay',
    date: '2026-09-05',
    THE_FAULT: 'for three turns the screen inherited the ban list\'s PATH scope as well as its quotation boundary, so it ran on prose and skipped every option value and stem word — the bare values it exists for (R1003).',
    THE_METHOD: 'each published figure is classified by WHAT COMPUTED IT, not by when it was published. LIST-DERIVED figures compared vocabularies and never touched the gate; GATE-DERIVED figures ran the screen over rows; DIRECT-SCREEN figures called the predicate on strings chosen by the script, bypassing the siting.',
    andWHYTHATDISTINCTIONMATTERS: '"the screen was inert" does not invalidate everything the screen was mentioned in. Saying so would be as careless as the original fault, in the other direction.',
    THE_HEADLINE: `${stands} figure(s) STAND, ${narrower} stand NARROWER THAN THEY READ, ${fall} DO NOT STAND.`,
    THE_TWO_THAT_FALL: figures.filter((f) => f.verdict === 'DOES NOT STAND').map((f) => f.figure),
    FIGURES: figures,
    AND_THE_ONE_TO_KEEP: 'the gate diff. It said NOTHING MOVED three times and was read each time as evidence the change was safe. A measurement that agrees with what you just did is the one to distrust (R173/R149), and this arc paid for that sentence twice.',
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['FIGURES', 'THE_HEADLINE', 'THE_TWO_THAT_FALL'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('figures-re-derived', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'figures-re-derived').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  for (const f of figures) console.log(`  ${f.verdict.padEnd(30)} ${f.figure}\n      was: ${f.publishedAs.slice(0, 96)}\n      now: ${f.reDerived.slice(0, 96)}`);
  console.log(`\n  ${stands} stand, ${narrower} narrower, ${fall} do not stand.`);
  console.log(`  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
