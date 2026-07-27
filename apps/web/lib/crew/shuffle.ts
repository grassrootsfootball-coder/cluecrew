/**
 * Deterministic option shuffling (Phase 4 gate follow-up). Items are stored
 * in authored order (correct option first, by convention of the generators);
 * children must never receive that order.
 *
 * The shuffle is seeded on (childId, itemId): stable for a given child across
 * revisits — the same item never silently rearranges under a child — but
 * different children see different orders. Server-side ONLY: no client ever
 * receives authored order. Applied identically in Case mode, Plain mode,
 * Boss Cases, and the CMS review preview.
 */

/** FNV-1a 32-bit string hash → seed. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 PRNG — small, deterministic, well distributed. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates with a seeded PRNG. Never mutates the input. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = makeRandom(hashSeed(seed));
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap]!, result[index]!];
  }
  return result;
}

/** The one canonical way to order an item's options for a viewer. */
export function shuffleOptionsForChild<T>(
  options: readonly T[],
  childId: string,
  itemId: string,
): T[] {
  return seededShuffle(options, `${childId}:${itemId}`);
}
