/**
 * WHAT A CROSSED POPULATION STILL DESCRIBES, AND WHO HAS TO SAY SO (R982's forward half).
 *
 * A population digest proves what a store READ. It cannot report that the rows moved afterwards,
 * and the store that read it has no way to find out — twenty-five vr-19 executions were authored
 * against words that no longer existed and discovered it by refusal at this store's door.
 *
 * **THE REPAIR IS NOT A HABIT, IT IS A MECHANISM.** A regeneration cannot be relied on to remember
 * to declare its supersession, any more than a docstring could be relied on to stop a test
 * borrowing a reviewer (R978). So: the comparison lives HERE, in one place (R429); a supersession
 * is a NOTICE on the record; and `check:supersession-declared` fails when a case has diverged from
 * a crossed population with no notice covering it. The check is what makes the declaration
 * unforgettable, not anybody's diligence.
 */
import { createHash } from 'node:crypto';
import { canonicalJson } from './findings-digest';

const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

export const ROW_DIGEST_SPEC =
  'R729 over {stem, options:[{value,isKey}], solution} — the spec batch one\'s rowSha256 already uses, so these numbers compare directly with the one every execution carries';
export const CASE_DIGEST_SPEC = 'R729 over the itemId-ordered list of {itemId, rowSha256} for the case';

/**
 * THE SUBJECT, NAMED AS KEYS (Annie's ruling on R985, 2026-09-02).
 *
 * A published digest travels with the KEYS it was taken over, not with a sentence describing them.
 * The census artefact published each row's `rowSha256` over `{stem, options:[{value,isKey}],
 * solution}` and, two fields away, that row's `options` carrying `tag`,
 * `tagIsActiveInTheLibrary` and `execution` as well. **Nothing in it was wrong; it made the wrong
 * thing easy and the right thing invisible**, and two stores that had both read the spec correctly
 * hashed a superset of it.
 *
 * Keys are machine-readable and prose is not: a consumer reading `subjectKeys` builds the
 * projection from the artefact, where one reading `rowSha256Spec` rebuilds it from a sentence and
 * may rebuild it differently. This is R25 at one remove — send the value, not an account of it.
 */
export const ROW_DIGEST_SUBJECT_KEYS = ['stem', 'options[].value', 'options[].isKey', 'solution'] as const;

export function digestSubject(subjectKeys: readonly string[], spec: string) {
  return {
    subjectKeys,
    spec,
    andWHYTHEKEYSANDNOTONLYTHESPEC:
      'the keys are the subject; the spec says how they are serialised. A consumer that reads the keys projects exactly what was hashed. A consumer that reads only the prose rebuilds the projection from a sentence, and a field on the row that the sentence does not name will be included by anyone doing the obvious thing (R985).',
    everyOtherKeyOnTheRowIsEXCLUDED:
      'rows in this artefact carry more than the subject names — enrichment such as tag, tagIsActiveInTheLibrary and execution. They are NOT part of any digest here.',
  };
}

export interface BindableRow { itemId: string; stem: unknown; solution: unknown; options: Array<{ value: unknown; isKey: boolean }> }

/**
 * THE SPEC IS `{value, isKey}` AND THE PROJECTION HAPPENS HERE, NOT AT EACH CALLER (R984).
 *
 * The declared spec is `R729 over {stem, options:[{value,isKey}], solution}`. Callers hand this
 * function rows from two sources: live rows, which a caller naturally projects, and rows read out
 * of a crossed population, whose options still carry `tag`, `tagIsActiveInTheLibrary` and
 * `execution`. **A caller that forgets to strip them hashes a superset of the spec and produces a
 * number that agrees with nothing** — this store's supersession notices carried exactly that, and
 * the other store's identical spec computed a different value for the same row.
 *
 * So the projection is applied HERE, to whatever it is given. One place, and no caller can get it
 * half right (R429).
 */
export function rowDigest(r: BindableRow): string {
  return sha(canonicalJson(JSON.parse(JSON.stringify({
    stem: r.stem,
    options: r.options.map((o) => ({ value: o.value, isKey: o.isKey })),
    solution: r.solution ?? null,
  }))));
}

/**
 * NORMALISE WHERE YOU COMPARE, NEVER WHERE YOU READ (R570). The crossed population stringified
 * numeric option values — `"7"` where the row holds `7` — so a raw comparison reported fifty sound
 * rows as moved. Coercing values to strings on BOTH sides separates a serialisation difference
 * from a content one; the raw digest is still what an execution's `rowSha256` is checked against,
 * so both are computed and neither replaces the other.
 */
export function rowDigestNormalised(r: BindableRow): string {
  return sha(canonicalJson(JSON.parse(JSON.stringify({
    stem: r.stem, solution: r.solution ?? null,
    options: r.options.map((o) => ({
      value: o.value === null || o.value === undefined ? o.value : Array.isArray(o.value) ? o.value.map(String) : String(o.value),
      isKey: o.isKey,
    })),
  }))));
}

export interface Divergence {
  moved: string[];
  serialisationOnly: string[];
  added: string[];
  gone: string[];
  caseDigestNow: string;
  caseDigestAsRecorded: string;
  /** True when no row's CONTENT has moved — the only thing a supersession has to cover. */
  contentUnchanged: boolean;
  boundExactly: boolean;
}

/** Compare a case's live rows with the rows a crossed population recorded for it. */
export function compareToPopulation(now: readonly BindableRow[], recorded: readonly BindableRow[]): Divergence {
  const nowRaw = new Map(now.map((r) => [r.itemId, rowDigest(r)]));
  const wasRaw = new Map(recorded.map((r) => [r.itemId, rowDigest(r)]));
  const nowNorm = new Map(now.map((r) => [r.itemId, rowDigestNormalised(r)]));
  const wasNorm = new Map(recorded.map((r) => [r.itemId, rowDigestNormalised(r)]));

  const moved: string[] = [], serialisationOnly: string[] = [], gone: string[] = [], added: string[] = [];
  for (const [id, then] of wasRaw) {
    if (!nowRaw.has(id)) { gone.push(id); continue; }
    if (nowRaw.get(id) === then) continue;
    if (nowNorm.get(id) === wasNorm.get(id)) serialisationOnly.push(id);
    else moved.push(id);
  }
  for (const id of nowRaw.keys()) if (!wasRaw.has(id)) added.push(id);

  const caseDigest = (m: Map<string, string>) => sha(canonicalJson([...m].sort().map(([itemId, rowSha256]) => ({ itemId, rowSha256 }))));
  return {
    moved, serialisationOnly, added, gone,
    caseDigestNow: caseDigest(nowRaw), caseDigestAsRecorded: caseDigest(wasRaw),
    contentUnchanged: moved.length === 0 && gone.length === 0,
    boundExactly: caseDigest(nowRaw) === caseDigest(wasRaw),
  };
}

/**
 * A SUPERSESSION NOTICE. It names the population it replaces, the case, the rows whose content
 * moved, and their digests BEFORE and AFTER — because "this case changed" would send somebody to
 * re-author twenty-five rows where one moved.
 */
export interface SupersessionNotice {
  supersedesPopulation: string;
  caseId: string;
  questionType: string;
  reason: string;
  declaredOn: string;
  rowsMoved: Array<{ itemId: string; rowSha256Was: string; rowSha256Now: string }>;
  caseDigestWas: string;
  caseDigestNow: string;
  rowDigestSpec: string;
  andWHATTHEOTHERSTORESHOULDDO: string;
}
