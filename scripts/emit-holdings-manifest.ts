/**
 * THIS STORE'S HOLDINGS MANIFEST FOR RETURNS 8–68 (R800).
 *
 * Answering Cowork's four-part shape, ruled the form for every manifest:
 *   1. THE DIGEST — of this manifest, and of every entry.
 *   2. THE DERIVATION — how each entry was produced, in terms someone could re-run.
 *   3. THE RANGE — stated APART from the numbers, so a count is never read as coverage.
 *   4. SENDS OR HOLDINGS — which of the two this records. **This one records HOLDINGS.**
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const DOWN = '/Users/davidb/Downloads';
const LO = 8, HI = 68;
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
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
  assertFixture('holdings-manifest', [
    { name: 'an in-range ordinal is in scope', input: '8', mustBeCaught: true },
    { name: 'the top of the range is in scope', input: '68', mustBeCaught: true },
    { name: 'one past the top is out of scope', input: '69', mustBeCaught: false },
    { name: 'one below the floor is out of scope', input: '7', mustBeCaught: false },
  ], (n) => Number(n) >= LO && Number(n) <= HI);

  // ---- collect: digest is identity, filename is a label on it (R799) ----
  const byOrdinal = new Map<number, Array<{ file: string; digest: string; bytes: number; seenAt: string }>>();
  const unresolved: string[] = [];
  for (const name of readdirSync(DOWN)) {
    const lower = name.toLowerCase();
    if (!lower.startsWith('annie-') || !/return/.test(lower)) continue;
    let n: number | null = null;
    const num = /annie-(\d+)[-.]/.exec(lower);
    if (num) n = Number(num[1]);
    else { const w = /annie-([a-z]+)/.exec(lower); if (w) n = toInt(w[1]!); }
    if (n === null) { unresolved.push(name); continue; }
    if (n < LO || n > HI) continue;
    let buf: Buffer;
    try { buf = readFileSync(join(DOWN, name)); } catch { continue; }
    byOrdinal.set(n, [...(byOrdinal.get(n) ?? []), { file: name, digest: sha(buf), bytes: buf.length, seenAt: statSync(join(DOWN, name)).mtime.toISOString() }]);
  }
  requirePopulation('emit:holdings-manifest', { 'ordinals held in 8–68': byOrdinal.size });

  const entries = [] as Array<Record<string, unknown>>;
  for (let n = LO; n <= HI; n++) {
    const held = byOrdinal.get(n) ?? [];
    const digests = [...new Set(held.map((h) => h.digest))];
    entries.push({
      ordinal: n,
      held: held.length > 0,
      identity: digests.length === 1 ? digests[0] : (digests.length === 0 ? null : digests),
      filenamesCarryingIt: held.map((h) => h.file),
      MORE_THAN_ONE_NAME: held.length > 1 ? `${held.length} filenames, ${digests.length} distinct digest(s) — ${digests.length === 1 ? 'one artefact under several labels' : 'DIFFERENT BYTES UNDER ONE ORDINAL, which the ordinal cannot distinguish'}` : false,
      bytes: held[0]?.bytes ?? null,
      seenOnThisDiskAt: held[0]?.seenAt ?? null,
    });
  }
  const absent = entries.filter((e) => !e.held).map((e) => e.ordinal as number);
  const multiName = entries.filter((e) => e.MORE_THAN_ONE_NAME !== false);

  const payload = {
    kind: 'holdings-manifest-8-68',
    ONE_THE_DIGEST: 'the digest of this manifest is the sha256 in its filename and its sidecar, over the whole file bytes. Every ENTRY carries its own artefact digest in `identity`, and entryDigest below covers the entry list alone so it moves when holdings move and not when prose does.',
    TWO_THE_DERIVATION: {
      what: 'every file in ~/Downloads whose name begins `annie-` and contains `return`, sha256 over its bytes, ordinal parsed from the filename.',
      identityVersusLabel: '**the DIGEST is the identity; the ORDINAL is parsed from the filename, which is a label** (R799 — the 173rd arrived under two names, byte-identical). So an entry asserts: these bytes are on this disk, and a filename claims they are return N. It does NOT assert that she numbered it N.',
      whatCOULDGOWRONG: 'a file renamed on this disk would move an entry; a return whose filename carries no resolvable ordinal would be absent from the list entirely. Both are named rather than left implicit — unresolved filenames are enumerated below (R796).',
      unresolvedFilenames: unresolved,
      reRunnableAs: 'pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/emit-holdings-manifest.ts',
    },
    THREE_THE_RANGE: {
      covers: `${LO}–${HI}`,
      whyThisRange: 'it is where her outputs manifest reaches and where the desk has nothing. Chosen to meet a shelf, not to flatter a count.',
      statedAPARTfromTheNumbers: `this manifest says NOTHING about returns below ${LO} or above ${HI}. Outside the range there is no claim here — not "none", not "clean", nothing. A count from this document quoted across the series would be the ceiling-as-figure fault (R795).`,
      ordinalsInRange: HI - LO + 1,
    },
    FOUR_SENDS_OR_HOLDINGS: {
      answer: 'HOLDINGS.',
      what: 'each entry records that these bytes are ON THIS DISK, as of the timestamp given. It records arrival, not dispatch.',
      whyItMatters: '**this store sends nothing in this direction — it is the receiver.** A holdings manifest and a sends manifest disagree exactly where the interesting cases are: an artefact sent and never arrived appears in hers and not in mine, and that difference IS the loss. Reading either as the other would erase the very gap both exist to find.',
      soTHECOMPARISON: 'hers (sends) minus mine (holdings) = never arrived. Mine minus hers = arrived here without being catalogued there. Both directions are meaningful and they are not symmetrical.',
    },
    THE_HOLDINGS: { ordinalsHeld: byOrdinal.size, ordinalsAbsent: absent.length, absent, ordinalsUnderMoreThanOneFilename: multiName.length },
    entries,
  };
  const lines = entries.map((e) => `${e.ordinal}\t${e.held ? String(e.identity) : 'ABSENT'}`);
  const ed = digestOverText('the entry lines joined by \\n, no trailing newline, each "<ordinal>\\t<sha256 or ABSENT>"', lines.join('\n'));
  const artefact = { ...payload, ENTRY_LINES: lines, entryDigest: ed.value, entryDigestSpec: ed.spec, ...findingsDigest(payload, ['ONE_THE_DIGEST', 'TWO_THE_DERIVATION', 'THREE_THE_RANGE', 'FOUR_SENDS_OR_HOLDINGS', 'THE_HOLDINGS', 'entries']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('holdings-manifest-8-68', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'holdings-manifest-8-68');
  console.log(`range ${LO}–${HI}: held ${byOrdinal.size}, absent ${absent.length} (${absent.join(', ')}), multi-name ${multiName.length}, unresolved ${unresolved.length}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
