/**
 * WRITES REVIEWED CONTENT UNGUARDED — a one-shot ruling-applier (R63). The values are a reviewer's
 * authored strings, not a derivation.
 *
 * **ANNIE'S ELEVEN AMENDED NVR HINTS, ARRIVING FROM COWORK.** They were amended in her eighth
 * return, verified there against her own file by hash, and this store held the PRE-AMENDMENT text
 * on ten of the eleven and a third text on one — which is the transport gap measured from the other
 * end (R255). Writing them closes the divergence **on the side that serves**.
 *
 * **EVERY ROW IS DIFFED BEFORE IT IS WRITTEN.** Cowork's file carries a `previous` for each entry;
 * this asserts that `previous` is what this store actually holds. A row whose current text matches
 * neither `previous` nor `childHint` has moved for its own reasons and is REFUSED, not overwritten
 * — that is the field-by-field discipline the house rule requires, and a wholesale write is what it
 * exists to prevent.
 *
 * **THE APPROVER VALUE IS THIS STORE'S, NOT THE NAME IN THE FILE.** Cowork's rows say
 * `approvedBy: "Annie"`. Writing that string here would introduce a sixth shape for one person and
 * assert an identity neither file can measure (R256). This store records `reviewer:rev-0001`, and
 * the file's own name plus her return and hash go into `textProvenance`, where the claim is
 * attributed rather than flattened.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const SOURCE = '/Users/davidb/Downloads/ELEVENTOCODE.json';
const ANNIE = 'reviewer:rev-0001';

type Entry = {
  childHint: string; previous: string; approvedBy: string;
  authority: string; verifiedAgainstHerFile: boolean;
};

async function main() {
  const raw = readFileSync(SOURCE, 'utf8');
  const fileHash = createHash('sha256').update(raw).digest('hex');
  const parsed = JSON.parse(raw) as { kind?: string; eleven?: Record<string, Entry> };
  if (parsed.kind !== 'cowork-eleven-to-code') {
    throw new Error(`REFUSED: unexpected kind "${parsed.kind}". A reader refuses a shape it cannot parse (R173).`);
  }
  const eleven = parsed.eleven;
  if (!eleven || Object.keys(eleven).length !== 11) {
    throw new Error(`REFUSED: expected 11 entries, found ${eleven ? Object.keys(eleven).length : 0}.`);
  }

  const ids = Object.keys(eleven);
  const rows = await prisma.misconception.findMany({ where: { id: { in: ids } } });
  const byId = new Map(rows.map((r) => [r.id, r]));

  // --- ALL CHECKS BEFORE ANY WRITE. All-or-nothing (R87). ---
  const refusals: string[] = [];
  const held: { id: string; here: string; previous: string; amended: string }[] = [];
  const plan: { id: string; from: string; to: string; entry: Entry }[] = [];
  for (const id of ids) {
    const entry = eleven[id]!;
    const row = byId.get(id);
    if (!row) { refusals.push(`${id}: not in this store`); continue; }
    if (!entry.verifiedAgainstHerFile) { refusals.push(`${id}: not marked verified against her file`); continue; }
    if (row.childHint === entry.childHint) continue; // already amended; a no-op, not a refusal
    if (row.childHint !== entry.previous) {
      /*
       * **HELD, NOT REFUSED — AND THE DISTINCTION IS THE POINT.** A row whose text matches neither
       * side is not a malformed batch; it is a row the two stores disagree about, and stopping the
       * other ten teaches nobody anything. All-or-nothing (R87) guards against a write landing in
       * a state matching neither before nor intent — it was never a reason to hold ten clean rows
       * hostage to one contested one.
       *
       * Cowork predicted exactly one such row from its own side before this ran. It is
       * `nvr-count-by-glance`, and it is the ONLY member of my seven third-text rows that also
       * appears in Cowork's eleven amended: **David's relay places it in her approved-as-written
       * list, Cowork's file places it in her amended list, and both cite the same eighth return.**
       * Two stores reading one document into two different columns. Only she can settle it.
       */
      held.push({ id, here: row.childHint, previous: entry.previous, amended: entry.childHint });
      continue;
    }
    const faults = checkChildFacingText({ role: 'hint', label: `misconception:${id}`, text: entry.childHint })
      .filter(isBlocking);
    if (faults.length > 0) {
      refusals.push(`${id}: her amended text fails the gate — ${faults.map((f) => `${f.rule}: ${f.detail}`).join(' | ')}`);
      continue;
    }
    plan.push({ id, from: row.childHint, to: entry.childHint, entry });
  }

  if (refusals.length > 0) {
    console.error(`REFUSED — ${refusals.length} row(s), nothing written:\n`);
    for (const r of refusals) console.error(`  - ${r}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  for (const p of plan) {
    const row = byId.get(p.id)!;
    await prisma.misconception.update({
      where: { id: p.id },
      data: {
        childHint: p.to,
        approvedBy: ANNIE,
        approvalMethod: 'amended and approved, eighth return 2026-08-19; carried by Cowork',
        textProvenance: {
          ...((row.textProvenance ?? {}) as Record<string, unknown>),
          state: 'RECORDED',
          servingText: p.to,
          servingTextRole: "ANNIE'S AMENDED TEXT, eighth return",
          approvedByPerson: ANNIE,
          approvedByNameInSourceFile: p.entry.approvedBy,
          authority: p.entry.authority,
          carriedBy: `Cowork, ELEVENTOCODE.json, sha256 ${fileHash}`,
          verifiedAgainstHerFileBySender: p.entry.verifiedAgainstHerFile,
          replacedText: p.from,
          recordedAt: '2026-08-19',
        },
      },
    });
  }

  const back = await prisma.misconception.findMany({ where: { id: { in: ids } }, select: { id: true, childHint: true, approvedBy: true } });
  const expected = new Set(plan.map((p) => p.id));
  const correct = back.filter((r) => expected.has(r.id) && r.childHint === eleven[r.id]!.childHint && r.approvedBy === ANNIE);
  console.log(`amended: ${plan.length} · held for a ruling: ${held.length} · of ${ids.length}`);
  console.log(`read back matching her text AND carrying ${ANNIE}: ${correct.length} of ${plan.length}`);
  if (correct.length !== plan.length) throw new Error('read-back disagrees with the write');
  for (const h of held) {
    console.log(`\n  HELD — ${h.id}: this store's text matches neither side.`);
    console.log(`    here     : ${h.here}`);
    console.log(`    previous : ${h.previous}`);
    console.log(`    amended  : ${h.amended}`);
    console.log('    CONTRADICTION: David\'s relay puts this row in her APPROVED-AS-WRITTEN seven;');
    console.log('    Cowork\'s file puts it in her AMENDED eleven. Both cite her eighth return.');
    console.log('    Not written. Hers to settle.');
  }
  console.log(`\n  source : ELEVENTOCODE.json`);
  console.log(`  sha256 : ${fileHash}`);
  for (const p of plan.slice(0, 3)) {
    console.log(`\n  ${p.id}`);
    console.log(`    was: ${p.from}`);
    console.log(`    now: ${p.to}`);
  }
  await prisma.$disconnect();
}

main();
