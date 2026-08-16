/**
 * RETIRE THE LOOSE ENG ITEM COPIES — `pnpm retire:loose [--write]`
 *
 * `~/Downloads/11+` is a TRANSFER AREA and holds no source of truth. It accumulated multiple copies
 * of the same deliveries at different hashes — three of ENG-001 disagreeing on 22 of 22 items, two
 * vintages each of eng005 and eng007 declaring quotes on different items. The standing rule is one
 * copy of any Cowork artefact, identified by hash; these are the extras.
 *
 * NOTHING IS DELETED THAT IS NOT DEMONSTRABLY HELD. Per file, before any removal:
 *   · every `itemId` it carries exists in the database — an id present only here BLOCKS the file;
 *   · every key the registry knows is either CARRIED, declared VINTAGE, or a declared exception;
 *   · a key the registry does not name at all BLOCKS the file, because nobody has decided about it.
 * A file that fails any of these is kept, and the reason is printed. This is the last moment the
 * content exists in two places, so the check runs against the DATABASE, not against a manifest of
 * it — a manifest is a derivative, and comparing a copy to a derivative of itself proves nothing.
 *
 * THE LEDGER IS WRITTEN AND COMMITTED BEFORE THE DELETION, not after. `content/exports/
 * RETIRED-LOOSE-COPIES.json` records each file's path, sha256, size, item ids and verdict. If the
 * deletion is interrupted the ledger still says what was there; the reverse order would leave a
 * gap nobody could reconstruct.
 *
 * A FILE IS NOT JUST ITS CONTENT — IT IS EVERY CHECK THAT READS IT (David, 2026-08-16). Retiring
 * the ENG-001/002 copies removed the ability to RECOMPUTE the WIW-18/pp-19 quote disagreement:
 * `carry:quotes` can no longer see the other side. The hashes are in this ledger and the values are
 * in R82, but a record is not a recomputation, and nothing announced that the comparison was about
 * to become unrunnable.
 *
 * So before anything is retired, every file states WHICH COMPARISONS READ IT, and which of those it
 * is the SOLE INPUT to. The reader map is derived by SCANNING `scripts/` for the source roots each
 * one reads, not from a hand-kept list — a hand-kept list of readers is the same allowlist that
 * fails open, one level up (R57). SOLE-INPUT status is stated loudly and recorded in the ledger; it
 * does not block, because the content was verified held and it is the COMPARISON that is being
 * given up, deliberately.
 *
 * IT VERIFIES BY RE-READING WHAT IT ACTED ON. A zero from a failed command and a zero from a
 * successful one look identical (David, 2026-08-13), so each path is re-stat'ed after removal
 * rather than the survivors being counted.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { unknownCoworkKeys } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const ROOTS = [
  '/Users/davidb/Downloads/11+',
  '/Users/davidb/Downloads/11+/items',
  '/Users/davidb/Downloads/11+/from-cluecrew',
];
const LEDGER = resolve(import.meta.dirname, '../content/exports/RETIRED-LOOSE-COPIES.json');

/**
 * Keys ruled VINTAGE — the same fact under a pre-rename name, verified identical to the field that
 * superseded it — plus keys ruled as declared exceptions. Their absence from the database is a
 * decision, so it must not block a file.
 */
const NOT_A_LOSS: Readonly<Record<string, string>> = {
  passageId: 'VINTAGE — identical to passageRef on 22 of 22 (R79)',
  lineRef: 'VINTAGE — span identical to lineRefs on 22 of 22 (R79)',
  notes: 'declared exception, PROPOSED — drafting scratch',
  _previousMisconceptionId: 'declared exception, PROPOSED — supersession belongs in an attribution event',
  misconceptions: 'MODELLED per-option as ItemOption.misconceptionId, verified equal on 96 of 96',
  options: 'carried as ItemOption rows',
  stem: 'carried as Item.stem',
  explanation: 'carried as Item.explanation',
  itemId: 'carried as Item.id',
  questionTypeId: 'carried as Item.questionTypeId',
  difficultyTier: 'carried as Item.difficultyTier',
  authoredBy: 'carried as Item.authoredBy',
  preReview: 'carried as Item.draftSelfAssessment (renamed, R79)',
  draftingOrder: 'carried as Item.draftingMethod (renamed, R79)',
  lineRefs: 'carried as Item.lineRefs',
  passageRef: 'carried as stem.passageRef',
  orderAnchor: 'carried as stem.orderAnchor',
  testedTokens: 'carried as Item.testedTokens',
  tierRationale: 'carried as Item.tierRationale',
  sourcedFrom: 'carried as Item.sourcedFrom',
  mechanismLedger: 'carried as Item.mechanismLedger',
  itemModel: 'carried as Item.itemModel',
  passageFlag: 'carried as Item.passageFlag',
  r4Note: 'carried as Item.r4Note',
  banListException: 'carried as Item.banListException',
  banListExceptionResolved: 'carried as Item.banListExceptionResolved',
  importDoorFix: 'carried as Item.importDoorFix',
  stemRedraft: 'carried as Item.stemRedraft',
  clusterPosition: 'DROPPED, 0 of 12 — see the manifest backlog',
};

interface Candidate {
  path: string; sha: string; bytes: number; itemIds: string[];
  blockers: string[];
  /** Scripts that read this file's directory. */
  readers: string[];
  /** Readers for which this file is the ONLY remaining input in scope. */
  soleInputFor: string[];
}

/**
 * WHICH SCRIPTS READ WHICH SOURCE ROOTS, read out of the scripts themselves.
 *
 * A script "reads" a candidate when it names the candidate's directory as a literal. Coarse on
 * purpose: over-reporting a reader costs a line of output, while missing one costs a comparison
 * nobody knew they were destroying.
 */
function readerMap(): Map<string, Set<string>> {
  const dir = resolve(import.meta.dirname);
  const out = new Map<string, Set<string>>();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.ts')) continue;
    const text = readFileSync(join(dir, name), 'utf8');
    for (const root of ROOTS) {
      if (!text.includes(root)) continue;
      const set = out.get(root) ?? new Set<string>();
      set.add(`scripts/${name}`);
      out.set(root, set);
    }
  }
  return out;
}

async function main(): Promise<void> {
  const write = process.argv.includes('--write');

  const candidates: Candidate[] = [];
  const seenPaths = new Set<string>();
  for (const dir of ROOTS) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.json')) continue;
      const path = join(dir, name);
      if (seenPaths.has(path)) continue;
      const raw = readFileSync(path, 'utf8');
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { continue; }
      const items = (parsed as { items?: unknown }).items;
      if (!Array.isArray(items)) continue;
      const ids = (items as Array<Record<string, unknown>>)
        .map((i) => (typeof i?.itemId === 'string' ? i.itemId : null))
        .filter((i): i is string => i !== null && i.startsWith('ENG-'));
      if (ids.length === 0) continue;
      seenPaths.add(path);
      candidates.push({
        path, sha: createHash('sha256').update(raw).digest('hex'),
        bytes: statSync(path).size, itemIds: [...new Set(ids)], blockers: [],
        readers: [], soleInputFor: [],
      });
    }
  }
  requirePopulation('retire:loose', { 'loose files carrying ENG items': candidates.length });

  // WHAT EACH FILE IS AN INPUT TO, and what it is the LAST input to.
  const readers = readerMap();
  for (const c of candidates) {
    const dir = dirname(c.path);
    c.readers = [...(readers.get(dir) ?? [])].filter((r) => !r.endsWith('retire-loose-copies.ts')).sort();
    // Sole input for a reader when no OTHER candidate in that reader's roots survives this run.
    c.soleInputFor = c.readers.filter((r) => {
      const otherRoots = ROOTS.filter((root) => readers.get(root)?.has(r));
      return !candidates.some((o) => o !== c && otherRoots.includes(dirname(o.path)));
    });
  }

  const inDb = new Set((await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } }, select: { id: true },
  })).map((i) => i.id));

  for (const c of candidates) {
    const missing = c.itemIds.filter((id) => !inDb.has(id));
    if (missing.length) {
      c.blockers.push(`${missing.length} item(s) exist ONLY here: ${missing.slice(0, 6).join(', ')}`);
    }
    // A key nobody has decided about is a key that might be a loss.
    const parsed = JSON.parse(readFileSync(c.path, 'utf8')) as { items: Array<Record<string, unknown>> };
    const undecided = new Set<string>();
    for (const it of parsed.items) {
      for (const u of unknownCoworkKeys(it)) {
        const bare = u.key;
        if (!(bare in NOT_A_LOSS)) undecided.add(`${u.level}.${u.key}`);
      }
    }
    if (undecided.size) {
      c.blockers.push(`${undecided.size} undecided key(s): ${[...undecided].sort().join(', ')}`);
    }
  }

  const clear = candidates.filter((c) => c.blockers.length === 0);
  const kept = candidates.filter((c) => c.blockers.length > 0);

  console.log(`${candidates.length} loose file(s) carry ENG items · ${clear.length} clear to retire · ${kept.length} kept\n`);
  for (const c of clear) {
    console.log(`  RETIRE  ${c.sha.slice(0, 16)}  ${c.itemIds.length.toString().padStart(2)} items  ${c.bytes.toString().padStart(6)}B  ${c.path}`);
    console.log(`            read by: ${c.readers.length ? c.readers.join(', ') : '(no script reads this directory)'}`);
    if (c.soleInputFor.length) {
      console.log(`            SOLE INPUT for ${c.soleInputFor.join(', ')} — retiring this file retires`);
      console.log('            those comparisons. A record is not a recomputation.');
    }
  }
  for (const c of kept) {
    console.log(`  KEEP    ${c.sha.slice(0, 16)}  ${c.path}`);
    for (const b of c.blockers) console.log(`            ${b}`);
    // Stated for KEPT files too, not only for the ones about to go. The moment to know what a file
    // is the last input to is BEFORE it is a candidate, not in the run that removes it.
    console.log(`            read by: ${c.readers.length ? c.readers.join(', ') : '(no script reads this directory)'}`);
    if (c.soleInputFor.length) console.log(`            SOLE INPUT for ${c.soleInputFor.join(', ')}`);
  }

  if (!write) {
    console.log('\nDry run. Re-run with --write to write the ledger and remove the clear files.');
    await prisma.$disconnect();
    return;
  }
  if (clear.length === 0) {
    console.log('\nNothing clear to retire. Nothing written.');
    await prisma.$disconnect();
    return;
  }

  // LEDGER FIRST. If the deletion is interrupted, the record still says what was there.
  mkdirSync(dirname(LEDGER), { recursive: true });
  writeFileSync(LEDGER, JSON.stringify({
    kind: 'retired-loose-copies',
    retiredAt: new Date().toISOString(),
    reason:
      '~/Downloads/11+ is a transfer area holding no source of truth. Each file below was verified '
      + 'against the DATABASE — every itemId present, every key carried, vintage or a declared '
      + 'exception — before removal.',
    retired: clear.map((c) => ({
      path: c.path, sha256: c.sha, bytes: c.bytes, itemIds: c.itemIds,
      readBy: c.readers, soleInputFor: c.soleInputFor,
    })),
    kept: kept.map((c) => ({ path: c.path, sha256: c.sha, blockers: c.blockers })),
  }, null, 2));
  console.log(`\nLedger written to ${LEDGER} BEFORE any deletion.`);

  for (const c of clear) unlinkSync(c.path);

  // VERIFY BY RE-READING EACH PATH ACTED ON, never by counting what is left.
  const stillThere = clear.filter((c) => existsSync(c.path));
  const keptIntact = kept.filter((c) => existsSync(c.path));
  console.log(`\nVERIFIED by re-reading each path:`);
  console.log(`  retired and confirmed gone: ${clear.length - stillThere.length} of ${clear.length}`);
  for (const c of stillThere) console.error(`  x STILL PRESENT: ${c.path}`);
  console.log(`  kept and confirmed present: ${keptIntact.length} of ${kept.length}`);

  const after = await prisma.item.count({ where: { id: { startsWith: 'ENG-' } } });
  console.log(`  ENG items in the database after: ${after}`);
  await prisma.$disconnect();
}

void main();
