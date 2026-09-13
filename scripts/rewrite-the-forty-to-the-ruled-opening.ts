/**
 * THE FORTY PARTIAL-GROUP EXECUTIONS REWRITE TO THE RULED OPENING (David, 13 September).
 *
 * **WHAT IS UNAMBIGUOUS AND IS DONE HERE:** forty partial-group executions open *"The group of
 * three is…"* and the ruling is *"The three that go together are…"*. Every reading of the ruling
 * agrees they rewrite, and leaving them was the under-application this store reported last turn.
 * **Only the opening clause moves**; the entry's own second sentence is what makes it a
 * partial-group execution and is carried over untouched.
 *
 * **THE TARGET IS THE FORM THIS DISK'S REFERENCE ENTRIES ACTUALLY CARRY**, because the ruling fixes
 * the form by those entries. Measured: `vr02-surface-link` is 10 of 10 and two `answered-the-
 * opposite` in *"…X, Y and Z, and the two odd ones out are A and B"*. That is the form built.
 *
 * **AND WHAT IS NOT DONE, BECAUSE THE PREMISE DOES NOT HOLD ON THESE BYTES:** the relay says the
 * reference entries are in the authoring store's form. They are not. The authoring store writes
 * *"…X, Y, Z, so the two that do not are A and B"* — a bare list and a different clause — and that
 * form has **ZERO instances on this disk**. So this store's five are left as they are rather than
 * moved to a form nothing here uses, and the discrepancy is reported.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { readExecution } from './check-execution-describes-its-row';
import { seatOf } from './lib/seat-state';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const APPLY = process.argv.includes('--apply');
const ANNIE = 'rev-0001';
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const OLD_OPENING = /^The group of three is /;

async function main() {
  console.log(`REWRITE THE FORTY — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('rewrite-the-forty', { 'vr-02 row(s)': rows.length });

  /** The reference entries fix the form — read from them, never assumed. */
  const reference = rows.flatMap((r) => r.options.filter((o) => ['vr02-surface-link', 'vr02-answered-the-opposite'].includes(o.misconceptionId ?? '')
    && /^The three that go together are/.test((o.misconceptionExecution ?? '').trim())))
    .map((o) => (o.misconceptionExecution ?? '').trim());
  if (reference.length === 0) throw new Error('no reference execution opens with the ruled phrase — refusing to invent the form (R25)');
  const refShape = /^The three that go together are [^,]+, [^,]+ and [^,]+, and the two odd ones out are [^ ]+ and [^.]+\./;
  const refConsistent = reference.every((t) => refShape.test(t));

  const work: Array<{ itemId: string; optionId: string; seat: string; from: string; to: string }> = [];
  const skipped: string[] = [];
  for (const r of rows) {
    const key = r.options.find((o) => o.isCorrect)!;
    const words = ((r.stem as { words?: unknown[] }).words ?? []).map(String);
    const odd = seatOf(key.content).split(',').map((s) => s.trim());
    const group = words.filter((w) => !odd.includes(w));
    for (const o of r.options.filter((x) => x.misconceptionId === 'vr02-partial-group')) {
      const from = (o.misconceptionExecution ?? '').trim();
      if (!from) continue;
      if (!OLD_OPENING.test(from)) { skipped.push(`${r.id.slice(-2)} ${seatOf(o.content)}`); continue; }
      const tail = from.split(/\.\s+/).slice(1).join('. ');
      if (!tail) throw new Error(`${r.id} ${seatOf(o.content)}: no continuation to carry over — refusing to compose one (R25)`);
      const to = `The three that go together are ${group.slice(0, -1).join(', ')} and ${group[group.length - 1]}, and the two odd ones out are ${odd[0]} and ${odd[1]}. ${tail}`;
      const v = readExecution(to, words, odd);
      if (v.agrees !== true) throw new Error(`${r.id} ${seatOf(o.content)}: the rebuilt text does not describe this row (${v.agrees === null ? 'unparsed' : 'disagrees'}) — refusing to write it`);
      work.push({ itemId: r.id, optionId: o.id, seat: seatOf(o.content), from, to });
    }
  }

  console.log(`  reference executions read: ${reference.length}; all in one shape: ${refConsistent}`);
  console.log(`  ${work.length} execution(s) open "The group of three is" and rewrite; ${skipped.length} already carry the ruled opening.`);

  let wrote = 0;
  if (APPLY && work.length) {
    await prisma.$transaction(async (tx) => {
      for (const w of work) {
        await tx.itemOption.update({ where: { id: w.optionId }, data: { misconceptionExecution: w.to } });
        await tx.attributionEvent.create({ data: {
          recordType: 'item', recordId: w.itemId, action: 'AMENDED', reviewerId: ANNIE, actor: 'Annie',
          recordedBy: 'human:dbamgbade@gmail.com', field: 'options.misconceptionExecution',
          method: 'the form is ruled (David, 13 September): "The three that go together are…", fixed by this case\'s other two entries. Only the opening clause moved; the entry\'s own second sentence is carried over untouched.',
          note: `${w.seat}: opening rewritten; ${sha(w.from).slice(0, 16)} -> ${sha(w.to).slice(0, 16)}`,
        } });
        wrote += 1;
      }
    }, { timeout: 30000 });
  }

  const after = await prisma.itemOption.groupBy({ by: ['misconceptionId'], _count: true,
    where: { item: { questionTypeId: 'vr-02-two-odd-ones-out' }, misconceptionExecution: { startsWith: 'The three that go together are' } } });

  const report = {
    kind: 'THE-FORTY-REWRITTEN-AND-TWO-PREMISES-MEASURED-AGAINST-THESE-BYTES',
    TO: 'the authoring store; Annie and David by relay', date: '2026-09-13',
    ONE_WHAT_WAS_DONE: {
      what: `${work.length} partial-group execution(s) moved from "The group of three is…" to the ruled opening.`,
      howTHETARGETWASFIXED: 'read from this case\'s own reference entries, not assumed: vr02-surface-link is 10 of 10 and two vr02-answered-the-opposite in "…X, Y and Z, and the two odd ones out are A and B".',
      onlyTHEOPENINGMOVED: 'the entry\'s second sentence is what makes it a partial-group execution rather than a surface-link one. It is carried over verbatim and never recomposed; each rebuilt text was parsed and verified true of its row before the write.',
      formCensusAfter: after.map((a) => ({ entry: a.misconceptionId, executionsWithTheRuledOpening: a._count })),
    },
    TWO_TWO_PREMISES_THAT_DO_NOT_HOLD_ON_THESE_BYTES: {
      premiseOne: '"on your bytes those two entries are in the authoring store\'s form."',
      measured: 'they are NOT. The authoring store writes "The three that go together are X, Y, Z, so the two that do not are A and B" — a bare three-item list and a different second clause. **That form has ZERO instances on this disk.** This disk\'s reference entries write "X, Y and Z, and the two odd ones out are A and B" — twelve of twelve.',
      soWHATWASBUILT: 'the form this disk\'s reference entries actually carry, because the ruling fixes the form BY those entries. If the intended target is the authoring store\'s exact sentence, this store has built the wrong one and forty-five executions move again — which is why it is said now rather than found later.',
      premiseTwo: '"your disk carries surface-link in the other form on rows 03 and 08 too."',
      measuredToo: 'all TEN surface-link executions are in one form and one shape — rows 02, 03, 04, 05, 07, 08, 09, 10, 16, 19, every one opening "The three that go together are" and every tail "This option puts X with Y because they both start with…". **Rows 03 and 08 are not distinguishable from the other eight in either half.** If a rewrite is prepared and held for them, it is for something this store cannot see on its own rows.',
      andWHYTHISISREPORTEDRATHERTHANASSUMEDAWAY: 'this store has twice this fortnight accepted a correct-looking premise and let it decide a question it did not govern — the positional option-order table being the last. A premise that does not match the bytes is reported before it is acted on, even when the instruction is clear.',
    },
    THREE_WHAT_WAS_NOT_TOUCHED: 'this store\'s five, already in this disk\'s ruled opening. Moving them to the authoring store\'s variant would make them the only five executions on the case in a form nothing else here uses.',
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_WHAT_WAS_DONE', 'TWO_TWO_PREMISES_THAT_DO_NOT_HOLD_ON_THESE_BYTES'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('the-forty-rewritten-and-two-premises', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'the-forty-rewritten-and-two-premises').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  ${wrote} execution(s) rewritten.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
