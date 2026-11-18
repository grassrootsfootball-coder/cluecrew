/**
 * AGENT REVIEW — PASS 2: replace distractors their tags cannot produce, and rebuild held rows
 * (David's ruling, 2026-11-18). A proposing agent writes `proposals.json`; a reviewing agent acting
 * in the reviewer role writes `proposal-review.json`; this lands only what both survived.
 *
 * A ROW IS ALL-OR-NOTHING. A signature is over the whole row's projection, so a row lands only when
 * every proposed change on it is ATTESTED, every mechanical gate passes on the row AS IT WILL BE, and
 * the reviewer SIGNS that row. The new signature is the machine reviewer's (`rev-agent-01`), never a
 * person's (R94); a person's earlier signature stays in history and no longer covers the row.
 *
 *   --door=vr-17 --precheck   gates only, on proposals.json (the proposer runs this itself)
 *   --door=vr-17              dry run with the review
 *   --door=vr-17 --apply
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { recordSignature } from '../../packages/db/prisma/reviewed-guard';
import { SIGNATURE_SUBJECTS } from '../../packages/core/src/signature-subject';
import { checkTagWrite, TAG_PREDICATES } from '../../packages/core/src/tag-write-gate';
import { checkKeyPerformsStem } from '../../packages/core/src/key-gate';
import { checkItemChildFacing } from '../../packages/core/src/item-content-gate';
import { isAppropriateForAChild } from '../../packages/core/src/appropriateness';
import { canonicalOrderHash } from '../lib/pin-projection';
import { loadChildLexicon } from '../lib/child-lexicon';

const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const DOOR = arg('door');
const APPLY = process.argv.includes('--apply');
const PRECHECK = process.argv.includes('--precheck');
// Rows held back by name although signed — e.g. going round again for a fix the reviewer noted. Never the reverse.
const HOLD = new Set((arg('hold') ?? '').split(',').filter(Boolean));
const REVIEWER = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(',') : String(x); };

interface Opt { optionId: string; value: string; isKey: boolean; tag: string | null; execution: string | null }
interface Proposals {
  seats?: Array<{ optionId: string; itemId: string; oldValue: string; tag: string; newValue: string; execution: string }>;
  redrafts?: Array<{ optionId: string; itemId: string; value: string; tag: string; execution: string }>;
  rebuilds?: Array<{ itemId: string; stem: Record<string, unknown>; options: Opt[]; why: string }>;
}
interface Review { changes: Array<{ ref: string; verdict: string; reason?: string }>; rows: Array<{ itemId: string; verdict: string; reason?: string }> }

/** Words a vr-08 option DERIVES: the first word without the letter, the second word with it at each position. */
function vr08Derived(stem: Record<string, unknown>, letter: string): string[] {
  const a = String(stem.word1 ?? '').toUpperCase(), b = String(stem.word2 ?? '').toUpperCase();
  if (!a || !b) return [];
  const out: string[] = [];
  const i = a.indexOf(letter.toUpperCase());
  if (i >= 0) out.push(a.slice(0, i) + a.slice(i + 1));
  for (let k = 0; k <= b.length; k++) out.push(b.slice(0, k) + letter.toUpperCase() + b.slice(k));
  return out;
}

async function main() {
  if (!DOOR) throw new Error('pass --door=vr-NN');
  const dir = pjoin(DIR, DOOR);
  const packet = JSON.parse(readFileSync(pjoin(dir, 'packet.json'), 'utf8')) as { questionType: string; entries: Record<string, unknown> };
  const propText = readFileSync(pjoin(dir, 'proposals.json'), 'utf8');
  const prop = JSON.parse(propText) as Proposals;
  const lex = loadChildLexicon();
  const isWord = (w: string) => lex.knows(w) || lex.knowsBare(w);
  const tags = new Set(Object.keys(packet.entries));

  // Build every touched row AS IT WILL BE.
  const touched = new Set<string>([...(prop.seats ?? []), ...(prop.redrafts ?? []), ...(prop.rebuilds ?? [])].map((x) => x.itemId));
  const live = await prisma.item.findMany({ where: { id: { in: [...touched] } }, select: { id: true, status: true, stem: true, explanation: true,
    options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  type Row = { id: string; stem: Record<string, unknown>; options: Opt[]; refs: string[] };
  const after = new Map<string, Row>();
  const faults = new Map<string, string[]>();
  const fault = (id: string, f: string) => faults.set(id, [...(faults.get(id) ?? []), f]);
  for (const r of live) {
    // A LIVE row may take an execution REDRAFT only: executions are staff-facing and outside the
    // signed projection, so the row a child meets does not move. Any value or stem change needs DRAFT.
    const onlyRedrafts = ![...(prop.seats ?? []), ...(prop.rebuilds ?? [])].some((x) => x.itemId === r.id);
    if (r.status !== 'DRAFT' && !(r.status === 'LIVE' && onlyRedrafts)) fault(r.id, `status ${r.status}`);
    after.set(r.id, { id: r.id, stem: r.stem as Record<string, unknown>, refs: [],
      options: r.options.map((o) => ({ optionId: o.id, value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId, execution: o.misconceptionExecution?.trim() || null })) });
  }
  for (const id of touched) if (!after.has(id)) fault(id, 'row not found');
  for (const b of prop.rebuilds ?? []) {
    const r = after.get(b.itemId); if (!r) continue;
    const ids = r.options.map((o) => o.optionId).sort().join();
    if (b.options.map((o) => o.optionId).sort().join() !== ids) fault(b.itemId, 'a rebuild must keep the same option ids');
    r.stem = b.stem; r.options = b.options.map((o) => ({ ...o, execution: o.isKey ? null : o.execution })); r.refs.push(`rebuild:${b.itemId}`);
  }
  for (const s of prop.seats ?? []) {
    const r = after.get(s.itemId); const o = r?.options.find((x) => x.optionId === s.optionId);
    if (!r || !o) { fault(s.itemId, `seat ${s.optionId} not on row`); continue; }
    if (o.value !== s.oldValue) fault(s.itemId, `${s.optionId}: oldValue ${s.oldValue} is not the stored ${o.value}`);
    if (o.isKey) fault(s.itemId, `${s.optionId} is the key`);
    o.value = s.newValue; o.tag = s.tag; o.execution = s.execution; r.refs.push(`seat:${s.optionId}`);
  }
  for (const s of prop.redrafts ?? []) {
    const r = after.get(s.itemId); const o = r?.options.find((x) => x.optionId === s.optionId);
    if (!r || !o) { fault(s.itemId, `redraft ${s.optionId} not on row`); continue; }
    if (o.value !== s.value || o.tag !== s.tag) fault(s.itemId, `redraft ${s.optionId} does not match the stored value/tag`);
    o.execution = s.execution; r.refs.push(`redraft:${s.optionId}`);
  }

  // GATES, on the row as it will be.
  for (const r of after.values()) {
    const keys = r.options.filter((o) => o.isKey);
    if (keys.length !== 1) fault(r.id, `${keys.length} keys`);
    const vals = r.options.map((o) => o.value.toLowerCase());
    if (new Set(vals).size !== vals.length) fault(r.id, 'two options share a value');
    const keyValue = keys[0]?.value ?? '';
    const k = checkKeyPerformsStem({ questionTypeId: packet.questionType, stem: r.stem, keyValue, optionValues: r.options.map((o) => o.value) }, isWord);
    if (k.verdict === 'REFUSES') fault(r.id, `key gate REFUSES: ${k.why}`);
    for (const f of checkItemChildFacing({ id: r.id, stem: r.stem, options: r.options.map((o) => ({ content: { value: o.value }, isCorrect: o.isKey })) }))
      fault(r.id, `child-facing: ${JSON.stringify(f).slice(0, 200)}`);
    for (const o of r.options.filter((x) => !x.isKey)) {
      if (!o.tag || !tags.has(o.tag)) fault(r.id, `${o.value}: tag ${o.tag} is not one of this door's entries`);
      if (!o.execution || o.execution.length < 40) fault(r.id, `${o.value}: no execution`);
      if (o.tag && o.tag in TAG_PREDICATES) {
        const g = checkTagWrite({ stem: r.stem, optionValue: o.value, keyValue, misconceptionId: o.tag }, isWord);
        if (g.verdict === 'REFUSES') fault(r.id, `${o.value}: tag gate REFUSES ${o.tag}: ${g.why}`);
      }
      if (packet.questionType === 'vr-20-complete-the-word') {
        const filled = String(r.stem.wordWithGap ?? '').replace('_', o.value);
        if (isWord(filled)) fault(r.id, `${o.value}: fills ${filled}, a real word — a second correct answer`);
      }
      if (packet.questionType === 'vr-08-move-letter')
        for (const w of vr08Derived(r.stem, o.value)) if (isWord(w) && !isAppropriateForAChild(w)) fault(r.id, `${o.value}: derives ${w}, not suitable for a child`);
    }
  }

  const ok = [...after.keys()].filter((id) => !faults.has(id));
  console.log(`${DOOR} — ${PRECHECK ? 'PRECHECK' : APPLY ? 'APPLY' : 'DRY RUN'}: ${after.size} rows touched, ${ok.length} pass every gate, ${faults.size} fail`);
  for (const [id, fs] of faults) console.log(`  ✗ ${id}\n      ${fs.join('\n      ')}`);
  if (PRECHECK) return;

  const reviewPath = pjoin(dir, 'proposal-review.json');
  if (!existsSync(reviewPath)) throw new Error(`${DOOR}: proposal-review.json is missing`);
  const reviewText = readFileSync(reviewPath, 'utf8');
  const review = JSON.parse(reviewText) as Review;
  const verdict = new Map(review.changes.map((c) => [c.ref, c.verdict]));
  const signs = new Map(review.rows.map((r) => [r.itemId, r]));
  const land = ok.filter((id) => after.get(id)!.refs.every((ref) => verdict.get(ref) === 'ATTEST') && signs.get(id)?.verdict === 'SIGN' && !HOLD.has(id));
  const notLanded = [...after.keys()].filter((id) => !land.includes(id)).map((id) => ({ itemId: id, gateFaults: faults.get(id) ?? [],
    unattested: after.get(id)!.refs.filter((ref) => verdict.get(ref) !== 'ATTEST').map((ref) => ({ ref, verdict: verdict.get(ref) ?? 'none', reason: review.changes.find((c) => c.ref === ref)?.reason })),
    row: signs.get(id) ?? { verdict: 'none' } }));
  console.log(`  ${land.length} rows land and are signed; ${notLanded.length} held`);

  if (APPLY && land.length) {
    const method = `agent review pass 2 (David's ruling 2026-11-18): proposed by a proposing agent, ATTESTED change-by-change and the row SIGNED by the machine reviewer rev-agent-01; every gate passed on the row as written. proposals ${sha(propText).slice(0, 16)}, review ${sha(reviewText).slice(0, 16)}. Not read by a person.`;
    await prisma.$transaction(async (tx) => {
      for (const id of land) {
        const r = after.get(id)!;
        const before = live.find((x) => x.id === id)!;
        if (JSON.stringify(before.stem) !== JSON.stringify(r.stem)) await tx.item.update({ where: { id }, data: { stem: r.stem as object } });
        for (const o of r.options) {
          const b = before.options.find((x) => x.id === o.optionId)!;
          if (val(b.content) === o.value && b.isCorrect === o.isKey && b.misconceptionId === o.tag && (b.misconceptionExecution?.trim() || null) === o.execution) continue;
          await tx.itemOption.update({ where: { id: o.optionId }, data: { content: { ...(b.content as object), value: o.value }, isCorrect: o.isKey, misconceptionId: o.isKey ? null : o.tag, misconceptionExecution: o.isKey ? null : o.execution } });
        }
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', reviewerId: REVIEWER, actor: 'agent-reviewer', recordedBy: RECORDED_BY,
          field: 'stem/options', method, note: r.refs.join(' ') } });
      }
    }, { timeout: 120000 });
    for (const id of land) {
      const r = await prisma.item.findUniqueOrThrow({ where: { id }, select: { stem: true, explanation: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
      await recordSignature(prisma, { recordType: 'item', recordId: id, reviewerId: REVIEWER, recordedBy: RECORDED_BY,
        method: `${method} Reviewer note: ${signs.get(id)?.reason ?? ''}`.slice(0, 900),
        subjectHash: canonicalOrderHash(r), subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind,
        subjectSpec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec } as Parameters<typeof recordSignature>[1]);
    }
  }
  writeFileSync(pjoin(dir, 'pass2-held.json'), JSON.stringify({ door: DOOR, mode: APPLY ? 'APPLIED' : 'DRY RUN', landed: APPLY ? land : [], held: notLanded }, null, 1));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
