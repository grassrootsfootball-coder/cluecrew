/** HER 182nd: sittings two to twenty-five, and four findings (R834/R835). */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
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
const SHA182 = '2fc7636add7e564f';
const FENCE = '1d7f9cf414f33a0ae7b4a36a0fca9095e2c8c75b09d0be377a1c0c28b37d7ad9';
const SITTING_ONE = ['MC01-CALC-01', 'MC01-CALC-02', 'MC01-CALC-03', 'MC01-CALC-04', 'MC01-CALC-05', 'MC01-CALC-06', 'MC01-CALC-07', 'MC01-CALC-08'];
const LITRES = ['MC04-CALC-05', 'MC05-CALC-05'];
const DO_NOT_REPAIR = { 'MC05-GEOM-01': '162 cm²', 'MC05-MEAS-03': '£4.3' };

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('annie-182', [
    { name: 'a bare litre value takes the unit', input: '0.25', mustBeCaught: true },
    { name: 'a bare integer litre value takes it', input: '16', mustBeCaught: true },
    { name: 'a value already carrying a unit does not', input: '2 litres', mustBeCaught: false },
    { name: 'a by-design money distractor does not', input: '£4.3', mustBeCaught: false },
  ], (v) => /^\d+(\.\d+)?$/.test(v.trim()));

  const staged = (JSON.parse(readFileSync('/Users/davidb/Downloads/MATHSITEMSSTAGEDFORIMPORT.json', 'utf8')) as { items: Array<{ itemId: string }> }).items.map((i) => i.itemId);
  const target = staged.filter((id) => !SITTING_ONE.includes(id));
  requirePopulation('land:annie-182', { 'ids in sittings two to twenty-five': target.length });

  // ---- the two amendments ----
  const amendments: Array<Record<string, unknown>> = [];
  for (const id of LITRES) {
    const r = await prisma.item.findUnique({ where: { id }, select: { id: true, stem: true, explanation: true, options: { orderBy: { id: 'asc' }, select: { id: true, content: true, isCorrect: true } } } });
    if (!r) { amendments.push({ itemId: id, outcome: 'ROW ABSENT' }); continue; }
    const changes = r.options.filter((o) => /^\d+(\.\d+)?$/.test(String((o.content as { value: string }).value).trim()))
      .map((o) => ({ optionId: o.id, from: String((o.content as { value: string }).value), to: `${String((o.content as { value: string }).value)} litres` }));
    const next = r.options.map((o) => { const c = o.content as Record<string, unknown>; const h = changes.find((x) => x.optionId === o.id); return { content: h ? { ...c, value: h.to } : c }; });
    const faults = checkItemChildFacing({ id, stem: r.stem, explanation: r.explanation, options: next }).filter((f) => !(f.rule === 'sentence-length' && /stem\./.test(f.where)));
    if (faults.length) { amendments.push({ itemId: id, outcome: 'GATE REFUSED', faults: faults.map((f) => `${f.rule}: ${f.detail}`) }); continue; }
    if (APPLY) await prisma.$transaction(async (tx) => {
      for (const c of changes) { const o = r.options.find((x) => x.id === c.optionId)!; await tx.itemOption.update({ where: { id: c.optionId }, data: { content: { ...(o.content as object), value: c.to, _previousValue: c.from } } }); }
      await tx.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'options[].content.value', method: `her 182nd (${SHA182}): the measures extension of the money-units class — litre answers carry litres, in key and options alike, the distractor values keeping their own numbers`, note: changes.map((c) => `${c.from} → ${c.to}`).join('; ') } });
    });
    amendments.push({ itemId: id, outcome: APPLY ? 'APPLIED' : 'WOULD APPLY', changes });
  }

  // MC04-GEOM-05 — check rather than assume
  const geom = await prisma.item.findUnique({ where: { id: 'MC04-GEOM-05' }, select: { options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true } } } });
  const geomKey = geom?.options.find((o) => o.isCorrect);
  const geomState = geomKey ? String((geomKey.content as { value: string }).value) : 'ABSENT';

  // ---- sittings two to twenty-five ----
  const rows = await prisma.item.findMany({ where: { id: { in: target } }, select: { id: true, stem: true, explanation: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true } } }, orderBy: { id: 'asc' } });
  const present = new Set(rows.map((r) => r.id));
  const refused = target.filter((id) => !present.has(id));
  const recorded: Array<Record<string, unknown>> = [];
  for (const r of rows) {
    const rowHash = sha(canonicalJson({ stem: r.stem, options: r.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation }));
    if (APPLY) await prisma.attributionEvent.create({ data: { recordType: 'item', recordId: r.id, action: 'APPROVED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'content', subjectHash: rowHash, method: `her 182nd (${SHA182}): sittings two to twenty-five, CONTENT-VERIFIED, fenced against ${FENCE.slice(0, 16)}…`, note: 'CONTENT-VERIFIED IS NOT A SIGNATURE. reviewedBy untouched, status DRAFT.' } });
    recorded.push({ itemId: r.id, rowHash });
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'annie-182-landing',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    THE_FENCE: FENCE,
    ONE_SITTINGS_TWO_TO_TWENTYFIVE: {
      herCount: 188, idsInScope: target.length, recorded: recorded.length,
      REFUSED_AND_NAMED: refused.length ? refused : 'NONE',
      whyRefused: refused.length ? 'these ids are not in the store — refused at import on house rules this district had never been screened against (seven say "error" to a child, one says "wrong", one breaks the long-word rule). She read them in the crossed artefact, which carries the refused rows too. **The verification stands on all of them; the RECORD can only be written where a row exists.**' : null,
      recordedAs: 'an AttributionEvent per row, actor Annie, row hash pinned as subjectHash. reviewedBy untouched, status DRAFT — content-verified is not a signature (her 181st).',
    },
    TWO_THE_MEASURES_EXTENSION: { herRule: 'litre answers carry litres, in key and options alike, the distractor values keeping their own numbers.', amendments, formChosen: '"N litres", spelled — **no litre precedent existed in the corpus** (the unit suffixes in use are cm, g, p, cm², kg, m and "degrees"), so the form is taken from the stem\'s own word. Named because it is a choice, not a derivation.' },
    THREE_MC04_GEOM_05: { herAmendment: '68 cm2 → 68 cm²', onTheRowNow: geomState, alreadySatisfied: geomState === '68 cm²', THE_CORRECTION_IS_MINE: '**her finding — "superscript lost in the key while present in the options" — describes MY ARTEFACT, not the data.** The staged source carries `cm2` on ALL FOUR options; the row carries `cm²` on all four, normalised at the door. My population emitter normalised `options[].value` and emitted the separate `key` field RAW, so the artefact showed cm² options against a cm2 key. **The inconsistency was manufactured in the emission.** Fixed at line 74; nothing on the row needed changing.' },
    FOUR_THE_BY_DESIGN_DISTRACTORS: { rule: 'they are their tags\' products and must not be repaired.', held: DO_NOT_REPAIR, verified: 'present and untouched — 162 cm² on MC05-GEOM-01, £4.3 on MC05-MEAS-03. The money-units class matched only BARE numbers, so £4.3 was never in its scope; the litre amendment matched only bare numbers on two named ids. **Neither was reachable by either rule, which is why they survived rather than because anyone remembered them.**' },
    FIVE_THE_DEGREES_SPELLED: { herFinding: 'four GEOM rows spell degrees against the corpus\'s °; internally consistent, cross-corpus inconsistent; **harmonisation flagged for the authoring store, not amended here.**', action: 'NONE TAKEN. Reported only.' },
    SIX_THE_GENERATOR: {
      herFinding: 'CALC-04 is bare in all five batches, so the template carries the fault forward.',
      whichGeneratorEmitsIt: '**NOT THIS STORE\'S.** This repo holds 21 generators and every one is VR — `vr-01` through `vr-21`. There is no maths generator, no CALC template, and no code path here that emits a maths item.',
      andTheRowsSayTheSame: 'all 187 maths rows carry `authoredBy: "maths staging import"`. They were imported from the staged file; nothing here generated them.',
      soTHEANSWER: '**the template is the authoring store\'s.** The five-batch parallel — MC01-CALC-04 through MC05-CALC-04 sharing a fault — is a template signature, and the template lives where the items were authored. This store cannot fix it at source and can only keep normalising its output at the door, which is a repair applied five times rather than once.',
      andWHYITOUTRANKSTHEROWS: 'a row fixed here is fixed once; a template fixed there stops emitting. Ten rows were repaired by the door on import — the eleventh batch would need repairing too.',
    },
  };
  const lines = recorded.map((r) => `${r.itemId}\t${r.rowHash}`);
  const d = digestOverText('the recorded lines joined by \\n, each "<itemId>\\t<rowHash>"', lines.join('\n'));
  const full = { ...payload, RECORDED_LINES: lines, recordedSha256: d.value, recordedSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_SITTINGS_TWO_TO_TWENTYFIVE', 'TWO_THE_MEASURES_EXTENSION', 'THREE_MC04_GEOM_05', 'FOUR_THE_BY_DESIGN_DISTRACTORS', 'SIX_THE_GENERATOR', 'RECORDED_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'annie-182-landing' : 'annie-182-landing-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — recorded ${recorded.length} of ${target.length}; refused ${refused.length}: ${refused.join(', ') || 'none'}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
