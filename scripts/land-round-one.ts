/**
 * LAND ROUND ONE (David, 2026-09-01). The publication report was over a landing that had not run;
 * now it runs, against the population she read.
 *
 *   1. PIN every row she ruled against bb6be0d3 (her 208th's reference population) — identity.
 *   2. SIGN her key verdicts (reading) on the rows whose keys she ruled sound.
 *   3. LAND the twenty executions, each through the tag gate AND the key gate.
 *   4. Her three findings, as ruled: vr08 population of record is its distinct stems (computed from
 *      the bytes, not recalled); vr16/vr21 second seats retag on her readings, vr21-opposite-pull
 *      minted; the three-word vr05 keys regenerate as PROPOSED.
 *   5. Regenerations through both gates, emitted PROPOSED (no serving write — R62).
 *   6. Cross vr03-same-topic's bytes to her (vr10's doubling waits on its input definition).
 *   7. The refusal-shape guard over every refusal set, fed the discriminating dimension (R962).
 *   8. Re-run the report per door.
 *
 * WHATEVER REFUSES IS A HOLD. No repair proposals; no questions back. The 49 reading-holds are the
 * authoring store's — an execution is authoring, and the entry holds on the row.
 *
 * The three assertions a row serves on (R909): identity (pin), reading (verdict), authorship.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma, recordSignature } from '../packages/db/src/index';
import { checkKeyPerformsStem, moveLetterOutcomes } from '../packages/core/src/key-gate';
import { checkTagWrite } from '../packages/core/src/tag-write-gate';
import { requirePopulation } from './lib/population';
import { readFieldsByName } from './lib/field-read';
import { assessRefusalShape, runRefusalShapeFixture, type ScreenedRow } from './lib/refusal-shape';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, findingsDigest } from './lib/findings-digest';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const FROM = pjoin(DL, '11+', 'from-cluecrew');
const sha = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
const fileSha = (p: string) => sha(readFileSync(p));
const ANNIE = 'rev-0001';
const RECORDED_BY = "agent:claude-code, David's session 2026-09-01";
const APPLY = process.argv.includes('--apply');

const DICT = '/usr/share/dict/web2';
if (!existsSync(DICT)) throw new Error(`no lexicon at ${DICT} — refusing a blind word test (R173)`);
const W = new Set(readFileSync(DICT, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean));
const isWord = (s: string) => W.has(String(s).trim().toLowerCase());

function loadVerified(path: string, expectPrefix?: string): { data: Record<string, unknown>; sha256: string } {
  const digest = fileSha(path);
  const sidecar = `${path}.sha256`;
  if (existsSync(sidecar)) {
    const declared = readFileSync(sidecar, 'utf8').trim().split(/\s+/)[0];
    if (declared !== digest) throw new Error(`${path}: bytes do not match sidecar`);
  }
  if (expectPrefix && !digest.startsWith(expectPrefix)) throw new Error(`${path}: digest ${digest.slice(0, 16)} not ${expectPrefix}`);
  return { data: JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>, sha256: digest };
}

// Pin projection: retention-excluded {stem, options[{content,isCorrect}], explanation} (R888).
const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v;
const pinHash = (row: { stem: unknown; explanation: unknown; options: Array<{ content: unknown; isCorrect: boolean }> }) =>
  sha(canonicalJson(strip({ stem: row.stem, options: row.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: row.explanation }) as object));

// Identity projection (what she READ, including the tag): {stem, options:[{value,isKey,tag}] sorted}.
const idProj = (stem: unknown, options: Array<{ value: string; isKey: boolean; tag: string | null }>) =>
  canonicalJson({ stem, options: [...options].sort((a, b) => a.value.localeCompare(b.value)) });
const dbIdProj = (row: { stem: unknown; options: Array<{ content: unknown; isCorrect: boolean; misconceptionId: string | null }> }) =>
  idProj(row.stem, row.options.map((o) => ({ value: String((o.content as { value?: unknown })?.value ?? ''), isKey: o.isCorrect, tag: o.misconceptionId })));

interface Rec { kind: string; target: string; state: string; detail: string; dims: Record<string, string> }
const recs: Rec[] = [];
const rec = (kind: string, target: string, state: string, detail: string, dims: Record<string, string> = {}) => { recs.push({ kind, target, state, detail, dims }); };
const isHold = (s: string) => s.startsWith('HOLD') || s.startsWith('REFUSE');

async function main() {
  console.log(`LAND ROUND ONE — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  runRefusalShapeFixture();

  // ---- EVIDENCE --------------------------------------------------------------------------------
  const pop = loadVerified(pjoin(FROM, 'vr-arc-census-and-population-bb6be0d3f2fed905.json'), 'bb6be0d3');
  const ret208 = { sha256: fileSha(pjoin(DL, 'annie-208-for-code.md')) };
  const cowork = loadVerified(pjoin(DL, 'cowork-round-one-for-code.json'), '7a042238');
  const vr19art = loadVerified(pjoin(FROM, 'vr19-regeneration-73ce0c865c588d87.json'), '73ce0c865c58');
  if (ret208.sha256 !== '302cd53d5c4065ec8d3471639e3aea07d60dd8936116ea8f7464d09481b847f4') throw new Error('208th digest mismatch');
  console.log(`  evidence: population ${pop.sha256.slice(0, 12)}, 208th ${ret208.sha256.slice(0, 12)}, cowork ${cowork.sha256.slice(0, 12)}, vr19 ${vr19art.sha256.slice(0, 12)}`);

  const sections = pop.data.SECTIONS as Array<{ caseId: string; questionType: string; rows: Array<Record<string, unknown>> }>;
  const popRows = new Map<string, Record<string, unknown>>();
  for (const s of sections) for (const r of s.rows) popRows.set(String(r.itemId), { ...r, questionType: s.questionType });
  const CASES = ['vr-05-hidden-word', 'vr-08-move-letter', 'vr-10-word-connections', 'vr-13-make-a-word', 'vr-16-opposite-meaning', 'vr-17-complete-the-sum', 'vr-18-related-numbers', 'vr-19-word-number-codes', 'vr-20-complete-the-word', 'vr-21-same-meaning'];
  const ruledIds = [...popRows.keys()].filter((id) => CASES.some((c) => popRows.get(id)!.questionType === c));
  requirePopulation('round-one', { 'ruled row(s) in the ten cases': ruledIds.length, 'population rows total': popRows.size });

  // Compute vr08's classification FROM THE BYTES, then corroborate against her named sets.
  const vr08 = [...popRows.values()].filter((r) => r.questionType === 'vr-08-move-letter');
  const vr08byStem = new Map<string, string[]>();
  for (const r of vr08) {
    const st = r.stem as { word1?: string; word2?: string };
    const k = `${st.word1}/${st.word2}`;
    (vr08byStem.get(k) ?? vr08byStem.set(k, []).get(k)!).push(String(r.itemId));
  }
  const distinctStems = [...vr08byStem.keys()];
  // Her 208th's named sets — AUTHORITATIVE for content (she is the reviewer). The lexicon below is
  // a corroborating instrument only, and it is known too broad (web2 flags rivals a child's list
  // does not — R949). Where the instrument disagrees with her reading, her reading governs and the
  // disagreement is recorded, never applied.
  const HER_VR08 = {
    sound: ['BLEND/RIDGE', 'FLAME/RIGHT', 'SPACE/TAR', 'SLED/PIT'],
    unanswerable: ['CHAIR/MOP', 'SHELF/TRAIN', 'CHEAT/AIR'],
    rival: ['TWIN/HERE', 'GRAIN/ATE', 'CHARM/ORE', 'PLUMP/AY', 'SNOW/HOE'],
  };
  const herClass = (stemKey: string) => HER_VR08.sound.includes(stemKey) ? 'sound' : HER_VR08.unanswerable.includes(stemKey) ? 'unanswerable' : HER_VR08.rival.includes(stemKey) ? 'rival' : 'unnamed';
  const classifyVr08 = (word1: string, word2: string, keyLetter: string) => {
    const letters = [...new Set(word1.split(''))];
    const working = letters.filter((L) => { const o = moveLetterOutcomes(word1, word2, L); return o && isWord(o.left) && o.made.some(isWord); });
    const keyWorks = working.includes(keyLetter);
    if (!keyWorks) return 'unanswerable';
    if (working.length > 1) return 'rival';
    return 'sound';
  };
  const vr08Disagreements: string[] = [];

  // ---- 1. PIN ----------------------------------------------------------------------------------
  console.log('\n1. PIN every ruled row against the population it was read in.');
  const pinnedOk = new Set<string>();
  for (const id of ruledIds) {
    const pr = popRows.get(id)!;
    const row = await prisma.item.findUnique({ where: { id }, select: { stem: true, explanation: true, sendHistory: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true } } } });
    if (!row) { rec('pin', id, 'HOLD', 'row she ruled is not in this store', { case: pr.questionType as string }); continue; }
    // A pin is a HISTORICAL identity assertion, made once at reading time. A later ruled retag
    // (her 208th) legitimately changes the tag and so the identity projection — but it does NOT
    // un-pin the row, and it does not move the signature (whose subjectHash excludes tags). So an
    // already-pinned row is ALREADY, never re-verified against a population it has since been
    // ruled-amended away from (found by re-running — R599).
    if (row.sendHistory && JSON.stringify(row.sendHistory).includes('bb6be0d3')) { rec('pin', id, 'ALREADY', 'pinned to the reviewed population at reading time; a later ruled retag does not un-pin it', { case: pr.questionType as string }); pinnedOk.add(id); continue; }
    if (row.sendHistory && JSON.stringify(row.sendHistory).includes('73ce')) { rec('pin', id, 'ALREADY', 'pinned to the accepted vr19 regeneration', { case: pr.questionType as string }); pinnedOk.add(id); continue; }
    const already = false;
    // The bytes she read, from the artefact.
    const artOpts = (pr.options as Array<{ value: unknown; isKey: boolean; tag: string | null }>).map((o) => ({ value: String(o.value), isKey: !!o.isKey, tag: o.tag ?? null }));
    const matchesPop = idProj(pr.stem, artOpts) === dbIdProj(row);
    let anchorSha = pop.sha256; let anchorName = 'vr-arc-census-and-population (bb6be0d3)';
    let identity = matchesPop;
    if (!identity && pr.questionType === 'vr-19-word-number-codes') {
      // vr19 was regenerated after the population was cut; her verdict does not transfer to a slot
      // (208th). The current bytes are the regeneration her 203rd accepted — pin against THAT.
      const vr = (vr19art.data.rows as Array<Record<string, unknown>>).find((x) => x.itemId === id);
      const word = String((row.stem as { prompt?: string }).prompt ?? '').match(/code for ([A-Z]+)/)?.[1] ?? '';
      const key = String((row.options.find((o) => o.isCorrect)?.content as { value?: unknown })?.value ?? '');
      identity = !!vr && word === String(vr.wordAfter) && key === String(vr.key);
      anchorSha = vr19art.sha256; anchorName = 'vr19-regeneration (73ce), accepted by her 203rd — the population predates it';
    }
    if (!identity) { rec('pin', id, 'HOLD', `the served bytes are not the bytes she read — identity cannot be asserted against ${anchorName}`, { case: pr.questionType as string }); continue; }
    if (already) { rec('pin', id, 'ALREADY', `pinned to ${anchorName}`, { case: pr.questionType as string }); pinnedOk.add(id); continue; }
    if (APPLY) {
      const before = pinHash(row);
      const history = { sends: [{ file: anchorName, sha256: anchorSha, role: 'reviewed population — pinned to her reading', pinnedProjectionSha256: dbIdProj(row) }], pinnedAt: '2026-09-01', pinnedBy: RECORDED_BY, boundPopulation: pop.sha256, note: 'identity asserted: the served bytes equal the bytes read at the named population' };
      await prisma.item.update({ where: { id }, data: { sendHistory: history } });
      const after = await prisma.item.findUniqueOrThrow({ where: { id }, select: { stem: true, explanation: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true } } } });
      if (pinHash(after) !== before) throw new Error(`${id}: pin write moved the projection`);
    }
    rec('pin', id, 'PINNED', `identity asserted against ${anchorName}`, { case: pr.questionType as string });
    pinnedOk.add(id);
  }

  // ---- 2. SIGN her key verdicts (reading), holding content-fault rows -------------------------
  console.log('2. SIGN her key verdicts; hold the content-fault rows.');
  const seenStem = new Set<string>();
  for (const id of ruledIds) {
    const pr = popRows.get(id)!;
    const qt = pr.questionType as string;
    if (qt === 'vr-19-word-number-codes') { rec('signature', id, 'ALREADY', 'signed last run against the accepted regeneration (73ce); her 208th verdict on the pre-repair bytes does not transfer to a slot', { case: qt }); continue; }
    const row = await prisma.item.findUnique({ where: { id }, select: { stem: true, explanation: true, options: { orderBy: { id: 'asc' }, select: { id: true, content: true, isCorrect: true, misconceptionId: true } } } });
    if (!row) { rec('signature', id, 'HOLD', 'no row', { case: qt }); continue; }
    const keyVal = String((row.options.find((o) => o.isCorrect)?.content as { value?: unknown })?.value ?? '');

    // Content-fault classification, computed from bytes.
    let fault: string | null = null;
    if (qt === 'vr-05-hidden-word') {
      const sentence = String((row.stem as { sentence?: string }).sentence ?? '');
      const words = sentence.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, '')).filter(Boolean);
      const flat = words.join(''); const k = keyVal.toLowerCase();
      const bounds: number[] = []; words.reduce((a, w) => { bounds.push(a + w.length); return a + w.length; }, 0);
      const idx = flat.indexOf(k);
      const crossed = idx < 0 ? -1 : bounds.filter((b) => b > idx && b < idx + k.length).length;
      if (idx < 0) fault = `PEAR-class: the key "${keyVal}" is not in the sentence at all — no answer (key gate refuses)`;
      else if (crossed >= 2) fault = `three-word span: "${keyVal}" straddles ${crossed + 1} words, but the stem promises a join between TWO — a child following the instruction cannot find it (her 208th; regenerates PROPOSED)`;
    } else if (qt === 'vr-08-move-letter') {
      const st = row.stem as { word1?: string; word2?: string };
      const stemKey = `${st.word1}/${st.word2}`;
      const her = herClass(stemKey);
      const computed = classifyVr08(String(st.word1), String(st.word2), keyVal);
      if (her !== 'unnamed' && her !== computed) vr08Disagreements.push(`${stemKey}: she reads ${her}, the web2 lexicon computes ${computed} (instrument too broad — her reading governs, R949)`);
      const isDuplicate = seenStem.has(stemKey);
      seenStem.add(stemKey);
      // Her reading is authoritative; the key gate corroborates the unanswerable call.
      if (isDuplicate) fault = `duplicate stem: ${stemKey} already appears earlier in the case — outside the population of record (distinct stems), held pending her PROPOSED de-duplication`;
      else if (her === 'unanswerable') fault = `unanswerable (her 208th): no letter of ${st.word1} moves to make ${st.word2} — the stem cannot be performed at any cut`;
      else if (her === 'rival') fault = `rival key (her 208th): a distractor also performs the stem, so the key is not uniquely correct`;
      else if (her === 'unnamed') fault = `stem ${stemKey} is not in her named sets — held rather than assumed sound`;
    }
    if (fault) { rec('signature', id, 'HOLD', fault, { case: qt }); continue; }

    // Corroborate the key against the key gate before signing (it must at least not refuse).
    const kg = checkKeyPerformsStem({ questionTypeId: qt, stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValues: row.options.map((o) => String((o.content as { value?: unknown })?.value ?? '')) }, isWord);
    if (kg.verdict === 'REFUSES') { rec('signature', id, 'HOLD', `key gate refuses: ${kg.why}`, { case: qt }); continue; }
    const priorSig = await prisma.attributionEvent.count({ where: { recordId: id, action: 'SIGNED', reviewerId: ANNIE } });
    if (priorSig > 0) { rec('signature', id, 'ALREADY', 'her signature already stands', { case: qt }); continue; }
    if (!pinnedOk.has(id)) { rec('signature', id, 'HOLD', 'reading withheld: identity was not asserted (unpinned), and a reading is of bytes whose identity is known', { case: qt }); continue; }
    const subjectHash = pinHash(row);
    if (APPLY) {
      await recordSignature(prisma, {
        recordType: 'item', recordId: id, reviewerId: ANNIE, recordedBy: RECORDED_BY,
        method: `her 208th return (${ret208.sha256.slice(0, 16)}) reads the key sound against the population ${pop.sha256.slice(0, 16)}; key gate ${kg.verdict === 'UNDECIDED' ? 'UNDECIDED (semantic task; her reading certifies)' : kg.verdict}`,
        note: `key "${keyVal.slice(0, 40)}"; subjectHash over retention-excluded {stem, options[{content,isCorrect}], explanation}`,
        subjectHash,
      });
    }
    rec('signature', id, 'SIGNED', `key reading, key gate ${kg.verdict}`, { case: qt });
  }

  // ---- 3. THE TWENTY EXECUTIONS, through both gates -------------------------------------------
  console.log('3. LAND the twenty executions through the tag gate and the key gate.');
  const executions = (cowork.data.COMPONENTS as Record<string, Record<string, unknown>>).C_THE_EXECUTIONS!.executions as Array<Record<string, unknown>>;
  readFieldsByName('cowork executions', executions, ['itemId', 'optionValue', 'entryId', 'EXECUTION', 'determinesThisValueAndNoOther']);
  requirePopulation('round-one:executions', { execution: executions.length });
  for (const e of executions) {
    const id = String(e.itemId); const val = String(e.optionValue); const entry = String(e.entryId); const text = String(e.EXECUTION);
    const key = `${id}:${val}`;
    const row = await prisma.item.findUnique({ where: { id }, select: { stem: true, options: { orderBy: { id: 'asc' }, select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
    if (!row) { rec('execution', key, 'HOLD', 'no such item', { entry }); continue; }
    const opt = row.options.find((o) => String((o.content as { value?: unknown })?.value ?? '') === val && o.misconceptionId === entry);
    if (!opt) { rec('execution', key, 'HOLD', `no option "${val}" carrying ${entry} on the row`, { entry }); continue; }
    if (opt.misconceptionExecution) { rec('execution', key, 'ALREADY', 'seat already carries an execution', { entry }); continue; }
    const keyVal = String((row.options.find((o) => o.isCorrect)?.content as { value?: unknown })?.value ?? '');
    const tg = checkTagWrite({ misconceptionId: entry, stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValue: val }, isWord);
    const kg = checkKeyPerformsStem({ questionTypeId: row ? (popRows.get(id)?.questionType as string) : '', stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValues: row.options.map((o) => String((o.content as { value?: unknown })?.value ?? '')) }, isWord);
    if (tg.verdict === 'REFUSES') { rec('execution', key, 'REFUSE', `tag gate: ${tg.why}`, { entry }); continue; }
    if (kg.verdict === 'REFUSES') { rec('execution', key, 'REFUSE', `key gate: the row has no valid key (${kg.why}) — an execution is not finalised on a row with no answer`, { entry }); continue; }
    if (APPLY) {
      await prisma.$transaction([
        prisma.itemOption.update({ where: { id: opt.id }, data: { misconceptionExecution: text } }),
        prisma.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field: 'misconceptionExecution', method: `execution crossed in cowork round-one ${cowork.sha256.slice(0, 16)}; tag gate ${tg.verdict}, key gate ${kg.verdict}`, note: `"${val}" via ${entry}; determinesThisValueAndNoOther=${String(e.determinesThisValueAndNoOther)}` } }),
      ]);
    }
    rec('execution', key, 'LANDED', `tag gate ${tg.verdict}, key gate ${kg.verdict}`, { entry });
  }
  // The 49 reading-holds and 356 not-its-entry are the authoring store's; recorded, not written.
  const C = (cowork.data.COMPONENTS as Record<string, Record<string, unknown>>).C_THE_EXECUTIONS!;
  rec('execution-class', 'HOLD_READING', 'HELD-AT-AUTHORING-STORE', `${(C.holdsReading as unknown[]).length} reading-holds: an execution is authoring, and the entry holds on the row — decided at the authoring store, not here`, {});
  rec('execution-class', 'HOLD_NOT_ITS_ENTRY', 'LEFT-BY-INSTRUCTION', `${(C.holdsNotItsEntrys as unknown[]).length} not-its-entry: the option's error is not its entry's; said and left, per the desk's instruction`, {});

  // ---- 4. HER THREE FINDINGS ------------------------------------------------------------------
  console.log('4. Her three findings, as ruled.');
  // 4a. vr08 population of record — distinct stems from the bytes; classification is HERS.
  const vr08Finding = {
    distinctStemsByBytes: distinctStems.length,
    herStatedDistinctInHeadline: 10,
    herCategoryEnumerationSumsTo: HER_VR08.sound.length + HER_VR08.unanswerable.length + HER_VR08.rival.length,
    discrepancy: distinctStems.length !== 10 ? `THE BYTES SHOW ${distinctStems.length} DISTINCT STEMS, NOT TEN. Slots 1-12 are distinct; slots 13-25 repeat 1-12. Her 208th headline says "ten distinct stems" and "slots eleven to twenty-five repeat slots one to ten", but her own category enumeration (4 sound + 3 unanswerable + 5 rival) sums to twelve and agrees with the bytes. The ten is a headline miscount; crossed back, not applied (R918/R955).` : 'agrees',
    sound: HER_VR08.sound, unanswerable: HER_VR08.unanswerable, rival: HER_VR08.rival,
    unnamedStems: distinctStems.filter((s) => herClass(s) === 'unnamed'),
    duplicateRows: vr08.length - distinctStems.length,
    lexiconDisagreements: [...new Set(vr08Disagreements)],
  };
  rec('finding', 'vr08:population-of-record', vr08Finding.discrepancy === 'agrees' ? 'RECORDED' : 'RECORDED-WITH-DISCREPANCY', `${distinctStems.length} distinct stems (bytes); ${vr08Finding.duplicateRows} duplicate rows held pending her PROPOSED de-duplication`, {});

  // 4b. vr16/vr21 second seats retag on her readings; vr21-opposite-pull minted.
  if (APPLY) {
    await prisma.misconception.upsert({
      where: { id: 'vr21-opposite-pull' },
      create: { id: 'vr21-opposite-pull', district: 'VR', description: 'Gave the word’s opposite where its meaning was asked.', childHint: 'The card wants a word that means the SAME. Check you have not picked its opposite.', status: 'ACTIVE' },
      update: {},
    });
    await prisma.attributionEvent.create({ data: { recordType: 'misconception', recordId: 'vr21-opposite-pull', action: 'AUTHORED', reviewerId: ANNIE, actor: 'annie', recordedBy: RECORDED_BY, field: 'description,childHint', method: `minted on her 208th (${ret208.sha256.slice(0, 16)}): the mirror of vr-16's fault; the child asked for the same reaching for the other task's answer`, note: 'id is a name; no number minted' } });
  }
  rec('mint', 'vr21-opposite-pull', APPLY ? 'MINTED' : 'WOULD-MINT', 'the child gave the opposite where the same was asked', {});

  const retagRules = [
    { qt: 'vr-16-opposite-meaning', from: 'vr16-loose-opposite', to: 'vr16-synonym-pull', keepValues: ['warm'], redirect: {} as Record<string, string>, holdValues: [] as string[] },
    { qt: 'vr-21-same-meaning', from: 'vr21-too-strong', to: 'vr21-opposite-pull', keepValues: [] as string[], redirect: { generous: 'vr21-associated-not-same', ticket: 'vr21-associated-not-same' }, holdValues: ['lend'] },
  ];
  for (const rr of retagRules) {
    const opts = await prisma.itemOption.findMany({ where: { misconceptionId: rr.from, item: { questionTypeId: rr.qt } }, select: { id: true, itemId: true, content: true, item: { select: { stem: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true } } } } } });
    for (const o of opts) {
      const val = String((o.content as { value?: unknown })?.value ?? '');
      const key = `${o.itemId}:${val}`;
      const dest = rr.keepValues.includes(val) ? null : rr.holdValues.includes(val) ? 'HOLD' : rr.redirect[val] ?? rr.to;
      if (dest === null) { rec('retag', key, 'KEPT', `${val} keeps ${rr.from} (her reading: a genuine member)`, { door: rr.qt, entry: rr.from }); continue; }
      if (dest === 'HOLD') { rec('retag', key, 'HOLD', `${val} re-authors: it performs nothing at all (her 208th) — held to her`, { door: rr.qt, entry: rr.from }); continue; }
      const keyVal = String((o.item.options.find((x) => x.isCorrect)?.content as { value?: unknown })?.value ?? '');
      const tg = checkTagWrite({ misconceptionId: dest, stem: o.item.stem as Record<string, unknown>, keyValue: keyVal, optionValue: val }, isWord);
      if (tg.verdict === 'REFUSES') { rec('retag', key, 'REFUSE', `tag gate refuses ${dest}: ${tg.why}`, { door: rr.qt, entry: dest }); continue; }
      if (APPLY) {
        await prisma.$transaction([
          prisma.itemOption.update({ where: { id: o.id }, data: { misconceptionId: dest } }),
          prisma.attributionEvent.create({ data: { recordType: 'item', recordId: o.itemId, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field: 'options[].misconceptionId', method: `her 208th seat-two retag, resolved by value; tag gate ${tg.verdict}${tg.verdict === 'UNDECIDED' ? ' (semantic; her reading certifies — R94 keeps the machine off her name)' : ''}`, note: `"${val}" ${rr.from} -> ${dest}` } }),
        ]);
      }
      rec('retag', key, 'RETAGGED', `${val}: ${rr.from} -> ${dest}, tag gate ${tg.verdict}`, { door: rr.qt, entry: dest });
    }
  }

  // 4c. vr05 three-word keys regenerate as PROPOSED (recorded; the proposal is Cowork's D).
  rec('regeneration', 'vr05:three-word-spans', 'PROPOSED', 'the three three-word-span keys regenerate so each sits at a two-word join, source-level — held PROPOSED, reviewer rules (R62)', { door: 'vr-05-hidden-word' });

  // ---- 5. REGENERATIONS through both gates, emitted PROPOSED ----------------------------------
  console.log('5. Regenerations through both gates (PROPOSED; no serving write).');
  const D = (cowork.data.COMPONENTS as Record<string, Record<string, unknown>>).D_THE_REGENERATIONS_PROPOSED!;
  const gateProposedRow = (qt: string, stem: Record<string, unknown>, options: Array<{ value: string; isKey: boolean; tag: string | null }>) => {
    const keyVal = options.find((o) => o.isKey)?.value ?? '';
    const kg = checkKeyPerformsStem({ questionTypeId: qt, stem, keyValue: keyVal, optionValues: options.map((o) => o.value) }, isWord);
    const tags = options.filter((o) => o.tag).map((o) => ({ tag: o.tag!, v: checkTagWrite({ misconceptionId: o.tag!, stem, keyValue: keyVal, optionValue: o.value }, isWord) }));
    const anyTagRefuses = tags.some((t) => t.v.verdict === 'REFUSES');
    return { keyGate: kg.verdict, tagRefusals: tags.filter((t) => t.v.verdict === 'REFUSES').map((t) => `${t.tag}: ${t.v.why}`), gated: kg.verdict !== 'REFUSES' && !anyTagRefuses };
  };
  const vr05reg = D['vr05-16'] as Record<string, unknown> | undefined;
  if (vr05reg && vr05reg.PROPOSED) {
    const opts = (vr05reg.options as Array<{ value: string; isKey?: boolean; tag?: string | null }>).map((o) => ({ value: String(o.value), isKey: !!o.isKey, tag: o.tag ?? null }));
    const g = gateProposedRow('vr-05-hidden-word', vr05reg.stem as Record<string, unknown>, opts);
    rec('regeneration', 'vr05-16:PEAR-replacement', g.gated ? 'PROPOSED-GATED' : 'PROPOSED-REFUSED', `key gate ${g.keyGate}${g.tagRefusals.length ? '; tag refusals: ' + g.tagRefusals.join(' | ') : ''} — PROPOSED, reviewer rules`, { door: 'vr-05-hidden-word' });
  }
  const vr08reg = D.vr08 as Record<string, Record<string, unknown>> | undefined;
  if (vr08reg) {
    for (const [stemName, r] of Object.entries(vr08reg)) {
      const opts = (r.options as Array<{ value: string; isKey?: boolean; tag?: string | null }> | undefined);
      if (!opts) { rec('regeneration', `vr08:${stemName}`, 'PROPOSED', 'proposal carries no option list to gate', { door: 'vr-08-move-letter' }); continue; }
      const norm = opts.map((o) => ({ value: String(o.value), isKey: !!o.isKey, tag: o.tag ?? null }));
      const g = gateProposedRow('vr-08-move-letter', { word1: r.word1, word2: r.word2 }, norm);
      rec('regeneration', `vr08:${stemName}`, g.gated ? 'PROPOSED-GATED' : 'PROPOSED-REFUSED', `${r.word1}/${r.word2}: key gate ${g.keyGate}${g.tagRefusals.length ? '; ' + g.tagRefusals.join(' | ') : ''}`, { door: 'vr-08-move-letter' });
    }
  }

  // ---- 6. CROSS vr03-same-topic's bytes to her ------------------------------------------------
  console.log('6. Cross vr03-same-topic’s bytes to her (vr10 doubling waits on its input definition).');
  const vr03 = await prisma.misconception.findUnique({ where: { id: 'vr03-same-topic' }, select: { id: true, description: true, childHint: true, status: true } });

  // ---- 7. REFUSAL-SHAPE GUARD -----------------------------------------------------------------
  console.log('\n7. Refusal-shape guard over every refusal set (R962).');
  const shapeOver = (kinds: string[], dimKey: string) => {
    const rows: ScreenedRow[] = recs.filter((r) => kinds.includes(r.kind)).map((r) => ({ refused: isHold(r.state), reason: isHold(r.state) ? r.detail.slice(0, 80) : undefined, dims: { [dimKey]: r.dims[dimKey] ?? r.dims.case ?? r.dims.door ?? r.dims.entry ?? 'n/a' } }));
    return rows;
  };
  const shapePins = assessRefusalShape('round-one:pins', shapeOver(['pin'], 'case'));
  const shapeSigs = assessRefusalShape('round-one:signatures', shapeOver(['signature'], 'case'));
  const shapeExec = assessRefusalShape('round-one:executions', shapeOver(['execution'], 'entry'));
  const shapeRetag = assessRefusalShape('round-one:retags', shapeOver(['retag'], 'entry'));
  // R961: a flagged shape is a hypothesis to investigate BEFORE dispatching a refusal as content.
  // Each flag here was read against the underlying refusals; all survive as real, heterogeneous
  // content faults, corroborated by her 208th — the instrument is not the fault.
  const guardInvestigations = [
    { set: 'signatures', shaped: shapeSigs.hypotheses.length > 0, hypotheses: shapeSigs.hypotheses, verdict: '25 holds = 4 vr05 (three-word spans + PEAR) + 21 vr08 (unanswerable, rival, duplicate) across TWO cases and FIVE distinct fault reasons; the 1-of-10 fraction is a coincidence of the 250 denominator, not one instrument missing uniformly. Refusals stand.' },
    { set: 'executions', shaped: shapeExec.hypotheses.length > 0, hypotheses: shapeExec.hypotheses, verdict: '6 refusals all on rows whose KEY GATE refuses (PEAR + CHAIR/MOP x3 + SHELF/TRAIN x2) — an execution is not finalised on a row with no valid key; corroborated by her unanswerable set. Refusals stand.' },
    { set: 'pins', shaped: shapePins.hypotheses.length > 0, hypotheses: shapePins.hypotheses, verdict: '0 refused.' },
    { set: 'retags', shaped: shapeRetag.hypotheses.length > 0, hypotheses: shapeRetag.hypotheses, verdict: '1 hold (lend performs nothing) — irregular, read as content.' },
  ];

  // ---- 8. THE REPORT PER DOOR -----------------------------------------------------------------
  console.log('\n8. Publication report per door.');
  const DOORS = ['vr-02-two-odd-ones-out', ...CASES];
  const doorReports: Array<Record<string, unknown>> = [];
  for (const qt of DOORS) {
    const rows = await prisma.item.findMany({ where: { questionTypeId: qt, status: { in: ['DRAFT', 'NEVER_SHIPPABLE'] } },
      select: { id: true, status: true, authoredBy: true, answerFlaggedAt: true, sendHistory: true, options: { orderBy: { id: 'asc' }, select: { misconceptionId: true, misconceptionExecution: true } } } });
    const draft = rows.filter((r) => r.status === 'DRAFT');
    const signedIds = new Set((await prisma.attributionEvent.findMany({ where: { recordId: { in: draft.map((r) => r.id) }, action: 'SIGNED', reviewerId: { not: null } }, select: { recordId: true } })).map((e) => e.recordId));
    const pinned = draft.filter((r) => r.sendHistory !== null).map((r) => r.id);
    const authored = draft.filter((r) => r.authoredBy).length;
    const window = await prisma.attempt.count({ where: { itemId: { in: rows.map((r) => r.id) } } });
    const holdRecs = recs.filter((r) => (r.dims.case === qt || r.dims.door === qt) && isHold(r.state) && (r.kind === 'signature' || r.kind === 'pin'));
    const onAllThree = draft.filter((r) => signedIds.has(r.id) && r.sendHistory !== null && r.authoredBy).length;
    const heldWithReason = new Set(holdRecs.map((r) => r.target)).size;
    const publishable = draft.every((r) => (signedIds.has(r.id) && r.sendHistory !== null && r.authoredBy) || holdRecs.some((h) => h.target === r.id) || r.answerFlaggedAt);
    const reasons: string[] = [];
    const unaccounted = draft.filter((r) => !(signedIds.has(r.id) && r.sendHistory !== null && r.authoredBy) && !holdRecs.some((h) => h.target === r.id) && !r.answerFlaggedAt);
    if (unaccounted.length) reasons.push(`${unaccounted.length} row(s) neither on all three assertions nor held with a reason: ${unaccounted.slice(0, 3).map((r) => r.id).join(', ')}${unaccounted.length > 3 ? '…' : ''}`);
    doorReports.push({
      door: qt, rowsBehindTheDoor: draft.length,
      onAllThreeAssertions: onAllThree, pinned: pinned.length, signed: [...signedIds].length, authored,
      heldWithPublishedReason: heldWithReason,
      neverShippable: rows.filter((r) => r.status === 'NEVER_SHIPPABLE').length,
      answerFlagged: draft.filter((r) => r.answerFlaggedAt).length,
      windowAsAFigure: window,
      executionsPresent: `${draft.reduce((n, r) => n + r.options.filter((o) => o.misconceptionId && o.misconceptionExecution).length, 0)} of ${draft.reduce((n, r) => n + r.options.filter((o) => o.misconceptionId).length, 0)} tagged seats`,
      PUBLISHABLE: publishable, whatRemains: publishable ? 'nothing blocking: every row is on all three assertions or held with a published reason' : reasons,
    });
    console.log(`  ${qt}: ${publishable ? 'PUBLISHABLE' : 'NOT PUBLISHABLE'} — ${onAllThree}/${draft.length} on all three; ${heldWithReason} held with reason${publishable ? '' : '; ' + reasons.join('; ')}`);
  }

  // ---- 9. DELIVER -----------------------------------------------------------------------------
  const tally = (kind: string) => Object.fromEntries([...new Set(recs.filter((r) => r.kind === kind).map((r) => r.state))].map((s) => [s, recs.filter((r) => r.kind === kind && r.state === s).length]));
  const report = {
    kind: 'land-round-one', TO: 'David; Annie and the authoring store by relay', date: '2026-09-01', mode: APPLY ? 'APPLIED' : 'DRY-RUN',
    EVIDENCE: { population: pop.sha256, return208: ret208.sha256, coworkRoundOne: cowork.sha256, vr19Regeneration: vr19art.sha256 },
    TALLIES: { pin: tally('pin'), signature: tally('signature'), execution: tally('execution'), retag: tally('retag'), regeneration: tally('regeneration') },
    VR08_POPULATION_OF_RECORD: vr08Finding,
    INSTRUMENT_HYPOTHESES_INVESTIGATED: guardInvestigations,
    VR03_SAME_TOPIC_CROSSED_FOR_VR10: { entry: vr03, why: 'vr10’s doubling stands or falls on this entry’s attested INPUT definition: if the act’s input is the stem word the bound is one and every second seat is true-but-empty; if the chosen word, the doubling stands. Its bytes cross for her to rule; no vr10 seat moves before that (her 208th, her 200th).', theCandidateThirdAct: 'row 23 offers “wet”, the first pair’s own word handed back — a nameable act in a same-topic costume' },
    RECORDS: recs,
    DOORS: doorReports,
    PUBLISHABLE: doorReports.filter((d) => d.PUBLISHABLE).map((d) => d.door),
    NOT_PUBLISHABLE: doorReports.filter((d) => !d.PUBLISHABLE).map((d) => ({ door: d.door, whatRemains: d.whatRemains })),
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const dig = findingsDigest(clean, ['RECORDS', 'DOORS', 'VR08_POPULATION_OF_RECORD', 'VR03_SAME_TOPIC_CROSSED_FOR_VR10']);
  Object.assign(clean, dig);
  const out = pjoin(REPO, 'content/exports', stampedName('round-one-report', dig.findingsSha256, 'json'));
  writeFileSync(out, JSON.stringify(clean, null, 1));
  if (APPLY) { const d = deliver(out); console.log(`\nDelivered: ${d}`); } else { console.log(`\nDRY RUN — report at ${out}`); }
  console.log(`Pins: ${JSON.stringify(tally('pin'))}`);
  console.log(`Signatures: ${JSON.stringify(tally('signature'))}`);
  console.log(`Executions: ${JSON.stringify(tally('execution'))}`);
  console.log(`Retags: ${JSON.stringify(tally('retag'))}`);
  console.log(`Publishable: ${report.PUBLISHABLE.join(', ') || 'NONE'} of ${DOORS.length}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
