/**
 * Ratify the VR hints annie approved (2026-08-08), on her stated condition.
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/ratify-vr-hints.ts`
 *
 * Her condition: diff the STORED text against her original wording character for character — not
 * against the unwrapped version — because a hint that has been through a rewrite and a restore may
 * not be back at the original. Seven are byte-identical and are ratified as previously approved;
 * the wrapping quotes were never hers and the word counts were an artefact of counting them.
 *
 * `vr-form-without-meaning` is HELD, not ratified. It differs from her file text by one clause —
 * the DB parenthesises "(or picture the word written in a book)" where her file uses a comma —
 * because she instructed "apply the transform, not the text". The stored text is therefore correct
 * BY HER INSTRUCTION and different FROM HER FILE, and her condition says report rather than ratify.
 */
import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';

const FILES = [
  '/Users/davidb/Downloads/vrhintredrafts.json',
  '/Users/davidb/Downloads/vrhintredraftscorrective.json',
];
const REVIEWER = 'current-reviewer';
const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — VR hint ratification 2026-08-08';

async function main(): Promise<void> {
  const hers: Record<string, string> = {};
  for (const f of FILES) {
    for (const [k, v] of Object.entries<{ childHint: string }>(JSON.parse(readFileSync(f, 'utf8')).redrafts)) {
      hers[k] = v.childHint;
    }
  }
  let ratified = 0;
  for (const [id, text] of Object.entries(hers)) {
    const m = await prisma.misconception.findUnique({ where: { id } });
    if (!m) { console.log(`  MISSING ${id}`); continue; }
    if (String(m.childHint) !== text) {
      console.log(`  HELD      ${id} — stored text differs from her wording; reported, not ratified`);
      continue;
    }
    await prisma.misconception.update({
      where: { id },
      data: { status: 'ACTIVE', approvedBy: REVIEWER, recordedBy: DAVID, approvalMethod: METHOD },
    });
    await prisma.attributionEvent.upsert({
      where: { id: `approved-${id}` },
      create: { id: `approved-${id}`, recordType: 'misconception', recordId: id, action: 'APPROVED', actor: REVIEWER, recordedBy: DAVID, method: METHOD },
      update: {},
    });
    ratified += 1;
    console.log(`  ACTIVE    ${id}`);
  }
  console.log(`\n${ratified} ratified · ${Object.keys(hers).length - ratified} held.`);
  await prisma.$disconnect();
}

void main();
