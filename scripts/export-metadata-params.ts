/**
 * THE FIVE METADATA PARAMETERS — CLOSED — `pnpm export:metadata-params`
 *
 * R44 found all five of R31's metadata parameters were class B (open, not design-limited).
 * Annie's rulings of 2026-08-09 closed them:
 *
 *   - M-pct.shape, M-geom.shape, M-money.kind, M-money.parts — PROMOTED directly. Each already sat
 *     in scope at the point of return (`c.shape`, or a tier-indexed table `draft` could trivially
 *     read), so threading it onto the emitted item was the `parses` pattern: a fact always true of
 *     the item, now recorded rather than merely knowable. No new executor input, no risk to derived
 *     values.
 *
 *   - M-inverse.mode SPLIT, because the determinacy question had two different answers within one
 *     parameter:
 *       T3 vs T4 — ASSERTED via the EXISTING `op` field (T3 alone carries `op: 'sub'`).
 *       T1 vs T2 — checked empirically before writing anything: 31/31 sampled T1 operand
 *         signatures also occurred among T2's multiplication draws — the same emitted item is
 *         genuinely consistent with two declared tiers, not recoverable in principle from what
 *         `draft` already returned. Closed with a DECLARED FLAG at generation time (a generator
 *         addition, authored the way comma's site types are authored, not a verifier derivation).
 *       T5 — free, once `steps` already uniquely implies it.
 *
 * Retrospective sweep after all five: 13,173 items across 19 signed families, 0 disagreeing.
 * No fingerprint moved — none of this touched the DECLARED surface (tierRule/structuralParams/
 * numberRanges), only what `draft` writes onto the emitted item, which the signature never hashed.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'metadata-params-closed';

const ROWS = [
  { family: 'M-pct', param: 'shape', outcome: 'Promoted — c.shape threaded onto every branch.' },
  { family: 'M-geom', param: 'shape', outcome: 'Promoted — c.shape threaded onto every branch.' },
  { family: 'M-money', param: 'kind', outcome: 'Promoted — the literal threaded per branch.' },
  { family: 'M-money', param: 'parts', outcome: 'Promoted — the literal threaded per branch.' },
  {
    family: 'M-inverse', param: 'mode',
    outcome:
      'Split: T3/T4 asserted via existing `op` presence, T1/T2 closed with a declared `mode` flag ' +
      '(genuine collision — same item, two declared tiers), T5 free from `steps`.',
  },
] as const;

function main(): void {
  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(ROWS, generatedAt, 'content', 'the five R31 metadata parameters, closed — how each was resolved');

  const md =
    `# The five metadata parameters — closed\n\n${stampHeader(stamp, 'md')}\n\n` +
    `All five R31 metadata parameters are now asserted. None was class A; R44 found all five were ` +
    `class B — a fact the family already knew and had not written onto the item — and her rulings of ` +
    `2026-08-09 closed every one.\n\n` +
    `**Retrospective sweep: 13,173 items across all 19 signed families, 0 disagreeing. No signature ` +
    `fingerprint moved** — this only changed what \`draft\` writes onto the emitted item, never the ` +
    `declared surface a signature hashes.\n\n` +
    ROWS.map((r) => `## \`${r.family}\` — \`${r.param}\`\n\n${r.outcome}\n`).join('\n') +
    `\n## \`tn-teacher\` — still outstanding\n\n` +
    `The one item from the same pass that is NOT closed. R36: the seven \`parses: 2\` tense rows\n` +
    `needed a per-option call the aggregate did not carry; six were derivable without ambiguity, and\n` +
    `\`tn-teacher\` was held because the arithmetic admits two readings (a past-perfect key with a\n` +
    `past-simple second parse, or one option parsing two ways rather than two options parsing). The\n` +
    `code currently holds the first reading — key \`had copied\`, second parse \`copied\` — sent as a\n` +
    `proposal, not asserted, because the ruling is hers and has not landed.\n`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');
  writeFileSync(join(OUT_DIR, `${base}.md`), md);
  writeFileSync(join(OUT_DIR, `${base}.json`), JSON.stringify({ kind: FAMILY, ...stamp, rows: ROWS }, null, 2));
  for (const ext of ['md', 'json']) deliver(join(OUT_DIR, `${base}.${ext}`), FAMILY);
  console.log(`${ROWS.length} parameters · all closed · tn-teacher flagged outstanding`);
}

main();
