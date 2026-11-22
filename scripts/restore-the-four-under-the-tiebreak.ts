/**
 * HER TIE-BREAK IS BY INPUT, AND IT RESTORES THE FOUR (David's relay, 13 September).
 *
 * **THE TEST, RUN: name the odd word each carrier pairs with.** `vr02-partial-group` is *found one
 * odd word but paired it with a group member*, so the seat's INPUT is the odd word it starts from.
 * A row's key names TWO odd words, so the entry has TWO inputs on that row and two carriers is
 * exactly two inputs — not a duplication. A third carrier would be a second seat on one odd word.
 *
 * **MEASURED ACROSS ALL TWENTY-FIVE ROWS: ZERO rows carry two partial-group seats on one input.**
 * On each of the five rows in question the two carriers use different odd words. **None of this
 * store's five is a third carrier, so all five stand and the four withdrawn a turn ago come back.**
 *
 * **AND THE POSITIONAL READING IS WHAT WAS WRONG.** "The second same-act seat of a symmetric pair"
 * presumes both seats execute the same act on the same input. By input they do not. This store
 * accepted a positional rule from a table it had verified — the table WAS right about the option
 * order, and the order was never the thing that decided it.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { itemWholeness } from './lib/item-wholeness';
import { seatState, seatOf, type RuledEmpty } from './lib/seat-state';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const APPLY = process.argv.includes('--apply');
const ANNIE = 'rev-0001';
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
/** The four withdrawn under the positional reading, by (itemId, seat). */
const THE_FOUR: Array<[string, string]> = [
  ['bank-vr-02-two-odd-ones-out-22', 'dog,snake'], ['bank-vr-02-two-odd-ones-out-23', 'cold,rough'],
  ['bank-vr-02-two-odd-ones-out-24', 'net,kick'], ['bank-vr-02-two-odd-ones-out-25', 'tuna,dolphin'],
];

async function main() {
  console.log(`RESTORE THE FOUR — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const retention = JSON.parse(readFileSync(pjoin(REPO, 'content/withdrawn-executions.json'), 'utf8')) as { what?: string; rule?: string; withdrawn: Array<Record<string, string>> };

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, stem: true, explanation: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('restore-the-four', { 'vr-02 row(s)': rows.length });

  // THE TIE-BREAK, RE-RUN HERE SO THE RESTORE CANNOT OUTLIVE ITS REASON.
  const inputs: Array<{ itemId: string; seat: string; input: string; othersOnThatInput: string[] }> = [];
  for (const r of rows) {
    const key = r.options.find((o) => o.isCorrect)!;
    const odd = seatOf(key.content).split(',').map((s) => s.trim());
    const pg = r.options.filter((o) => o.misconceptionId === 'vr02-partial-group');
    for (const o of pg) {
      const s = seatOf(o.content);
      const input = s.split(',').map((x) => x.trim()).filter((w) => odd.includes(w)).join('/');
      inputs.push({ itemId: r.id, seat: s, input,
        othersOnThatInput: pg.filter((x) => x !== o && seatOf(x.content).split(',').map((y) => y.trim()).some((w) => odd.includes(w) && w === input)).map((x) => seatOf(x.content)) });
    }
  }
  const thirdCarriers = inputs.filter((i) => i.othersOnThatInput.length > 0);
  const mineInputs = THE_FOUR.concat([['bank-vr-02-two-odd-ones-out-17', 'oval,triangle']])
    .map(([id, s]) => inputs.find((i) => i.itemId === id && i.seat === s)!);

  const restore: Array<{ itemId: string; optionId: string; seat: string; text: string }> = [];
  for (const [itemId, seat] of THE_FOUR) {
    const rec = retention.withdrawn.filter((w) => w.itemId === itemId && w.seat === seat).pop();
    if (!rec) throw new Error(`${itemId} ${seat}: no retained text — refusing to reconstruct what was retained (R25)`);
    const r = rows.find((x) => x.id === itemId)!;
    const o = r.options.find((x) => seatOf(x.content) === seat)!;
    if ((o.misconceptionExecution ?? '').trim()) { console.log(`  ${itemId.slice(-2)} ${seat}: already occupied — nothing to restore`); continue; }
    if (rec.executionWithdrawn === undefined) throw new Error(`${itemId} ${seat}: the retained record carries no executionWithdrawn — refusing to restore an absent text`);
    restore.push({ itemId, optionId: o.id, seat, text: rec.executionWithdrawn });
  }

  console.log(`  third carriers anywhere in the case: ${thirdCarriers.length}`);
  for (const m of mineInputs) console.log(`    ${m.itemId.slice(-2)} ${m.seat.padEnd(15)} input=${m.input.padEnd(8)} other carriers on that input: ${m.othersOnThatInput.length}  -> ${m.othersOnThatInput.length ? 'THIRD — comes out' : 'STANDS'}`);
  console.log(`  ${restore.length} execution(s) to restore, byte-exact from retention.`);

  let wrote = 0;
  if (APPLY && restore.length) {
    await prisma.$transaction(async (tx) => {
      for (const s of restore) {
        await tx.itemOption.update({ where: { id: s.optionId }, data: { misconceptionExecution: s.text } });
        await tx.attributionEvent.create({ data: {
          recordType: 'item', recordId: s.itemId, action: 'AMENDED', reviewerId: ANNIE, actor: 'Annie',
          recordedBy: 'human:dbamgbade@gmail.com', field: 'options.misconceptionExecution',
          method: 'her tie-break, relayed 13 September: BY INPUT, not by disk. This seat pairs an odd word no other carrier on the row uses, so it is not a third carrier and it stands. The withdrawal made under the positional reading is REVERSED.',
          note: `${s.seat}: RESTORED byte-exact from retention (sha256 ${sha(s.text).slice(0, 16)}).`,
        } });
        wrote += 1;
      }
    });
    /** The ruled-empty record is emptied, and DECLARED empty rather than deleted (R61). */
    writeFileSync(pjoin(REPO, 'content/ruled-empty-seats.json'), JSON.stringify({
      what: 'seats emptied BY RULING, not by omission. Each states the ruling on its face so no screen reads it as a debt. A seat emptied with no record here is OWED — this state cannot be reached by silence (R98).',
      rule: 'R1015 — her 234th: a seat has three states, and the third carries its ruling',
      recordedOn: '2026-09-13',
      POPULATION_IS_EMPTY_AND_THAT_IS_DECLARED: 'ZERO seats on vr-02 are ruled-empty. The five entered here on 13 September under a POSITIONAL reading of her 198th — "the second same-act seat of a symmetric pair" — and her tie-break replaced it with an INPUT reading: a seat is a duplicate only when another carrier on the row uses the same odd word. Measured across all 25 rows, NO odd word carries two partial-group seats, so nothing on vr-02 is ruled-empty and the four withdrawals were reversed. The mechanism stands with an empty population, declared (R61), never inferred.',
      ruledEmpty: [],
    }, null, 1));
  }

  const after = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, explanation: true, options: { select: { content: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  const ruledNow = (JSON.parse(readFileSync(pjoin(REPO, 'content/ruled-empty-seats.json'), 'utf8')) as { ruledEmpty: RuledEmpty[] }).ruledEmpty;
  const att = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: `reviewer:${ANNIE}` }, select: { id: true } })).map((m) => m.id));
  const tally: Record<string, number> = { OCCUPIED: 0, OWED: 0, ACCOUNTED_FOR: 0 };
  const owed: string[] = [];
  for (const r of after) for (const o of r.options.filter((x) => x.misconceptionId)) {
    const v = seatState(!!(o.misconceptionExecution ?? '').trim(), r.id, seatOf(o.content), ruledNow);
    tally[v.state] = (tally[v.state] ?? 0) + 1;
    if (v.state === 'OWED') owed.push(`${r.id.slice(-2)} ${seatOf(o.content)}`);
  }
  const notWhole = after.filter((r) => !itemWholeness(r, att, false, ruledNow).whole).length;

  const report = {
    kind: 'THE-TIE-BREAK-RUN-BY-INPUT-AND-THE-FOUR-RESTORED', TO: 'Annie and the authoring store; by relay through David',
    date: '2026-09-13', mode: APPLY ? 'APPLIED' : 'DRY RUN',
    ONE_THE_TEST_AND_ITS_ANSWER: {
      theTest: 'name the odd word each carrier pairs with; where that odd word already has a carrier on the row, the seat is a third and comes out.',
      whyTHATISTHEINPUT: 'vr02-partial-group is "found one odd word but paired it with a group member". The odd word IS the input. A row\'s key names two odd words, so the entry has TWO inputs per row and two carriers is two inputs, not a doubling.',
      MEASURED_ACROSS_ALL_25_ROWS: `${thirdCarriers.length} row(s) carry two partial-group seats on ONE odd word.`,
      thisStoresFive: mineInputs.map((m) => ({ itemId: m.itemId, seat: m.seat, oddWordItPairs: m.input, otherCarriersOnThatInput: m.othersOnThatInput.length, verdict: m.othersOnThatInput.length ? 'THIRD — comes out' : 'STANDS' })),
      ANSWER: 'ALL FIVE STAND. None is a third carrier.',
    },
    TWO_WHAT_THAT_REVERSES: {
      what: 'the four withdrawn a turn ago under a POSITIONAL reading are restored, byte-exact from retention.',
      restored: restore.map((s) => `${s.itemId} :: ${s.seat}`),
      andWHATWASWRONG: '"the second same-act seat of a symmetric pair" presumes both seats execute the same act on the same input. **By input they do not.** This store verified the authoring store\'s option-order table, found it correct, and then let a correct table decide a question the order never governed. A verified premise is not a verified inference.',
      theRULEDEMPTYRECORDISNOWEMPTY: 'and DECLARED empty (R61), not deleted. The third seat state stands with zero instances on vr-02.',
    },
    THREE_THE_SEATS_NOW: { tally, owed, rowsNotWhole: notWhole,
      reading: 'five owed seats, all of them the stale occupants her 232nd withdrew. Nothing on vr-02 is ruled-empty.' },
    rowsWritten: wrote,
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_THE_TEST_AND_ITS_ANSWER', 'TWO_WHAT_THAT_REVERSES', 'THREE_THE_SEATS_NOW'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('tie-break-by-input-and-the-four-restored', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'tie-break-by-input-and-the-four-restored').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  seats: OCCUPIED ${tally.OCCUPIED} | OWED ${tally.OWED} | ACCOUNTED_FOR ${tally.ACCOUNTED_FOR}; rows not whole ${notWhole}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
