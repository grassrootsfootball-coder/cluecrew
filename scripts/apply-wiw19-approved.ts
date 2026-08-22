/**
 * ONE-SHOT (David's ruling 1, 2026-08-22): `ENG-001-WIW-19`, verdict APPROVED, no text change.
 *
 * **WRITES CONTENT UNGUARDED (R63)** — the value is a human ruling, not a derivation. On the
 * `apply-annie-27th-hints.ts` precedent: an APPROVED verdict sets the authorship fields without
 * touching the text, because an approval is a decision whose whole content is that the text should
 * stand. Authority is her seventieth return — *"WIW-19 is the best of the nine"* — by file and
 * digest, computed here over the bytes.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';

const RETURN = '/Users/davidb/Downloads/annie-seventieth-return.md';
const ID = 'ENG-001-WIW-19';

async function main() {
  const body = readFileSync(RETURN);
  // The return writes `**WIW-19** is the best of the nine` — the anchor must survive her bold
  // markers, or the assert refuses a file that carries exactly the approval it is checking for.
  if (!/WIW-19\*{0,2}\s+is the best of the nine/.test(body.toString('utf8'))) {
    throw new Error('ABORTED — the seventieth return does not carry the approval this write cites.');
  }
  const digest = createHash('sha256').update(body).digest('hex');
  const item = await prisma.item.findUniqueOrThrow({ where: { id: ID }, select: { explanation: true } });
  const e = (item.explanation ?? {}) as Record<string, unknown>;
  if (typeof e.hintCore !== 'string' || e.hintCore.trim() === '') {
    throw new Error('ABORTED — no hintCore to approve; an approval of nothing is not a ruling.');
  }
  await prisma.item.update({
    where: { id: ID },
    data: {
      explanation: {
        ...e,
        // APPROVED AS WRITTEN: text untouched, authorship recorded.
        hintAuthoredBy: 'Annie',
        hintAuthority: `annie-seventieth-return.md ("WIW-19 is the best of the nine"), sha256 ${digest}`,
      },
    },
  });
  console.log(`APPLIED — ${ID} approved as written, authority sha256 ${digest.slice(0, 16)}…`);
  await prisma.$disconnect();
}

void main();
