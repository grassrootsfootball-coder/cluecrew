/**
 * THE STAGED ARTEFACTS' DIGESTS — asserted on the SIDECAR, which is the thing that makes a claim,
 * never on the NAME, which turns out not to make one (R754).
 *
 * Found by sweeping the door after a restamp bug: 117 of 168 staged names disagree with their
 * bytes, which reads as catastrophic and is not. **The 16 hex in a stamped name is not one
 * convention.** Some emitters stamp the file digest; others stamp a payload digest or a batch id
 * — one stamp sits on TEN files, which no file digest could. So a name cannot verify anything and
 * was never able to; the SIDECAR can, and every one of them agrees with its bytes.
 *
 * That is R173 on my own sweep: the alarming number was the instrument reading a convention it had
 * assumed was uniform. The finding that survives is smaller and real — the sidecar is the only
 * verification surface here, so it is the one with a guard on it, and an artefact staged without
 * one is unverifiable rather than merely undocumented.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { OUTBOUND_DIR } from './lib/export-destination';
import { declareMayBeEmpty, requirePopulation } from './lib/population';

// R61/R1056: absent folder = a declared-empty population, printed as such; a PRESENT folder with
// nothing in it is still a pipeline failure (requirePopulation).
if (!existsSync(OUTBOUND_DIR)) {
  declareMayBeEmpty('check:staged-digests', `staged artefacts at ${OUTBOUND_DIR}`, 0,
    "the outbound folder is Cowork's staging door on David's machine, outside the repository; Cowork is retired (R1034) and a CI checkout has no such folder (R1056). Where the folder exists, every staged artefact is still checked.");
  process.exit(0);
}
const files = readdirSync(OUTBOUND_DIR).filter((f) => f.endsWith('.json'));
requirePopulation('check:staged-digests', { 'staged artefacts at the outbound door': files.length });

let disagree = 0, noSidecar = 0;
for (const f of files) {
  const side = join(OUTBOUND_DIR, `${f}.sha256`);
  if (!existsSync(side)) { noSidecar++; continue; }
  const actual = createHash('sha256').update(readFileSync(join(OUTBOUND_DIR, f))).digest('hex');
  const declared = readFileSync(side, 'utf8').trim().split(/\s+/)[0];
  if (actual !== declared) { disagree++; console.log(`  DISAGREES  ${f}\n    sidecar ${declared}\n    bytes   ${actual}`); }
}

console.log(`staged artefacts: ${files.length}`);
console.log(`  sidecar present: ${files.length - noSidecar}  |  sidecar DISAGREES with the bytes: ${disagree}`);
console.log(`  no sidecar (unverifiable — predates deliver(), not a corruption): ${noSidecar}`);
console.log('  the NAME is not checked: it is not one convention, and one stamp sits on ten files. Only the sidecar asserts the bytes.');
if (disagree > 0) { console.error('A staged artefact does not match the digest it was crossed under. Nothing on the far side can verify it.'); process.exit(1); }
