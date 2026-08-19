/**
 * WRITES REVIEWED CONTENT UNGUARDED — a one-shot ruling-applier (R63).
 *
 * **ANNIE SETTLED THE TWO-COLUMN ROW: COWORK HOLDS WHAT SHE SETTLED** (2026-08-19). This store's
 * *"Touch each mark with your pencil as you count"* is superseded by *"Count each mark one at a
 * time."*
 *
 * **HER REASON IS THE PENCIL AND IT GENERALISES.** The served surface has no annotation affordance
 * — nothing a child can mark with — so touch-counting **instructs an act the child cannot perform.**
 * A hint that names an unavailable tool does not merely fail to help; it tells a child she is doing
 * it wrong when she is doing the only thing available. Same family as `vr14-step-size` naming the
 * Alphabet Rail on a screen that has no rail (R224).
 */
import { prisma } from '../packages/db/src/index';

const ID = 'nvr-count-by-glance';
const FROM = 'Touch each mark with your pencil as you count. A full-looking picture can still hold fewer.';
const TO = 'Count each mark one at a time. A full-looking picture can still hold fewer.';
const ANNIE = 'reviewer:rev-0001';

async function main() {
  const row = await prisma.misconception.findUniqueOrThrow({ where: { id: ID } });
  if (row.childHint === TO) { console.log('already settled'); await prisma.$disconnect(); return; }
  if (row.childHint !== FROM) {
    throw new Error(`REFUSED: this store no longer holds the text the ruling supersedes.\n  here: ${row.childHint}`);
  }
  await prisma.misconception.update({
    where: { id: ID },
    data: {
      childHint: TO,
      approvedBy: ANNIE,
      approvalMethod: 'two-column row settled, 2026-08-19 — Cowork holds what she settled',
      textProvenance: {
        ...((row.textProvenance ?? {}) as Record<string, unknown>),
        state: 'RECORDED',
        servingText: TO,
        approvedByPerson: ANNIE,
        authority: "Annie's ruling on the two-column row, 2026-08-19, relayed by David; the value is Cowork's, verified against her eighth return, sha256 bbb9687cece0ad21b6897f439d54d7d93bf2362d5a1fd44cae03270d854379ee",
        supersededText: {
          text: FROM,
          role: "this store's column",
          reason: 'The served surface has no annotation affordance, so touch-counting instructs an act a child cannot perform.',
        },
        recordedAt: '2026-08-19',
      },
    },
  });
  const back = await prisma.misconception.findUniqueOrThrow({ where: { id: ID } });
  console.log(`read back: ${back.childHint}`);
  console.log(`matches the ruling: ${back.childHint === TO}`);
  await prisma.$disconnect();
}

main();
