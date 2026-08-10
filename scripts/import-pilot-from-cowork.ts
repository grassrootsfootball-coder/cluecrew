/**
 * IMPORT A PILOT RULING FROM COWORK — `pnpm import:pilot <path-to-file-in-downloads>`
 *
 * The other half of the Downloads boundary. Cowork's own changes never land on the canonical file
 * by being dropped in a folder — this script is the only door, and it never overwrites blind:
 *
 *   1. Diffs the incoming file against `content/pilot-review/`, field by field on the shared
 *      structure, same discipline as the English batch merge (CLAUDE.md's "ONE DIRECTION ONLY").
 *   2. Reports every difference. Applies NOTHING automatically — it prints what changed and stops.
 *   3. A human decides which fields to accept, then applies them through `scripts/lib/pilot-review`
 *      exactly as any other ruling — same gate, same log, same locked file. This script's job ends
 *      at "here is what differs," not "here is what I changed."
 *
 * Running this on a file that was itself hand-edited (rather than exported by
 * `export-pilot-for-cowork.ts`) is fine — the diff doesn't care how the incoming file was produced,
 * only that nothing is accepted without a human reading the difference first.
 */
import { readFileSync } from 'node:fs';
import { readPilotFile, type PilotBatch } from './lib/pilot-review';

function diffItem(a: Record<string, unknown>, b: Record<string, unknown>, path: string, out: string[]): void {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const av = a[k];
    const bv = b[k];
    const an = JSON.stringify(av, Object.keys(typeof av === 'object' && av ? (av as object) : {}).sort());
    const bn = JSON.stringify(bv, Object.keys(typeof bv === 'object' && bv ? (bv as object) : {}).sort());
    if (an === bn) continue;
    if (typeof av === 'object' && av && typeof bv === 'object' && bv && !Array.isArray(av) && !Array.isArray(bv)) {
      diffItem(av as Record<string, unknown>, bv as Record<string, unknown>, `${path}.${k}`, out);
    } else {
      out.push(`${path}.${k}:\n    canonical: ${JSON.stringify(av)}\n    incoming:  ${JSON.stringify(bv)}`);
    }
  }
}

function main(): void {
  const incomingPath = process.argv[2];
  if (!incomingPath) {
    console.error('usage: pnpm import:pilot <path-to-file-in-downloads>');
    process.exit(1);
  }
  const incomingRaw = JSON.parse(readFileSync(incomingPath, 'utf8'));
  const incoming: PilotBatch = incomingRaw.batch ?? incomingRaw; // unwrap export envelope if present
  const canonicalFilename = 'ENG-004-anne-green-gables.json';
  const canonical = readPilotFile(canonicalFilename);

  const canonicalItems = new Map(canonical.items.map((i) => [i.itemId, i]));
  const incomingItems = new Map(incoming.items.map((i) => [i.itemId, i]));
  const diffs: string[] = [];

  for (const id of new Set([...canonicalItems.keys(), ...incomingItems.keys()])) {
    const c = canonicalItems.get(id);
    const n = incomingItems.get(id);
    if (!c) { diffs.push(`${id}: present in incoming, absent from canonical`); continue; }
    if (!n) { diffs.push(`${id}: present in canonical, absent from incoming`); continue; }
    const itemDiffs: string[] = [];
    diffItem(c as unknown as Record<string, unknown>, n as unknown as Record<string, unknown>, id, itemDiffs);
    diffs.push(...itemDiffs);
  }

  if (diffs.length === 0) {
    console.log(`${canonicalFilename}: no differences. The incoming file matches the canonical copy field for field.`);
    return;
  }
  console.log(`${diffs.length} field-level difference(s) between canonical and incoming:\n`);
  for (const d of diffs) console.log('  ' + d + '\n');
  console.log('Nothing was applied. Apply accepted fields through scripts/lib/pilot-review.ts.');
}

main();
