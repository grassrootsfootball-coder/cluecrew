/**
 * THE BORN-STALE FIELD (Annie's 176th, ruled — R822).
 *
 * **Every export carries the source's last-write moment taken at the cut, and declares itself TORN
 * where the last write falls after the cut began.**
 *
 * R819 named BORN STALE as a fifth state and said it evaded every instrument here, because every
 * discipline aims at the CROSSING: digests, sidecars, manifests, acknowledgement and the settling
 * interval all attest that the bytes that left are the bytes that arrived, and none attests that
 * the bytes that left were CURRENT. **This is the one field that does**, and it does it by refusing
 * to be a judgement: it carries two timestamps and lets anyone compare them.
 *
 * `cutBeganAt` bounds what could possibly be in the artefact. `sourceLastWriteAt` is when the source
 * last moved. **TORN is not a quality verdict** — a torn export is not wrong, it is one taken while
 * the store was still being written to, and the reader is told so rather than left to infer it from
 * a date that looks like agreement (R818: same day reads as same state, and is not).
 */
/** Structurally typed so this lib needs no Prisma type import (which does not resolve here). */
interface QueryableSource { $queryRawUnsafe<T = unknown>(sql: string): Promise<T> }

export interface CutStamp {
  cutBeganAt: string;
  cutSealedAt: string;
  sourceLastWriteAt: string | null;
  TORN: boolean;
  meaning: string;
}

/** Call at the top of an emitter, BEFORE the first read of the source. */
export function beginCut(): string {
  return new Date().toISOString();
}

/**
 * Call after the last read, before writing the artefact. Queries the source's own write log — not a
 * file mtime and not a guess — for the latest write to any content table.
 */
export async function sealCut(prisma: QueryableSource, cutBeganAt: string): Promise<CutStamp> {
  const rows = await prisma.$queryRawUnsafe<Array<{ last: Date | null }>>(
    'SELECT max(at) AS last FROM "ContentWriteLog"',
  );
  const last = rows[0]?.last ?? null;
  const sourceLastWriteAt = last ? new Date(last).toISOString() : null;
  const torn = sourceLastWriteAt !== null && sourceLastWriteAt > cutBeganAt;
  return {
    cutBeganAt,
    cutSealedAt: new Date().toISOString(),
    sourceLastWriteAt,
    TORN: torn,
    meaning: torn
      ? 'TORN — the source was written to AFTER this cut began, so this artefact may hold a mixture of states and no single moment describes it. Not a defect in the artefact; a fact about when it was taken.'
      : sourceLastWriteAt === null
        ? 'UNKNOWN — the write log is empty, so nothing here can say whether the source moved. Not "clean" (R60).'
        : 'WHOLE — the source\'s last write precedes this cut, so one moment describes the artefact and cutBeganAt is that moment.',
  };
}
