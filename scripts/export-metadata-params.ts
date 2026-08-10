/**
 * THE FIVE METADATA PARAMETERS — CLASS AND REASON — `pnpm export:metadata-params`
 *
 * Annie's condition, 2026-08-09: which TEST put each of the five on the metadata side of R31,
 * not just the individual cases. Her two classes:
 *
 *   A — DESIGN. Nothing about the item, however much engineering effort, could ever disagree
 *       with the declaration, because the value is not a computed or drawn fact at all — it is a
 *       fixed label the family's own logic never varies within a tier.
 *
 *   B — OPEN. The value IS known at the exact point the item is built — as a config field already
 *       in scope, or a literal the branch could trivially carry — and simply is not yet written
 *       onto what the item emits. This is R36's exact shape: `optionsThatParse` was here before
 *       `parses` was threaded onto each option. A class-B item is NOT settled; it is a gap that
 *       reads as a decision until someone builds the thread.
 *
 * Every one of the five sorted to B on inspection — none is A. Reported per parameter with the
 * evidence, not asserted as a set, so each can be checked independently.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'metadata-params-classified';

interface Row {
  family: string;
  param: string;
  class: 'B-open';
  reason: string;
  perTier: Record<string, string>;
}

const ROWS: Row[] = [
  {
    family: 'M-money', param: 'kind', class: 'B-open',
    reason:
      'Known the instant each tier\'s branch runs in draft — it is what the branch IS. Not yet ' +
      'written onto operands. Currently unrecoverable in practice: T3 (total) and T4 (change) emit ' +
      'the IDENTICAL operand shape, {firstStepResults: [n]}, so today no other field distinguishes ' +
      'them — this is the threading gap itself, not evidence it cannot be closed.',
    perTier: { T1: 'change', T2: 'change', T3: 'total', T4: 'change', T5: 'change' },
  },
  {
    family: 'M-money', param: 'parts', class: 'B-open',
    reason: 'Same family, same gap as kind — known at the same point in draft, not yet threaded.',
    perTier: { T1: 'one', T2: 'two', T3: 'two', T4: 'two', T5: 'three' },
  },
  {
    family: 'M-pct', param: 'shape', class: 'B-open',
    reason:
      'The lowest-effort case of the five: draft already holds it in scope as `c.shape` at every ' +
      'return point (`const c = PCT_TIERS[tier]`). Adding `shape: c.shape` to each branch\'s ' +
      'operands is a one-line change per branch, not a redesign.',
    perTier: { T1: 'of', T2: 'of', T3: 'of', T4: 'change', T5: 'reverse' },
  },
  {
    family: 'M-geom', param: 'shape', class: 'B-open',
    reason: 'Same shape of gap as M-pct — `c.shape` (from `GEOM_TIERS[tier]`) is already in scope ' +
      'in draft at every branch.',
    perTier: { T1: 'perimeter', T2: 'area', T3: 'mixed', T4: 'lshape', T5: 'notch' },
  },
  {
    family: 'M-inverse', param: 'mode', class: 'B-open',
    reason:
      'Partial evidence already exists that nobody reads: T3 alone carries `op: \'sub\'` on its ' +
      'operands, so T3 vs T4 is separable TODAY by the presence of `op`, with no new field needed. ' +
      'T1 vs T2 is the harder case — when T2\'s internal coin flip draws \'mult\', its operands are ' +
      'BYTE-IDENTICAL to T1\'s ({result, c, op: \'mult\'}), so those two need the same direct-' +
      'threading fix as kind/parts, not a cleverer derivation from what already exists.',
    perTier: { T1: 'known-op', T2: 'spot-op', T3: 'ordered', T4: 'order-decides', T5: 'reverse-mean' },
  },
];

function main(): void {
  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(ROWS, generatedAt, 'content', 'the five R31 metadata parameters, classed A-design or B-open, with the reason for each');

  const md =
    `# The five metadata parameters — class and reason\n\n${stampHeader(stamp, 'md')}\n\n` +
    `Her test: is each metadata because NOTHING about it could be recovered from the emitted item ` +
    `(class A — a property of the family's design), or because nothing CURRENTLY recovers it (class ` +
    `B — a gap that looks like a decision until someone builds the recovery function, exactly what ` +
    `\`optionsThatParse\` was before it became \`parses\`)?\n\n` +
    `**All five sorted to class B. None is class A.** Every one is a fact the family's own drafting ` +
    `logic already determines — either sitting in scope as a config field, or a literal the branch ` +
    `could trivially carry — and none is written onto what the item emits. None is BUILT here: doing ` +
    `so edits a signed family, which is a reviewer's call (the same caution that held \`percent\` on ` +
    `M-pct T4 until her ruling).\n\n` +
    `**Flagged as open, not settled** — R41's earlier framing named these as metadata without saying ` +
    `which class, and the comments in \`families.ts\` said so too. Both corrected.\n\n` +
    ROWS.map(
      (r) =>
        `## \`${r.family}\` — \`${r.param}\` — class ${r.class}\n\n` +
        `${Object.entries(r.perTier).map(([t, v]) => `${t}: \`${v}\``).join(' · ')}\n\n${r.reason}\n`,
    ).join('\n') +
    `\n## \`tn-teacher\` — still outstanding\n\n` +
    `Not a metadata parameter — the other open item on her desk from the same pass. R36: the seven\n` +
    `\`parses: 2\` tense rows needed a per-option call the aggregate did not carry; six were derivable\n` +
    `without ambiguity, and \`tn-teacher\` was held because the arithmetic admits two readings (a\n` +
    `past-perfect key with a past-simple second parse, or one option parsing two ways rather than two\n` +
    `options parsing). The code currently holds the first reading — key \`had copied\`, second parse\n` +
    `\`copied\` — sent as a proposal, not asserted, because the ruling is hers and has not landed.\n`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');
  writeFileSync(join(OUT_DIR, `${base}.md`), md);
  writeFileSync(join(OUT_DIR, `${base}.json`), JSON.stringify({ kind: FAMILY, ...stamp, rows: ROWS }, null, 2));
  for (const ext of ['md', 'json']) deliver(join(OUT_DIR, `${base}.${ext}`), FAMILY);
  console.log(`${ROWS.length} parameters · all class B-open · tn-teacher flagged outstanding`);
}

main();
