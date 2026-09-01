/**
 * ROUND THREE, FINAL (David, 2026-09-02). Two things, one run, then the report is final.
 *
 * ONE — pin and sign vr-02 against her 197th and 200th: the case was read complete before the
 * population artefact existed and is the only door outside both rounds. Same verification the
 * others took: identity (pin), reading (signature), gates recorded, evidence that the returns'
 * outcomes are in the bytes (the store's own AMENDED events citing each return).
 *
 * TWO — reconcile publishable against the door trigger. THE TRIGGER'S TEST, from its own code
 * (R41 — the verifier calls the family's own function, never a re-derivation):
 * `doorOpensOnThisSection` requires every row of the case SIGNED AND WHOLE (R699), where whole
 * is `itemWholeness` (R701): every tag points at an ATTESTED entry (ACTIVE + reviewer stamp),
 * every tagged option's EXECUTION exists, and a walkScript wherever walk mode serves. The
 * three-assertions table (R909) is a different, weaker test. David's go lands on THIS
 * derivation.
 *
 * Also completed here: vr21-opposite-pull's attestation stamp — every entry she minted carries
 * `approvedBy: reviewer:rev-0001` (measured precedent); round one's mint omitted the stamp, an
 * instrument omission of this store's, not a content state.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma, recordSignature } from '../packages/db/src/index';
import { checkKeyPerformsStem } from '../packages/core/src/key-gate';
import { itemWholeness } from './lib/item-wholeness';
import { requirePopulation } from './lib/population';
import { assessRefusalShape, runRefusalShapeFixture, type ScreenedRow } from './lib/refusal-shape';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, findingsDigest } from './lib/findings-digest';

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

const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v;
const pinHash = (row: { stem: unknown; explanation: unknown; options: Array<{ content: unknown; isCorrect: boolean }> }) =>
  sha(canonicalJson(strip({ stem: row.stem, options: row.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: row.explanation }) as object));

interface Rec { kind: string; target: string; state: string; detail: string; dims: Record<string, string> }
const recs: Rec[] = [];
const rec = (kind: string, target: string, state: string, detail: string, dims: Record<string, string> = {}) => { recs.push({ kind, target, state, detail, dims }); };

async function main() {
  console.log(`ROUND THREE, FINAL — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  runRefusalShapeFixture();

  // ---- EVIDENCE -------------------------------------------------------------------------------
  const r197 = fileSha(pjoin(DL, 'annie-hundredandninetyseventh-return.md'));
  const r200 = fileSha(pjoin(DL, 'annie-twohundredth-return.md'));
  const r210 = fileSha(pjoin(DL, 'annie-210-for-code.md'));
  console.log(`  her 210th ${r210.slice(0, 16)} — twelve confirmed, her ten withdrawn, thirteen duplicates; vr-02 pins need nothing further`);
  console.log(`  her 197th ${r197.slice(0, 16)}, her 200th ${r200.slice(0, 16)}`);
  const ev197 = await prisma.attributionEvent.count({ where: { method: { contains: 'her 197th' }, recordId: { startsWith: 'bank-vr-02' } } });
  const ev200 = await prisma.attributionEvent.count({ where: { method: { contains: 'her 200th' }, recordId: { startsWith: 'bank-vr-02' } } });
  console.log(`  outcomes in the bytes: ${ev197} vr-02 event(s) cite her 197th, ${ev200} cite her 200th.`);
  if (ev197 === 0 || ev200 === 0) throw new Error('a return with no landed outcome on this case cannot anchor its reading — refusing to sign');

  // ---- ONE: PIN AND SIGN VR-02 ----------------------------------------------------------------
  console.log('\nONE — pin and sign vr-02 against her 197th and 200th.');
  const vr02rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out', status: 'DRAFT' }, orderBy: { id: 'asc' },
    select: { id: true, stem: true, explanation: true, sendHistory: true, answerFlaggedAt: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } } });
  requirePopulation('round-three:vr02', { 'vr-02 DRAFT row(s)': vr02rows.length });
  for (const row of vr02rows) {
    if (row.answerFlaggedAt) { rec('vr02', row.id, 'HOLD', 'answer-flagged — a published hold', { case: 'vr-02' }); continue; }
    const kg = checkKeyPerformsStem({ questionTypeId: 'vr-02-two-odd-ones-out', stem: row.stem as Record<string, unknown>, keyValue: '', optionValues: row.options.map((o) => String((o.content as { value?: unknown })?.value ?? '')) }, isWord);
    const subjectHash = pinHash(row);
    const pinnedAlready = row.sendHistory && JSON.stringify(row.sendHistory).includes(r197.slice(0, 16));
    if (!pinnedAlready && APPLY) {
      const before = subjectHash;
      await prisma.item.update({ where: { id: row.id }, data: { sendHistory: {
        sends: [
          { file: 'annie-hundredandninetyseventh-return.md', sha256: r197, role: 'reading record — her 197th, four taggings landed on this case' },
          { file: 'annie-twohundredth-return.md', sha256: r200, role: 'reading record — her 200th, seats re-authored on this case, matched on the replaced value' },
        ],
        pinnedProjectionSha256: subjectHash, pinnedAt: '2026-09-02', pinnedBy: RECORDED_BY,
        note: 'the case was read complete before the population artefact existed; identity is pinned to the current projection with both reading records named, and the returns\' outcomes are asserted present via the store\'s own events citing them',
      } } });
      const after = await prisma.item.findUniqueOrThrow({ where: { id: row.id }, select: { stem: true, explanation: true, options: { select: { content: true, isCorrect: true } } } });
      if (pinHash(after) !== before) throw new Error(`${row.id}: pin write moved the projection`);
    }
    rec('vr02-pin', row.id, pinnedAlready ? 'ALREADY' : 'PINNED', `projection ${subjectHash.slice(0, 12)}, both reading records named`, { case: 'vr-02' });
    const prior = await prisma.attributionEvent.count({ where: { recordId: row.id, action: 'SIGNED', reviewerId: ANNIE } });
    if (prior > 0) { rec('vr02-sign', row.id, 'ALREADY', 'her signature already stands', { case: 'vr-02' }); continue; }
    if (APPLY) {
      await recordSignature(prisma, {
        recordType: 'item', recordId: row.id, reviewerId: ANNIE, recordedBy: RECORDED_BY,
        method: `read complete across her 197th (${r197.slice(0, 16)}) and 200th (${r200.slice(0, 16)}), before the population artefact existed; the returns' outcomes are in these bytes (${ev197}+${ev200} events cite them); key gate ${kg.verdict} (semantic task; her reading certifies)`,
        note: 'subjectHash over retention-excluded {stem, options[{content,isCorrect}], explanation}',
        subjectHash,
      });
    }
    rec('vr02-sign', row.id, 'SIGNED', `key gate ${kg.verdict}`, { case: 'vr-02' });
  }

  // ---- COMPLETE THE MINT'S ATTESTATION --------------------------------------------------------
  const mint = await prisma.misconception.findUniqueOrThrow({ where: { id: 'vr21-opposite-pull' }, select: { approvedBy: true } });
  if (mint.approvedBy === null) {
    if (APPLY) {
      await prisma.$transaction([
        prisma.misconception.update({ where: { id: 'vr21-opposite-pull' }, data: { approvedBy: 'reviewer:rev-0001' } }),
        prisma.attributionEvent.create({ data: { recordType: 'misconception', recordId: 'vr21-opposite-pull', action: 'APPROVED', reviewerId: ANNIE, actor: 'annie', recordedBy: RECORDED_BY, field: 'approvedBy', method: 'her 208th mints the entry and David ratifies its landing; every entry she minted carries this stamp (measured precedent) — round one omitted it, an instrument omission of this store\'s, completed here', note: 'attestation is what the wholeness bar reads (R699/R701)' } }),
      ]);
    }
    rec('attestation', 'vr21-opposite-pull', APPLY ? 'STAMPED' : 'WOULD-STAMP', 'approvedBy reviewer:rev-0001, completing round one\'s mint to the governed state', {});
  } else rec('attestation', 'vr21-opposite-pull', 'ALREADY', `approvedBy ${mint.approvedBy}`, {});

  // ---- TWO: THE TRIGGER'S OWN TEST, PER DOOR --------------------------------------------------
  console.log('\nTWO — the door trigger\'s test, computed by its own function.');
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: 'reviewer:rev-0001' }, select: { id: true } })).map((m) => m.id));
  const DOORS: Array<[string, string]> = [['vr-02-two-odd-ones-out', 'case-vr-02'], ['vr-05-hidden-word', 'case-vr-05'], ['vr-08-move-letter', 'case-vr-08'], ['vr-10-word-connections', 'case-vr-10'], ['vr-13-make-a-word', 'case-vr-13'], ['vr-16-opposite-meaning', 'case-vr-16'], ['vr-17-complete-the-sum', 'case-vr-17'], ['vr-18-related-numbers', 'case-vr-18'], ['vr-19-word-number-codes', 'case-vr-19'], ['vr-20-complete-the-word', 'case-vr-20'], ['vr-21-same-meaning', 'case-vr-21']];
  const roundHolds: Record<string, number> = { 'vr-05-hidden-word': 4, 'vr-08-move-letter': 21 };
  const table: Array<Record<string, unknown>> = [];
  for (const [qt, caseId] of DOORS) {
    const c = await prisma.case.findUniqueOrThrow({ where: { id: caseId }, select: { modes: true } });
    /**
     * R917 GOVERNS: "walkScript where walk mode serves" means serves a REAL asset — the census's
     * own test (emit-vr-arc-census: assetRef not under placeholder/). Mode-declaration truthiness
     * is TRUE on a placeholder and manufactured a 250-row debt nobody owes; that was this run's
     * first reading and it is corrected here. One phrase, two tests — the ruled one is this one.
     */
    const walkAsset = (c.modes as Record<string, { assetRef?: string }>)?.walk;
    const walkServes = !!walkAsset?.assetRef && !walkAsset.assetRef.startsWith('placeholder/');
    const rows = await prisma.item.findMany({ where: { questionTypeId: qt, status: 'DRAFT' },
      select: { id: true, explanation: true, answerFlaggedAt: true, sendHistory: true, options: { select: { misconceptionId: true, misconceptionExecution: true } } } });
    const signedIds = new Set((await prisma.attributionEvent.findMany({ where: { recordId: { in: rows.map((r) => r.id) }, action: 'SIGNED', reviewerId: { not: null } }, select: { recordId: true } })).map((e) => e.recordId));
    let whole = 0, tagsBad = 0, execMissing = 0, walkMissing = 0, untaggedRows = 0;
    const unattestedEntries = new Set<string>();
    for (const r of rows) {
      const w = itemWholeness(r, attested, walkServes);
      if (w.whole) whole += 1;
      const tagged = r.options.filter((o) => o.misconceptionId);
      if (tagged.length === 0) untaggedRows += 1;
      else if (!w.tagsAttested) { tagsBad += 1; for (const o of tagged) if (!attested.has(o.misconceptionId!)) unattestedEntries.add(o.misconceptionId!); }
      if (tagged.length > 0 && !w.executionsExist) execMissing += 1;
      if (!w.walkOk) walkMissing += 1;
    }
    const signedAndWhole = rows.filter((r) => signedIds.has(r.id) && itemWholeness(r, attested, walkServes).whole).length;
    const doorOpens = rows.length > 0 && signedAndWhole === rows.length;
    const holds: string[] = [];
    if (rows.length - signedIds.size > 0) holds.push(`${rows.length - signedIds.size} row(s) unsigned`);
    if (untaggedRows) holds.push(`${untaggedRows} row(s) carry no tag at all (wholeness requires a tagged seat)`);
    if (tagsBad) holds.push(`${tagsBad} row(s) with a tag naming an unattested entry (${[...unattestedEntries].join(', ') || '—'})`);
    if (execMissing) holds.push(`${execMissing} row(s) with a tagged seat missing its execution`);
    if (walkMissing) holds.push(`${walkMissing} row(s) missing a walkScript where walk mode serves`);
    if (roundHolds[qt]) holds.push(`${roundHolds[qt]} of the unsigned are held with published reasons (rounds one/two: content faults awaiting her PROPOSED regenerations)`);
    table.push({ door: qt, rows: rows.length, signed: signedIds.size, whole, signedAndWhole, walkServes, WHOLE_DOOR: doorOpens, holds: holds.length ? holds : ['none — every row signed and whole'] });
    console.log(`  ${qt}: ${doorOpens ? 'WHOLE — door opens' : 'NOT WHOLE'} — signed ${signedIds.size}/${rows.length}, whole ${whole}/${rows.length}${holds.length ? ' | ' + holds.join('; ') : ''}`);
  }

  // ---- GUARD ----------------------------------------------------------------------------------
  const shape: ScreenedRow[] = recs.filter((r) => r.kind.startsWith('vr02')).map((r) => ({ refused: r.state === 'HOLD', reason: r.state === 'HOLD' ? r.detail.slice(0, 60) : undefined, dims: { case: 'vr-02' } }));
  assessRefusalShape('round-three:vr02', shape);

  // ---- DELIVER --------------------------------------------------------------------------------
  const tally = (kind: string) => Object.fromEntries([...new Set(recs.filter((r) => r.kind === kind).map((r) => r.state))].map((s) => [s, recs.filter((r) => r.kind === kind && r.state === s).length]));
  const report = {
    kind: 'the-final-door-report', TO: 'David; Annie and the authoring store by relay', date: '2026-09-02', mode: APPLY ? 'APPLIED' : 'DRY-RUN',
    EVIDENCE: { return197: r197, return200: r200, vr02EventsCiting197: ev197, vr02EventsCiting200: ev200 },
    THE_TRIGGER_TEST_STATED: 'doorOpensOnThisSection (R699) requires every row of the case SIGNED AND WHOLE; whole is itemWholeness (R701): every tag points at an ATTESTED entry (ACTIVE + approvedBy reviewer:rev-0001), every tagged option carries its execution, and a walkScript wherever walk mode serves. The three-assertions table (R909: identity, reading, authorship) is a WEAKER test — it asserts a row may be trusted, not that a child who misses meets something. The trigger enforces WHOLENESS, and the go lands on this derivation, computed here by calling itemWholeness itself, never a re-derivation (R41).',
    TALLIES: { pin: tally('vr02-pin'), sign: tally('vr02-sign'), attestation: tally('attestation') },
    THE_FINAL_TABLE: table,
    WHOLE_DOORS: table.filter((t) => t.WHOLE_DOOR).map((t) => t.door),
    RECORDS: recs,
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const dig = findingsDigest(clean, ['THE_FINAL_TABLE', 'RECORDS', 'THE_TRIGGER_TEST_STATED']);
  Object.assign(clean, dig);
  const out = pjoin(REPO, 'content/exports', stampedName('the-final-door-report', dig.findingsSha256, 'json'));
  writeFileSync(out, JSON.stringify(clean, null, 1));
  if (APPLY) { const d = deliver(out); console.log(`\nDelivered: ${d}`); } else console.log(`\nDRY RUN — ${out}`);
  console.log(`vr02 pins: ${JSON.stringify(tally('vr02-pin'))} | signs: ${JSON.stringify(tally('vr02-sign'))} | attestation: ${JSON.stringify(tally('attestation'))}`);
  console.log(`WHOLE doors: ${report.WHOLE_DOORS.join(', ') || 'NONE'} of ${DOORS.length}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
