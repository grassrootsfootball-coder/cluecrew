/**
 * THE DATABASE FACTS PRISMA DOES NOT KNOW — `pnpm check:db-invariants`
 *
 * 43 migrations, of which SIX contain SQL Prisma cannot express: 7 named CHECK constraints, 4
 * triggers, 2 functions, and column defaults written as expressions. **That set is exactly what
 * Prisma can silently overwrite, and it has already overwritten one of them.** A routine
 * `migrate dev` for unrelated columns reverted `ContentWriteLog.at` to a local-time default forty
 * minutes after R80 recorded the 345 false reports it caused. It was caught by luck (R90).
 *
 * TWO HALVES, and the second is what stops this becoming a list of what we thought of in August:
 *
 *   1. ASSERTIONS. Each invariant states a fact the database must hold and the reason it exists.
 *      An invariant whose object no longer exists FAILS — it does not pass vacuously, which is the
 *      stale-exemption rule already proven twice here (`DECLARED_DOORS`, `KNOWN_UNTYPED`).
 *
 *   2. COVERAGE. Every hand-written fact in every migration is EXTRACTED FROM THE SQL and matched
 *      against an invariant. **A migration that adds a trigger, a function, a named CHECK or an
 *      expression default with no invariant asserting it FAILS THIS CHECK** — so the next
 *      hand-written migration cannot land unasserted, which is the only way the list stays true.
 *      Derived by scanning, never a hand-kept register of what we remember writing (R57).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const MIGRATIONS = resolve(import.meta.dirname, '../packages/db/prisma/migrations');

interface Invariant {
  /** The database object this is about — matched against what the migrations declare. */
  object: string;
  why: string;
  /** Returns true when the database holds the fact. */
  holds: () => Promise<boolean>;
  /** Returns true when the object exists at all. False means the invariant is STALE. */
  exists: () => Promise<boolean>;
}

const one = async (sql: string): Promise<boolean> => {
  const rows = (await prisma.$queryRawUnsafe(sql)) as Array<Record<string, unknown>>;
  return rows.length > 0 && Object.values(rows[0]!)[0] === true;
};
const constraintExists = (name: string): Promise<boolean> =>
  one(`SELECT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = '${name}') AS r`);
const triggerExists = (name: string): Promise<boolean> =>
  one(`SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = '${name}' AND NOT tgisinternal) AS r`);
const functionExists = (name: string): Promise<boolean> =>
  one(`SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = '${name}') AS r`);

const INVARIANTS: Invariant[] = [
  {
    object: 'log_content_write',
    why:
      'The write boundary\'s trigger function must stamp UTC EXPLICITLY. It was left to the column '
      + 'default once, the default was local time, and every logged write landed an hour ahead of '
      + 'the ruling that authorised it — 345 writes reported as "a change nobody decided" (R80).',
    exists: () => functionExists('log_content_write'),
    holds: () => one(
      `SELECT bool_and(pg_get_functiondef(oid) LIKE '%AT TIME ZONE ''UTC''%') AS r
       FROM pg_proc WHERE proname = 'log_content_write'`,
    ),
  },
  {
    object: 'ContentWriteLog.at',
    why:
      'NO default at all. Prisma cannot express `now() AT TIME ZONE \'UTC\'`, so it read its own '
      + '@default(now()) as truth and restored CURRENT_TIMESTAMP on the next migrate dev (R83). '
      + 'Restoring UTC drifts again; removing the default leaves no local-time fallback to restore.',
    exists: () => one(
      `SELECT EXISTS(SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ContentWriteLog' AND column_name = 'at') AS r`,
    ),
    holds: () => one(
      `SELECT (column_default IS NULL) AS r FROM information_schema.columns
       WHERE table_name = 'ContentWriteLog' AND column_name = 'at'`,
    ),
  },
  ...['content_write_item', 'content_write_item_option', 'content_write_misconception', 'content_write_word']
    .map((t): Invariant => ({
      object: t,
      why: 'A content table with no write trigger is a table whose changes the boundary cannot see.',
      exists: () => triggerExists(t),
      holds: () => triggerExists(t),
    })),
  ...[
    ['misconception_needs_description_and_hint', 'An entry with no description is a placeholder; one with no hint cannot be shown to a child. This is half of R85 — the other half is Anne\'s protocol, and they refuse the same import for different reasons.'],
    ['misconception_method_needs_approver', 'A recorded approval method with no approver names a decision nobody made.'],
    ['misconception_recorded_approval_named', 'Whose judgement it was is never merged with who typed it.'],
    ['item_review_method_needs_reviewer', 'Same rule at item level.'],
    ['item_recorded_review_named', 'Same rule at item level.'],
    ['word_live_needs_reviewer', 'Nothing serves a child without a named reviewer behind it.'],
    ['word_two_meanings_needs_sense_b', 'A two-meaning card with one sense is a card that cannot test the ambiguity it claims.'],
  ].map(([name, why]): Invariant => ({
    object: name!, why: why!,
    exists: () => constraintExists(name!),
    holds: () => constraintExists(name!),
  })),
];

/** Every hand-written fact any migration declares, extracted from the SQL. */
function declaredFacts(): Map<string, string> {
  const out = new Map<string, string>();
  for (const dir of readdirSync(MIGRATIONS)) {
    const file = join(MIGRATIONS, dir, 'migration.sql');
    let sql: string;
    try { sql = readFileSync(file, 'utf8'); } catch { continue; }
    for (const m of sql.matchAll(/CREATE\s+TRIGGER\s+(\w+)/gi)) out.set(m[1]!, dir);
    for (const m of sql.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(\w+)/gi)) out.set(m[1]!, dir);
    for (const m of sql.matchAll(/ADD\s+CONSTRAINT\s+"([^"]+)"\s+CHECK/gi)) out.set(m[1]!, dir);
    for (const m of sql.matchAll(/ALTER\s+TABLE\s+"(\w+)"\s+ALTER\s+COLUMN\s+"(\w+)"\s+SET\s+DEFAULT\s+\(/gi)) {
      out.set(`${m[1]}.${m[2]}`, dir);
    }
    /**
     * A BARE `DROP DEFAULT` COUNTS ONLY INSIDE A HAND-WRITTEN MIGRATION.
     *
     * It is Prisma's own vocabulary — it emits one whenever a model's default changes — so
     * treating every occurrence as a deliberate fact reported `ContentWriteLog.changedColumns`
     * as unasserted when Prisma had simply normalised a column it owns. Inside a migration that
     * also carries a trigger, a function, a named CHECK or an expression default, the same
     * statement is somebody deciding something, and R83's fix was exactly that.
     */
    if (!/CREATE\s+TRIGGER|CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION|ADD\s+CONSTRAINT\s+"[^"]+"\s+CHECK|SET\s+DEFAULT\s+\(/i.test(sql)) continue;
    for (const m of sql.matchAll(/ALTER\s+TABLE\s+"(\w+)"\s+ALTER\s+COLUMN\s+"(\w+)"\s+DROP\s+DEFAULT/gi)) {
      out.set(`${m[1]}.${m[2]}`, dir);
    }
  }
  return out;
}

async function main(): Promise<void> {
  const facts = declaredFacts();
  requirePopulation('check:db-invariants', {
    'declared invariants': INVARIANTS.length,
    'hand-written facts found in migrations': facts.size,
  });

  const broken: string[] = [];
  const stale: string[] = [];
  let held = 0;
  for (const inv of INVARIANTS) {
    if (!(await inv.exists())) {
      // A vacuous pass is the failure mode this whole file exists to avoid.
      stale.push(`${inv.object} — the object does not exist, so this invariant asserts nothing`);
      continue;
    }
    if (await inv.holds()) held += 1;
    else broken.push(`${inv.object} — ${inv.why}`);
  }

  const asserted = new Set(INVARIANTS.map((i) => i.object));
  const unasserted = [...facts].filter(([obj]) => !asserted.has(obj));

  console.log(`  ${held} of ${INVARIANTS.length} invariants hold`);
  console.log(`  ${facts.size} hand-written fact(s) across the migrations · ${unasserted.length} unasserted`);

  if (stale.length > 0) {
    console.error(`\n  ${stale.length} STALE invariant(s):`);
    for (const s of stale) console.error(`    x ${s}`);
  }
  if (broken.length > 0) {
    console.error(`\n  ${broken.length} BROKEN invariant(s) — the database no longer holds a fact a migration wrote:`);
    for (const b of broken) console.error(`    x ${b}`);
  }
  if (unasserted.length > 0) {
    console.error(`\n  ${unasserted.length} hand-written fact(s) with NO invariant asserting them:`);
    for (const [obj, dir] of unasserted) console.error(`    x ${obj}  (declared in ${dir})`);
    console.error('    Prisma can overwrite any of these on a routine migrate dev and nothing would notice.');
    console.error('    Add an invariant to scripts/check-db-invariants.ts.');
  }

  if (stale.length || broken.length || unasserted.length) {
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log('\n  Every hand-written database fact is asserted, and every assertion holds.');
  await prisma.$disconnect();
}

void main();
