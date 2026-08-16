/**
 * WHAT THE PLATFORM HOLDS THAT THE AUTHORING SIDE HAS NEVER RECEIVED — `pnpm check:return-leg`
 *
 * Every guard in this repo so far has watched Cowork's content reaching the database: the manifest,
 * the key registry, the field baseline, the write boundary. **Annie's rulings travel the other way,
 * and nobody built the return leg.** 274 library entries crossed in one go on 2026-08-16, which
 * means every entry she has ever written had been in the same position as the one that exposed it.
 *
 * THE SHARP END. `en-comparison-vehicle-misread` carries her discriminator in `approvalNote`:
 * attribute-transfer moves a quality BETWEEN CHARACTERS, this moves it from a comparison's VEHICLE
 * to its SUBJECT, different remedies, different hints. Cowork spent a run discovering by cold read
 * that attribute-transfer was being used where it does not fit. **She wrote the answer on 8 August
 * and the export was not carrying the field** — it delivered 6 of the 22 columns the row holds and
 * named none of the reviewer-authored ones. R57 on the return leg, where nobody had been looking.
 *
 * AN UNTRAVELLED PATH AND AN ABSENT PATH ARE THE SAME THING (David, 2026-08-16). So this reports
 * three states per class and treats the middle one as seriously as the last:
 *   · CARRIED    — an export exists, names the fields, and has delivered since the content moved.
 *   · STALE      — an export exists and names the fields, and the content has moved since it ran.
 *   · NOT CARRIED— no export names these fields at all, or none exists. The content cannot travel.
 *
 * WHETHER AN EXPORT CARRIES A FIELD IS READ OUT OF ITS SOURCE, not declared here. A hand-kept list
 * of what an export carries is the allowlist that fails open — and it is exactly how the library
 * export came to claim it delivered the library while dropping the reviewer's own words.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const SCRIPTS = resolve(import.meta.dirname);
const DELIVERY_DIRS = ['/Users/davidb/Downloads/11+/from-cluecrew'];

interface ReturnPath {
  /** What a drafter would be working from. */
  cls: string;
  /** The reviewer-authored columns. An export that does not name these does not carry them. */
  fields: string[];
  /** The export that should carry it, or null when none exists. */
  exportScript: string | null;
  /** Filename prefix of the delivered artefact, or null. */
  family: string | null;
  /** How many rows hold it, filled at runtime. */
  rows: number;
  /** When the newest of those rows last changed. */
  newest: Date | null;
  why: string;
}

async function populations(): Promise<ReturnPath[]> {
  const newestOf = async (
    count: number,
    q: () => Promise<{ updatedAt?: Date; at?: Date; createdAt?: Date } | null>,
  ): Promise<Date | null> => (count === 0 ? null : ((await q()) as { updatedAt?: Date; at?: Date; createdAt?: Date } | null)
    ? ((x) => x?.updatedAt ?? x?.at ?? x?.createdAt ?? null)(await q())
    : null);

  const misApproval = await prisma.misconception.count({ where: { approvalNote: { not: null } } });
  const itemReview = await prisma.item.count({ where: { OR: [{ reviewNotes: { not: null } }, { reviewRecordNote: { not: null } }] } });
  const itemFlags = await prisma.item.count({ where: { answerFlagNote: { not: null } } });
  const wordReview = await prisma.word.count({ where: { reviewNotes: { not: null } } });
  const events = await prisma.attributionEvent.count({ where: { note: { not: null }, reviewerId: { not: null } } });
  const reviewers = await prisma.reviewer.count();

  return [
    {
      cls: 'Misconception approvals — boundary notes, method, approver',
      fields: ['approvalNote', 'approvalMethod', 'approvedBy', 'rejectionNote', 'teachback'],
      exportScript: 'export-misconception-library.ts', family: 'misconception-library-current',
      rows: misApproval,
      newest: await newestOf(misApproval, () => prisma.misconception.findFirst({
        where: { approvalNote: { not: null } }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true },
      })),
      why: 'The discriminator between two entries a drafter must choose between.',
    },
    {
      cls: 'Item review notes — why an item was returned or how it was recorded',
      fields: ['reviewNotes', 'reviewRecordNote', 'reviewMethod'],
      exportScript: 'export-reviewer-record.ts', family: 'item-review-notes',
      rows: itemReview,
      newest: await newestOf(itemReview, () => prisma.item.findFirst({
        where: { OR: [{ reviewNotes: { not: null } }, { reviewRecordNote: { not: null } }] },
        orderBy: { createdAt: 'desc' }, select: { createdAt: true },
      })),
      why: 'A drafter redrafting an item cannot see why it came back.',
    },
    {
      cls: 'Item answer flags — the gate said the item has no valid answer',
      fields: ['answerFlagNote'],
      exportScript: 'export-answer-flags.ts', family: 'answer-flags-open',
      rows: itemFlags,
      newest: await newestOf(itemFlags, () => prisma.item.findFirst({
        where: { answerFlagNote: { not: null } }, orderBy: { createdAt: 'desc' }, select: { createdAt: true },
      })),
      why: 'Unclearable by design — the child cannot answer it. The author is the only one who can fix it.',
    },
    {
      cls: 'Word review notes — vocabulary card rulings',
      fields: ['reviewNotes'],
      exportScript: 'export-reviewer-record.ts', family: 'word-review-notes',
      rows: wordReview, newest: null,
      why: 'A card ruling a drafter would otherwise rediscover.',
    },
    {
      cls: 'Attribution events — the reasoning attached to every named ruling',
      fields: ['note', 'method'],
      exportScript: 'export-reviewer-record.ts', family: 'ruling-notes',
      rows: events,
      newest: await newestOf(events, () => prisma.attributionEvent.findFirst({
        where: { note: { not: null }, reviewerId: { not: null } }, orderBy: { at: 'desc' }, select: { at: true },
      })),
      why: 'The largest body of reviewer prose in the store, and the record of WHY each decision went the way it did.',
    },
    {
      cls: 'Reviewer identity — who holds the role, since when, on what evidence',
      fields: ['displayName', 'heldFrom', 'heldUntil', 'evidence'],
      exportScript: 'export-reviewer-record.ts', family: 'reviewer-identity',
      rows: reviewers, newest: null,
      why: 'A ruling attributed to "current-reviewer" cannot be resolved to a person on the authoring side.',
    },
  ];
}

/** Whether an export NAMES a field, read out of its source. Never declared here. */
function carriedBy(script: string | null, fields: string[]): { carries: string[]; missing: string[] } {
  if (!script || !existsSync(join(SCRIPTS, script))) return { carries: [], missing: fields };
  const text = readFileSync(join(SCRIPTS, script), 'utf8');
  return {
    carries: fields.filter((f) => text.includes(f)),
    missing: fields.filter((f) => !text.includes(f)),
  };
}

/** The most recent delivery of a family, by mtime. */
function lastDelivered(family: string | null): { at: Date; name: string } | null {
  if (!family) return null;
  let best: { at: Date; name: string } | null = null;
  for (const dir of DELIVERY_DIRS) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.startsWith(family)) continue;
      const at = statSync(join(dir, name)).mtime;
      if (!best || at > best.at) best = { at, name };
    }
  }
  return best;
}

async function main(): Promise<void> {
  const paths = await populations();
  requirePopulation('check:return-leg', { 'reviewer-authored content classes': paths.length });

  let carried = 0;
  let stale = 0;
  let absent = 0;
  /** Delivered, but with no content timestamp to measure freshness against. */
  let blind = 0;

  console.log('THE RETURN LEG — what the platform holds that the authoring side works against.\n');
  for (const p of paths) {
    const { carries, missing } = carriedBy(p.exportScript, p.fields);
    const delivered = lastDelivered(p.family);
    const isCarried = p.exportScript !== null && missing.length === 0 && delivered !== null;
    const isStale = isCarried && p.newest !== null && delivered !== null && p.newest > delivered.at;

    // A class with no content timestamp can NEVER go STALE — there is nothing to compare the
    // delivery against. Its CARRIED is a weaker claim than the others and must not read the same:
    // it says the artefact exists, not that it is current.
    const blindToStaleness = isCarried && p.newest === null;
    const state = !isCarried ? 'NOT CARRIED' : isStale ? 'STALE' : blindToStaleness ? 'CARRIED?' : 'CARRIED';
    if (state === 'CARRIED') carried += 1;
    else if (state === 'CARRIED?') blind += 1;
    else if (state === 'STALE') stale += 1;
    else absent += 1;

    console.log(`  ${state.padEnd(11)} ${p.cls}`);
    console.log(`              ${p.rows} row(s) hold it · ${p.why}`);
    if (!p.exportScript) {
      console.log('              NO EXPORT NAMES THESE FIELDS. The content cannot travel at all.');
    } else {
      console.log(`              via scripts/${p.exportScript}`);
      if (missing.length) console.log(`              export does NOT name: ${missing.join(', ')}`);
      if (delivered) {
        console.log(`              last delivered ${delivered.at.toISOString()} as ${delivered.name}`);
        // BOTH SIDES OF THE COMPARISON, printed. The STALE leg has never fired, so a bare CARRIED
        // asserts only that the code took that branch. Showing the two timestamps it compared lets
        // a reader see the comparison happened, rather than trusting the verdict for it.
        console.log(`              newest content ${p.newest ? p.newest.toISOString() : '(no timestamp available for this class)'}`
          + (p.newest ? ` — ${p.newest > delivered.at ? 'AFTER' : 'before'} the delivery` : ''));
      }
      else console.log('              NEVER DELIVERED — the path exists and has not been travelled.');
    }
  }

  console.log(
    `\n${carried} carried · ${blind} carried but blind to staleness · ${stale} stale · `
    + `${absent} not carried, of ${paths.length} classes.`,
  );
  if (blind > 0) {
    console.log('  A CARRIED? class has no content timestamp, so nothing can tell whether its delivery');
    console.log('  is current. The artefact exists; that is all the verdict means.');
  }
  if (absent > 0 || stale > 0 || blind > 0) {
    console.log('\nAn untravelled path and an absent path are the same thing. Every class above that is');
    console.log('not CARRIED is reviewer judgement the authoring side is working without, or working');
    console.log('from without knowing whether it is current.');
  }
  // REPORTS, never blocks. The absent paths are unbuilt work, not a regression: failing CI on them
  // would be red from the first run and muted within a week, which is how the outbound backlog was
  // handled and the same reasoning applies here.
  await prisma.$disconnect();
}

void main();
