/**
 * HER 232nd: THE EXECUTIONS COME OUT OF THEIR SEATS AND ARE RETAINED WITH THE WITHDRAWING RULING
 * NAMED. **A seat that is owed work must look owed.**
 *
 * **WHICH SEATS, MEASURED RATHER THAN TAKEN FROM THE LIST.** The authoring store's withdrawal names
 * five seats. On THIS disk four of those five were EMPTY when it measured and were filled on
 * 2026-09-05 under her 231st, from the rows as they now stand — so removing them would delete
 * current, verified work on a stale withdrawal. The five seats that actually carry a pre-231st
 * execution are the OTHER partial-group option on each of the same five rows.
 *
 * **THAT IS R1008 FOR THE THIRD TIME AND IT IS THE FINDING, NOT AN INCONVENIENCE**: same rows,
 * complementary seats, because occupant state is disk-local. Their list is correct about their
 * disk. A removal driven by the list rather than by the rows would have emptied five current seats
 * and left five stale ones full.
 *
 * **WITHDRAWN IS NOT DELETED.** Each text is retained verbatim with the withdrawing ruling named,
 * because a record of destruction that does not name what was destroyed is a record with no subject
 * (R964's pair). Writes content unguarded as a ruling-applier does (R63).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { itemWholeness } from './lib/item-wholeness';
import { compareToPopulation, type BindableRow } from './lib/population-binding';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const POP = pjoin(DL, '11+', 'archive', 'from-cluecrew', '2026-08', 'vr-arc-census-and-population-bb6be0d3f2fed905.json');
const RETENTION = pjoin(REPO, 'content', 'withdrawn-executions.json');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:dbamgbade@gmail.com';
const ANNIE = 'rev-0001';
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const THE_FIVE_ROWS = ['17', '22', '23', '24', '25'].map((n) => `bank-vr-02-two-odd-ones-out-${n}`);

async function main() {
  console.log(`WITHDRAW THE EXECUTIONS — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, stem: true, solution: true, explanation: true,
      options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('withdraw-executions', { 'vr-02 row(s)': rows.length });

  const pop = JSON.parse(readFileSync(POP, 'utf8')) as { SECTIONS: Array<{ caseId: string; rows: Array<{ itemId: string; stem: unknown; solution?: unknown; options: Array<{ value: unknown; isKey: boolean }> }> }> };
  const popRows = pop.SECTIONS.filter((s) => s.caseId === 'case-vr-02').flatMap((s) => s.rows);
  const bindable = (r: (typeof rows)[number]): BindableRow => ({ itemId: r.id, stem: r.stem, solution: r.solution,
    options: r.options.map((o) => ({ value: (o.content as { value?: unknown })?.value, isKey: o.isCorrect })) });
  const moved = new Set(compareToPopulation(rows.map(bindable), popRows.map((r) => ({ itemId: r.itemId, stem: r.stem, solution: r.solution ?? null, options: r.options }))).moved);

  const seatOf = (o: { content: unknown }) => { const v = (o.content as { value?: unknown })?.value; return Array.isArray(v) ? v.join(',') : String(v); };

  /** A seat withdraws when it carries an execution written BEFORE her 231st, on a row that moved. */
  const toWithdraw: Array<{ itemId: string; optionId: string; seat: string; tag: string; text: string }> = [];
  const keptCurrent: Array<{ itemId: string; seat: string }> = [];
  for (const id of THE_FIVE_ROWS) {
    const r = rows.find((x) => x.id === id)!;
    for (const o of r.options.filter((x) => x.misconceptionId === 'vr02-partial-group')) {
      const text = (o.misconceptionExecution ?? '').trim();
      if (!text) continue;
      const seat = seatOf(o);
      const ev = await prisma.attributionEvent.findFirst({
        where: { recordId: id, field: { contains: 'misconceptionExecution' }, note: { startsWith: `${seat}:` } },
        orderBy: { at: 'desc' }, select: { method: true } });
      const writtenUnder231 = (ev?.method ?? '').includes('231st');
      if (writtenUnder231) { keptCurrent.push({ itemId: id, seat }); continue; }
      toWithdraw.push({ itemId: id, optionId: o.id, seat, tag: o.misconceptionId!, text });
    }
  }

  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: `reviewer:${ANNIE}` }, select: { id: true } })).map((m) => m.id));
  const wholeBefore = rows.filter((r) => itemWholeness(r, attested, false).whole).length;

  console.log(`  ${toWithdraw.length} seat(s) withdraw; ${keptCurrent.length} kept because they were written under her 231st from the rows as they now stand.`);
  for (const w of toWithdraw) console.log(`    WITHDRAW ${w.itemId.slice(-2)} ${w.seat.padEnd(15)}${moved.has(w.itemId) ? '(row moved since bb6be0d3)' : '(row did NOT move)'}`);
  for (const k of keptCurrent) console.log(`    KEEP     ${k.itemId.slice(-2)} ${k.seat}`);

  let wrote = 0;
  if (APPLY && toWithdraw.length) {
    const prior = existsSync(RETENTION) ? JSON.parse(readFileSync(RETENTION, 'utf8')) as { withdrawn?: unknown[] } : {};
    const retained = [...(prior.withdrawn ?? []), ...toWithdraw.map((w) => ({
      itemId: w.itemId, seat: w.seat, tag: w.tag, executionWithdrawn: w.text,
      withdrawnOn: '2026-09-13',
      THE_WITHDRAWING_RULING: 'Annie\'s 232nd (36726444d858b36f, recorded AS RELAYED — no annie-232 file is on this desk): the executions come out of their seats and are retained with the withdrawing ruling named. A seat that is owed work must look owed.',
      whyTHISSEAT: 'it carried an execution written before her 231st, on a row whose content moved since bb6be0d3. The other partial-group seat on this row was filled on 2026-09-05 from the row as it now stands and is not withdrawn.',
    }))];
    writeFileSync(RETENTION, JSON.stringify({
      what: 'executions removed from their seats by a reviewer withdrawal, retained verbatim. A record of destruction that does not name what was destroyed is a record with no subject.',
      rule: 'R1013 — her 232nd; withdrawn is not deleted',
      withdrawn: retained,
    }, null, 1));

    await prisma.$transaction(async (tx) => {
      for (const w of toWithdraw) {
        await tx.itemOption.update({ where: { id: w.optionId }, data: { misconceptionExecution: null } });
        await tx.attributionEvent.create({ data: {
          recordType: 'item', recordId: w.itemId, action: 'AMENDED', reviewerId: ANNIE, actor: 'Annie', recordedBy: DAVID,
          field: 'options.misconceptionExecution',
          method: 'her 232nd, as relayed: the executions come out of their seats and are retained with the withdrawing ruling named. A seat that is owed work must look owed.',
          note: `${w.seat}: WITHDRAWN — the text is retained verbatim in content/withdrawn-executions.json (sha256 of the withdrawn text ${sha(w.text).slice(0, 16)}). This seat now reads as owed.`,
        } });
        wrote += 1;
      }
    });
  }

  const after = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, explanation: true, options: { select: { content: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  const notWhole = after.filter((r) => !itemWholeness(r, attested, false).whole);
  const owedSeats = after.flatMap((r) => r.options.filter((o) => o.misconceptionId && !(o.misconceptionExecution ?? '').trim()).map((o) => ({ itemId: r.id, seat: seatOf(o), status: r.status })));

  const report = {
    kind: 'THE-EXECUTIONS-WITHDRAWN-AND-THE-SEATS-NOW-LOOK-OWED',
    TO: 'Annie, and the authoring store; by relay through David',
    date: '2026-09-13', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    PROVENANCE: { source: 'annie-232-for-code.md', statedDigest: '36726444d858b36fd72df5c58ed0a3428cd0ea083e54879751edc4c7d9ad1846',
      RECORDED_FROM_A_RELAY_NOT_FROM_THE_BYTES: 'no annie-232 file is on this desk. The digest above is David\'s, quoted and NOT verified here. If the return crosses, this field is REPLACED by the verification.' },
    ONE_WHICH_SEATS_AND_WHY_NOT_THE_LIST: {
      theAuthoringStoresWithdrawal: ['17 circle,square', '22 dog,snake', '23 cold,rough', '24 net,kick', '25 tuna,dolphin'],
      whatThisDiskActuallyCARRIES: 'four of those five were EMPTY here when you measured. They were filled on 2026-09-05 under her 231st, from the rows as they now stand, and check:execution-describes-its-row confirms they still describe them. Removing them would delete current verified work on a stale withdrawal.',
      theSeatsTHATWITHDRAWHERE: toWithdraw.map((w) => `${w.itemId.slice(-2)} ${w.seat}`),
      andWHYTHATISTHEFINDING: 'same five rows, COMPLEMENTARY seats — R1008 for the third time. Occupant state is disk-local, so your list is right about your disk and wrong about this one. A removal driven by the list rather than by the rows would have emptied five current seats and left five stale ones full.',
    },
    TWO_WHAT_THE_WHOLENESS_SCREEN_SAYS: {
      before: `${wholeBefore} of ${rows.length} whole, 0 faults`,
      after: `${after.length - notWhole.length} of ${after.length} whole, ${notWhole.length} row(s) now report a fault`,
      OWED_SEATS: owedSeats,
      andTHATISTHETWOAXISFINDINGPAYINGOUT: 'the wholeness screen could not see a stale binding and can see an ABSENT execution. Withdrawing the text converts an invisible fault into a visible one — which is what "a seat that is owed work must look owed" buys.',
      andONECONSEQUENCEWORTHSAYING: `these ${notWhole.length} rows are LIVE. A child meets nothing different — an execution is staff-facing (R1009) — but vr-02 now carries LIVE rows that would not pass the publication gate it passed this morning. That is the intended state and it should be an intended one, not a discovered one.`,
    },
    THREE_WITHDRAWN_IS_NOT_DELETED: { retainedIn: 'content/withdrawn-executions.json', count: toWithdraw.length,
      each: 'the verbatim text, its seat, its tag, the withdrawing ruling named, and why that seat and not its sibling.' },
    rowsWritten: wrote,
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_WHICH_SEATS_AND_WHY_NOT_THE_LIST', 'TWO_WHAT_THE_WHOLENESS_SCREEN_SAYS', 'THREE_WITHDRAWN_IS_NOT_DELETED'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('executions-withdrawn', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'executions-withdrawn').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  wholeness: ${wholeBefore} of ${rows.length} -> ${after.length - notWhole.length} of ${after.length}; ${owedSeats.length} owed seat(s).`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
