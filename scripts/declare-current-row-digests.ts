/**
 * WHICH CASES IS bb6be0d3 STILL GOOD FOR? (David, 2026-09-02.)
 *
 * The authoring store binds its whole lane to the crossed population `bb6be0d3`. That binding is
 * STALE for vr-19 — the case was regenerated after the cut — and **unknown for the other ten,
 * because nothing on its disk can tell it which.** A population digest proves what a store READ;
 * it cannot report that the rows have moved since, and only the store holding the rows can say so.
 *
 * So this declares, per case and per row, the CURRENT digest under the spec the batch already
 * uses — `R729 over {stem, options:[{value,isKey}], solution}` — computed the same way over the
 * rows as they stand and over the rows as `bb6be0d3` recorded them. Same spec both sides, so the
 * numbers are directly comparable to the `rowSha256` every execution already carries.
 *
 * A case is BOUND when every row's digest is unchanged, and SUPERSEDED when any has moved — and a
 * superseded case names its moved rows, because "this case has changed" would send someone to
 * re-author twenty-five rows when three moved.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';
import { canonicalJson, findingsDigest, digestsBlock } from './lib/findings-digest';
import { rowDigest as libRowDigest, rowDigestNormalised as libRowDigestNormalised, ROW_DIGEST_SPEC, CASE_DIGEST_SPEC, ROW_DIGEST_SUBJECT_KEYS, digestSubject } from './lib/population-binding';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

const ROW_SPEC = ROW_DIGEST_SPEC;
const CASE_SPEC = CASE_DIGEST_SPEC;

interface PopRow { itemId: string; stem: unknown; solution: unknown; options: Array<{ value: unknown; isKey: boolean }> }

/**
 * THE DIGEST FUNCTIONS ARE THE LIBRARY'S, NOT THIS SCRIPT'S (R984). This file carried its own
 * `rowDigest` and `rowDigestNormalised` — a second implementation of one declared spec, which is
 * precisely how two stores computing "R729 over {stem, options:[{value,isKey}], solution}" arrived
 * at different numbers for one row. A spec with two implementations has two specs.
 */

async function main() {
  const popBytes = readFileSync(pjoin(LANE, 'vr-arc-census-and-population-bb6be0d3f2fed905.json'));
  const pop = JSON.parse(popBytes.toString('utf8')) as { SECTIONS: Array<{ caseId: string; questionType: string; rows: PopRow[] }> };
  const popByCase = new Map<string, { qt: string; rows: PopRow[] }>();
  for (const s of pop.SECTIONS) {
    const e = popByCase.get(s.caseId) ?? { qt: s.questionType, rows: [] };
    e.rows.push(...s.rows);
    popByCase.set(s.caseId, e);
  }
  requirePopulation('row-digests', { 'case(s) in the crossed population': popByCase.size });

  const cases: Array<Record<string, unknown>> = [];
  for (const [caseId, { qt, rows: popRows }] of [...popByCase].sort()) {
    const live = await prisma.item.findMany({ where: { questionTypeId: qt }, orderBy: { id: 'asc' },
      select: { id: true, status: true, stem: true, solution: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
    const val = (o: { content: unknown }) => (o.content as { value?: unknown })?.value;

    const nowById = new Map(live.map((r) => [r.id, libRowDigest({ itemId: r.id, stem: r.stem, solution: r.solution, options: r.options.map((o) => ({ value: val(o), isKey: o.isCorrect })) })]));
    const thenById = new Map(popRows.map((r) => [r.itemId, libRowDigest({ itemId: r.itemId, stem: r.stem, solution: r.solution ?? null, options: r.options })]));
    const nowNorm = new Map(live.map((r) => [r.id, libRowDigestNormalised({ itemId: r.id, stem: r.stem, solution: r.solution, options: r.options.map((o) => ({ value: val(o), isKey: o.isCorrect })) })]));
    const thenNorm = new Map(popRows.map((r) => [r.itemId, libRowDigestNormalised({ itemId: r.itemId, stem: r.stem, solution: r.solution ?? null, options: r.options })]));

    const moved: string[] = [], gone: string[] = [], added: string[] = [], serialisationOnly: string[] = [];
    for (const [id, then] of thenById) {
      if (!nowById.has(id)) { gone.push(id); continue; }
      if (nowById.get(id) === then) continue;
      if (nowNorm.get(id) === thenNorm.get(id)) serialisationOnly.push(id);
      else moved.push(id);
    }
    for (const id of nowById.keys()) if (!thenById.has(id)) added.push(id);

    const caseDigestNow = sha(canonicalJson([...nowById].sort().map(([itemId, rowSha256]) => ({ itemId, rowSha256 }))));
    const caseDigestThen = sha(canonicalJson([...thenById].sort().map(([itemId, rowSha256]) => ({ itemId, rowSha256 }))));
    const bound = caseDigestNow === caseDigestThen;
    const contentUnchanged = moved.length === 0 && gone.length === 0;

    cases.push({
      caseId, questionType: qt,
      BINDING: contentUnchanged && added.length === 0 && serialisationOnly.length === 0
        ? 'BOUND — bb6be0d3 is still exact for this case'
        : contentUnchanged
          ? `CONTENT UNCHANGED — no row's content has moved. ${serialisationOnly.length ? `${serialisationOnly.length} row(s) differ ONLY because the population stringified numeric option values; ` : ''}${added.length ? `${added.length} row(s) exist here that the cut did not carry. ` : ''}Anything authored against these rows still describes them.`
          : 'SUPERSEDED — at least one row\'s content has moved',
      rowsDifferingBySERIALISATIONONLY: serialisationOnly.length,
      serialisationOnlyIds: serialisationOnly,
      caseDigestNOW: caseDigestNow,
      caseDigestAS_bb6be0d3_RECORDED_IT: caseDigestThen,
      rowsInThePopulation: thenById.size, rowsHereNow: nowById.size,
      rowsMoved: moved.length, movedIds: moved,
      rowsGone: gone, rowsAdded: added,
      andWHATTOREAUTHOR: moved.length === 0
        ? 'nothing. No row\'s content has moved, so anything authored against bb6be0d3 for this case still describes these rows.'
        : moved.length === thenById.size ? `every row: all ${moved.length} moved`
        : `only the ${moved.length} named above; the other ${thenById.size - moved.length} are unchanged and anything authored against them still lands`,
      PER_ROW_DIGEST_NOW: [...nowById].sort().map(([itemId, rowSha256]) => ({ itemId, rowSha256, movedSincebb6be0d3: moved.includes(itemId) })),
    });
  }

  const superseded = cases.filter((c) => String(c.BINDING).startsWith('SUPERSEDED'));
  const report = {
    kind: 'CURRENT-ROW-DIGESTS-PER-CASE',
    TO: 'the authoring store; David and Annie by relay',
    date: '2026-09-02',
    WHY_THIS_EXISTS: 'your lane binds to bb6be0d3. That digest proves what you READ; it cannot tell you the rows have moved since, and nothing on your disk can. Only the store holding the rows can say which cases the binding is still good for — so it says.',
    THE_SPECS: { row: ROW_SPEC, case: CASE_SPEC },
    THE_SUBJECT_AS_KEYS: digestSubject(ROW_DIGEST_SUBJECT_KEYS, ROW_SPEC),
    THE_HEADLINE: `${cases.length - superseded.length} of ${cases.length} cases are still exactly bound to bb6be0d3. ${superseded.length} superseded: ${superseded.map((c) => c.caseId).join(', ') || 'none'}.`,
    HOW_TO_USE_IT: 'before authoring against a row, compare its rowSha256 with PER_ROW_DIGEST_NOW. A match means what you author lands. A mismatch means the row moved and the work would describe bytes that no longer exist — which is exactly what refused twenty-five vr-19 executions at this store\'s door.',
    andWHATTHISSTOREOWES: 'a regeneration that lands should cross its own supersession of the population it replaces, rather than leaving the other store to discover it by refusal. This declaration is the repair for what has already happened; that is the repair for what happens next, and it is not yet built.',
    CASES: cases,
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['CASES', 'THE_SPECS'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('current-row-digests-per-case', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'current-row-digests-per-case').split('/').pop()!;
  const finalSha = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${finalSha}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  for (const c of cases) {
    console.log(`  ${String(c.caseId).padEnd(12)} ${String(c.BINDING).slice(0, 10).padEnd(11)} rows ${c.rowsHereNow} | moved ${c.rowsMoved}${(c.rowsGone as string[]).length ? ` | gone ${(c.rowsGone as string[]).length}` : ''}`);
  }
  console.log(`\n  crossed: ${name}  (FILE ${finalSha.slice(0, 16)} | FINDINGS ${String(clean.findingsSha256).slice(0, 16)})`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
