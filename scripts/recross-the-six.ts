/**
 * RE-CROSS THE SIX (David, 2026-09-02, confirmed from the receiving end).
 *
 * Six of the seven 64-hex-named artefacts are not on the desk; the seventh is there only because
 * it re-crossed under a short name. **Every table the desk read was prose while its artefact
 * stalled.** So the six re-cross BYTE-IDENTICAL under the conforming stamp — 16 hex, which is
 * this staging path's own contract (R967) and the form of all 292 conforming artefacts and every
 * acknowledged one.
 *
 * Byte-identity is the point: every digest already quoted for these six stays true of the
 * re-crossed file. Nothing is regenerated, so nothing can drift between the prose the desk read
 * and the artefact it can now hold.
 *
 * The 64-hex originals are LEFT IN THE LANE. They are the evidence of the stall, they are named
 * in the manifest beside their replacements, and pruning them would destroy the only record that
 * the two names carry one set of bytes (R86).
 */
import { createHash } from 'node:crypto';
import { copyFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';
import { findingsDigest } from './lib/findings-digest';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

/** The six the desk named absent, by their family bases. Their files are found by scanning (R57). */
const SIX = ['round-one-report', 'round-two-report', 'one-run-report', 'seventeen-and-serve-figure', 'mint-lands-door-derives', 'the-final-door-report'];

function main() {
  console.log('RE-CROSS THE SIX — byte-identical, conforming stamp.\n');
  const lane = readdirSync(LANE);
  const found = SIX.map((family) => {
    const hits = lane.filter((f) => f.startsWith(`${family}-`) && f.endsWith('.json') && /[0-9a-f]{64}/.test(f));
    if (hits.length !== 1) throw new Error(`${family}: expected exactly one 64-hex artefact in the lane, found ${hits.length} — refusing to guess which stalled`);
    return { family, oldName: hits[0]! };
  });
  requirePopulation('recross:the-six', { 'stalled artefact(s) located in the lane': found.length });

  const crossed = found.map(({ family, oldName }) => {
    const bytes = readFileSync(pjoin(LANE, oldName));
    const digest = sha(bytes);
    // The conforming name, built by the family's own namer — never by hand (R967).
    const newName = stampedName(family, digest, 'json');
    const staged = pjoin(REPO, 'content/exports', newName);
    writeFileSync(staged, bytes);
    if (sha(readFileSync(staged)) !== digest) throw new Error(`${newName}: the copy is not byte-identical to what stalled`);
    // deliver RESTAMPS to the true byte-hash and may rename, so the delivered path is read from
    // its return value, never assumed to be the source path (R87: the silent no-op, inverted).
    const landed = deliver(staged, family);
    const finalName = landed.split('/').pop()!;
    copyFileSync(pjoin(LANE, finalName), pjoin(DL, finalName));   // onto the desk's floor
    writeFileSync(pjoin(LANE, `${finalName}.sha256`), `${digest}  ${finalName}\n`);
    console.log(`  ${family}: ${oldName.slice(0, 40)}… -> ${finalName}`);
    return { family, stalledAs: oldName, reCrossedAs: finalName, sha256: digest,
      bytesUnchanged: true, whatItCarries: '' };
  });

  // What each report is, so the desk can tie the artefact to the table it already read as prose.
  const carries: Record<string, string> = {
    'round-one-report': 'round one: 250 rows pinned, 200 key readings signed, 20 executions gated (14 landed, 6 held on keyless rows), vr16/vr21 seat-two retags, vr21-opposite-pull minted, vr08 measured at twelve distinct stems',
    'round-two-report': 'round two: the second landing pass over the ten cases',
    'one-run-report': 'the one run: her verdicts as signatures, the executions and regenerations through both gates, the 95 applied in ordinal order, the refusal-shape guard over every refusal set',
    'seventeen-and-serve-figure': 'the seventeen landed PROVISIONAL on the case-vr-16 projection, all sibling conditions holding; the serve check measured at the front door (0 of 11); vr-10\'s two costs',
    'mint-lands-door-derives': 'vr10-first-pair-word-returned landed whole, wet retagged with its execution, and doorOpensOnThisSection derived FIRING on vr-10 at 25 of 25 — the district\'s first whole door, with its blast radius walked',
    'the-final-door-report': 'the final table: eleven doors under the trigger\'s own test, vr-02 pinned and signed against her 197th and 200th, the mint\'s attestation completed',
  };
  for (const c of crossed) c.whatItCarries = carries[c.family] ?? '';

  const manifest = {
    kind: 'THE-SIX-RE-CROSSED',
    TO: 'the desk',
    date: '2026-09-02',
    WHY: 'confirmed from the receiving end: six of the seven 64-hex-named artefacts are not on the desk, and the seventh is there only because it re-crossed under a short name. Every table the desk read was prose while its artefact stalled.',
    THE_CAUSE_IS_THIS_STORES_AND_IS_MECHANICAL: 'the staging path matches -([0-9a-f]{16}) for both its restamp and its family match. A 64-character stamp matches neither, so the file was copied in while the restamp, the family match and the supersession all silently did nothing, and the run reported success. stampedName now truncates to 16 and deliver refuses any other stamped length (R967).',
    BYTE_IDENTITY: 'each re-crossed file is byte-identical to what stalled, asserted after the copy. Every digest already quoted for these six is still true of them; nothing was regenerated, so nothing can have drifted from the prose the desk read.',
    THE_ORIGINALS_STAY: 'the 64-hex files remain in the lane as the evidence of the stall, named here beside their replacements. Pruning them would destroy the only record that the two names carry one set of bytes (R86).',
    THE_SIX: crossed,
  };
  const clean = JSON.parse(JSON.stringify(manifest)) as Record<string, unknown>;
  const dig = findingsDigest(clean, ['THE_SIX']);
  Object.assign(clean, dig);
  const mName = stampedName('the-six-re-crossed', dig.findingsSha256, 'json');
  const mPath = pjoin(REPO, 'content/exports', mName);
  writeFileSync(mPath, JSON.stringify(clean, null, 1));
  const mLanded = deliver(mPath, 'the-six-re-crossed');
  const mFinal = mLanded.split('/').pop()!;
  const mDigest = sha(readFileSync(pjoin(LANE, mFinal)));
  copyFileSync(pjoin(LANE, mFinal), pjoin(DL, mFinal));
  writeFileSync(pjoin(LANE, `${mFinal}.sha256`), `${mDigest}  ${mFinal}\n`);
  console.log(`\n  manifest: ${mFinal}  (file sha256 ${mDigest.slice(0, 16)}…)`);
  console.log('  all six placed in the lane and on the desk\'s floor.');
}

main();
