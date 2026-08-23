/**
 * THE COMPLETION CENSUS (David's item 2, 2026-08-23) — for the meet against the authoring store's
 * artefact. Every figure DERIVED at emit time from the passage files; nothing typed (R649: a number
 * in prose is computed, never composed). Units on every face.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentFlags } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO, 'content/passages');

function main() {
  const files = readdirSync(PASSAGES).filter((f) => f.endsWith('.json'));
  requirePopulation('completion-census', { 'passage file(s)': files.length });

  let flags = 0; let screenings = 0; let splitObjects = 0; let legacyStrings = 0; let legacyObjects = 0;
  let cuts = 0; const declaredByKind: Record<string, number> = {}; const standingConditions: string[] = [];
  const screenedClean: string[] = []; const withFlags: string[] = []; const refusals: string[] = [];

  for (const f of files) {
    const p = JSON.parse(readFileSync(join(PASSAGES, f), 'utf8')) as Record<string, unknown>;
    const r = readContentFlags({ ...p, extract: (p.extract ?? p.text) as string }, { enforceUse: true });
    for (const x of r.refusals) refusals.push(`${x.code} ${x.where}`);
    flags += r.standardFlags.length;
    screenings += r.screenings.length;
    if (r.screenings.length) screenedClean.push(String(p.id));
    if (r.standardFlags.length) withFlags.push(String(p.id));
    legacyStrings += r.legacy.strings; legacyObjects += r.legacy.objects;
    for (const d of r.declared) declaredByKind[d.kind] = (declaredByKind[d.kind] ?? 0) + 1;
    for (const sf of r.standardFlags) {
      if (sf.splitNote) splitObjects++;
      if (sf.disposition === 'cut') cuts++;
      if (typeof sf.conditionMetBy === 'string' && /falls due|STANDING/i.test(sf.conditionMetBy)) {
        standingConditions.push(`${String(p.id)} ${sf.axis} — ${String(sf.condition).slice(0, 70)}`);
      }
    }
  }

  const payload = {
    what: 'The serving store\'s completion census, every figure derived at emit time — for the meet against the authoring store\'s artefact.',
    derivation: 'readContentFlags over every passage file, enforceUse on. No figure below is typed.',
    census: {
      standardFlags: { n: flags, unit: 'flags in the standard\'s object shape' },
      screenings: { n: screenings, unit: 'screened-clean records (recorded zeros)', passages: screenedClean },
      splits: { objects: splitObjects, splits: splitObjects / 2, unit: 'objects from split conversions / legacy flags that were two judgements' },
      cutDispositions: { n: cuts, unit: 'CUT-disposition objects (avoidances in the standard\'s shape)' },
      declaredStrikes: { byKind: declaredByKind, unit: 'flags per declaration kind' },
      standingConditions: { n: standingConditions.length, unit: 'open conditions falling due on new items', rows: standingConditions },
      legacyRemaining: { strings: legacyStrings, objects: legacyObjects, whole: legacyStrings + legacyObjects, unit: 'legacy flags (strings / pre-standard objects / whole — the authoring store\'s unit)' },
      passagesWithFlags: { n: withFlags.length, unit: 'passages carrying at least one standard flag' },
      doorRefusals: { n: refusals.length, rows: refusals },
    },
  };
  console.log(JSON.stringify(payload.census, null, 1));
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'the completion census, derived, for the two-store meet', ['what', 'derivation', 'census']);
  const out = join(REPO, 'content/exports', stampedName('completion-census', stamp.sourceHash, 'json'));
  writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(out, 'completion-census');
}

main();
