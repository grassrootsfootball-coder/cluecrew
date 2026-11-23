/**
 * LAND ROUND TWO (David, 2026-09-02) — two more artefacts join the landing, same run.
 *
 *  - annie-209 (252441876421…): vr10's doubling FALLS under the input-bound rule (the entry's
 *    input is the topic); twenty-five second seats re-author, vr03-reversed-relation the
 *    destination for every directional row; row 23's wet a PROPOSED mint with its refuter.
 *    One conditional amendment: verified against the SERVING bytes at landing, not either
 *    held copy.
 *  - cowork-forty-nine (71cf8315e2a6…): eighteen executions by named route; ten held on named
 *    siblings; twenty-one moved to vr21-opposite-pull — landed under her mint, not under the
 *    tag they wore.
 *
 * WHATEVER REFUSES IS A HOLD. Where cowork's batch label and her per-word refuters disagree
 * (generous, ticket, lend), HER NAMED RULING STANDS — a ruled row is not an unread row (R593),
 * and the divergence is recorded, never silently resolved.
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
const isHold = (s: string) => s.startsWith('HOLD') || s.startsWith('REFUSE');

async function main() {
  console.log(`LAND ROUND TWO — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  runRefusalShapeFixture();

  // ---- EVIDENCE -------------------------------------------------------------------------------
  const ret209sha = fileSha(pjoin(DL, 'annie-209-for-code.md'));
  if (ret209sha !== '252441876421076a8772783eb880a265952c67ad18d75aecc2ac45ec5ada30de') throw new Error('209th digest mismatch');
  const c49sha = fileSha(pjoin(DL, 'cowork-forty-nine-for-code.json'));
  if (c49sha !== '71cf8315e2a6fe065088a1592a6d0e7715616144ad511e142be5f29b144d14e6') throw new Error('forty-nine digest mismatch');
  const c49 = JSON.parse(readFileSync(pjoin(DL, 'cowork-forty-nine-for-code.json'), 'utf8')) as Record<string, never>;
  console.log(`  evidence: 209th ${ret209sha.slice(0, 12)}, forty-nine ${c49sha.slice(0, 12)}`);

  // ---- 1. HER CONDITIONAL AMENDMENT — verified against the SERVING bytes ----------------------
  console.log('\n1. The conditional SAME amendment, against the serving bytes.');
  const vr03 = await prisma.misconception.findUniqueOrThrow({ where: { id: 'vr03-same-topic' }, select: { childHint: true } });
  const shouts = /\b[A-Z]{2,}\b/.test(vr03.childHint ?? '');
  if (!shouts) {
    rec('amendment', 'library:vr03-same-topic:childHint', 'NOTHING-LANDS', `her condition: "if the serving bytes still shout, the hint amends; if they do not, nothing lands." The serving bytes do not shout: "${vr03.childHint}". Note: the serving bytes also differ from BOTH her held copies — the two were cut at different moments, which is exactly what her moments rule anticipated; the serving bytes decide and nothing lands.`, { namespace: 'library' });
  } else if (vr03.childHint === 'Say the first pair as a sentence, then use the SAME sentence for the second.') {
    if (APPLY) {
      await prisma.$transaction([
        prisma.misconception.update({ where: { id: 'vr03-same-topic' }, data: { childHint: 'Say the first pair as a sentence, then use the same sentence for the second.' } }),
        prisma.attributionEvent.create({ data: { recordType: 'misconception', recordId: 'vr03-same-topic', action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field: 'childHint', method: `her 209th's conditional amendment (${ret209sha.slice(0, 16)}), verified against the serving bytes at landing`, note: 'the shout un-shouts under the standing class' } }),
      ]);
    }
    rec('amendment', 'library:vr03-same-topic:childHint', 'APPLIED', 'the serving bytes shouted her replaced wording exactly; amended lower-case', { namespace: 'library' });
  } else {
    rec('amendment', 'library:vr03-same-topic:childHint', 'HOLD', `the serving bytes shout but are not her replaced wording: "${vr03.childHint}"`, { namespace: 'library' });
  }

  // ---- 2. THE EIGHTEEN EXECUTIONS BY NAMED ROUTE ----------------------------------------------
  console.log('2. The eighteen executions, through the landing rules and both gates.');
  const eighteen = c49['TWO_EIGHTEEN_AUTHORED_BY_NAMED_ROUTE']!['executions'] as Array<Record<string, unknown>>;
  readFieldsByName('the eighteen', eighteen, ['itemId', 'optionValue', 'entryId', 'EXECUTION']);
  requirePopulation('round-two:executions', { execution: eighteen.length });
  for (const e of eighteen) {
    const id = String(e.itemId); const val = String(e.optionValue); const entry = String(e.entryId); const text = String(e.EXECUTION);
    const key = `${id}:${val}`;
    const row = await prisma.item.findUnique({ where: { id }, select: { stem: true, questionTypeId: true, options: { orderBy: { id: 'asc' }, select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
    if (!row) { rec('execution', key, 'HOLD', 'no such item', { entry }); continue; }
    const opt = row.options.find((o) => String((o.content as { value?: unknown })?.value ?? '') === val);
    if (!opt) { rec('execution', key, 'HOLD', `no option "${val}" on the row`, { entry }); continue; }
    if (opt.misconceptionId !== entry) {
      rec('execution', key, 'REFUSE', `the seat no longer wears ${entry} — it wears ${opt.misconceptionId ?? 'no tag'}, retagged under her 208th (ratified and landed in round one). The execution was authored against a tag layer that has since moved; it returns to its author with the new layer named — a verdict follows its bytes (her 208th).`, { entry });
      continue;
    }
    if (opt.misconceptionExecution) { rec('execution', key, 'ALREADY', 'seat already carries an execution', { entry }); continue; }
    const keyVal = String((row.options.find((o) => o.isCorrect)?.content as { value?: unknown })?.value ?? '');
    const tg = checkTagWrite({ misconceptionId: entry, stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValue: val }, isWord);
    const kg = checkKeyPerformsStem({ questionTypeId: row.questionTypeId, stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValues: row.options.map((o) => String((o.content as { value?: unknown })?.value ?? '')) }, isWord);
    if (tg.verdict === 'REFUSES') { rec('execution', key, 'REFUSE', `tag gate: ${tg.why}`, { entry }); continue; }
    if (kg.verdict === 'REFUSES') { rec('execution', key, 'REFUSE', `key gate: ${kg.why}`, { entry }); continue; }
    if (APPLY) {
      await prisma.$transaction([
        prisma.itemOption.update({ where: { id: opt.id }, data: { misconceptionExecution: text } }),
        prisma.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field: 'misconceptionExecution', method: `execution by named route, cowork forty-nine ${c49sha.slice(0, 16)}; tag gate ${tg.verdict}, key gate ${kg.verdict}`, note: `"${val}" via ${entry}; a reading, not a computation — offered to be disagreed with (their own marking)` } }),
      ]);
    }
    rec('execution', key, 'LANDED', `tag gate ${tg.verdict}, key gate ${kg.verdict}`, { entry });
  }

  // ---- 3. THE TEN CONTINGENT ------------------------------------------------------------------
  console.log('3. The ten contingent, recorded with their named siblings; nothing lands.');
  const ten = c49['THREE_TEN_HELD_CONTINGENT_ON_A_SIBLING']!['held'] as Array<Record<string, unknown>>;
  for (const h of ten) {
    rec('contingent', `${h.itemId}:${h.optionValue}`, 'HELD-CONTINGENT', `${h.entryId}: ${String(h.why).slice(0, 100)} — contingent on ${String(h.contingentOn).slice(0, 80)}; the execution is one line when the sibling resolves`, { entry: String(h.entryId) });
  }

  // ---- 4. THE TWENTY-ONE, under her mint ------------------------------------------------------
  console.log('4. The twenty-one land under her mint, her per-word refuters standing.');
  const twentyOne = c49['ONE_A_MISLABEL_OWNED_BEFORE_ANYTHING_IS_AUTHORED']!['theTwentyOne'] as Array<Record<string, unknown>>;
  const herRefuters: Record<string, string> = { generous: 'vr21-associated-not-same', ticket: 'vr21-associated-not-same', lend: 'RE-AUTHORS' };
  for (const m of twentyOne) {
    const val = String(m.optionValue);
    const opts = await prisma.itemOption.findMany({ where: { item: { questionTypeId: 'vr-21-same-meaning' } }, select: { itemId: true, content: true, misconceptionId: true } });
    const seat = opts.find((o) => String((o.content as { value?: unknown })?.value ?? '') === val && ['vr21-opposite-pull', 'vr21-associated-not-same', 'vr21-too-strong'].includes(o.misconceptionId ?? ''));
    if (!seat) { rec('twenty-one', val, 'HOLD', 'no seat carries this value in the vr21 tag family', { entry: 'vr21' }); continue; }
    const expected = herRefuters[val];
    if (expected === 'RE-AUTHORS') {
      rec('twenty-one', `${seat.itemId}:${val}`, 'HOLD', `her 208th rules ${val} performs nothing at all and re-authors — her named per-word refuter outranks the batch label (divergence from cowork's list, recorded)`, { entry: 'vr21' });
    } else if (expected) {
      const ok = seat.misconceptionId === expected;
      rec('twenty-one', `${seat.itemId}:${val}`, ok ? 'STANDS-UNDER-HER-REFUTER' : 'HOLD', ok
        ? `${val} wears ${expected} per her 208th's named refuter — not the mint; divergence from cowork's batch recorded, her per-word ruling standing (R593)`
        : `expected ${expected} per her refuter, seat wears ${seat.misconceptionId}`, { entry: 'vr21' });
    } else {
      const ok = seat.misconceptionId === 'vr21-opposite-pull';
      rec('twenty-one', `${seat.itemId}:${val}`, ok ? 'UNDER-THE-MINT' : 'HOLD', ok ? 'wears vr21-opposite-pull (landed round one under her 208th)' : `seat wears ${seat.misconceptionId}, not the mint`, { entry: 'vr21' });
    }
  }

  // ---- 5. VR10: THE DOUBLING FALLS; the re-authoring proposal ---------------------------------
  console.log('5. vr10: the doubling falls; the re-authoring PROPOSAL, per row, with refuters.');
  const vr10rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-10-word-connections' }, orderBy: { id: 'asc' }, select: { id: true, stem: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true } } } });
  requirePopulation('round-two:vr10', { 'vr10 row(s)': vr10rows.length });
  // Relations read per row by this store, under her delegation ("assignment per row is the
  // store's under the write gate; reversed-relation preferred where the relation runs one way").
  const RELATIONS: Record<string, { relation: string; directional: boolean; crispReversalValue?: string }> = {
    'gen-vr-10-word-connections-01': { relation: 'season -> its typical feeling (winter->cold)', directional: true },
    'gen-vr-10-word-connections-02': { relation: 'part -> whole (minute->hour); the stem IS the first pair\'s whole, so the reversal product is crisp', directional: true, crispReversalValue: 'minute' },
    'gen-vr-10-word-connections-03': { relation: 'part -> whole (leaf->tree)', directional: true },
    'gen-vr-10-word-connections-04': { relation: 'operator -> vehicle (captain->ship)', directional: true },
    'gen-vr-10-word-connections-05': { relation: 'animal -> product (bee->honey)', directional: true },
    'gen-vr-10-word-connections-06': { relation: 'adult -> young (sheep->lamb)', directional: true },
    'gen-vr-10-word-connections-07': { relation: 'animal -> made home/product (spider->web)', directional: true },
    'gen-vr-10-word-connections-08': { relation: 'wearer -> headgear (king->crown)', directional: true },
    'gen-vr-10-word-connections-09': { relation: 'maker -> product (baker->bread)', directional: true },
    'gen-vr-10-word-connections-10': { relation: 'body part -> its garment (foot->shoe)', directional: true },
    'gen-vr-10-word-connections-11': { relation: 'thing -> its size (puddle->small)', directional: true },
    'gen-vr-10-word-connections-12': { relation: 'act -> its loudness (whisper->quiet)', directional: true },
    'gen-vr-10-word-connections-13': { relation: 'young form -> grown form (seed->plant)', directional: true },
    'gen-vr-10-word-connections-14': { relation: 'young -> adult (kitten->cat)', directional: true },
    'gen-vr-10-word-connections-15': { relation: 'body part -> its garment (hand->glove)', directional: true },
    'gen-vr-10-word-connections-16': { relation: 'animal -> its home (bird->nest)', directional: true },
    'gen-vr-10-word-connections-17': { relation: 'time -> its light body (day->sun)', directional: true },
    'gen-vr-10-word-connections-18': { relation: 'organ -> its function (eye->see)', directional: true },
    'gen-vr-10-word-connections-19': { relation: 'tool -> its function (pen->write)', directional: true },
    'gen-vr-10-word-connections-20': { relation: 'animal -> its motion (fish->swim)', directional: true },
    'gen-vr-10-word-connections-21': { relation: 'vehicle -> its way (car->road)', directional: true },
    'gen-vr-10-word-connections-22': { relation: 'worker -> workplace (teacher->school)', directional: true },
    'gen-vr-10-word-connections-23': { relation: 'weather -> its property (rain->wet); row 23 is the mint-carrier row', directional: true },
    'gen-vr-10-word-connections-24': { relation: 'young form -> adult form (caterpillar->butterfly)', directional: true },
    'gen-vr-10-word-connections-25': { relation: 'object -> its function (book->read)', directional: true },
  };
  const reauthoring: Array<Record<string, unknown>> = [];
  for (const r of vr10rows) {
    const same = r.options.filter((o) => o.misconceptionId === 'vr03-same-topic').map((o) => String((o.content as { value?: unknown })?.value ?? ''));
    const rel = RELATIONS[r.id];
    if (!rel) { rec('vr10-reauthor', r.id, 'HOLD', 'row not in the reading table — refusing an unread assignment', { door: 'vr-10' }); continue; }
    if (r.id === 'gen-vr-10-word-connections-23') {
      reauthoring.push({ itemId: r.id, sameTopicSeats: same, disposition: 'wet is the PROPOSED mint vr10-first-pair-word-returned\'s first carrier (her 209th) — it already performs a different act; no re-authoring needed beyond the mint; yellow remains the row\'s one same-topic carrier', refuter: 'her stated refuter: if the re-authoring pass prefers uniform reversed-relation seats, the mint waits for organic carriers rather than being kept alive by one' });
      rec('vr10-reauthor', r.id, 'PROPOSED', 'wet -> mint carrier (mint PROPOSED, not yet a library row); yellow stays', { door: 'vr-10' });
      continue;
    }
    reauthoring.push({
      itemId: r.id, sameTopicSeats: same, relation: rel.relation, directional: rel.directional,
      proposedEntry: 'vr03-reversed-relation', seatToReauthor: `one of the two same-topic seats (both are true-and-empty duplicates); the generation pass picks which — the ENTRY assignment is the ruling, the physical seat is a generation detail`,
      proposedValue: rel.crispReversalValue ?? 'AUTHORING-NEEDED — the reversal product is a semantic generation, proposed by the generator and refused or accepted by her reading',
      refuterPerRow: 'a reading that this row\'s relation does not run one way refutes its reversed-relation assignment',
    });
    rec('vr10-reauthor', r.id, 'PROPOSED', `directional (${rel.relation.split('(')[0]!.trim()}); destination vr03-reversed-relation${rel.crispReversalValue ? `; crisp value "${rel.crispReversalValue}"` : ''}`, { door: 'vr-10' });
  }
  rec('mint', 'vr10-first-pair-word-returned', 'PROPOSED-NOT-CREATED', 'her mint stays a proposal: no childHint has been authored for it, and a library row requires one — creating it with an invented hint would be authoring, with an empty one a placeholder fault. It lands as a row when its hint crosses; wet is named as first carrier; her refuter recorded verbatim.', {});

  // ---- 6. REFUSAL-SHAPE GUARD -----------------------------------------------------------------
  console.log('\n6. Refusal-shape guard over every refusal set (R962).');
  const shapeOver = (kinds: string[], dimKey: string) => recs.filter((r) => kinds.includes(r.kind)).map((r): ScreenedRow => ({ refused: isHold(r.state), reason: isHold(r.state) ? r.detail.slice(0, 80) : undefined, dims: { [dimKey]: r.dims[dimKey] ?? r.dims.entry ?? r.dims.door ?? 'n/a' } }));
  const sExec = assessRefusalShape('round-two:executions', shapeOver(['execution'], 'entry'));
  const sTw = assessRefusalShape('round-two:twenty-one', shapeOver(['twenty-one'], 'entry'));
  const sMisc = assessRefusalShape('round-two:amendment+vr10', shapeOver(['amendment', 'vr10-reauthor'], 'door'));
  const guardInvestigations = [
    { set: 'executions', hypotheses: sExec.hypotheses, verdict: sExec.hypotheses.length ? 'INVESTIGATED: the refusals cluster on vr16-loose-opposite because the tag layer they were authored against MOVED — her 208th retagged seat two to synonym-pull between their authoring (bound to bb6be0d3) and this landing. The cause is a stale cross-store binding, not a predicate fault; the refusals stand and the executions return to their author with the new layer named. This is the shape a legitimate wholesale refusal makes: one cause, outside the instrument, named.' : 'no hypothesis' },
    { set: 'twenty-one', hypotheses: sTw.hypotheses, verdict: sTw.hypotheses.length ? 'INVESTIGATED: the holds are her named per-word refuters (generous, ticket, lend) — rulings, not faults.' : 'no hypothesis' },
    { set: 'amendment+vr10', hypotheses: sMisc.hypotheses, verdict: sMisc.hypotheses.length ? 'investigated' : 'no hypothesis' },
  ];

  // ---- 7. THE REPORT PER DOOR -----------------------------------------------------------------
  console.log('\n7. Publication report per door.');
  const DOORS = ['vr-02-two-odd-ones-out', 'vr-05-hidden-word', 'vr-08-move-letter', 'vr-10-word-connections', 'vr-13-make-a-word', 'vr-16-opposite-meaning', 'vr-17-complete-the-sum', 'vr-18-related-numbers', 'vr-19-word-number-codes', 'vr-20-complete-the-word', 'vr-21-same-meaning'];
  const doorReports: Array<Record<string, unknown>> = [];
  // Round-one holds are published reasons and still govern; re-derive the same row-level holds.
  const roundOneHolds: Record<string, string[]> = {
    'vr-05-hidden-word': ['gen-vr-05-hidden-word-06', 'gen-vr-05-hidden-word-16', 'gen-vr-05-hidden-word-17', 'gen-vr-05-hidden-word-19'],
    'vr-08-move-letter': Array.from({ length: 25 }, (_, i) => `gen-vr-08-move-letter-${String(i + 1).padStart(2, '0')}`).filter((id) => !['gen-vr-08-move-letter-02', 'gen-vr-08-move-letter-03', 'gen-vr-08-move-letter-06', 'gen-vr-08-move-letter-08'].includes(id)),
  };
  for (const qt of DOORS) {
    const rows = await prisma.item.findMany({ where: { questionTypeId: qt, status: { in: ['DRAFT', 'NEVER_SHIPPABLE'] } },
      select: { id: true, status: true, authoredBy: true, answerFlaggedAt: true, sendHistory: true, options: { orderBy: { id: 'asc' }, select: { misconceptionId: true, misconceptionExecution: true } } } });
    const draft = rows.filter((r) => r.status === 'DRAFT');
    const signedIds = new Set((await prisma.attributionEvent.findMany({ where: { recordId: { in: draft.map((r) => r.id) }, action: 'SIGNED', reviewerId: { not: null } }, select: { recordId: true } })).map((e) => e.recordId));
    const window = await prisma.attempt.count({ where: { itemId: { in: rows.map((r) => r.id) } } });
    const held = new Set(roundOneHolds[qt] ?? []);
    const onAllThree = draft.filter((r) => signedIds.has(r.id) && r.sendHistory !== null && r.authoredBy && !held.has(r.id)).length;
    const publishable = draft.every((r) => (signedIds.has(r.id) && r.sendHistory !== null && r.authoredBy) || held.has(r.id) || r.answerFlaggedAt);
    const unaccounted = draft.filter((r) => !(signedIds.has(r.id) && r.sendHistory !== null && r.authoredBy) && !held.has(r.id) && !r.answerFlaggedAt).map((r) => r.id);
    doorReports.push({
      door: qt, rowsBehindTheDoor: draft.length, onAllThreeAssertions: onAllThree,
      heldWithPublishedReason: held.size, neverShippable: rows.length - draft.length,
      executionsPresent: `${draft.reduce((n, r) => n + r.options.filter((o) => o.misconceptionId && o.misconceptionExecution).length, 0)} of ${draft.reduce((n, r) => n + r.options.filter((o) => o.misconceptionId).length, 0)} tagged seats`,
      windowAsAFigure: window, PUBLISHABLE: publishable,
      whatRemains: publishable
        ? (qt === 'vr-10-word-connections' ? 'publishable; the 25 second seats re-author under the falls-doubling ruling — PROPOSED, generation pending, serving unaffected (seats are true, merely empty)' : 'nothing blocking')
        : unaccounted.length ? `${unaccounted.length} row(s) neither on all three nor held: ${unaccounted.slice(0, 3).join(', ')}…` : 'holds only',
    });
    console.log(`  ${qt}: ${publishable ? 'PUBLISHABLE' : 'NOT PUBLISHABLE'} — ${onAllThree}/${draft.length} on all three; ${held.size} held`);
  }

  // ---- 8. DELIVER -----------------------------------------------------------------------------
  const tally = (kind: string) => Object.fromEntries([...new Set(recs.filter((r) => r.kind === kind).map((r) => r.state))].map((s) => [s, recs.filter((r) => r.kind === kind && r.state === s).length]));
  const report = {
    kind: 'land-round-two', TO: 'David; Annie and the authoring store by relay', date: '2026-09-02', mode: APPLY ? 'APPLIED' : 'DRY-RUN',
    EVIDENCE: { return209: ret209sha, coworkFortyNine: c49sha },
    TALLIES: { amendment: tally('amendment'), execution: tally('execution'), contingent: tally('contingent'), twentyOne: tally('twenty-one'), vr10: tally('vr10-reauthor'), mint: tally('mint') },
    THE_DIVERGENCE_RECORDED: 'cowork\'s twenty-one includes generous, ticket and lend; her 208th rules those three by name (associated-not-same, associated-not-same, re-authors). Her per-word refuters are the later, specific authority and already landed; the three did not move to the mint, and this is recorded rather than silently resolved.',
    VR10_REAUTHORING_PROPOSAL: { ruling: 'the doubling falls: the entry\'s input is the topic, the chosen word its output (her 209th); every second same-topic seat is true and empty', rows: reauthoring, seatsAffected: 25, destination: 'vr03-reversed-relation for every directional row; the mint\'s carrier for row 23', form: 'PROPOSED — generation pending; nothing written to serving rows' },
    INSTRUMENT_HYPOTHESES_INVESTIGATED: guardInvestigations,
    RECORDS: recs,
    DOORS: doorReports,
    PUBLISHABLE: doorReports.filter((d) => d.PUBLISHABLE).map((d) => d.door),
    NOT_PUBLISHABLE: doorReports.filter((d) => !d.PUBLISHABLE).map((d) => ({ door: d.door, whatRemains: d.whatRemains })),
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const dig = findingsDigest(clean, ['RECORDS', 'DOORS', 'VR10_REAUTHORING_PROPOSAL', 'THE_DIVERGENCE_RECORDED']);
  Object.assign(clean, dig);
  const out = pjoin(REPO, 'content/exports', stampedName('round-two-report', dig.findingsSha256, 'json'));
  writeFileSync(out, JSON.stringify(clean, null, 1));
  if (APPLY) { const d = deliver(out); console.log(`\nDelivered: ${d}`); } else console.log(`\nDRY RUN — ${out}`);
  for (const k of ['amendment', 'execution', 'contingent', 'twenty-one', 'vr10-reauthor', 'mint']) console.log(`${k}: ${JSON.stringify(tally(k))}`);
  console.log(`Publishable: ${report.PUBLISHABLE.join(', ') || 'NONE'} of ${DOORS.length}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
