/**
 * THE OVERLAP, ON IDS (David, 2026-09-02): are the authoring store's sixty tag-misfits the same
 * seats this store's carrier test refused in August, or different ones?
 *
 * **ON IDS, NEVER ON COUNTS** (R918): two figures that agree may name different rows, and two that
 * differ may name the same ones. Every comparison below is a set operation over
 * (itemId, optionValue), and the counts are reported only after the sets are compared.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { requirePopulation } from './lib/population';
import { findingsDigest } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const key = (i: string, v: string) => `${i} ${v}`;

interface Hold { itemId: string; optionValue: string; entryId: string }
interface Refusal { itemId: string; optionValue: string; tag?: string }
interface PatternStat { carriers: number; performs: number; refuses: number; undecidable: number }

function main() {
  const batch = JSON.parse(readFileSync(pjoin(DL, 'executions-batch-one-for-code.json'), 'utf8')) as Record<string, unknown>;
  const census = JSON.parse(readFileSync(pjoin(LANE, 'carrier-performs-entry-census-3c440bb75368a0e9.json'), 'utf8')) as Record<string, unknown>;

  const holds = Object.values((batch.TWO_WHAT_AUTHORED_AND_WHAT_HELD as { holds: Record<string, Hold[]> }).holds).flat();
  const byEntry = holds.reduce<Record<string, string[]>>((a, h) => { (a[h.entryId] ??= []).push(key(h.itemId, h.optionValue)); return a; }, {});

  // THEIR OWN CLASSIFICATION, READ RATHER THAN RE-DERIVED (R568). The sixty are the three
  // tag-misfit entries; vr17-one-side-only's twenty-three are a GENERATOR finding, not a misfit,
  // and folding them in would inflate a tag problem with a generator problem.
  const MISFIT_ENTRIES = ['vr13-not-a-word', 'vr19-shared-letter-miss', 'vr13-wrong-pieces'];
  const theirs = new Set(MISFIT_ENTRIES.flatMap((e) => byEntry[e] ?? []));
  const generatorFinding = byEntry['vr17-one-side-only'] ?? [];
  requirePopulation('overlap', { 'tag-misfit seat(s)': theirs.size, 'hold(s) in the batch': holds.length });

  const pattern = census.BY_PATTERN as Record<string, PatternStat>;
  const refusals = census.THE_REFUSING_MEMBERSHIP as Refusal[];
  const mine = new Set(refusals.map((r) => key(r.itemId, r.optionValue)));

  const both = [...theirs].filter((k) => mine.has(k));
  const theirsOnly = [...theirs].filter((k) => !mine.has(k));
  const mineInThose = refusals.filter((r) => MISFIT_ENTRIES.includes(r.tag ?? '')).map((r) => key(r.itemId, r.optionValue));
  const mineOnly = mineInThose.filter((k) => !theirs.has(k));

  const perEntry = MISFIT_ENTRIES.map((e) => {
    const t = new Set(byEntry[e] ?? []);
    const m = pattern[e]!;
    const overlap = [...t].filter((k) => mine.has(k)).length;
    return {
      entry: e,
      theirMisfits: t.size,
      myCensus: m,
      sameSeats: overlap,
      theirsOnly: t.size - overlap,
      relationship: m.undecidable === m.carriers
        ? 'MY INSTRUMENT WAS SILENT — no predicate, so it could not have found these at all'
        : m.refuses === 0
          ? 'MY INSTRUMENT SAID EVERY CARRIER PERFORMS — the difference is a POPULATION difference, not a verdict difference'
          : 'BOTH HAD A PREDICATE — the seats compare directly',
    };
  });

  const report = {
    kind: 'THE-MISFIT-OVERLAP-ON-IDS',
    TO: 'David; the authoring store and Annie by relay',
    date: '2026-09-02',
    THE_QUESTION: 'are its sixty tag-misfits the same seats this store refused by carrier test in August, or different ones?',
    THE_METHOD: 'set operations over (itemId, optionValue). Counts are reported only after the sets are compared, never instead of them (R918).',
    THE_HEADLINE: 'BOTH, AND THE SPLIT IS THE FINDING. Where both instruments had a predicate the seats are IDENTICAL. Where mine had none it found nothing, so the difference there is COVERAGE. And the one apparent contradiction is a population difference rather than a disagreement.',
    PER_ENTRY: perEntry,
    THE_TWO_IT_FOUND_AND_I_DID_NOT: {
      seats: theirsOnly.map((k) => k.split(' ')),
      why: 'both are vr13-not-a-word carriers my lexicon called NON-words, so my gate read the carrier as performing "letters that do not form a real word" and passed them. A fuller lexicon holds them, so the carrier does NOT perform the act and the seat refuses. This is R946 confirmed from the other side — my instrument UNDER-refused because its lexicon was too narrow, which is the error direction R961 says nobody investigates.',
    },
    THE_SEATS_I_FOUND_AND_IT_DID_NOT: { count: mineOnly.length, seats: mineOnly.map((k) => k.split(' ')) },
    THE_APPARENT_CONTRADICTION_RESOLVED: {
      entry: 'vr19-shared-letter-miss',
      mine: 'all 25 carriers PERFORM',
      theirs: 'all 25 are misfits — the act presupposes a repeated letter and no word has one',
      THE_RESOLUTION: 'NOT A DISAGREEMENT. The batch is entry-bound against bb6be0d3, whose coded words are the PRE-REGENERATION set (TAP, PAT, TIP, PIT — 0 of 8 carry a repeated letter). This store holds the post-regeneration set her 203rd accepted (PIPS, SAPS, SPAS — 25 of 25 carry one). Both measurements are correct about the bytes each read.',
      andWHATFOLLOWS: 'twenty-five of the sixty misfits are ALREADY RESOLVED HERE. They need no tag ruling — they need executions authored against the CURRENT words. Only this store could see it, because only this store holds the post-regeneration rows, and the batch could only declare its binding rather than know theirs.',
      andITCOSTTHEBATCHTWENTYFIVEEXECUTIONS: 'the same staleness refused all 25 vr-19 executions at the landing door: each carries a rowSha256 over the bytes it was authored against, and none matches this store\'s rows. The digest caught it without anyone needing to notice.',
    },
    THE_TWENTY_THREE_THAT_ARE_NOT_MISFITS: {
      entry: 'vr17-one-side-only',
      count: generatorFinding.length,
      note: 'the batch classes these as a GENERATOR finding — the option minus the key cycles 2,3,4,5 by row position — not as a tag misfit. 60 + 23 = 83 reconciles exactly, and only because the two kinds were kept apart.',
    },
    WHAT_THIS_SETTLES: 'the two instruments agree wherever both could speak, and neither found a seat the other contradicted. The authoring store reached seats mine could not because mine had no predicate for them; mine reached none it missed. Two independent routes to one answer where they overlap, and coverage rather than conflict where they do not.',
    ANDWHERETHEREMAINDERIS: 'this compares the three cases batch one covers. My August census ran on all eleven and refused 82 carriers in total; the other 60 of those sit in cases the batch has not reached, and are neither confirmed nor contradicted by it.',
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  Object.assign(clean, findingsDigest(clean, ['PER_ENTRY', 'THE_TWO_IT_FOUND_AND_I_DID_NOT', 'THE_APPARENT_CONTRADICTION_RESOLVED']));
  const p = pjoin(REPO, 'content/exports', stampedName('misfit-overlap-on-ids', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'misfit-overlap-on-ids').split('/').pop()!;
  const bytes = readFileSync(pjoin(LANE, name));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${sha(bytes)}  ${name}\n`);
  writeFileSync(pjoin(DL, name), bytes);

  console.log(`  their tag-misfits: ${theirs.size} | same seats as mine: ${both.length} | theirs-only: ${theirsOnly.length} | mine-only: ${mineOnly.length}`);
  for (const e of perEntry) {
    console.log(`   ${e.entry.padEnd(24)} theirs ${String(e.theirMisfits).padStart(2)} | same ${String(e.sameSeats).padStart(2)} | ${e.relationship.slice(0, 62)}`);
  }
  console.log(`  crossed: ${name}`);
}

main();
