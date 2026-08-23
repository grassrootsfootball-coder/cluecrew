/**
 * THE FIRST FRONT-DOOR JUDGEMENTS (Annie's 115th, 2026-08-23 — R665).
 *
 * Four entries: two coverage statements (the fourth record kind's first occupants), one flag and
 * one screening — **every one carrying her name from birth**, which nothing in this corpus has
 * carried before today. Landing then moves both UNRECORDED statuses to SERVABLE through
 * movePassageStatus with her authority: REFER lifts on this block's landing, as her block says.
 *
 * **HER COVERAGE SHAPE MAPS TO THE DOOR'S TYPED SHAPE, AND THE MAPPING IS ON THE RECORD**: her
 * `kind: "coverage"` and prose `readAgainst` (16-char table prefix + "all twenty-one axes") become
 * the door's `coverage-statement` + full digest + count — each mapped field derived from her
 * words, her authored object preserved whole under `_asAuthored`, and the prefix ASSERTED against
 * the amended digest before anything lands (a truncated digest is a prefix, not a digest — R256).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_AXES, CONTENT_AXES_AMENDED_SHA256, readContentFlags } from '../packages/core/src/index';
import { movePassageStatus } from './lib/passage-status';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO, 'content/passages');
const RETURN = '/Users/davidb/Downloads/annie-115-for-code.md';
const RET_SHA = createHash('sha256').update(readFileSync(RETURN)).digest('hex');
const AUTH = `annie-115-for-code.md, sha256 ${RET_SHA} (computed here; none declared with the crossing)`;

const body = readFileSync(RETURN, 'utf8');
const blocks = [...body.matchAll(/^\s+target: passage:([a-z0-9-]+):(coverage|contentFlags|contentScreenings)\n(?:.*\n)?\s+authored: (\{.*\})$/gm)]
  .map((m) => ({ pid: m[1] as string, kind: m[2] as string, obj: JSON.parse(m[3] as string) as Record<string, unknown> }));
if (blocks.length !== 4) throw new Error(`ABORTED — parsed ${blocks.length} of 4.`);

function mapCoverage(obj: Record<string, unknown>): Record<string, unknown> {
  const ra = String(obj.readAgainst ?? '');
  const prefix = /at ([0-9a-f]{16})/.exec(ra)?.[1];
  if (!prefix || !CONTENT_AXES_AMENDED_SHA256.startsWith(prefix)) {
    throw new Error(`ABORTED — her readAgainst prefix ${JSON.stringify(prefix)} is not a prefix of the amended table digest; a truncated digest is a prefix, not a digest, and this one does not even match.`);
  }
  if (!/twenty-one axes/.test(ra) || CONTENT_AXES.length !== 21) {
    throw new Error('ABORTED — her readAgainst does not carry all twenty-one axes, or the table moved.');
  }
  return {
    ...obj,
    kind: 'coverage-statement',
    axesTableSha256: CONTENT_AXES_AMENDED_SHA256,
    axesCount: 21,
    _asAuthored: JSON.stringify(obj),
    _mappedBy: `door-shape mapping at landing (${AUTH}): kind coverage->coverage-statement; readAgainst prefix ${prefix} asserted against the full amended digest; axesCount 21 from her "all twenty-one axes". Every other field hers verbatim.`,
  };
}

const perPid = new Map<string, Record<string, unknown>>();
for (const pid of ['cloze-eng003-a-eco-club', 'cloze-eng003-b-sports-day']) {
  perPid.set(pid, JSON.parse(readFileSync(join(PASSAGES, `${pid}.json`), 'utf8')) as Record<string, unknown>);
}

for (const b of blocks) {
  const p = perPid.get(b.pid)!;
  if (b.kind === 'coverage') {
    p.contentCoverage = [...((p.contentCoverage as unknown[]) ?? []), mapCoverage(b.obj)];
  } else if (b.kind === 'contentScreenings') {
    p.contentScreenings = [...((p.contentScreenings as unknown[]) ?? []), b.obj];
  } else {
    const flag = { ...b.obj };
    const strike = String(flag.strike ?? '');
    const m = /verbatim string per the cross-store rule:\s*(.+)$/.exec(strike);
    if (m) {
      const span = m[1]!.trim();
      const bytes = String(p.body ?? '');
      if (!bytes.includes(span)) throw new Error(`ABORTED — her cited span is not verbatim in ${b.pid}'s body bytes.`);
      const nl = (p.numberedLines ?? []) as Array<{ n: number; text: string }>;
      const lines = nl.filter((l) => l.text && (l.text.includes(span.slice(0, 30)) || span.includes(l.text.trim().slice(0, 30)))).map((l) => l.n);
      flag.strike = { span, lines, _citedAsAuthored: strike };
    }
    p.contentFlags = [...((p.contentFlags as unknown[]) ?? []), flag];
  }
}

for (const [pid, p] of perPid) {
  const report = readContentFlags(p, { enforceUse: true });
  if (report.refusals.length > 0) {
    console.error(`THE DOOR REFUSES ${pid}:`);
    for (const r of report.refusals) console.error(`  ${r.code}  ${r.detail}`);
    process.exitCode = 1;
  } else {
    writeFileSync(join(PASSAGES, `${pid}.json`), JSON.stringify(p, null, 1));
    console.log(`${pid}: landed — coverage ${report.coverage.length}, flags ${report.standardFlags.length}, screenings ${report.screenings.length}, all judgedBy from birth`);
    movePassageStatus(PASSAGES, pid, 'UNRECORDED', {
      status: 'SERVABLE',
      movedBy: 'Annie (disposition KEEP), executed through the standing path',
      authority: `${AUTH} — coverage against all 21 axes at ab870494…; her verified vehicle digests 79f2fcde…/2c59406d… on the coverage rows; REFER lifts on this block's landing`,
      at: '2026-08-23',
      disposition: 'KEEP, no conditions — the first front-door judgements in this corpus',
    });
    console.log(`${pid}: UNRECORDED -> SERVABLE through movePassageStatus, her authority recorded`);
  }
}
