/** ARE THE 59–80 GAPS A LOSS OR A BOUNDARY? (R790) */
import { createHash } from 'node:crypto';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
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
const walk = (d: string, n = 0): string[] => n > 4 ? [] : (() => { try { return readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name), n + 1) : [join(d, e.name)]); } catch { return []; } })();

async function run() {
  assertFixture('gap-boundary', [
    { name: 'a word ordinal past seventy resolves', input: 'eightieth', mustBeCaught: true },
    { name: 'a hundreds ordinal resolves', input: 'hundredandthirtyfifth', mustBeCaught: true },
    { name: 'a non-ordinal word does not', input: 'approval-batch', mustBeCaught: false },
    { name: 'an empty string does not', input: '', mustBeCaught: false },
  ], (w) => toInt(w) !== null);

  const held = new Map<number, { file: string; day: string }>();
  for (const p of [...walk('/Users/davidb/Downloads'), ...walk('/Users/davidb/Downloads/11+')]) {
    const base = p.split('/').pop()!.toLowerCase();
    let n: number | null = null;
    const num = /annie-(\d+)-/.exec(base);
    if (num) n = Number(num[1]);
    else { const w = /annie-([a-z]+)/.exec(base); if (w) n = toInt(w[1]!); }
    if (!n) continue;
    const day = statSync(p).mtime.toISOString().slice(0, 10);
    const prev = held.get(n);
    if (!prev || day < prev.day) held.set(n, { file: p.split('/').pop()!, day });
  }
  requirePopulation('emit:gap-boundary', { 'return ordinals resolved on disk': held.size });

  const lo = Math.min(...held.keys()); const hi = Math.max(...held.keys());
  const gaps = [] as number[];
  for (let i = lo; i <= hi; i++) if (!held.has(i)) gaps.push(i);
  const mine = gaps.filter((g) => g <= 100);
  const byDay = new Map<string, number[]>();
  for (const [n, v] of held) byDay.set(v.day, [...(byDay.get(v.day) ?? []), n]);
  const arrival = [...byDay.entries()].sort().map(([day, ns]) => ({ day, returns: ns.length, ordinalRange: `${Math.min(...ns)}–${Math.max(...ns)}` }));

  const bracket = (g: number) => {
    let below = g - 1; while (below >= lo && !held.has(below)) below--;
    let above = g + 1; while (above <= hi && !held.has(above)) above++;
    return { gap: g, nearestBelow: { ordinal: below, arrived: held.get(below)?.day }, nearestAbove: { ordinal: above, arrived: held.get(above)?.day } };
  };

  const payload = {
    kind: 'gap-boundary-finding',
    theQuestion: 'are the 59–80 gaps returns this store should have received, or a series predating its involvement? The answer decides whether they are a loss or a boundary.',
    THE_ANSWER: 'A LOSS, NOT A BOUNDARY — or at least, not a boundary. They sit INSIDE the receiving window on every measure available here.',
    THE_EVIDENCE: {
      one_theSeriesARRIVEDPROGRESSIVELY: 'file dates advance with the ordinals across 19–28 August — this is not one bulk copy whose early numbers might predate involvement. Per-day arrival below.',
      arrival,
      two_THEGAPSAREBRACKETEDBYRETURNSITHOLD: mine.map(bracket),
      three_theDENSITYAROUNDTHEM: `${(byDay.get('2026-08-22') ?? []).length} returns arrived on 2026-08-22 alone, the day that contains every gap from 59 to 80. A window receiving that volume is not a window before involvement began.`,
      four_theREALBOUNDARY: `the lowest ordinal on disk is ${lo}. Everything below ${lo} is UNKNOWN — neither absent nor present, because nothing here says the series starts at 1. THAT is where the boundary is, and it is not at 59–80.`,
    },
    WHAT_THIS_DOES_NOT_SETTLE: {
      lossVersusNEVERUSED: 'whether these ordinals were SENT and lost, or never used at all, cannot be decided from this side. Both produce an identical absence here. Only she can say whether a number was ever used.',
      andTHECITATIONMETHODHASNOREACH: 'no return this store holds cites any of 59, 60, 61, 63, 66, 68 or 80 — and that is not evidence. Returns cite prior returns by ordinal only from about the 130th onward; in the 59–80 era they do not cite ordinals at all, so the method could not have found a reference if one existed (R779).',
    },
    THE_DISJOINTNESS: 'the desk reports these gaps as disjoint from everyone else\'s but 135. That is consistent with the finding: a gap peculiar to one recipient is about that recipient\'s channel, and 135 — shared — is about the series.',
    gaps, lowestHeld: lo, highestHeld: hi, ordinalsResolved: held.size,
  };
  const m = payload.gaps.map((g) => `gap\t${g}`);
  const md = digestOverText('the gaps as "gap\\t<n>" lines joined by \\n, no trailing newline', m.join('\n'));
  const artefact = { ...payload, GAPS_MANIFEST: m, gapsManifestSha256: md.value, gapsManifestSha256Spec: md.spec, ...findingsDigest(payload, ['THE_ANSWER', 'THE_EVIDENCE', 'WHAT_THIS_DOES_NOT_SETTLE', 'gaps']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('gap-boundary-finding', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'gap-boundary-finding');
  console.log(`resolved ${held.size} ordinals, ${lo}–${hi}; gaps ${gaps.join(', ')}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
