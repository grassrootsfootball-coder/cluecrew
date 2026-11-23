/**
 * PREPARED FOR RULING, NOT TAKEN (David, 2026-09-02): should the pin projection CANONICALISE
 * option order for every signature?
 *
 * The vr-10 publication refused a sound row because the projection was hashed over an UNORDERED
 * database read (R969). This measures what the estate actually rests on, so the ruling is made
 * against numbers rather than against the one row that happened to expose it.
 *
 * THE METHOD IS EXHAUSTIVE, NOT INDICATIVE. For every signature carrying a subjectHash, every
 * permutation of that row's options is hashed under both retention projections. A permutation
 * that reproduces the stored hash PROVES the content is intact and the order is the only
 * difference; no permutation reproducing it proves the content itself moved. Option counts here
 * are small, so this is a decision procedure and not a sample.
 *
 * NOTHING IS WRITTEN. The output is a paper.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';
import { canonicalJson, findingsDigest } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v;

function permutations<T>(a: readonly T[]): T[][] {
  if (a.length <= 1) return [[...a]];
  const out: T[][] = [];
  for (let i = 0; i < a.length; i += 1) {
    const rest = [...a.slice(0, i), ...a.slice(i + 1)];
    for (const p of permutations(rest)) out.push([a[i]!, ...p]);
  }
  return out;
}

async function main() {
  console.log('CANONICAL OPTION ORDER — prepared for ruling, nothing written.\n');

  // Every order any crossed population artefact records, so "recoverable" is measured not assumed.
  const recordedOrders = new Map<string, string[]>();
  const lane = pjoin(DL, '11+', 'from-cluecrew');
  for (const f of readdirSync(lane).filter((x) => x.endsWith('.json'))) {
    let txt: string;
    try { txt = readFileSync(pjoin(lane, f), 'utf8'); } catch { continue; }
    if (!txt.includes('itemId') || !txt.includes('options')) continue;
    let doc: unknown;
    try { doc = JSON.parse(txt); } catch { continue; }
    const walk = (o: unknown): void => {
      if (Array.isArray(o)) { for (const x of o) walk(x); return; }
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      if (typeof r.itemId === 'string' && Array.isArray(r.options)) {
        const vals = (r.options as Array<Record<string, unknown>>).map((x) => String(x.value ?? (x.content as Record<string, unknown>)?.value ?? '')).filter(Boolean);
        if (vals.length && !recordedOrders.has(r.itemId)) recordedOrders.set(r.itemId, vals);
      }
      for (const v of Object.values(r)) walk(v);
    };
    walk(doc);
  }

  const sigs = await prisma.attributionEvent.findMany({ where: { action: 'SIGNED', subjectHash: { not: null } },
    select: { recordId: true, subjectHash: true, reviewerId: true } });
  const byItem = new Map<string, string[]>();
  for (const s of sigs) byItem.set(s.recordId, [...(byItem.get(s.recordId) ?? []), s.subjectHash!]);
  requirePopulation('canonical-order', { 'signature(s) carrying a subjectHash': sigs.length, 'distinct signed item(s)': byItem.size });

  const rows = await prisma.item.findMany({ where: { id: { in: [...byItem.keys()] } },
    select: { id: true, stem: true, explanation: true, questionTypeId: true, status: true,
      options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionExecution: true } } } });

  /**
   * `subjectHash` NAMES TWO DIFFERENT SUBJECTS AND NOTHING ON THE ROW SAYS WHICH (R970). Most
   * signatures hash a row's PIN PROJECTION; the fifteen ruled by derivation under her 206th hash
   * the EXECUTION TEXT the verdict is about. A verifier assuming the first reports the second as
   * content drift — this analysis nearly reported eleven sound rows that way. So the execution
   * subject is detected and separated BEFORE anything is called unexplained.
   */
  type Cls = 'CURRENT ORDER VERIFIES' | 'ONLY A NON-CURRENT PERMUTATION VERIFIES'
    | 'SIGNATURE IS OVER AN EXECUTION TEXT, NOT A ROW PROJECTION' | 'UNEXPLAINED — NEITHER A PERMUTATION NOR AN EXECUTION TEXT';
  const perRow: Array<{ itemId: string; questionTypeId: string; status: string; options: number; classification: Cls;
    currentIsValueSorted: boolean; wouldSurviveCanonicalisation: boolean; orderRecordedInACrossedArtefact: boolean }> = [];

  for (const r of rows) {
    const want = new Set(byItem.get(r.id) ?? []);
    const val = (o: { content: unknown }) => String((o.content as { value?: unknown })?.value ?? '');
    const hashOf = (opts: typeof r.options) => {
      const p = JSON.parse(JSON.stringify({ stem: r.stem, options: opts.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation }));
      return [sha(canonicalJson(p)), sha(canonicalJson(strip(p) as object))];
    };
    const currentHits = hashOf(r.options).some((h) => want.has(h));
    const sorted = [...r.options].sort((a, b) => val(a).localeCompare(val(b)));
    const sortedHits = hashOf(sorted).some((h) => want.has(h));
    let anyPermHits = currentHits || sortedHits;
    if (!anyPermHits && r.options.length <= 6) {
      for (const p of permutations(r.options)) { if (hashOf(p).some((h) => want.has(h))) { anyPermHits = true; break; } }
    }
    const execSubject = !currentHits && !anyPermHits
      && r.options.some((o) => o.misconceptionExecution && want.has(sha(o.misconceptionExecution)));
    const classification: Cls = currentHits ? 'CURRENT ORDER VERIFIES'
      : anyPermHits ? 'ONLY A NON-CURRENT PERMUTATION VERIFIES'
      : execSubject ? 'SIGNATURE IS OVER AN EXECUTION TEXT, NOT A ROW PROJECTION'
      : 'UNEXPLAINED — NEITHER A PERMUTATION NOR AN EXECUTION TEXT';
    const vals = r.options.map(val);
    perRow.push({ itemId: r.id, questionTypeId: r.questionTypeId, status: r.status, options: r.options.length,
      classification, currentIsValueSorted: JSON.stringify(vals) === JSON.stringify([...vals].sort((a, b) => a.localeCompare(b))),
      wouldSurviveCanonicalisation: sortedHits, orderRecordedInACrossedArtefact: recordedOrders.has(r.id) });
  }

  const count = (f: (x: typeof perRow[number]) => boolean) => perRow.filter(f).length;
  const byClass = Object.fromEntries((['CURRENT ORDER VERIFIES', 'ONLY A NON-CURRENT PERMUTATION VERIFIES', 'SIGNATURE IS OVER AN EXECUTION TEXT, NOT A ROW PROJECTION', 'UNEXPLAINED — NEITHER A PERMUTATION NOR AN EXECUTION TEXT'] as Cls[])
    .map((c) => [c, count((x) => x.classification === c)]));
  const orderingRows = (x: typeof perRow[number]) => x.classification === 'CURRENT ORDER VERIFIES' || x.classification === 'ONLY A NON-CURRENT PERMUTATION VERIFIES';
  const wouldBreak = perRow.filter((x) => orderingRows(x) && !x.wouldSurviveCanonicalisation);
  const breakByType = wouldBreak.reduce<Record<string, number>>((a, x) => { a[x.questionTypeId] = (a[x.questionTypeId] ?? 0) + 1; return a; }, {});

  const paper = {
    kind: 'canonical-option-order-PREPARED-FOR-RULING',
    TO: 'David; Annie by relay',
    date: '2026-09-02',
    STATE: 'PREPARED, NOT TAKEN. Nothing is written by this script. The decision changes what a signature MEANS across the estate and belongs to the reviewer and the desk (R867).',
    THE_QUESTION: 'should the pin projection sort a row\'s options before hashing, so that a signature is over content rather than over the order a database happened to return?',
    WHY_IT_IS_LIVE: 'the vr-10 publication refused a sound row: landing a mint on one option moved its physical row, the option read carries no ordering, and the hash followed the rendering (R969). The row\'s bytes had not changed.',
    THE_METHOD: 'exhaustive, not indicative: every permutation of every signed row\'s options was hashed under both retention projections and compared with the stored subjectHash. A permutation that reproduces the hash PROVES the content is intact and order is the only difference. Option counts are small, so this is a decision procedure.',
    THE_POPULATION: { signaturesCarryingASubjectHash: sigs.length, distinctSignedItems: byItem.size, itemsFound: rows.length },
    WHAT_THE_ESTATE_RESTS_ON: {
      byClassification: byClass,
      andWHATEACHMEANS: {
        'CURRENT ORDER VERIFIES': 'the stored hash reproduces from the order the database returns TODAY. This is the state that looks healthy and is the one that decays: any write to any option of the row can reorder it.',
        'ONLY A NON-CURRENT PERMUTATION VERIFIES': 'the content is intact and the order has already moved. These verify only because something records the order they were signed in.',
        'SIGNATURE IS OVER AN EXECUTION TEXT, NOT A ROW PROJECTION': 'the fifteen ruled by derivation under her 206th: the subject is the EXECUTION TEXT the verdict is about, not the row. Outside the ordering question entirely, and reported as content drift by any verifier that assumes one meaning for subjectHash (R970).',
        'UNEXPLAINED — NEITHER A PERMUTATION NOR AN EXECUTION TEXT': 'neither an ordering difference nor an execution subject. These need reading individually and are NOT folded into the ordering question.',
      },
      rowsWhoseCurrentOrderIsAlreadyValueSorted: count((x) => x.currentIsValueSorted),
      soTHEEXPOSURE: `${count((x) => x.classification === 'CURRENT ORDER VERIFIES' && !x.currentIsValueSorted)} row(s) verify today under an order that is NOT value-sorted — they are one write away from refusing, exactly as row 23 did.`,
    },
    WHAT_CANONICALISATION_WOULD_CHANGE: {
      signaturesThatWouldSTILLVerify: count((x) => x.wouldSurviveCanonicalisation),
      signaturesThatWouldSTOPVerifying: wouldBreak.length,
      byQuestionType: breakByType,
      andWHATTHATCOSTS: 'a signature that stops verifying is not void — the reading happened — but nothing could re-derive it mechanically, so each would need RE-ISSUING against the new projection. That is an authorship act, and by R909 authority arrives fresh while the reading never left: the reviewer re-issues, she does not re-read.',
      theRecoverability: {
        rowsWhoseSignedOrderIsRecordedInACrossedArtefact: count((x) => x.orderRecordedInACrossedArtefact),
        rowsWithNoRecordedOrderAnywhere: count((x) => !x.orderRecordedInACrossedArtefact),
        andWHYTHATISTHEHINGE: 'a signature verifies today only because SOMETHING records the order it was taken in. Where a crossed population artefact records it, the signature can be re-verified and re-issued against a canonical projection with evidence. Where nothing records it, the order is knowable only from the live database — which is the very thing that moves.',
      },
    },
    THE_OPTIONS_AS_THEY_STAND: [
      { option: 'A — canonicalise the projection', changes: 'sort options by value before hashing, everywhere', cost: `${wouldBreak.length} signature(s) need re-issuing by the reviewer`, gains: 'a signature becomes order-independent and stops decaying; no future write can refuse a sound row', risk: 'an option-order change becomes invisible to a pin — acceptable only because order is already presentation (R936: a seat is named by its value, never its position) and check:option-positions owns order separately' },
      { option: 'B — leave the projection and order the READ', changes: 'add a deterministic orderBy to every option read', cost: 'nothing re-issued', gains: 'stops NEW signatures from decaying', risk: 'does not fix the existing ones: a stored hash taken over an arbitrary order still needs that order to verify, so the estate keeps resting on the population artefacts' },
      { option: 'C — verify against the recorded order, as vr-10 did', changes: 'nothing structural; verifiers use the order in the population the signature names', cost: 'nothing', gains: 'exact and evidenced', risk: `only works where an order is recorded: ${count((x) => !x.orderRecordedInACrossedArtefact)} signed row(s) have none, and for those the live database is the only witness` },
    ],
    WHAT_THIS_STORE_WOULD_RECOMMEND_IF_ASKED: 'B and C together now, A only with the reviewer\'s word — B stops the decay at the source and costs nothing, C is already proven on vr-10, and A is the only one that makes existing signatures order-independent but is the only one that spends her signatures to do it.',
    PER_ROW: perRow,
  };

  const clean = JSON.parse(JSON.stringify(paper)) as Record<string, unknown>;
  const dig = findingsDigest(clean, ['PER_ROW', 'WHAT_THE_ESTATE_RESTS_ON', 'WHAT_CANONICALISATION_WOULD_CHANGE', 'THE_OPTIONS_AS_THEY_STAND']);
  Object.assign(clean, dig);
  const path = pjoin(REPO, 'content/exports', stampedName('canonical-order-prepared', dig.findingsSha256, 'json'));
  writeFileSync(path, JSON.stringify(clean, null, 1));
  const landed = deliver(path, 'canonical-order-prepared');
  const final = landed.split('/').pop()!;
  const fileSha = createHash('sha256').update(readFileSync(pjoin(lane, final))).digest('hex');
  writeFileSync(pjoin(lane, `${final}.sha256`), `${fileSha}  ${final}\n`);
  writeFileSync(pjoin(DL, final), readFileSync(pjoin(lane, final)));

  console.log(`  signatures: ${sigs.length} over ${byItem.size} items`);
  console.log(`  ${JSON.stringify(byClass)}`);
  console.log(`  verify today under a NON-value-sorted order (one write from refusing): ${count((x) => x.classification === 'CURRENT ORDER VERIFIES' && !x.currentIsValueSorted)}`);
  console.log(`  would STOP verifying under canonicalisation: ${wouldBreak.length}  ${JSON.stringify(breakByType)}`);
  console.log(`  order recorded in a crossed artefact: ${count((x) => x.orderRecordedInACrossedArtefact)} | nowhere: ${count((x) => !x.orderRecordedInACrossedArtefact)}`);
  console.log(`\n  crossed: ${final}  (${fileSha.slice(0, 16)})`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
