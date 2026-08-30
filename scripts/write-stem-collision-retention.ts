/**
 * THE NOTE IS RIGHT AND THE ROW CATCHES UP (David, 2026-08-30 — R900).
 *
 * The restore events on `MC04-FDP-04` and `MC05-FDP-01` state: *the unchosen variant is recorded on
 * the row and is NOT discarded.* It was not. Both stems carried one key. **A note claiming a
 * retention that does not exist is worse than no note, because it stops anyone looking** — so the
 * retention is written rather than the note corrected.
 *
 * **THE UNCHOSEN VARIANT COMES FROM COWORK'S CROSSED BYTES, NOT FROM ME.** It is authored content
 * and this store does not author it (CLAUDE.md). The source file and its digest travel with it, and
 * the chosen variant is asserted byte-identical to what the row already serves before anything is
 * written — if the store and the send disagree about which variant is live, that is a different
 * fault and this refuses rather than papering over it.
 *
 * **THE SIGNATURE SURVIVES BY DESIGN, AND IT IS ASSERTED ANYWAY.** `_`-prefixed keys are stripped
 * from the retention-EXCLUDED projection, and both rows' pins are under that projection — so a
 * retention key cannot move them. That is exactly what R858 stripped retention FOR. The excluded
 * hash is computed before and after and required to be identical; anything else rolls back.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const IDS = ['MC04-FDP-04', 'MC05-FDP-01'];

const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v;
const excluded = (r: { stem: unknown; explanation: unknown; options: Array<{ content: unknown; isCorrect: boolean }> }) =>
  sha(canonicalJson(strip({ stem: r.stem, options: r.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation }) as object));

interface Sent { itemId: string; stem?: unknown; options?: Array<Record<string, unknown>> }
function* rowsIn(o: unknown): Generator<Sent> {
  if (Array.isArray(o)) { for (const v of o) yield* rowsIn(v); return; }
  if (o && typeof o === 'object') {
    const r = o as Record<string, unknown>;
    if (typeof r.itemId === 'string' && Array.isArray(r.options)) yield r as unknown as Sent;
    for (const v of Object.values(r)) yield* rowsIn(v);
  }
}
const stemTextOf = (s: unknown) => typeof s === 'string' ? s : (s as { text?: string } | null)?.text ?? null;

/** Every distinct variant of one id across the crossed sends, each carrying where it was found. */
function variantsOf(itemId: string) {
  const byStem = new Map<string, { stem: string; options: Array<Record<string, unknown>>; files: string[]; digests: string[] }>();
  for (const name of readdirSync(pjoin(homedir(), 'Downloads')).filter((n) => n.endsWith('.json')).sort()) {
    let text: string;
    try { text = readFileSync(pjoin(homedir(), 'Downloads', name), 'utf8'); } catch { continue }
    if (!text.includes(itemId)) continue;
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { continue }
    const digest = sha(text).slice(0, 16);
    for (const r of rowsIn(parsed)) {
      if (r.itemId !== itemId) continue;
      const stem = stemTextOf(r.stem);
      if (!stem) continue;
      const e = byStem.get(stem) ?? { stem, options: r.options ?? [], files: [], digests: [] };
      if (!e.files.includes(name)) { e.files.push(name); e.digests.push(digest); }
      byStem.set(stem, e);
    }
  }
  return [...byStem.values()];
}

async function run() {
  assertFixture('collision-variants', [
    { name: 'a colliding id yields more than one variant from the crossed bytes', input: 'MC04-FDP-04', mustBeCaught: true },
    { name: 'the second colliding id does too', input: 'MC05-FDP-01', mustBeCaught: true },
    { name: 'a non-colliding id yields exactly one', input: 'MC01-NPV-03', mustBeCaught: false },
  ], (id) => variantsOf(id).length > 1);

  const results: Array<Record<string, unknown>> = [];
  const refusals: string[] = [];
  for (const id of IDS) {
    const row = await prisma.item.findUniqueOrThrow({ where: { id }, select: { id: true, stem: true, explanation: true, options: { select: { content: true, isCorrect: true } } } });
    const liveStem = stemTextOf(row.stem);
    const variants = variantsOf(id);
    if (variants.length !== 2) { refusals.push(`${id}: ${variants.length} variants in the crossed bytes, expected 2`); continue; }
    const chosen = variants.find((v) => v.stem === liveStem);
    const unchosen = variants.find((v) => v.stem !== liveStem);
    if (!chosen || !unchosen) { refusals.push(`${id}: the live stem is in NO crossed variant — the store and the sends disagree about what this row serves, which is a different fault`); continue; }
    results.push({ itemId: id, chosenIsLiveByteForByte: true, chosen: chosen.stem, unchosen: unchosen.stem,
      unchosenOptions: unchosen.options, foundIn: unchosen.files.length, digests: unchosen.digests.slice(0, 3),
      excludedHashBefore: excluded(row) });
  }
  requirePopulation('write:stem-collision-retention', { 'row(s) whose note promises a retention': IDS.length, 'row(s) resolved from crossed bytes': results.length });
  if (refusals.length) { console.error(refusals.join('\n')); process.exit(1); }

  if (APPLY) {
    await prisma.$transaction(async (tx) => {
      for (const r of results) {
        const row = await tx.item.findUniqueOrThrow({ where: { id: r.itemId as string }, select: { stem: true, explanation: true, options: { select: { content: true, isCorrect: true } } } });
        await tx.item.update({ where: { id: r.itemId as string }, data: { stem: {
          ...(row.stem as Record<string, unknown>),
          _stemCollisionResolved: {
            chosen: r.chosen, unchosen: r.unchosen, unchosenOptions: r.unchosenOptions,
            ruledBy: 'Annie', authority: 'her restore of 2026-08-29 — "the variant restored is the one she read"',
            source: 'Cowork\'s crossed sends; the unchosen variant is their bytes, not this store\'s wording',
            foundInCrossedFiles: r.foundIn, sampleDigests: r.digests,
            andWHYITISHERE: 'the restore note said the unchosen variant was recorded on the row and it was not. The note is right and the row has caught up (R900).',
          },
        } } });
        const after = await tx.item.findUniqueOrThrow({ where: { id: r.itemId as string }, select: { stem: true, explanation: true, options: { select: { content: true, isCorrect: true } } } });
        const now = excluded(after);
        if (now !== r.excludedHashBefore) throw new Error(`${r.itemId}: the retention moved the pinned projection (${r.excludedHashBefore} -> ${now}) — rolling back`);
        await tx.attributionEvent.create({ data: {
          recordType: 'item', recordId: r.itemId as string, action: 'AMENDED', reviewerId: null,
          actor: 'machine:retention', recordedBy: 'human:david', field: 'stem._stemCollisionResolved',
          subjectHash: now,
          method: 'the unchosen collision variant written onto the row from Cowork\'s crossed bytes, as the restore event said it had been. The signature is untouched: the pin is under the retention-EXCLUDED projection and the hash is identical before and after, asserted inside the transaction.',
          note: 'a note claiming a retention that does not exist is worse than no note, because it stops anyone looking. The note was right; the row has caught up.',
        } });
      }
    });
  }

  const full = {
    kind: 'stem-collision-retention', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_NOTE_THAT_WAS_AHEAD_OF_THE_ROW: 'stem collision: 2 questions share this id; the variant restored is the one she read. The unchosen variant is recorded on the row and is NOT discarded.',
    THE_UNCHOSEN_VARIANTS_ARE_COWORKS_BYTES: 'read from the crossed sends, never re-authored here — this store does not author item content',
    THE_SIGNATURE_IS_UNTOUCHED: 'both pins are under the retention-EXCLUDED projection, which strips `_`-keys, so a retention key cannot move them. That is what R858 stripped retention FOR. Asserted inside the transaction, identical before and after, or it rolls back.',
    rows: results,
  };
  const lines = results.map((r) => `${r.itemId}\tunchosen: ${r.unchosen}`);
  const d = digestOverText('one line per row, "<id>\\tunchosen: <stem>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['rows', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'stem-collision-retention' : 'stem-collision-retention-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  for (const r of results) console.log(`  ${r.itemId}\n     chosen (live):  ${r.chosen}\n     unchosen:       ${r.unchosen}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
