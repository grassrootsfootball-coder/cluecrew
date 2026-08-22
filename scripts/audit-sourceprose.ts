/**
 * THE RETROACTIVE sourceProse AUDIT (her hundredth §1; David's item 2, 2026-08-23).
 *
 * Every landed object's archive field byte-compared against the legacy string its landing
 * displaced. **Her concession names ONE drift (the catalogue's em dashes flattened to commas by
 * her own house-rule reflex); seventeen passages landed under the same hand-copied seeding, and
 * this audit is the difference between one known drift and an unknown population.** Drift reported
 * per row WITH OPCODES — the reading that locates a gap, not just a boolean that announces one.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO, 'content/passages');

/** Minimal opcode diff: common prefix/suffix, then the differing middles, byte-addressed. */
function opcodes(a: string, b: string): string {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  let j = 0;
  while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  return `equal[0:${i}] · archive[${i}:${a.length - j}]=${JSON.stringify(a.slice(i, a.length - j))} `
    + `vs legacy[${i}:${b.length - j}]=${JSON.stringify(b.slice(i, b.length - j))} · equal[-${j}:]`;
}

function main() {
  const files = readdirSync(PASSAGES).filter((f) => f.endsWith('.json'));
  requirePopulation('audit:sourceprose', { 'passage file(s)': files.length });

  let compared = 0;
  let seededAtLanding = 0;
  const unmatched: string[] = [];
  const drifts: Array<{ where: string; opcodes: string }> = [];

  for (const f of files) {
    const p = JSON.parse(readFileSync(join(PASSAGES, f), 'utf8')) as Record<string, unknown>;
    // The stamp field has TWO SHAPES — flat ({displaced, by}) from the first landings, keyed
    // ({runName: {displaced, by}}) afterwards — and a reader that assumes one reports the other's
    // rows as candidateless (R598: a field with two syntaxes is two fields wearing one name).
    const stampField = (p._displacedLegacyFlags ?? {}) as Record<string, unknown>;
    const stampEntries = 'displaced' in stampField ? [stampField] : Object.values(stampField);
    const displaced: string[] = stampEntries
      .filter((d): d is { displaced?: unknown[] } => Boolean(d) && typeof d === 'object')
      .flatMap((d) => (d.displaced ?? []).filter((x): x is string => typeof x === 'string'));
    for (const flag of ((p.contentFlags ?? []) as unknown[])) {
      if (!flag || typeof flag !== 'object') continue;
      const o = flag as Record<string, unknown>;
      const prose = o.sourceProse;
      if (typeof prose !== 'string' || prose === 'as above') continue;
      compared++;
      if (o._sourceProseSeededBy) { seededAtLanding++; continue; }
      if (displaced.includes(prose)) continue; // byte-identical to a displaced legacy string
      // Not byte-equal to any displacement: pair by TOKEN OVERLAP, never by positional characters —
      // the first version scored byte-position equality, paired Sir Henry's flag with the convict's
      // string, and produced opcodes about a comparison nobody meant (R569: a match carries what it
      // matched on, and this one was matching on noise).
      const tokens = (s: string) => new Set(s.toLowerCase().split(/[^a-z']+/).filter((w) => w.length > 3));
      const pw = tokens(prose);
      const best = displaced
        .map((s) => { const sw = tokens(s); const shared = [...pw].filter((w) => sw.has(w)).length;
          return { s, shared: shared / Math.max(1, Math.max(pw.size, sw.size)) }; })
        .sort((x, y) => y.shared - x.shared)[0];
      if (best && best.shared < 0.5) {
        unmatched.push(`${f} ${String(o.axis)} — nearest legacy string shares only ${(best.shared * 100).toFixed(0)}% of tokens; no confident pair, no opcodes emitted`);
        continue;
      }
      if (!best) { unmatched.push(`${f} ${String(o.axis)} — no displacement stamp holds a candidate (split second-objects share the pair's prose)`); continue; }
      drifts.push({ where: `${f} ${String(o.axis)}`, opcodes: opcodes(prose, best.s) });
    }
  }

  console.log(`\n  ${compared} archive field(s) compared [unit: converted objects with own sourceProse]`);
  console.log(`  ${seededAtLanding} seeded from bytes at landing (form ruling ten) — byte-true by construction`);
  console.log(`  ${drifts.length} DRIFTED — the archive is not the legacy bytes:`);
  for (const d of drifts) console.log(`    ${d.where}\n      ${d.opcodes}`);
  if (unmatched.length) {
    console.log(`  ${unmatched.length} with no candidate in the stamps (reported, not counted as drift):`);
    for (const u of unmatched) console.log(`    ${u}`);
  }
  if (drifts.length === 0) console.log('  A ZERO HERE IS ONE-SIDED: it says no archive differs from its stamp. A copy that drifted IDENTICALLY in both places would read clean — the stamps were written by the same landings.');

  const payload = { what: 'Retroactive sourceProse audit: archive fields vs displacement stamps, opcodes per drift.', compared, seededAtLanding, drifts, unmatched };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content', 'the sourceProse audit', ['what', 'compared', 'seededAtLanding', 'drifts', 'unmatched']);
  const out = join(REPO, 'content/exports', stampedName('sourceprose-audit', stamp.sourceHash, 'json'));
  writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(out, 'sourceprose-audit');
}

main();
