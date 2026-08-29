/**
 * A FIELD NOBODY READS IS THE FIELD EVERY MERGE PREFERS (Cowork's finding, 2026-08-29 — R875).
 *
 * Cowork measured 1,849 fields in the send that arrived by INHERITANCE — carried forward with an
 * item, a role or a template — and never read at EITHER store. My rows carry them too. The half
 * that makes it a fault rather than clutter: **the dominance test rewards the unread copy.**
 * Reconciliation here is field-by-field and the side a GATE FORCED is the side that exports back
 * (CLAUDE.md, R23). A field nothing reads can never BE gate-forced, so it never moves, so it agrees
 * on every diff — and a diff scores agreement as correctness. **The least-scrutinised fields win
 * the most merges, and they win them for the reason that ought to disqualify them.**
 *
 * This measures MY side only. Cowork's 1,849 is Cowork's number, quoted as theirs (R25).
 *
 * TWO AXES, BECAUSE THE FIRST ONE IS A SATURATED PROXY. The first version asked "does this name
 * appear anywhere in source" and answered READ for 29 of 30 keys — `text`, `code`, `sum`,
 * `question`, `words`, `series` match any identifier in a monorepo. **A reassuring number from a
 * blind instrument** (R173), and it took the shape of a pass. So:
 *
 *   AXIS 1 — VALIDATED AT THE DOOR: is the key one the canonical `stemSchema` knows? Derived by
 *   scanning `item-stem.ts` for its own `'x' in stem` guards, never hand-listed (R57). This is an
 *   ARTEFACT, not a proxy: an unknown key passes the door untouched BY DESIGN, which is R57 working
 *   as ruled — and it is also the exact mechanism by which a field can arrive and never be looked at.
 *
 *   AXIS 2 — READ IN A STEM POSITION: does any source read `stem.key` / `stem['key']`? Tightened to
 *   the access form, which kills the collisions. Still over-reports (a variable named `stem` that
 *   is not an item stem counts), so UNREAD remains a LOWER BOUND.
 *
 * A key can be UNVALIDATED and still read — that is most of the bank and it is fine. The class this
 * exists to name is UNVALIDATED **and** UNREAD: nothing checks it at the door, nothing consults it
 * afterwards, and the child-facing walk gates its characters without anyone deciding its meaning.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { requirePopulation } from './lib/population';

const prisma = new PrismaClient();

/**
 * REPO ROOT, RESOLVED — NEVER THE CWD. The first run went through `pnpm --filter @cluecrew/db`, so
 * the cwd was `packages/db`, every relative root missed, grep exited non-zero, and a `catch`
 * returned 'absent' for all thirty keys: **0 of 30 read**, printed by the check written to count
 * unread fields. R173 inside its own subject — a failed read laundered into a fact.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOTS = ['packages/core/src', 'packages/db/src', 'apps/web', 'scripts']
  .map((r) => join(ROOT, r))
  .filter((r) => existsSync(r));
if (ROOTS.length === 0) throw new Error(`no source roots under ${ROOT} — refusing (R173)`);

/** The door's own known keys, read out of the door (R57). Never a copy of them. */
function schemaKnownKeys(): Set<string> {
  const src = readFileSync(join(ROOT, 'packages/core/src/item-stem.ts'), 'utf8');
  const keys = [...src.matchAll(/'([a-zA-Z_][a-zA-Z0-9_]*)' in stem/g)].map((m) => m[1]);
  if (keys.length === 0) throw new Error('stemSchema declares no known keys — shape changed (R173)');
  return new Set(keys);
}

/** Every key read through a stem access anywhere in source. Derived, one scan. */
function stemPositionReads(): Set<string> {
  const r = spawnSync(
    'grep',
    ['-rhoE', '--exclude-dir=node_modules', '--exclude-dir=.next', '--exclude-dir=dist',
      "stem\\??\\.[a-zA-Z_][a-zA-Z0-9_]*|stem\\['[a-zA-Z_][a-zA-Z0-9_]*'\\]", ...ROOTS],
    { encoding: 'utf8' },
  );
  if (r.status !== 0 && r.status !== 1) {
    throw new Error(`grep failed (status ${r.status}): ${(r.stderr ?? '').trim()}`);
  }
  const keys = r.stdout.split('\n').filter(Boolean)
    .map((h) => h.replace(/^stem\??\./, '').replace(/^stem\['/, '').replace(/'\]$/, ''));
  if (keys.length === 0) throw new Error('no stem accesses found in source — scan is blind (R173)');
  return new Set(keys);
}

async function main() {
  const known = schemaKnownKeys();
  const read = stemPositionReads();

  const rows = await prisma.item.findMany({
    select: { stem: true, status: true, questionType: { select: { district: true } } },
  });
  if (rows.length === 0) throw new Error('no items — a reader refuses a shape it cannot parse (R173)');

  const carriers = new Map<string, { rows: number; live: number; districts: Set<string> }>();
  for (const r of rows) {
    for (const k of Object.keys((r.stem ?? {}) as Record<string, unknown>)) {
      const e = carriers.get(k) ?? { rows: 0, live: 0, districts: new Set<string>() };
      e.rows += 1;
      if (r.status === 'LIVE') e.live += 1;
      e.districts.add(r.questionType?.district ?? 'NONE');
      carriers.set(k, e);
    }
  }

  requirePopulation('check:inherited-fields', {
    'item row(s)': rows.length,
    'distinct stem key(s)': carriers.size,
    "key(s) the door validates": known.size,
  });

  const cls = (k: string) =>
    known.has(k) ? 'VALIDATED' : read.has(k) ? 'READ-NOT-VALIDATED' : 'UNVALIDATED+UNREAD';
  const buckets = { VALIDATED: [] as string[], 'READ-NOT-VALIDATED': [] as string[], 'UNVALIDATED+UNREAD': [] as string[] };
  const fields = { VALIDATED: 0, 'READ-NOT-VALIDATED': 0, 'UNVALIDATED+UNREAD': 0 };
  for (const [k, e] of [...carriers].sort((a, b) => b[1].rows - a[1].rows)) {
    const c = cls(k) as keyof typeof buckets;
    buckets[c].push(`${k} (${e.rows}${e.live ? `, ${e.live} LIVE` : ''}, ${[...e.districts].sort().join('/')})`);
    fields[c] += e.rows;
  }

  const all = Object.values(fields).reduce((a, b) => a + b, 0);
  console.log(`\n  ${rows.length} items · ${carriers.size} distinct stem keys · ${all} row-fields.`);
  console.log(`  The door validates ${known.size} key name(s): ${[...known].sort().join(', ')}`);
  for (const c of ['VALIDATED', 'READ-NOT-VALIDATED', 'UNVALIDATED+UNREAD'] as const) {
    console.log(`\n  ${c}: ${buckets[c].length} key(s), ${fields[c]} row-fields`);
    for (const line of buckets[c]) console.log(`      ${line}`);
  }
  console.log(
    '\n  UNVALIDATED+UNREAD is the class Cowork named: nothing checks it at the door, nothing'
    + '\n  consults it after, and the child-facing walk gates its characters while no code reads its'
    + '\n  meaning. It is a LOWER BOUND — axis 2 counts any `stem.x` access, including one on an'
    + '\n  object that is not an item stem. A field here agrees on every reconciliation because'
    + '\n  nothing can force it to move, and the dominance test scores that agreement as correctness.',
  );
  await prisma.$disconnect();
}

main().catch(async (e) => { await prisma.$disconnect(); console.error(e); process.exit(1); });
