/**
 * THE SEVENTEEN, THE SERVE FIGURE, AND VR-10'S TWO COSTS (David, 2026-09-02).
 *
 * ONE — land the seventeen re-authored executions (cowork-seventeen, 34cad1c61decedf2…,
 * PROVISIONAL on a projection of case-vr-16 at a0beccc2…) on the same verification the nine
 * took: THE PROJECTION'S DECLARED CHANGES ASSERTED AGAINST OUR ROWS FIRST (seat-two wears
 * synonym-pull, warm kept by her name), then per seat: tag agreement, empty slot, the sibling
 * condition each execution names on its face, both gates, verbatim landing with the
 * PROVISIONAL condition recorded.
 *
 * TWO — her serve check's figures folded in (run over HTTP against the live route,
 * 2026-09-02): eleven walk requests, one per case — what a child in walk mode receives.
 *
 * THREE — the vr-05 key-gate repair cowork exposed: `crosses_join` tested a CORRELATE
 * ("crosses a boundary") of the fault ("sits at THE join between TWO words"). R149: the gate
 * already reports non-zero, so the change is measured against a baseline captured before the
 * edit — exactly three rows may flip, hers by name (06, 17, 19).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkKeyPerformsStem } from '../packages/core/src/key-gate';
import { checkTagWrite } from '../packages/core/src/tag-write-gate';
import { requirePopulation } from './lib/population';
import { readFieldsByName } from './lib/field-read';
import { assessRefusalShape, runRefusalShapeFixture, type ScreenedRow } from './lib/refusal-shape';
import { deliver, stampedName } from './lib/export-destination';
import { findingsDigest } from './lib/findings-digest';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const sha = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
const fileSha = (p: string) => sha(readFileSync(p));
const ANNIE = 'rev-0001';
const RECORDED_BY = "agent:claude-code, David's session 2026-09-02";
const APPLY = process.argv.includes('--apply');

const DICT = '/usr/share/dict/web2';
if (!existsSync(DICT)) throw new Error(`no lexicon at ${DICT} — refusing a blind word test (R173)`);
const W = new Set(readFileSync(DICT, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean));
const isWord = (s: string) => W.has(String(s).trim().toLowerCase());

interface Rec { kind: string; target: string; state: string; detail: string; dims: Record<string, string> }
const recs: Rec[] = [];
const rec = (kind: string, target: string, state: string, detail: string, dims: Record<string, string> = {}) => { recs.push({ kind, target, state, detail, dims }); };

async function main() {
  console.log(`THE SEVENTEEN AND THE SERVE FIGURE — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  runRefusalShapeFixture();

  const c17sha = fileSha(pjoin(DL, 'cowork-seventeen-for-code.json'));
  if (c17sha !== '34cad1c61decedf22be261df965038b931bf52a3e151600cfccc4144d5089842') throw new Error('seventeen digest mismatch');
  const c17 = JSON.parse(readFileSync(pjoin(DL, 'cowork-seventeen-for-code.json'), 'utf8')) as Record<string, never>;
  const projection = String((c17['THREE_PROVISIONAL_ON_ONE_THING_NOW_NOT_TWO'] as Record<string, unknown>).projectionR729);
  console.log(`  seventeen verified at ${c17sha.slice(0, 12)}; provisional on projection ${projection.slice(0, 12)}`);

  // ---- THE PROJECTION'S DECLARED CHANGES, ASSERTED AGAINST OUR ROWS FIRST ---------------------
  const vr16 = await prisma.item.findMany({ where: { questionTypeId: 'vr-16-opposite-meaning' }, orderBy: { id: 'asc' },
    select: { id: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
  requirePopulation('seventeen:projection-assert', { 'vr-16 row(s)': vr16.length });
  const warmRow = vr16.find((r) => r.id === 'gen-vr-16-opposite-meaning-01');
  const warmSeat = warmRow?.options.find((o) => String((o.content as { value?: unknown })?.value ?? '') === 'warm');
  const loosies = vr16.flatMap((r) => r.options.filter((o) => o.misconceptionId === 'vr16-loose-opposite'));
  const declaredOk = warmSeat?.misconceptionId === 'vr16-loose-opposite' && loosies.length === 1;
  console.log(`  declared changes asserted: warm keeps loose-opposite (${warmSeat?.misconceptionId}); loose-opposite carriers across the case: ${loosies.length} (must be exactly 1).`);
  if (!declaredOk) throw new Error('the projection\'s declared changes are NOT this store\'s state — refusing the whole landing rather than landing against different bytes');

  // ---- THE SEVENTEEN --------------------------------------------------------------------------
  const seventeen = (c17['TWO_THE_SEVENTEEN'] as Record<string, unknown>).executions as Array<Record<string, unknown>>;
  readFieldsByName('the seventeen', seventeen, ['itemId', 'optionValue', 'entryId', 'EXECUTION', 'howThatWasEstablished']);
  requirePopulation('seventeen:executions', { execution: seventeen.length });
  for (const e of seventeen) {
    const id = String(e.itemId); const val = String(e.optionValue); const entry = String(e.entryId); const text = String(e.EXECUTION);
    const key = `${id}:${val}`;
    const row = vr16.find((r) => r.id === id);
    if (!row) { rec('seventeen', key, 'HOLD', 'no such row', { entry }); continue; }
    const opt = row.options.find((o) => String((o.content as { value?: unknown })?.value ?? '') === val);
    if (!opt) { rec('seventeen', key, 'HOLD', `no option "${val}"`, { entry }); continue; }
    if (opt.misconceptionId !== entry) { rec('seventeen', key, 'REFUSE', `seat wears ${opt.misconceptionId}, not ${entry}`, { entry }); continue; }
    if (opt.misconceptionExecution) { rec('seventeen', key, 'ALREADY', 'seat already carries an execution', { entry }); continue; }
    // The sibling condition each execution names on its face: the row's two OTHER synonym-pull
    // carriers exist and are the named words.
    const sibNames = (String(e.howThatWasEstablished).match(/carriers \(([^)]+)\)/)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const rowSyn = row.options.filter((o) => o.misconceptionId === 'vr16-synonym-pull' && o !== opt).map((o) => String((o.content as { value?: unknown })?.value ?? ''));
    const sibsPresent = sibNames.length === 2 && sibNames.every((s) => rowSyn.includes(s));
    if (!sibsPresent) { rec('seventeen', key, 'HOLD', `the named siblings (${sibNames.join(', ')}) are not this row's other synonym-pull carriers (${rowSyn.join(', ')})`, { entry }); continue; }
    const keyVal = String((row.options.find((o) => o.isCorrect)?.content as { value?: unknown })?.value ?? '');
    const tg = checkTagWrite({ misconceptionId: entry, stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValue: val }, isWord);
    const kg = checkKeyPerformsStem({ questionTypeId: 'vr-16-opposite-meaning', stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValues: row.options.map((o) => String((o.content as { value?: unknown })?.value ?? '')) }, isWord);
    if (tg.verdict === 'REFUSES') { rec('seventeen', key, 'REFUSE', `tag gate: ${tg.why}`, { entry }); continue; }
    if (kg.verdict === 'REFUSES') { rec('seventeen', key, 'REFUSE', `key gate: ${kg.why}`, { entry }); continue; }
    if (APPLY) {
      await prisma.$transaction([
        prisma.itemOption.update({ where: { id: opt.id }, data: { misconceptionExecution: text } }),
        prisma.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field: 'misconceptionExecution',
          method: `execution from cowork-seventeen ${c17sha.slice(0, 16)}, PROVISIONAL: rests on her 208th (302cd53d5c4065ec) plus the desk's ruling to act; bound to projection ${projection.slice(0, 16)}; declared changes asserted against these rows before landing; tag gate ${tg.verdict}, key gate ${kg.verdict}`,
          note: `"${val}" via ${entry}; a reading by named sense — fails if the named siblings (${sibNames.join(', ')}) are later ruled synonyms, and the row then goes to the input-bound check` } }),
      ]);
    }
    rec('seventeen', key, 'LANDED', `sibling condition holds (${sibNames.join(', ')}); tag gate ${tg.verdict}, key gate ${kg.verdict}`, { entry });
  }

  // ---- THE SERVE FIGURE (measured over HTTP, 2026-09-02, folded in verbatim) ------------------
  const serveCheck = {
    method: 'eleven GET requests to /api/crew/<child>/walk/<itemId>, one item per case, against the live route (next dev, 2026-09-02) — the front door, not the code',
    fourColumns: { predicate: "a child's walk request returns script sentences", population: 'one item per case, eleven cases', instrument: 'the serving route over HTTP', moment: '2026-09-02' },
    result: 'ELEVEN OF ELEVEN: NOTHING, WITH THE REASON STATED — {"sentences":[],"withheld":"This item\'s walk script is not in the approved set."} No asset, no fallback. The approval set holds ten English ids and zero VR, and the gate fires before status or content is consulted.',
    theReconciliation: [
      'zero of eleven (31 Aug): predicate = the case MODE serves a real asset (assetRef not placeholder/); still true today — 0 of 11.',
      'eleven of eleven (1 Sep): predicate = mode-declaration truthiness — this store\'s instrument conflation, corrected under R917; never a fact about serving.',
      'presence: 25 vr-10 rows carry walkScripts — existence was never zero, exactly as her 211th predicted.',
      'THE FRONT DOOR (today): 0 of 11 requests receive a script; every one is withheld at the approval gate with its reason. This is the figure the district plans around.',
    ],
    alsoFoundOnTheWay: 'pnpm dev\'s seed step REFUSES and the dev server never starts by that path: vr-letter-series-direction.childHint — the seed copy would cut 2 words from APPROVED text and the R213/R214 guard refuses the trim. The guard is working; the seed copy has drifted from the approved text and the dev pipeline is down until the seed is corrected by the approver\'s own redraft.',
  };

  // ---- VR-10'S LAST SEAT: BOTH COSTS, FOR DAVID TO RULE ---------------------------------------
  const vr10Costs = {
    theSeat: 'gen-vr-10-word-connections-23, option "wet", tag vr03-same-topic, execution NULL — the only un-whole row in the district\'s nearest door',
    optionA_mintLives: {
      what: 'vr10-first-pair-word-returned lands as a library row with a hint, wet retags to it, its execution lands',
      costs: ['ONE authored childHint — child-facing, so authored by her or under her gate; nothing else in the estate can supply it', 'attestation stamp (one write, R965 form)', 'wet\'s retag through the tag gate (one write)', 'wet\'s execution — one line, the act is fully described: the first pair\'s own word handed back'],
      opens: 'vr-10 whole at 25/25 AHEAD of the re-authoring pass — the district\'s first open door on the executions bar',
      risk: 'her refuter stands: if the re-authoring pass later prefers uniform reversed-relation seats, the mint retires having lived on one carrier — a minted entry with a one-row history',
    },
    optionB_wetReauthors: {
      what: 'wet\'s seat joins the 24-seat re-authoring pass as its 25th: a new value, vr03-reversed-relation, its execution',
      costs: ['one more authored value + tag + execution INSIDE the pass already proposed — no mint, no hint, no new entry', 'the mint dies for want of carriers, which is her refuter\'s own path, taken cleanly'],
      opens: 'vr-10 opens WITH the re-authoring pass, not ahead of it — its last seat rides the same propose -> she rules -> land arc as the other 24',
      risk: 'the one organic carrier of a real observed act (the first pair\'s word handed back) is regenerated away unrecorded in the library — the act her 209th called nameable stays unnamed',
    },
    theAsymmetry: 'A buys the district\'s first open door now for one authored sentence of hers plus three mechanical writes, and risks a one-carrier mint; B costs nothing extra but ties vr-10\'s opening to the whole pass and loses the library\'s record of a real act. David rules.',
  };

  // ---- GUARD + REPORT -------------------------------------------------------------------------
  const shape: ScreenedRow[] = recs.filter((r) => r.kind === 'seventeen').map((r) => ({ refused: r.state === 'HOLD' || r.state === 'REFUSE', reason: r.state === 'HOLD' || r.state === 'REFUSE' ? r.detail.slice(0, 70) : undefined, dims: { entry: r.dims.entry ?? 'n/a' } }));
  assessRefusalShape('seventeen:landing', shape);

  const tally = Object.fromEntries([...new Set(recs.map((r) => r.state))].map((s) => [s, recs.filter((r) => r.state === s).length]));
  const report = {
    kind: 'the-seventeen-the-serve-figure-and-vr10s-two-costs', TO: 'David; Annie and the authoring store by relay', date: '2026-09-02', mode: APPLY ? 'APPLIED' : 'DRY-RUN',
    EVIDENCE: { coworkSeventeen: c17sha, return211: fileSha(pjoin(DL, 'annie-211-for-code.md')), return210: fileSha(pjoin(DL, 'annie-210-for-code.md')), projection: projection },
    SEVENTEEN_TALLY: tally,
    THE_SERVE_FIGURE: serveCheck,
    VR10_TWO_COSTS: vr10Costs,
    THE_FIVE_ORDINALS_FOR_THE_LEDGER: 'her 211th asks the acknowledgement ledger to record which five returns were absent at the authoring store: 206, 207, 208, 209, 210 — cowork\'s own ledger names them with matching prefixes, and each predates their reader\'s twohundredand- branch; a predating, not a gap in the sequence check.',
    RECORDS: recs,
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const dig = findingsDigest(clean, ['RECORDS', 'THE_SERVE_FIGURE', 'VR10_TWO_COSTS', 'SEVENTEEN_TALLY']);
  Object.assign(clean, dig);
  const out = pjoin(REPO, 'content/exports', stampedName('seventeen-and-serve-figure', dig.findingsSha256, 'json'));
  writeFileSync(out, JSON.stringify(clean, null, 1));
  if (APPLY) { const d = deliver(out); console.log(`\nDelivered: ${d}`); } else console.log(`\nDRY RUN — ${out}`);
  console.log(`Seventeen: ${JSON.stringify(tally)}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
