/**
 * AGENT REVIEW — STEP 4: land what the reviewer attested, and nothing else (David's ruling,
 * 2026-11-18: an agent acts in the reviewer role).
 *
 * Writes under the MACHINE reviewer `rev-agent-01`, never under a person's name (R94). For each door:
 *   · refuses outright if the database has moved since the packet was exported — a verdict read
 *     against one set of bytes does not license a write to another (R982);
 *   · lands an execution only when the drafter EXECUTES, the reviewer ATTESTS, the seat is still
 *     empty and still carries the same tag, and — where the tag has a mechanical predicate — the
 *     tag-write gate PERFORMS on the row;
 *   · records a signature only for a reviewer SIGN, over the canonical-order subject (her 216th);
 *   · writes every refusal to `held.json`, so a seat that needs a new distractor is a named job.
 *
 *   tsx scripts/agent-review/land-door.ts --door=vr-17            (dry run)
 *   tsx scripts/agent-review/land-door.ts --door=vr-17 --apply
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { recordSignature } from '../../packages/db/prisma/reviewed-guard';
import { SIGNATURE_SUBJECTS } from '../../packages/core/src/signature-subject';
import { checkTagWrite, TAG_PREDICATES } from '../../packages/core/src/tag-write-gate';
import { canonicalOrderHash } from '../lib/pin-projection';
import { loadChildLexicon } from '../lib/child-lexicon';

const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review');
const DOOR = process.argv.find((a) => a.startsWith('--door='))?.slice(7);
const APPLY = process.argv.includes('--apply');
// A seat the REVIEWER attested conditionally (e.g. on a row being rebuilt) is held by name, never landed.
const SKIP = new Set((process.argv.find((a) => a.startsWith('--skip='))?.slice(7) ?? '').split(',').filter(Boolean));
const REVIEWER = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(',') : String(x); };

interface Packet { door: string; rows: Array<{ itemId: string; signed: boolean; options: Array<{ optionId: string; value: string; isKey: boolean; tag: string | null; execution: string | null }> }> }
interface Draft { itemId: string; optionId: string; value: string; tag: string; verdict: 'EXECUTES' | 'CANNOT_EXECUTE'; execution?: string; reason?: string }
interface Verdicts { executions: Array<{ optionId: string; verdict: string; reason?: string }>; rows: Array<{ itemId: string; verdict: string; reason?: string; signedRowDefect?: boolean; existingExecutionWrong?: boolean }> }

async function main() {
  if (!DOOR) throw new Error('pass --door=vr-NN');
  const dir = pjoin(DIR, DOOR);
  for (const f of ['packet.json', 'drafts.json', 'verdicts.json']) if (!existsSync(pjoin(dir, f))) throw new Error(`${DOOR}: ${f} is missing — nothing lands without all three`);
  const packetText = readFileSync(pjoin(dir, 'packet.json'), 'utf8');
  const packet = JSON.parse(packetText) as Packet;
  const drafts = (JSON.parse(readFileSync(pjoin(dir, 'drafts.json'), 'utf8')) as { drafts: Draft[] }).drafts;
  const verdictsText = readFileSync(pjoin(dir, 'verdicts.json'), 'utf8');
  const verdicts = JSON.parse(verdictsText) as Verdicts;
  const verdictOf = new Map(verdicts.executions.map((v) => [v.optionId, v]));
  const lex = loadChildLexicon();
  const isWord = (w: string) => lex.knows(w) || lex.knowsBare(w);

  // THE DATABASE MUST STILL BE WHAT THE AGENTS READ.
  const ids = packet.rows.map((r) => r.itemId);
  const live = await prisma.item.findMany({ where: { id: { in: ids } }, select: { id: true, status: true, stem: true, explanation: true,
    options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  const moved: string[] = [];
  for (const pr of packet.rows) {
    const r = live.find((x) => x.id === pr.itemId);
    if (!r || r.status !== 'DRAFT') { moved.push(`${pr.itemId}: ${r ? r.status : 'gone'}`); continue; }
    for (const po of pr.options) {
      const o = r.options.find((x) => x.id === po.optionId);
      if (!o || val(o.content) !== po.value || o.isCorrect !== po.isKey || o.misconceptionId !== po.tag || ((o.misconceptionExecution ?? '').trim() || null) !== po.execution) moved.push(`${pr.itemId} ${po.value}`);
    }
  }
  if (moved.length) throw new Error(`${DOOR}: the database moved since the packet was exported — re-export and re-review. ${moved.slice(0, 5).join('; ')}`);

  const land: Array<{ itemId: string; optionId: string; value: string; tag: string; text: string }> = [];
  const held: Array<Record<string, unknown>> = [];
  for (const d of drafts) {
    const v = verdictOf.get(d.optionId);
    const pr = packet.rows.find((r) => r.itemId === d.itemId);
    const po = pr?.options.find((o) => o.optionId === d.optionId);
    if (!po || po.tag !== d.tag || po.execution !== null) { held.push({ ...d, why: 'draft does not match an empty tagged seat in the packet' }); continue; }
    if (!v) { held.push({ ...d, why: 'no reviewer verdict' }); continue; }
    if (SKIP.has(d.optionId)) { held.push({ ...d, why: 'held by name: reviewer attested conditionally', reviewer: v }); continue; }
    if (d.verdict === 'EXECUTES' && v.verdict === 'ATTEST' && d.execution?.trim()) {
      if (d.tag in TAG_PREDICATES) {
        const r = live.find((x) => x.id === d.itemId)!;
        const g = checkTagWrite({ stem: r.stem as Record<string, unknown>, optionValue: d.value, keyValue: val(r.options.find((o) => o.isCorrect)?.content), misconceptionId: d.tag }, isWord);
        if (g.verdict === 'REFUSES') { held.push({ ...d, why: `tag-write gate REFUSES: ${g.why}`, reviewer: v }); continue; }
      }
      land.push({ itemId: d.itemId, optionId: d.optionId, value: d.value, tag: d.tag, text: d.execution.trim() });
    } else {
      held.push({ itemId: d.itemId, optionId: d.optionId, value: d.value, tag: d.tag, drafter: d.verdict, drafterReason: d.reason ?? null,
        reviewer: v.verdict, reviewerReason: v.reason ?? null,
        needs: (d.verdict === 'CANNOT_EXECUTE' && v.verdict === 'AGREE') || v.verdict === 'REFUSE' ? 'NEW DISTRACTOR or new execution' : 'redraft' });
    }
  }

  const toSign = verdicts.rows.filter((r) => r.verdict === 'SIGN' && packet.rows.find((p) => p.itemId === r.itemId && !p.signed));
  const rowHolds = verdicts.rows.filter((r) => r.verdict !== 'SIGN');

  console.log(`${DOOR} — ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`  executions: ${land.length} land, ${held.length} held`);
  console.log(`  rows: ${toSign.length} to sign, ${rowHolds.length} held${rowHolds.some((r) => r.signedRowDefect) ? ` (${rowHolds.filter((r) => r.signedRowDefect).length} SIGNED rows found defective)` : ''}`);

  if (APPLY) {
    const method = `agent review (David's ruling 2026-11-18): drafted by a drafting agent, ATTESTED by the machine reviewer rev-agent-01 independently; verdicts ${sha(verdictsText).slice(0, 16)}, packet ${sha(packetText).slice(0, 16)}. Not read by a person.`;
    await prisma.$transaction(async (tx) => {
      for (const l of land) {
        await tx.itemOption.update({ where: { id: l.optionId }, data: { misconceptionExecution: l.text } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: l.itemId, action: 'AMENDED', reviewerId: REVIEWER,
          actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'options.misconceptionExecution', method,
          note: `${l.value}: ${l.tag}; execution sha256 ${sha(l.text).slice(0, 16)}` } });
      }
    }, { timeout: 60000 });
    for (const s of toSign) {
      const r = await prisma.item.findUniqueOrThrow({ where: { id: s.itemId }, select: { stem: true, explanation: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
      await recordSignature(prisma, { recordType: 'item', recordId: s.itemId, reviewerId: REVIEWER, recordedBy: RECORDED_BY,
        method: `${method} Reviewer note: ${s.reason ?? ''}`.slice(0, 900),
        subjectHash: canonicalOrderHash(r), subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind,
        subjectSpec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec } as Parameters<typeof recordSignature>[1]);
    }
  }
  writeFileSync(pjoin(dir, 'held.json'), JSON.stringify({ door: DOOR, mode: APPLY ? 'APPLIED' : 'DRY RUN', landed: land.length, signed: APPLY ? toSign.length : 0,
    seatsHeld: held, rowsHeld: rowHolds }, null, 1));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
