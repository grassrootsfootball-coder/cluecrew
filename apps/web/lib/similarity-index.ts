/**
 * Where the similarity index comes from (ADDENDUM-E §2).
 *
 * The index lives in PRIVATE object storage, read-only, outside this repo
 * (§5: no similarity-index contents in the main repo). This module hides the
 * fetch behind an interface so the storage can change — today it reads a
 * file path from SIMILARITY_INDEX_PATH; swapping in S3/GCS later means one
 * new implementation of SimilarityIndexSource and nothing else.
 *
 * No index configured = the gate has not landed yet: callers get null and
 * must SKIP LOUDLY, never block all authoring on a missing file, and never
 * pretend a scan happened.
 */
import { readFileSync } from 'node:fs';
import { similarityIndexSchema, type SimilarityIndex } from '@cluecrew/core';

export interface SimilarityIndexSource {
  /** The parsed index, or null when none has landed yet. */
  load(): Promise<SimilarityIndex | null>;
}

/** Default: a read-only path in private storage, mounted or synced. */
class EnvPathIndexSource implements SimilarityIndexSource {
  private cached: SimilarityIndex | null | undefined;

  async load(): Promise<SimilarityIndex | null> {
    if (this.cached !== undefined) return this.cached;
    const path = process.env.SIMILARITY_INDEX_PATH;
    if (!path) {
      this.cached = null;
      return null;
    }
    // A CONFIGURED index that fails to load is an error, not a skip — the
    // difference between "not landed yet" and "landed but broken" must never
    // be silent (the gate would be off while everyone believed it on).
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    this.cached = similarityIndexSchema.parse(raw);
    return this.cached;
  }
}

let source: SimilarityIndexSource = new EnvPathIndexSource();

export function similarityIndexSource(): SimilarityIndexSource {
  return source;
}

/** Test seam + future storage swap. */
export function setSimilarityIndexSource(replacement: SimilarityIndexSource): void {
  source = replacement;
}
