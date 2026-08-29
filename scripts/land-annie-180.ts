/** HER 180th: the money-units class, and sitting one recorded (R833). */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const SHA180 = '914c2e959eb8d969';
const SITTING_ONE = ['MC01-CALC-01', 'MC01-CALC-02', 'MC01-CALC-03', 'MC01-CALC-04', 'MC01-CALC-05', 'MC01-CALC-06', 'MC01-CALC-07', 'MC01-CALC-08'];
const isBareNumber = (v: string) => /^\d[\d,]*(\.\d+)?$/.test(v.trim());

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('annie-180', [
    { name: 'a bare decimal money value is bare', input: '1.15', mustBeCaught: true },
    { name: 'a bare integer money value is bare', input: '3600', mustBeCaught: true },
    { name: 'a united value is not', input: '£1.15', mustBeCaught: false },
    { name: 'a pence value is not', input: '10p', mustBeCaught: false },
  ], (v) => isBareNumber(v));

  // ---- ONE: the money-units class ----
  const rows = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, stem: true, explanation: true, options: { select: { id: true, content: true, isCorrect: true } } } });
  requirePopulation('land:annie-180', { 'maths rows': rows.length, 'sitting one ids': SITTING_ONE.length });
  const moneyItems = rows.filter((r) => {
    const stem = String((r.stem as { text?: string }).text ?? '');
    if (!/£|pound|pence/i.test(stem)) return false;
    return r.options.some((o) => isBareNumber(String((o.content as { value: string }).value)));
  });

  const amended: Array<Record<string, unknown>> = [];
  for (const r of moneyItems) {
    const changes = r.options
      .filter((o) => isBareNumber(String((o.content as { value: string }).value)))
      .map((o) => ({ optionId: o.id, from: String((o.content as { value: string }).value), to: `£${String((o.content as { value: string }).value)}` }));
    const nextOptions = r.options.map((o) => {
      const c = o.content as Record<string, unknown>;
      const hit = changes.find((x) => x.optionId === o.id);
      return { content: hit ? { ...c, value: hit.to } : c };
    });
    const faults = checkItemChildFacing({ id: r.id, stem: r.stem, explanation: r.explanation, options: nextOptions }).filter((f) => !(f.rule === 'sentence-length' && /stem\./.test(f.where)));
    if (faults.length) { amended.push({ itemId: r.id, outcome: 'GATE REFUSED', faults: faults.map((f) => `${f.rule}: ${f.detail}`) }); continue; }
    if (APPLY) {
      await prisma.$transaction(async (tx) => {
        for (const c of changes) {
          const o = r.options.find((x) => x.id === c.optionId)!;
          await tx.itemOption.update({ where: { id: c.optionId }, data: { content: { ...(o.content as object), value: c.to, _previousValue: c.from } } });
        }
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: r.id, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'options[].content.value', method: `her 180th (${SHA180}): money keys and money options carry their unit; the nine bare keys amend as a class`, note: changes.map((c) => `${c.from} → ${c.to}`).join('; ') } });
      });
    }
    amended.push({ itemId: r.id, outcome: APPLY ? 'APPLIED' : 'WOULD APPLY', changes });
  }

  // ---- TWO: sitting one, recorded AFTER the class so the hash is of the row she now governs ----
  const after = await prisma.item.findMany({ where: { id: { in: SITTING_ONE } }, select: { id: true, stem: true, explanation: true, options: { select: { content: true, isCorrect: true } } }, orderBy: { id: 'asc' } });
  const sitting = [] as Array<Record<string, unknown>>;
  for (const r of after) {
    const rowHash = sha(canonicalJson({ stem: r.stem, options: r.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation }));
    if (APPLY) {
      await prisma.attributionEvent.create({ data: { recordType: 'item', recordId: r.id, action: 'APPROVED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'content', subjectHash: rowHash, method: `her 180th (${SHA180}): sitting one — CONTENT-VERIFIED; keys computed, distractors are their tags' products, hints agree with their keys`, note: 'CONTENT-VERIFIED IS NOT A SIGNATURE. reviewedBy is untouched and status stays DRAFT; her verdicts land in returns against row hashes, never through the admin surface (her 181st).' } });
    }
    sitting.push({ itemId: r.id, rowHash, changedByTheMoneyClass: moneyItems.some((m) => m.id === r.id) });
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'annie-180-landing',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    ONE_THE_MONEY_UNITS_CLASS: {
      herRule: 'money keys and money options carry their unit; the nine bare keys amend as a class.',
      found: moneyItems.length,
      herNumber: 9,
      agrees: moneyItems.length === 9,
      amended,
      whatWasNOTdecided: 'the THOUSANDS SEPARATOR. MC03-CALC-08 becomes £3600 where its own stem writes "£1,200". **Her rule is about the UNIT and says nothing about the comma**, so the digits are carried as authored and the question is named rather than settled here.',
      priorRetained: '_previousValue on each amended option — the actual prior bytes.',
    },
    TWO_SITTING_ONE: {
      herVerdict: 'MC01-CALC-01 through CALC-08 CONTENT-VERIFIED; keys computed, distractors are their tags\' products, hints agree with their keys.',
      recordedAs: 'an AttributionEvent per row, actor Annie, with the row hash pinned as subjectHash.',
      AND_IT_IS_NOT_A_SIGNATURE: '**`reviewedBy` is untouched and every row stays DRAFT.** Content-verified is a statement about the maths; a signature is a separate act and her 181st puts it in returns, not in the admin surface. Recording it as a signature would be the attested-but-unread manufacture she ruled against, one field over.',
      THE_ORDERING_MATTERS_AND_IS_STATED: '**MC01-CALC-04 is in sitting one AND in the money class.** Both rulings are in the SAME return, so the class was applied FIRST and the sitting hash pinned afterwards — the hash therefore describes the row as her own money rule leaves it, not the row she happened to read. Had it been pinned first it would have read SUPERSEDED within the same landing.',
      SHE_VERIFIED_EIGHT_AND_SIX_ARE_HERE: '**MC01-CALC-03 and MC01-CALC-06 are NOT in the store.** Both were refused at import for saying "error" in a walk script — a house rule this district has never been screened against. She content-verified them from the crossed artefact, which carries every row including the refused; the store holds six of the eight. **The verification stands on all eight; the RECORD can only be written on six**, and the two are named rather than silently dropped from a count of eight.',
      rows: sitting,
    },
  };
  const lines = sitting.map((s) => `${s.itemId}\t${s.rowHash}`);
  const d = digestOverText('the sitting-one lines joined by \\n, each "<itemId>\\t<rowHash>"', lines.join('\n'));
  const full = { ...payload, SITTING_ONE_LINES: lines, sittingSha256: d.value, sittingSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_THE_MONEY_UNITS_CLASS', 'TWO_SITTING_ONE', 'SITTING_ONE_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'annie-180-landing' : 'annie-180-landing-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — money class ${moneyItems.length} items (hers: 9) | sitting one ${sitting.length} rows recorded`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
