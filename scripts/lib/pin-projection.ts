/**
 * A SIGNATURE IS OVER CONTENT, NOT AN ARRANGEMENT (Annie's ruling, 2026-09-02).
 *
 * Her ruling with David's instruction: do B and C now — ORDER THE READ so no new signature can
 * decay, and VERIFY AGAINST THE RECORDED ORDER as the vr-10 publication did. Option A —
 * canonicalising the projection for signatures already taken — waits on her word, with the 366
 * figure in front of her (R971).
 *
 * WHY B AND C ARE DIFFERENT ACTS AND BOTH ARE NEEDED. B fixes the FUTURE: a signature taken over
 * a deterministically ordered read cannot be moved by a later write to some other option. It
 * cannot fix the PAST, because a stored hash was taken over whatever order the database returned
 * that day, and re-ordering the read now would simply break it — that is option A wearing B's
 * clothes. C fixes the past without spending a signature: the order a row was signed in is
 * recorded in the crossed population artefact the signature names, so verification uses the
 * pin's own context. Evidenced, not permissive: no permutation search and no fallback to
 * comparing content.
 */
import { createHash } from 'node:crypto';
import { canonicalJson } from './findings-digest';

const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

/**
 * B — THE ORDERED READ. Every option read that will be hashed into a signature uses this, so the
 * order is a property of the query and not of what the storage engine last did. `id` is stable,
 * opaque and never rewritten; sorting by VALUE would be canonicalisation, which is option A.
 */
export const ORDERED_OPTION_READ = {
  select: { content: true, isCorrect: true },
  orderBy: { id: 'asc' },
} as const;

export interface PinRow {
  stem: unknown;
  explanation: unknown;
  options: ReadonlyArray<{ content: unknown; isCorrect: boolean }>;
}

const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object'
    ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)]))
    : v;

/** Both retention projections of a row, in the option order given (R888: which one a pin was taken under is discovered, never assumed). */
export function pinHashes(row: PinRow): { retentionIncluded: string; retentionExcluded: string } {
  const p = JSON.parse(JSON.stringify({
    stem: row.stem,
    options: row.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })),
    explanation: row.explanation,
  }));
  return { retentionIncluded: sha(canonicalJson(p)), retentionExcluded: sha(canonicalJson(strip(p) as object)) };
}

export type PinVerdict =
  | { verified: true; under: 'the recorded order' | 'the current read order'; projection: 'retention-included' | 'retention-excluded' }
  | { verified: false; under: null; projection: null; why: string };

/**
 * C — VERIFY AGAINST THE RECORDED ORDER, THEN THE CURRENT ONE.
 *
 * `recordedOrder` is the option VALUES in the order the population artefact the signature names
 * records them. It is tried FIRST because it is the order the hash was taken in; the current read
 * order is tried second and reported when it is what matched, so a reader can see which rows are
 * still resting on the live database.
 *
 * A row whose recorded order does not name every option it holds is NOT partially matched — the
 * recorded order is dropped and the row verifies under the current order or not at all. A partial
 * arrangement is not the arrangement that was signed.
 */
export function verifyPin(
  row: PinRow,
  storedHashes: ReadonlySet<string>,
  recordedOrder?: readonly string[],
): PinVerdict {
  const val = (o: { content: unknown }) => String((o.content as { value?: unknown })?.value ?? '');
  type Under = 'the recorded order' | 'the current read order';
  const attempts: Array<[Under, PinRow]> = [];
  if (recordedOrder && recordedOrder.length === row.options.length) {
    const reordered = recordedOrder.map((v) => row.options.find((o) => val(o) === v)).filter(Boolean) as PinRow['options'];
    if (reordered.length === row.options.length) attempts.push(['the recorded order', { ...row, options: reordered }]);
  }
  attempts.push(['the current read order', row]);
  for (const [under, candidate] of attempts) {
    const h = pinHashes(candidate);
    if (storedHashes.has(h.retentionIncluded)) return { verified: true, under, projection: 'retention-included' };
    if (storedHashes.has(h.retentionExcluded)) return { verified: true, under, projection: 'retention-excluded' };
  }
  return { verified: false, under: null, projection: null,
    why: `no stored hash matches this row under ${attempts.map((a) => a[0]).join(' or ')}. This is NOT proof the content changed: subjectHash carries more than one subject in this estate (R970), so check whether the signature is over an execution text or the review surface's own subject before reading it as drift.` };
}

/**
 * THE CANONICAL-ORDER SUBJECT (her 216th; SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER):
 * retention stripped, options SORTED BY VALUE. Binding on every signature made from 2026-09-02,
 * and the reason a later write that moves an option row cannot break a pin (R1012's row 01).
 * One implementation — `backfill-signature-subjects.ts` computes the same thing inline.
 */
export function canonicalOrderHash(row: PinRow): string {
  const value = (o: { content: unknown }) => { const v = (o.content as { value?: unknown })?.value; return Array.isArray(v) ? v.join(',') : String(v); };
  return pinHashes({ ...row, options: [...row.options].sort((a, b) => value(a).localeCompare(value(b))) }).retentionExcluded;
}
