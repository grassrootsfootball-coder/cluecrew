/**
 * LANDING AN OPTION'S ADDENDUM 36 NOTES (R1041) — attractorLine, defeaterLine, attractorQuote,
 * defeaterQuote and defeatedByAbsence, and NOTHING ELSE.
 *
 * These are staff-facing authoring notes (field-dispositions: staff and quotation), outside the
 * signed row projection, so landing them moves no signature and takes no row out of service. They
 * still land only through a separate reviewer's ATTEST, and the gates run first on the row as it
 * WILL stand, using the same definitions the CI checks use:
 *   - checkAttractorDefeater (packages/core, the rule as amended by R1041);
 *   - every quote verbatim in its passage and inside the item's lineRefs window
 *     (scripts/lib/passage-window.ts, shared with check:source-quotes);
 *   - every line number a real line of the passage.
 *
 *   tsx scripts/agent-review/land-option-lines.ts --door=<door> --precheck
 *   tsx scripts/agent-review/land-option-lines.ts --door=<door> --apply
 *
 * Proposals: content/agent-review/<door>/proposals.json
 *   { rows: [ { optionId, itemId, set: { attractorLine?, defeaterLine?, attractorQuote?, defeaterQuote?, defeatedByAbsence? }, why } ] }
 * A key given as null CLEARS the field; a key left out leaves it as it is.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { checkAttractorDefeater } from '../../packages/core/src/line-refs';
import { prisma } from '../../packages/db/src/index';
import { exportContentSnapshot } from '../content-snapshot';
import { flat, loadPassages, windowText } from '../lib/passage-window';
import { requirePopulation } from '../lib/population';

const REPO = pjoin(__dirname, '..', '..');
const DOOR = process.argv.find((a) => a.startsWith('--door='))?.slice(7);
const APPLY = process.argv.includes('--apply');
const REVIEWER = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const FIELDS = ['attractorLine', 'defeaterLine', 'attractorQuote', 'defeaterQuote', 'defeatedByAbsence'] as const;
type Field = (typeof FIELDS)[number];
interface Row { optionId: string; itemId: string; set: Partial<Record<Field, number | string | boolean | null>>; why: string }

const readJson = <T>(f: string, ok: (x: unknown) => boolean, shape: string): T => {
  if (!existsSync(f)) throw new Error(`${f} is missing`);
  const x = JSON.parse(readFileSync(f, 'utf8')) as unknown;
  if (!ok(x)) throw new Error(`${f}: expected ${shape} (R173)`);
  return x as T;
};

async function main(): Promise<void> {
  if (!DOOR) throw new Error('pass --door=<door>');
  const dir = pjoin(REPO, 'content', 'agent-review', DOOR);
  const rows = readJson<{ rows: Row[] }>(pjoin(dir, 'proposals.json'), (x) => Array.isArray((x as { rows?: unknown }).rows), '{rows[]}').rows;
  for (const r of rows) {
    const bad = Object.keys(r.set ?? {}).filter((k) => !(FIELDS as readonly string[]).includes(k));
    if (bad.length) throw new Error(`${r.optionId}: this lander writes only ${FIELDS.join(', ')}; refused ${bad.join(', ')}`);
  }
  const options = await prisma.itemOption.findMany({ where: { id: { in: rows.map((r) => r.optionId) } },
    select: { id: true, itemId: true, attractorLine: true, defeaterLine: true, attractorQuote: true, defeaterQuote: true, defeatedByAbsence: true, windowClass: true,
      item: { select: { status: true, stem: true, lineRefs: true } } } });
  requirePopulation(`land-option-lines ${DOOR}`, { proposals: rows.length, 'options found': options.length });
  const byId = new Map(options.map((o) => [o.id, o]));
  const passages = loadPassages();

  const faults: string[] = [];
  const ready: Array<{ r: Row; data: Partial<Record<Field, unknown>> }> = [];
  for (const r of rows) {
    const o = byId.get(r.optionId);
    if (!o) { faults.push(`${r.optionId}: no such option`); continue; }
    if (o.itemId !== r.itemId) { faults.push(`${r.optionId}: belongs to ${o.itemId}, not ${r.itemId}`); continue; }
    const after = { ...o, ...r.set } as typeof o;
    const own: string[] = [];
    const lineRefs = Array.isArray(o.item.lineRefs) ? (o.item.lineRefs as number[]) : [];
    for (const reason of checkAttractorDefeater({ itemLineRefs: lineRefs, attractorLine: after.attractorLine, defeaterLine: after.defeaterLine, defeatedByAbsence: after.defeatedByAbsence, windowClass: o.windowClass })) own.push(reason);
    const ref = (o.item.stem as { passageRef?: unknown })?.passageRef;
    const p = typeof ref === 'string' ? passages.get(ref) : undefined;
    if (!p) own.push(`passage ${String(ref)} not found`);
    else {
      const lastLine = Math.max(...(p.numbered ?? []).map((l) => l.n));
      for (const f of ['attractorLine', 'defeaterLine'] as const) {
        const n = after[f];
        if (n != null && (!Number.isInteger(n) || n < 1 || n > lastLine)) own.push(`${f} ${n} is not a line of ${ref} (1–${lastLine})`);
      }
      const win = windowText(p.numbered, lineRefs);
      for (const f of ['attractorQuote', 'defeaterQuote'] as const) {
        const q = after[f];
        if (!q) continue;
        if (!flat(p.text).includes(flat(q))) own.push(`${f} is NOT IN THE SOURCE: ${JSON.stringify(q.slice(0, 60))}`);
        else if (win !== null && !flat(win).includes(flat(q))) own.push(`${f} is in the passage but OUTSIDE lineRefs ${JSON.stringify(lineRefs)}`);
        // ON ITS OWN LINE (R1041, found by the reviewer): matching against the whole passage passed
        // two quotes that ran from their named line onto the next. A quote names one line.
        const at = after[f === 'attractorQuote' ? 'attractorLine' : 'defeaterLine'];
        const lineText = at != null ? p.numbered?.find((l) => l.n === at)?.text : undefined;
        if (lineText !== undefined && !flat(lineText).includes(flat(q))) own.push(`${f} is not on line ${at}: ${JSON.stringify(q.slice(0, 60))}`);
      }
    }
    if (own.length) faults.push(...own.map((x) => `${o.itemId} ${o.id}: ${x}`));
    else ready.push({ r, data: r.set });
  }
  console.log(`land-option-lines ${DOOR}: ${rows.length} proposal(s) · ${ready.length} pass every gate · ${faults.length} fault(s)`);
  for (const f of faults) console.log(`  ✗ ${f}`);
  if (!APPLY) return;
  if (faults.length) throw new Error('REFUSED — every proposal must pass before any lands');

  const review = readJson<{ reviewer: string; rows: Array<{ optionId: string; verdict: string; reason: string }> }>(
    pjoin(dir, 'proposal-review.json'), (x) => Array.isArray((x as { rows?: unknown }).rows), '{reviewer, rows[]}');
  if (review.reviewer !== REVIEWER) throw new Error(`proposal-review.json is signed by ${review.reviewer}, not ${REVIEWER}`);
  const attested = new Map(review.rows.filter((v) => v.verdict === 'ATTEST').map((v) => [v.optionId, v.reason]));
  const land = ready.filter((x) => attested.has(x.r.optionId));
  await prisma.$transaction(async (tx) => {
    for (const { r, data } of land) {
      await tx.itemOption.update({ where: { id: r.optionId }, data: data as never });
      await tx.attributionEvent.create({ data: { recordType: 'item', recordId: r.itemId, action: 'AMENDED', reviewerId: REVIEWER, actor: 'agent-drafter',
        recordedBy: RECORDED_BY, field: `options[${r.optionId}].${Object.keys(data).join(',')}`, note: `${DOOR} (R1041)`,
        method: `Addendum 36 note drafted by an agent and attested by ${REVIEWER}: ${attested.get(r.optionId)}`.slice(0, 900) } });
    }
  }, { timeout: 120000 });
  console.log(`  LANDED ${land.length} · NOT LANDED ${ready.length - land.length} (no attestation)`);
}
main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); })
  .catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
