/**
 * ENGLISH: record the machine reviewer's signatures (R1021) and collect the holds for the authoring
 * store. English item text is Cowork's (CLAUDE.md, "Cowork authors, the DB holds"): this writes NO
 * content — only a SIGNED event over the canonical-order subject for rows `rev-agent-01` signed, and a
 * held list naming each fault and its field, which is the return leg to the authoring store.
 *
 * A row is signed only if the database still holds exactly what the reviewer read (stem, options,
 * key, executions, hint, walk script) — a verdict on one set of bytes never licenses another (R982).
 *   tsx scripts/agent-review/land-english.ts [--apply]
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { recordSignature } from '../../packages/db/prisma/reviewed-guard';
import { SIGNATURE_SUBJECTS } from '../../packages/core/src/signature-subject';
import { canonicalOrderHash } from '../lib/pin-projection';

const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'english');
const APPLY = process.argv.includes('--apply');
const AGENT = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(', ') : String(x); };
type PRow = { itemId: string; stem: Record<string, unknown>; key: string; hintCore: unknown; walkScript: unknown; options: Array<{ optionId: string; value: string; isKey: boolean; tag: string | null; execution: string | null }> };

async function main() {
  const files = readdirSync(DIR);
  const packets = new Map<string, PRow>();
  for (const f of files.filter((x) => x.startsWith('stream-') || x.startsWith('cloze-'))) for (const r of (JSON.parse(readFileSync(pjoin(DIR, f), 'utf8')) as { rows: PRow[] }).rows) packets.set(r.itemId, r);
  const signed: string[] = []; const moved: string[] = []; const held: Array<Record<string, unknown>> = [];
  for (const vf of files.filter((x) => /^verdicts-G\d+\.json$/.test(x))) {
    const text = readFileSync(pjoin(DIR, vf), 'utf8');
    const v = JSON.parse(text) as { rows: Array<{ itemId: string; verdict: string; reason: string; faultField?: string | null }> };
    for (const row of v.rows) {
      if (row.verdict !== 'SIGN') { held.push({ ...row, group: vf }); continue; }
      const p = packets.get(row.itemId);
      const r = await prisma.item.findUnique({ where: { id: row.itemId }, select: { status: true, stem: true, explanation: true,
        options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
      const ex = (r?.explanation ?? {}) as Record<string, unknown>;
      const same = !!p && !!r && r.status === 'DRAFT'
        && JSON.stringify(Object.fromEntries(Object.entries(r.stem as Record<string, unknown>).filter(([k]) => !k.startsWith('_')))) === JSON.stringify(p.stem)
        && JSON.stringify(ex.hintCore ?? null) === JSON.stringify(p.hintCore) && JSON.stringify(ex.walkScript ?? null) === JSON.stringify(p.walkScript)
        && r.options.length === p.options.length
        && p.options.every((po) => { const o = r.options.find((x) => x.id === po.optionId); return !!o && val(o.content) === po.value && o.isCorrect === po.isKey && o.misconceptionId === po.tag && (o.misconceptionExecution?.trim() || null) === po.execution; });
      if (!same) { moved.push(row.itemId); continue; }
      signed.push(row.itemId);
      if (APPLY) await recordSignature(prisma, { recordType: 'item', recordId: row.itemId, reviewerId: AGENT, recordedBy: RECORDED_BY,
        method: `agent review (R1021): read against its passage by the machine reviewer ${AGENT}; ${vf} sha256 ${sha(text).slice(0, 16)}. Not read by a person. Note: ${row.reason}`.slice(0, 900),
        subjectHash: canonicalOrderHash(r!), subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind,
        subjectSpec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec } as Parameters<typeof recordSignature>[1]);
    }
  }
  const byField = held.reduce<Record<string, number>>((a, h) => { const k = String(h.faultField ?? 'unstated'); a[k] = (a[k] ?? 0) + 1; return a; }, {});
  writeFileSync(pjoin(DIR, 'held-for-authoring-store.json'), JSON.stringify({ note: 'English rows the machine reviewer rev-agent-01 HELD. Item text is the authoring store\'s to change; each row names its fault and field.', byField, held }, null, 1));
  console.log(`english — ${APPLY ? 'APPLY' : 'DRY RUN'}: ${signed.length} signed, ${moved.length} moved since the packet (not signed), ${held.length} held ${JSON.stringify(byField)}`);
  if (moved.length) console.log(`  moved: ${moved.join(', ')}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
