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
import { readFileSync as readSync } from 'node:fs';
import { loadChildLexicon, performingLetters } from './lib/move-letter-search';

/**
 * **THE STANDARD A ROW WAS AUTHORED AGAINST, USED AS HISTORY AND NEVER AS A VERDICT.** web2 is the
 * wrong instrument for whether a child knows a word (R988) and is the right one for a different
 * question: what counted as a word when this row was made. A key that performed then and fails now
 * was not MIS-KEYED — the cut moved under it, and calling that an authoring error attributes a
 * mistake to whoever keyed it. Nothing here reads web2 as a knownness test.
 */
const AUTHORING_ERA_LEXICON = new Set(
  readSync('/usr/share/dict/web2', 'utf8').split('\n').map((w) => w.trim().toUpperCase()).filter(Boolean),
);
const performedUnderTheAuthoringEra = (w1: string, w2: string, letter: string) => {
  const left = w1.replace(letter, '');
  if (!AUTHORING_ERA_LEXICON.has(left)) return false;
  for (let i = 0; i <= w2.length; i += 1) if (AUTHORING_ERA_LEXICON.has(w2.slice(0, i) + letter + w2.slice(i))) return true;
  return false;
};
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
  /**
   * THREE CLASSES, NOT TWO, AND ONLY ONE OF THEM BLAMES ANYBODY.
   *   UNPERFORMABLE      — no letter performs at the current cut.
   *   KEY FAILS AT THE CUT — the recorded key performed under the standard the row was authored
   *                        against and does not at 3.0. Nobody made a mistake; the cut moved.
   *   MIS-KEYED          — the recorded key performed under NEITHER standard. An authoring error.
   * The authoring store declined a "mis-keying" correction it had never earned, and was right.
   */
  const keyFailsAtTheCut: string[] = [];
  const misKeyed: string[] = [];
  const unperformable: string[] = [];
  for (const r of rows.filter((x) => x.id.startsWith('seed-vr08'))) {
    const [w1, w2] = pair(r);
    const works = performingLetters(w1, w2, lex);
    const key = val(r.options.find((o) => o.isCorrect)!);
    if (works.length === 0) { unperformable.push(`${r.id} (${w1}/${w2})`); continue; }
    if (works.includes(key)) continue;
    const line = `${r.id} (${w1}/${w2}: key ${key}; a letter that performs at 3.0 is ${works.join('/')})`;
    if (performedUnderTheAuthoringEra(w1, w2, key)) keyFailsAtTheCut.push(line);
    else misKeyed.push(line);
  }
  results.push({ id: 'seed-vr08-04-key-fails-at-the-ruled-cut',
    state: keyFailsAtTheCut.length > 0 ? 'OPEN' : 'CLOSED',
    figure: `${keyFailsAtTheCut.length} seed row(s) whose key PERFORMED under the standard they were authored against and fails at 3.0${keyFailsAtTheCut.length ? `: ${keyFailsAtTheCut.join('; ')}` : ''}. Separately: ${misKeyed.length} genuinely MIS-KEYED (performed under neither standard), ${unperformable.length} unperformable. Three different faults and only the last of those three blames an author.` });

  const known = new Set(declared.items.map((i) => i.id));
  const undeclared = results.filter((r) => r.state === 'OPEN' && !known.has(r.id));
  // Stale means DECLARED-but-repaired. A result that is closed and no longer declared is simply
  // finished, and reporting it forever would make the list nag about work already done.
  const closed = results.filter((r) => r.state === 'CLOSED' && known.has(r.id));

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
  const open = results.filter((r) => r.state === 'OPEN').length;
  // The summary counts what it measured. An earlier version said "both faults are still true"
  // on a run where one had just been repaired — the sentence and its test disagreeing, which is
  // the defect R591 names, in this check's own output.
  console.log(`\n  ${open} fault(s) still true and unrepaired, each named with whose decision it is.`);
  console.log('  None can decay into a forgotten one; none can be closed without this line changing.');
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
