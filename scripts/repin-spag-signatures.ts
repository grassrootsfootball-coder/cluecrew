/**
 * RE-PIN THE TWELVE, HOLD SPEECH — `pnpm repin:spag`
 *
 * Annie's ruling, 2026-08-09. The thirteen signatures read MOVED after R31 added `segments` and
 * `options` to the declared surface. She ruled that move NON-SUBSTANTIVE: the sheet gained a column
 * describing something already true of every item — nothing she reads differently, nothing a child
 * meets differently. So they are re-pinned at the new fingerprint WITHOUT re-signing, and the note
 * records that the guard fired correctly.
 *
 * SPEECH IS EXCLUDED. Removing its N option is substantive — the child now sees four options where
 * she signed five — so its fingerprint moves properly and she re-signs it on the new sheet. It is
 * left MOVED deliberately; that is the guard holding a real change open, which is its job.
 */
import { SPAG_FAMILIES } from '../packages/core/src/english/spag-families';
import { familyFingerprint } from '../packages/core/src/english/spag-fingerprint';
import { prisma } from '../packages/db/src/index';

const HELD = 'spag-punct-speech';
const DAVID = 'human:david@cluecrew.test';
const NOTE =
  'Re-pinned at the new fingerprint WITHOUT re-signing. The surface gained the columns `segments` ' +
  'and `options` (R31), describing something already true of every item the family emitted: the ' +
  'reviewer reads nothing differently and a child meets nothing differently. Ruled non-substantive ' +
  'by the reviewer, 2026-08-09. The guard fired correctly — the fingerprint DID move, and the ' +
  'ruling is that this particular move does not void the signature.';

async function main(): Promise<void> {
  const events = await prisma.attributionEvent.findMany({
    where: { action: 'SIGNED', recordType: { contains: 'template-family' } },
  });
  const sig = new Map(events.map((e) => [e.recordId, e]));

  let repinned = 0;
  for (const family of SPAG_FAMILIES) {
    const ev = sig.get(family.id);
    if (!ev) { console.log(`  UNSIGNED   ${family.id}`); continue; }
    const fp = familyFingerprint(family);
    if (family.id === HELD) {
      console.log(`  HELD       ${family.id} — substantive (N option removed); awaiting her signature on the new sheet`);
      continue;
    }
    if (ev.subjectHash === fp) { console.log(`  UNCHANGED  ${family.id}`); continue; }
    await prisma.attributionEvent.update({
      where: { id: ev.id },
      data: { subjectHash: fp, note: `${String(ev.note ?? '')}\n\n[2026-08-09] ${NOTE}` },
    });
    console.log(`  RE-PINNED  ${family.id} → ${fp}`);
    repinned += 1;
  }
  console.log(`\n${repinned} re-pinned as non-substantive · 1 held for re-signing · recordedBy ${DAVID}`);
  await prisma.$disconnect();
}

void main();
