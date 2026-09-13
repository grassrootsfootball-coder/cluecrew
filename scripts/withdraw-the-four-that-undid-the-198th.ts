/**
 * FOUR SEATS THIS STORE FILLED THAT HER 198th HAD EMPTIED ON PURPOSE (David's ruling, 13 Sept).
 *
 * **THIS STORE IS THE INSTANCE OF THE FAULT HER 234th DESCRIBES.** She writes that a screen reading
 * a ruled emptiness as a debt "would demand a fourth seat be authored to fill a hole the rule made
 * on purpose". This store's wholeness screen did exactly that: it reported five gaps, four of them
 * seats her 198th had emptied, and the five executions were written into them. **The screen was
 * not wrong about occupancy; it had no third state to be right with.**
 *
 * The four come out and are retained with the authority named. The fifth — row 17 `oval,triangle` —
 * sits in the authoring store's OWED seat, so that write filled a debt rather than undoing a rule,
 * and it stays.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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
const RETENTION = pjoin(REPO, 'content', 'withdrawn-executions.json');
const APPLY = process.argv.includes('--apply');
const ANNIE = 'rev-0001';
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

async function main() {
  console.log(`WITHDRAW THE FOUR — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const ruled = (JSON.parse(readFileSync(pjoin(REPO, 'content/ruled-empty-seats.json'), 'utf8')) as { ruledEmpty: RuledEmpty[] }).ruledEmpty;
  const att = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: `reviewer:${ANNIE}` }, select: { id: true } })).map((m) => m.id));
  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, explanation: true, options: { select: { id: true, content: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('withdraw-the-four', { 'vr-02 row(s)': rows.length, 'ruled-empty seat(s) declared': ruled.length });

  /** A seat this store FILLED that the ruling had emptied — occupied AND on the ruled-empty list. */
  const undid: Array<{ itemId: string; optionId: string; seat: string; text: string }> = [];
  for (const r of rows) for (const o of r.options.filter((x) => x.misconceptionId)) {
    const seat = seatOf(o.content);
    const text = (o.misconceptionExecution ?? '').trim();
    if (!text) continue;
    if (!ruled.some((x) => x.itemId === r.id && x.seat === seat)) continue;
    undid.push({ itemId: r.id, optionId: o.id, seat, text });
  }

  const before = { notWhole: rows.filter((r) => !itemWholeness(r, att, false, ruled).whole).length };
  console.log(`  ${undid.length} seat(s) hold an execution in a RULED-EMPTY seat:`);
  for (const u of undid) console.log(`    ${u.itemId.slice(-2)} ${u.seat}`);

  let wrote = 0;
  if (APPLY && undid.length) {
    const prior = existsSync(RETENTION) ? JSON.parse(readFileSync(RETENTION, 'utf8')) as { what?: string; rule?: string; withdrawn?: unknown[] } : {};
    writeFileSync(RETENTION, JSON.stringify({
      what: prior.what, rule: prior.rule,
      withdrawn: [...(prior.withdrawn ?? []), ...undid.map((u) => ({
        itemId: u.itemId, seat: u.seat, tag: 'vr02-partial-group', executionWithdrawn: u.text, withdrawnOn: '2026-09-13',
        THE_WITHDRAWING_RULING: 'her 198th, via David\'s ruling of 13 September on the authoring store\'s inversion finding (63d766a40042c395): this seat is the second same-act seat of a symmetric pair and was emptied on purpose. This store WROTE INTO IT on 2026-09-05, reading the ruled emptiness as a debt — the fault her 234th names. The write is undone and retained.',
        andWHATTHISSTOREGOTWRONG: 'the wholeness screen had two states and the seat needed three. It reported a gap, and the gap was a decision.',
      }))],
    }, null, 1));

    await prisma.$transaction(async (tx) => {
      for (const u of undid) {
        await tx.itemOption.update({ where: { id: u.optionId }, data: { misconceptionExecution: null } });
        await tx.attributionEvent.create({ data: {
          recordType: 'item', recordId: u.itemId, action: 'AMENDED', reviewerId: ANNIE, actor: 'Annie',
          recordedBy: 'human:dbamgbade@gmail.com', field: 'options.misconceptionExecution',
          method: 'her 198th via David\'s 13 September ruling: this seat was emptied by rule and this store wrote into it. The write is undone; the seat is ACCOUNTED FOR and states its ruling.',
          note: `${u.seat}: WITHDRAWN — retained verbatim (sha256 ${sha(u.text).slice(0, 16)}). The seat is not a gap.`,
        } });
        wrote += 1;
      }
    });
  }

  const after = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, explanation: true, options: { select: { content: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  const tally: Record<string, number> = { OCCUPIED: 0, OWED: 0, ACCOUNTED_FOR: 0 };
  const owed: string[] = []; const acc: string[] = [];
  for (const r of after) for (const o of r.options.filter((x) => x.misconceptionId)) {
    const v = seatState(!!(o.misconceptionExecution ?? '').trim(), r.id, seatOf(o.content), ruled);
    tally[v.state] = (tally[v.state] ?? 0) + 1;
    if (v.state === 'OWED') owed.push(`${r.id.slice(-2)} ${seatOf(o.content)}`);
    if (v.state === 'ACCOUNTED_FOR') acc.push(`${r.id.slice(-2)} ${seatOf(o.content)}`);
  }
  const notWholeWith = after.filter((r) => !itemWholeness(r, att, false, ruled).whole).length;
  const notWholeWithout = after.filter((r) => !itemWholeness(r, att, false).whole).length;

  const report = {
    kind: 'THE-FOUR-THAT-UNDID-THE-198th-WITHDRAWN-AND-THE-THIRD-SEAT-STATE-WIRED',
    TO: 'Annie and the authoring store; by relay through David', date: '2026-09-13',
    mode: APPLY ? 'APPLIED' : 'DRY RUN', 
    SOURCES: { the234th: sha(readFileSync(pjoin(DL, 'annie-234-for-code.md'))), theInversionFinding: sha(readFileSync(pjoin(DL, 'inverted-on-four-rows-for-code.json'))), bothVerifiedHere: true },

    ONE_THE_ORDER_QUESTION_SETTLED_FROM_BYTES_ONLY_THIS_STORE_HOLDS: {
      yourOpenQuestion: 'whether the current option order changed — hypothesis A — settled by bytes not on your disk.',
      MEASURED: 'your bb6be0d3 partial-group order is CONFIRMED on all five rows. On rows 22, 23, 24 and 25 the CURRENT order is IDENTICAL to it, so "second by bb6be0d3 order" and "second by current order" name the same seat. **Hypothesis A is dead on those four rows.**',
      rowSEVENTEEN: 'the one row where the orders DIFFER — bb6be0d3 had oval,triangle then circle,square; the current order is reversed, because this store\'s own R991 retag rewrote the oval,triangle option row and moved it. That reorder is this store\'s doing and it is why row 17 is the row where the two withdrawals agreed.',
      andTHERULETHISSTOREAPPLIED_INONELINE: 'BY OCCUPANT, NOT BY POSITION: withdraw the seat whose execution predates her 231st. You inferred it and the inference was right. It is a tidiness rule and the 198th is positional — that is the fault, stated plainly.',
    },

    TWO_WHICH_OF_THE_FIVE_SAT_IN_RULED_EMPTY_SEATS: {
      answer: 'FOUR — rows 22, 23, 24, 25.',
      seats: undid.map((u) => `${u.itemId} :: ${u.seat}`),
      theFifth: 'bank-vr-02-two-odd-ones-out-17 :: oval,triangle — your OWED seat. That write filled a debt rather than undoing a rule, and it stays.',
      ANDTHISSTOREISTHEINSTANCEOFHER234th: 'she writes that a screen reading a ruled emptiness as a debt "would demand a fourth seat be authored to fill a hole the rule made on purpose". This store\'s screen reported five gaps, four of them ruled-empty, and this store authored into them. **The screen was not wrong about occupancy; it had no third state to be right with.**',
    },

    THREE_A_CONTENT_DIVERGENCE_NEITHER_STORE_HAD_NOTICED: {
      what: 'the executions retained on the two disks for the SAME seats are NOT the same text.',
      thisStoresForm: '"The group of three is X, Y and Z, so the two odd ones out are A and B. This option starts from…"',
      yourForm: '"The three that go together are X, Y, Z, so the two that do not are A and B. This option pairs…"',
      measured: 'all five seats this store withdrew differ from your retained text for the same seat. On this disk 45 vr-02 partial-group executions use this store\'s form and NONE uses yours; 21 options DO use your form — on vr02-answered-the-opposite and vr02-surface-link, a different entry.',
      soWHAT: 'the inversion is not only about which seat is owed. **The same seat holds different authored content on the two disks**, and a re-authoring that assumes one form will not match the other. This is reported, not resolved.',
    },

    FOUR_THE_THIRD_SEAT_STATE_WIRED: {
      states: 'OCCUPIED | OWED | ACCOUNTED_FOR, in scripts/lib/seat-state.ts, read by itemWholeness.',
      theGuard: 'ACCOUNTED_FOR requires a NAMED ruling in content/ruled-empty-seats.json. A seat emptied with no record is OWED — the state cannot be reached by silence (R98).',
      seatsNow: tally, owed, accountedFor: acc,
      rowsNotWhole: { withTheThirdState: notWholeWith, withoutIt: notWholeWithout },
      andWHATTHATDIFFERENCEIS: `${notWholeWithout - notWholeWith} row(s) that a two-state screen calls not-whole and a three-state screen calls settled. Those are the holes the rule made on purpose.`,
    },
    rowsWritten: wrote,
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_THE_ORDER_QUESTION_SETTLED_FROM_BYTES_ONLY_THIS_STORE_HOLDS', 'TWO_WHICH_OF_THE_FIVE_SAT_IN_RULED_EMPTY_SEATS', 'THREE_A_CONTENT_DIVERGENCE_NEITHER_STORE_HAD_NOTICED', 'FOUR_THE_THIRD_SEAT_STATE_WIRED'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('the-four-withdrawn-and-the-third-state', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'the-four-withdrawn-and-the-third-state').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  seats: OCCUPIED ${tally.OCCUPIED} | OWED ${tally.OWED} | ACCOUNTED_FOR ${tally.ACCOUNTED_FOR}`);
  console.log(`  rows not whole: ${notWholeWith} with the third state, ${notWholeWithout} without it. before=${before.notWhole}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
