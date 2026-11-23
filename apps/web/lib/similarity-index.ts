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

/**
 * A CONFIGURED index that cannot be read (R1060). Still a refusal, never a skip: a silent skip would
 * switch the gate off while everyone believed it on. But it is a NAMED refusal, so the import door
 * can stop the batch and say why, where a bare ENOENT surfaced as "Application error" with a digest.
 */
export class SimilarityIndexUnreadable extends Error {
  constructor(readonly path: string, readonly reason: string) {
    super(`SIMILARITY_INDEX_PATH is set to ${path}, and it cannot be read: ${reason}`);
    this.name = 'SimilarityIndexUnreadable';
  }
}

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
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(path, 'utf8'));
    } catch (error) {
      throw new SimilarityIndexUnreadable(path, (error as Error).message);
    }
    const parsed = similarityIndexSchema.safeParse(raw);
    if (!parsed.success) throw new SimilarityIndexUnreadable(path, `not a similarity index (${parsed.error.issues[0]?.message ?? 'shape refused'})`);
    this.cached = parsed.data;
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
