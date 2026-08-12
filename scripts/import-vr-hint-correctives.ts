/**
 * WRITES UNGUARDED TO REVIEWED CONTENT — read this before re-running it.
 *
 * This script transcribes a written ruling into content a reviewer owns, and it does NOT classify
 * before writing (`packages/db/prisma/reviewed-guard.ts`). That is deliberate: the values here were
 * authored by a human, not computed, so the guard would refuse the very change the script exists to
 * apply. What it means for YOU is that re-running this on a database carrying rulings will overwrite
 * whatever is there now with what is written below — including anything a reviewer has changed since.
 *
 * It was written to run ONCE and has already run. Before running it again, check that what it
 * writes is still the current ruling; if it is not, this will quietly undo the newer one.
 */
/**
 * The two held VR hints — corrective redraft (annie, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-vr-hint-correctives.ts`
 *
 * `vr-rule-from-one-example` — "needs" replaces "should have", clearing the voice rule the earlier
 * redraft missed. Taken verbatim.
 *
 * `vr-form-without-meaning` — TRANSFORM, NOT TEXT, on her explicit instruction: "if the DB's opening
 * clause differs from the text below, apply the transform, not the text." It does differ — the DB
 * parenthesises "(or picture the word written in a book)" where her text uses a comma, because she
 * was writing against a copy that had already drifted. So the dash becomes a full stop and NOT ONE
 * WORD CHANGES. That is the whole point: rewriting this hint is what lost "or sound right", which is
 * half the misconception it serves (R5). The transform preserves it.
 */
import { prisma } from '../packages/db/src/index';

/** Strip the import artefact's wrapping quotes; turn the dash into a full stop; capitalise. */
function splitAtDash(raw: string): string {
  return raw.replace(/^"+|"+$/g, '').trim().replace(/\s*—\s*(.)/, (_m, c: string) => `. ${c.toUpperCase()}`);
}

async function main(): Promise<void> {
  const fwm = await prisma.misconception.findUnique({ where: { id: 'vr-form-without-meaning' } });
  if (!fwm) { console.log('MISSING vr-form-without-meaning'); return; }
  const transformed = splitAtDash(String(fwm.childHint));
  if (!transformed.includes('or sound right')) {
    throw new Error('Refusing to write: the transform lost "or sound right" — R5, half the misconception.');
  }

  const WRITES: Array<[string, string]> = [
    ['vr-rule-from-one-example', 'Find the exact home of every letter. Each one needs an address in the outside words.'],
    ['vr-form-without-meaning', transformed],
  ];
  for (const [id, hint] of WRITES) {
    const before = await prisma.misconception.findUnique({ where: { id } });
    await prisma.misconception.update({ where: { id }, data: { childHint: hint } });
    console.log(`${id}\n   was: ${before?.childHint}\n   now: ${hint}`);
  }
  await prisma.$disconnect();
}

void main();
