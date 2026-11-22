/**
 * check:supersession-declared — A REGENERATION CROSSES ITS OWN SUPERSESSION (R983).
 *
 * The other store binds its work to a crossed population digest. When rows move underneath that
 * binding, **the store that moved them is the only one that can say so** — and if it does not, the
 * other store finds out by refusal, twenty-five executions at a time.
 *
 * **THIS IS THE MECHANISM, NOT THE HABIT.** Nothing can make a regeneration script remember to
 * declare; a docstring asking it to would be obeyed by whoever read the docstring (R967, R978). So
 * this compares every crossed population against the live rows and REFUSES when a case's content
 * has moved with no supersession notice covering it. A regeneration that lands undeclared fails
 * the build that follows it.
 *
 * WHAT IT DOES NOT DEMAND, and the distinction is the whole of R982's catch:
 *   · SERIALISATION-ONLY differences need no notice. The population stringified numeric option
 *     values; the content never moved, and demanding a notice would have sent fifty sound rows to
 *     be re-authored.
 *   · ROWS ADDED since the cut need no notice. The cut did not describe them, so nothing bound to
 *     it is describing them wrongly.
 * A notice covers CONTENT that moved out from under a binding, and nothing else.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
// R1038: '@prisma/client' resolves only inside packages/db; the db package re-exports it.
import { PrismaClient } from '../packages/db/src/index';
import { compareToPopulation, type BindableRow, type SupersessionNotice } from './lib/population-binding';
import { requirePopulation } from './lib/population';
import { assertFixture } from './lib/carried-fixture';

const REPO = pjoin(__dirname, '..');
const LANE = pjoin(homedir(), 'Downloads', '11+', 'from-cluecrew');
const NOTICES = pjoin(REPO, 'content', 'supersessions');
const prisma = new PrismaClient();

interface PopSection { caseId: string; questionType: string; rows: Array<{ itemId: string; stem: unknown; solution?: unknown; options: Array<{ value: unknown; isKey: boolean }> }> }

/** Every crossed artefact that reads as a population of rows — derived by scanning, never listed (R57). */
function crossedPopulations(): Array<{ file: string; digest: string; sections: PopSection[] }> {
  const out: Array<{ file: string; digest: string; sections: PopSection[] }> = [];
  for (const f of readdirSync(LANE).filter((n) => n.endsWith('.json'))) {
    let doc: unknown;
    try { doc = JSON.parse(readFileSync(pjoin(LANE, f), 'utf8')); } catch { continue; }
    const d = doc as { SECTIONS?: PopSection[] };
    if (!Array.isArray(d.SECTIONS)) continue;
    if (!d.SECTIONS.every((s) => s && typeof s.caseId === 'string' && Array.isArray(s.rows))) continue;
    const digest = /-([0-9a-f]{12,})\./.exec(f)?.[1] ?? f;
    out.push({ file: f, digest, sections: d.SECTIONS });
  }
  return out;
}

function notices(): SupersessionNotice[] {
  if (!existsSync(NOTICES)) return [];
  return readdirSync(NOTICES).filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(pjoin(NOTICES, f), 'utf8')) as SupersessionNotice);
}

async function main() {
  console.log('check:supersession-declared — a regeneration crosses its own supersession.');

  // The instrument proves itself before it screens anything (R721): content moved must be caught,
  // and a serialisation-only difference must be caught by NOTHING.
  const row = (v: unknown): BindableRow => ({ itemId: 'x', stem: { s: 1 }, solution: null, options: [{ value: v, isKey: true }] });
  assertFixture('supersession', [
    { name: 'content moved', input: 'moved', mustBeCaught: true },
    { name: 'a stringified number — serialisation only', input: 'serialisation', mustBeCaught: false },
    { name: 'identical rows', input: 'same', mustBeCaught: false },
  ], (k) => {
    const now = k === 'moved' ? row('9') : k === 'serialisation' ? row(7) : row('7');
    return compareToPopulation([now], [row('7')]).moved.length > 0;
  });

  const pops = crossedPopulations();
  const declared = notices();
  requirePopulation('check:supersession-declared', { 'crossed population artefact(s)': pops.length });

  const undeclared: string[] = [];
  let checked = 0, covered = 0, serialisationOnly = 0;
  for (const p of pops) {
    // A CASE IS THE UNIT, NOT A SECTION. The population splits each case into sections of six; a
    // section compared against the whole case's live rows reports the same divergence several
    // times and computes a meaningless "added". Group first, compare once (R918: the unit before
    // the number).
    const byCase = new Map<string, PopSection>();
    for (const s of p.sections) {
      const e = byCase.get(s.caseId) ?? { caseId: s.caseId, questionType: s.questionType, rows: [] };
      e.rows = [...e.rows, ...s.rows];
      byCase.set(s.caseId, e);
    }
    for (const s of byCase.values()) {
      const live = await prisma.item.findMany({ where: { questionTypeId: s.questionType }, orderBy: { id: 'asc' },
        select: { id: true, stem: true, solution: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
      if (live.length === 0) continue;
      checked += 1;
      const now: BindableRow[] = live.map((r) => ({ itemId: r.id, stem: r.stem, solution: r.solution,
        options: r.options.map((o) => ({ value: (o.content as { value?: unknown })?.value, isKey: o.isCorrect })) }));
      const was: BindableRow[] = s.rows.map((r) => ({ itemId: r.itemId, stem: r.stem, solution: r.solution ?? null, options: r.options }));
      const d = compareToPopulation(now, was);
      if (d.serialisationOnly.length > 0) serialisationOnly += 1;
      if (d.contentUnchanged) continue;
      const has = declared.some((n) => n.caseId === s.caseId && p.digest.startsWith(n.supersedesPopulation.slice(0, 12)));
      if (has) { covered += 1; continue; }
      undeclared.push(`${s.caseId} diverged from ${p.file}: ${d.moved.length} row(s) moved${d.gone.length ? `, ${d.gone.length} gone` : ''} — ${d.moved.slice(0, 3).join(', ')}${d.moved.length > 3 ? '…' : ''}`);
    }
  }

  console.log(`  ${checked} case-binding(s) screened across ${pops.length} crossed population(s); ${declared.length} notice(s) on record.`);
  console.log(`  ${covered} divergence(s) covered by a notice; ${serialisationOnly} case(s) differ by SERIALISATION ONLY and need none.`);
  if (undeclared.length === 0) {
    console.log('  Every case whose content moved out from under a crossed population has a supersession notice.');
    return;
  }
  console.error(`\n  REFUSED — ${undeclared.length} case(s) moved with no supersession declared:`);
  for (const u of undeclared) console.error(`    ${u}`);
  console.error('\n  The other store is still binding work to a population that no longer describes these rows,');
  console.error('  and it cannot discover that from anything on its own disk — it finds out by refusal.');
  console.error('  Declare it: write a notice to content/supersessions/ naming the population, the case and the');
  console.error('  rows whose content moved, with their digests before and after, and cross it.');
  process.exitCode = 1;
}

main().finally(async () => { await prisma.$disconnect(); });
