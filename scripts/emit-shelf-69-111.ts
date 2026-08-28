/**
 * THIS STORE'S SHELF FOR 69–111 — A HOLDINGS LISTING, NOT A MANIFEST (R805).
 *
 * **Named a listing on purpose.** R802 ruled that an unpaired manifest measures nothing, and this
 * band has no counterpart of its own. What makes it worth publishing is Annie's ruling that THREE
 * SHELVES COMPARED name every artefact held by one party and not another — **an asymmetry set and
 * an UPPER BOUND ON ABSENCE, never a loss rate.** The desk holds four of the forty-three (108–111);
 * this is the second shelf, and it claims nothing on its own.
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
const LO = 69, HI = 111;
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
  assertFixture('shelf-69-111', [
    { name: 'the floor of the band is in scope', input: '69', mustBeCaught: true },
    { name: 'the ceiling is in scope', input: '111', mustBeCaught: true },
    { name: 'one below is not', input: '68', mustBeCaught: false },
    { name: 'the desk band start is not', input: '112', mustBeCaught: false },
  ], (n) => Number(n) >= LO && Number(n) <= HI);

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
  requirePopulation('emit:shelf-69-111', { 'ordinals in the band': HI - LO + 1 });

  const entries = [];
  for (let n = LO; n <= HI; n++) {
    const held = byOrdinal.get(n) ?? [];
    const digests = [...new Set(held.map((h) => h.digest))];
    entries.push({
      ordinal: n, onThisShelf: held.length > 0,
      identity: digests.length === 1 ? digests[0] : (digests.length === 0 ? null : digests),
      filenames: held.map((h) => h.file), bytes: held[0]?.bytes ?? null, seenAt: held[0]?.seenAt ?? null,
    });
  }
  const notHere = entries.filter((e) => !e.onThisShelf).map((e) => e.ordinal);

  const payload = {
    kind: 'holdings-listing-69-111',
    IT_IS_A_LISTING_NOT_A_MANIFEST: 'named so deliberately. R802 ruled an unpaired manifest measures nothing, and this band has no counterpart. This is ONE SHELF of three, published so an asymmetry set can be computed — it settles nothing by itself and asserts nothing by itself.',
    WHAT_THREE_SHELVES_COMPARED_YIELD: {
      the: 'an ASYMMETRY SET — every artefact held by one party and not another, named.',
      andTheBound: '**AN UPPER BOUND ON ABSENCE, NEVER A LOSS RATE.** An artefact on no shelf may have been sent and lost, or never sent, or sent to a party whose shelf is not here. Three shelves cannot separate those, so the number they produce is a ceiling — which is Annie\'s standing rule (R795) applied to a band with no sends record at all.',
      whyNOTaLossRate: 'a rate needs a denominator of things SENT. No party in this band holds a sends record. The denominator does not exist, so no rate can.',
    },
    ONE_THE_DIGEST: 'this file\'s sha256 is in its name and sidecar; every entry carries the artefact\'s own digest as `identity`; shelfDigest below covers the entry lines alone.',
    TWO_THE_DERIVATION: {
      what: 'every file in ~/Downloads named `annie-*` containing `return`, sha256 over bytes, ordinal parsed from the filename.',
      identityVersusLabel: 'the DIGEST is identity; the ORDINAL is parsed from a filename, which is a label (R799/R803). An entry claims these bytes are here and a name says they are return N.',
      unresolvedFilenames: unresolved,
    },
    THREE_THE_RANGE: { covers: `${LO}–${HI}`, ordinals: HI - LO + 1, statedApartFromTheNumbers: `nothing here bears on any ordinal outside ${LO}–${HI}.` },
    FOUR_SENDS_OR_HOLDINGS: { answer: 'HOLDINGS — arrival, not dispatch. This store sends nothing in this direction.' },
    THE_SHELF: { ordinalsHeld: byOrdinal.size, ordinalsNotOnThisShelf: notHere.length, notHere },
    THE_DESKS_FOUR: 'the desk holds 108–111 of this band. Where its four and this shelf overlap, an artefact on both is CROSSED for that leg; an artefact on one only is the asymmetry. This listing does not compute that — it supplies a side of it.',
    entries,
  };
  const lines = entries.map((e) => `${e.ordinal}\t${e.onThisShelf ? String(e.identity) : 'NOT ON THIS SHELF'}`);
  const d = digestOverText('the entry lines joined by \\n, no trailing newline, each "<ordinal>\\t<sha256 or NOT ON THIS SHELF>"', lines.join('\n'));
  const artefact = { ...payload, SHELF_LINES: lines, shelfDigest: d.value, shelfDigestSpec: d.spec, ...findingsDigest(payload, ['THE_SHELF', 'THREE_THE_RANGE', 'entries']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('holdings-listing-69-111', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'holdings-listing-69-111');
  console.log(`band ${LO}–${HI}: held ${byOrdinal.size} of ${HI - LO + 1}; not on this shelf ${notHere.length}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
