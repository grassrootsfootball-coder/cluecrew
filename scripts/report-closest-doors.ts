/**
 * WHICH DOORS ARE CLOSEST, AND WHAT EACH ONE COSTS (David, 2026-09-02).
 *
 * The shortfall is computed with `itemWholeness` itself, never a re-derivation (R41), and the
 * walk obligation is read under R917 — walk serves no real asset, so no row owes a script and
 * counting one would invent a debt.
 *
 * **THE SHORTFALL IS SPLIT BY WHAT IT COSTS, because "seats short" alone would rank a case that
 * needs one authored line beside one that needs a stem re-authored.** A seat missing its execution
 * is authoring against an entry that already exists. A row held on a content fault is a
 * regeneration and a fresh reading. They are not the same currency and adding them would hide the
 * only thing this report is for.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { itemWholeness } from './lib/item-wholeness';
import { requirePopulation } from './lib/population';
import { findingsDigest } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

const DOORS: Array<[string, string]> = [
  ['vr-02-two-odd-ones-out', 'case-vr-02'], ['vr-05-hidden-word', 'case-vr-05'],
  ['vr-08-move-letter', 'case-vr-08'], ['vr-13-make-a-word', 'case-vr-13'],
  ['vr-16-opposite-meaning', 'case-vr-16'], ['vr-17-complete-the-sum', 'case-vr-17'],
  ['vr-18-related-numbers', 'case-vr-18'], ['vr-19-word-number-codes', 'case-vr-19'],
  ['vr-20-complete-the-word', 'case-vr-20'], ['vr-21-same-meaning', 'case-vr-21'],
];

async function main() {
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: 'reviewer:rev-0001' }, select: { id: true } })).map((m) => m.id));
  const rowsOut: Array<Record<string, unknown>> = [];

  for (const [qt, caseId] of DOORS) {
    const c = await prisma.case.findUniqueOrThrow({ where: { id: caseId }, select: { title: true, modes: true, freeTier: true } });
    const walkAsset = (c.modes as Record<string, { assetRef?: string }>)?.walk;
    const walkServes = !!walkAsset?.assetRef && !walkAsset.assetRef.startsWith('placeholder/');   // R917
    const rows = await prisma.item.findMany({ where: { questionTypeId: qt, status: 'DRAFT' },
      select: { id: true, explanation: true, answerFlaggedAt: true, options: { orderBy: { id: 'asc' }, select: { misconceptionId: true, misconceptionExecution: true } } } });
    if (rows.length === 0) continue;
    const signed = new Set((await prisma.attributionEvent.findMany({ where: { recordId: { in: rows.map((r) => r.id) }, action: 'SIGNED', reviewerId: { not: null } }, select: { recordId: true } })).map((e) => e.recordId));

    let seatsShort = 0, rowsShortOnSeatsOnly = 0, unsignedRows = 0, unattestedRows = 0, untaggedRows = 0, whole = 0;
    for (const r of rows) {
      const w = itemWholeness(r, attested, walkServes);
      if (w.whole && signed.has(r.id)) { whole += 1; continue; }
      const tagged = r.options.filter((o) => o.misconceptionId);
      const missing = tagged.filter((o) => !o.misconceptionExecution).length;
      seatsShort += missing;
      if (tagged.length === 0) untaggedRows += 1;
      else if (!w.tagsAttested) unattestedRows += 1;
      if (!signed.has(r.id)) unsignedRows += 1;
      if (signed.has(r.id) && w.tagsAttested && tagged.length > 0 && missing > 0) rowsShortOnSeatsOnly += 1;
    }
    rowsOut.push({
      door: qt, case: caseId, title: c.title, paid: !c.freeTier,
      rows: rows.length, alreadyWholeAndSigned: whole,
      SEATS_SHORT: seatsShort,
      rowsNeedingOnlySeats: rowsShortOnSeatsOnly,
      rowsAlsoNeedingAREADING: unsignedRows,
      rowsWithAnUnattestedTag: unattestedRows,
      rowsWithNoTagAtAll: untaggedRows,
      walkObligation: walkServes ? 'a script per row' : 'EMPTY under R917 — walk serves no real asset',
    });
  }
  requirePopulation('closest-doors', { 'door(s) screened': rowsOut.length });

  const pureSeats = rowsOut.filter((d) => d.rowsAlsoNeedingAREADING === 0 && d.rowsWithNoTagAtAll === 0 && d.rowsWithAnUnattestedTag === 0)
    .sort((a, b) => (a.SEATS_SHORT as number) - (b.SEATS_SHORT as number));
  const alsoNeedReadings = rowsOut.filter((d) => !pureSeats.includes(d)).sort((a, b) => (a.SEATS_SHORT as number) - (b.SEATS_SHORT as number));

  const report = {
    kind: 'WHICH-DOORS-ARE-CLOSEST', TO: 'David; Annie and the authoring store by relay', date: '2026-09-02',
    THE_QUESTION: 'of the ten cases still shut, how many seats is each short — where does authoring buy the most doors per row?',
    THE_METHOD: 'shortfall computed with itemWholeness itself, the function the door trigger calls (R41); walk obligation read under R917, so no row is charged for a script nobody owes. vr-10 is excluded: it is open.',
    THE_CURRENCY_WARNING: 'seats and rows are NOT the same cost. A seat short is one authored execution against an entry that already exists. A row needing a reading, a tag, or a regeneration is a reviewer sitting or an authoring pass. They are listed separately and never summed.',
    DOORS_SHORT_ON_SEATS_ALONE: pureSeats,
    DOORS_ALSO_NEEDING_READINGS_OR_TAGS: alsoNeedReadings,
    THE_ORDER_BY_DOORS_PER_ROW: pureSeats.map((d) => `${d.door}: ${d.SEATS_SHORT} seat(s) and nothing else`),
    andWHATTHATMEANSFORTHENEXTPASS: pureSeats.length
      ? `${pureSeats[0]!.door} is the cheapest door in the district at ${pureSeats[0]!.SEATS_SHORT} authored seats, with no reading, no retag and no regeneration behind it.`
      : 'no door is short on seats alone; every remaining one needs a reading, a tag or a regeneration as well.',
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  Object.assign(clean, findingsDigest(clean, ['DOORS_SHORT_ON_SEATS_ALONE', 'DOORS_ALSO_NEEDING_READINGS_OR_TAGS']));
  const p = pjoin(REPO, 'content/exports', stampedName('which-doors-are-closest', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'which-doors-are-closest').split('/').pop()!;
  const b = readFileSync(pjoin(LANE, name));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${sha(b)}  ${name}\n`);
  writeFileSync(pjoin(DL, name), b);

  console.log('\n  SHORT ON SEATS ALONE (cheapest first):');
  for (const d of pureSeats) console.log(`    ${String(d.door).padEnd(26)} ${String(d.SEATS_SHORT).padStart(3)} seats   (${d.rows} rows, ${d.alreadyWholeAndSigned} already whole)`);
  console.log('  ALSO NEEDING READINGS / TAGS / REGENERATION:');
  for (const d of alsoNeedReadings) console.log(`    ${String(d.door).padEnd(26)} ${String(d.SEATS_SHORT).padStart(3)} seats + ${d.rowsAlsoNeedingAREADING} unread, ${d.rowsWithAnUnattestedTag} unattested, ${d.rowsWithNoTagAtAll} untagged`);
  console.log(`\n  crossed: ${name}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
