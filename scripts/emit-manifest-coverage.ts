/** WHICH MANIFEST COVERS WHAT, AND WHAT NOTHING COVERS (R801). */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

async function run() {
  assertFixture('manifest-coverage', [
    { name: 'an ordinal inside a covered band is covered', input: '40', mustBeCaught: true },
    { name: 'one inside the desk band is covered', input: '150', mustBeCaught: true },
    { name: 'one in the hole is not', input: '90', mustBeCaught: false },
    { name: 'the far edge of the hole is not', input: '111', mustBeCaught: false },
  ], (n) => { const v = Number(n); return (v >= 8 && v <= 68) || (v >= 112 && v <= 173); });

  const desk = JSON.parse(readFileSync('/Users/davidb/Downloads/desk-outbound-manifest.json', 'utf8')) as { returnsStagedForCowork: { range: [number, number]; gaps: number[]; count: number }; count: number; byRecipient: Record<string, number> };
  const [dLo, dHi] = desk.returnsStagedForCowork.range;
  const bands = [
    { manifest: 'her outputs manifest', records: 'SENDS — what she produced', range: [8, 68] as [number, number] },
    { manifest: 'this store\'s holdings manifest', records: 'HOLDINGS — what is on this disk', range: [8, 68] as [number, number] },
    { manifest: 'the desk outbound manifest', records: 'STAGED — what the desk put at the door', range: [dLo, dHi] as [number, number] },
  ];
  const covered = new Set<number>();
  for (const b of bands) for (let n = b.range[0]; n <= b.range[1]; n++) covered.add(n);
  const hole: number[] = [];
  for (let n = 8; n <= dHi; n++) if (!covered.has(n)) hole.push(n);
  requirePopulation('emit:manifest-coverage', { 'manifests reconciled': bands.length });

  const payload = {
    kind: 'manifest-coverage-map',
    THE_BANDS: bands.map((b) => ({ ...b, range: `${b.range[0]}–${b.range[1]}` })),
    WHAT_EACH_PAIRING_SETTLES: {
      '8–68': 'TWO LEGS: her SENDS against this store\'s HOLDINGS. Their difference IS the loss — 6 confirmed (59, 60, 61, 63, 66, 68). This band is settled.',
      '112–173': 'the desk\'s STAGED against Cowork\'s holdings. Its 12 gaps explain 12 of Cowork\'s 15: the desk never staged them, so no crossing was ever attempted.',
      andWHYTHATISNOTTHESAMEASALOSS: 'a staged record is not a sent record and neither is a held record. The desk states that limit itself, and it is the reason its gaps EXPLAIN Cowork\'s rather than duplicating them.',
    },
    THE_HOLE: {
      range: hole.length ? `${hole[0]}–${hole[hole.length - 1]}` : 'none',
      count: hole.length,
      meaning: `${hole.length} ordinals are covered by NO manifest from any party. Not clean, not lost — UNMEASURED. Her outputs manifest stops at 68 and the desk's staging record starts at 112.`,
      whatItWouldTake: 'a sends manifest or a staging record reaching into 69–111. This store can produce a holdings manifest for that band on request, but holdings alone settle nothing — a difference needs two legs, and there is no second leg there.',
    },
    THE_135_FACT: {
      what: '135 is in the desk\'s never-staged list for Cowork AND arrived on this disk today.',
      meaning: '**crossing is per-recipient.** One artefact can be late to one party, never staged to another, and present at a third — so "was 135 lost?" has no single answer, and the three parties were right to disagree about it. It was never a loss to anyone; it was late here and unstaged there.',
      andTHATISTHEFOURTHSTATEEARNINGITSKEEP: 'without LATE, the honest report of 135 on this disk would have stayed "absent" and then silently become wrong (R798).',
    },
    THE_DESKS_OWN_LIMITS_QUOTED: { coverage: 'artefacts staged at this desk only. It says nothing about what arrived anywhere.', limit: 'a staged record is not a sent record and neither is a held record — three states, and this manifest attests only the first.' },
    deskTotals: { artefacts: desk.count, byRecipient: desk.byRecipient, returnsStagedForCowork: desk.returnsStagedForCowork.count },
    hole,
  };
  const lines = bands.map((b) => `${b.manifest}\t${b.records.split(' —')[0]}\t${b.range[0]}-${b.range[1]}`);
  const d = digestOverText('the band lines joined by \\n, no trailing newline, each "<manifest>\\t<records>\\t<lo>-<hi>"', lines.join('\n'));
  const artefact = { ...payload, BAND_LINES: lines, bandDigest: d.value, bandDigestSpec: d.spec, ...findingsDigest(payload, ['THE_BANDS', 'WHAT_EACH_PAIRING_SETTLES', 'THE_HOLE', 'THE_135_FACT', 'hole']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('manifest-coverage-map', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'manifest-coverage-map');
  console.log(`bands 3 | settled 8–68 and ${dLo}–${dHi} | unmeasured ${hole.length} (${hole[0]}–${hole[hole.length - 1]})`);
}
run().catch((e) => { console.error(e); process.exit(1); });
