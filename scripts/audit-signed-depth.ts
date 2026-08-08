/**
 * DOES EACH FAMILY SIGNATURE STILL DESCRIBE THE FAMILY? — `pnpm audit:signed-depth`
 *
 * Annie's second named artefact, 2026-08-08. A signature's `note` carries figures about what was
 * signed — depth, bank size, items per tier. Those figures are STATUS wearing content's clothes:
 * regenerate the family and they are wrong, while the signature goes on reading as though it still
 * described the thing. Nothing in it says otherwise.
 *
 * So this does two jobs:
 *
 *   1. PIN. Where a signature has no `subjectHash`, record the family's current fingerprint. From
 *      then on any change to the family's generator surface — a tier rule, a structural parameter,
 *      a range — reads as a signature describing a superseded version, which is the NVR guard
 *      (`sampleSheetHash`) applied one level up.
 *
 *   2. RECONCILE. Compare the depth asserted in the note against the depth the generator can
 *      actually produce, measured by generating to exhaustion. This is where the units problem
 *      surfaces: the signed figures count BANK SENTENCES, but an N-keyed family yields two distinct
 *      items per sentence (the error form and the no-mistake form), so "24 sentences (6/rung)" and
 *      the generator's twelve-per-tier are the same family described in different units.
 *
 * Reports only; it never edits a note. A signed figure is the reviewer's, and correcting it is her
 * call — this says which ones need her.
 */
import { SPAG_FAMILIES } from '../packages/core/src/english/spag-families';
import { familyDepth, familyFingerprint, spagFamilyTiers } from '../packages/core/src/english/spag-fingerprint';
import { prisma } from '../packages/db/src/index';

const DAVID = 'human:david@cluecrew.test';

/** The depth figure a signature asserts, if it states one at all. */
function statedDepth(note: string): string | null {
  const m = note.match(/DEPTH:\s*([^.]*)\./i);
  return m ? m[1]!.trim() : null;
}

/**
 * Does a stated depth reconcile with what the generator produces?
 *
 * A note states its figures in whichever way reads best — a total ("21 sentences"), a per-tier
 * split ("8 at T2, 7 at T4"), or both. So reconcile against either shape: the stated numbers
 * contain the generable TOTAL, or they account for every PER-TIER figure. Anything narrower
 * reports the reviewer's own correct notes as faults, which is how a check loses its authority.
 */
function reconciles(stated: string, depth: { perTier: Record<string, number>; total: number }): boolean {
  const numbers = new Set((stated.match(/\d+/g) ?? []).map(Number));
  if (numbers.has(depth.total)) return true;
  return Object.values(depth.perTier).every((n) => numbers.has(n));
}

async function main(): Promise<void> {
  const pin = process.argv.includes('--pin');
  const events = await prisma.attributionEvent.findMany({
    where: { action: 'SIGNED', recordType: { contains: 'template-family' } },
  });
  const byFamily = new Map(events.map((e) => [e.recordId, e]));

  const rows: string[] = [];
  let pinned = 0;
  let moved = 0;
  let unitMismatch = 0;
  let noFigure = 0;

  for (const family of SPAG_FAMILIES) {
    const ev = byFamily.get(family.id);
    if (!ev) {
      rows.push(`  UNSIGNED         ${family.id}`);
      continue;
    }
    const fp = familyFingerprint(family);
    const depth = familyDepth(family);
    const tiers = spagFamilyTiers(family).map((t) => `T${t}`).join(',');
    const stated = statedDepth(String(ev.note ?? ''));

    let verdict: string;
    if (!ev.subjectHash) {
      verdict = 'PIN-NOW';
      if (pin) {
        await prisma.attributionEvent.update({ where: { id: ev.id }, data: { subjectHash: fp } });
        verdict = 'PINNED';
        pinned += 1;
      }
    } else if (ev.subjectHash !== fp) {
      verdict = 'MOVED';
      moved += 1;
    } else {
      verdict = 'PINNED-OK';
    }

    let note: string;
    if (!stated) {
      note = 'signature states no depth figure';
      noFigure += 1;
    } else if (reconciles(stated, depth)) {
      note = `note "${stated}" reconciles with ${depth.total} generable`;
    } else {
      note = `note says "${stated}" · generator produces ${depth.total} across ${tiers} ${JSON.stringify(depth.perTier)}`;
      unitMismatch += 1;
    }
    rows.push(`  ${verdict.padEnd(16)} ${family.id.padEnd(38)} ${note}`);
  }

  console.log(rows.join('\n'));
  console.log(
    `\n${SPAG_FAMILIES.length} families · ${pinned} newly pinned · ${moved} moved since signing · ` +
      `${unitMismatch} whose stated depth does not equal generable depth · ${noFigure} stating no figure`,
  );
  if (!pin) console.log('Re-run with --pin to record fingerprints on signatures that have none.');
  console.log(`recordedBy would be ${DAVID}; notes are never edited by this script.`);
  await prisma.$disconnect();
}

void main();
