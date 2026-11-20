/**
 * ENGLISH TELL-REPAIR PACKETS (R1028/R1029). Reads the tell measure's per-row output (`--out` of
 * measure-english-tells.ts) and packets every LIVE comprehension row on which a FAILING tell points at
 * the key, plus the two rows whose distractors restate the stem, into four doors under
 * `english-rewrite/tells/<A|B|C|D>` (by passage group, so parallel drafters never share a passage).
 * The door path sits under english-rewrite/, so `land-proposals` writes the changeset that returns every
 * change to the authoring store (R1023 condition 5).
 *
 * Each row carries, per option, the surface features the tells read (comma, two-part, words, overlap
 * with the cited lines, "not"), so a drafter can see exactly which tell it is breaking.
 *
 *   tsx scripts/agent-review/export-english-tells-packets.ts --measure=<measure-out.json>
 *   ROUND 2+: --round=r2 --rows=<json list of itemIds>  packets exactly those rows into tells/r2/<door>, each
 *   carrying the near-twin pick and the previous round's reviewer findings for it (previousRound).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const REPO = pjoin(__dirname, '..', '..');
const MEASURE = process.argv.find((a) => a.startsWith('--measure='))?.slice(10);
const ROUND = process.argv.find((a) => a.startsWith('--round='))?.slice(8);
const ROWS = process.argv.find((a) => a.startsWith('--rows='))?.slice(7);
// The tells the target fails on, and the types it fails them in (null = every type).
const FAILING: Record<string, string[] | null> = {
  'longest (words)': ['en-comp-retrieval', 'en-comp-inference'],
  'most words shared with the cited lines': ['en-comp-retrieval'],
  'most words shared with the whole passage': ['en-comp-retrieval'],
  'the only option containing "not"/"n\'t"': ['en-comp-inference'],
  'the only two-part option (", and"/"while"/"but")': null,
  'the only option with a comma': null,
};
const DOORS: Record<string, string[]> = { A: ['G1', 'G2'], B: ['G3', 'G4'], C: ['G5', 'G6'], D: ['G7'] };
const UNGROUPED = new Set(['stream-b-01']);
const STOP = new Set('a an the and or but of to in on at by for with from as is are was were be been it its this that these those he she they his her their him them i you we us our your my me not no so if then than there here what which who whom when where why how do does did has have had will would can could should may might must just into out up down over very too all each also only own same such some any more most other about after before again off once'.split(' '));
const toks = (s: string) => (s.toLowerCase().match(/[a-z']+/g) ?? []).map((w) => w.replace(/'s$/, '').replace(/(ing|ed|es|s)$/, '')).filter((w) => w.length > 2 && !STOP.has(w));

async function main() {
  if (!MEASURE) throw new Error('pass --measure=<measure-english-tells --out file>');
  const m = JSON.parse(readFileSync(MEASURE, 'utf8')) as { perRow: Array<{ itemId: string; type: string; tellsPointingAtKey: string[]; distractorsRestatingStem: string[] }> };
  const explicit = ROWS ? new Set(JSON.parse(readFileSync(ROWS, 'utf8')) as string[]) : null;
  const chosen = explicit ? m.perRow.filter((r) => explicit.has(r.itemId)) : m.perRow.filter((r) => r.distractorsRestatingStem.length || r.tellsPointingAtKey.some((t) => t in FAILING && (FAILING[t] === null || FAILING[t]!.includes(r.type))));
  requirePopulation('english-tells-packets', { 'rows a failing tell exposes': chosen.length });
  const groups = JSON.parse(readFileSync(pjoin(REPO, 'content', 'agent-review', 'english', 'groups.json'), 'utf8')) as Record<string, string[]>;
  const entries = await prisma.misconception.findMany({ where: { id: { startsWith: 'en-' }, status: 'ACTIVE', approvedBy: { in: ['reviewer:rev-0001', 'reviewer:rev-agent-01'] } }, select: { id: true, description: true, childHint: true } });
  const entryMap = Object.fromEntries(entries.map((e) => [e.id, { description: e.description, childHint: e.childHint }]));
  const byDoor = new Map<string, { rows: unknown[]; passages: Record<string, unknown> }>();
  for (const c of chosen) {
    const r = await prisma.item.findUniqueOrThrow({ where: { id: c.itemId }, select: { id: true, status: true, questionTypeId: true, stem: true, lineRefs: true, explanation: true,
      options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
    if (r.status !== 'LIVE') throw new Error(`${r.id} is ${r.status}; the measure read LIVE rows — re-run the measure`);
    const ref = (r.stem as { passageRef?: string }).passageRef ?? '';
    const g = Object.entries(groups).find(([, refs]) => refs.includes(ref))?.[0];
    // groups.json lists only passages that had DRAFTS when it was written; a passage with none (stream-b-01,
    // ENG-028) is placed in door D by name rather than refused or guessed.
    const door = Object.entries(DOORS).find(([, gs]) => g && gs.includes(g))?.[0] ?? (g === undefined && UNGROUPED.has(ref) ? 'D' : undefined);
    if (!door) throw new Error(`${r.id}: passage ${ref} is in no door`);
    const f = pjoin(REPO, 'content', 'passages', `${ref}.json`);
    if (!existsSync(f)) throw new Error(`${r.id}: passage file ${ref} missing`);
    const lines = (JSON.parse(readFileSync(f, 'utf8')).numberedLines ?? []) as Array<{ n: number | null; text: string }>;
    const refs = Array.isArray(r.lineRefs) ? (r.lineRefs as number[]) : [];
    const win = new Set(toks((refs.length ? lines.filter((l) => l.n !== null && refs.includes(l.n)) : lines).map((l) => l.text).join(' ')));
    const d = byDoor.get(door) ?? byDoor.set(door, { rows: [], passages: {} }).get(door)!;
    const prevDir = pjoin(REPO, 'content', 'agent-review', 'english-rewrite', 'tells', door);
    const prev = ROUND && existsSync(pjoin(prevDir, 'proposal-review.json')) ? (() => {
      const rv = JSON.parse(readFileSync(pjoin(prevDir, 'proposal-review.json'), 'utf8')) as { changes: Array<{ ref: string; verdict: string; reason?: string }>; rows: Array<{ itemId: string; verdict: string; reason?: string }> };
      const pr = JSON.parse(readFileSync(pjoin(prevDir, 'proposals.json'), 'utf8')) as { seats?: Array<{ itemId: string; optionId: string }> };
      const refs = new Set((pr.seats ?? []).filter((s) => s.itemId === r.id).map((s) => `seat:${s.optionId}`));
      return { reviewOfRow: rv.rows.find((x) => x.itemId === r.id) ?? null, reviewOfChanges: rv.changes.filter((c) => refs.has(c.ref)) };
    })() : null;
    d.passages[ref] ??= { numberedLines: lines };
    d.rows.push({ itemId: r.id, questionType: r.questionTypeId, passageRef: ref, stem: r.stem, lineRefs: r.lineRefs, explanation: r.explanation,
      tellsPointingAtKey: c.tellsPointingAtKey.filter((t) => t in FAILING || (ROUND && t === 'key is in the closest near-twin pair')), distractorsRestatingStem: c.distractorsRestatingStem,
      ...(ROUND ? { keyInClosestNearTwinPair: (c as { picks?: Record<string, string> }).picks?.['key is in the closest near-twin pair'] === 'key', previousRound: prev } : {}),
      options: r.options.map((o) => { const v = String((o.content as { value?: unknown })?.value ?? ''); const t = toks(v);
        return { optionId: o.id, value: v, isKey: o.isCorrect, tag: o.misconceptionId, execution: o.misconceptionExecution?.trim() || null,
          features: { comma: v.includes(','), twoPart: /,\s*(and|but)\b|\bwhile\b|\band\b.*\band\b/i.test(v), words: v.split(/\s+/).length,
            windowOverlap: t.length ? Number((t.filter((w) => win.has(w)).length / t.length).toFixed(2)) : 0, not: /\bnot\b|n't\b/i.test(v) } }; }) });
  }
  for (const [door, d] of byDoor) {
    const dir = pjoin(REPO, 'content', 'agent-review', 'english-rewrite', 'tells', ...(ROUND ? [ROUND] : []), door); mkdirSync(dir, { recursive: true });
    writeFileSync(pjoin(dir, 'packet.json'), JSON.stringify({ door: `english-rewrite/tells/${ROUND ? `${ROUND}/` : ''}${door}`, questionType: 'english', ruling: 'R1029', entries: entryMap, passages: d.passages, rows: d.rows }, null, 1));
    console.log(`  tells/${ROUND ? `${ROUND}/` : ''}${door}: ${d.rows.length} rows on ${Object.keys(d.passages).length} passage(s)`);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
