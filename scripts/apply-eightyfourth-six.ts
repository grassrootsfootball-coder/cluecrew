/**
 * THE SIX OF THE EIGHTY-FOURTH, THROUGH THE STANDING SHAPE (David's item 1, 2026-08-22).
 *
 * **WRITES CONTENT UNGUARDED (R63)** — human ruling, not derivation. Verdict APPROVED_AS_WRITTEN
 * for PR-05, PR-06, PR-08, PR-09, PR-10, PR-11; authority the eighty-fourth return by file and
 * digest, whose section 1 is her confirming sentence.
 *
 * **THE BYTE-GUARD IS THE POINT.** PR-04 has just shown `hintUnchangedSinceApproval` can be false,
 * so before landing each row this compares the row's CURRENT `hintCore` byte-for-byte against the
 * drain string she confirmed — read from the drain file whose digest she quoted, not from memory of
 * it. **Any mismatch refuses that row and reports; it never lands under her name.**
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { itemHintRulingPatch } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const RETURN = '/Users/davidb/Downloads/annie-eightyfourth-return.md';
const EXPECTED_RETURN_SHA = '75967df0b034d33242fa60233d49a9e0a6847db6e49831b979a518ea7204a3c8';
const DRAIN = '/Users/davidb/Downloads/APPROVEDASWRITTENFORTHEDRAIN (1).json';
const EXPECTED_DRAIN_SHA = '8dd1d9e49fb610ee8b3a9d46cdeab9932e9528db78002dc9ea055f013435b740';
const SIX = ['ENG-028-PR-05', 'ENG-028-PR-06', 'ENG-028-PR-08', 'ENG-028-PR-09', 'ENG-028-PR-10', 'ENG-028-PR-11'];

async function main() {
  const returnBytes = readFileSync(RETURN);
  const returnSha = createHash('sha256').update(returnBytes).digest('hex');
  if (returnSha !== EXPECTED_RETURN_SHA) throw new Error(`ABORTED — return digest ${returnSha}, expected ${EXPECTED_RETURN_SHA}.`);
  const drainBytes = readFileSync(DRAIN);
  const drainSha = createHash('sha256').update(drainBytes).digest('hex');
  if (drainSha !== EXPECTED_DRAIN_SHA) throw new Error(`ABORTED — drain digest ${drainSha}, not the file she ruled from.`);

  const drain = JSON.parse(drainBytes.toString('utf8')) as { rows?: Array<{ itemId: string; hintCore?: string; drainString?: string }> };
  if (!Array.isArray(drain.rows)) throw new Error('ABORTED — drain file carries no rows array; refusing the shape (R173).');
  const drainString = new Map(drain.rows.map((r) => [r.itemId, r.hintCore ?? r.drainString]));

  const landed: string[] = [];
  const refused: string[] = [];
  for (const id of SIX) {
    const confirmed = drainString.get(id);
    if (typeof confirmed !== 'string') { refused.push(`  REFUSED  ${id} — not in the drain file she ruled from`); continue; }
    const item = await prisma.item.findUniqueOrThrow({ where: { id }, select: { explanation: true } });
    const e = (item.explanation ?? {}) as Record<string, unknown>;
    const current = typeof e.hintCore === 'string' ? e.hintCore : null;
    if (current !== confirmed) {
      refused.push(`  REFUSED  ${id} — the row has moved since she ruled\n      row now  : ${JSON.stringify(current)}\n      confirmed: ${JSON.stringify(confirmed)}`);
      continue;
    }
    const r = itemHintRulingPatch(e, confirmed, 'Annie', `annie-eightyfourth-return.md, sha256 ${returnSha}`);
    if (r.verdict !== 'APPROVED_AS_WRITTEN') { refused.push(`  REFUSED  ${id} — patch classified ${r.verdict}, not an approval`); continue; }
    await prisma.item.update({ where: { id }, data: { explanation: { ...e, ...r.patch } as object } });
    landed.push(`  LANDED   ${id}  [APPROVED_AS_WRITTEN]`);
  }
  for (const l of [...landed, ...refused]) console.log(l);
  console.log(`\n${landed.length} landed, ${refused.length} refused of ${SIX.length}.`);
  if (refused.length > 0) process.exitCode = 1;
  await prisma.$disconnect();
}

void main();
