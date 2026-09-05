/**
 * check:vr08-open-items — A FAULT REPORTED AND NOT REPAIRED IS NAMED, OR IT IS LOST (R994).
 *
 * Two vr-08 faults were found and deliberately left: the bank cycling twelve pairs into
 * twenty-five rows (R990), and two seed rows that are performable but MIS-KEYED. Both were
 * reported in prose, and **prose is the only artefact here with no gate on it** (R178) — a fault
 * that lives in a paragraph of a register entry is a fault nobody will meet again at the moment
 * they would act on it.
 *
 * So each is measured FROM THE ROWS on every run. An item still true reports OPEN with its
 * current figure; an item no longer true reports CLOSED, so the declaration can only shrink and a
 * silent repair is as visible as a silent regression.
 *
 * **UNPERFORMABLE AND MIS-KEYED ARE DIFFERENT FAULTS** and this reports them apart. An earlier
 * count folded the two seed rows into a single "unperformable" figure, which is wrong about both:
 * the stem is sound and the recorded answer is not.
 */
import { readFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { loadChildLexicon, performingLetters } from './lib/move-letter-search';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const DECL = pjoin(REPO, 'content', 'vr08-open-items.json');

async function main() {
  console.log('check:vr08-open-items — faults found and deliberately not repaired, measured from the rows.');
  const declared = JSON.parse(readFileSync(DECL, 'utf8')) as { items: Array<{ id: string; what: string; whoseDecision: string }> };
  const lex = loadChildLexicon();

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-08-move-letter' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, stem: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('check:vr08-open-items', { 'vr-08 row(s)': rows.length });
  const val = (o: { content: unknown }) => String((o.content as { value?: unknown })?.value ?? '').toUpperCase();
  const pair = (r: (typeof rows)[number]) => {
    const s = r.stem as { word1?: string; word2?: string };
    return [String(s.word1 ?? '').toUpperCase(), String(s.word2 ?? '').toUpperCase()] as const;
  };

  const results: Array<{ id: string; state: 'OPEN' | 'CLOSED'; figure: string }> = [];

  // 1. THE BANK'S DUPLICATION — distinct pairs against rows, in the cut.
  const cut = rows.filter((r) => r.id.startsWith('gen-vr-08'));
  const distinct = new Set(cut.map((r) => pair(r).join('/')));
  results.push({ id: 'bank-cycles-twelve-pairs-into-twenty-five-rows',
    state: distinct.size < cut.length ? 'OPEN' : 'CLOSED',
    figure: `${distinct.size} distinct word pair(s) across ${cut.length} cut row(s)${distinct.size < cut.length ? `; ${cut.length - distinct.size} row(s) repeat a pair already on the card set` : ''}` });

  // 2. MIS-KEYED SEED ROWS — a letter performs, and it is not the recorded key.
  const misKeyed: string[] = [];
  const unperformable: string[] = [];
  for (const r of rows.filter((x) => x.id.startsWith('seed-vr08'))) {
    const [w1, w2] = pair(r);
    const works = performingLetters(w1, w2, lex);
    const key = val(r.options.find((o) => o.isCorrect)!);
    if (works.length === 0) { unperformable.push(`${r.id} (${w1}/${w2})`); continue; }
    if (!works.includes(key)) misKeyed.push(`${r.id} (${w1}/${w2}: works on ${works.join('/')}, key says ${key})`);
  }
  results.push({ id: 'seed-rows-04-and-05-are-performable-but-mis-keyed',
    state: misKeyed.length > 0 ? 'OPEN' : 'CLOSED',
    figure: `${misKeyed.length} seed row(s) performable but mis-keyed${misKeyed.length ? `: ${misKeyed.join('; ')}` : ''}. Separately, ${unperformable.length} seed row(s) unperformable at the cut — a DIFFERENT fault and not counted here.` });

  const known = new Set(declared.items.map((i) => i.id));
  const undeclared = results.filter((r) => r.state === 'OPEN' && !known.has(r.id));
  const closed = results.filter((r) => r.state === 'CLOSED');

  console.log(`  ${declared.items.length} declared open item(s); ${results.filter((r) => r.state === 'OPEN').length} still OPEN, measured from the rows.`);
  for (const r of results) {
    const d = declared.items.find((i) => i.id === r.id);
    console.log(`   ${r.state.padEnd(6)} ${r.id}`);
    console.log(`          ${r.figure}`);
    if (d) console.log(`          decision: ${d.whoseDecision}`);
  }
  if (closed.length) {
    console.log(`\n  ${closed.length} declared item(s) no longer measure as open — repaired, or the measurement changed.`);
    console.log('  Remove them from content/vr08-open-items.json, or say why the declaration outlives the measurement.');
  }
  if (undeclared.length) {
    console.error(`\n  REFUSED — ${undeclared.length} open fault(s) measured but not declared: ${undeclared.map((u) => u.id).join(', ')}`);
    process.exitCode = 1;
    return;
  }
  console.log('\n  Both faults are still true, still unrepaired, and named with whose decision they are.');
  console.log('  Neither can decay into a forgotten one; neither can be closed without this line changing.');
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
