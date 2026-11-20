/**
 * TYPE NORMALISATION OF OPTION VALUES (R1030). `land-proposals` wrote every option value as TEXT, so on
 * the numeric VR doors a row could hold a key of 18 beside distractors "17", "21", "27". A child sees the
 * same thing either way, but the generator emits numbers, so R62's guard read every such row as "would
 * change", and the row itself mixed types. The lander now keeps the stored type; this repairs the rows
 * it already wrote.
 *
 * Per row: only if the KEY is a number, every numeric-text distractor becomes a number. String(value)
 * must be identical before and after for EVERY option, or the row is refused. A row is touched only if
 * its latest machine signature recomputes against the row AS IT IS; it is then re-signed over the
 * normalised row, with a method that says nothing a child sees changed.
 *   tsx scripts/agent-review/normalise-option-value-types.ts [--apply]
 */
import { prisma } from '../../packages/db/src/index';
import { recordSignature } from '../../packages/db/prisma/reviewed-guard';
import { SIGNATURE_SUBJECTS } from '../../packages/core/src/signature-subject';
import { canonicalOrderHash } from '../lib/pin-projection';
import { requirePopulation } from '../lib/population';
const APPLY = process.argv.includes('--apply');
const AGENT = 'rev-agent-01'; const RECORDED_BY = 'human:dbamgbade@gmail.com';
async function main() {
  const rows = await prisma.item.findMany({ where: { status: 'LIVE' }, select: { id: true, stem: true, explanation: true,
    options: { select: { id: true, content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
  const mixed = rows.filter((r) => new Set(r.options.map((o) => typeof (o.content as { value?: unknown })?.value)).size > 1);
  requirePopulation('normalise-option-value-types', { 'LIVE rows with mixed option value types': mixed.length });
  let done = 0; const refused: string[] = [];
  for (const r of mixed) {
    const key = r.options.find((o) => o.isCorrect); const kv = (key?.content as { value?: unknown })?.value;
    if (typeof kv !== 'number') { refused.push(`${r.id}: key is not a number`); continue; }
    const next = r.options.map((o) => { const v = (o.content as { value?: unknown }).value; return { ...o, content: { ...(o.content as object), value: typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v } }; });
    if (next.some((o, i) => String((o.content as { value: unknown }).value) !== String((r.options[i]!.content as { value: unknown }).value))) { refused.push(`${r.id}: a value would read differently`); continue; }
    const sig = await prisma.attributionEvent.findFirst({ where: { recordId: r.id, action: 'SIGNED', reviewerId: AGENT, subjectHash: { not: null } }, orderBy: { at: 'desc' }, select: { subjectHash: true } });
    if (!sig || sig.subjectHash !== canonicalOrderHash(r)) { refused.push(`${r.id}: no machine signature covering the row as it stands`); continue; }
    done++;
    if (!APPLY) continue;
    await prisma.$transaction(async (tx) => {
      for (const o of next) if (typeof (o.content as { value: unknown }).value !== typeof (r.options.find((x) => x.id === o.id)!.content as { value: unknown }).value)
        await tx.itemOption.update({ where: { id: o.id }, data: { content: o.content as object } });
      await tx.attributionEvent.create({ data: { recordType: 'item', recordId: r.id, action: 'AMENDED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'options[].content.value (type)',
        method: 'TYPE NORMALISATION (R1030): numeric option values stored as text converted to numbers to match the key; String(value) asserted identical for every option before and after. No value, tag or text a child sees changed.', note: 'type-normalise' } });
    });
    const after = await prisma.item.findUniqueOrThrow({ where: { id: r.id }, select: { stem: true, explanation: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
    await recordSignature(prisma, { recordType: 'item', recordId: r.id, reviewerId: AGENT, recordedBy: RECORDED_BY,
      method: 'RE-SIGNED after TYPE NORMALISATION (R1030): the previous rev-agent-01 signature covered this row; only the JSON type of numeric option values changed (text to number), every value reads identically. Not a new review.',
      subjectHash: canonicalOrderHash(after), subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind, subjectSpec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec } as Parameters<typeof recordSignature>[1]);
  }
  console.log(`type normalisation — ${APPLY ? 'APPLY' : 'DRY RUN'}: ${done} of ${mixed.length} rows ${APPLY ? 'normalised and re-signed' : 'would be normalised'}; ${refused.length} refused`);
  for (const x of refused) console.log(`  ✗ ${x}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
