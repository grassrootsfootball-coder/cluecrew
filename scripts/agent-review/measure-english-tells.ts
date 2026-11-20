/**
 * ENGLISH ANSWER TELLS — surface features that pick the key without reading (2026-11-20, R1028).
 * The multiple-choice classics: the key is the LONGEST option, shares the most words with the passage
 * window or the stem, is the only HEDGED option, or the only one free of an ABSOLUTE word.
 *
 * For each tell and each row, the tell either picks ONE option (a unique extreme) or picks nothing (a tie,
 * or the feature absent). A child using it scores `hits / picks` on the rows where it picks; by chance
 * they would score `1/k`, so the EXPECTED hits are Σ 1/k over the rows where it picks. A tell matters
 * when hits clearly exceed expected AND it picks on enough rows to be worth learning.
 *
 * Option ORDER is shuffled per child, so position is not tested. Reads LIVE rows of the four
 * comprehension types (SPaG items are proofreading tasks with a different option shape).
 *
 *   tsx scripts/agent-review/measure-english-tells.ts [--status=LIVE] [--out=<file>] [--by-type]
 *   --after=<proposals.json>[,<proposals.json>…]   measure the door AS IT WILL STAND once those land
 *   --gate   exit non-zero if any tell is outside x0.5–x1.5 on 30+ picks door-wide, or on 10+ picks within a type
 *   --detail=<file>  per row, per tell: which option the tell picks and whether it is the key
 *
 * TWO-SIDED FOR SURFACE FORM ONLY (R1029). A repair that hands every row's comma to a distractor teaches "never the comma"
 * instead: an elimination tell. The first full measure of the repair found exactly that (comma 0 of 30,
 * cited-line overlap 5%), so a SURFACE-FORM tell below x0.5 fails as well as one above x1.5. A CONTENT tell
 * (overlap with the cited lines, the passage or the stem) is one-sided: an option sharing no words with the
 * lines a question cites is rarely its key in the ORIGINAL authoring too (retrieval x0.05), because ruling
 * out what the text does not say IS reading. Only a content tell that points AT the key fails.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const REPO = pjoin(__dirname, '..', '..');
const STATUS = (process.argv.find((a) => a.startsWith('--status='))?.slice(9) ?? 'LIVE') as 'LIVE' | 'DRAFT';
const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice(6);
const AFTER = (process.argv.find((a) => a.startsWith('--after='))?.slice(8) ?? '').split(',').filter(Boolean);
const GATE = process.argv.includes('--gate');
const DETAIL = process.argv.find((a) => a.startsWith('--detail='))?.slice(9);
const STOP = new Set('a an the and or but of to in on at by for with from as is are was were be been it its this that these those he she they his her their him them i you we us our your my me not no so if then than there here what which who whom when where why how do does did has have had will would can could should may might must just into out up down over very too all each also only own same such some any more most other about after before again off once'.split(' '));
const HEDGE = /\b(mostly|partly|some|sometimes|often|usually|probably|perhaps|possibly|may|might|seems?|largely|mainly|almost|nearly|a little|rather|quite|fairly|at first|for a while)\b/i;
const ABSOLUTE = /\b(always|never|all|every|everyone|everything|nothing|nobody|none|only|completely|totally|entirely|no one|whole|any)\b/i;
const toks = (s: string) => (s.toLowerCase().match(/[a-z']+/g) ?? []).map((w) => w.replace(/'s$/, '').replace(/(ing|ed|es|s)$/, '')).filter((w) => w.length > 2 && !STOP.has(w));

type Opt = { value: string; isKey: boolean };
type Tell = { name: string; content?: boolean; pick: (o: Opt[], ctx: { window: Set<string>; passage: Set<string>; stem: Set<string> }) => number | null };
/** The index of the UNIQUE option with the highest score, or null on a tie / when every score is equal. */
const uniqueMax = (scores: number[]) => { const m = Math.max(...scores); const at = scores.flatMap((s, i) => (s === m ? [i] : [])); return at.length === 1 && scores.some((s) => s !== m) ? at[0]! : null; };
const uniqueMin = (scores: number[]) => uniqueMax(scores.map((s) => -s));
const overlap = (v: string, set: Set<string>) => { const t = toks(v); return t.length ? t.filter((w) => set.has(w)).length / t.length : 0; };
const onlyOne = (flags: boolean[]) => { const at = flags.flatMap((f, i) => (f ? [i] : [])); return at.length === 1 ? at[0]! : null; };

const TELLS: Tell[] = [
  { name: 'longest (characters)', pick: (o) => uniqueMax(o.map((x) => x.value.length)) },
  { name: 'longest (words)', pick: (o) => uniqueMax(o.map((x) => x.value.split(/\s+/).length)) },
  { name: 'shortest (characters)', pick: (o) => uniqueMin(o.map((x) => x.value.length)) },
  { name: 'most words shared with the cited lines', content: true, pick: (o, c) => uniqueMax(o.map((x) => overlap(x.value, c.window))) },
  { name: 'FEWEST words shared with the cited lines', content: true, pick: (o, c) => uniqueMin(o.map((x) => overlap(x.value, c.window))) },
  { name: 'most words shared with the whole passage', content: true, pick: (o, c) => uniqueMax(o.map((x) => overlap(x.value, c.passage))) },
  { name: 'most words shared with the stem', content: true, pick: (o, c) => uniqueMax(o.map((x) => overlap(x.value, c.stem))) },
  { name: 'the only hedged option', pick: (o) => onlyOne(o.map((x) => HEDGE.test(x.value))) },
  { name: 'the only option with no absolute word', pick: (o) => { const abs = o.map((x) => ABSOLUTE.test(x.value)); return abs.filter(Boolean).length === o.length - 1 ? abs.indexOf(false) : null; } },
  { name: 'the only option containing "not"/"n\'t"', pick: (o) => onlyOne(o.map((x) => /\bnot\b|n't\b/i.test(x.value))) },
  // Found by reading the rows behind "longest": keys are often TWO claims joined ("A sprain, and no bones broken").
  { name: 'the only two-part option (", and"/"while"/"but")', pick: (o) => onlyOne(o.map((x) => /,\s*(and|but)\b|\bwhile\b|\band\b.*\band\b/i.test(x.value))) },
  { name: 'the only option with a comma', pick: (o) => onlyOne(o.map((x) => x.value.includes(','))) },
  // REVERSE TELLS: a repair that gives every row's commas to distractors would teach "never the comma" instead.
  { name: 'the only option WITHOUT a comma', pick: (o) => onlyOne(o.map((x) => !x.value.includes(','))) },
  { name: 'the only one-part option', pick: (o) => onlyOne(o.map((x) => !/,\s*(and|but)\b|\bwhile\b|\band\b.*\band\b/i.test(x.value))) },
];

async function main() {
  const rows = await prisma.item.findMany({ where: { id: { startsWith: 'ENG-' }, status: STATUS, questionTypeId: { startsWith: 'en-comp-' } }, orderBy: { id: 'asc' },
    select: { id: true, questionTypeId: true, stem: true, lineRefs: true, options: { select: { id: true, content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
  // AS IT WILL STAND: apply every proposals file's value changes (seats, rebuilds) before measuring.
  for (const f of AFTER) {
    const p = JSON.parse(readFileSync(f, 'utf8')) as { seats?: Array<{ optionId: string; itemId: string; newValue: string }>; rebuilds?: Array<{ itemId: string; stem?: Record<string, unknown>; lineRefs?: number[]; options: Array<{ optionId: string; value: string; isKey: boolean }> }> };
    for (const s of p.seats ?? []) { const o = rows.find((r) => r.id === s.itemId)?.options.find((x) => x.id === s.optionId); if (!o) throw new Error(`${f}: seat ${s.optionId} is not on LIVE ${s.itemId}`); o.content = { ...(o.content as object), value: s.newValue }; }
    for (const b of p.rebuilds ?? []) {
      const r = rows.find((x) => x.id === b.itemId); if (!r) throw new Error(`${f}: rebuild ${b.itemId} is not a LIVE comprehension row`);
      if (b.stem) r.stem = b.stem as typeof r.stem; if (b.lineRefs) r.lineRefs = b.lineRefs;
      for (const bo of b.options) { const o = r.options.find((x) => x.id === bo.optionId); if (!o) throw new Error(`${f}: ${bo.optionId} not on ${b.itemId}`); o.content = { ...(o.content as object), value: bo.value }; o.isCorrect = bo.isKey; }
    }
  }
  requirePopulation('english-tells', { [`${STATUS} English comprehension rows`]: rows.length });
  const passages = new Map<string, Array<{ n: number | null; text: string }>>();
  const res: Record<string, Record<string, { picks: number; hits: number; expected: number }>> = {};
  const perRow: Array<Record<string, unknown>> = [];
  let noPassage = 0;
  for (const r of rows) {
    const stem = r.stem as { text?: string; passageRef?: string };
    const ref = stem.passageRef ?? '';
    if (!passages.has(ref)) { const f = pjoin(REPO, 'content', 'passages', `${ref}.json`); passages.set(ref, existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')).numberedLines ?? []) : []); }
    const lines = passages.get(ref)!;
    if (!lines.length) noPassage++;
    const refs = Array.isArray(r.lineRefs) ? (r.lineRefs as number[]) : [];
    const win = refs.length ? lines.filter((l) => l.n !== null && refs.includes(l.n)) : lines;
    const ctx = { window: new Set(toks(win.map((l) => l.text).join(' '))), passage: new Set(toks(lines.map((l) => l.text).join(' '))), stem: new Set(toks(stem.text ?? '')) };
    const opts: Opt[] = r.options.map((o) => ({ value: String((o.content as { value?: unknown })?.value ?? ''), isKey: o.isCorrect }));
    const k = opts.length; const key = opts.findIndex((o) => o.isKey);
    const hitsHere: string[] = []; const picksHere: Record<string, 'key' | 'distractor'> = {};
    for (const t of TELLS) for (const g of ['ALL', r.questionTypeId]) {
      const p = t.pick(opts, ctx);
      const b = ((res[t.name] ??= {})[g] ??= { picks: 0, hits: 0, expected: 0 });
      if (p === null) continue;
      if (g === 'ALL') picksHere[t.name] = p === key ? 'key' : 'distractor';
      b.picks++; b.expected += 1 / k; if (p === key) { b.hits++; if (g === 'ALL') hitsHere.push(t.name); }
    }
    // A DISTRACTOR THAT RESTATES THE STEM can be ruled out without reading (ENG-028-PR-09: "The traffic
    // under the boards has changed." for "How has the traffic under the boards changed?").
    const echoes = opts.filter((o) => !o.isKey).filter((o) => { const t = toks(o.value); return t.length >= 3 && t.filter((w) => ctx.stem.has(w)).length / t.length >= 0.8; }).map((o) => o.value);
    perRow.push({ itemId: r.id, type: r.questionTypeId, k, tellsPointingAtKey: hitsHere, picks: picksHere, distractorsRestatingStem: echoes });
  }
  console.log(`English answer tells — ${rows.length} ${STATUS} comprehension rows (${noPassage} with no passage text found)${AFTER.length ? ` — AS IT WILL STAND after ${AFTER.length} proposal file(s)` : ''}`);
  console.log('  tell'.padEnd(48) + 'picks   key   chance   x chance   accuracy when it picks');
  for (const [name, by] of Object.entries(res)) {
    const a = by.ALL!;
    const ratio = a.expected ? a.hits / a.expected : 0;
    console.log(`  ${name.padEnd(46)}${String(a.picks).padStart(5)}${String(a.hits).padStart(6)}${a.expected.toFixed(1).padStart(9)}${ratio.toFixed(2).padStart(10)}   ${a.picks ? Math.round((100 * a.hits) / a.picks) : 0}%${ratio >= 1.5 && a.picks >= 30 ? '   ◀ TELL' : ''}`);
  }
  if (process.argv.includes('--by-type')) for (const [name, by] of Object.entries(res)) for (const [g, b] of Object.entries(by)) if (g !== 'ALL' && b.picks >= 10)
    console.log(`    ${name} / ${g}: ${b.hits} of ${b.picks} (chance ${b.expected.toFixed(1)}, x${(b.hits / b.expected).toFixed(2)})`);
  // CONVERGENCE (R1029, found by the door-C reviewer): when two options are near-twins, the key is usually
  // one of them — "the answer is one of the two nearly identical options". The tell picks a PAIR, so chance
  // is 2/k. Similarity is Jaccard over content words; a pair counts only if it is the unique closest pair and
  // shares at least half its words.
  const pairName = 'key is in the closest near-twin pair';
  for (const r of rows) {
    const opts = r.options.map((o) => ({ t: new Set(toks(String((o.content as { value?: unknown })?.value ?? ''))), isKey: o.isCorrect }));
    const sims: Array<[number, number, number]> = [];
    for (let i = 0; i < opts.length; i++) for (let j = i + 1; j < opts.length; j++) {
      const a = opts[i]!.t, b = opts[j]!.t; const inter = [...a].filter((w) => b.has(w)).length; const uni = new Set([...a, ...b]).size;
      sims.push([uni ? inter / uni : 0, i, j]);
    }
    sims.sort((x, y) => y[0] - x[0]);
    if (!sims.length || sims[0]![0] < 0.5 || (sims[1] && sims[1][0] === sims[0]![0])) continue;
    const [, i, j] = sims[0]!; const hit = opts[i]!.isKey || opts[j]!.isKey;
    for (const g of ['ALL', r.questionTypeId]) { const b = ((res[pairName] ??= {})[g] ??= { picks: 0, hits: 0, expected: 0 }); b.picks++; b.expected += 2 / opts.length; if (hit) b.hits++; }
    const pr = perRow.find((x) => x.itemId === r.id); if (pr) (pr.picks as Record<string, string>)[pairName] = hit ? 'key' : 'distractor';
  }
  { const a = res[pairName]?.ALL; if (a) console.log(`  ${pairName.padEnd(46)}${String(a.picks).padStart(5)}${String(a.hits).padStart(6)}${a.expected.toFixed(1).padStart(9)}${(a.hits / a.expected).toFixed(2).padStart(10)}   ${Math.round((100 * a.hits) / a.picks)}%  (chance is 2/k: the tell picks a pair)`); }
  const failing: string[] = [];
  for (const [name, by] of Object.entries(res)) for (const [g, b] of Object.entries(by)) {
    const floor = g === 'ALL' ? 30 : 10;
    const x = b.expected ? b.hits / b.expected : 1;
    const content = TELLS.find((t) => t.name === name)?.content === true;
    if (b.picks >= floor && (x > 1.5 || (!content && x < 0.5))) failing.push(`${name} / ${g}: ${b.hits} of ${b.picks} (x${x.toFixed(2)}${x < 0.5 ? ', an ELIMINATION tell' : ''})`);
  }
  console.log(`  target (surface tells within x0.5–x1.5, content tells at most x1.5; 30+ picks door-wide or 10+ within a type): ${failing.length ? `${failing.length} FAILING` : 'MET'}`);
  for (const x of failing) console.log(`    ✗ ${x}`);
  if (GATE && failing.length) process.exitCode = 1;
  const echo = perRow.filter((r) => (r.distractorsRestatingStem as string[]).length);
  console.log(`  distractors that restate the stem (>= 80% of their words from it): ${echo.length} row(s)${echo.length ? ' — ' + echo.map((r) => r.itemId).join(', ') : ''}`);
  if (DETAIL) writeFileSync(DETAIL, JSON.stringify(perRow.map((r) => ({ itemId: r.itemId, type: r.type, k: r.k, picks: r.picks })), null, 1));
  if (OUT) writeFileSync(OUT, JSON.stringify({ measuredAt: new Date().toISOString(), status: STATUS, rows: rows.length, results: res, perRow }, null, 1));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
