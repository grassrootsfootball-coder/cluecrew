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

/**
 * **EVERY DIGEST AN ARTEFACT CARRIES NAMES ITS OWN SPEC, NOT ITS NEIGHBOUR'S** (Annie, 2026-08-26
 * — R759). `manifestSha256` sat one line below a `howToCheckThisOnArrival` block naming the R729
 * canonical-JSON spec, and was in fact computed over newline-joined text. She recovered it by
 * guessing among three readings — the SECOND time in three turns a digest was verified by
 * guesswork, and R752 had already closed exactly this for the subtree keys.
 *
 * **The generalisation R752 missed: a spec block is not a property of the DOCUMENT, it is a
 * property of ONE DIGEST.** One block plus a second digest reads as a spec that covers both, and
 * proximity does the asserting. So a digest is emitted through `digestOverText`/`findingsDigest`,
 * which produce the value and its spec together, and `assertDigestsNameTheirSpec` refuses to stage
 * an artefact where any top-level `*Sha256` lacks one.
 */
export function digestOverText(over: string, text: string) {
  return {
    value: createHash('sha256').update(text, 'utf8').digest('hex'),
    spec: `sha256 over ${over}, encoded UTF-8. NOT the R729 canonical-JSON spec — this digest is over TEXT, and the two give different numbers over the same content.`,
  };
}

/**
 * Refuses an artefact carrying a top-level digest that names no spec. Called from `deliver()`, so
 * it cannot be forgotten — the fault it closes was a spec that had to be remembered.
 */
export function assertDigestsNameTheirSpec(artefact: Record<string, unknown>, file: string): void {
  const unspecified: string[] = [];
  for (const [key, value] of Object.entries(artefact)) {
    if (!/[Ss]ha256$/.test(key) || typeof value !== 'string') continue;
    const named = key === 'findingsSha256'
      ? typeof (artefact.howToCheckThisOnArrival as Record<string, unknown> | undefined)?.spec === 'string'
      : typeof artefact[`${key}Spec`] === 'string';
    if (!named) unspecified.push(key);
  }
  if (unspecified.length) {
    throw new Error(
      `${file}: ${unspecified.length} digest(s) name no spec: ${unspecified.join(', ')}.\n` +
      `  R759 — every digest an artefact carries names its OWN spec, not its neighbour's. Add "${unspecified[0]}Spec",\n` +
      '  or emit the digest through digestOverText/findingsDigest, which produce the value and its spec together.',
    );
  }
}

/**
 * **AN EMITTER RECOMPUTES ITS DECLARED DIGESTS BEFORE CROSSING** (Annie, 2026-08-26 — R767, ruled
 * from R766). Naming a spec is checkable at the door; HONOURING it is only checkable by
 * recomputing — so the emitting side recomputes, because it is the only side that can do it before
 * the artefact leaves.
 *
 * `assertDigestsNameTheirSpec` asked whether a spec was named and passed an artefact whose 36 row
 * digests reproduced under none of them. This closes that gap for the two shapes this store emits:
 * `findingsSha256` over the named subtree keys, and any `rowSha256` on a row, both under
 * `canonicalJson`. A digest whose spec it cannot interpret is REPORTED as uncheckable rather than
 * passed silently — an unverifiable digest is not a failure, but it must not read as a success.
 */
export function assertDeclaredDigestsRecompute(artefact: Record<string, unknown>, file: string): string[] {
  const failures: string[] = [];
  const uncheckable: string[] = [];

  const how = artefact.howToCheckThisOnArrival as { subtreeKeys?: string[] } | undefined;
  if (typeof artefact.findingsSha256 === 'string') {
    if (Array.isArray(how?.subtreeKeys)) {
      const sub = Object.fromEntries(how.subtreeKeys.map((k) => [k, artefact[k]]));
      const got = createHash('sha256').update(canonicalJson(sub), 'utf8').digest('hex');
      if (got !== artefact.findingsSha256) failures.push(`findingsSha256 declared ${String(artefact.findingsSha256).slice(0, 16)}… recomputes ${got.slice(0, 16)}…`);
    } else uncheckable.push('findingsSha256 (no subtreeKeys to recompute from)');
  }

  let rowsChecked = 0;
  for (const [key, value] of Object.entries(artefact)) {
    if (!Array.isArray(value)) continue;
    for (const [i, row] of value.entries()) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
      const r = row as Record<string, unknown>;
      if (typeof r.rowSha256 !== 'string') continue;
      const bare = Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('rowSha256')));
      const got = createHash('sha256').update(canonicalJson(bare), 'utf8').digest('hex');
      rowsChecked++;
      if (got !== r.rowSha256) failures.push(`${key}[${i}].rowSha256 declared ${r.rowSha256.slice(0, 16)}… recomputes ${got.slice(0, 16)}…`);
    }
  }

  if (failures.length) {
    throw new Error(
      `${file}: ${failures.length} declared digest(s) DO NOT REPRODUCE (R767).\n  ` + failures.slice(0, 5).join('\n  ') +
      '\n  The emitter recomputes before crossing, because the far side can only refuse what it cannot verify.',
    );
  }
  return [`recomputed: findingsSha256 + ${rowsChecked} row digest(s)`, ...uncheckable.map((u) => `UNCHECKABLE HERE: ${u}`)];
}
