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
/**
 * **A THIRD STATE WAS BUILT HERE AND REMOVED, and the removal is the entry.** Some decisions have no
 * business changing what a child is served and every business reaching a reviewer —
 * `unplacedBySplit` says a row was deliberately left alone. So a "REACHES A REVIEWER ONLY" class
 * looked right.
 *
 * **It cannot be computed.** A grep for the key name in `scripts/` matches the script that WRITES
 * the field, and the script that CHECKS it, as readily as one that reads it — so the new class
 * absorbed all seven rows including the four pure records, and the DECISION/AMBIGUOUS/RECORD sort
 * emptied. **A distinction the instrument cannot make is worse than the bound it replaces**, because
 * the bound is honest about what it does not know and the new class was not.
 *
 * Two states, and the bound printed. `scripts/` is excluded; a field read only there reads as
 * UNREAD, and that is stated rather than fixed.
 */

/** A name a person would read as recording a decision rather than a fact. */
const DECISION_LIKE = /(ruled|ruling|decision|decided|waived|declined|withheld|unplaced|serves|exempt|cleared|override|refused|approved|verdict|disposition)/i;

/**
 * **HER CRITERION: A FIELD IS A DECISION IF IT CAN BE DISOBEYED (Annie, 2026-08-22 — R604).**
 *
 *     RECORD    a name, a date, a digest, a method. It states what happened. Nothing can defy it,
 *               so nothing reading it is not a fault — inertness is its correct state.
 *     DECISION  an imperative or an evaluation. It says what SHOULD happen, so code can obey or
 *               ignore it, and a decision nothing reads is being ignored by default.
 *     AMBIGUOUS neither shape settles it. **These go to her rather than being ruled here** — she
 *               expects two or three, and nine undifferentiated rows was the wrong shape of answer.
 *
 * Sorting by name is a proxy for sorting by content, and it is named as one.
 */
type FieldKind = 'RECORD' | 'DECISION' | 'AMBIGUOUS';

function kindOf(key: string): { kind: FieldKind; why: string } {
  if (/(digest|sha256|hash)/i.test(key)) return { kind: 'RECORD', why: 'a digest — states what was, cannot be disobeyed' };
  if (/(edOn|At|Date)$/.test(key)) return { kind: 'RECORD', why: 'a date — states when, cannot be disobeyed' };
  if (/(By|ByPerson|Name|NameInSourceFile|Method|Authority)$/.test(key)) {
    return { kind: 'RECORD', why: 'a name or a method — states who or how, cannot be disobeyed' };
  }
  if (/(serves|unplaced|waived|declined|withheld|override|refused|verdict|disposition|exempt|cleared)/i.test(key)) {
    return { kind: 'DECISION', why: 'an imperative — says what should happen, so it can be obeyed or ignored' };
  }
  /**
   * **THE TWO SHE RULED (R608), and the shape of the first one is the lesson.** `hintRuling` and
   * `hintServes` are ONE decision split across two fields, and a pair like that presents as two
   * ambiguous fields rather than one directive and its reason. **The fault was the split, not either
   * field's kind.** `hintServes` is the directive; `hintRuling` is the reason and is a record.
   */
  if (/^hintRuling$/.test(key)) {
    return { kind: 'RECORD', why: 'the REASON for hintServes, not a second decision (Annie, R608)' };
  }
  if (/^approvedNotByRecognition$/.test(key)) {
    return { kind: 'RECORD', why: 'a record — nothing can defy it (Annie, R608)' };
  }
  return { kind: 'AMBIGUOUS', why: 'neither a plain record nor a plain imperative — hers to rule' };
}

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
  const unread: Array<{ key: string; rows: number; kind: FieldKind; why: string }> = [];
  for (const [key, rows] of [...present].sort((a, b) => b[1] - a[1])) {
    const hits = bodies.filter((b) => b.text.includes(key)).map((b) => b.f);
    const line = `      ${key.padEnd(26)} on ${String(rows).padStart(4)} row(s)`;
    if (hits.length > 0) read.push(`${line}  READ by ${hits.slice(0, 3).join(', ')}${hits.length > 3 ? ` +${hits.length - 3}` : ''}`);
    else unread.push({ key, rows, ...kindOf(key) });
  }

  console.log(`\n  READ — a decision here changes something (${read.length}):`);
  for (const l of read) console.log(l);
  console.log(
    `\n  UNREAD — written, and no code outside scripts/ consults it (${unread.length}):\n`
    + '  **A decision in one of these produces output identical to no decision.** That is correct for\n'
    + '  provenance, which is meant to be inert, and it is the PU-08 fault for anything a person\n'
    + '  treats as deciding something. This names the class; which a field should be is not its call.',
  );
  for (const k of ['DECISION', 'AMBIGUOUS', 'RECORD'] as FieldKind[]) {
    const rows = unread.filter((u) => u.kind === k);
    console.log(`\n      ${k} (${rows.length}) — ${k === 'DECISION' ? 'CAN BE DISOBEYED, and is being ignored by default'
      : k === 'AMBIGUOUS' ? 'HERS TO RULE, not sorted here' : 'inert by design; nothing reading it is correct'}`);
    for (const u of rows) console.log(`          ${u.key.padEnd(26)} ${String(u.rows).padStart(4)} row(s)  — ${u.why}`);
  }
  console.log(
    `\n  ${files.length} source file(s) searched across ${SOURCE_ROOTS.join(', ')}.\n`
    + '  **DO NOT TEST THE OUTCOME — ASK WHAT READS THE FIELD** (Annie, R605). The outcome was correct\n'
    + '  on every run for six weeks: PU-08 served the library hint exactly as ruled. It did so because\n'
    + '  its authorship fields were absent, not because anything read `hintServes`. **A decision\n'
    + '  honoured by accident and a decision honoured by design are indistinguishable from the output,\n'
    + '  and distinguishable in one grep.**\n'
    + '  BOUND: it looks for the key NAME as a literal. A field read through a computed key, or only\n'
    + '  in scripts/, reads as UNREAD here — so UNREAD is a candidate list, never a verdict.',
  );
  await prisma.$disconnect();
}

void main();
