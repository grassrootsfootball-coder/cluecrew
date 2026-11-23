/**
 * WHICH FIELDS DOES THE DOOR TREAT AS CHILD-FACING, AND WHICH OF THOSE ARE RATIONALE? (Cowork's
 * scoping question, 2026-08-21 — for Annie's ruling.)
 *
 * `misconceptionExecution` is RATIONALE — an author's account of why a distractor works. It is not
 * served to a child. **If the ban list should not run on rationale, then the door that refused
 * `ENG-027-RR-08` was asking about a field it does not serve**, and the whole option-declaration
 * question underneath it may not need answering at all.
 *
 * This measures the question rather than answering it. **The ruling is Annie's.**
 *
 * TWO POPULATIONS, JOINED:
 *   SCREENED  every distinct path `textsFrom` yields across the store — what the gate actually reads.
 *   SERVED    every one of those field names read anywhere on a CHILD-FACING code path.
 *
 * **THE SERVED SIDE IS A PROXY AND IT IS STATED AS ONE** (R60). It is a name scan over the child
 * surface, so it can over-report (a name that appears in a comment) and under-report (a field read
 * through a spread or a dynamic key). It is evidence for a reviewer, not a verdict — and the class
 * of fault it cannot see is exactly the one R349 named: nothing here reads a claim against a text.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { textsFrom } from '../packages/core/src/item-content-gate';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The child's surface. Admin and staff routes are deliberately NOT here — a staff screen is not serving. */
const CHILD_SURFACE = [
  'apps/web/components/crew',
  'apps/web/lib/crew',
  'apps/web/app/api/crew',
  'apps/web/app/(crew)',
];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    let entries: string[];
    try { entries = readdirSync(d); } catch { return; }
    for (const e of entries) {
      const p = join(d, e);
      try {
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(p) && !/\.test\./.test(p)) out.push(p);
      } catch { /* unreadable */ }
    }
  };
  walk(dir);
  return out;
}

async function main() {
  const items = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } } } });
  const screened = new Map<string, number>();
  const norm = (p: string) => p.replace(/\[\d+\]/g, '[]');
  for (const i of items) {
    for (const [p] of textsFrom(i.stem, 'stem')) screened.set(norm(p), (screened.get(norm(p)) ?? 0) + 1);
    /**
     * **THE GATE DOES NOT WALK `explanation` — IT READS THREE NAMED FIELDS.** The first version of
     * this report called `textsFrom` on the explanation object, which is what the gate does for the
     * STEM and for option content but NOT for the explanation, whose loop is
     * `for (const field of ['walkScript', 'walk', 'hintCore'])`.
     *
     * **So it reported `walkScriptBatch`, `walkScriptStatus`, `hintAuthority` and `hintAuthoredBy`
     * as screened when the gate has never touched them** — 678 values, four of the eleven paths in
     * the not-served column, and the measurement went to a reviewer as evidence for a ruling.
     * R41's fault: a verifier that re-derived the property instead of calling the family's own code.
     */
    for (const field of ['walkScript', 'walk', 'hintCore'] as const) {
      const t = (i.explanation as Record<string, unknown> | null)?.[field];
      if (typeof t === 'string' && t.trim()) {
        screened.set(`explanation.${field}`, (screened.get(`explanation.${field}`) ?? 0) + 1);
      }
    }
    for (const o of i.options) {
      for (const [p] of textsFrom((o as { content?: unknown }).content, 'option')) {
        screened.set(norm(p), (screened.get(norm(p)) ?? 0) + 1);
      }
    }
  }

  const surface = CHILD_SURFACE.flatMap((d) => filesUnder(join(REPO_ROOT, d)));
  const source = surface.map((f) => readFileSync(f, 'utf8')).join('\n');

  requirePopulation('report:gate-field-scope', {
    'path(s) the gate screens': screened.size,
    'child-surface file(s)': surface.length,
  });

  /** The leaf name, which is what a reader would grep for. */
  const leafOf = (p: string) => p.split('.').pop()!.replace(/\[\]$/, '');

  const rows = [...screened].map(([path, n]) => {
    const leaf = leafOf(path);
    const readOnChildPath = new RegExp(`\\b${leaf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(source);
    return { path, n, leaf, readOnChildPath };
  }).sort((a, b) => Number(a.readOnChildPath) - Number(b.readOnChildPath) || b.n - a.n);

  const served = rows.filter((r) => r.readOnChildPath);
  const notServed = rows.filter((r) => !r.readOnChildPath);

  console.log(`\nTHE DOOR SCREENS ${screened.size} DISTINCT PATHS. ${notServed.length} are read by NO child-facing path.\n`);
  console.log('  NOT READ ON ANY CHILD PATH — candidate RATIONALE, for her ruling');
  for (const r of notServed) console.log(`    ${String(r.n).padStart(5)}  ${r.path}`);
  console.log('\n  READ ON A CHILD PATH — served text, in scope beyond argument');
  for (const r of served) console.log(`    ${String(r.n).padStart(5)}  ${r.path}`);

  console.log(
    `\n  ${notServed.reduce((s, r) => s + r.n, 0)} values across ${notServed.length} path(s) are screened by the`
    + ' child-facing gate\n  and read by nothing a child reaches.'
    + '\n\n  THE SERVED COLUMN IS A NAME SCAN AND THEREFORE A PROXY: it can over-report a name in a'
    + '\n  comment and under-report a field read through a spread or a dynamic key. Evidence for a'
    + '\n  reviewer, not a verdict.',
  );
  await prisma.$disconnect();
}

void main();
