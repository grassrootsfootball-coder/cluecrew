/**
 * THE CALIBRATION SAMPLE — a blind check of the machine reviewer against the person it stands in for
 * (David, 2026-11-22 — R1031).
 *
 * Since R1021, `rev-agent-01` is the last signer on 761 LIVE rows. Nobody has measured how often a
 * person would sign what it signs, so every figure since R1021 rests on a judgement whose error rate
 * is unknown. This draws a stratified sample, renders it for Annie WITHOUT anything that says what the
 * machine decided, and keeps the answer key in a separate file she never receives.
 *
 * TWO KINDS OF CARD, INDISTINGUISHABLE ON THE PAGE:
 *   - SIGNED: a LIVE row whose latest item signature is rev-agent-01's, rendered as it stands.
 *   - HELD:   a whole-row REBUILD the machine reviewer HELD, rendered as it was proposed.
 * Without the held cards every card would be one the machine passed, and her sign rate would be the
 * only number, with no test of whether the machine's refusals are right as well.
 *
 * BLINDNESS IS ASSERTED, NOT HOPED FOR. Every card is screened for anything that would tell her which
 * kind it is (reviewer ids, verdict words, door and round names, item ids), by a screen that proves
 * itself on carried cases first (R721). Option order is shuffled per card from the seed, because a
 * rebuild lists its key first and a generated LIVE row may too. Fields shown are the same for both
 * kinds within a district: English and maths cards show the item hint and walk script; VR cards show
 * neither, because a held VR rebuild carries no walk script to show (stated on the page and in the key).
 *
 * WHAT IT WRITES (content/agent-review/calibration/<n>/):
 *   - cards-<hash>.json + review-<hash>.html — for Annie. Delivered to the outbound folder.
 *   - key.json — for us. Which card is which, the machine's verdict and its reason. NEVER delivered.
 *
 *   tsx scripts/agent-review/export-calibration-sample.ts [--sample=01] [--seed=calibration-01] [--no-deliver]
 *
 * Reads: Item, ItemOption, Misconception, AttributionEvent (live); content/agent-review/**\/proposal-review*.json,
 * proposals*.json and packet.json (held rebuilds); content/passages/<ref>.json.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join as pjoin, relative } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { assertFixture } from '../lib/carried-fixture';
import { deliver, stampedName } from '../lib/export-destination';
import { requirePopulation } from '../lib/population';

const REPO = pjoin(__dirname, '..', '..');
const AR = pjoin(REPO, 'content', 'agent-review');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const SAMPLE = arg('sample') ?? '01';
const SEED = arg('seed') ?? `calibration-${SAMPLE}`;
const NO_DELIVER = process.argv.includes('--no-deliver');
const OUT = pjoin(AR, 'calibration', SAMPLE);

/** The design, stated once. Machine-signed rows by district, and machine-held rebuilds by district. */
const SIGNED_BY_DISTRICT: Record<string, number> = { ENGLISH: 13, VR: 13, MATHS: 6 };
const HELD_BY_DISTRICT: Record<string, number> = { ENGLISH: 4, VR: 4 };
/** Districts whose cards show the item hint and walk script (see the header for why VR does not). */
const SHOWS_GUIDANCE = new Set(['ENGLISH', 'MATHS']);

// ---------- seeded randomness: the draw is reproducible from SEED alone ----------
function rng(seed: string) {
  let s = createHash('sha256').update(seed).digest().readUInt32LE(0);
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rand = rng(SEED);
const shuffle = <T,>(xs: readonly T[], r = rand): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; };
const sha16 = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

// ---------- the blinding screen, proven before it is trusted ----------
const LEAKS: Array<[string, RegExp]> = [
  ['a reviewer id', /\brev-(agent-)?\d+|\brev-agent\b/i],
  ['a verdict word', /\b(SIGNED|SIGN|HOLD|HELD|ATTEST(ED)?|REFUSE[D]?|LIVE|DRAFT)\b/],
  ['a round or door name', /\bround[- ]?\d|\bproposals?(-round\d+)?\.json|\bpacket\.json|english-rewrite|patterns\//i],
  ['the machine reviewer', /machine reviewer|agent review|proposing agent|drafting agent/i],
];
const leakIn = (text: string): string | null => { for (const [what, re] of LEAKS) if (re.test(text)) return what; return null; };
assertFixture('calibration blinding screen', [
  { name: 'a machine verdict left in an execution', input: 'The row was SIGNED by rev-agent-01 after round 2.', mustBeCaught: true },
  { name: 'a door path left in a note', input: 'see english-rewrite/G5 proposals-round3.json', mustBeCaught: true },
  { name: 'a status word', input: 'This one is LIVE.', mustBeCaught: true },
  { name: 'ordinary passage text that says "held" in lower case', input: 'She held the lantern up and the light fell on the door.', mustBeCaught: false },
  { name: 'an ordinary execution', input: "The child takes 7 - 2 = 5 in the ones column instead of exchanging a ten, so reads 45.", mustBeCaught: false },
], (s) => leakIn(s) !== null);

// ---------- shapes ----------
interface CardOption { letter: string; value: string; isKey: boolean; tag: string | null; tagChildHint: string | null; execution: string | null }
interface Card {
  card: number; district: string; questionType: string;
  passage: { ref: string; title: string | null; lines: Array<{ n: number | null; text: string }> } | null;
  lineRefs: number[] | null;
  questionLines: string[];
  otherStemFields: Record<string, unknown>;
  options: CardOption[];
  hint: string | null; walkScript: string | null; guidanceShown: boolean;
}
interface KeyRow { card: number; itemId: string; kind: 'SIGNED' | 'HELD'; district: string; questionType: string; machineVerdict: 'SIGN' | 'HOLD'; machineReason: string; source: string; optionIdsInShownOrder: string[] }

const valOf = (c: unknown): string => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(', ') : typeof x === 'string' ? x : JSON.stringify(x ?? null); };

/** The lines a child reads, in the order `PlainItem` renders them, plus `text` (English and maths). */
const RENDERED = ['text', 'prompt', 'word1', 'word2', 'sentence', 'wordWithGap', 'sum', 'words', 'pairA', 'stemWord', 'clues', 'question', 'code', 'series'];
/** Structure, not content: never shown to a child as text. Everything else not rendered is shown as a field (R57: nothing is dropped unseen). */
const META = new Set(['passageRef', 'orderAnchor', 'operands', 'quotes', 'lineRefs']);
function renderStem(stem: Record<string, unknown>): { lines: string[]; other: Record<string, unknown> } {
  const lines: string[] = [];
  if (typeof stem.text === 'string') lines.push(stem.text);
  if (typeof stem.prompt === 'string') lines.push(stem.prompt);
  if (typeof stem.word1 === 'string' && typeof stem.word2 === 'string') lines.push(`${stem.word1}   (${stem.word2})`);
  if (typeof stem.sentence === 'string') lines.push(stem.sentence);
  if (typeof stem.wordWithGap === 'string') lines.push(stem.wordWithGap);
  if (typeof stem.sum === 'string') lines.push(stem.sum);
  if (Array.isArray(stem.words)) lines.push((stem.words as string[]).join(',  '));
  if (Array.isArray(stem.pairA) && typeof stem.stemWord === 'string') lines.push(`${(stem.pairA as string[]).join(' is to ')} as ${stem.stemWord} is to …`);
  if (Array.isArray(stem.clues)) lines.push(...(stem.clues as string[]));
  if (typeof stem.question === 'string') lines.push(stem.question);
  if (stem.code && typeof stem.code === 'object') lines.push(Object.entries(stem.code as Record<string, string>).map(([a, b]) => `${a} = ${b}`).join(',  '));
  if (Array.isArray(stem.series)) lines.push(`${(stem.series as Array<string | number>).join(',  ')}, …`);
  const other: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(stem)) if (!RENDERED.includes(k) && !META.has(k) && !k.startsWith('_')) other[k] = v;
  return { lines, other };
}

const passageCache = new Map<string, Card['passage']>();
function passage(ref: string | undefined): Card['passage'] {
  if (!ref) return null;
  if (passageCache.has(ref)) return passageCache.get(ref)!;
  const f = pjoin(REPO, 'content', 'passages', `${ref}.json`);
  if (!existsSync(f)) throw new Error(`passage ${ref}: file missing — a card cannot be read without its passage`);
  const p = JSON.parse(readFileSync(f, 'utf8')) as { numberedLines?: Array<{ n: number | null; text: string }>; sceneTitle?: string; work?: { title?: string } | string };
  if (!Array.isArray(p.numberedLines) || p.numberedLines.length === 0) throw new Error(`passage ${ref}: no numberedLines (R173: refuse a shape, never return empty)`);
  const title = typeof p.work === 'string' ? p.work : p.work?.title ?? p.sceneTitle ?? null;
  const out = { ref, title, lines: p.numberedLines.map((l) => ({ n: l.n, text: l.text })) };
  passageCache.set(ref, out);
  return out;
}

/** Proportional allocation by largest remainder, at least one per type while the budget lasts. */
function allocate(byType: Map<string, number>, budget: number): Map<string, number> {
  const types = shuffle([...byType.keys()].sort());
  const out = new Map<string, number>();
  if (budget <= types.length) { for (const t of types.slice(0, budget)) out.set(t, 1); return out; }
  const total = [...byType.values()].reduce((a, b) => a + b, 0);
  for (const t of types) out.set(t, 1);
  let left = budget - types.length;
  const want = types.map((t) => ({ t, w: (byType.get(t)! / total) * left }));
  for (const { t, w } of want) { out.set(t, out.get(t)! + Math.floor(w)); }
  left = budget - [...out.values()].reduce((a, b) => a + b, 0);
  for (const { t } of want.sort((a, b) => (b.w % 1) - (a.w % 1)).slice(0, left)) out.set(t, out.get(t)! + 1);
  return out;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const library = new Map((await prisma.misconception.findMany({ select: { id: true, childHint: true } })).map((m) => [m.id, m.childHint]));
  const qtDistrict = new Map((await prisma.questionType.findMany({ select: { id: true, district: true } })).map((q) => [q.id, String(q.district)]));

  // ---- population 1: LIVE rows whose LATEST item signature is the machine's ----
  const latest = await prisma.$queryRaw<Array<{ recordId: string; reviewerId: string | null; note: string | null }>>`
    select distinct on ("recordId") "recordId", "reviewerId", note from "AttributionEvent"
    where "recordType" = 'item' and action = 'SIGNED' order by "recordId", at desc`;
  const machineLast = new Map(latest.filter((e) => e.reviewerId === 'rev-agent-01').map((e) => [e.recordId, e.note ?? '']));
  const liveRows = await prisma.item.findMany({ where: { status: 'LIVE', id: { in: [...machineLast.keys()] } }, select: { id: true, questionTypeId: true } });
  const signedPop = new Map<string, Map<string, string[]>>(); // district -> type -> ids
  for (const r of liveRows) {
    const d = qtDistrict.get(r.questionTypeId)!;
    const byType = signedPop.get(d) ?? signedPop.set(d, new Map()).get(d)!;
    (byType.get(r.questionTypeId) ?? byType.set(r.questionTypeId, []).get(r.questionTypeId)!).push(r.id);
  }
  const popCounts = Object.fromEntries([...signedPop].map(([d, m]) => [d, [...m.values()].reduce((a, b) => a + b.length, 0)]));
  requirePopulation('calibration:signed', { 'LIVE rows last signed by rev-agent-01': liveRows.length, ...Object.fromEntries(Object.entries(popCounts).map(([d, n]) => [`${d} machine-signed`, n])) });

  // ---- population 2: whole-row rebuilds the machine HELD, with the packet row they were built on ----
  interface HeldCand { itemId: string; questionType: string; district: string; reason: string; source: string; rebuild: { stem: Record<string, unknown>; options: Array<{ optionId: string; value: unknown; isKey: boolean; tag: string | null; execution: string | null }>; explanationPatch?: Record<string, unknown> }; packetRow: Record<string, unknown> | null }
  const held: HeldCand[] = [];
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(pjoin(dir, e.name)) : [pjoin(dir, e.name)]);
  const reviewFiles = walk(AR).filter((f) => /proposal-review(-round\d+)?\.json$/.test(basename(f)) && !f.includes(`${pjoin('calibration', '')}`));
  for (const f of reviewFiles.sort()) {
    const m = /proposal-review(-round\d+)?\.json$/.exec(basename(f))!;
    const pf = pjoin(dirname(f), `proposals${m[1] ?? ''}.json`);
    if (!existsSync(pf)) continue;
    const review = JSON.parse(readFileSync(f, 'utf8')) as { rows?: Array<{ itemId: string; verdict: string; reason?: string }> };
    const props = JSON.parse(readFileSync(pf, 'utf8')) as { rebuilds?: Array<HeldCand['rebuild'] & { itemId: string }> };
    const pk = pjoin(dirname(f), 'packet.json');
    const packetRows = existsSync(pk) ? new Map(((JSON.parse(readFileSync(pk, 'utf8')) as { rows?: Array<Record<string, unknown>> }).rows ?? []).map((r) => [String(r.itemId), r])) : new Map();
    for (const r of review.rows ?? []) {
      if (r.verdict !== 'HOLD') continue;
      const rb = (props.rebuilds ?? []).find((x) => x.itemId === r.itemId);
      if (!rb) continue;
      const qtRow = await prisma.item.findUnique({ where: { id: r.itemId }, select: { questionTypeId: true } });
      if (!qtRow) continue;
      held.push({ itemId: r.itemId, questionType: qtRow.questionTypeId, district: qtDistrict.get(qtRow.questionTypeId)!, reason: r.reason ?? '', source: relative(REPO, f), rebuild: rb, packetRow: packetRows.get(r.itemId) ?? null });
    }
  }
  requirePopulation('calibration:held', { 'whole-row rebuilds the machine held': held.length });

  // ---- the draw ----
  type Pick = { kind: 'SIGNED'; itemId: string } | { kind: 'HELD'; cand: HeldCand };
  const picks: Pick[] = []; const usedItems = new Set<string>();
  // Held first, so a held item never also appears as its own signed later version (two versions of one
  // question on one page would tell her which was which).
  for (const [district, n] of Object.entries(HELD_BY_DISTRICT)) {
    const pool = held.filter((h) => h.district === district && (!SHOWS_GUIDANCE.has(district) || (h.packetRow && typeof h.packetRow.explanation === 'object')));
    const byDoor = new Map<string, HeldCand[]>();
    for (const h of shuffle(pool)) { const door = dirname(h.source); (byDoor.get(door) ?? byDoor.set(door, []).get(door)!).push(h); }
    const doors = shuffle([...byDoor.keys()].sort());
    let got = 0;
    for (let pass = 0; got < n && pass < 50; pass++) for (const d of doors) { if (got >= n) break; const h = byDoor.get(d)!.find((x) => !usedItems.has(x.itemId)); if (h) { picks.push({ kind: 'HELD', cand: h }); usedItems.add(h.itemId); got++; } }
    if (got < n) throw new Error(`held ${district}: wanted ${n}, the population supports ${got} — the design is not met, nothing written`);
  }
  for (const [district, n] of Object.entries(SIGNED_BY_DISTRICT)) {
    const byType = signedPop.get(district);
    if (!byType) throw new Error(`signed ${district}: no machine-signed rows at all`);
    const alloc = allocate(new Map([...byType].map(([t, ids]) => [t, ids.length])), n);
    for (const [t, k] of [...alloc].sort()) {
      const ids = shuffle(byType.get(t)!.filter((id) => !usedItems.has(id)).sort()).slice(0, k);
      if (ids.length < k) throw new Error(`signed ${t}: wanted ${k}, have ${ids.length}`);
      for (const id of ids) { picks.push({ kind: 'SIGNED', itemId: id }); usedItems.add(id); }
    }
  }

  // ---- order: shuffled, then grouped by district, English by passage (her reading time, not a signal) ----
  const DORDER = ['ENGLISH', 'MATHS', 'VR'];
  const ordered = shuffle(picks);
  const districtOf = (p: Pick) => p.kind === 'HELD' ? p.cand.district : qtDistrict.get(liveRows.find((r) => r.id === p.itemId)!.questionTypeId)!;
  const cards: Card[] = []; const key: KeyRow[] = [];
  const liveFull = await prisma.item.findMany({ where: { id: { in: picks.filter((p) => p.kind === 'SIGNED').map((p) => (p as { itemId: string }).itemId) } },
    select: { id: true, questionTypeId: true, stem: true, explanation: true, lineRefs: true, options: { orderBy: { id: 'asc' }, select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
  const built: Array<{ district: string; passageRef: string; card: Omit<Card, 'card'>; key: Omit<KeyRow, 'card'> }> = [];
  for (const p of ordered) {
    const district = districtOf(p);
    let stem: Record<string, unknown>; let opts: Array<{ id: string; value: string; isKey: boolean; tag: string | null; execution: string | null }>;
    let explanation: Record<string, unknown> | null; let lineRefs: number[] | null; let questionType: string; let k: Omit<KeyRow, 'card'>;
    if (p.kind === 'SIGNED') {
      const row = liveFull.find((r) => r.id === p.itemId)!;
      stem = row.stem as Record<string, unknown>; explanation = (row.explanation ?? null) as Record<string, unknown> | null;
      lineRefs = Array.isArray(row.lineRefs) ? (row.lineRefs as number[]) : null; questionType = row.questionTypeId;
      opts = row.options.map((o) => ({ id: o.id, value: valOf(o.content), isKey: o.isCorrect, tag: o.misconceptionId, execution: o.misconceptionExecution }));
      k = { itemId: row.id, kind: 'SIGNED', district, questionType, machineVerdict: 'SIGN', machineReason: machineLast.get(row.id) ?? '', source: 'LIVE row as it stands (latest item signature: rev-agent-01)', optionIdsInShownOrder: [] };
    } else {
      const h = p.cand;
      stem = h.rebuild.stem;
      const base = (h.packetRow?.explanation ?? null) as Record<string, unknown> | null;
      explanation = base || h.rebuild.explanationPatch ? { ...(base ?? {}), ...(h.rebuild.explanationPatch ?? {}) } : null;
      lineRefs = Array.isArray(h.packetRow?.lineRefs) ? (h.packetRow!.lineRefs as number[]) : null; questionType = h.questionType;
      opts = h.rebuild.options.map((o) => ({ id: o.optionId, value: valOf({ value: o.value }), isKey: o.isKey, tag: o.tag, execution: o.execution }));
      k = { itemId: h.itemId, kind: 'HELD', district, questionType, machineVerdict: 'HOLD', machineReason: h.reason, source: h.source, optionIdsInShownOrder: [] };
    }
    if (opts.filter((o) => o.isKey).length !== 1) throw new Error(`${k.itemId}: ${opts.filter((o) => o.isKey).length} keys — a card must have exactly one`);
    const shown = shuffle(opts, rng(`${SEED}:${k.itemId}`));
    k.optionIdsInShownOrder = shown.map((o) => o.id);
    const { lines, other } = renderStem(stem);
    if (lines.length === 0) throw new Error(`${k.itemId}: the stem renders no line a child would read (keys: ${Object.keys(stem).join(', ')})`);
    const guidance = SHOWS_GUIDANCE.has(district);
    const str = (x: unknown) => (typeof x === 'string' && x.trim() ? x : null);
    built.push({ district, passageRef: String(stem.passageRef ?? ''), key: k, card: {
      district, questionType, passage: passage(stem.passageRef as string | undefined), lineRefs, questionLines: lines, otherStemFields: other,
      options: shown.map((o, i) => ({ letter: 'ABCDEF'[i]!, value: o.value, isKey: o.isKey, tag: o.tag, tagChildHint: o.tag ? library.get(o.tag) ?? null : null, execution: o.isKey ? null : o.execution })),
      hint: guidance ? str(explanation?.hintCore) : null, walkScript: guidance ? str(explanation?.walkScript) : null, guidanceShown: guidance,
    } });
  }
  built.sort((a, b) => DORDER.indexOf(a.district) - DORDER.indexOf(b.district) || a.passageRef.localeCompare(b.passageRef));
  built.forEach((b, i) => { cards.push({ card: i + 1, ...b.card }); key.push({ card: i + 1, ...b.key }); });

  // ---- blindness, asserted on every string she will see ----
  const leaks: string[] = [];
  for (const c of cards) {
    const own = [...c.questionLines, JSON.stringify(c.otherStemFields), c.hint ?? '', c.walkScript ?? '', ...c.options.flatMap((o) => [o.value, o.execution ?? '', o.tagChildHint ?? ''])];
    for (const s of own) { const w = leakIn(s); if (w) leaks.push(`card ${c.card}: ${w} in "${s.slice(0, 90)}"`); }
    for (const kr of key) if (own.some((s) => s.includes(kr.itemId))) leaks.push(`card ${c.card}: carries an item id`);
  }
  // Within a district, guidance must be present on both kinds or neither — a field one kind lacks is a tell.
  for (const d of DORDER) {
    const kinds = ['SIGNED', 'HELD'] as const;
    const rate = (kind: string, f: 'hint' | 'walkScript') => { const cs = cards.filter((c, i) => c.district === d && key[i]!.kind === kind); return cs.length ? cs.filter((c) => c[f]).length / cs.length : null; };
    for (const f of ['hint', 'walkScript'] as const) { const [a, b] = kinds.map((k) => rate(k, f)); if (a != null && b != null && Math.abs(a - b) > 0.34) leaks.push(`${d}: ${f} present on ${Math.round(a * 100)}% of one kind and ${Math.round(b * 100)}% of the other — the field itself would tell her`); }
  }
  if (leaks.length) { for (const l of leaks) console.error(`  ✗ ${l}`); throw new Error(`blinding failed on ${leaks.length} point(s); nothing written`); }

  // ---- write ----
  const cardsBody = { kind: 'calibration-cards', sample: SAMPLE, cardCount: cards.length, cards };
  const digest = sha16(JSON.stringify(cardsBody));
  const forAnnie = {
    ...cardsBody,
    digest,
    instructions: 'Read each card as the child meets it, then decide whether you would SIGN it as it stands. Every card was checked by somebody before you; some passed and some did not, in no fixed proportion. Nothing on a card says which, on purpose. Record a verdict on every card. Your return quotes this file\'s digest so it can be matched to this sample.',
  };
  const cardsPath = pjoin(OUT, stampedName('calibration-cards', digest, 'json'));
  writeFileSync(cardsPath, `${JSON.stringify(forAnnie, null, 1)}\n`);
  const template = readFileSync(pjoin(__dirname, 'calibration-review.template.html'), 'utf8');
  if (!template.includes('/*__CARDS__*/null')) throw new Error('review template: the cards placeholder is missing (R87: a substitution that matches nothing is a failure)');
  const html = template.replace('/*__CARDS__*/null', () => JSON.stringify(forAnnie).replace(/</g, '\\u003c'));
  const htmlPath = pjoin(OUT, stampedName('calibration-cards', digest, 'html'));
  writeFileSync(htmlPath, html);
  const keyOut = {
    kind: 'calibration-key', sample: SAMPLE, seed: SEED, cardsDigest: digest, generatedAt: new Date().toISOString(),
    NOT_FOR_THE_REVIEWER: 'This file says which card is which. It must never reach the person reviewing the cards.',
    design: { signedByDistrict: SIGNED_BY_DISTRICT, heldByDistrict: HELD_BY_DISTRICT, guidanceShownFor: [...SHOWS_GUIDANCE],
      guidanceNotShownFor: 'VR — a held VR rebuild carries no walk script, so showing it on signed VR cards only would tell her which they are. VR walk scripts are therefore OUTSIDE this sample.',
      populations: { machineSignedLive: popCounts, machineHeldRebuilds: Object.fromEntries(DORDER.map((d) => [d, held.filter((h) => h.district === d).length])) } },
    key,
  };
  writeFileSync(pjoin(OUT, 'key.json'), `${JSON.stringify(keyOut, null, 1)}\n`);

  console.log(`\ncalibration sample ${SAMPLE} (seed "${SEED}") — ${cards.length} cards, digest ${digest}`);
  console.log(`  population screened: ${liveRows.length} machine-signed LIVE rows (${Object.entries(popCounts).map(([d, n]) => `${d} ${n}`).join(', ')}); ${held.length} held rebuilds`);
  for (const d of DORDER) console.log(`  ${d.padEnd(8)} signed ${key.filter((k) => k.district === d && k.kind === 'SIGNED').length}, held ${key.filter((k) => k.district === d && k.kind === 'HELD').length}  — types: ${[...new Set(key.filter((k) => k.district === d).map((k) => k.questionType))].join(', ')}`);
  console.log(`  blinding screen: 0 leaks across ${cards.length} cards`);
  console.log(`  for Annie: ${relative(REPO, htmlPath)} (+ ${basename(cardsPath)})`);
  console.log(`  key (never delivered): ${relative(REPO, pjoin(OUT, 'key.json'))}`);
  // The HTML alone crosses: it embeds the cards whole, and it is what she opens. Delivering the JSON too
  // would restamp it (deliver marks a JSON's provenance, changing its bytes) and ship two files whose
  // names disagree about one sample (R88). The JSON stays here as the readable record of what she saw.
  if (!NO_DELIVER) console.log(`  delivered → ${deliver(htmlPath, 'calibration-cards')}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
