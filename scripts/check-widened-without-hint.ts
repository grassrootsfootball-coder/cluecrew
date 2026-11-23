/**
 * A DESCRIPTION WIDENED WITHOUT ITS HINT IS AN ENTRY WHOSE HINT NO LONGER COVERS IT
 * (Annie, 2026-08-21 — R530). **This is where a scope correction lands.**
 *
 * `en-unstressed-suffix-vowel` is the case: her third return widened the description to reach
 * **mid-word** vowels (*regester for register*), and the hint still says *"Say a family word where
 * the ending is stressed."* **That reaches `definite` and `definition`. It cannot reach the middle
 * `e` of `register`** — and `ENG-003-A-SP-08` carries exactly that item.
 *
 * **A widening is not a bigger version of the same entry. It is a second error under one name**, and
 * a hint written for the first will silently fail on the second.
 *
 * **REPORTS, does not fail.** The repair is a reviewer's — narrow the entry back, or write a hint
 * covering both — and a gate would enforce a choice nobody has made.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/** Scope words a description uses when it reaches more than one shape of the same error. */
const WIDENING = /\bor\b|\band also\b|\bincluding\b|\bas well as\b|\beither\b|,\s*or\b/i;

async function main() {
  const lib = await prisma.misconception.findMany({ select: { id: true, description: true, childHint: true } });
  const items = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } } } });
  const carriers = (id: string) => items.filter((i) => i.options.some((o) => (o as { misconceptionId?: string | null }).misconceptionId === id));

  requirePopulation('check:widened-without-hint', { 'library entr(y|ies)': lib.length });

  const flagged: string[] = [];
  for (const m of lib) {
    const d = m.description ?? '';
    const h = m.childHint ?? '';
    if (!d || !h) continue;
    if (!WIDENING.test(d)) continue;
    // The clauses a widened description names, split on its own connective.
    const clauses = d.split(/,?\s*\bor\b\s*/i).map((c) => c.trim()).filter((c) => c.length > 6);
    if (clauses.length < 2) continue;
    // Does the hint carry a content word from EVERY clause? A clause with no word in the hint is
    // a shape the hint does not reach.
    const hintWords = new Set(h.toLowerCase().match(/[a-z]{4,}/g) ?? []);
    const uncovered = clauses.filter((c) => {
      const words = (c.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !/that|this|with|from|when|word|words|which|their|there/.test(w));
      return words.length > 0 && !words.some((w) => hintWords.has(w));
    });
    if (uncovered.length === 0) continue;
    const c = carriers(m.id);
    flagged.push(
      `  ${m.id}  (${c.length} carrier(s), ${c.filter((x) => x.status === 'LIVE').length} LIVE)\n`
      + `      description: ${d}\n      hint:        "${h}"\n`
      + `      clause(s) the hint does not reach: ${uncovered.map((u) => `"${u}"`).join(' · ')}`,
    );
  }

  if (flagged.length === 0) {
    console.log('\ncheck:widened-without-hint: every widened description has a hint reaching each clause.');
    await prisma.$disconnect();
    return;
  }
  console.log(`\nWIDENED DESCRIPTIONS WHOSE HINT MAY NOT REACH EVERY CLAUSE: ${flagged.length}`);
  flagged.forEach((f) => console.log(f));
  console.log(
    '\n  REPORTED, NOT FAILED. Either the entry narrows back or somebody writes a hint covering both,\n'
    + '  and that is a reviewer\'s choice. The bound: this is a word-overlap test over prose, so it\n'
    + '  over-calls where a hint covers a clause in different words and under-calls where it shares a\n'
    + '  word without reaching the case.',
  );
  await prisma.$disconnect();
}

void main();
