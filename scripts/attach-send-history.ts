/**
 * A ROW'S SEND HISTORY, AS A PROPERTY (Annie's ruling, 2026-08-30 — R901).
 *
 * **Six rows served children on bytes from a withdrawn send, and the only record that they had was
 * prose in an `AttributionEvent`.** Nothing read it, so nothing enforced it (R601), and answering
 * "which of the 187 came from the withdrawn send" took a conversation and four queries against a
 * table no gate consults. **Provenance answerable only by conversation is provenance that will be
 * wrong the next time nobody asks.**
 *
 * So every row carries, on `Item.sendHistory`, the sends that hold its id: the filename, the
 * digest, the row count of that send, and whether the send was WITHDRAWN. `check:withdrawn-serving`
 * is the assertion; this is what makes the next question answerable without one.
 *
 *  - DERIVED BY SCANNING THE SENDS, NEVER HAND-KEPT (R57). A list would drift the first time a send
 *    crossed that nobody added to it.
 *  - OUTSIDE THE PIN PROJECTION. `sendHistory` is an Item column, not part of
 *    {stem, options, explanation}, so recording provenance cannot falsify a signature — the exact
 *    fault R858 closed. Asserted per row before and after.
 *  - A SEND IS MARKED WITHDRAWN FROM THE STORE'S OWN EVENTS, not from its filename. The withdrawal
 *    is a fact about a send, recorded once, and read here rather than re-derived from a guess about
 *    which file is which.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const DOWNLOADS = pjoin(homedir(), 'Downloads');

const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v;
const pinHash = (r: { stem: unknown; explanation: unknown; options: Array<{ content: unknown; isCorrect: boolean }> }) =>
  sha(canonicalJson(strip({ stem: r.stem, options: r.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation }) as object));

function* rowsIn(o: unknown): Generator<{ itemId: string }> {
  if (Array.isArray(o)) { for (const v of o) yield* rowsIn(v); return; }
  if (o && typeof o === 'object') {
    const r = o as Record<string, unknown>;
    if (typeof r.itemId === 'string' && Array.isArray(r.options)) yield r as { itemId: string };
    for (const v of Object.values(r)) yield* rowsIn(v);
  }
}

interface Send { file: string; digest: string; rowCount: number; ids: Set<string> }

/** Every crossed artefact that reads as a send of maths items. Derived, never listed. */
function sends(): Send[] {
  const out: Send[] = [];
  for (const name of readdirSync(DOWNLOADS).filter((n) => n.endsWith('.json')).sort()) {
    let text: string;
    try { text = readFileSync(pjoin(DOWNLOADS, name), 'utf8'); } catch { continue }
    if (!text.includes('itemId')) continue;
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { continue }
    const ids = new Set<string>();
    for (const r of rowsIn(parsed)) if (/^MC\d/.test(r.itemId)) ids.add(r.itemId);
    if (ids.size === 0) continue;
    out.push({ file: name, digest: sha(text), rowCount: ids.size, ids });
  }
  if (out.length === 0) throw new Error(`no crossed artefact reads as a maths send under ${DOWNLOADS} — refusing a blind scan (R173)`);
  return out;
}

async function run() {
  assertFixture('send-scan', [
    { name: 'the scan finds more than one send', input: 'count', mustBeCaught: true },
    { name: 'every send it returns holds at least one id', input: 'nonempty', mustBeCaught: true },
    { name: 'a send is never returned with zero rows', input: 'zero', mustBeCaught: false },
  ], (k) => {
    const s = sends();
    if (k === 'count') return s.length > 1;
    if (k === 'nonempty') return s.every((x) => x.ids.size > 0);
    return s.some((x) => x.rowCount === 0);
  });

  const all = sends();
  /** Which sends the STORE records as withdrawn — read from its own events, never from a filename. */
  const withdrawnMarkers = await prisma.attributionEvent.findMany({ where: { method: { contains: 'send was WITHDRAWN' } }, select: { recordId: true, method: true } });
  const withdrawnIds = new Set(withdrawnMarkers.map((e) => e.recordId));
  /**
   * THE ROLES ARE DERIVED FROM MEMBERSHIP, AND THE FIRST ATTEMPT WAS USELESS. Marking a send
   * withdrawn because it CONTAINS the marked ids matched every superset and reported 187 of 187
   * rows "appearing in a withdrawn send" — a figure claiming a population far wider than the thing
   * behind it (R591), and worthless to a reader. The roles that mean something:
   *
   *  - THE REPLACEMENT omits every marked id. That is its defining property, not its filename.
   *  - THE WITHDRAWN SEND carries them AND has the membership the replacement replaced.
   *  - THE VERIFIED POPULATION is this store's own export of that same membership (1d7f9cf4…) —
   *    which is why her 182nd covers rows later withdrawn, and why restoring two of them was sound.
   *    Labelling it "a withdrawn send" would have been false: it is an export, not a send.
   */
  const replacements = all.filter((s) => [...withdrawnIds].every((id) => !s.ids.has(id)) && s.rowCount > 100);
  const replacementIds = new Set(replacements.flatMap((s) => [...s.ids]));
  const carriesWithdrawn = all.filter((s) => [...withdrawnIds].some((id) => s.ids.has(id)) && s.rowCount > 100);
  const isOurExport = (f: string) => f.includes('for-annie') || f.includes('FORANNIE');
  const withdrawnSends = new Set(carriesWithdrawn.filter((s) => !isOurExport(s.file)).map((s) => s.file));
  const verifiedPopulationExports = new Set(carriesWithdrawn.filter((s) => isOurExport(s.file)).map((s) => s.file));
  if (replacements.length === 0 || withdrawnSends.size === 0) {
    throw new Error('the sends do not resolve into a withdrawn set and a replacement — refusing to label roles I cannot derive (R173)');
  }
  /**
   * A ROLE THAT MATCHES EVERYTHING IS NOT A ROLE (R902). The containment version of this test
   * matched every superset and put all 26 artefacts in one class. A classifier returning the whole
   * population has no discriminating power, and it reports as confidently as one that has.
   */
  if (withdrawnSends.size >= all.length || replacements.length >= all.length) {
    throw new Error(`a role matched ${Math.max(withdrawnSends.size, replacements.length)} of ${all.length} artefacts — a classifier that returns the whole population is not classifying (R902)`);
  }

  const rows = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } },
    select: { id: true, stem: true, explanation: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true } } } });
  requirePopulation('attach:send-history', { 'MATHS row(s)': rows.length, 'crossed send(s) scanned': all.length });

  const built = rows.map((r) => {
    const inSends = all.filter((s) => s.ids.has(r.id));
    return { itemId: r.id, pinBefore: pinHash(r),
      history: {
        sends: inSends.map((s) => ({ file: s.file, sha256: s.digest, rowsInThatSend: s.rowCount,
          role: withdrawnSends.has(s.file) ? 'WITHDRAWN SEND'
            : verifiedPopulationExports.has(s.file) ? 'this store\'s export of the verified population'
            : replacements.some((x) => x.file === s.file) ? 'replacement send'
            : 'other crossed artefact' })),
        sendCount: inSends.length,
        inTheWithdrawnSend: inSends.some((s) => withdrawnSends.has(s.file)),
        inTheReplacement: replacementIds.has(r.id),
        appearsInAWithdrawnSend: inSends.some((s) => withdrawnSends.has(s.file)) && !replacementIds.has(r.id),
        markedByAWithdrawal: withdrawnIds.has(r.id),
        derivedAt: '2026-08-30', derivedBy: 'scripts/attach-send-history.ts — scanned, never hand-kept (R57)',
        andWHATTHISISNOT: 'not an authority. A row appearing in a withdrawn send may still serve if a LATER authority reaches it; check:withdrawn-serving is what tests that, and this is what makes the question answerable by query.',
      } };
  });

  if (APPLY) {
    await prisma.$transaction(async (tx) => {
      for (const b of built) {
        await tx.item.update({ where: { id: b.itemId }, data: { sendHistory: b.history } });
        const after = await tx.item.findUniqueOrThrow({ where: { id: b.itemId }, select: { stem: true, explanation: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true } } } });
        if (pinHash(after) !== b.pinBefore) throw new Error(`${b.itemId}: writing sendHistory moved the pinned projection — rolling back`);
      }
    });
  }

  const noHistory = built.filter((b) => b.history.sendCount === 0);
  const inWithdrawn = built.filter((b) => b.history.appearsInAWithdrawnSend);
  const full = {
    kind: 'send-history-attached', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_RULING: 'rows carry their send history as a property, traceable by query rather than by memory (Annie, 2026-08-30).',
    andWHY: 'six rows served children on withdrawn bytes and the only record was prose in an AttributionEvent that nothing read. Answering "which came from the withdrawn send" took a conversation; it now takes a query.',
    THE_PIN_IS_UNTOUCHED: 'sendHistory is an Item column, outside {stem, options, explanation}, so recording provenance cannot falsify a signature (R858). Asserted per row inside the transaction.',
    sendsScanned: all.map((s) => ({ file: s.file, sha256: s.digest.slice(0, 16), rows: s.rowCount, withdrawn: withdrawnSends.has(s.file) })).slice(0, 40),
    counts: { rows: rows.length, sendsScanned: all.length, withdrawnSends: withdrawnSends.size,
      rowsInTheWithdrawnSendAndNotTheReplacement: inWithdrawn.length,
      rowsMarkedByAWithdrawal: [...withdrawnIds].length,
      replacementSends: replacements.length, verifiedPopulationExports: verifiedPopulationExports.size,
      rowsWithNoSendAtAll: noHistory.length },
    rowsWithNoSendAtAll: noHistory.map((b) => b.itemId),
    andWHATAZEROMEANS: 'a row in no crossed send is not necessarily wrong — it may predate the sends or have been authored here — but it is the class nobody could previously see at all, so it is named rather than counted.',
  };
  const lines = built.map((b) => `${b.itemId}\t${b.history.sendCount}\t${b.history.appearsInAWithdrawnSend ? 'IN-WITHDRAWN' : 'clean'}`);
  const d = digestOverText('one line per row, "<id>\\t<sendCount>\\t<withdrawn?>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['counts', 'sendsScanned', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'send-history-attached' : 'send-history-attached-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n  ${rows.length} rows · ${all.length} sends scanned · ${withdrawnSends.size} withdrawn`);
  console.log(`  rows appearing in a withdrawn send: ${inWithdrawn.length} · marked by a withdrawal: ${withdrawnIds.size} · in no send at all: ${noHistory.length}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
