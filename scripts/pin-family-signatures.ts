/**
 * PIN EVERY UNPINNED FAMILY SIGNATURE — `pnpm pin:signatures [--pin]`
 *
 * Closes R40 #5 and #8. Three groups, one guard:
 *
 *   - 19 MATHS families, signed with no fingerprint at all, because `mathsFamilyFingerprint`
 *     did not exist until today. The column was there; the function was not.
 *   - `en-vocab-in-context`, a SpagFamily that is deliberately NOT one of the thirteen, so every
 *     sweep keyed on `SPAG_FAMILIES` skipped it in silence. The most quietly dangerous shape of
 *     gap: not unguarded, but invisible to the thing doing the guarding.
 *   - the 13 SPaG families, already pinned — reported so the count is complete rather than assumed.
 *
 * PINS ONLY WHAT IS UNPINNED. A signature whose fingerprint has MOVED is left alone and reported:
 * re-pinning a move is a reviewer's ruling on whether it was substantive (R34), never a script's.
 */
import { MATHS_FAMILIES } from '../packages/core/src/maths/families';
import { mathsFamilyFingerprint } from '../packages/core/src/maths/fingerprint';
import { SPAG_FAMILIES } from '../packages/core/src/english/spag-families';
import { VOCAB_IN_CONTEXT } from '../packages/core/src/english/vocab-context';
import { familyFingerprint } from '../packages/core/src/english/spag-fingerprint';
import { prisma } from '../packages/db/src/index';

const DAVID = 'human:david@cluecrew.test';
const NOTE =
  'Fingerprint recorded 2026-08-09. The signature was made before any fingerprint function existed ' +
  'for this district, so it was unguarded rather than wrongly guarded: nothing about what was ' +
  'signed changes, and this records the surface as it stands so a later move is detectable (R31/R34).';

async function main(): Promise<void> {
  const doPin = process.argv.includes('--pin');
  const events = await prisma.attributionEvent.findMany({
    where: { action: 'SIGNED', recordType: { contains: 'template-family' } },
  });
  const sig = new Map(events.map((e) => [e.recordId, e]));

  const targets: Array<{ id: string; district: string; fp: string }> = [
    ...MATHS_FAMILIES.map((f) => ({ id: f.id, district: 'MATHS', fp: mathsFamilyFingerprint(f) })),
    ...SPAG_FAMILIES.map((f) => ({ id: f.id, district: 'ENGLISH', fp: familyFingerprint(f) })),
    { id: VOCAB_IN_CONTEXT.id, district: 'ENGLISH', fp: familyFingerprint(VOCAB_IN_CONTEXT) },
  ];

  let pinned = 0, already = 0, moved = 0, unsigned = 0;
  for (const t of targets) {
    const ev = sig.get(t.id);
    if (!ev) { console.log(`  UNSIGNED   ${t.district.padEnd(8)} ${t.id}`); unsigned += 1; continue; }
    if (ev.subjectHash === t.fp) { already += 1; continue; }
    if (ev.subjectHash) {
      console.log(`  MOVED      ${t.district.padEnd(8)} ${t.id} — signed ${ev.subjectHash}, now ${t.fp}; needs a ruling, not a re-pin`);
      moved += 1;
      continue;
    }
    if (doPin) {
      await prisma.attributionEvent.update({
        where: { id: ev.id },
        data: { subjectHash: t.fp, note: `${String(ev.note ?? '')}\n\n[2026-08-09] ${NOTE}` },
      });
      console.log(`  PINNED     ${t.district.padEnd(8)} ${t.id} → ${t.fp}`);
    } else {
      console.log(`  TO PIN     ${t.district.padEnd(8)} ${t.id} → ${t.fp}`);
    }
    pinned += 1;
  }

  console.log(
    `\n${targets.length} families · ${pinned} ${doPin ? 'pinned' : 'to pin'} · ${already} already pinned · ` +
      `${moved} moved (held for a ruling) · ${unsigned} unsigned`,
  );
  if (!doPin) console.log('Re-run with --pin to write them.');
  console.log(`recordedBy ${DAVID}`);
  await prisma.$disconnect();
}

void main();
