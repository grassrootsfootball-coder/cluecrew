/**
 * THE MIGRATION R358 DEFERRED (R1042): every superseded value moves OUT of the field it supersedes,
 * into the `superseded` sibling column on `Item` / `ItemOption` — Cowork's `_superseded` shape.
 *
 * WHY A COLUMN AND NOT ATTRIBUTION EVENTS OR DOOR CHANGESETS. An AttributionEvent records an ACT, with
 * an actor and a time; most of these values carry neither (R358's August 36 pre-date every changeset),
 * and writing them as events would invent the act (R98, R94). Changesets hold the R1037 rounds only and
 * live in files, not the store. The column keeps every value verbatim, on its own row, with the exact
 * path and key it sat under — so the pre-move container is RECONSTRUCTABLE, and this script proves it.
 *
 * CLASSIFY BEFORE WRITING (R62). Every row is classified before a single write, and the run refuses if:
 *   · lifting the keys out changes the retention-EXCLUDED projection (it must not — that projection is
 *     what the child sees and what every signature since 2026-09-02 is over);
 *   · restoring the lifted entries does not reproduce the stored container exactly (nothing lost);
 *   · a stored signature or approval would stop reproducing (it was taken over the retention-INCLUDED
 *     projection) and the reviewed door has not SIGNED that row again — R62's reviewed-and-would-change.
 *     Those rows go through `content/agent-review/superseded-move/`: this script writes the packet, a
 *     separate reviewing agent writes `verdicts.json` as `rev-agent-01`, and only a SIGN lets the row move.
 *     A signature is never voided silently.
 * A signature that reproduces under NO projection today (UNKNOWN) cannot be changed by the move: after
 * it the row's included projection equals its excluded one, which that hash already fails to match.
 *
 *   tsx scripts/move-superseded-outside-field.ts --packet    write the door packet for the rows whose pins move
 *   tsx scripts/move-superseded-outside-field.ts             dry run: classify and report, write nothing
 *   tsx scripts/move-superseded-outside-field.ts --apply     move, record, re-sign through the door, re-export
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { Prisma, prisma } from '../packages/db/src/index';
import { recordSignature } from '../packages/db/prisma/reviewed-guard';
import { SIGNATURE_SUBJECTS } from '../packages/core/src/signature-subject';
import { exportContentSnapshot } from './content-snapshot';
import { pinHashes, canonicalOrderHash, type PinRow } from './lib/pin-projection';
import { canonicalJson } from './lib/findings-digest';
import { requirePopulation } from './lib/population';
import { findInside, withoutSuperseded, restoreInto, sameJson, readColumn, describe, type SupersededEntry } from './lib/superseded';

const APPLY = process.argv.includes('--apply');
const PACKET = process.argv.includes('--packet');
const DOOR_DIR = pjoin(__dirname, '..', 'content', 'agent-review', 'superseded-move');
const REVIEWER = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const RULING = 'R1042';
const METHOD = `${RULING} (carrying out R358): superseded \`_\`-keys lifted out of stem/explanation/option content into the superseded sibling column, verbatim, with path and key; retention-excluded projection proven unchanged and the pre-move container proven reconstructable before writing.`;
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const permute = <T,>(a: T[]): T[][] => a.length <= 1 ? [a] : a.flatMap((x, i) => permute([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));

type Row = Awaited<ReturnType<typeof readRows>>[number];
async function readRows(db: Prisma.TransactionClient | typeof prisma, ids?: string[]) {
  return db.item.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    select: { id: true, status: true, questionTypeId: true, stem: true, explanation: true, superseded: true,
      options: { select: { id: true, content: true, isCorrect: true, superseded: true }, orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });
}
const pin = (r: { stem: unknown; explanation: unknown; options: Array<{ content: unknown; isCorrect: boolean }> }): PinRow =>
  ({ stem: r.stem, explanation: r.explanation, options: r.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })) });
const preImageDigest = (r: Row) => sha(canonicalJson({ stem: r.stem, explanation: r.explanation, options: r.options.map((o) => ({ id: o.id, content: o.content })) } as object));

interface Plan {
  row: Row;
  itemEntries: SupersededEntry[];
  optionEntries: Map<string, SupersededEntry[]>;
  after: { stem: unknown; explanation: unknown; options: Array<{ id: string; content: unknown; isCorrect: boolean }> };
  digest: string;
}

function plan(r: Row): Plan | null {
  const itemEntries = [...findInside(r.stem, 'stem'), ...findInside(r.explanation, 'explanation')];
  const optionEntries = new Map(r.options.map((o) => [o.id, findInside(o.content, 'content')] as const).filter(([, e]) => e.length > 0));
  if (itemEntries.length === 0 && optionEntries.size === 0) return null;
  const after = {
    stem: withoutSuperseded(r.stem), explanation: withoutSuperseded(r.explanation),
    options: r.options.map((o) => ({ id: o.id, content: withoutSuperseded(o.content), isCorrect: o.isCorrect })),
  };
  // NOTHING LOST: the lifted entries put back must reproduce what is stored, exactly.
  const fail = (what: string) => { throw new Error(`${r.id}: ${what} — refusing the whole run before any write (R62)`); };
  if (!sameJson(restoreInto(after.stem, itemEntries.filter((e) => e.container === 'stem')), r.stem)) fail('stem does not reconstruct');
  if (!sameJson(restoreInto(after.explanation, itemEntries.filter((e) => e.container === 'explanation')), r.explanation)) fail('explanation does not reconstruct');
  for (const o of r.options) if (!sameJson(restoreInto(withoutSuperseded(o.content), optionEntries.get(o.id) ?? []), o.content)) fail(`option ${o.id} does not reconstruct`);
  // THE CHILD-FACING PROJECTION DOES NOT MOVE.
  if (pinHashes(pin(r)).retentionExcluded !== pinHashes(pin(after)).retentionExcluded) fail('retention-excluded projection would change');
  if (canonicalOrderHash(pin(r)) !== canonicalOrderHash(pin(after))) fail('canonical-order projection would change');
  if (findInside(after.stem, 'stem').length + findInside(after.explanation, 'explanation').length + after.options.reduce((n, o) => n + findInside(o.content, 'content').length, 0) > 0) fail('a `_`-key survived the lift');
  return { row: r, itemEntries, optionEntries, after, digest: preImageDigest(r) };
}

type SigClass = 'REPRODUCES — over the excluded projection, unchanged by the move' | 'MOVES — over the included projection' | 'UNKNOWN — reproduces under no projection now, and the move cannot change that';
function classifySignature(r: Row, hash: string): SigClass {
  let inc = false;
  for (const order of permute([...pin(r).options])) {
    const h = pinHashes({ ...pin(r), options: order });
    if (h.retentionExcluded === hash) return 'REPRODUCES — over the excluded projection, unchanged by the move';
    if (h.retentionIncluded === hash) inc = true;
  }
  return inc ? 'MOVES — over the included projection' : 'UNKNOWN — reproduces under no projection now, and the move cannot change that';
}

interface Verdicts { door: string; reviewer: string; rows: Array<{ itemId: string; preImageSha256: string; verdict: 'SIGN' | 'HOLD'; reason?: string }> }

async function main() {
  const rows = await readRows(prisma);
  for (const r of rows) { readColumn(r.superseded); r.options.forEach((o) => readColumn(o.superseded)); }
  const plans = rows.map(plan).filter((p): p is Plan => p !== null);
  requirePopulation('move-superseded-outside-field', { 'items read': rows.length });

  const events = await prisma.attributionEvent.findMany({
    where: { recordType: 'item', recordId: { in: plans.map((p) => p.row.id) }, subjectHash: { not: null } },
    select: { id: true, recordId: true, action: true, actor: true, at: true, subjectHash: true, subjectSpec: true },
  });
  const tally = new Map<string, number>();
  const moves = new Map<string, typeof events>();
  for (const e of events) {
    const c = classifySignature(plans.find((p) => p.row.id === e.recordId)!.row, e.subjectHash!);
    tally.set(`${e.action} · ${c}`, (tally.get(`${e.action} · ${c}`) ?? 0) + 1);
    if (c.startsWith('MOVES')) moves.set(e.recordId, [...(moves.get(e.recordId) ?? []), e]);
  }

  const itemEntryCount = plans.reduce((n, p) => n + p.itemEntries.length, 0);
  const optionEntryCount = plans.reduce((n, p) => n + [...p.optionEntries.values()].reduce((m, e) => m + e.length, 0), 0);
  const byStatus = plans.reduce((m, p) => m.set(p.row.status, (m.get(p.row.status) ?? 0) + 1), new Map<string, number>());
  console.log(`\nmove-superseded-outside-field (${RULING}) — ${APPLY ? 'APPLY' : PACKET ? 'PACKET' : 'DRY RUN'}`);
  console.log(`  ${rows.length} items read; ${plans.length} carry a superseded value inside a container (${[...byStatus].map(([s, n]) => `${n} ${s}`).join(', ')}).`);
  console.log(`  ${itemEntryCount} entries inside stem/explanation, ${optionEntryCount} inside option content, on ${plans.reduce((n, p) => n + p.optionEntries.size, 0)} options.`);
  console.log(`  Every row: reconstructs exactly from the lifted entries; retention-excluded and canonical-order hashes unchanged.`);
  console.log(`  ${events.length} stored hashes on these items, classified:`);
  for (const [k, n] of [...tally].sort()) console.log(`    ${String(n).padStart(4)}  ${k}`);
  console.log(`  ${moves.size} item(s) carry a hash the move would stop reproducing → the reviewed door.`);

  if (PACKET) {
    mkdirSync(DOOR_DIR, { recursive: true });
    const packet = {
      door: 'superseded-move', ruling: RULING,
      note: 'Each row as it will stand AFTER the move (stem, explanation, options), the entries that move out of it, and the stored hashes that will stop reproducing because they were taken over the retention-INCLUDED projection. The child-facing content does not change; the reviewer re-reads it as a child would and SIGNs or HOLDs.',
      rows: plans.filter((p) => moves.has(p.row.id)).map((p) => ({
        itemId: p.row.id, status: p.row.status, questionTypeId: p.row.questionTypeId, preImageSha256: p.digest,
        before: { stem: p.row.stem, explanation: p.row.explanation, options: p.row.options.map((o) => ({ optionId: o.id, content: o.content, isCorrect: o.isCorrect })) },
        after: { stem: p.after.stem, explanation: p.after.explanation, options: p.after.options.map((o) => ({ optionId: o.id, content: o.content, isCorrect: o.isCorrect })) },
        movingOut: [...p.itemEntries, ...[...p.optionEntries].flatMap(([id, es]) => es.map((e) => ({ ...e, optionId: id })))].map((e) => ({ at: describe(e), ...e })),
        hashesThatStopReproducing: moves.get(p.row.id)!.map((e) => ({ eventId: e.id, action: e.action, actor: e.actor, at: e.at.toISOString(), subjectHash: e.subjectHash })),
        newSubject: { name: 'ROW_PROJECTION_CANONICAL_ORDER', hash: canonicalOrderHash(pin(p.after)) },
      })),
    };
    writeFileSync(pjoin(DOOR_DIR, 'packet.json'), `${JSON.stringify(packet, null, 2)}\n`);
    console.log(`\n  wrote ${pjoin('content/agent-review/superseded-move', 'packet.json')} — ${packet.rows.length} rows for the reviewer.`);
    return;
  }

  // THE DOOR: every row whose pin moves needs a SIGN over the bytes it was shown.
  const toSign: Array<{ plan: Plan; reason: string }> = [];
  const refusals: string[] = [];
  // A HOLD is the reviewer declining to sign the row as it stands. The row does NOT move — moving it
  // would stop its existing pin reproducing with nothing signed in its place — and it is named in
  // held.json and in check:superseded-inside-field's frozen list, never dropped quietly.
  const held: Array<{ itemId: string; reason: string }> = [];
  if (moves.size > 0) {
    const vf = pjoin(DOOR_DIR, 'verdicts.json');
    if (!existsSync(vf)) refusals.push(`${moves.size} row(s) need the reviewed door and ${vf} does not exist — run --packet, then the reviewer`);
    else {
      const v = JSON.parse(readFileSync(vf, 'utf8')) as Verdicts;
      if (v.reviewer !== REVIEWER) refusals.push(`verdicts.json is signed by "${v.reviewer}", not ${REVIEWER}`);
      for (const id of moves.keys()) {
        const p = plans.find((x) => x.row.id === id)!;
        const verdict = v.rows.find((x) => x.itemId === id);
        if (!verdict) refusals.push(`${id}: no reviewer verdict`);
        else if (verdict.preImageSha256 !== p.digest) refusals.push(`${id}: the row moved since the reviewer read it — re-export and re-review (R982)`);
        else if (verdict.verdict !== 'SIGN') held.push({ itemId: id, reason: verdict.reason ?? '(no reason)' });
        else toSign.push({ plan: p, reason: verdict.reason ?? '' });
      }
    }
  }
  if (refusals.length) {
    console.error(`\n  REFUSED — ${refusals.length} reason(s); nothing written:`);
    for (const r of refusals) console.error(`    ${r}`);
    process.exitCode = 1;
    return;
  }
  console.log(`  Door: ${toSign.length} of ${moves.size} row(s) SIGNED by ${REVIEWER} over the bytes in the packet; ${held.length} HELD and left unmoved:`);
  for (const h of held) console.log(`    HELD ${h.itemId} — ${h.reason}`);
  const heldIds = new Set(held.map((h) => h.itemId));
  const toMove = plans.filter((p) => !heldIds.has(p.row.id));
  console.log(`  ${toMove.length} of ${plans.length} item(s) will move.`);
  if (!APPLY) { console.log('\n  dry run — nothing written. Re-run with --apply.'); return; }
  writeFileSync(pjoin(DOOR_DIR, 'held.json'), `${JSON.stringify({ door: 'superseded-move', ruling: RULING, held }, null, 2)}\n`);

  await prisma.$transaction(async (tx) => {
    // THE DATABASE MUST STILL BE WHAT WAS CLASSIFIED.
    const now = await readRows(tx, toMove.map((p) => p.row.id));
    for (const p of toMove) {
      const r = now.find((x) => x.id === p.row.id);
      if (!r || preImageDigest(r) !== p.digest) throw new Error(`${p.row.id}: moved since classification — nothing written`);
    }
    for (const p of toMove) {
      const col = readColumn(p.row.superseded);
      const itemData: Prisma.ItemUpdateInput = { stem: p.after.stem as Prisma.InputJsonValue, explanation: p.after.explanation as Prisma.InputJsonValue };
      if (p.itemEntries.length) itemData.superseded = { version: 1, entries: [...col.entries, ...p.itemEntries] } as unknown as Prisma.InputJsonValue;
      await tx.item.update({ where: { id: p.row.id }, data: itemData });
      for (const [optionId, entries] of p.optionEntries) {
        const o = p.row.options.find((x) => x.id === optionId)!;
        await tx.itemOption.update({ where: { id: optionId }, data: {
          content: withoutSuperseded(o.content) as Prisma.InputJsonValue,
          superseded: { version: 1, entries: [...readColumn(o.superseded).entries, ...entries] } as unknown as Prisma.InputJsonValue,
        } });
      }
      const moved = [...p.itemEntries, ...[...p.optionEntries.values()].flat()].map(describe);
      await tx.attributionEvent.create({ data: {
        recordType: 'item', recordId: p.row.id, action: 'AMENDED', actor: 'migration:superseded-outside-field',
        recordedBy: RECORDED_BY, field: 'superseded', method: METHOD,
        note: `moved ${moved.length} superseded value(s) to the superseded column: ${moved.join(', ')}`.slice(0, 1900),
      } });
    }
  }, { timeout: 120000 });

  for (const s of toSign) {
    const r = (await readRows(prisma, [s.plan.row.id]))[0];
    if (!r) throw new Error(`${s.plan.row.id}: gone after the move`);
    const hash = canonicalOrderHash(pin(r));
    if (hash !== canonicalOrderHash(pin(s.plan.after))) throw new Error(`${r.id}: stored row does not match what the reviewer signed`);
    await recordSignature(prisma, { recordType: 'item', recordId: r.id, reviewerId: REVIEWER, recordedBy: RECORDED_BY,
      method: `${RULING} superseded-move door: re-signed after superseded values left the container; the earlier pin was over the retention-included projection. Reviewer note: ${s.reason}`.slice(0, 900),
      subjectHash: hash, subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind,
      subjectSpec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec });
  }
  console.log(`\n  APPLIED — ${toMove.length} item(s) moved, ${toMove.length} AMENDED event(s), ${toSign.length} signature(s) recorded by ${REVIEWER}; ${held.length} held unmoved.`);
}

// R1040: an apply script re-exports what it changed as its final step — here the content snapshot CI loads.
main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); })
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
