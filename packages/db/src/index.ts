import { PrismaClient } from '@prisma/client';
import { assertEvent, carriesApprovalMarker, checkChildFacingText, isBlocking, refuseApprovedTrim, type AnalyticsEvent } from '@cluecrew/core';

/**
 * THE IMPORT PATH RUNS THE SAME CHECK AS THE GENERATOR PATH (annie's ruling, 2026-08-08).
 *
 * `en-comma-not-a-comma-site` reached ACTIVE carrying a banned word because it was AUTHORED IN PROSE
 * AND IMPORTED BY SCRIPT, and the import path gated nothing — while the generator path has always
 * gated at production (`assembleSpagItem` → `checkItemChildFacing`, so nothing can be generated that
 * fails). Seven of eight tag-import scripts wrote straight to the database.
 *
 * Her ruling was that the fix is the PATH, not a sweep — a sweep finds today's breaches, a shared
 * check stops tomorrow's. So the guard sits on the CLIENT, where no script can route around it:
 * every write of a `childHint`, by any path, present or future, runs the one child-facing gate.
 * A blocking failure throws rather than writing, because a hint is serving content the moment its
 * misconception is ACTIVE.
 */
/**
 * THE CAP REPORTS OVER-LENGTH ON APPROVED TEXT; IT BLOCKS ONLY UNAPPROVED TEXT (Annie's fifth
 * return, 2026-08-19 — R214).
 *
 * **THIS HALF WAS FOUND BY TESTING THE RESTORE, NOT BY READING THE RULING.** With the anti-trim
 * guard in place, the re-cap threw correctly — and so did the RESTORE, because this gate refuses
 * any hint failing the child-facing rules, and pre-cap text is over-length BY DEFINITION. So the
 * ruling's own remedy could not have been written through the ordinary client: the trim was dead
 * and the restore was dead with it.
 *
 * "Refuses and reports over-length, never trims" means the refusal is of the TRIM, not of the TEXT.
 * On approved text this now REPORTS to stderr and allows the write — the reviewer's words go in as
 * she wrote them, and the over-length is on the record where a person can read it. On unapproved
 * text it still throws: that is the door doing its job for new drafting.
 */
function gateChildHint(data: unknown, op: string, approved = false): void {
  const row = data as { id?: string; childHint?: unknown; testedTokens?: unknown } | null | undefined;
  const hint = row?.childHint;
  if (typeof hint !== 'string' || !hint.trim()) return;
  const failures = checkChildFacingText({
    role: 'hint',
    label: `misconception:${row?.id ?? '(unknown)'}`,
    text: hint,
    testedTokens: Array.isArray(row?.testedTokens) ? (row?.testedTokens as string[]) : [],
  }).filter(isBlocking);
  if (!failures.length) return;
  if (approved) {
    console.error(
      `OVER-LENGTH, REPORTED NOT BLOCKED (R214) — misconception ${row?.id ?? ''}: `
      + `${failures.map((f) => f.detail).join('; ')}\n`
      + '  This text carries an approval marker, so the cap reports and stands aside. It is the '
      + 'reviewer\'s wording; shortening it to fit is the fault this rule exists to stop.',
    );
    return;
  }
  throw new Error(
    `Refusing to ${op} misconception ${row?.id ?? ''}: its childHint fails the child-facing gate — ` +
      failures.map((f) => f.detail).join('; '),
  );
}

/**
 * EXPORT-ON-CHANGE (R66 follow-on, 2026-08-13). The disk copy is a DERIVATIVE, not a fifth opinion.
 *
 * Four misconception-library snapshots were in play at once — the platform's, Cowork's staging
 * copy, an 81-entry file on David's disk, and a 44-entry English staging file — and the 81-entry
 * one was silently consulted for a whole verification round. Its verdicts were real and scoped to
 * a library predating the ruling under test.
 *
 * The complete fix is the gates reading the platform directly; they cannot, being pure-Python file
 * readers with no route to this database. This is the available half: any write to Misconception
 * marks the exported copies stale, so a copy can be old but never SILENTLY old. Same write-path
 * shape as R62 — the property lives where the write happens, not in a habit of remembering.
 *
 * Deliberately a FLAG, not an inline re-export. Re-exporting inside a query extension would run a
 * second query inside every write, and a failed export would then fail the write that triggered
 * it — a library edit rolled back because a file could not be written is a worse fault than a
 * stale file. `pnpm export:gate-library` and `pnpm export:comprehension-library` are the doors;
 * this makes their absence visible.
 */
let misconceptionWritesSinceExport = 0;

export function noteMisconceptionWrite(): void {
  misconceptionWritesSinceExport += 1;
}

/** Non-zero means an exported library copy is stale. Read by `check:gate-library-fresh`. */
export function misconceptionWritesPending(): number {
  return misconceptionWritesSinceExport;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const baseClient = globalForPrisma.prisma ?? new PrismaClient();

/**
 * APPROVED TEXT IS NEVER SHORTENED — ENFORCED AT THE ONE DOOR (Annie's fifth return, 2026-08-19 —
 * R214). The ruling says the disable goes ON THE WRITE. There are ~30 files that write `childHint`
 * and wiring each is a list to maintain, so it goes HERE, in the single extended client every one
 * of them imports: unbypassable, one place, and a new writer is guarded on the commit that adds it.
 *
 * **THIS IS WHAT MAKES THE RESTORE SAFE.** Annie ruled the 24 pre-cap strings restored, and a
 * restore into a live trim loop would re-cap the row and overwrite the witness with the capped text
 * as its own pre-cap — destroying the only evidence and making the second cap unprovable. The
 * restore LENGTHENS, so it passes; a re-cap SHORTENS, so it throws. The window Annie identified
 * cannot open.
 *
 * It reads the row's CURRENT value and markers before allowing the write — one extra SELECT on a
 * hint update, which is the correct price for the property.
 */
async function refuseTrimOfApprovedHint(
  where: { id?: string } | undefined,
  data: Record<string, unknown> | undefined,
): Promise<boolean> {
  const id = where?.id;
  const next = data?.childHint;
  if (!id || typeof next !== 'string') return false;
  const before = await baseClient.misconception.findUnique({
    where: { id },
    select: { childHint: true, approvedBy: true, textProvenance: true },
  });
  if (!before) return false;
  const approved = carriesApprovalMarker({ approvedBy: before.approvedBy, textProvenance: before.textProvenance });
  /*
   * THE DECLARATION TRAVELS ON THE WRITE ITSELF (R257). A caller writing the approver's own
   * redraft puts her authority into `textProvenance` in the SAME update — the document and its
   * hash — and the guard reads it from there. It cannot be declared out of band, and a write that
   * does not carry it gets the refusal, which is every ordinary write.
   */
  const declared = (data?.textProvenance ?? null) as { approvedByPerson?: unknown; authority?: unknown } | null;
  const refusal = refuseApprovedTrim({
    id, before: before.childHint, after: next,
    row: { approvedBy: before.approvedBy, textProvenance: before.textProvenance },
    approverRedraft: declared
      ? { approvedBy: declared.approvedByPerson, authority: declared.authority }
      : undefined,
  });
  if (refusal) {
    throw new Error(
      `${refusal.id}.${refusal.field}: ${refusal.reason}\n`
      + `  before ${refusal.beforeWords}w -> after ${refusal.afterWords}w (${refusal.lost} lost)\n`
      + '  Enforced at the client (R214): the cap reports over-length, it never trims.',
    );
  }
  return approved;
}

export const prisma = baseClient.$extends({
  query: {
    misconception: {
      create({ args, query }) { gateChildHint(args.data, 'create'); noteMisconceptionWrite(); return query(args); },
      async update({ args, query }) {
        const approved = await refuseTrimOfApprovedHint(args.where as { id?: string }, args.data as Record<string, unknown>);
        gateChildHint({ ...(args.data as object), id: (args.where as { id?: string }).id }, 'update', approved);
        noteMisconceptionWrite();
        return query(args);
      },
      async upsert({ args, query }) {
        const approved = await refuseTrimOfApprovedHint(args.where as { id?: string }, args.update as Record<string, unknown>);
        gateChildHint(args.create, 'create');
        gateChildHint({ ...(args.update as object), id: (args.where as { id?: string }).id }, 'update', approved);
        noteMisconceptionWrite();
        return query(args);
      },
      async updateMany({ args, query }) {
        // A bulk hint write cannot name one row's before-value; refuse the SHAPE rather than
        // guess. Nothing in this repo writes childHint through updateMany today.
        if ((args.data as Record<string, unknown>)?.childHint !== undefined) {
          throw new Error(
            'updateMany may not write childHint (R214): approved text is guarded per row, and a '
            + 'bulk write has no per-row before-value to compare. Write each row by id.',
          );
        }
        noteMisconceptionWrite();
        return query(args);
      },
    },
  },
}) as unknown as PrismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
export * from './review-recording';

/**
 * The one canonical way to record an analytics event (§6).
 * Validates against the event vocabulary in @cluecrew/core; anything else throws.
 */
export async function logEvent(event: AnalyticsEvent): Promise<void> {
  const checked = assertEvent(event);
  await prisma.event.create({
    data: {
      name: checked.name,
      childId: checked.childId ?? null,
      parentId: checked.parentId ?? null,
      props: checked.props,
    },
  });
}

/**
 * THE SIGNING DOOR, re-exported so the web app can reach it. `recordSignature` is the ONLY
 * writer of a SIGNED event (R65) and `check:signing-doors` enforces that; a caller that could
 * not import it would have written the event itself, which is the fault being prevented.
 */
export { recordSignature, type SignatureRecord } from '../prisma/reviewed-guard';
