import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

// R1060: "not landed" and "landed but broken" must stay distinguishable. Unset is a skip (null);
// set-but-unreadable is a NAMED refusal the import door can report, never a silent skip.
describe('the similarity index source', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

  it('returns null when no index is configured', async () => {
    vi.stubEnv('SIMILARITY_INDEX_PATH', '');
    const { similarityIndexSource } = await import('./similarity-index');
    await expect(similarityIndexSource().load()).resolves.toBeNull();
  });

  it('refuses, by name, a configured path that does not exist', async () => {
    vi.stubEnv('SIMILARITY_INDEX_PATH', join(tmpdir(), 'cc-no-such-index-r1059.json'));
    const { similarityIndexSource, SimilarityIndexUnreadable } = await import('./similarity-index');
    await expect(similarityIndexSource().load()).rejects.toBeInstanceOf(SimilarityIndexUnreadable);
  });

  it('refuses, by name, a file that is not an index', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cc-sim-'));
    const file = join(dir, 'index.json');
    writeFileSync(file, JSON.stringify({ not: 'an index' }));
    vi.stubEnv('SIMILARITY_INDEX_PATH', file);
    const { similarityIndexSource, SimilarityIndexUnreadable } = await import('./similarity-index');
    await expect(similarityIndexSource().load()).rejects.toBeInstanceOf(SimilarityIndexUnreadable);
  });
});
