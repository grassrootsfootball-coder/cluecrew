/** THE FIXTURE AUDIT (David's ruling on Cowork's lesson, 2026-08-25 — R721). Report only. */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const checks = readdirSync(join(REPO, 'scripts')).filter((f) => /^check-.*\.ts$/.test(f));

const rows = checks.map((f) => {
  const src = readFileSync(join(REPO, 'scripts', f), 'utf8');
  const hasFixture = /assertFixture\(/.test(src);
  const hasCanary = /canary|CANARY|specimenSeen|knownMember/.test(src);
  // Is the known member drawn from the STANDING CORPUS — a real id, file or content string?
  const corpusDrawn = /stream-a-\d+|christmas-carol|ENG-\d{3}-|bank-vr-|gen-vr-/.test(src) && hasCanary;
  const synthetic = /planted canary|synthetic|FIXTURE|created and removed within one run/.test(src);
  return {
    check: f,
    hasSelfTest: hasFixture || hasCanary,
    kind: hasFixture ? 'CARRIED FIXTURE — cannot be repaired out from under it'
      : corpusDrawn ? 'CORPUS-DRAWN — EXPIRES WHEN THE CORPUS IS REPAIRED'
        : synthetic ? 'SYNTHETIC/PLANTED — carried already'
          : hasCanary ? 'DECLARATION CANARY — anchored to a constant or a function name, not to content'
            : 'NO SELF-TEST',
  };
});
const byKind: Record<string, string[]> = {};
for (const r of rows) (byKind[r.kind] ??= []).push(r.check);

const artefact = {
  kind: 'fixture-audit',
  what: 'Every check audited for what its known member is anchored to, and which would go dark the moment the corpus is repaired.',
  theLessonTaken: "Cowork's screen wired its known member to the shouted TWO — a fault in the STANDING CORPUS — and the moment the 28 rows were amended the screen refused, because the member it was built knowing about had been repaired. A known member drawn from the standing corpus expires when the corpus is fixed, and a screen whose self-test expires goes dark exactly when the corpus is at its cleanest.",
  limitsFirst: [
    'THIS AUDIT READS SOURCE, NOT BEHAVIOUR: a check is classified by what its text anchors to. A canary that is corpus-drawn in a way this pattern does not name would read as a declaration canary — the classification is a read, not a proof.',
    'IT COVERS scripts/check-*.ts ONLY. Gates inside packages/, and the import doors, are a separate population and are not claimed here.',
  ],
  population: { checksAudited: rows.length },
  byKind: Object.fromEntries(Object.entries(byKind).map(([k, v]) => [k, { count: v.length, membership: v }])),
  THE_TWO_CONVERTED: {
    'check-content-flags.ts': {
      was: 'CORPUS-DRAWN — its calibration specimen was the christmas-carol DECLARED(item-set) flag, a real flag in the standing corpus. THE DAY ANNIE RULES THAT FLAG AWAY — a legitimate content decision — the census would have gone blind while printing a clean run.',
      now: 'a CARRIED FIXTURE of four synthetic passages: three flag shapes that must parse, and one with no flags that must be caught by NOTHING. The corpus specimen is still OBSERVED and reported, because losing the observation would lose evidence — it simply no longer decides whether the instrument is trusted.',
    },
    'check-every-string-field.ts': {
      was: 'NO SELF-TEST AT ALL — worse than an expiring one. And it is the check that produced the 1,533 figure by modelling the gate instead of calling it: an instrument with no self-test cannot be caught being wrong by anything but an argument, which is exactly what happened.',
      now: 'a CARRIED FIXTURE of four strings: three punctuation faults that must be caught, and one clean sentence that must be caught by NOTHING.',
    },
  },
  theSharedPath: 'scripts/lib/carried-fixture.ts — assertFixture refuses a malformed fixture (one with no clean case, or no must-catch case), prints FIXTURE PASSED before the sweep so a reader knows the instrument worked before reading what it found, and sets a non-zero exit when the instrument does not do what it claims.',
};
const json = JSON.stringify(artefact, null, 1) + '\n';
const name = stampedName('fixture-audit', sha256(json).slice(0, 16), 'json');
writeFileSync(join(REPO, 'content/exports', name), json);
deliver(join(REPO, 'content/exports', name), 'fixture-audit');
console.log(Object.entries(byKind).map(([k, v]) => `${k}: ${v.length}`).join('\n'));
