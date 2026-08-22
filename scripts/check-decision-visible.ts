/**
 * DOES A RECORDED DECISION CHANGE ANYTHING? (Annie's PU-08 shape, generalised — R601.)
 *
 * **`ENG-003-A-PU-08` carried `hintRuledBy`, `hintServes` and her reasoning — a DECISION to leave
 * the item hint unserved — and it produced output identical to a hint nobody had looked at.** Same
 * served text, same `chooseHint` verdict, four batches in the unread pile. The decision was correct,
 * recorded, and invisible.
 *
 * **THE GENERAL SHAPE: a decision recorded in a field that nothing READS cannot change behaviour, so
 * it is indistinguishable from the absence of a decision.** That is mechanically checkable —
 * enumerate the decision-bearing keys actually present in the store, then ask whether any code reads
 * them.
 *
 *   READ    a decision changes something. Its presence is distinguishable from its absence.
 *   UNREAD  the field is written and nobody consults it. **The decision is a note, not a decision**,
 *           and a reader who trusts it is trusting something with no effect.
 *
 * **UNREAD IS NOT AUTOMATICALLY A FAULT** and this never says it is. Provenance fields are SUPPOSED
 * to be inert — `hintAuthority` records who ruled, and nothing should branch on it. The fault is a
 * field a human treats as a DECISION while the system treats it as a comment. This reports the two
 * classes and names which is which; the judgement of which a given field should be is not its.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOTS = ['packages/core/src', 'packages/db/src', 'packages/db/prisma', 'apps/web'];

/** A name a person would read as recording a decision rather than a fact. */
const DECISION_LIKE = /(ruled|ruling|decision|decided|waived|declined|withheld|unplaced|serves|exempt|cleared|override|refused|approved|verdict|disposition)/i;

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    let names: string[];
    try { names = readdirSync(dir); } catch { return; }
    for (const n of names) {
      if (n === 'node_modules' || n === '.next' || n === 'dist') continue;
      const p = join(dir, n);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(n) && !p.includes('/scripts/')) out.push(p);
    }
  };
  for (const r of SOURCE_ROOTS) walk(join(REPO, r));
  return out;
}

async function main() {
  const items = await prisma.item.findMany({ select: { id: true, explanation: true, stem: true } });
  const lib = await prisma.misconception.findMany({ select: { id: true, textProvenance: true } });

  /** Every decision-like key actually present, with how many rows carry it. */
  const present = new Map<string, number>();
  const bump = (o: unknown) => {
    for (const k of Object.keys((o ?? {}) as Record<string, unknown>)) {
      if (DECISION_LIKE.test(k)) present.set(k, (present.get(k) ?? 0) + 1);
    }
  };
  for (const i of items) { bump(i.explanation); bump(i.stem); }
  for (const m of lib) bump(m.textProvenance);

  requirePopulation('check:decision-visible', {
    'row(s) inspected': items.length + lib.length,
    'decision-like key(s) present in the store — THE POPULATION': present.size,
  });

  const files = sourceFiles();
  const bodies = files.map((f) => ({ f: f.replace(`${REPO}/`, ''), text: readFileSync(f, 'utf8') }));

  const read: string[] = [];
  const unread: string[] = [];
  for (const [key, rows] of [...present].sort((a, b) => b[1] - a[1])) {
    const hits = bodies.filter((b) => b.text.includes(key)).map((b) => b.f);
    const line = `      ${key.padEnd(24)} on ${String(rows).padStart(4)} row(s)`;
    if (hits.length > 0) read.push(`${line}  READ by ${hits.slice(0, 3).join(', ')}${hits.length > 3 ? ` +${hits.length - 3}` : ''}`);
    else unread.push(line);
  }

  console.log(`\n  READ — a decision here changes something (${read.length}):`);
  for (const l of read) console.log(l);
  console.log(
    `\n  UNREAD — written, and no code outside scripts/ consults it (${unread.length}):\n`
    + '  **A decision in one of these produces output identical to no decision.** That is correct for\n'
    + '  provenance, which is meant to be inert, and it is the PU-08 fault for anything a person\n'
    + '  treats as deciding something. This names the class; which a field should be is not its call.',
  );
  for (const l of unread) console.log(l);
  console.log(
    `\n  ${files.length} source file(s) searched across ${SOURCE_ROOTS.join(', ')}.\n`
    + '  BOUND: it looks for the key NAME as a literal. A field read through a computed key, or only\n'
    + '  in scripts/, reads as UNREAD here — so UNREAD is a candidate list, never a verdict.',
  );
  await prisma.$disconnect();
}

void main();
