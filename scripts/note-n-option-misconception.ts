/** en-n-option-avoidance: unreachable BY DESIGN in speech, not unused (annie, 2026-08-09). */
import { prisma } from '../packages/db/src/index';
const ID = 'en-n-option-avoidance';
const NOTE =
  'REACHABILITY (annie, 2026-08-09): unreachable BY DESIGN in spag-punct-speech, which carries no N ' +
  'option at all (R33) — recorded as designed-out rather than unused, so a later coverage sweep does ' +
  'not read it as a gap and re-add the option. Reachable in the other EIGHT spot families, each ' +
  'keying N at a real rate.';
(async () => {
  const m = await prisma.misconception.findUnique({ where: { id: ID } });
  if (!m) { console.log(`${ID}: absent`); return; }
  await prisma.misconception.update({
    where: { id: ID },
    data: { approvalNote: [m.approvalNote, NOTE].filter(Boolean).join(' — ') },
  });
  console.log(`${ID}: reachability recorded (status ${m.status})`);
  await prisma.$disconnect();
})();
