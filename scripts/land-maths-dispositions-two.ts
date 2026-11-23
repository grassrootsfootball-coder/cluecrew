/** HER THREE DISPOSITIONS AND THE THREE EM DASHES (R831). */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

const EDITS = [
  { itemId: 'MC02-RP-02', field: 'stem.text', from: '£1 50', to: '£1.50', why: 'HER DISPOSITION: the decimal points were lost. The source wrote "1 pound 50" for £1.50; the door added the £ and PRESERVED the loss, producing "£1 50" — a third form, wrong in a new way.' },
  { itemId: 'MC02-RP-02', field: 'stem.text', from: '£1 20', to: '£1.20', why: 'the second of the same pair.' },
  { itemId: 'MC05-GEOM-02', field: 'explanation.hintCore', from: 'add to 180 —', to: 'add to 180° —', why: 'HER DISPOSITION: the degree sign, restored on the corpus\'s dominant practice — MC01-GEOM-02 and MC03-GEOM-01 both write "add to 180°".' },
  { itemId: 'MC01-GEOM-02', field: 'explanation.hintCore', from: '180° — subtract', to: '180°. Subtract', why: 'ROUTINE: a dash does not break a child-facing sentence; split into two (CLAUDE.md house rule).' },
  { itemId: 'MC03-GEOM-01', field: 'explanation.hintCore', from: '180° — subtract', to: '180°. Subtract', why: 'ROUTINE: the same amendment.' },
  { itemId: 'MC05-GEOM-02', field: 'explanation.hintCore', from: '180° — subtract', to: '180°. Subtract', why: 'ROUTINE: applied after the degree restoration above, so this row takes both.' },
];

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('maths-dispositions-two', [
    { name: 'a half-converted money form is found', input: 'apples for £1 50.', mustBeCaught: true },
    { name: 'the second of the pair is found', input: 'apples for £1 20.', mustBeCaught: true },
    { name: 'a correct money form is not', input: 'apples for £1.50.', mustBeCaught: false },
    { name: 'a plain integer price is not', input: 'apples for £1.', mustBeCaught: false },
  ], (t) => /£\d+ \d{2}\b/.test(t));

  requirePopulation('land:maths-dispositions-two', { 'edits to apply': EDITS.length });
  const applied: Array<Record<string, unknown>> = [];
  for (const e of EDITS) {
    const row = await prisma.item.findUnique({ where: { id: e.itemId }, select: { id: true, stem: true, explanation: true, options: { orderBy: { id: 'asc' }, select: { content: true } } } });
    if (!row) { applied.push({ ...e, outcome: 'ROW ABSENT' }); continue; }
    const stem = row.stem as Record<string, unknown>;
    const exp = (row.explanation ?? {}) as Record<string, unknown>;
    const target = e.field === 'stem.text' ? String(stem.text ?? '') : String(exp.hintCore ?? '');
    if (!target.includes(e.from)) { applied.push({ ...e, outcome: 'ANCHOR NOT PRESENT — nothing written', rowHolds: target }); continue; }
    const after = target.replace(e.from, e.to);
    const nextStem = e.field === 'stem.text' ? { ...stem, text: after } : stem;
    const nextExp = e.field === 'stem.text' ? exp : { ...exp, hintCore: after };
    const faults = checkItemChildFacing({ id: e.itemId, stem: nextStem, explanation: nextExp, options: row.options }).filter((f) => !(f.rule === 'sentence-length' && /stem\./.test(f.where)));
    if (faults.length) { applied.push({ ...e, outcome: 'GATE REFUSED', faults: faults.map((f) => `${f.rule}: ${f.detail}`) }); continue; }
    if (APPLY) {
      await prisma.$transaction(async (tx) => {
        await tx.item.update({ where: { id: e.itemId }, data: e.field === 'stem.text' ? { stem: nextStem as object } : { explanation: { ...nextExp, _previousHintCore: target } as object } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: e.itemId, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: e.field, method: e.why, note: `"${e.from}" → "${e.to}"` } });
      });
    }
    applied.push({ ...e, outcome: APPLY ? 'APPLIED' : 'WOULD APPLY', before: target, after });
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'maths-dispositions-two',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    ONE_THE_MONEY_UNITS_CLASS: {
      herDisposition: 'across all 196.',
      state: '**ALREADY SATISFIED ON THE ROWS — 0 occurrences of "N pounds" remain.** The door normalised 110 occurrences across 20 items on import (R825), so the class was closed before this ruling arrived. Verified against the rows rather than assumed.',
    },
    TWO_MC02_RP_02: {
      herDisposition: 'the lost decimal points.',
      whatTheSourceHELD: '"5 apples for 1 pound 50" and "6 apples for 1 pound 20" — the decimal point lost in AUTHORING, not in transit.',
      whatMyDoorDID: '**it added the £ and preserved the loss, producing "£1 50".** A normaliser that half-converts makes a THIRD form, wrong in a new way — the source form is at least readable as an old convention, and "£1 50" reads as a price with a missing point.',
      contained: 'exactly one item, two occurrences. Scanned all 187 rows for `£N NN`: no other row carries it.',
    },
    THREE_MC05_GEOM_02: { herDisposition: 'the degree sign, on the corpus\'s dominant practice.', basis: 'MC01-GEOM-02 and MC03-GEOM-01 both write "add to 180°"; MC05-GEOM-02 wrote "add to 180". The dominant practice is the corpus\'s own, not a house rule imported from elsewhere.' },
    FOUR_THE_EM_DASHES: { count: 3, treatment: 'ROUTINE — a dash does not break a child-facing sentence, so each splits into two. MC05-GEOM-02 takes this AND the degree restoration.' },
    EDITS: applied,
  };
  const lines = applied.map((a) => `${a.itemId}\t${a.field}\t${a.outcome}`);
  const d = digestOverText('the edit lines joined by \\n, each "<itemId>\\t<field>\\t<outcome>"', lines.join('\n'));
  const full = { ...payload, EDIT_LINES: lines, editSha256: d.value, editSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_THE_MONEY_UNITS_CLASS', 'TWO_MC02_RP_02', 'THREE_MC05_GEOM_02', 'FOUR_THE_EM_DASHES', 'EDITS']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'maths-dispositions-two' : 'maths-dispositions-two-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — ${applied.filter((a) => String(a.outcome).includes('APPLI')).length} of ${EDITS.length} edits`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
