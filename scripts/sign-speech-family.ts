/**
 * SPEECH SIGNED ON THE NEW SHEET — `pnpm sign:speech`
 *
 * Annie, 2026-08-09. `spag-punct-speech` was held MOVED under R34 because removing its N option is
 * substantive: the child now sees four options where she signed five. She has signed the new sheet,
 * so the signature is re-recorded and re-pinned at the current fingerprint.
 */
import { SPAG_FAMILIES } from '../packages/core/src/english/spag-families';
import { familyFingerprint, familyDepth, spagFamilyTiers } from '../packages/core/src/english/spag-fingerprint';
import { prisma } from '../packages/db/src/index';

const ID = 'spag-punct-speech';
const REVIEWER = 'current-reviewer';
const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — speech re-signed on the four-option sheet, 2026-08-09';

async function main(): Promise<void> {
  const family = SPAG_FAMILIES.find((f) => f.id === ID)!;
  const fp = familyFingerprint(family);
  const depth = familyDepth(family);
  const tiers = spagFamilyTiers(family);

  const note =
    `SIGNED T${tiers[0]}–T${tiers[tiers.length - 1]}, FOUR OPTIONS, NO N OPTION (annie, 2026-08-09). ` +
    `Her reason: a speech item CANNOT carry an N key, because an N-keyed item needs a correctly ` +
    `closed quotation, and that puts a terminal-at-boundary choice into a part the child is being ` +
    `told is clean — British usage argues both ways there, so the part is not unimpeachable. That ` +
    `was the finding when the family was first signed; the option's ABSENCE now follows from it ` +
    `rather than the option surviving on the card at a zero rate (R33). ` +
    `en-n-option-avoidance is therefore UNREACHABLE BY DESIGN in this family — not unused. ` +
    `SERVING CONDITION, hers (R19): if speech is ever the only punctuation family a child meets in ` +
    `a session, that child gets NO N exposure in the session at all — a serving consideration, not ` +
    `a content one. DEPTH: ${depth.total} generable items across ${tiers.map((t) => `T${t}`).join(',')} ` +
    `${JSON.stringify(depth.perTier)}.`;

  const existing = await prisma.attributionEvent.findFirst({
    where: { action: 'SIGNED', recordType: { contains: 'template-family' }, recordId: ID },
  });
  if (!existing) { console.log(`no prior signature for ${ID}`); return; }

  await prisma.attributionEvent.update({
    where: { id: existing.id },
    data: { subjectHash: fp, note, method: METHOD, actor: REVIEWER, recordedBy: DAVID },
  });
  console.log(`${ID} re-signed and pinned → ${fp}`);
  console.log(`  tiers ${tiers.map((t) => `T${t}`).join(',')} · depth ${depth.total} ${JSON.stringify(depth.perTier)}`);
  await prisma.$disconnect();
}

void main();
