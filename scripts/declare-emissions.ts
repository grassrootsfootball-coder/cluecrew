/**
 * THE HIGH-WATER RULE (David, 2026-09-02): DECLARE YOUR EMISSIONS TO THE DESK, AND THE DESK
 * DIFFS ITS SHELF AGAINST YOUR DECLARATION.
 *
 * **Every reader here iterates what is PRESENT, so an absent artefact is not reported absent —
 * it is not reported** (R579, in the channel this store emits into rather than the one it
 * receives from). The desk, reading its own shelf, can enumerate what it holds and can never
 * enumerate what it is missing. `stagingQueue` does not close this: it reads what came BACK and
 * infers, which measures QUOTING, not HOLDING. **Only the receiving side can diff, and it can
 * only diff against a declaration the sender emits.** The desk has never been checked against
 * what it should hold, and nothing on this side can check it.
 *
 * So this emits the declaration, and states its own limits rather than implying it has none:
 *   - IT DECLARES ONE SENDER'S EMISSIONS. The authoring store must declare its own; this store
 *     cannot see that lane and does not guess at it.
 *   - IT CANNOT REPORT ARRIVAL. `deliver()` has said so since R255: the last hop is a human
 *     upload no code here can see.
 *   - UNACKNOWLEDGED IS NOT ABSENT. Most artefacts arrive and are never quoted back by name.
 *
 * The two kinds are ARTEFACT and SIDECAR, and they are separate files that cross independently —
 * so a sidecar can arrive without its artefact, an artefact without its sidecar, and either
 * alone is unverifiable. Both are declared, and the orphans of both kinds are named.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { stagingQueue } from './lib/export-destination';
import { requirePopulation } from './lib/population';
import { assessRefusalShape, runRefusalShapeFixture, type ScreenedRow } from './lib/refusal-shape';
import { findingsDigest } from './lib/findings-digest';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');

interface Entry { name: string; sha256: string; bytes: number; stagedAt: string; kind: 'ARTEFACT' | 'SIDECAR'; family: string }

/** family = the name with its trailing -<hex> stamp and extension removed (deliver keeps one current per family). */
function familyOf(name: string): string {
  const base = name.replace(/\.sha256$/, '').replace(/\.[a-z0-9]+$/i, '');
  return base.replace(/-[0-9a-f]{8,64}$/i, '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
}

function main() {
  console.log('DECLARE EMISSIONS — the high-water rule.\n');
  runRefusalShapeFixture();

  const all = readdirSync(LANE).filter((f) => !f.startsWith('.')).sort();
  // A DIRECTORY IN THE LANE IS NOT A FILE AND IS NOT NOTHING (R98). It is declared as its own
  // class rather than skipped, because a silent skip is how a staged thing stops being counted.
  const dirs = all.filter((f) => { try { return statSync(pjoin(LANE, f)).isDirectory(); } catch { return false; } });
  const names = all.filter((f) => !dirs.includes(f));
  requirePopulation('declare:emissions', { 'file(s) in the outbound lane': names.length });
  const entries: Entry[] = names.map((name) => {
    const full = pjoin(LANE, name);
    const st = statSync(full);
    return { name, sha256: sha(readFileSync(full)), bytes: st.size,
      stagedAt: st.mtime.toISOString(), kind: name.endsWith('.sha256') ? 'SIDECAR' : 'ARTEFACT', family: familyOf(name) };
  });
  const artefacts = entries.filter((e) => e.kind === 'ARTEFACT');
  const sidecars = entries.filter((e) => e.kind === 'SIDECAR');

  // ---- SIDECAR INTEGRITY: does each sidecar's declared digest match its artefact's bytes? ------
  const byName = new Map(entries.map((e) => [e.name, e]));
  const sidecarChecks = sidecars.map((s) => {
    const target = s.name.replace(/\.sha256$/, '');
    const art = byName.get(target);
    const declared = readFileSync(pjoin(LANE, s.name), 'utf8').trim().split(/\s+/)[0] ?? '';
    return { sidecar: s.name, artefact: target, artefactPresent: !!art,
      verdict: !art ? 'ORPHAN SIDECAR — the artefact it vouches for is not in this lane'
        : declared === art.sha256 ? 'MATCHES' : `MISMATCH — sidecar says ${declared.slice(0, 16)}, bytes hash to ${art.sha256.slice(0, 16)}` };
  });
  const mismatches = sidecarChecks.filter((c) => c.verdict.startsWith('MISMATCH'));
  const orphanSidecars = sidecarChecks.filter((c) => c.verdict.startsWith('ORPHAN'));
  const unvouched = artefacts.filter((a) => !byName.has(`${a.name}.sha256`));

  // ---- THE HIGH-WATER MARK, per kind and per family -------------------------------------------
  const latest = (list: Entry[]) => list.slice().sort((a, b) => a.stagedAt.localeCompare(b.stagedAt)).at(-1) ?? null;
  const families = [...new Set(artefacts.map((a) => a.family))].sort();
  const familyHighWater = families.map((f) => {
    const mine = artefacts.filter((a) => a.family === f);
    const cur = latest(mine)!;
    return { family: f, currentFile: cur.name, sha256: cur.sha256, stagedAt: cur.stagedAt, versionsInLane: mine.length };
  });

  // ---- THE NAMING FINDING, measured ------------------------------------------------------------
  const q = stagingQueue([DL, pjoin(DL, '11+'), ...readdirSync(pjoin(DL, '11+'))
    .map((d) => pjoin(DL, '11+', d))
    .filter((d) => { try { return statSync(d).isDirectory() && !d.endsWith('from-cluecrew'); } catch { return false; } })]);
  const acked = new Set(q.acknowledged);
  const hex64 = (n: string) => /[0-9a-f]{64}/.test(n);
  const long = entries.filter((e) => hex64(e.name));
  const naming = {
    theHypothesis: 'this store\'s emission naming broke the house convention this session, and the break correlates exactly with the one confirmed stall',
    theHouseConvention: 'stampedName\'s own documented example is a TRUNCATED digest — `vr-free-ten-c17a98c9d7c439cf.json`, 16 hex; the desk\'s own artefacts carry 12. The function takes whatever it is handed.',
    whatChanged: 'every report emitted this session passed the FULL 64-character digest to stampedName, producing names of ~100 characters where every prior emission produced ~34',
    filesCarryingA64HexName: long.length,
    ofThoseAcknowledged: long.filter((e) => acked.has(e.name)).length,
    acknowledgedFilesCarryingA64HexName: q.acknowledged.filter(hex64).length,
    acknowledgedTotal: q.acknowledged.length,
    theConfirmedStall: 'vr03-reversed-relation-crossed-1bfec75c…bd10.json (64-hex, ~100 chars) did not reach the desk. Re-crossed byte-identical as VR03REVERSEDRELATIONCROSSEDWHOLE6196d573bf6e.json (12-hex, 48 chars) it arrived and verified three ways.',
    THE_BOUND: 'ONE confirmed stall and ONE confirmed arrival of the same bytes under two names is a pair, not a proof. The separation (every 64-hex-named file unacknowledged, no acknowledged file carrying one) is real and small; the mechanism is unknown to this side and may be nothing to do with the name. It is declared as a hypothesis for the desk to confirm or kill by saying which of the seven it holds.',
    theSevenToCheckFirst: long.filter((e) => e.kind === 'ARTEFACT').map((e) => ({ name: e.name, sha256: e.sha256 })),
    theRepair: 'emissions return to a truncated stamp. This declaration is emitted under one, and is itself the first test of the hypothesis.',
  };

  // The refusal-shape guard over the acknowledgement split, fed the discriminating dimension (R962).
  const shapeRows: ScreenedRow[] = entries.map((e) => ({
    refused: !acked.has(e.name),
    reason: !acked.has(e.name) ? `never quoted back by name (kind ${e.kind})` : undefined,
    dims: { kind: e.kind, nameLength: e.name.length > 60 ? 'long' : 'short' },
  }));
  assessRefusalShape('declare:acknowledgement', shapeRows);

  const declaration = {
    kind: 'THE-EMISSIONS-DECLARATION',
    TO: 'the desk — to diff its shelf against',
    date: '2026-09-02',
    THE_RULE: 'declare your emissions to the desk, and the desk diffs its shelf against your declaration. Every reader iterates what is present, so the desk can enumerate what it holds and never what it is missing; only a sender\'s declaration makes its own absences findable (R579, turned on the outbound channel).',
    WHAT_THIS_IS_NOT: {
      notArrival: 'this declares what was STAGED, never what arrived. deliver() has said so since R255: the last hop is a human upload no code here can see.',
      notBothSenders: 'ONE sender is declared — this store. The authoring store emits to the same desk and must declare its own lane; this store cannot see it and does not guess at it.',
      notAnAbsenceCount: `${q.unacknowledged.length} of ${q.staged.length} staged files have never been quoted back by name. That is a QUEUE LENGTH, not an absence count — most artefacts arrive and are never named in a reply. Nothing here says the desk lacks them; only the desk can say that.`,
    },
    THE_TWO_KINDS: {
      why: 'an ARTEFACT and its SIDECAR are separate files that cross independently. A sidecar alone vouches for nothing; an artefact alone is unverifiable against a declared digest.',
      artefacts: artefacts.length,
      sidecars: sidecars.length,
      artefactsWithNoSidecar: unvouched.length,
      orphanSidecars: orphanSidecars.length,
      sidecarDigestMismatches: mismatches.length,
      directoriesInTheLane: dirs.length ? dirs : 'none',
      andWhatThatMeans: mismatches.length === 0
        ? 'every sidecar in this lane recomputes against its artefact\'s bytes. The digests below are the files\' own.'
        : 'a sidecar disagrees with its artefact — declared before anything else, because a wrong digest is worse than none.',
    },
    THE_HIGH_WATER_MARK: {
      perKind: { ARTEFACT: latest(artefacts), SIDECAR: latest(sidecars) },
      soTheDeskCanAsk: 'do I hold the high-water file? If not, everything after some earlier point stalled. If yes, the per-family list below finds the gaps beneath it.',
      families: families.length,
    },
    THE_NAMING_FINDING: naming,
    PER_FAMILY_CURRENT: familyHighWater,
    EVERY_FILE_STAGED: entries.map((e) => ({ name: e.name, sha256: e.sha256, bytes: e.bytes, stagedAt: e.stagedAt })),
    SIDECAR_INTEGRITY: { mismatches, orphanSidecars, artefactsWithNoSidecar: unvouched.map((a) => a.name) },
  };

  const clean = JSON.parse(JSON.stringify(declaration)) as Record<string, unknown>;
  const dig = findingsDigest(clean, ['EVERY_FILE_STAGED', 'PER_FAMILY_CURRENT', 'THE_NAMING_FINDING', 'THE_TWO_KINDS']);
  Object.assign(clean, dig);
  // PRACTISING THE FINDING: a truncated stamp, and placed on the desk's floor as well as the lane.
  const shortName = `EMISSIONSDECLARATION${dig.findingsSha256.slice(0, 12)}.json`;
  const out = pjoin(REPO, 'content/exports', shortName);
  writeFileSync(out, JSON.stringify(clean, null, 1));
  const fileDigest = sha(readFileSync(out));
  copyFileSync(out, pjoin(LANE, shortName));
  copyFileSync(out, pjoin(DL, shortName));
  writeFileSync(pjoin(LANE, `${shortName}.sha256`), `${fileDigest}  ${shortName}\n`);

  console.log(`\n  lane: ${entries.length} files — ${artefacts.length} artefacts, ${sidecars.length} sidecars, ${families.length} families`);
  console.log(`  sidecar integrity: ${mismatches.length} mismatch(es), ${orphanSidecars.length} orphan sidecar(s), ${unvouched.length} artefact(s) with no sidecar`);
  console.log(`  naming: ${naming.filesCarryingA64HexName} file(s) carry a 64-hex name, ${naming.ofThoseAcknowledged} acknowledged; of ${naming.acknowledgedTotal} acknowledged files, ${naming.acknowledgedFilesCarryingA64HexName} carry one`);
  console.log(`  high-water ARTEFACT: ${latest(artefacts)?.name}`);
  console.log(`\n  DECLARED: ${shortName}`);
  console.log(`  file sha256: ${fileDigest}`);
  console.log(`  placed in the lane, on the desk's floor, and in content/exports.`);
}

main();
