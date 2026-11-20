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
import { canonicalJson } from '../lib/findings-digest';
import { exportEnglishRewriteReturn, type RowChange } from './export-english-rewrite-return';

const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const DOOR = arg('door');
const APPLY = process.argv.includes('--apply');
const PRECHECK = process.argv.includes('--precheck');
/**
 * `--from-live` (2026-11-20): a door-level pattern repair rebuilds LIVE rows. Such a row may be rebuilt, and
 * on --apply it is moved LIVE -> DRAFT in the SAME transaction as its rewrite (an event each), so only rows
 * that actually land leave service, and `publish-door --ready` returns them once signed.
 */
const FROM_LIVE = process.argv.includes('--from-live');
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
  // `explanationPatch` merges into the stored explanation key by key (R1023: an English row's explanation
  // carries quotes, reading context and more that a rewrite must not drop by omission); `lineRefs` is item-level (R80).
  rebuilds?: Array<{ itemId: string; stem: Record<string, unknown>; options: Opt[]; why: string; explanation?: Record<string, unknown>; explanationPatch?: Record<string, unknown>; lineRefs?: number[] }>;
}
interface Review { changes: Array<{ ref: string; verdict: string; reason?: string }>; rows: Array<{ itemId: string; verdict: string; reason?: string; holdFixed?: boolean }> }
type Hold = { reason: string; faultField: string };

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
  const packet = JSON.parse(readFileSync(pjoin(dir, 'packet.json'), 'utf8')) as { questionType: string; entries: Record<string, unknown>; holds?: Record<string, Hold> };
  /**
   * R1023 — A DOOR WHOSE PACKET CARRIES `holds` IS A REWRITE OF ROWS A REVIEW HELD. Only those rows may be
   * touched; a row lands only if the reviewer says the ORIGINAL hold's fault is fixed (`holdFixed: true`,
   * R1022: a hold stands until the review that placed it re-reads its field); landing clears the hold and
   * writes the field-level changeset the return leg carries to the authoring store.
   */
  const HOLDS = packet.holds ?? null;
  const propText = readFileSync(pjoin(dir, 'proposals.json'), 'utf8');
  const prop = JSON.parse(propText) as Proposals;
  const lex = loadChildLexicon();
  const isWord = (w: string) => lex.knows(w) || lex.knowsBare(w);
  const tags = new Set(Object.keys(packet.entries));
  // A tag a child can be served must be ATTESTED — by the person or the machine reviewer, never a placeholder (R94).
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: { in: ['reviewer:rev-0001', 'reviewer:rev-agent-01'] } }, select: { id: true } })).map((m) => m.id));

  // Build every touched row AS IT WILL BE.
  const touched = new Set<string>([...(prop.seats ?? []), ...(prop.redrafts ?? []), ...(prop.rebuilds ?? [])].map((x) => x.itemId));
  const live = await prisma.item.findMany({ where: { id: { in: [...touched] } }, select: { id: true, status: true, questionTypeId: true, stem: true, explanation: true, lineRefs: true,
    options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  type Row = { id: string; type: string; stem: Record<string, unknown>; explanation: unknown; lineRefs: number[]; options: Opt[]; refs: string[] };
  const after = new Map<string, Row>();
  const liveRebuilds = new Set<string>();
  const faults = new Map<string, string[]>();
  const fault = (id: string, f: string) => faults.set(id, [...(faults.get(id) ?? []), f]);
  for (const r of live) {
    // A LIVE row may take an execution REDRAFT only: executions are staff-facing and outside the
    // signed projection, so the row a child meets does not move. Any value or stem change needs DRAFT.
    // A RETAG (same value, new tag + execution) is outside the signed projection too, so it counts with the redrafts.
    const onlyRedrafts = !(prop.rebuilds ?? []).some((x) => x.itemId === r.id)
      && !(prop.seats ?? []).some((x) => x.itemId === r.id && x.newValue !== x.oldValue);
    if (r.status !== 'DRAFT' && !(r.status === 'LIVE' && (onlyRedrafts || FROM_LIVE))) fault(r.id, `status ${r.status}`);
    if (r.status === 'LIVE' && !onlyRedrafts) liveRebuilds.add(r.id);
    if (HOLDS && !HOLDS[r.id]) fault(r.id, 'not a held row — a rewrite door may touch only the rows its review held (R1023)');
    after.set(r.id, { id: r.id, type: r.questionTypeId, stem: r.stem as Record<string, unknown>, explanation: r.explanation, lineRefs: (r.lineRefs ?? []) as number[], refs: [],
      options: r.options.map((o) => ({ optionId: o.id, value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId, execution: o.misconceptionExecution?.trim() || null })) });
  }
  for (const id of touched) if (!after.has(id)) fault(id, 'row not found');
  for (const b of prop.rebuilds ?? []) {
    const r = after.get(b.itemId); if (!r) continue;
    const ids = r.options.map((o) => o.optionId).sort().join();
    if (b.options.map((o) => o.optionId).sort().join() !== ids) fault(b.itemId, 'a rebuild must keep the same option ids');
    if (b.explanation && b.explanationPatch) fault(b.itemId, 'a rebuild gives explanation OR explanationPatch, not both');
    /**
     * A REBUILD NEVER DROPS WHAT IT WAS NOT SHOWN (R57, 2026-11-20). Packets hide `_`-prefixed stem keys
     * (retention/provenance, outside the signed projection), so a proposer cannot name them and a
     * wholesale stem replace erased them: ENG-007-LP-10 lost `_previousQuotes` this way. Every stored
     * `_` key the rebuild does not itself set is carried forward.
     */
    const storedStem = r.stem;
    r.stem = { ...Object.fromEntries(Object.entries(storedStem).filter(([k]) => k.startsWith('_') && !(k in b.stem))), ...b.stem };
    if (b.explanation) r.explanation = b.explanation;
    if (b.explanationPatch) r.explanation = { ...((r.explanation ?? {}) as Record<string, unknown>), ...b.explanationPatch };
    if (b.lineRefs) {
      if (!Array.isArray(b.lineRefs) || !b.lineRefs.every((n) => Number.isInteger(n) && n > 0)) fault(b.itemId, 'lineRefs must be positive line numbers');
      r.lineRefs = b.lineRefs;
    }
    if (HOLDS && typeof b.stem.passageRef !== 'string') fault(b.itemId, 'an English rewrite must carry stem.passageRef (the row must be able to show its passage)');
    r.options = b.options.map((o) => ({ ...o, execution: o.isKey ? null : o.execution })); r.refs.push(`rebuild:${b.itemId}`);
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
    /**
     * A PERSON'S APPROVAL MUST NOT RIDE ON TEXT AN AGENT WROTE (R94, R1023 condition 1). `chooseHint`
     * serves an item hint only when `hintAuthoredBy` + `hintAuthority` name a reader, so a rewrite that
     * leaves Annie's marker in place would put machine words in front of a child under her name. A
     * rewrite of a marked field must clear the marker; the before value travels in the changeset.
     */
    {
      const be = ((live.find((x) => x.id === r.id)?.explanation ?? {}) as Record<string, unknown>);
      const ae = (r.explanation ?? {}) as Record<string, unknown>;
      const MARKERS: Record<string, string[]> = { hintCore: ['hintAuthoredBy', 'hintAuthority'], walkScript: ['walkScriptApprovedBy', '_walkScriptAuthority'] };
      for (const [f, marks] of Object.entries(MARKERS)) {
        if (canonicalJson(be[f] ?? null) === canonicalJson(ae[f] ?? null)) continue;
        const kept = marks.filter((m) => typeof ae[m] === 'string' && (ae[m] as string).trim() !== '');
        if (kept.length) fault(r.id, `${f} rewritten but ${kept.join(' + ')} still names a person's approval of the old text (R94) — clear it`);
      }
    }
    // Each row's OWN type: a case can map several (maths-01), and a door-level type would run the wrong predicate.
    const k = checkKeyPerformsStem({ questionTypeId: r.type, stem: r.stem, keyValue, optionValues: r.options.map((o) => o.value) }, isWord);
    if (k.verdict === 'REFUSES') fault(r.id, `key gate REFUSES: ${k.why}`);
    for (const f of checkItemChildFacing({ id: r.id, stem: r.stem, explanation: r.explanation, options: r.options.map((o) => ({ content: { value: o.value }, isCorrect: o.isKey })) }))
      fault(r.id, `child-facing: ${JSON.stringify(f).slice(0, 200)}`);
    for (const o of r.options.filter((x) => !x.isKey)) {
      if (!o.tag || !tags.has(o.tag)) fault(r.id, `${o.value}: tag ${o.tag} is not one of this door's entries`);
      else if (!attested.has(o.tag)) fault(r.id, `${o.value}: tag ${o.tag} is not attested — attest the library entry first`);
      if (!o.execution || o.execution.length < 40) fault(r.id, `${o.value}: no execution`);
      if (o.tag && o.tag in TAG_PREDICATES) {
        const g = checkTagWrite({ stem: r.stem, optionValue: o.value, keyValue, misconceptionId: o.tag }, isWord);
        if (g.verdict === 'REFUSES') fault(r.id, `${o.value}: tag gate REFUSES ${o.tag}: ${g.why}`);
      }
      if (r.type === 'vr-20-complete-the-word') {
        const filled = String(r.stem.wordWithGap ?? '').replace('_', o.value);
        if (isWord(filled)) fault(r.id, `${o.value}: fills ${filled}, a real word — a second correct answer`);
      }
      if (r.type === 'vr-08-move-letter')
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
  const land = ok.filter((id) => after.get(id)!.refs.every((ref) => verdict.get(ref) === 'ATTEST') && signs.get(id)?.verdict === 'SIGN' && !HOLD.has(id)
    && (!HOLDS || signs.get(id)?.holdFixed === true));
  const notLanded = [...after.keys()].filter((id) => !land.includes(id)).map((id) => ({ itemId: id, gateFaults: faults.get(id) ?? [],
    ...(HOLDS ? { originalHold: HOLDS[id], holdFixed: signs.get(id)?.holdFixed ?? null } : {}),
    unattested: after.get(id)!.refs.filter((ref) => verdict.get(ref) !== 'ATTEST').map((ref) => ({ ref, verdict: verdict.get(ref) ?? 'none', reason: review.changes.find((c) => c.ref === ref)?.reason })),
    row: signs.get(id) ?? { verdict: 'none' } }));
  console.log(`  ${land.length} rows land and are signed; ${notLanded.length} held`);

  // FIELD-LEVEL DIFF, compared order-insensitively (JSONB does not keep key order — CLAUDE.md).
  const fieldChanges = (id: string) => {
    const r = after.get(id)!; const b = live.find((x) => x.id === id)!;
    const out: Array<{ field: string; before: unknown; after: unknown }> = [];
    const cmp = (field: string, x: unknown, y: unknown) => { if (canonicalJson(x ?? null) !== canonicalJson(y ?? null)) out.push({ field, before: x ?? null, after: y ?? null }); };
    const bs = b.stem as Record<string, unknown>;
    for (const k of new Set([...Object.keys(bs), ...Object.keys(r.stem)])) cmp(`stem.${k}`, bs[k], r.stem[k]);
    const be = (b.explanation ?? {}) as Record<string, unknown>; const ae = (r.explanation ?? {}) as Record<string, unknown>;
    for (const k of new Set([...Object.keys(be), ...Object.keys(ae)])) cmp(`explanation.${k}`, be[k], ae[k]);
    cmp('lineRefs', b.lineRefs, r.lineRefs);
    for (const o of r.options) {
      const bo = b.options.find((x) => x.id === o.optionId)!; const label = (bo.content as { label?: string })?.label ?? o.optionId;
      cmp(`option ${label} (${o.optionId}).value`, val(bo.content), o.value);
      cmp(`option ${label} (${o.optionId}).isKey`, bo.isCorrect, o.isKey);
      cmp(`option ${label} (${o.optionId}).tag`, bo.misconceptionId, o.isKey ? null : o.tag);
      cmp(`option ${label} (${o.optionId}).execution`, bo.misconceptionExecution?.trim() || null, o.isKey ? null : o.execution);
    }
    return out;
  };

  if (APPLY && land.length) {
    const method = HOLDS
      ? `English rewrite under R1023 (David, 2026-11-20: "Yes, agents rewrite"): the held fields were REWRITTEN BY A DRAFTING AGENT, not by Cowork and not by a person; ATTESTED change-by-change and the row SIGNED by the machine reviewer rev-agent-01, which re-read the original hold and found its fault fixed; every gate passed on the row as written. proposals ${sha(propText).slice(0, 16)}, review ${sha(reviewText).slice(0, 16)}. Not read by a person.`
      : `agent review pass 2 (David's ruling 2026-11-18): proposed by a proposing agent, ATTESTED change-by-change and the row SIGNED by the machine reviewer rev-agent-01; every gate passed on the row as written. proposals ${sha(propText).slice(0, 16)}, review ${sha(reviewText).slice(0, 16)}. Not read by a person.`;
    const changes = new Map(land.map((id) => [id, fieldChanges(id)]));
    await prisma.$transaction(async (tx) => {
      for (const id of land) {
        const r = after.get(id)!;
        const before = live.find((x) => x.id === id)!;
        if (FROM_LIVE && liveRebuilds.has(id)) {
          const moved = await tx.item.updateMany({ where: { id, status: 'LIVE' }, data: { status: 'DRAFT' } });
          if (moved.count !== 1) throw new Error(`${id}: expected to take a LIVE row out of service, moved ${moved.count}`);
          await tx.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', reviewerId: REVIEWER, actor: 'agent-reviewer', recordedBy: RECORDED_BY,
            field: 'status', method: `LIVE -> DRAFT for a door-level pattern rebuild (${DOOR}); returns to service through publish-door --ready once its new signature recomputes.`, note: 'from-live' } });
        }
        if (JSON.stringify(before.stem) !== JSON.stringify(r.stem)) await tx.item.update({ where: { id }, data: { stem: r.stem as object } });
        if (JSON.stringify(before.explanation) !== JSON.stringify(r.explanation)) await tx.item.update({ where: { id }, data: { explanation: r.explanation as object } });
        if (canonicalJson(before.lineRefs) !== canonicalJson(r.lineRefs)) await tx.item.update({ where: { id }, data: { lineRefs: r.lineRefs } });
        for (const o of r.options) {
          const b = before.options.find((x) => x.id === o.optionId)!;
          if (val(b.content) === o.value && b.isCorrect === o.isKey && b.misconceptionId === o.tag && (b.misconceptionExecution?.trim() || null) === o.execution) continue;
          // Keep the stored TYPE: a numeric value written back as text left vr-11/17/18 rows mixing 18 with "17" (R1030).
          const storedValue = (b.content as { value?: unknown })?.value;
          const typed = typeof storedValue === 'number' && /^-?\d+(\.\d+)?$/.test(o.value) ? Number(o.value) : o.value;
          await tx.itemOption.update({ where: { id: o.optionId }, data: { content: { ...(b.content as object), value: typed }, isCorrect: o.isKey, misconceptionId: o.isKey ? null : o.tag, misconceptionExecution: o.isKey ? null : o.execution } });
        }
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', reviewerId: REVIEWER,
          actor: HOLDS ? 'agent-drafter' : 'agent-reviewer', recordedBy: RECORDED_BY,
          field: HOLDS ? changes.get(id)!.map((c) => c.field).join(', ').slice(0, 900) : 'stem/options', method, note: r.refs.join(' ') } });
      }
    }, { timeout: 120000 });
    for (const id of land) {
      const r = await prisma.item.findUniqueOrThrow({ where: { id }, select: { stem: true, explanation: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
      await recordSignature(prisma, { recordType: 'item', recordId: id, reviewerId: REVIEWER, recordedBy: RECORDED_BY,
        method: `${method} Reviewer note: ${signs.get(id)?.reason ?? ''}`.slice(0, 900),
        subjectHash: canonicalOrderHash(r), subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind,
        subjectSpec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec } as Parameters<typeof recordSignature>[1]);
    }
    // Every English rewrite door carries its changes back to the authoring store (R1023 condition 5);
    // only a door of HELD rows also clears holds.
    const RETURNS = !!HOLDS || DOOR.startsWith('english-rewrite');
    if (RETURNS) {
      // 1. The changeset, captured now — the only moment the before value is still in hand. Appended across rounds.
      const csPath = pjoin(dir, 'changeset.json');
      const prior = existsSync(csPath) ? (JSON.parse(readFileSync(csPath, 'utf8')) as { rows: RowChange[] }).rows : [];
      const landedAt = new Date().toISOString();
      const fresh: RowChange[] = land.map((id) => ({ itemId: id, passageRef: (after.get(id)!.stem.passageRef as string) ?? null, hold: HOLDS?.[id] ?? { reason: `not a held row: ${DOOR}`, faultField: 'execution' },
        reviewerNote: signs.get(id)?.reason ?? '', landedAt, changes: changes.get(id)! }));
      writeFileSync(csPath, JSON.stringify({ door: DOOR, ruling: 'R1023', rows: [...prior.filter((p) => !land.includes(p.itemId)), ...fresh] }, null, 1));
    }
    if (HOLDS) {
      // 2. Clear the hold — only for rows the review that placed it has now re-read and signed with the fault fixed.
      const landedAt = new Date().toISOString();
      const holdPath = pjoin(DIR, 'english', 'held-for-authoring-store.json');
      const hf = JSON.parse(readFileSync(holdPath, 'utf8')) as { note: string; byField: Record<string, number>; held: Array<{ itemId: string; faultField?: string }>; clearedUnderR1023?: unknown[] };
      const clearing = hf.held.filter((h) => land.includes(h.itemId));
      if (clearing.length !== land.length) throw new Error(`hold file: ${land.length} rows landed but ${clearing.length} found standing — the hold file and this door disagree`);
      const held = hf.held.filter((h) => !land.includes(h.itemId));
      const byField = held.reduce<Record<string, number>>((a, h) => { const k = String(h.faultField ?? 'unstated'); a[k] = (a[k] ?? 0) + 1; return a; }, {});
      writeFileSync(holdPath, JSON.stringify({ ...hf, byField, held, clearedUnderR1023: [...(hf.clearedUnderR1023 ?? []),
        ...clearing.map((h) => ({ ...h, clearedAt: landedAt, clearedBy: `${REVIEWER} re-read the held field after an agent rewrite (${DOOR})`, reviewerNote: signs.get(h.itemId)?.reason ?? '' }))] }, null, 1));
      console.log(`  holds cleared: ${clearing.length}; ${held.length} still standing`);
    }
    if (RETURNS) {
      // 3. The return leg follows the write automatically (CLAUDE.md: an applier re-exports as its final step).
      exportEnglishRewriteReturn();
    }
  }
  writeFileSync(pjoin(dir, 'pass2-held.json'), JSON.stringify({ door: DOOR, mode: APPLY ? 'APPLIED' : 'DRY RUN', landed: APPLY ? land : [], held: notLanded }, null, 1));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
