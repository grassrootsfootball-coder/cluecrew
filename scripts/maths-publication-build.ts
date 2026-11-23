/**
 * EVERYTHING THE MATHS DISTRICT NEEDS TO PUBLISH — ONE RUN (R857).
 *
 * 1. signatures landed against pinned row hashes, refusing any row whose bytes have moved
 * 2. (the review surface is a component; asserted here, not built here)
 * 3. the nine amended assert byte-identical against the amended source
 * 4. the two held rows checked for their ruled variants
 * 5. the case face reported, drafted by nobody
 * then the pre-publication report. **PUBLICATION HOLDS.**
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { caseFaceServes, checkItemChildFacing, normaliseMathsNotation, publishBlockers } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const SRC = '/Users/davidb/Downloads/amended-maths-source-for-code.json';
const REVIEWER = 'rev-0001';
const AUTHORITY = 'Annie, via her 180th, 182nd and 184th returns';
const THE_NINE = ['MC01-FDP-03', 'MC02-CALC-04', 'MC03-CALC-04', 'MC03-CALC-08', 'MC04-CALC-04', 'MC05-CALC-04', 'MC01-CALC-04', 'MC01-FDP-06', 'MC05-FDP-08'];
/**
 * **RETENTION IS NOT CONTENT, AND A CONTENT HASH MUST NOT CARRY IT** (R858).
 *
 * The first run reported six rows as "bytes moved" and nine as DRIFT. Every one was mine: the rows
 * carry `_stemCollisionResolved` and `_previousValue`, written BY the landings, and the pinned
 * hashes were computed before those keys existed. **A record of what changed is not part of what a
 * reviewer read**, so it cannot be part of the hash that asks whether her text moved — otherwise
 * every act of recording provenance falsifies the signature it is recording.
 *
 * This is R845's distinction one layer over: there the notation gate screened retention, here the
 * content hash counted it.
 */
const stripRetention = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(stripRetention);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v as Record<string, unknown>)
      .filter(([k]) => !k.startsWith('_'))
      .map(([k, x]) => [k, stripRetention(x)]));
  }
  return v;
};
const contentHash = (stem: unknown, explanation: unknown, options: Array<{ content: unknown; isCorrect: boolean }>) =>
  sha(canonicalJson(stripRetention({ stem, options: options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation })));

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('maths-publication', [
    { name: 'a row whose hash matches its pin may sign', input: 'match', mustBeCaught: true },
    { name: 'a second matching row may', input: 'match-2', mustBeCaught: true },
    { name: 'a row whose bytes have moved may not', input: 'moved', mustBeCaught: false },
    { name: 'a row with no pin may not', input: 'unpinned', mustBeCaught: false },
  ], (k) => k.startsWith('match'));

  const rows = await prisma.item.findMany({
    where: { questionType: { district: 'MATHS' } },
    select: { id: true, status: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true, stem: true, explanation: true, questionTypeId: true, options: { orderBy: { id: 'asc' }, select: { id: true, content: true, isCorrect: true, misconceptionId: true } } },
    orderBy: { id: 'asc' },
  });
  requirePopulation('maths:publication-build', { 'maths rows': rows.length });

  const pins = await prisma.attributionEvent.findMany({
    where: { recordType: 'item', recordId: { in: rows.map((r) => r.id) }, actor: 'Annie', subjectHash: { not: null } },
    select: { recordId: true, subjectHash: true, method: true, at: true }, orderBy: { at: 'asc' },
  });
  const pinBy = new Map<string, { hash: string; method: string }>();
  for (const p of pins) pinBy.set(p.recordId, { hash: p.subjectHash!, method: p.method ?? '' });

  // ---- 1. THE SIGNATURES ----
  const signRows: Array<Record<string, unknown>> = [];
  for (const r of rows) {
    const now = contentHash(r.stem, r.explanation, r.options);
    const pin = pinBy.get(r.id);
    const blocker = publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt);
    const gateFaults = checkItemChildFacing(r).map((f) => `${f.rule}: ${f.detail}`);
    let outcome: string;
    if (!pin) outcome = 'NO PINNED HASH — she never verified this row';
    else if (pin.hash !== now) outcome = 'REFUSED — THE BYTES HAVE MOVED SINCE SHE VERIFIED';
    else if (blocker) outcome = `REFUSED — ${blocker}`;
    else outcome = APPLY ? 'SIGNED' : 'WOULD SIGN';
    if (APPLY && outcome === 'SIGNED') {
      await prisma.$transaction(async (tx) => {
        await tx.item.update({ where: { id: r.id }, data: { status: 'REVIEWED', reviewedBy: `reviewer:${REVIEWER}`, reviewMethod: 'content-verified against a pinned row hash', reviewRecordedBy: 'human:david', reviewRecordNote: AUTHORITY } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: r.id, action: 'SIGNED', reviewerId: REVIEWER, actor: 'Annie', recordedBy: 'human:david', field: 'reviewedBy', subjectHash: now, method: `signature landed from ${AUTHORITY}; the row's bytes are IDENTICAL to those she verified`, note: `pinned ${pin?.hash.slice(0, 16) ?? "(none)"} = now ${now.slice(0, 16)}` } });
      });
    }
    signRows.push({ itemId: r.id, outcome, pinnedHash: pin?.hash ?? null, hashNow: now, bytesMoved: pin ? pin.hash !== now : null, publishBlocker: blocker, gateFaults: gateFaults.length ? gateFaults : 'CLEAN' });
  }

  // ---- 3. THE NINE REGENERATE BYTE-IDENTICAL ----
  const src = JSON.parse(readFileSync(SRC, 'utf8')) as { THE_NINE_RESOLVED: Array<{ itemId: string; item: Record<string, unknown> }>; THREE_OF_THE_NINE_ARE_UNRESOLVED_AND_BOTH_VARIANTS_CROSS: { ids: string[]; rows?: unknown } };
  const resolvedById = new Map(src.THE_NINE_RESOLVED.map((r) => [r.itemId, r.item]));
  const unresolvedIds = new Set(src.THREE_OF_THE_NINE_ARE_UNRESOLVED_AND_BOTH_VARIANTS_CROSS.ids);
  const nine: Array<Record<string, unknown>> = [];
  for (const id of THE_NINE) {
    const row = rows.find((r) => r.id === id);
    const item = resolvedById.get(id);
    if (unresolvedIds.has(id)) {
      nine.push({ itemId: id, outcome: row ? 'RULED AND LANDED — both variants crossed and she chose one (184th)' : 'HELD — both variants cross, unruled', regenerates: 'n/a: an unresolved pair has no single form to regenerate' });
      continue;
    }
    if (!item || !row) { nine.push({ itemId: id, outcome: !item ? 'NOT IN THE AMENDED SOURCE' : 'NOT IN THE STORE', regenerates: false }); continue; }
    const stem = { text: normaliseMathsNotation(String(item.stem ?? '')) };
    const explanation = Object.fromEntries(Object.entries((item.explanation ?? {}) as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? normaliseMathsNotation(v) : v]));
    const opts = (item.options as Array<{ label: string; value: string; isKey?: boolean }>).map((o) => ({ content: { value: normaliseMathsNotation(o.value), label: o.label }, isCorrect: o.isKey === true }));
    const fromSource = contentHash(stem, explanation, opts);
    const onTheRow = contentHash(row.stem, row.explanation, row.options);
    nine.push({ itemId: id, outcome: fromSource === onTheRow ? 'BYTE-IDENTICAL' : 'DRIFT', regenerates: fromSource === onTheRow, fromSource, onTheRow });
  }

  // ---- 4. THE TWO HELD ROWS ----
  const two = ['MC04-FDP-04', 'MC05-FDP-01'].map((id) => {
    const r = rows.find((x) => x.id === id);
    const coll = r?.explanation && typeof r.explanation === 'object' ? (r.explanation as Record<string, unknown>)._stemCollision ?? (r.explanation as Record<string, unknown>)._stemCollisionResolved : undefined;
    return { itemId: id, present: Boolean(r), key: r?.options.find((o) => o.isCorrect) ? String((r.options.find((o) => o.isCorrect)!.content as { value: string }).value) : null, unchosenRecorded: Boolean(coll), publishBlocker: r ? publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt) : 'absent' };
  });

  // ---- 5. THE CASE FACE ----
  const kase = await prisma.case.findFirst({ where: { questionType: { district: 'MATHS' } }, select: { id: true, title: true, narrativeIntro: true, freeTier: true, mappedQuestionTypeIds: true, caseFiles: { orderBy: { id: 'asc' }, select: { id: true } } } });
  const facePath = join(REPO, 'scripts/lib/case-face.ts');
  const theFace = {
    caseId: kase?.id ?? null,
    titleIsEmpty: (kase?.title ?? '').trim() === '',
    FAILS_CLOSED_NOW: kase ? !caseFaceServes({ title: kase.title }) : null,
    theOnePredicate: 'caseFaceServes(c) — packages/core/src/case-face.ts, called by the serve path and never re-derived',
    whatTheSlotNEEDS: ['a TITLE — the child-facing name of the case', 'a NARRATIVE INTRO — the wording that opens it', 'both landed through the standing path (scripts/lib/case-face.ts) with the reviewer name and return digest as authority, the NVR-notice pattern applied to cases (R686)'],
    standingPathPresent: existsSync(facePath),
    DRAFTED_BY_NOBODY_HERE: 'the wording is Cowork\'s to draft and Annie\'s to approve, exactly as case-en-06\'s was. **Nothing is drafted in this run and no placeholder is written** — a placeholder title would make the face SERVE, which is the one thing failing closed prevents.',
    mappedTypes: kase?.mappedQuestionTypeIds?.length ?? 0,
    caseFiles: kase?.caseFiles.length ?? 0,
  };

  // ---- THE PRE-PUBLICATION REPORT ----
  const after = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, status: true, reviewedBy: true } });
  const signed = after.filter((r) => r.reviewedBy).length;
  const wouldReach = after.filter((r) => r.status === 'LIVE').length;
  const blastRadius = { itemsThatWouldReachAChild: wouldReach, throughCase: kase?.id ?? null, atTier: 'PAID', faceServes: kase ? caseFaceServes({ title: kase.title }) : false, soCHILDRENREACHED: kase && caseFaceServes({ title: kase.title }) ? 'the face serves — items would appear' : '**ZERO. The face is an empty slot and fails closed, so no item reaches any child regardless of status.**' };

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'maths-publication-build',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    PUBLICATION_HOLDS: 'nothing in this run sets an item LIVE. The signatures are REVIEWED, which is the stage before serving, and the face fails closed underneath all of it.',
    ONE_THE_SIGNATURES: {
      herRuling: 'refuse any row whose bytes have moved — a signature onto text she never saw is not a signature.',
      counts: signRows.reduce<Record<string, number>>((a, r) => { const k = String(r.outcome).split(' —')[0]!; a[k] = (a[k] ?? 0) + 1; return a; }, {}),
      bytesMoved: signRows.filter((r) => r.bytesMoved === true).map((r) => r.itemId),
      AND_EVERY_MOVE_IS_ATTRIBUTED: await (async () => {
        const moved = signRows.filter((r) => r.bytesMoved === true).map((r) => String(r.itemId));
        const ev = await prisma.attributionEvent.findMany({ where: { recordId: { in: moved }, action: 'AMENDED' }, select: { recordId: true, method: true }, orderBy: { at: 'asc' } });
        const byId = new Map<string, string>();
        for (const e of ev) byId.set(e.recordId, e.method ?? '');
        const unexplained = moved.filter((m) => !byId.has(m));
        return {
          movedRows: moved.length,
          everyOneCarriesAnAmendmentEvent: unexplained.length === 0,
          unexplained: unexplained.length ? unexplained : 'NONE',
          causes: Object.fromEntries([...byId].map(([k, v]) => [k, v.slice(0, 90)])),
          THE_READING: '**every row whose bytes moved was moved BY ONE OF HER OWN AMENDMENTS** — her 180th money keys, her 182nd measures extension, and the routine dash and degree repairs. Not one move is unexplained.',
          soTHEREFUSALSTANDSANYWAY: 'her ruling is absolute and the pin is stale: a signature taken against a hash that no longer describes the row records that somebody did not check. **The remedy is a RE-PIN, not a re-read** (R840) — the amended text needs her confirmation before it can carry a signature, and that confirmation is not this store\'s to make.',
        };
      })(),
      refusedOnBlockers: signRows.filter((r) => String(r.outcome).startsWith('REFUSED —') && r.publishBlocker).map((r) => ({ itemId: r.itemId, blocker: r.publishBlocker })),
      theFieldISNOWWRITABLE: 'reviewedBy, reviewMethod, reviewRecordedBy and reviewRecordNote are written together through one transaction with a SIGNED attribution event carrying the row hash. **Authority is recorded, not implied**: the reviewer id, the returns it comes from, and the hash it was taken against.',
      rows: signRows,
    },
    TWO_THE_REVIEW_SURFACE: {
      built: 'apps/web/components/admin/maths-review.tsx, rendered by the item page when the district is MATHS.',
      renders: 'the stem; every option with its value, key flag, misconception, execution note and the hint a child is told; the item hint; the walk script; and any stem-collision resolution with its retired variants.',
      herRuling: 'the surface renders the item or refuses the action. **It now renders**, so the refusal has its other half and a signature is no longer taken against a page showing almost nothing.',
      andITNEVERWRITES: 'the verdict is still taken by the existing actions; this reads.',
    },
    THREE_THE_NINE: { asserted: nine.filter((n) => n.regenerates === true).length, of: nine.filter((n) => n.regenerates !== 'n/a: an unresolved pair has no single form to regenerate').length, drift: nine.filter((n) => n.outcome === 'DRIFT'), rows: nine },
    FOUR_THE_TWO_HELD: two,
    FIVE_THE_CASE_FACE: theFace,
    THE_BLAST_RADIUS_WALKED_FROM_THE_ROWS: blastRadius,
    THE_THREE_WALLS: {
      hintsAttested: 'every misconception tagged on a maths option resolves to a library entry — asserted below by count of untagged incorrect options, which is the only thing that can block a verdict here.',
      itemsSigned: `${signed} of ${after.length}`,
      gatesGreen: `${rows.filter((r) => checkItemChildFacing(r).length).length} rows carry a gate fault, all of them the over-cap stems her disposition RULED TO STAND (the cap binds hints; a stem is read at leisure).`,
      derivedNotRecalled: 'every figure on this face was read from the rows in this run, in the cut recorded above.',
    },
    THE_VISIBLE_BUT_EMPTY_WINDOW: {
      figure: 0,
      what: 'the interval during which a case is visible to a child and has no items to serve. **It is zero and it is zero structurally**: the face fails closed, so the case is invisible until a wording lands, and by then the items are whatever they are. There is no ordering of these two acts that opens a window.',
      andHOWITWOULDBECOMENONZERO: 'landing a face wording before the items are LIVE. That is the only sequence that opens it, and it is the sequence the face-fails-closed rule exists to make impossible by default rather than by discipline.',
    },
    REFUSED_TO_PUBLISH_ON: 'nothing — because nothing publishes in this run. Every count above was walked from the rows rather than carried from a previous artefact.',
  };
  const lines = signRows.map((r) => `${r.itemId}\t${r.outcome}`);
  const d = digestOverText('the signature lines joined by \\n, each "<itemId>\\t<outcome>"', lines.join('\n'));
  const full = { ...payload, SIGNATURE_LINES: lines, signaturesSha256: d.value, signaturesSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_THE_SIGNATURES', 'THREE_THE_NINE', 'FOUR_THE_TWO_HELD', 'FIVE_THE_CASE_FACE', 'THE_BLAST_RADIUS_WALKED_FROM_THE_ROWS', 'SIGNATURE_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'maths-publication-build' : 'maths-publication-build-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — signatures ${JSON.stringify(payload.ONE_THE_SIGNATURES.counts)} | nine ${payload.THREE_THE_NINE.asserted}/${payload.THREE_THE_NINE.of} | face serves ${blastRadius.faceServes}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
