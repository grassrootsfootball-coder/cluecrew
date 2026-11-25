/**
 * WALK-THROUGH DOOR (R1067): lands what the reviewing agent APPROVED, and nothing else.
 *
 * Reads `content/agent-review/walk/<case>/{packet,drafts?,review}.json`. A row lands only if:
 *   · the reviewer APPROVED it (a `draft` verdict needs a draft; an `existing` verdict lands the stored text);
 *   · the database still holds what the reviewer read — stem, options and the stored script (R982);
 *   · the child-facing gate passes on the row AS IT WILL BE (`checkItemChildFacing`);
 *   · on a reading-comprehension row, every quotation is on the screen and on the line it names (`checkWalkQuotes`).
 * It writes the script (if new) and the approval ON THE ROW — `walkScriptApprovedBy` (the machine
 * reviewer, never a person — R94), `walkScriptAuthority` (the review file and its digest) and
 * `walkScriptApprovedSha256` (the digest of the exact text read, so an edit withholds it again) — then
 * records an AttributionEvent, re-signs the row over its new projection, and re-exports the snapshot.
 *
 *   tsx scripts/agent-review/land-walks.ts --case=case-vr-09 [--apply]
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { recordSignature } from '../../packages/db/prisma/reviewed-guard';
import { SIGNATURE_SUBJECTS } from '../../packages/core/src/signature-subject';
import { checkItemChildFacing, isBlocking } from '../../packages/core/src/index';
import { canonicalOrderHash } from '../lib/pin-projection';
import { loadClearances } from '../lib/clearances';
import { exportContentSnapshot } from '../content-snapshot';
import { checkWalkQuotes } from './walk-quote-check';

const CASE = process.argv.find((a) => a.startsWith('--case='))?.slice(7);
const APPLY = process.argv.includes('--apply');
/** --precheck: run the child-facing gate on every DRAFT against its row as it will be. No review needed, nothing written. */
const PRECHECK = process.argv.includes('--precheck');
const AGENT = 'rev-agent-01';
const RECORDED_BY = 'human:david@eliteprojectgroup.co.uk';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(', ') : String(x); };
/** Reading-comprehension rows quote a passage: every quotation must be on the screen, on the line it names (walk-quote-check). */
const quoteFaults = (qt: string | null, script: string, stem: unknown, options: Array<{ content: unknown }>) =>
  qt?.startsWith('en-comp-') ? checkWalkQuotes(script, stem, options.map((o) => val(o.content))).faults.map((q) => `quote: '${q.quote}' ${q.why}`) : [];

type PRow = { itemId: string; stem: unknown; options: Array<{ value: string; isKey: boolean }>; walkScript: string | null };

async function main() {
  if (!CASE) throw new Error('pass --case=case-vr-NN');
  const dir = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'walk', CASE);
  const packet = JSON.parse(readFileSync(pjoin(dir, 'packet.json'), 'utf8')) as { rows: PRow[] };
  const draftsFile = pjoin(dir, 'drafts.json');
  const drafts = new Map(existsSync(draftsFile) ? (JSON.parse(readFileSync(draftsFile, 'utf8')) as { drafts: Array<{ itemId: string; walkScript: string }> }).drafts.map((d) => [d.itemId, d.walkScript.trim()]) : []);
  if (PRECHECK) {
    const clear0 = loadClearances(); let bad = 0;
    for (const [itemId, script] of drafts) {
      const r = await prisma.item.findUnique({ where: { id: itemId }, select: { questionTypeId: true, stem: true, explanation: true, options: { select: { content: true, isCorrect: true, misconceptionId: true }, orderBy: { id: 'asc' } } } });
      if (!r) { console.log(`  ✗ ${itemId}: no such row`); bad++; continue; }
      const next = { ...(r.explanation as object), walkScript: script, walkScriptApprovedBy: `reviewer:${AGENT}`, walkScriptAuthority: 'precheck', walkScriptApprovedSha256: sha(script) };
      const f = [...checkItemChildFacing({ id: itemId, stem: r.stem, explanation: next, options: r.options, clearedAppropriatenessTokens: clear0.get(itemId) } as never).filter(isBlocking).map((x) => `${x.rule}: ${String(x.detail).slice(0, 160)}`),
        ...quoteFaults(r.questionTypeId, script, r.stem, r.options)];
      if (f.length) { bad++; console.log(`  ✗ ${itemId}: ${f.join(' | ')}`); }
    }
    console.log(`${CASE} — PRECHECK: ${drafts.size} draft(s), ${drafts.size - bad} pass the gate, ${bad} fail`);
    return;
  }
  const reviewText = readFileSync(pjoin(dir, 'review.json'), 'utf8');
  const review = JSON.parse(reviewText) as { reviewer: string; rows: Array<{ itemId: string; source: string; verdict: string; reason: string }> };
  if (review.reviewer !== AGENT) throw new Error(`review is signed "${review.reviewer}", not ${AGENT}`);
  const authority = `content/agent-review/walk/${CASE}/review.json sha256 ${sha(reviewText)}`;
  const clear = loadClearances();

  const landed: string[] = []; const held: Array<{ itemId: string; why: string }> = [];
  for (const v of review.rows) {
    if (v.verdict !== 'APPROVE') { held.push({ itemId: v.itemId, why: `REFUSED: ${v.reason}` }); continue; }
    const p = packet.rows.find((r) => r.itemId === v.itemId);
    if (!p) { held.push({ itemId: v.itemId, why: 'not in the packet' }); continue; }
    const script = v.source === 'draft' ? drafts.get(v.itemId) : p.walkScript;
    if (!script) { held.push({ itemId: v.itemId, why: `approved as ${v.source} but no ${v.source} script exists` }); continue; }
    const r = await prisma.item.findUnique({ where: { id: v.itemId }, select: { status: true, questionTypeId: true, stem: true, explanation: true, options: { select: { content: true, isCorrect: true, misconceptionId: true }, orderBy: { id: 'asc' } } } });
    const ex = (r?.explanation ?? {}) as Record<string, unknown>;
    const stored = typeof ex.walkScript === 'string' ? ex.walkScript : null;
    const same = !!r && r.status === 'LIVE' && JSON.stringify(r.stem) === JSON.stringify(p.stem) && stored === p.walkScript
      && r.options.length === p.options.length && p.options.every((po, i) => val(r.options[i]!.content) === po.value && r.options[i]!.isCorrect === po.isKey);
    if (!same) { held.push({ itemId: v.itemId, why: 'the row moved since the packet was exported — re-export and re-review' }); continue; }
    if (ex.walkScriptApprovedSha256 === sha(script) && ex.walkScriptApprovedBy) { held.push({ itemId: v.itemId, why: 'already approved for this exact text' }); continue; }
    const next = { ...ex, walkScript: script, walkScriptApprovedBy: `reviewer:${AGENT}`, walkScriptAuthority: authority, walkScriptApprovedSha256: sha(script),
      walkScriptStatus: 'APPROVED — agent review (R1067)' };
    const faults = [...checkItemChildFacing({ id: v.itemId, stem: r!.stem, explanation: next, options: r!.options, clearedAppropriatenessTokens: clear.get(v.itemId) } as never).filter(isBlocking).map((f) => `${f.rule}: ${String(f.detail).slice(0, 120)}`),
      ...quoteFaults(r!.questionTypeId, script, r!.stem, r!.options)];
    if (faults.length) { held.push({ itemId: v.itemId, why: `gate: ${faults.join(' | ')}` }); continue; }
    landed.push(v.itemId);
    if (!APPLY) continue;
    await prisma.$transaction(async (tx) => {
      await tx.item.update({ where: { id: v.itemId }, data: { explanation: next as object } });
      await tx.attributionEvent.create({ data: { recordType: 'item', recordId: v.itemId, action: 'AMENDED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY,
        field: 'explanation.walkScript', method: `walk-through ${v.source === 'draft' ? 'drafted by a drafting agent and ' : ''}APPROVED by the machine reviewer ${AGENT}; ${authority}. Not read by a person.`,
        note: `script sha256 ${sha(script).slice(0, 16)}${stored && stored !== script ? `; replaced sha256 ${sha(stored).slice(0, 16)}` : ''}` } });
    });
    const now = await prisma.item.findUniqueOrThrow({ where: { id: v.itemId }, select: { stem: true, explanation: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
    await recordSignature(prisma, { recordType: 'item', recordId: v.itemId, reviewerId: AGENT, recordedBy: RECORDED_BY,
      method: `walk-through approved (R1067); the row re-signed over its projection as it now stands. ${authority}`.slice(0, 900),
      subjectHash: canonicalOrderHash(now), subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind,
      subjectSpec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec } as Parameters<typeof recordSignature>[1]);
  }
  console.log(`${CASE} — ${APPLY ? 'APPLY' : 'DRY RUN'}: ${landed.length} land, ${held.length} held (of ${review.rows.length} reviewed)`);
  for (const h of held) if (!h.why.startsWith('REFUSED')) console.log(`  held ${h.itemId}: ${h.why}`);
  writeFileSync(pjoin(dir, `landed-${APPLY ? 'apply' : 'dry'}.json`), JSON.stringify({ landed, held }, null, 1));
  if (APPLY && landed.length) exportContentSnapshot();
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
