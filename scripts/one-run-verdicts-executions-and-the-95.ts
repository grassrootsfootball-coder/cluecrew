/**
 * ONE RUN (David, 2026-09-01): land her verdicts as signatures against pinned bytes; land the
 * executions and regenerations through the tag gate and the key gate; apply the 95; run the
 * refusal-shape guard over every refusal set the run produces; then the publication report per
 * door over the eleven VR cases.
 *
 * NO REPAIR PROPOSALS, NO QUESTIONS BACK. WHATEVER REFUSES IS A HOLD — recorded with its reason,
 * never repaired here.
 *
 * The three assertions a row serves on (R909): a PIN asserts IDENTITY, a VERDICT asserts READING,
 * the AUTHOR standing behind the bytes is the third. A door is publishable when every row behind
 * it is on all three or held with a published reason.
 *
 * Sources, each digest-verified before a byte is read:
 *  - THEAMENDMENTCENSUS… (9769460da2ae) — the 95, with per-amendment claimedIn digests.
 *  - THECHAINVERIFIED… (a132fff923be) — the MC04-GEOM-05 chain rule: ordinal order only.
 *  - fifteen-ruled-by-derivation (1cc052c0c15f4bb3) — her verdicts on the fifteen executions,
 *    closed by her 207th across all four outcomes.
 *  - fifteen-executions-for-derivation-for-code — both texts whole, with their digests.
 *  - vr19-regeneration (73ce0c865c588d87) — accepted by her 203rd at its own artefact digest.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma, recordSignature } from '../packages/db/src/index';
import { checkChildFacingText } from '../packages/core/src/index';
import { checkTagWrite, TAG_PREDICATES } from '../packages/core/src/tag-write-gate';
import { checkKeyPerformsStem } from '../packages/core/src/key-gate';
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

const DICT = '/usr/share/dict/web2';
if (!existsSync(DICT)) throw new Error(`no lexicon at ${DICT} — refusing a blind word test (R173)`);
const W = new Set(readFileSync(DICT, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean));
const isWord = (s: string) => W.has(String(s).trim().toLowerCase());

/** Load a JSON artefact, asserting its bytes against an expected digest prefix or sidecar. */
function loadVerified(path: string, expectPrefix?: string): { data: Record<string, unknown>; sha256: string } {
  const digest = fileSha(path);
  const sidecar = `${path}.sha256`;
  if (existsSync(sidecar)) {
    const declared = readFileSync(sidecar, 'utf8').trim().split(/\s+/)[0]!;
    if (declared !== digest) throw new Error(`${path}: bytes do not match sidecar (${declared.slice(0, 16)} vs ${digest.slice(0, 16)})`);
  }
  if (expectPrefix && !digest.startsWith(expectPrefix)) {
    throw new Error(`${path}: digest ${digest.slice(0, 16)} does not carry expected prefix ${expectPrefix}`);
  }
  return { data: JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>, sha256: digest };
}

/** Anchored leaf-string replacement in a JSON value. R87: counts, and the caller asserts. */
function replaceLeaf(v: unknown, from: string, to: string): { out: unknown; count: number } {
  if (typeof v === 'string') return v === from ? { out: to, count: 1 } : { out: v, count: 0 };
  if (Array.isArray(v)) {
    let n = 0;
    const out = v.map((x) => { const r = replaceLeaf(x, from, to); n += r.count; return r.out; });
    return { out, count: n };
  }
  if (v && typeof v === 'object') {
    let n = 0;
    const out = Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => {
      const r = replaceLeaf(x, from, to); n += r.count; return [k, r.out];
    }));
    return { out, count: n };
  }
  return { out: v, count: 0 };
}
function containsLeaf(v: unknown, s: string): boolean { return replaceLeaf(v, s, s).count > 0; }

/** Retention-included pin projection (R888: the projection maths pins were taken under). */
const project = (stem: unknown, explanation: unknown, options: Array<{ content: unknown; isCorrect: boolean }>) =>
  ({ stem, options: options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation });
const projectionHash = (s: unknown, e: unknown, o: Array<{ content: unknown; isCorrect: boolean }>) =>
  sha(canonicalJson(JSON.parse(JSON.stringify(project(s, e, o)))));

interface Landing { act: string; target: string; state: string; detail: string }
interface Hold { of: string; target: string; reason: string; dims: Record<string, string> }
const landings: Landing[] = [];
const holds: Hold[] = [];
const land = (act: string, target: string, state: string, detail: string) => { landings.push({ act, target, state, detail }); };
const hold = (of: string, target: string, reason: string, dims: Record<string, string>) => { holds.push({ of, target, reason, dims }); };

async function main() {
  console.log('ONE RUN — verdicts, executions, the 95, the guard, the report.\n');
  runRefusalShapeFixture();

  // ---- PHASE 1: EVIDENCE ----------------------------------------------------------------------
  const census = loadVerified(pjoin(DL, 'THEAMENDMENTCENSUSANDTHESEATLETTERANSWERED9769460da2ae.json'), '9769460da2ae');
  const chain = loadVerified(pjoin(DL, 'THECHAINVERIFIEDANDTHEUNITSTATEDa132fff923be.json'), 'a132fff923be');
  const ruled = loadVerified(pjoin(FROM, 'fifteen-ruled-by-derivation-1cc052c0c15f4bb3.json'), '1cc052c0c15f4bb3');
  const fifteenSrc = loadVerified(pjoin(DL, 'fifteen-executions-for-derivation-for-code.json'));
  const vr19art = loadVerified(pjoin(FROM, 'vr19-regeneration-73ce0c865c588d87.json'), '73ce0c865c588d87');
  console.log(`  evidence verified: census ${census.sha256.slice(0, 12)}, chain ${chain.sha256.slice(0, 12)}, ` +
    `fifteen-ruled ${ruled.sha256.slice(0, 12)}, fifteen-source ${fifteenSrc.sha256.slice(0, 12)}, vr19 ${vr19art.sha256.slice(0, 12)}`);

  // Her returns, mapped by their own digests — the amendments anchor to these, not to filenames.
  const returnsByDigest = new Map<string, string>();
  for (const f of readdirSync(DL)) {
    if (/^annie-.*\.md$/.test(f)) returnsByDigest.set(fileSha(pjoin(DL, f)), f);
  }
  console.log(`  ${returnsByDigest.size} distinct return files hashed on the desk.\n`);

  // ---- PHASE 2: HER VERDICTS AS SIGNATURES ----------------------------------------------------
  console.log('PHASE 2 — her verdicts land as signatures against pinned bytes.');

  // 2a. vr19: her 203rd accepts the regeneration at its own artefact digest. Per row: gates first,
  //     byte-consistency with the artefact's proposal, then the signature.
  const proposals = vr19art.data.rows as Array<Record<string, unknown>>;
  readFieldsByName('vr19 regeneration rows', proposals, ['itemId', 'wordAfter', 'key', 'letterOrderCarrier', 'sharedLetterCarrier']);
  requirePopulation('one-run:vr19-verdicts', { 'vr19 regeneration row(s)': proposals.length });
  for (const p of proposals) {
    const itemId = String(p.itemId);
    const row = await prisma.item.findUnique({ where: { id: itemId }, select: { stem: true, explanation: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true } } } });
    if (!row) { hold('vr19-signature', itemId, 'proposal names an item this store does not hold', { door: 'vr-19', kind: 'verdict' }); continue; }
    const already = await prisma.attributionEvent.count({ where: { recordId: itemId, action: 'SIGNED', reviewerId: ANNIE } });
    if (already > 0) { land('verdict-signature', itemId, 'ALREADY', 'a SIGNED event by her already stands'); continue; }
    const word = String((row.stem as { prompt?: string }).prompt ?? '').match(/code for ([A-Z]+)/)?.[1] ?? '';
    const vals = (tag: string | null) => row.options.filter((o) => o.misconceptionId === tag).map((o) => String((o.content as { value?: unknown })?.value ?? ''));
    const dbKey = String((row.options.find((o) => o.isCorrect)?.content as { value?: unknown })?.value ?? '');
    const mismatches: string[] = [];
    if (word !== String(p.wordAfter)) mismatches.push(`coded word "${word}" != proposal "${p.wordAfter}"`);
    if (dbKey !== String(p.key)) mismatches.push(`key "${dbKey}" != proposal "${p.key}"`);
    if (!vals('vr19-letter-order').includes(String(p.letterOrderCarrier))) mismatches.push(`letter-order seat != proposal "${p.letterOrderCarrier}"`);
    if (!vals('vr19-shared-letter-miss').includes(String(p.sharedLetterCarrier))) mismatches.push(`shared-letter seat != proposal "${p.sharedLetterCarrier}"`);
    if (mismatches.length) {
      hold('vr19-signature', itemId, `row is not byte-consistent with the artefact her 203rd accepted: ${mismatches.join('; ')}`, { door: 'vr-19', kind: 'verdict' });
      continue;
    }

    const kg = checkKeyPerformsStem({ questionTypeId: 'vr-19-word-number-codes', stem: row.stem as Record<string, unknown>, keyValue: dbKey, optionValues: row.options.map((o) => String((o.content as { value?: unknown })?.value ?? '')) }, isWord);
    if (kg.verdict === 'REFUSES') { hold('vr19-signature', itemId, `key gate refuses: ${kg.why}`, { door: 'vr-19', kind: 'verdict' }); continue; }
    const tagRefusals: string[] = [];
    for (const o of row.options) {
      if (!o.misconceptionId || !(o.misconceptionId in TAG_PREDICATES)) continue;
      const tv = checkTagWrite({ misconceptionId: o.misconceptionId, stem: row.stem as Record<string, unknown>, keyValue: dbKey, optionValue: String((o.content as { value?: unknown })?.value ?? '') }, isWord);
      if (tv.verdict === 'REFUSES') tagRefusals.push(`${o.misconceptionId}: ${tv.why}`);
    }
    if (tagRefusals.length) { hold('vr19-signature', itemId, `tag gate refuses: ${tagRefusals.join(' | ')}`, { door: 'vr-19', kind: 'verdict' }); continue; }
    const subjectHash = projectionHash(row.stem, row.explanation, row.options);
    await recordSignature(prisma, {
      recordType: 'item', recordId: itemId, reviewerId: ANNIE, recordedBy: RECORDED_BY,
      method: `her 203rd return accepts the vr19 regeneration at its artefact digest ${vr19art.sha256.slice(0, 16)}; ` +
        'this row asserted byte-consistent with that artefact and both gates run clean; ' +
        'subjectHash = sha256 over canonical {stem, options[{content,isCorrect}], explanation}, retention INCLUDED',
      note: `key gate ${kg.verdict}; ${row.options.filter((o) => o.misconceptionId).length} tagged seat(s), none refusing`,
      subjectHash,
    });
    land('verdict-signature', itemId, 'SIGNED', `her 203rd acceptance, subjectHash ${subjectHash.slice(0, 12)}`);
  }

  // 2b. The fifteen: her verdicts per seat, closed by her 207th. The winning text stands or lands;
  //     the signature records the verdict against the texts' own digests.
  const ruledRows = ruled.data.rows as Array<Record<string, unknown>>;
  const srcRows = fifteenSrc.data.rows as Array<Record<string, unknown>>;
  readFieldsByName('fifteen ruled rows', ruledRows, ['itemId', 'optionValue', 'VERDICT']);
  readFieldsByName('fifteen source rows', srcRows, ['itemId', 'THE_TEXT_IN_THESE_ROWS', 'THE_TEXT_IN_THE_CROSSED_ARTEFACT', 'itsSha256', 'itsSha256Crossed']);
  requirePopulation('one-run:fifteen-verdicts', { 'ruled seat(s)': ruledRows.length, 'source seat(s)': srcRows.length });
  const srcBySeat = new Map(srcRows.map((s) => [`${s.itemId} ${String(s.optionValue)}`, s]));
  for (const r of ruledRows) {
    const itemId = String(r.itemId); const optionValue = String(r.optionValue); const verdict = String(r.VERDICT);
    const seat = `${itemId}:${optionValue.slice(0, 24)}`;
    const src = srcBySeat.get(`${itemId} ${optionValue}`);
    if (!src) { hold('fifteen', seat, 'ruled seat has no row in the source crossing — the two artefacts disagree on the population', { entry: String(r.seatTag ?? ''), kind: 'fifteen' }); continue; }
    if (verdict.startsWith('NEITHER')) {
      hold('fifteen', seat, 'ruled to re-derive fresh from entry and key; no fresh text has been authored anywhere on this desk — an English execution is authored, not computed', { entry: String(r.seatTag ?? ''), kind: 'fifteen' });
      continue;
    }
    const opts = await prisma.itemOption.findMany({ where: { itemId }, select: { id: true, content: true, misconceptionExecution: true } });
    const opt = opts.find((o) => String((o.content as { value?: unknown })?.value ?? '') === optionValue);
    if (!opt) { hold('fifteen', seat, 'no option with this exact value on the item', { entry: String(r.seatTag ?? ''), kind: 'fifteen' }); continue; }
    const priorSig = await prisma.attributionEvent.count({ where: { recordId: itemId, action: 'SIGNED', reviewerId: ANNIE, note: { contains: optionValue.slice(0, 60) } } });
    if (priorSig > 0) { land('verdict-signature', seat, 'ALREADY', 'this seat already carries her signature from a prior run'); continue; }
    const current = opt.misconceptionExecution ?? '';
    const hereText = String(src.THE_TEXT_IN_THESE_ROWS); const crossedText = String(src.THE_TEXT_IN_THE_CROSSED_ARTEFACT);
    if (sha(hereText) !== String(src.itsSha256) || sha(crossedText) !== String(src.itsSha256Crossed)) {
      hold('fifteen', seat, 'a source text does not recompute to its own declared digest', { entry: String(r.seatTag ?? ''), kind: 'fifteen' }); continue;
    }
    const crossedWins = verdict.startsWith('THE CROSSED TEXT DERIVES') ||
      (verdict.startsWith('BOTH') && (r.houseForm as { whichTextIsInHouseForm?: string } | null)?.whichTextIsInHouseForm !== 'the one in these rows');
    if (sha(current) !== String(src.itsSha256)) {
      hold('fifteen', seat, `current execution (${sha(current).slice(0, 12)}) is not the text the ruling read (${String(src.itsSha256).slice(0, 12)}) — the seat moved since the crossing`, { entry: String(r.seatTag ?? ''), kind: 'fifteen' });
      continue;
    }
    const winnerSha = crossedWins ? String(src.itsSha256Crossed) : String(src.itsSha256);
    const retainedSha = crossedWins ? String(src.itsSha256) : String(src.itsSha256Crossed);
    if (crossedWins) {
      await prisma.$transaction([
        prisma.itemOption.update({ where: { id: opt.id }, data: { misconceptionExecution: crossedText } }),
        prisma.attributionEvent.create({ data: { recordType: 'item', recordId: itemId, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field: 'misconceptionExecution', method: `fifteen-ruled-by-derivation ${ruled.sha256.slice(0, 16)}: ${verdict}`, note: `seat "${optionValue.slice(0, 60)}"; landed text ${winnerSha.slice(0, 12)}; the other retained by reference at ${retainedSha.slice(0, 12)} in ${fifteenSrc.sha256.slice(0, 16)}` } }),
      ]);
      land('execution', seat, 'LANDED', `crossed text stands (${winnerSha.slice(0, 12)}), the rows' text retained at its digest`);
    } else {
      land('execution', seat, 'STANDS', `the text in these rows derives; no bytes moved; the other retained at ${retainedSha.slice(0, 12)}`);
    }
    await recordSignature(prisma, {
      recordType: 'item', recordId: itemId, reviewerId: ANNIE, recordedBy: RECORDED_BY,
      method: `her 206th's derivation method, closed by her 207th; verdict "${verdict}" from fifteen-ruled-by-derivation ${ruled.sha256.slice(0, 16)}`,
      note: `seat "${optionValue.slice(0, 60)}"; standing text ${winnerSha.slice(0, 12)}; the other text retained at ${retainedSha.slice(0, 12)} in ${fifteenSrc.sha256.slice(0, 16)}`,
      subjectHash: winnerSha,
    });
    land('verdict-signature', seat, 'SIGNED', verdict.slice(0, 60));
  }

  // 2c. The 204th's retag, sized at four. The destination entry is never named by id in any return
  //     on this desk, and two of the four carriers have no seat in this store. All four hold.
  for (const [v, why] of [
    ['STAY', 'seat present (gen-vr-13-make-a-word-01); the 204th names the act, no return names the destination entry id — a name in prose is looked up, never inferred (R178)'],
    ['SHOE', 'seat present (gen-vr-13-make-a-word-02); same: destination entry never named by id'],
    ['SWAN', 'no seat in this store carries this value — the carrier is in the authoring store\'s rows'],
    ['CHERRY', 'no seat in this store carries this value — the carrier is in the authoring store\'s rows'],
  ] as const) {
    hold('retag-204th', `vr-13 carrier ${v}`, why, { entry: 'vr13', kind: 'retag' });
  }

  // ---- PHASE 3: EXECUTIONS AND REGENERATIONS THROUGH THE GATES --------------------------------
  console.log('\nPHASE 3 — executions and regenerations through the tag gate and the key gate.');
  // The two crossed-text executions landed in 2b, gated by their own derivation ruling; the English
  // seats' entries are semantic, so both gates return UNDECIDED there — recorded, never a pass.
  hold('regeneration', 'vr-18 (25 rows)', 'regeneration is PROPOSED (cc4177f15fdf0ab4) and unruled — the store proposes, the reader rules; no return accepts it', { door: 'vr-18', kind: 'regeneration' });
  hold('regeneration', 'vr-13 (eighteen carriers)', 'the 204th rules they fall to the default and regenerate; no regeneration has been authored or proposed, and proposing one is authoring work this run does not do', { door: 'vr-13', kind: 'regeneration' });

  // ---- PHASE 4: THE 95, IN ORDINAL ORDER ------------------------------------------------------
  console.log('\nPHASE 4 — the 95, applied in ordinal order; every anchor asserted; refusals hold.');
  const amendments = (census.data.SEVEN_THE_AMENDMENTS as Array<Record<string, unknown>>)
    .slice().sort((a, b) => Number(a.ordinal) - Number(b.ordinal));
  readFieldsByName('the 95', amendments, ['target', 'ordinal', 'claimedIn']);
  requirePopulation('one-run:the-95', { 'amendment(s)': amendments.length });

  const the95: Array<{ target: string; ordinal: number; state: string; detail: string }> = [];
  const note95 = (a: Record<string, unknown>, state: string, detail: string) => {
    the95.push({ target: String(a.target), ordinal: Number(a.ordinal), state, detail });
    if (state.startsWith('HOLD')) hold('the-95', String(a.target), detail, { namespace: String(a.target).split(':')[0]!, return: String(a.ordinal), kind: 'amendment' });
    else land('amendment', String(a.target), state, detail);
  };

  // The chain first, by declaration (THECHAINVERIFIED): ordinal order only; net zero.
  const chainRows = amendments.filter((a) => String(a.target) === 'item:MC04-GEOM-05:key');
  if (chainRows.length === 2) {
    const key = await prisma.itemOption.findFirst({ where: { itemId: 'MC04-GEOM-05', isCorrect: true }, select: { content: true } });
    const keyVal = String((key?.content as { value?: unknown })?.value ?? '');
    const sound = keyVal !== '68 cm2';
    note95(chainRows[0]!, sound ? 'VOIDED-BY-CHAIN' : 'HOLD', sound
      ? `the 183rd withdraws this amendment; stored key "${keyVal}" stands sound, untouched`
      : `stored key is the unsound rendering "${keyVal}" — the chain rules it sound and the bytes disagree`);
    note95(chainRows[1]!, 'WITHDRAWAL-STANDS', `applied in ordinal order per THECHAINVERIFIED ${chain.sha256.slice(0, 12)}; net effect zero; stored key "${keyVal}"`);
  }

  for (const a of amendments) {
    const target = String(a.target);
    if (target === 'item:MC04-GEOM-05:key') continue; // the chain, handled above
    const ordinal = Number(a.ordinal);
    const claimed = a.claimedIn as { artefact?: string; sha256?: string } | undefined;
    if (claimed?.sha256 && !returnsByDigest.has(claimed.sha256)) {
      note95(a, 'HOLD', `claiming return ${claimed.artefact ?? '?'} is not on this desk at its declared digest ${String(claimed.sha256).slice(0, 12)}`);
      continue;
    }
    const replaced = a.replaced === undefined ? null : String(a.replaced);
    const authored = a.authored === undefined ? null : String(a.authored);
    const ns = target.split(':')[0]!;
    const evNote = `her ${ordinal}th (${String(claimed?.sha256 ?? '').slice(0, 12)}), via the census ${census.sha256.slice(0, 12)}`;

    try {
      if (ns === 'library' && target.startsWith('library:NEW-ENTRY:')) {
        const id = target.split(':')[2]!;
        const exists = await prisma.misconception.findUnique({ where: { id }, select: { id: true } });
        if (exists) note95(a, 'ALREADY', 'mint landed by land-minted-entries; entry present');
        else if (id === 'fraction-reduced-to-its-denominator') note95(a, 'ALREADY-SUPERSEDED', 'her own refinement superseded this wording before landing (minted-entry-landing 404c7f61); the refined entry landed in its place and was itself retired into maths-75 by her 194th');
        else note95(a, 'HOLD', 'mint named; entry absent; the census carries no content for it, so landing it means reading her return prose — held rather than parsed');
      } else if (ns === 'library') {
        const [, id, fieldRaw] = target.split(':');
        const field = fieldRaw ?? 'childHint';
        const row = await prisma.misconception.findUnique({ where: { id: id! }, select: { childHint: true, description: true, status: true } });
        if (!row) { note95(a, 'HOLD', 'no such library entry in this store'); continue; }
        if (target === 'library:fraction-part-used-alone') { note95(a, 'ALREADY', `action row: retired into maths-75 by land-annie-194; current status ${row.status}`); continue; }
        const cur = field === 'description' ? row.description : row.childHint;
        if (authored !== null && cur === authored) note95(a, 'ALREADY', `${field} already carries the authored wording`);
        else if (replaced !== null && cur === replaced) {
          const gate = checkChildFacingText({ role: 'hint', label: `${id}.${field}`, text: authored! });
          if (gate.length) { note95(a, 'HOLD', `child-facing gate refuses the authored wording: ${gate.map((g) => g.detail).join(' | ').slice(0, 140)}`); continue; }
          await prisma.$transaction([
            prisma.misconception.update({ where: { id: id! }, data: { [field === 'description' ? 'description' : 'childHint']: authored! } }),
            prisma.attributionEvent.create({ data: { recordType: 'misconception', recordId: id!, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field, method: 'anchored apply from the amendment census, ordinal order', note: evNote } }),
          ]);
          note95(a, 'APPLIED', `${field}: "${replaced.slice(0, 40)}…" → "${authored!.slice(0, 40)}…"`);
        } else {
          // Not the anchor and not the authored text. Two innocent explanations before a hold:
          // a LATER amendment in this census moved the entry further (current == its authored),
          // or a dedicated landing script already applied this one (an event cites the return).
          const later = amendments.filter((x) => String(x.target).startsWith('library:') && String(x.target).split(':')[1] === id && Number(x.ordinal) > Number(a.ordinal) && x.authored !== undefined && (row.childHint === String(x.authored) || row.description === String(x.authored)));
          if (later.length) { note95(a, 'ALREADY-SUPERSEDED-DOWNSTREAM', `her ${later.map((l) => Number(l.ordinal)).join('/')}th moved this entry further; the current text is that later authored wording`); continue; }
          const suffix = (n: number) => (n % 100 >= 11 && n % 100 <= 13) ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
          const evs = await prisma.attributionEvent.findMany({ where: { recordId: id!, action: 'AMENDED' }, select: { method: true, note: true } });
          const dp = String(claimed?.sha256 ?? '').slice(0, 16);
          const cite = evs.find((e) => (e.method ?? '').includes(`her ${ordinal}${suffix(ordinal)}`) || (dp.length === 16 && ((e.method ?? '').includes(dp) || (e.note ?? '').includes(dp))));
          if (cite) { note95(a, 'ALREADY-BY-EVENT', `landed by a dedicated script — "${(cite.method ?? '').slice(0, 100)}"`); continue; }
          note95(a, 'HOLD', `anchor matches neither field: childHint="${(row.childHint ?? '').slice(0, 50)}", description="${(row.description ?? '').slice(0, 40)}"`);
        }
      } else if (ns === 'walk') {
        const itemId = target.split(':')[1]!;
        const row = await prisma.item.findUnique({ where: { id: itemId }, select: { explanation: true } });
        if (!row) { note95(a, 'HOLD', 'no such item'); continue; }
        const script = String((row.explanation as { walkScript?: string })?.walkScript ?? '');
        if (authored !== null && script.includes(authored)) note95(a, 'ALREADY', 'walk script already carries the authored sentence');
        else if (replaced !== null && script.includes(replaced)) {
          const next = script.split(replaced).join(authored!);
          const gate = checkChildFacingText({ role: 'narrative', label: `${itemId}.walkScript`, text: next });
          if (gate.length) { note95(a, 'HOLD', `child-facing gate refuses the amended walk: ${gate.map((g) => g.detail).join(' | ').slice(0, 140)}`); continue; }
          await prisma.$transaction([
            prisma.item.update({ where: { id: itemId }, data: { explanation: { ...(row.explanation as Record<string, unknown>), walkScript: next } } }),
            prisma.attributionEvent.create({ data: { recordType: 'item', recordId: itemId, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field: 'explanation.walkScript', method: 'anchored apply from the amendment census, ordinal order', note: evNote } }),
          ]);
          note95(a, 'APPLIED', 'walk sentence amended');
        } else note95(a, 'HOLD', 'anchor sentence not in the walk script');
      } else if (ns === 'item' || ns === 'items') {
        // FIRST, THE STORE'S OWN RECORD: an AMENDED event citing this return — by ordinal word or
        // by its digest — means a dedicated landing script already applied it. ALREADY-BY-EVENT,
        // the event's method quoted; never re-derived (R605: ask what reads the field).
        const suffix = (n: number) => (n % 100 >= 11 && n % 100 <= 13) ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
        const ordinalWord = `her ${ordinal}${suffix(ordinal)}`;
        const digestPrefix = String(claimed?.sha256 ?? '').slice(0, 16);
        const ids = [...new Set(target.match(/\b(?:MC\d{2}-[A-Z]+-\d{2}|ENG-\d{3}(?:-[A-Z0-9]+)+|bank-vr-[a-z0-9-]+?-\d{2}|gen-vr-[a-z0-9-]+?-\d{2})\b/g) ?? [])];
        if (ids.length > 0) {
          const cites: string[] = [];
          for (const id of ids) {
            const evs = await prisma.attributionEvent.findMany({ where: { recordId: id, action: 'AMENDED' }, select: { method: true, note: true } });
            const cite = evs.find((e) => (e.method ?? '').includes(ordinalWord) || (digestPrefix.length === 16 && ((e.method ?? '').includes(digestPrefix) || (e.note ?? '').includes(digestPrefix))));
            if (cite) cites.push(`${id}: "${(cite.method ?? '').slice(0, 70)}"`);
          }
          if (cites.length === ids.length) { note95(a, 'ALREADY-BY-EVENT', `landed by a dedicated script — ${cites.join('; ').slice(0, 240)}`); continue; }
        }
        const subs = target.split(' AND ').map((s) => s.trim());
        const states: string[] = [];
        let anyApplied = false; let anyHold = false;
        for (const sub of subs) {
          const m = sub.match(/^items?:([^:]+)(?::(.+))?$/);
          if (!m) { states.push(`${sub}: unparseable`); anyHold = true; continue; }
          const id = m[1]!;
          const field = m[2] ?? '';
          const tagFrom = replaced?.match(/misconceptionId ([a-z0-9-]+)/)?.[1];
          const tagTo = authored?.match(/misconceptionId ([a-z0-9-]+)/)?.[1];
          if (ns === 'items') {
            // a named row-set; the naming scan (f68c3e1…) is not on this desk, so the state is
            // read from the rows themselves and reported by id.
            const seats = await prisma.itemOption.findMany({ where: { misconceptionId: tagTo ?? '\u0000none', item: { questionTypeId: 'vr-02-two-odd-ones-out', difficultyTier: 3 } }, select: { itemId: true } });
            if (tagTo && seats.length >= 5) states.push(`row-set ALREADY (${seats.length} tier-3 seats wear ${tagTo})`);
            else {
              states.push(`row-set names five rows in a scan (f68c3e1…) not on this desk; ${seats.length} tier-3 seat(s) wear ${tagTo ?? '?'} (${seats.map((s) => s.itemId.replace('bank-vr-02-two-odd-ones-out-', '#')).join(', ')}); the fifth cannot be identified here`);
              anyHold = true;
            }
            continue;
          }
          if (field === 'hint') {
            const row = await prisma.item.findUnique({ where: { id }, select: { explanation: true } });
            if (!row) { states.push(`${id}: no such item`); anyHold = true; continue; }
            const cur = String((row.explanation as { hintCore?: string })?.hintCore ?? '');
            if (authored !== null && cur === authored) { states.push(`${id}: ALREADY (hintCore carries the authored wording)`); continue; }
            if (replaced !== null && cur === replaced) {
              const gate = checkChildFacingText({ role: 'hint', label: `${id}.hintCore`, text: authored! });
              if (gate.length) { states.push(`${id}: child-facing gate refuses the authored hint`); anyHold = true; continue; }
              await prisma.$transaction([
                prisma.item.update({ where: { id }, data: { explanation: { ...(row.explanation as Record<string, unknown>), hintCore: authored! } } }),
                prisma.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field: 'explanation.hintCore', method: 'anchored apply from the amendment census, ordinal order', note: evNote } }),
              ]);
              states.push(`${id}: APPLIED (hintCore)`); anyApplied = true;
            } else { states.push(`${id}: hintCore is "${cur.slice(0, 55)}" — matches neither wording`); anyHold = true; }
            continue;
          }
          if (authored !== null && authored.trim().startsWith('{')) {
            // the authored value is a JSON seat state (tag + execution): compare, never position
            try {
              const obj = JSON.parse(authored) as { misconceptionId?: string; misconceptionExecution?: string };
              const opts = await prisma.itemOption.findMany({ where: { itemId: id }, select: { misconceptionId: true, misconceptionExecution: true } });
              const worn = obj.misconceptionId && opts.some((o) => o.misconceptionId === obj.misconceptionId && (obj.misconceptionExecution ? (o.misconceptionExecution ?? '').startsWith(obj.misconceptionExecution.slice(0, 60)) : true));
              if (worn) states.push(`${id}: ALREADY (a seat wears ${obj.misconceptionId} with the authored execution)`);
              else { states.push(`${id}: no seat wears the authored tag+execution`); anyHold = true; }
            } catch { states.push(`${id}: authored JSON does not parse`); anyHold = true; }
            continue;
          }
          if (tagFrom || tagTo) {
            const opts = await prisma.itemOption.findMany({ where: { itemId: id }, select: { id: true, misconceptionId: true } });
            if (tagTo && opts.some((o) => o.misconceptionId === tagTo)) { states.push(`${id}: ALREADY (a seat wears ${tagTo})`); continue; }
            const from = opts.find((o) => o.misconceptionId === tagFrom);
            if (tagTo && from) {
              await prisma.$transaction([
                prisma.itemOption.update({ where: { id: from.id }, data: { misconceptionId: tagTo } }),
                prisma.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field: 'options[].misconceptionId', method: 'anchored retag: seat resolved by the tag it wore, never by position', note: evNote } }),
              ]);
              states.push(`${id}: APPLIED (${tagFrom} -> ${tagTo})`); anyApplied = true;
            } else { states.push(`${id}: no seat wears ${tagFrom ?? '?'} and none wears ${tagTo ?? '?'}`); anyHold = true; }
            continue;
          }
          // a plain field amendment (stem text etc.): anchored leaf replace over stem AND explanation
          const row = await prisma.item.findUnique({ where: { id }, select: { stem: true, explanation: true } });
          if (!row) { states.push(`${id}: no such item`); anyHold = true; continue; }
          const whole = { stem: row.stem, explanation: row.explanation };
          if (authored !== null && containsLeaf(whole, authored)) { states.push(`${id}: ALREADY`); continue; }
          if (replaced !== null && containsLeaf(whole, replaced)) {
            const r = replaceLeaf(row.stem, replaced, authored!);
            if (r.count !== 1) { states.push(`${id}: anchor matches ${r.count} stem leaves — refusing a non-unique or off-stem edit (R87)`); anyHold = true; continue; }
            const gate = checkChildFacingText({ role: 'item-stem', label: `${id}.stem`, text: authored! });
            if (gate.length) { states.push(`${id}: child-facing gate refuses`); anyHold = true; continue; }
            await prisma.$transaction([
              prisma.item.update({ where: { id }, data: { stem: r.out as never } }),
              prisma.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field: 'stem', method: 'anchored leaf replace, exactly-one asserted', note: evNote } }),
            ]);
            states.push(`${id}: APPLIED`); anyApplied = true;
          } else { states.push(`${id}: anchor absent from the row (stem and explanation searched)`); anyHold = true; }
        }
        note95(a, anyHold ? 'HOLD' : anyApplied ? 'APPLIED' : 'ALREADY', states.join('; ').slice(0, 240));
      } else if (ns === 'case') {
        // Case rows here are slugs (case-en-01…); the amendment names the case by its story. The
        // wording is searched across every case's own JSON leaves, never resolved by name.
        const cases = await prisma.case.findMany({ select: { id: true, title: true, narrativeIntro: true, storyWrapper: true } });
        const leafHolder = (s: string) => cases.find((c) => containsLeaf({ t: c.title, n: c.narrativeIntro, w: c.storyWrapper }, s));
        const withAuthored = authored !== null ? leafHolder(authored) : undefined;
        if (withAuthored) note95(a, 'ALREADY', `the authored wording stands on ${withAuthored.id}`);
        else {
          const withReplaced = replaced !== null ? leafHolder(replaced) : undefined;
          if (withReplaced) {
            const rn = replaceLeaf(withReplaced.narrativeIntro, replaced!, authored!);
            const rw = replaceLeaf(withReplaced.storyWrapper ?? null, replaced!, authored!);
            const total = rn.count + rw.count + (withReplaced.title === replaced ? 1 : 0);
            if (total !== 1) { note95(a, 'HOLD', `anchor matches ${total} leaves on ${withReplaced.id} — refusing a non-unique edit (R87)`); }
            else {
              const gate = checkChildFacingText({ role: 'narrative', label: `${withReplaced.id}`, text: authored! });
              if (gate.length) note95(a, 'HOLD', `child-facing gate refuses the authored wording: ${gate.map((g) => g.detail).join(' | ').slice(0, 120)}`);
              else {
                await prisma.$transaction([
                  prisma.case.update({ where: { id: withReplaced.id }, data: { narrativeIntro: rn.out as never, ...(rw.count ? { storyWrapper: rw.out as never } : {}), ...(withReplaced.title === replaced ? { title: authored! } : {}) } }),
                  prisma.attributionEvent.create({ data: { recordType: 'case', recordId: withReplaced.id, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, method: 'anchored leaf replace across the case row, exactly-one asserted', note: evNote } }),
                ]);
                note95(a, 'APPLIED', `wording amended on ${withReplaced.id}`);
              }
            }
          } else note95(a, 'HOLD', `no case row carries either wording; "${target.split(':')[1]}" is a desk name and case ids here are case-en/vr/maths slugs`);
        }
      } else if (ns === 'template') {
        const genPath = pjoin(REPO, 'packages/db/prisma/generate-content.ts');
        const src = readFileSync(genPath, 'utf8');
        if (authored !== null && src.includes(authored)) note95(a, 'ALREADY', 'generator already carries the authored text');
        else if (replaced !== null && src.split(replaced).length === 2) {
          writeFileSync(genPath, src.split(replaced).join(authored!));
          note95(a, 'APPLIED', 'generator template text amended (exactly-one asserted); regeneration NOT run — reviewed rows are immutable to code changes (R62)');
        } else if (replaced !== null && src.includes(replaced)) note95(a, 'HOLD', 'anchor matches more than once in the generator — refusing a non-unique edit (R87)');
        else note95(a, 'HOLD', 'the nearest bytes here are the generator entry description (no (WORD) placeholder) and per-option drafterDeclaredPull values, which are verbatim records of the authored source, not templates — rewriting a record would falsify it (R604); the template itself is not stored in this repo');
      } else if (ns === 'passage') {
        note95(a, 'HOLD', 'a passage coverage judgement has no store here — no table or file holds coverage records; NOT HELD HERE');
      } else if (ns === 'notice' || ns === 'surface' || ns === 'table' || ns === 'document' || ns === 'authoring-slot') {
        const why: Record<string, string> = {
          notice: 'the nvr-servability notice is desk/authoring-store copy; no file here carries the replaced sentence',
          surface: 'a layout ruling is not stored bytes here; the surface is rendered by component code and its state is not a comparable string',
          table: 'CONTENT_AXES is a desk document, not held in this store',
          document: 'a desk document, not held in this store',
          'authoring-slot': "the authoring slot is Cowork's store; this repo does not write it (one direction only)",
        };
        note95(a, 'HOLD', `NOT HELD HERE — ${why[ns]}`);
      } else {
        note95(a, 'HOLD', `unknown namespace "${ns}" — refusing the shape rather than guessing (R173)`);
      }
    } catch (e) {
      note95(a, 'HOLD', `applier threw: ${String((e as Error).message).slice(0, 160)}`);
    }
  }

  // ---- PHASE 5: THE REFUSAL-SHAPE GUARD OVER EVERY REFUSAL SET --------------------------------
  console.log('\nPHASE 5 — the refusal-shape guard, fed the discriminating dimension (R962).');
  const asRows = (of: string[]): ScreenedRow[] => {
    const all: ScreenedRow[] = [];
    for (const l of landings.filter((x) => of.includes(x.act))) all.push({ refused: false, dims: { kind: l.act } });
    for (const h of holds.filter((x) => of.includes(x.of))) all.push({ refused: true, reason: h.reason.slice(0, 80), dims: h.dims });
    return all;
  };
  assessRefusalShape('one-run:verdict-landings', asRows(['verdict-signature', 'execution', 'vr19-signature', 'fifteen', 'retag-204th', 'regeneration']));
  const rows95: ScreenedRow[] = the95.map((r) => ({
    refused: r.state.startsWith('HOLD'),
    reason: r.state.startsWith('HOLD') ? r.detail.slice(0, 80) : undefined,
    dims: { namespace: r.target.split(':')[0]!, return: String(r.ordinal) },
  }));
  assessRefusalShape('one-run:the-95', rows95);

  // ---- PHASE 6: THE PUBLICATION REPORT PER DOOR -----------------------------------------------
  console.log('\nPHASE 6 — the publication report over the eleven doors.');
  const DOORS = ['vr-02-two-odd-ones-out', 'vr-05-hidden-word', 'vr-08-move-letter', 'vr-10-word-connections', 'vr-13-make-a-word', 'vr-16-opposite-meaning', 'vr-17-complete-the-sum', 'vr-18-related-numbers', 'vr-19-word-number-codes', 'vr-20-complete-the-word', 'vr-21-same-meaning'];
  const doorReports: Array<Record<string, unknown>> = [];
  for (const qt of DOORS) {
    const rows = await prisma.item.findMany({
      where: { questionTypeId: qt, status: { in: ['DRAFT', 'NEVER_SHIPPABLE'] } },
      select: { id: true, status: true, stem: true, explanation: true, authoredBy: true, answerFlaggedAt: true, sendHistory: true, options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } },
    });
    const draft = rows.filter((r) => r.status === 'DRAFT');
    const namedByState = rows.filter((r) => r.status === 'NEVER_SHIPPABLE');
    const signedIds = new Set((await prisma.attributionEvent.findMany({ where: { recordId: { in: draft.map((r) => r.id) }, action: 'SIGNED', reviewerId: { not: null } }, select: { recordId: true } })).map((e) => e.recordId));
    const window = await prisma.attempt.count({ where: { itemId: { in: rows.map((r) => r.id) } } });
    let keyPerforms = 0, keyRefuses = 0, keyUndecided = 0, tagged = 0, withExec = 0, pinned = 0, authored = 0;
    const rowHolds: string[] = [];
    for (const r of draft) {
      const keyOpt = r.options.find((o) => o.isCorrect);
      const kg = checkKeyPerformsStem({ questionTypeId: qt, stem: r.stem as Record<string, unknown>, keyValue: String((keyOpt?.content as { value?: unknown })?.value ?? ''), optionValues: r.options.map((o) => String((o.content as { value?: unknown })?.value ?? '')) }, isWord);
      if (kg.verdict === 'PERFORMS') keyPerforms += 1; else if (kg.verdict === 'REFUSES') { keyRefuses += 1; if (!r.answerFlaggedAt) rowHolds.push(`${r.id}: key gate refuses (${kg.why.slice(0, 70)}) and the row is not flagged`); }
      else keyUndecided += 1;
      tagged += r.options.filter((o) => o.misconceptionId).length;
      withExec += r.options.filter((o) => o.misconceptionId && o.misconceptionExecution).length;
      if (r.sendHistory !== null) pinned += 1;
      if (r.authoredBy) authored += 1;
      if (r.answerFlaggedAt) rowHolds.push(`${r.id}: answer-flagged (published hold — its own rule does not produce its key)`);
    }
    const unread = draft.filter((r) => !signedIds.has(r.id) && !r.answerFlaggedAt).length;
    const unpinned = draft.filter((r) => r.sendHistory === null && !r.answerFlaggedAt).length;
    const reasons: string[] = [];
    if (unread > 0) reasons.push(`${unread} row(s) carry no reading — no SIGNED verdict by a named reviewer`);
    if (unpinned > 0) reasons.push(`${unpinned} row(s) carry no pin — never sent, identity never asserted to a reader`);
    if (keyRefuses > 0) reasons.push(`${keyRefuses} key(s) refuse the key gate`);
    const publishable = reasons.length === 0;
    doorReports.push({
      door: qt,
      rowsBehindTheDoor: draft.length,
      namedByState: namedByState.length ? `${namedByState.length} NEVER_SHIPPABLE (David's seed ruling — a published hold)` : undefined,
      signedCount: signedIds.size,
      executionsPresent: `${withExec} of ${tagged} tagged seats carry an execution`,
      keyGate: { performs: keyPerforms, refuses: keyRefuses, undecided: keyUndecided, note: keyUndecided === draft.length ? 'no predicate for this type — its task is semantic; UNDECIDED is a named state, not a pass' : undefined },
      threeAssertions: { identityPinned: pinned, readingSigned: signedIds.size, authorshipNamed: authored },
      holdsNamed: rowHolds.length ? rowHolds : ['none beyond the door-level reasons'],
      blastRadius: { attempts: window, sections: `${Math.floor(draft.length / 6)}x6 + ${draft.length % 6} by the arc's sectioning`, taggedSeats: tagged, entriesReferenced: [...new Set(draft.flatMap((r) => r.options.map((o) => o.misconceptionId).filter(Boolean)))].length },
      windowAsAFigure: window,
      PUBLISHABLE: publishable,
      why: publishable ? 'every row behind the door is on all three assertions or held with a published reason' : reasons,
    });
    console.log(`  ${qt}: ${publishable ? 'PUBLISHABLE' : 'NOT PUBLISHABLE'} — ${publishable ? 'all rows on all three assertions or held' : reasons.join('; ')}`);
  }

  // ---- PHASE 7: DELIVER -----------------------------------------------------------------------
  const report = {
    kind: 'one-run-verdicts-executions-and-the-95',
    TO: 'David; Annie and the authoring store by relay',
    date: '2026-09-01',
    THE_RULE: 'whatever refuses is a hold; no repair proposals; a door is publishable when every row behind it is on all three assertions (identity, reading, authorship — R909) or held with a published reason',
    EVIDENCE: {
      census: census.sha256, chainVerified: chain.sha256, fifteenRuled: ruled.sha256,
      fifteenSource: fifteenSrc.sha256, vr19Regeneration: vr19art.sha256,
      returnsHashedOnTheDesk: returnsByDigest.size,
    },
    LANDINGS: landings,
    HOLDS: holds,
    THE_95: the95,
    THE_95_TALLY: Object.fromEntries([...new Set(the95.map((r) => r.state))].map((s) => [s, the95.filter((r) => r.state === s).length])),
    DOORS: doorReports,
    PUBLISHABLE: doorReports.filter((d) => d.PUBLISHABLE).map((d) => d.door),
    NOT_PUBLISHABLE: doorReports.filter((d) => !d.PUBLISHABLE).map((d) => ({ door: d.door, why: d.why })),
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const dig = findingsDigest(clean, ['LANDINGS', 'HOLDS', 'THE_95', 'DOORS']);
  Object.assign(clean, dig);
  const digest = dig.findingsSha256;
  const out = pjoin(REPO, 'content/exports', stampedName('one-run-report', digest, 'json'));
  writeFileSync(out, JSON.stringify(clean, null, 1));
  const delivered = deliver(out);
  console.log(`\nDelivered: ${delivered}`);
  console.log(`Landings: ${landings.length}; holds: ${holds.length}; the 95: ${JSON.stringify(report.THE_95_TALLY)}`);
  console.log(`Publishable doors: ${report.PUBLISHABLE.length ? report.PUBLISHABLE.join(', ') : 'NONE'} of ${DOORS.length}.`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
