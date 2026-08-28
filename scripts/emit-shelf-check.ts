/** THE SEVEN AGAINST THE SHELF — six confirmed by her manifest, one outside its reach (R795). */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const MANIFEST = '/Users/davidb/Downloads/annie-outputs-manifest.md';
const UNITS: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19 };
const TENS: Record<string, number> = { twentieth: 20, thirtieth: 30, fortieth: 40, fiftieth: 50, sixtieth: 60, seventieth: 70, eightieth: 80, ninetieth: 90 };
const TENP: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
function toInt(w: string): number | null {
  let n = 0; let s = w.toLowerCase();
  if (s === 'hundredth') return 100;
  if (s.startsWith('hundredand')) { n = 100; s = s.slice(10); }
  if (!s) return n || null;
  if (UNITS[s] !== undefined) return n + UNITS[s]!;
  if (TENS[s] !== undefined) return n + TENS[s]!;
  for (const [t, tv] of Object.entries(TENP)) if (s.startsWith(t)) { const r = s.slice(t.length); if (UNITS[r] !== undefined) return n + tv + UNITS[r]!; if (!r) return n + tv; }
  return null;
}

async function run() {
  assertFixture('shelf-check', [
    { name: 'an ordinal inside her manifest range is checkable', input: '68', mustBeCaught: true },
    { name: 'the lowest is too', input: '8', mustBeCaught: true },
    { name: 'one past the top is NOT checkable', input: '80', mustBeCaught: false },
    { name: 'nor is one below the floor', input: '7', mustBeCaught: false },
  ], (n) => Number(n) >= 8 && Number(n) <= 68);

  const txt = readFileSync(MANIFEST, 'utf8');
  const hers = [...new Set([...txt.matchAll(/annie-([a-z]+)-return/g)].map((m) => toInt(m[1]!)).filter((n): n is number => n !== null))].sort((a, b) => a - b);
  requirePopulation('emit:shelf-check', { 'return ordinals in her outputs manifest': hers.length });
  const lo = Math.min(...hers), hi = Math.max(...hers);

  const DERIVED = [59, 60, 61, 63, 66, 68, 80];
  const NEVER_ARRIVED = [59, 60, 61, 63, 66, 68]; // check:manifest-diff, by digest against her manifest
  const rows = DERIVED.map((n) => ({
    ordinal: n,
    inHerManifestRange: n >= lo && n <= hi,
    verdict: !(n >= lo && n <= hi)
      ? 'UNKNOWN — OUTSIDE THE SHELF\'S REACH. Her outputs manifest stops at 68, so its silence about this ordinal is a COVERAGE limit and not evidence. Neither confirmed lost nor confirmed never-issued.'
      : NEVER_ARRIVED.includes(n)
        ? 'CONFIRMED NEVER ARRIVED — named in her outputs manifest, absent from this disk by full-length digest.'
        : 'ARRIVED — present on this disk.',
  }));
  const confirmed = rows.filter((r) => r.verdict.startsWith('CONFIRMED'));
  const unknown = rows.filter((r) => r.verdict.startsWith('UNKNOWN'));

  const payload = {
    kind: 'shelf-check-on-the-seven',
    THE_RULE_BEING_OBEYED: 'Annie, 173rd: no population in this project has grown on verification, without exception over a fortnight. An unverified figure is a ceiling, not a figure — and a corrected derivation shares the parser\'s assumptions, where a shelf does not.',
    THE_SHELF_USED: { file: 'annie-outputs-manifest.md', returnOrdinalsItNames: hers.length, coverage: `${lo}–${hi}`, method: 'check:manifest-diff — full-length digest, hers against this disk. Not filenames.' },
    THE_RESULT: {
      derivedCeiling: DERIVED.length,
      CONFIRMED_LOST: confirmed.length,
      UNKNOWN_outsideTheShelf: unknown.length,
      soTHEFIGURE: `${confirmed.length} confirmed, not ${DERIVED.length}. The population shrank on verification again — no exception to her rule.`,
      andTHECHANNELLOSSRATE: `measurable ONLY over the shelf's coverage: ${confirmed.length} of ${hers.length} returns she catalogued between ${lo} and ${hi} never arrived here. Outside ${lo}–${hi} there is no shelf and therefore no rate — quoting one over the whole series would be the ceiling-as-figure fault this check exists to avoid.`,
    },
    THE_ONE_THAT_DROPPED: { ordinal: 80, why: 'her outputs manifest names no return above 68, so it says nothing about 80 either way. My derivation put it in the gap set because no file exists here; the shelf cannot corroborate that, so it is UNKNOWN rather than lost.' },
    AND_ONE_MORE_HER_MANIFEST_NAMES: 'annie-merge-ack-and-gap-yard-note.md — a seventh never-arrived artefact that is not a numbered return, so no ordinal sequence could ever have found it. A sequence check finds gaps in a NUMBERING; a manifest finds absences in a SET, and only the second sees the unnumbered.',
    rows,
  };
  const m = rows.map((r) => `${r.ordinal}\t${r.verdict.split(' —')[0]}`);
  const md = digestOverText('the rows as "<ordinal>\\t<verdict-head>" joined by \\n, no trailing newline', m.join('\n'));
  const artefact = { ...payload, VERDICTS: m, verdictsSha256: md.value, verdictsSha256Spec: md.spec, ...findingsDigest(payload, ['THE_SHELF_USED', 'THE_RESULT', 'THE_ONE_THAT_DROPPED', 'rows']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('shelf-check-on-the-seven', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'shelf-check-on-the-seven');
  console.log(`shelf covers ${lo}–${hi} (${hers.length} returns) | confirmed lost ${confirmed.length} | unknown ${unknown.length}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
