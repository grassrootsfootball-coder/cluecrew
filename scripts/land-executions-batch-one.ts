/**
 * LAND BATCH ONE'S NINETY-TWO (David, 2026-09-02). The eighty-three holds are not this store's to
 * resolve and nothing here touches them.
 *
 * THREE GATES, AND THE FIRST IS THE ONE THIS SESSION LEARNED THE HARD WAY.
 *
 *   0. THE ROW MUST BE THE ROW THE EXECUTION WAS AUTHORED AGAINST. Each execution carries a
 *      `rowSha256` under a declared spec — R729 over {stem, options:[{value,isKey}], solution}.
 *      It is recomputed here and must match. **The vr-19 executions were authored against the
 *      crossed population `bb6be0d3`, whose coded words are the PRE-REGENERATION set (TAP, PAT,
 *      TIP…), and this store's rows carry the post-regeneration set her 203rd accepted (PIPS,
 *      SAPS, SPAS…).** An execution reading "146 for TAP" landed on a row that now asks for PIPS
 *      would be prose about bytes that no longer exist — R976's fault, committed deliberately.
 *      The digest catches it without anyone needing to notice.
 *   1. THE TAG GATE — the carrier must perform its entry (R943).
 *   2. THE KEY GATE — a row whose key does not perform its stem gets no execution finalised on it.
 *
 * WHATEVER REFUSES IS A HOLD, recorded with its reason and left alone.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkTagWrite } from '../packages/core/src/tag-write-gate';
import { checkKeyPerformsStem } from '../packages/core/src/key-gate';
import { requirePopulation } from './lib/population';
import { readFieldsByName } from './lib/field-read';
import { assessRefusalShape, runRefusalShapeFixture, type ScreenedRow } from './lib/refusal-shape';
import { canonicalJson, findingsDigest } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const APPLY = process.argv.includes('--apply');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const ANNIE = 'rev-0001';

const DICT = '/usr/share/dict/web2';
const W = new Set(readFileSync(DICT, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean));
const isWord = (s: string) => W.has(String(s).trim().toLowerCase());

async function main() {
  console.log(`BATCH ONE — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  runRefusalShapeFixture();
  const path = pjoin(DL, 'executions-batch-one-for-code.json');
  const bytes = readFileSync(path);
  const digest = sha(bytes);
  if (digest !== '88cc393229d0859493b15d45bf7d3d80819f77f562d8e481039dd6436a33c5c9') throw new Error('batch digest mismatch');
  const b = JSON.parse(bytes.toString('utf8')) as Record<string, never>;
  const T = b['TWO_WHAT_AUTHORED_AND_WHAT_HELD'] as unknown as { executions: Record<string, Array<Record<string, unknown>>> };
  const execs = Object.values(T.executions).flat();
  readFieldsByName('batch-one executions', execs, ['itemId', 'optionValue', 'entryId', 'EXECUTION', 'rowSha256']);
  requirePopulation('batch-one', { 'authored execution(s)': execs.length });

  const rec: Array<{ itemId: string; optionValue: string; entryId: string; state: string; why: string; dims: Record<string, string> }> = [];
  for (const e of execs) {
    const itemId = String(e.itemId), value = String(e.optionValue), entry = String(e.entryId), text = String(e.EXECUTION);
    const qt = itemId.replace(/^gen-/, '').replace(/-\d+$/, '');
    const dims = { case: qt, entry };
    const row = await prisma.item.findUnique({ where: { id: itemId },
      select: { stem: true, solution: true, questionTypeId: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
    if (!row) { rec.push({ itemId, optionValue: value, entryId: entry, state: 'HOLD', why: 'no such row in this store', dims }); continue; }

    // GATE 0 — the row must be the one it was authored against.
    const val = (o: { content: unknown }) => String((o.content as { value?: unknown })?.value ?? '');
    const proj = { stem: row.stem, options: row.options.map((o) => ({ value: val(o), isKey: o.isCorrect })), solution: row.solution };
    const mine = sha(canonicalJson(JSON.parse(JSON.stringify(proj))));
    if (mine !== String(e.rowSha256)) {
      rec.push({ itemId, optionValue: value, entryId: entry, state: 'REFUSE',
        why: `authored against a different row: its rowSha256 is ${String(e.rowSha256).slice(0, 16)}, this row computes ${mine.slice(0, 16)} under the same declared spec. The execution describes bytes this row no longer carries.`, dims });
      continue;
    }
    const opt = row.options.find((o) => val(o) === value && o.misconceptionId === entry);
    if (!opt) { rec.push({ itemId, optionValue: value, entryId: entry, state: 'HOLD', why: `no option "${value}" carrying ${entry} on the row`, dims }); continue; }
    if (opt.misconceptionExecution) { rec.push({ itemId, optionValue: value, entryId: entry, state: 'ALREADY', why: 'seat already carries an execution', dims }); continue; }

    const keyVal = String((row.options.find((o) => o.isCorrect)?.content as { value?: unknown })?.value ?? '');
    const tg = checkTagWrite({ misconceptionId: entry, stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValue: value }, isWord);
    if (tg.verdict === 'REFUSES') { rec.push({ itemId, optionValue: value, entryId: entry, state: 'REFUSE', why: `tag gate: ${tg.why}`, dims }); continue; }
    const kg = checkKeyPerformsStem({ questionTypeId: row.questionTypeId, stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValues: row.options.map(val) }, isWord);
    if (kg.verdict === 'REFUSES') { rec.push({ itemId, optionValue: value, entryId: entry, state: 'REFUSE', why: `key gate: ${kg.why}`, dims }); continue; }

    if (APPLY) {
      await prisma.$transaction([
        prisma.itemOption.update({ where: { id: opt.id }, data: { misconceptionExecution: text } }),
        prisma.attributionEvent.create({ data: { recordType: 'item', recordId: itemId, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE,
          recordedBy: "agent:claude-code, David's session 2026-09-02", field: 'misconceptionExecution',
          method: `executions batch one (${digest.slice(0, 16)}): row digest asserted against the authored-against bytes; tag gate ${tg.verdict}, key gate ${kg.verdict}`,
          note: `"${value}" via ${entry}; COMPUTED, not a reading (determinesThisValueAndNoOther=${String(e.determinesThisValueAndNoOther)})` } }),
      ]);
    }
    rec.push({ itemId, optionValue: value, entryId: entry, state: 'LANDED', why: `row digest matched; tag gate ${tg.verdict}, key gate ${kg.verdict}`, dims });
  }

  const tally = rec.reduce<Record<string, number>>((a, r) => { a[r.state] = (a[r.state] ?? 0) + 1; return a; }, {});
  const byCase = rec.reduce<Record<string, Record<string, number>>>((a, r) => { (a[r.dims.case!] ??= {})[r.state] = ((a[r.dims.case!] ??= {})[r.state] ?? 0) + 1; return a; }, {});
  const shape: ScreenedRow[] = rec.map((r) => ({ refused: r.state === 'REFUSE' || r.state === 'HOLD', reason: (r.state === 'REFUSE' || r.state === 'HOLD') ? r.why.slice(0, 70) : undefined, dims: r.dims }));
  assessRefusalShape('batch-one', shape);

  const report = {
    kind: 'BATCH-ONE-LANDED', TO: 'the authoring store; David; Annie by relay', date: '2026-09-02', mode: APPLY ? 'APPLIED' : 'DRY RUN',
    sourceDigest: digest,
    THE_GATES: ['row digest against the bytes it was authored against', 'the tag gate (R943)', 'the key gate (R945)'],
    TALLY: tally, BY_CASE: byCase,
    THE_HOLDS_ARE_NOT_MINE: 'the batch\'s own 83 holds are untouched. This run neither resolved nor re-derived one of them.',
    RECORDS: rec,
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  Object.assign(clean, findingsDigest(clean, ['RECORDS', 'TALLY', 'BY_CASE']));
  const p = pjoin(REPO, 'content/exports', stampedName('batch-one-landed', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'batch-one-landed').split('/').pop()!;
    const bb = readFileSync(pjoin(LANE, name));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${sha(bb)}  ${name}\n`);
    writeFileSync(pjoin(DL, name), bb);
    console.log(`  crossed: ${name}`);
  }
  console.log(`  ${JSON.stringify(tally)}`);
  console.log(`  by case: ${JSON.stringify(byCase)}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
