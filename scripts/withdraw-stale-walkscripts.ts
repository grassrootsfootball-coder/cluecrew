/**
 * WITHDRAW THE TWO ITEMS SERVING STALE WALK SCRIPTS — `pnpm withdraw:stale-scripts`
 *
 * David's ruling, 2026-08-09, closing R40 #7. `gen-vr-03-related-words-02` and `-04` are LIVE and
 * their walk scripts name options that are no longer on the card, so a child reading the script is
 * told to consider a word they cannot see. `check:db-content` has reported both as SERVING failures
 * throughout.
 *
 * The split that stalled it: the TEXT is the reviewer's to fix, the ITEM is the platform's to serve.
 * Each side waited for the other. His ruling is that serving stale text while waiting for a redraft
 * is the wrong side of that split to err on — so the platform withdraws the item now, and the
 * redraft comes back through the reviewer's own door as it always would.
 *
 * RETIRED, not deleted: the item and its script survive for the redraft to work from.
 */
import { prisma } from '../packages/db/src/index';

const IDS = ['gen-vr-03-related-words-02', 'gen-vr-03-related-words-04'];
const DAVID = 'human:david@cluecrew.test';
const NOTE =
  'Withdrawn from service 2026-08-09: the walk script names an option no longer on the card, so the ' +
  'script teaches against a word the child cannot see. Held RETIRED pending a reviewer redraft of the ' +
  'script — the text is hers, the serving decision is the platform\'s, and serving stale text while ' +
  'waiting was the wrong way to resolve that (R40 #7).';

async function main(): Promise<void> {
  for (const id of IDS) {
    const before = await prisma.item.findUnique({ where: { id }, select: { status: true } });
    if (!before) { console.log(`  MISSING ${id}`); continue; }
    if (before.status !== 'LIVE') { console.log(`  ${id}: already ${before.status}, left alone`); continue; }
    await prisma.item.update({ where: { id }, data: { status: 'RETIRED', reviewNotes: NOTE, reviewRecordedBy: DAVID } });
    await prisma.attributionEvent.create({
      data: { recordType: 'item', recordId: id, action: 'AMENDED', field: 'status', actor: DAVID, recordedBy: DAVID, note: NOTE },
    });
    console.log(`  ${id}: LIVE -> RETIRED`);
  }
  await prisma.$disconnect();
}

void main();
