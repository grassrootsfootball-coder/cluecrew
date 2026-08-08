/**
 * Import the eight VR childHint redrafts (annie, 2026-08-08) — gated, diffed, and partial.
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-vr-hint-redrafts.ts`
 *
 * Applying these also clears the import artefact that wrapped each hint in literal double quotes.
 * TWO ARE HELD BACK rather than imported, per the standing instruction to report failures instead
 * of writing them:
 *   · `vr-rule-from-one-example` — the redraft fixes the sentence length but keeps "should have",
 *     which trips the VOICE rule. Its own redraftReason says "wording untouched", so the second
 *     failure was not seen. It would be refused by the client guard anyway.
 *   · `vr-form-without-meaning` — R5. The entry's description is "spells OR SOUNDS right", and the
 *     redraft drops "or sound right", so the hint would cover only half the misconception it serves.
 *     The redraft was written against a copy that differs from the DB, which is how the loss crept in.
 */
import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';

const SRC = '/Users/davidb/Downloads/vrhintredrafts.json';
const HOLD = new Set(['vr-rule-from-one-example', 'vr-form-without-meaning']);

async function main(): Promise<void> {
  const doc = JSON.parse(readFileSync(SRC, 'utf8')) as { redrafts: Record<string, { childHint: string }> };
  let written = 0;
  for (const [id, r] of Object.entries(doc.redrafts)) {
    if (HOLD.has(id)) { console.log(`  HELD  ${id} — reported, not written`); continue; }
    const before = await prisma.misconception.findUnique({ where: { id } });
    if (!before) { console.log(`  MISSING ${id}`); continue; }
    // The client guard gates childHint on write; a failure throws rather than landing.
    await prisma.misconception.update({ where: { id }, data: { childHint: r.childHint } });
    written += 1;
    console.log(`  ${id}\n     was: ${before.childHint}\n     now: ${r.childHint}`);
  }
  console.log(`\n${written} hint(s) imported · ${HOLD.size} held back.`);
  await prisma.$disconnect();
}

void main();
