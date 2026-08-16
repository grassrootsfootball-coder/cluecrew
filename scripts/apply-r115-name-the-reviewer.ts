/**
 * WRITES REVIEWER IDENTITY. A HUMAN RULING SUPPLIED IT (R63).
 *
 * Connects the naming path to the return door: "a ruling channel that cannot name the ruler is the
 * gap it was built to close, one layer in."
 *
 * A CONCERN, RAISED RATHER THAN SILENTLY ACCEPTED. `staff-reviewer@cluecrew.test` is the seed ROLE
 * account — it is the one R94 found on 463 rows resolving to no Reviewer row. Binding rev-0001 to
 * it means ANYONE HOLDING THAT LOGIN SIGNS AS ANNIE, which is R94's conflation in a new costume:
 * not a machine verdict wearing a person's name, but a shared credential wearing one. It is correct
 * for dev and it must not survive into anything real; a named reviewer needs her own account.
 *
 * SO THE DOOR IS NOT LEFT DEPENDING ON IT. `staffEmail` alone would mean the return names whoever
 * is logged in, and the person at this keyboard is DAVID TRANSCRIBING ANNIE'S PAPER RULINGS — she
 * never signs in at all. Inferring the reviewer from the login is therefore wrong on the actual
 * workflow, not just risky on the shared account. The door now takes an EXPLICIT reviewer
 * selection: whose judgement it is comes from the form, who typed it comes from the session, and
 * they are never merged. That is the same separation `recordSignature` already enforces, moved to
 * the one door that had been guessing.
 *
 * rev-0002 (Joan) gets NO email. There is no second reviewer account, she has been held since
 * 2026-08-06, and inventing an address to bind signatures to would be the worst available version
 * of this. Reported, not guessed.
 */
import { prisma } from '../packages/db/src/index';

const REVIEWER_ACCOUNT = 'staff-reviewer@cluecrew.test';

async function main(): Promise<void> {
  const annie = await prisma.reviewer.findUniqueOrThrow({ where: { id: 'rev-0001' } });
  if (annie.displayName !== 'Annie') throw new Error(`rev-0001 is ${annie.displayName} — nothing written`);
  if (annie.staffEmail) throw new Error(`rev-0001 already has ${annie.staffEmail} — nothing written. R87.`);

  const account = await prisma.parentAccount.findUnique({ where: { email: REVIEWER_ACCOUNT } });
  if (!account) throw new Error(`${REVIEWER_ACCOUNT} does not exist — nothing written`);
  if (account.staffRole !== 'REVIEWER') throw new Error(`${REVIEWER_ACCOUNT} is ${account.staffRole} — nothing written`);

  await prisma.reviewer.update({ where: { id: 'rev-0001' }, data: { staffEmail: REVIEWER_ACCOUNT } });

  const after = await prisma.reviewer.findUniqueOrThrow({ where: { id: 'rev-0001' } });
  if (after.staffEmail !== REVIEWER_ACCOUNT) throw new Error('did not land');
  console.log(`rev-0001 (${after.displayName}) -> ${after.staffEmail}   [verified by re-reading]`);

  const joan = await prisma.reviewer.findUnique({ where: { id: 'rev-0002' } });
  console.log(`rev-0002 (${joan?.displayName}) -> NO EMAIL SET. Held since `
    + `${joan?.heldUntil?.toISOString().slice(0, 10)}, and no second reviewer account exists. An `
    + 'address invented here would be a signature bound to a person who cannot hold it.');

  // WHAT THIS DOES NOT FIX, said in the run rather than only in a comment.
  console.log(`\nSTANDING CAVEAT: ${REVIEWER_ACCOUNT} is a SHARED seed role account (R94's 463 rows).`);
  console.log('Anyone holding that login now signs as Annie. Correct for dev, wrong for anything real —');
  console.log('a named reviewer needs her own account before this door writes outside development.');
  console.log('The return door does NOT rely on it: it takes an explicit reviewer selection, because');
  console.log('Annie reviews on paper and never signs in, so the login is not who ruled.');
  await prisma.$disconnect();
}

void main();
