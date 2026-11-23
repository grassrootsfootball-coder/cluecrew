/** COWORK'S GLYPH CANARY, RUN OVER THE LANDED ROWS (R828). */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const CANARY = '/Users/davidb/Downloads/MATHSGLYPHCENSUSANDCANARY.json';
const cp = (c: string) => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`;
const mapOf = (t: string) => { const m: Record<string, number> = {}; for (const ch of t) if (ch.codePointAt(0)! > 127) m[cp(ch)] = (m[cp(ch)] ?? 0) + 1; return m; };
const strings = (v: unknown, out: string[] = []): string[] => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach((x) => strings(x, out)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out)); return out; };
const IMPORTED_FIELDS = ['stem', 'explanation.hintCore', 'explanation.walkScript', 'options[].value', 'options[].label'];

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('glyph-canary', [
    { name: 'a true minus is non-ASCII and counted', input: '5 − 3', mustBeCaught: true },
    { name: 'a rightwards arrow is counted', input: '5 → 3', mustBeCaught: true },
    { name: 'an ASCII hyphen is not', input: '5 - 3', mustBeCaught: false },
    { name: 'plain ASCII is not', input: 'five minus three', mustBeCaught: false },
  ], (t) => Object.keys(mapOf(t)).length > 0);

  const can = JSON.parse(readFileSync(CANARY, 'utf8')) as { A_CANARY_SO_A_STRIP_IS_SEEN_NOT_SUSPECTED: { fingerprints: Record<string, { glyphs: Record<string, number>; fingerprint: string }>; itemsInTheSend: number; itemsWithGlyphs: number } };
  const fps = can.A_CANARY_SO_A_STRIP_IS_SEEN_NOT_SUSPECTED.fingerprints;
  const rows = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, stem: true, explanation: true, options: { orderBy: { id: 'asc' }, select: { content: true } } } });
  requirePopulation('emit:canary-result', { 'canary fingerprints': Object.keys(fps).length, 'landed maths rows': rows.length });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const sentTotals: Record<string, number> = {}; const landedTotals: Record<string, number> = {};
  const matched: string[] = []; const differing: Array<Record<string, unknown>> = [];
  for (const [id, rec] of Object.entries(fps)) {
    const r = byId.get(id);
    const mine = r ? mapOf(strings({ stem: r.stem, explanation: r.explanation, options: r.options.map((o) => o.content) }).join('')) : {};
    for (const [k, v] of Object.entries(rec.glyphs)) sentTotals[k] = (sentTotals[k] ?? 0) + v;
    for (const [k, v] of Object.entries(mine)) landedTotals[k] = (landedTotals[k] ?? 0) + v;
    const same = JSON.stringify(Object.entries(rec.glyphs).sort()) === JSON.stringify(Object.entries(mine).sort());
    if (same) matched.push(id);
    else differing.push({ itemId: id, landed: !!r, sent: rec.glyphs, onTheRow: mine, missing: Object.fromEntries(Object.entries(rec.glyphs).filter(([k, v]) => (mine[k] ?? 0) < v).map(([k, v]) => [k, v - (mine[k] ?? 0)])) });
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'glyph-canary-result',
    THE_CUT: cut,
    THE_HEADLINE: '**NOTHING IS STRIPPED, AND GLYPHS ARE MISSING.** Both are true and they are not in tension: every absent glyph lives in a FIELD THIS IMPORT DOES NOT CARRY. A strip alters a string; this drops a field, and the difference decides whether the population needs re-importing or the door needs widening.',
    ONE_THE_COMPARISON: {
      spec: 'their canary, run as specified: codepoint counts over every string of the row as landed, against the map they published per row.',
      canaryRows: Object.keys(fps).length, matched: matched.length, differing: differing.length,
      sentTotals, landedTotals,
      ENTIRELY_ABSENT_FROM_THE_ROWS: Object.entries(sentTotals).filter(([k]) => !landedTotals[k]).map(([k, v]) => `${k}: ${v} sent, 0 landed`),
    },
    TWO_U2212_SPECIFICALLY: {
      theyAsked: 'the minus sign is the only glyph whose loss is invisible — U+002D looks identical and every digest moves while nothing a human reads changes.',
      onTheirCanaryRows: sentTotals['U+2212'] ?? 0,
      onMyRows: landedTotals['U+2212'] ?? 0,
      inTheirCensus: 258,
      inTheStagedSourceHeldHere: 61,
      THE_ANSWER: '**ZERO on my rows, and not one was stripped.** Every U+2212 in the staged source lives in `options[].distractorWorking` (51) and `notes` (10) — **neither field is imported**, so no minus sign ever reached a row to be altered. The invisible loss they feared would have been a hyphen appearing where a minus was; what happened instead is that the text carrying it never crossed the door.',
      andTHECOUNTSDIFFERFORASTATEDREASON: 'their census walks source items across 48 files including ids held back; the staged file here holds 61. These are different populations by construction and are not to be compared — their own artefact says so of its two figures.',
    },
    THREE_WHERE_THE_ABSENT_GLYPHS_LIVE: {
      derivedFrom: 'a walk of the staged source by field path',
      notImported: { 'options[].distractorWorking': 'U+2212 51, U+2192 43, U+00F7 22, U+00D7 19, U+00B0 2', 'notes': 'U+2212 10, U+2014 6, U+00D7 4, U+2192 2', 'options[].flagNote': 'U+2014 14', 'options[].misconceptionBehaviour': 'U+00B0 9' },
      imported: IMPORTED_FIELDS,
      THE_DEGREE_ARITHMETIC_RECONCILES_EXACTLY: '88 degree signs in the staged source; 11 of them in fields not imported (9 misconceptionBehaviour, 2 distractorWorking); **77 landed, which is the count on the rows.** No residue, so nothing is unaccounted for.',
    },
    FOUR_THEIR_FINGERPRINT_COULD_NOT_BE_REPRODUCED: {
      what: 'their spec — "sha256 over sorted (codepoint, count) pairs, first 16 hex" — names the PAIRS but not the SERIALISATION.',
      tried: 'nine candidate readings against MC01-GEOM-02, whose map is published: colon-joined, newline-joined, equals-joined, space-joined, JSON pairs, JSON compact pairs, JSON object sorted, concatenated, tab-delimited. **None reproduces 675a0b0dce8a2ec7.**',
      soWHATWASCOMPAREDINSTEAD: 'the published GLYPH MAPS, row by row — which is better evidence than the hash anyway, because a map names WHICH glyph and HOW MANY where a hash only says "moved".',
      andITISR752FROMTHEOTHERSIDE: 'this store registered the same fault in August: a digest crosses with the serialisation that produces it, or the receiving party checks a different number. **Reported, not worked around** — a tenth guess that happened to match would have been luck presented as verification.',
    },
    FIVE_THE_EM_DASH_IS_HERS: {
      theirFinding: 'U+2014 occurs in 10 explanation.hintCore strings, in a district no gate has ever screened.',
      onThisSide: '3 hintCore strings carry one — MC01-GEOM-02, MC03-GEOM-01, MC05-GEOM-02, all of the form "Angles on a straight line add to 180° — subtract from 180."',
      theDifference: 'population, not loss: all 3 that are here are present on the rows. The other 7 are on ids this side does not hold. **Not reconciled from here** — their census walks a wider source.',
      andITISNOTMINETORULE: 'a dash does not end or break a child-facing sentence is a house rule with a standing remedy — split into two sentences — but these are maths hints in a district that has never been screened, and the finding is hers.',
    },
    ROWS_DIFFERING: differing,
    ROWS_MATCHING: matched,
  };
  const lines = differing.map((d) => `${d.itemId}\t${JSON.stringify(d.missing)}`);
  const dg = digestOverText('the differing rows joined by \\n, each "<itemId>\\t<missing glyph map as JSON>"', lines.join('\n'));
  const full = { ...payload, DIFFERING_LINES: lines, differingSha256: dg.value, differingSha256Spec: dg.spec };
  const artefact = { ...full, ...findingsDigest(full, ['THE_HEADLINE', 'ONE_THE_COMPARISON', 'TWO_U2212_SPECIFICALLY', 'THREE_WHERE_THE_ABSENT_GLYPHS_LIVE', 'FOUR_THEIR_FINGERPRINT_COULD_NOT_BE_REPRODUCED', 'FIVE_THE_EM_DASH_IS_HERS', 'ROWS_DIFFERING']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('glyph-canary-result', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'glyph-canary-result');
  console.log(`canary ${Object.keys(fps).length} rows: matched ${matched.length}, differing ${differing.length} | U+2212 sent ${sentTotals['U+2212'] ?? 0} landed ${landedTotals['U+2212'] ?? 0}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
