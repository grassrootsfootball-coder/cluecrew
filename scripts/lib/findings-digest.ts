import { createHash } from 'node:crypto';

/**
 * **A DIGEST NAMES THE KEYS AS THEY APPEAR IN THE FILE** (David, 2026-08-26 — R752).
 *
 * `findingsSha256` crossed with `subtree: '{control, summary, divergence, strings}'` over a
 * document whose keys are `THE_CONTROL_ANSWERS_FIRST`, `theSummary`,
 * `THE_DIVERGENCE_IS_IN_gapMarkerSpans_NOT_IN_THE_PREDICATE`, `strings`. Cowork verified it by
 * GUESSING AMONG FOUR CANDIDATE READINGS; one reproduced. It got the right answer by luck, and
 * the next reader guesses wrong and refuses an honest artefact — which is the expensive
 * direction: a false refusal costs a crossing, and a crossing costs days here.
 *
 * R729 named the SERIALISATION so the receiving party computes the same number over the same
 * bytes. This is the other half: name the SELECTION. A spec has both or it has neither, because
 * a reader who cannot assemble the subtree never reaches the question of how to serialise it.
 *
 * So the selection is no longer written by hand. `findingsDigest` takes the payload and the
 * literal key names, THROWS if any is absent from the payload (an alias fails here rather than
 * at the far door), and returns the block to spread into the artefact — so the names that are
 * declared are, necessarily, the names that were hashed.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const o = value as Record<string, unknown>;
  return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(',')}}`;
}

export function findingsDigest<T extends Record<string, unknown>>(payload: T, keys: Array<keyof T & string>) {
  const missing = keys.filter((k) => !(k in payload));
  if (missing.length) {
    throw new Error(
      `findingsDigest: ${missing.length} declared key(s) are NOT top-level keys of this document: ${missing.join(', ')}.\n` +
      `  The document's actual top-level keys are: ${Object.keys(payload).join(', ')}.\n` +
      `  R752: a digest names the keys as they appear in the file. Name these, or rename the keys.`,
    );
  }
  const subtree = Object.fromEntries(keys.map((k) => [k, payload[k]]));
  return {
    findingsSha256: createHash('sha256').update(canonicalJson(subtree), 'utf8').digest('hex'),
    howToCheckThisOnArrival: {
      subtreeKeys: keys,
      subtree: `an object of THIS DOCUMENT'S OWN TOP-LEVEL KEYS, exactly as spelled in subtreeKeys and nowhere renamed: {${keys.map((k) => JSON.stringify(k)).join(', ')}}`,
      spec: 'sha256 over json.dumps(subtree, sort_keys=True, separators=(",",":"), ensure_ascii=False).encode("utf-8") — R729. ensure_ascii defaults to True and gives a different number.',
      andTheFileDigest: 'the staging line and the .sha256 sidecar, over the whole file bytes',
    },
  };
}
