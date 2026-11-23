/**
 * REPLACE THE WORD IN THE THREE SPAS ITEMS (David: "Replace the word in the three SPAS items",
 * 2026-11-23 — R1048). `gen-vr-19-word-number-codes-03/13/23` asked a child to encode SPAS, a British
 * playground slur (R1042's door HELD them, R1043 holds them from serving, R1044 taught the screen).
 *
 * THE WORD IS THE FAMILY'S, NOT THIS SCRIPT'S. The rows are derived (`wordNumberCodes` in
 * generate-content.ts), so the word list changes THERE and this script calls that function for the
 * new stem and option values (R429). Afterwards `classifyDerivedWrites` must report every one of the
 * family's 25 rows as reviewed-and-UNCHANGED, so `content:generate` stays a no-op (R62).
 *
 * THE DOOR. Drafter writes `drafts.json` (the two executions per row, in the family's house form);
 * a separate agent writes `verdicts.json` as rev-agent-01: ATTEST/REFUSE per execution, SIGN/HOLD per
 * row over the bytes in `packet.json`. Nothing lands without a SIGN and two ATTESTs per row, and the
 * whole run refuses if the database moved since the packet (R982).
 *
 * HISTORY GOES OUTSIDE THE CONTAINER (R358, R1042). The rows still carry the `_previousPrompt` and
 * `_previousValue`s of the August regeneration; they move to the `superseded` column, and the SPAS
 * wording joins them there with this ruling's name. The replaced executions are recorded verbatim in
 * each AMENDED event's note.
 *
 *   tsx scripts/agent-review/replace-vr19-spas.ts --packet
 *   tsx scripts/agent-review/replace-vr19-spas.ts            (dry run)
 *   tsx scripts/agent-review/replace-vr19-spas.ts --apply
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { Prisma, prisma } from '../../packages/db/src/index';
import { wordNumberCodes } from '../../packages/db/prisma/generate-content';
import { classifyDerivedWrites, recordSignature } from '../../packages/db/prisma/reviewed-guard';
import { SIGNATURE_SUBJECTS } from '../../packages/core/src/signature-subject';
import { checkItemChildFacing, isBlocking } from '../../packages/core/src/index';
import { exportContentSnapshot } from '../content-snapshot';
import { canonicalOrderHash } from '../lib/pin-projection';
import { canonicalJson } from '../lib/findings-digest';
import { findInside, withoutSuperseded, readColumn, type SupersededEntry } from '../lib/superseded';

const APPLY = process.argv.includes('--apply');
const PACKET = process.argv.includes('--packet');
const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'vr19-spas');
const TYPE = 'vr-19-word-number-codes';
const IDS = ['gen-vr-19-word-number-codes-03', 'gen-vr-19-word-number-codes-13', 'gen-vr-19-word-number-codes-23'];
const REVIEWER = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const RULING = 'R1048';
const TODAY = '2026-11-23';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const valueOf = (c: unknown) => String((c as { value?: unknown })?.value ?? '');

interface Drafts { drafts: Array<{ optionId: string; tag: string; value: string; execution: string }> }
interface Verdicts { reviewer: string;
  executions: Array<{ optionId: string; verdict: 'ATTEST' | 'REFUSE'; reason?: string }>;
  rows: Array<{ itemId: string; preImageSha256: string; verdict: 'SIGN' | 'HOLD'; reason?: string }> }

async function readFamily() {
  return prisma.item.findMany({ where: { questionTypeId: TYPE }, orderBy: { id: 'asc' },
    select: { id: true, status: true, difficultyTier: true, stem: true, explanation: true, superseded: true,
      options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true, superseded: true }, orderBy: { id: 'asc' } } } });
}
type Row = Awaited<ReturnType<typeof readFamily>>[number];
const digest = (r: Row) => sha(canonicalJson({ stem: r.stem, explanation: r.explanation,
  options: r.options.map((o) => ({ id: o.id, content: o.content, misconceptionId: o.misconceptionId, misconceptionExecution: o.misconceptionExecution })) } as object));

async function main() {
  const family = await readFamily();
  if (family.length !== 25) throw new Error(`${TYPE}: expected 25 rows, found ${family.length}`);
  const derived = wordNumberCodes();
  const derivedFor = (id: string) => derived[Number(id.slice(-2)) - 1]!;

  const plans = IDS.map((id) => {
    const r = family.find((x) => x.id === id);
    if (!r) throw new Error(`${id}: not found`);
    if (!/code for SPAS\?/.test(String((r.stem as { prompt?: string }).prompt))) throw new Error(`${id}: does not ask for SPAS — nothing to replace, refusing`);
    const d = derivedFor(id);
    if (d.tier !== r.difficultyTier) throw new Error(`${id}: the new word moves the tier ${r.difficultyTier} -> ${d.tier}; that is a family-composition change, not a word swap`);
    // Option i of the derivation lands on `${id}-opt${i+1}`, the id content:generate gives it.
    const options = r.options.map((o) => {
      const i = Number(o.id.slice(-1)) - 1;
      const dv = d.options[i]!;
      if (dv.isCorrect !== o.isCorrect) throw new Error(`${o.id}: key flag disagrees with the derivation`);
      return { o, newValue: valueOf(dv.content) };
    });
    return { r, d, options, stem: d.stem as Record<string, unknown> };
  });

  if (PACKET) {
    mkdirSync(DIR, { recursive: true });
    const packet = { door: 'vr19-spas', ruling: RULING,
      note: 'Each row: as stored now (before), and as it will stand (after: stem and option values from the family derivation, tags unchanged). The executions for "after" are in drafts.json, written by the drafter. SPAS is refused by the appropriateness screen (R1044); the replacement word is SITS.',
      rows: plans.map((p) => ({ itemId: p.r.id, status: p.r.status, difficultyTier: p.r.difficultyTier, preImageSha256: digest(p.r),
        before: { stem: withoutSuperseded(p.r.stem), options: p.options.map(({ o }) => ({ optionId: o.id, value: valueOf(o.content), isCorrect: o.isCorrect, tag: o.misconceptionId, execution: o.misconceptionExecution })) },
        after: { stem: p.stem, options: p.options.map(({ o, newValue }) => ({ optionId: o.id, value: newValue, isCorrect: o.isCorrect, tag: o.misconceptionId })) } })) };
    writeFileSync(pjoin(DIR, 'packet.json'), `${JSON.stringify(packet, null, 2)}\n`);
    console.log(`wrote content/agent-review/vr19-spas/packet.json — ${packet.rows.length} rows`);
    return;
  }

  const refusals: string[] = [];
  for (const f of ['drafts.json', 'verdicts.json']) if (!existsSync(pjoin(DIR, f))) refusals.push(`${f} is missing`);
  if (refusals.length) { console.error(`REFUSED: ${refusals.join('; ')}`); process.exitCode = 1; return; }
  const drafts = (JSON.parse(readFileSync(pjoin(DIR, 'drafts.json'), 'utf8')) as Drafts).drafts;
  const verdicts = JSON.parse(readFileSync(pjoin(DIR, 'verdicts.json'), 'utf8')) as Verdicts;
  if (verdicts.reviewer !== REVIEWER) refusals.push(`verdicts signed by ${verdicts.reviewer}`);

  const writes = plans.map((p) => {
    const row = verdicts.rows.find((v) => v.itemId === p.r.id);
    if (!row) refusals.push(`${p.r.id}: no row verdict`);
    else if (row.preImageSha256 !== digest(p.r)) refusals.push(`${p.r.id}: moved since the reviewer read it (R982)`);
    else if (row.verdict !== 'SIGN') refusals.push(`${p.r.id}: HOLD — ${row.reason}`);
    const opts = p.options.map(({ o, newValue }) => {
      if (o.isCorrect) return { o, newValue, execution: null as string | null };
      const dr = drafts.find((x) => x.optionId === o.id);
      const v = verdicts.executions.find((x) => x.optionId === o.id);
      if (!dr || dr.value !== newValue || dr.tag !== o.misconceptionId) refusals.push(`${o.id}: no draft matching ${newValue} / ${o.misconceptionId}`);
      else if (!v || v.verdict !== 'ATTEST') refusals.push(`${o.id}: execution not attested${v?.reason ? ` — ${v.reason}` : ''}`);
      return { o, newValue, execution: dr?.execution ?? null };
    });
    // The row as it will stand must pass the one child-facing gate.
    const faults = checkItemChildFacing({ id: p.r.id, stem: p.stem, explanation: withoutSuperseded(p.r.explanation),
      options: opts.map(({ o, newValue }) => ({ content: { value: newValue }, isCorrect: o.isCorrect, misconceptionId: o.misconceptionId })) } as never).filter(isBlocking);
    if (faults.length) refusals.push(`${p.r.id}: child-facing gate — ${faults.map((f) => f.rule).join(', ')}`);
    return { p, opts, reason: row?.reason ?? '' };
  });
  if (refusals.length) { console.error(`REFUSED — nothing written:\n  ${refusals.join('\n  ')}`); process.exitCode = 1; return; }
  console.log(`${RULING}: ${writes.length} rows ready — SPAS -> ${writes.map((w) => (w.p.stem.prompt as string).match(/for (\w+)\?/)![1]).join(', ')}; ${writes.reduce((n, w) => n + w.opts.filter((x) => x.execution).length, 0)} executions attested, ${writes.length} rows SIGNED by ${REVIEWER}.`);
  if (!APPLY) { console.log('dry run — nothing written.'); return; }

  const method = `${RULING}: the coded word SPAS (a playground slur, refused by the screen since R1044) replaced by the family derivation's new word; stem and option values from wordNumberCodes, executions drafted and attested by separate agents, the row signed by ${REVIEWER}.`;
  await prisma.$transaction(async (tx) => {
    const now = await tx.item.findMany({ where: { id: { in: IDS } }, select: { id: true, stem: true, explanation: true,
      options: { select: { id: true, content: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
    for (const w of writes) {
      const n = now.find((x) => x.id === w.p.r.id)!;
      if (digest({ ...w.p.r, ...n } as Row) !== digest(w.p.r)) throw new Error(`${n.id}: moved since classification — nothing written`);
    }
    for (const { p, opts } of writes) {
      const tag = { ruling: RULING, supersededOn: TODAY };
      const stemEntries: SupersededEntry[] = [
        ...findInside(p.r.stem, 'stem'),
        { container: 'stem', path: [], key: '_previousPrompt', value: (p.r.stem as { prompt: string }).prompt, ...tag },
      ];
      await tx.item.update({ where: { id: p.r.id }, data: {
        stem: p.stem as Prisma.InputJsonValue,
        superseded: { version: 1, entries: [...readColumn(p.r.superseded).entries, ...stemEntries] } as unknown as Prisma.InputJsonValue,
      } });
      for (const { o, newValue, execution } of opts) {
        const entries: SupersededEntry[] = [...findInside(o.content, 'content'),
          { container: 'content', path: [], key: '_previousValue', value: valueOf(o.content), ...tag }];
        await tx.itemOption.update({ where: { id: o.id }, data: {
          content: { value: newValue },
          superseded: { version: 1, entries: [...readColumn(o.superseded).entries, ...entries] } as unknown as Prisma.InputJsonValue,
          ...(execution ? { misconceptionExecution: execution } : {}),
        } });
      }
      await tx.attributionEvent.create({ data: { recordType: 'item', recordId: p.r.id, action: 'AMENDED', reviewerId: REVIEWER,
        actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'stem.prompt+options[].content.value+options[].misconceptionExecution', method,
        note: `prompt "${(p.r.stem as { prompt: string }).prompt}" -> "${p.stem.prompt as string}"; ${opts.map(({ o, newValue }) => `${o.id} ${valueOf(o.content)} -> ${newValue}`).join('; ')}. Replaced executions, verbatim: ${opts.filter((x) => x.execution).map(({ o }) => `${o.id}: ${o.misconceptionExecution}`).join(' | ')}`.slice(0, 1900) } });
    }
  }, { timeout: 60000 });

  for (const { p, reason } of writes) {
    const r = (await readFamily()).find((x) => x.id === p.r.id)!;
    await recordSignature(prisma, { recordType: 'item', recordId: r.id, reviewerId: REVIEWER, recordedBy: RECORDED_BY,
      method: `${RULING} vr19-spas door: re-signed after the coded word was replaced. Reviewer note: ${reason}`.slice(0, 900),
      subjectHash: canonicalOrderHash(r), subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind,
      subjectSpec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec });
  }

  // R62, ASSERTED AFTER: the family's own derivation now agrees with every stored row.
  const outcome = await classifyDerivedWrites(prisma, derived.map((d) => ({ id: `gen-${TYPE}-${String(d.n).padStart(2, '0')}`,
    stem: d.stem, options: d.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })) })));
  if (outcome.blocked.length) throw new Error(`content:generate would now be blocked on ${outcome.blocked.map((b) => b.id).join(', ')} — the stored rows and the derivation disagree`);
  console.log(`APPLIED — ${writes.length} rows rewritten and signed. content:generate on ${TYPE}: ${outcome.unchangedReviewed.length} reviewed-and-unchanged, ${outcome.writable.length} writable, 0 blocked.`);
}

main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); })
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
