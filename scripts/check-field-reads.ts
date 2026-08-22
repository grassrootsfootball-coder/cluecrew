/**
 * DOES EVERY DELIVERY STATE THE KEYS BEFORE IT READS THEM? (Annie, 2026-08-22 — R568.)
 *
 * A delivery that pulls a named field out of a JSON column emits whatever that name returns. When
 * the name is wrong the column returns `undefined` on every row, the artefact is well-formed, the
 * count is right, and **the reader on the other side sees a field that is null everywhere** — which
 * is exactly what an empty field looks like. She read all thirty-six rows of one and reported the
 * population as items with no hint. The hint was there under a name I had changed.
 *
 * **THIS RATCHETS RATHER THAN FAILING THIRTY-FOUR SCRIPTS ON ITS FIRST RUN.** A check that is red
 * from the day it lands gets muted inside a week — named three times on this board already
 * (`check:staging-queue`, `check:declaration-sets`, `check:reissue-completion`). So it reports
 * CARRIED / NOT CARRIED across the derived population and fails only if the carried count FALLS
 * BELOW the recorded floor. **The floor is a fact about progress, not an allowlist of exemptions**:
 * it names no script, so it cannot silently bless one, and a new unguarded delivery does not fail
 * the build while an existing guarded one that loses its guard does.
 *
 * The population is DERIVED (R57): any script that both delivers and casts a JSON column to read a
 * field by name. Never a hand-kept list.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requirePopulation } from './lib/population';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)));

/**
 * **THE FLOOR MOVES UP AND NEVER DOWN.** Raise it in the same commit that guards a delivery.
 * Currently 1: `deliver-thirtysix-hints.ts`, the delivery the fault happened in.
 */
const FLOOR = 1;

/** A cast applied to a JSON column — the idiom by which this codebase reads a field by name. */
const READS_BY_NAME = /\b(explanation|stem|content|textProvenance|mechanic)\b[^\n]{0,60}\bas\b/;

function main() {
  const carried: string[] = [];
  const not: string[] = [];
  for (const f of readdirSync(SCRIPTS).filter((n) => n.endsWith('.ts')).sort()) {
    const body = readFileSync(join(SCRIPTS, f), 'utf8');
    if (!body.includes('deliver(') || !READS_BY_NAME.test(body)) continue;
    (body.includes('readFieldsByName') ? carried : not).push(f);
  }

  requirePopulation('check:field-reads', {
    'delivery script(s) reading a JSON field by name': carried.length + not.length,
  });

  console.log(`\n  CARRIED (${carried.length}): ${carried.join(', ')}`);
  console.log(`  NOT CARRIED (${not.length}):`);
  for (const f of not) console.log(`      ${f}`);
  console.log(
    `\n  ${carried.length} of ${carried.length + not.length} deliveries state their keys before reading them.`
    + `\n  FLOOR: ${FLOOR}. This check fails when the carried count falls BELOW the floor — a guard`
    + '\n  removed — and not when a new delivery arrives without one. The backlog is visible on every'
    + '\n  run; it is not a build failure, because a permanently red check is a check nobody reads.',
  );

  if (carried.length < FLOOR) {
    console.error(
      `\ncheck:field-reads FAILED — ${carried.length} carried, floor is ${FLOOR}. A delivery that had`
      + '\n  the guard has lost it. Restore it, or lower the floor deliberately and say why.',
    );
    process.exitCode = 1;
  }
}

main();
