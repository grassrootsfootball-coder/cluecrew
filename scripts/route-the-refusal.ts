/**
 * ROUTING THE REFUSAL, AND WALKING THE CLASS (David, 2026-08-25 — R710).
 *
 * The five refused reissue items cross to Cowork — its authoring, its words, its faults — with
 * the door's EXACT refusal per item, captured from the door's own run rather than retyped.
 * Then: every gate and importer that refuses authored content, and whether its refusal can
 * reach the party who must repair it.
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const FIVE = ['ENG-018-RB-01', 'ENG-018-RB-11', 'ENG-019-BV-02', 'ENG-023-RT-08', 'ENG-027-RR-08'];
const SRC = '/Users/davidb/Downloads/REISSUESIXITEMS.json';
const SRC_SHA = 'b8a5f4cf949247c48e01910288808c1d88c067e7e0d8911e9ff2c0b10d76790c';
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

function run() {
  const bytes = readFileSync(SRC);
  if (sha256(bytes) !== SRC_SHA) throw new Error(`REFUSED — the reissue file reads ${sha256(bytes)}, declared ${SRC_SHA}`);
  const src = JSON.parse(bytes.toString('utf8')) as { digestSpec: unknown; items: Array<{ itemId: string; sourceFile: string; sha256: string; bytes: number; item: Record<string, unknown> }> };

  // The door's exact words, captured from its own run — never retyped (R649).
  let doorOut = '';
  try { doorOut = execSync('pnpm check:reissue-completion', { cwd: REPO, encoding: 'utf8' }); }
  catch (e) { const err = e as { stdout?: string; stderr?: string }; doorOut = String(err.stdout ?? '') + String(err.stderr ?? ''); }
  const refusalFor = new Map<string, string[]>();
  const lines = doorOut.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /REFUSED\s+(ENG-[A-Z0-9-]+)\s+—\s+(.+)$/.exec(lines[i]!.trim());
    if (!m) continue;
    const follow = (lines[i + 1] ?? '').trim();
    refusalFor.set(m[1]!, [m[2]!.trim(), follow.startsWith('recorded') ? follow : ''].filter(Boolean));
  }
  for (const id of FIVE) if (!refusalFor.has(id)) throw new Error(`REFUSED — the door did not name ${id}; its verdict must be captured, not assumed`);

  const rows = FIVE.map((id) => {
    const row = src.items.find((r) => r.itemId === id);
    if (!row) throw new Error(`REFUSED — ${id} is not in the reissue file`);
    return {
      itemId: id,
      sourceFile: row.sourceFile, declaredRowSha256: row.sha256, declaredBytes: row.bytes,
      theDoorsExactRefusal: refusalFor.get(id),
      fullItemContentVerbatim: row.item,
    };
  });

  const crossing = {
    kind: 'refused-reissue-items-for-cowork',
    what: 'The five reissued items that never landed on the serving side — full content as Cowork authored it, plus the serving gate\'s EXACT refusal per item. Cowork has never been told these were refused.',
    why: 'They are its authoring, the faults are in its words, and this store does not reword another store\'s content (CLAUDE.md, one direction only). The repair is Cowork\'s; this is the routing that was missing.',
    sourceOfContent: { file: 'REISSUESIXITEMS.json', sha256: SRC_SHA, digestSpec: src.digestSpec, note: 'content reproduced verbatim from the file Cowork shipped; per-row digests as it declared them' },
    theDoorsVerdictCapturedNotRetyped: { command: 'pnpm check:reissue-completion', capturedThisTurn: true, rawTail: doorOut.trim().split('\n').slice(-4) },
    theStandingFact: 'This check has recorded all five refusals, each with its reason and the note "repairable by Cowork — authored content", SINCE 2026-08-20. It exits 0 by design so it cannot become permanently red and muted. Everything worked except the leg that reaches the author.',
    theSixth: 'ENG-015-CC-12 passed the same gate and imported; it is not in this crossing.',
    rows,
  };
  const cj = JSON.stringify(crossing, null, 1) + '\n';
  const cn = stampedName('refused-reissue-items-for-cowork', sha256(cj).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', cn), cj);
  deliver(join(REPO, 'content/exports', cn), 'refused-reissue-items-for-cowork');

  // ---- The walk ----
  const authored = JSON.parse(readFileSync('/private/tmp/claude-501/-Users-davidb-ClueCrew/9a8d8aea-32f1-4537-bb18-2b54d4491646/scratchpad/authored-refusals.json', 'utf8')) as Array<Record<string, unknown>>;
  const byVerdict: Record<string, string[]> = {};
  for (const a of authored) {
    const v = String(a.verdict);
    (byVerdict[v] ??= []).push(String(a.file));
  }
  const walk = {
    kind: 'refusal-routing-walk',
    what: 'Every gate and importer that refuses AUTHORED CONTENT, and whether its refusal can reach the party who must repair it. Membership, not a repair.',
    limitsFirst: [
      'THE POPULATION IS DERIVED FROM REFUSAL VOCABULARY IN SOURCE, not from running every gate: 220 files across scripts/ and packages/ contain refusal vocabulary, which over-includes anything that merely throws. The sharp population below is the 64 check/import doors, of which 53 refuse authored content — a judgement made by scanning each for the child-facing gates and content fields, and it is a read, not a proof.',
      'ROUTED-TO-CI IS NOT NOTHING: those refusals are durable, dated and visible on this side. What the walk measures is whether they can reach the AUTHOR, which is a different question and the one this class is about.',
      'A door with a crossable artefact is not thereby routed: deliver() STAGES a file; arrival is the other store\'s to report (R255). The column says CAN REACH, never DID.',
    ],
    method: 'per door: does a refusal end in a crossable artefact (deliver), a non-zero exit wired into CI, a local file or store row, or console only — read from the source of each door.',
    population: { filesWithRefusalVocabulary: 220, checkAndImportDoors: 64, refusingAuthoredContent: 53 },
    verdictCounts: Object.fromEntries(Object.entries(byVerdict).map(([k, v]) => [k, v.length])),
    membership: byVerdict,
    theFinding: '49 OF 53 DOORS THAT REFUSE ANOTHER STORE\'S WORDS CANNOT REACH THAT STORE. Four route to a crossable artefact; 18 route to CI, visible only here; 5 write a local record; 26 print and stop. The reissue was not an outlier — it is the ordinary case, and it only became visible because someone asked what happened to five ids.',
    sharpestInstance: 'scripts/check-outstanding-import-refusals.ts — a check whose entire subject is outstanding import refusals PRINTS ONLY and is not wired into CI. The instrument built to watch this class is itself in it.',
  };
  const wj = JSON.stringify(walk, null, 1) + '\n';
  const wn = stampedName('refusal-routing-walk', sha256(wj).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', wn), wj);
  deliver(join(REPO, 'content/exports', wn), 'refusal-routing-walk');
  console.log(`\ncrossing rows: ${rows.length}; walk verdicts: ${JSON.stringify(walk.verdictCounts)}`);
}

run();
