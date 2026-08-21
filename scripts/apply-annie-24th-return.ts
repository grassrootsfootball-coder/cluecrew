/**
 * Annie's twenty-fourth return: the entry written, and all 27 carriers assigned (R392).
 *
 * **Her authored hint, read from her file** (R25) — not the drafts, all three of which she refused
 * with reasons. **Nothing here is retyped from memory**: the hint is located in her return and the
 * script refuses if it is not found verbatim.
 */
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

/**
 * **HER TWENTY-FIFTH RETURN, NOT THE TWENTY-FOURTH.** The first run pointed at the twenty-fourth
 * and ABORTED: the hint is authored in the twenty-fifth, and the twenty-fourth only asked drafting to
 * propose one. The guard refused to write a string it could not find in the file it was told to read
 * — which is the whole point of reading rather than retyping (R25), and it caught a real mis-citation
 * on its first run rather than writing her words under the wrong authority.
 */
const HER_FILE = '/Users/davidb/Downloads/annie-twentyfifth-return.md';
const APPLY = process.argv.includes('--apply');

const HINT = 'One line in the passage says something different. Go back and find it.';
const DESCRIPTION = 'Chooses an option the passage explicitly denies, rather than one it merely fails to support.';

/** Every one of the 27 LIVE carriers, assigned. Her rulings, not the proposals. */
const ASSIGN: Record<string, string[]> = {
  'en-contradicted-by-the-text': [
    'ENG-001-WIW-18', 'ENG-001-WIW-21', 'ENG-028-PR-02',
    'ENG-028-PR-06', 'ENG-028-PR-09', 'ENG-028-PR-12',
  ],
  // WIW-12 moves HERE, not to contradicted: the text says a river and never denies he had seen a
  // meadow, so "a great meadow" is a real detail supplied where it does not belong. WIW-01 and
  // WIW-09 are the two she left unplaced, closed by the same entry's own description.
  'en-wrong-scope-retrieval': ['ENG-001-WIW-12', 'ENG-001-WIW-01', 'ENG-001-WIW-09'],
  // Three against my proposal. A church bell is not a sense of carol; the stern option is not the
  // dominant sense either; straight-line motion is the ABSENCE of hovering rather than a neighbour.
  'en-vocab-not-this-word': ['ENG-001-WIW-08', 'ENG-001-WIW-20', 'ENG-028-PR-05'],
  'en-vocab-dominant-sense': ['ENG-001-WIW-19'],
  'en-technique-effect-mislocated': ['ENG-001-WIW-05', 'ENG-001-WIW-16'],
  'en-technique-device-confusion': ['ENG-001-WIW-22'],
  // WIW-11 STAYS: the row does mean an argument, so the sense is right and the invented rabbits are
  // the error. Not a vocabulary fault. Takes en-plausible-not-stated to eleven.
  'en-plausible-not-stated': ['ENG-001-WIW-11'],
};

async function main() {
  const her = readFileSync(HER_FILE, 'utf8').replace(/\s*\n\s*/g, ' ');
  if (!her.includes(HINT)) {
    throw new Error(
      `apply-annie-24th ABORTED — her authored hint is not in ${HER_FILE} verbatim.\n` +
        `  Expected: "${HINT}"\n  A hint retyped rather than read is a hint she did not write.`,
    );
  }

  const gate = checkChildFacingText({ role: 'misconception-hint', label: 'en-contradicted-by-the-text', text: HINT })
    .filter(isBlocking);
  if (gate.length > 0) {
    throw new Error(`apply-annie-24th ABORTED — her hint fails the child-facing gate:\n  ${gate.map((f) => f.detail).join('\n  ')}`);
  }
  console.log(`hint located in her file and gated clean: "${HINT}"\n`);

  const ids = Object.values(ASSIGN).flat();
  if (new Set(ids).size !== ids.length) throw new Error('apply-annie-24th ABORTED — an item is assigned twice.');
  console.log(`assignments: ${ids.length} item(s) across ${Object.keys(ASSIGN).length} entries`);

  if (!APPLY) {
    for (const [entry, items] of Object.entries(ASSIGN)) console.log(`  ${entry}: ${items.length} — ${items.join(', ')}`);
    console.log('\nREPORT ONLY. Re-run with --apply.');
    await prisma.$disconnect();
    return;
  }

  await prisma.misconception.upsert({
    where: { id: 'en-contradicted-by-the-text' },
    update: { description: DESCRIPTION, childHint: HINT },
    create: {
      id: 'en-contradicted-by-the-text', district: 'ENGLISH',
      description: DESCRIPTION, childHint: HINT, status: 'ACTIVE',
    },
  });
  console.log('  WROTE en-contradicted-by-the-text');

  let moved = 0;
  for (const [entry, items] of Object.entries(ASSIGN)) {
    for (const id of items) {
      const item = await prisma.item.findUnique({ where: { id }, include: { options: true } });
      const opt = item?.options.find((o) => (o as { misconceptionId?: string | null }).misconceptionId === 'en-plausible-not-stated');
      if (!opt) { console.log(`  SKIP ${id} — no option tagged en-plausible-not-stated`); continue; }
      if (entry === 'en-plausible-not-stated') { console.log(`  STAYS ${id} -> ${entry}`); continue; }
      await prisma.itemOption.update({ where: { id: opt.id }, data: { misconceptionId: entry } });
      console.log(`  ${id} -> ${entry}`);
      moved++;
    }
  }
  console.log(`\n${moved} option(s) retagged. 1 stayed. Entry written with her authored hint.`);
  await prisma.$disconnect();
}

void main();
