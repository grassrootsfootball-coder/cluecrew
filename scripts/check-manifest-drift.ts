/**
 * THE MANIFEST GUARD — `pnpm check:manifest-drift [--accept]`
 *
 * Two manifests in one schema is what makes the two stores comparable; this is the comparison.
 * It is deliberately NOT part of the emitter — a comparison that can re-derive one side from the
 * other is not a comparison, and keeping them in one file is how that happens.
 *
 * WHAT IT ACTUALLY GUARDS: REGRESSION, not the backlog. 21 of the 39 declarative fields are absent
 * from this store today. Failing on that would be a wish-list, red from the first run and muted
 * within a week. It fails when a field this store DID carry stops being carried, when a carried
 * field MOVES to a different column, or when the field list itself changes shape — the losses that
 * arrive silently, which is the entire history this exists because of.
 *
 * THE THREE ABSENCE STATES ARE ASSIGNED HERE, NOT IN THE EMITTER (David's accepted redesign,
 * 2026-08-13). DROPPED and EMPTY are indistinguishable from one side: an emitter can say "absent
 * here" and nothing more. Only a comparison can say which. MODELLED is neither — it is DECLARED,
 * in `declarative-fields.ts`, because a field misfiled MODELLED hides a real loss and that is the
 * worse direction.
 *
 * WHAT IT CANNOT DO YET, STATED RATHER THAN IMPLIED (R60, R61). Cowork has not delivered a manifest
 * in this schema. Without one there is no row-level comparison at all — no per-item stem hash, no
 * per-item field presence — and the field-level counts it does use are Cowork's own declared
 * totals, not a reading of Cowork's store. That gap prints on every run, in terms that cannot be
 * read as a pass, and it is why the headline never says the stores agree.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DECLARATIVE_FIELDS, MODELLED_PATHS } from '../packages/core/src/english/declarative-fields';

const PLATFORM = process.env.MANIFEST_PATH
  ?? resolve(import.meta.dirname, '../content/exports/MANIFEST-PLATFORM-STORE.json');
const COWORK = process.env.COWORK_MANIFEST
  ?? resolve(import.meta.dirname, '../content/exports/MANIFEST-COWORK-STORE.json');
const BASELINE = process.env.MANIFEST_BASELINE
  ?? resolve(import.meta.dirname, '../content/exports/MANIFEST-FIELD-BASELINE.json');

type AbsenceState = 'CARRIED' | 'MODELLED' | 'DROPPED' | 'EMPTY';

interface FieldRow {
  path: string; weight: string; coworkCount: number; platformCount: number;
  foundAt: string[]; modelled: boolean;
}

function main(): void {
  if (!existsSync(PLATFORM)) {
    console.error(`REFUSED — no platform manifest at ${PLATFORM}. Run \`pnpm emit:manifest\` first.`);
    console.error('This guard reads the artefact; it does not regenerate one to compare against itself.');
    process.exit(1);
  }
  const platform = JSON.parse(readFileSync(PLATFORM, 'utf8')) as {
    schema: string; emittedAt: string; counts: { items: number }; declarativeFields: FieldRow[];
  };

  // --- THE MISSING SIDE, DECLARED --------------------------------------------------------
  const coworkDelivered = existsSync(COWORK);
  console.log(`Platform manifest: ${platform.counts.items} items, schema ${platform.schema}, emitted ${platform.emittedAt}`);
  // R60 question 3, answered out loud: this reads the ARTEFACT and never the store. It cannot
  // tell you the manifest is current — only `pnpm emit:manifest` does that, and CI cannot run it
  // because the CI database is seeded with Phase 1 synthetic VR items and holds no ENG content.
  console.log('  Read from the FILE. Whether it matches the live database is the emitter\'s claim, not this one.');
  if (!coworkDelivered) {
    console.log(`\nCOWORK MANIFEST NOT DELIVERED — expected at ${COWORK}.`);
    console.log('  ROW-LEVEL COMPARISON DID NOT RUN. Not "passed", not "no differences found": it');
    console.log('  did not run. No per-item stem hash, key hash or field presence has been compared');
    console.log('  between the two stores, and nothing below asserts that the stores agree.');
    console.log('  The field counts used are the totals COWORK DECLARED, not a reading of its store.');
  }

  // --- STATE PER FIELD -------------------------------------------------------------------
  const rows = platform.declarativeFields;
  const declared = new Map(DECLARATIVE_FIELDS.map((f) => [f.path, f]));
  const states = rows.map((r) => {
    const state: AbsenceState =
      r.platformCount > 0 ? 'CARRIED'
        : MODELLED_PATHS.has(r.path) ? 'MODELLED'
          : r.coworkCount > 0 ? 'DROPPED'
            : 'EMPTY';
    return { ...r, state };
  });

  // A field the emitter reports that the registry does not declare, or the reverse. Either way
  // the two have drifted and the comparison is running on a list nobody agreed.
  const unlisted = rows.filter((r) => !declared.has(r.path)).map((r) => r.path);
  const unemitted = DECLARATIVE_FIELDS.filter((f) => !rows.some((r) => r.path === f.path)).map((f) => f.path);
  if (unlisted.length || unemitted.length) {
    console.error('\nREFUSED — the manifest and the field registry disagree about which fields exist:');
    for (const p of unlisted) console.error(`  x emitted but not declared: ${p}`);
    for (const p of unemitted) console.error(`  x declared but not emitted: ${p}`);
    process.exit(1);
  }

  const byState = (s: AbsenceState) => states.filter((r) => r.state === s);
  console.log(`\n${states.length} declarative fields: ${byState('CARRIED').length} CARRIED · `
    + `${byState('MODELLED').length} MODELLED · ${byState('DROPPED').length} DROPPED · ${byState('EMPTY').length} EMPTY`);
  const criticalDropped = byState('DROPPED').filter((r) => r.weight === 'critical');
  if (criticalDropped.length) {
    console.log(`\n${criticalDropped.length} CRITICAL field(s) DROPPED — backlog, not a regression:`);
    for (const r of criticalDropped) console.log(`  ! ${r.path.padEnd(38)} 0 here, ${r.coworkCount} on Cowork`);
  }

  // --- REGRESSION AGAINST THE COMMITTED BASELINE -----------------------------------------
  const snapshot = Object.fromEntries(states.map((r) => [r.path, { count: r.platformCount, foundAt: r.foundAt }]));
  if (process.argv.includes('--accept')) {
    writeFileSync(BASELINE, JSON.stringify({ acceptedFrom: platform.emittedAt, fields: snapshot }, null, 2));
    console.log(`\nBaseline written to ${BASELINE}. Commit it — that is what makes the next run a comparison.`);
    return;
  }
  if (!existsSync(BASELINE)) {
    console.error(`\nREFUSED — no baseline at ${BASELINE}, so this run compared against NOTHING.`);
    console.error('Re-run with --accept to record the current state, then commit it.');
    process.exit(1);
  }
  const base = JSON.parse(readFileSync(BASELINE, 'utf8')) as {
    acceptedFrom: string; fields: Record<string, { count: number; foundAt: string[] }>;
  };

  const lost: string[] = [];
  const moved: string[] = [];
  for (const r of states) {
    const b = base.fields[r.path];
    if (!b) continue; // a newly declared field is not a regression
    if (r.platformCount < b.count) lost.push(`${r.path}: ${b.count} -> ${r.platformCount}`);
    const was = [...b.foundAt].sort().join(', ');
    const now = [...r.foundAt].sort().join(', ');
    if (b.count > 0 && r.platformCount > 0 && was !== now) moved.push(`${r.path}: [${was}] -> [${now}]`);
  }

  console.log(`\nAgainst the baseline accepted from ${base.acceptedFrom}, over ${Object.keys(base.fields).length} fields:`);
  if (lost.length === 0 && moved.length === 0) {
    console.log('  no field lost rows and no field changed carrier.');
  }
  for (const l of lost) console.error(`  x LOST ROWS  ${l}`);
  for (const m of moved) console.error(`  x MOVED      ${m}`);

  if (lost.length || moved.length) {
    console.error('\nA field this store carried is carried less, or is carried somewhere else. Either is a');
    console.error('silent loss of the kind this guard exists for. If it is intended, re-run with --accept.');
    process.exit(1);
  }
  if (!coworkDelivered) {
    console.log('\nThis run screened ONE store against its own past. It says nothing about the other.');
  }
}

main();
