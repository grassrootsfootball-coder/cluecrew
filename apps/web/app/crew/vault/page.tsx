import { ENGINE_CONFIG } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { childFromCookie } from '@/lib/crew/server';
import { VaultCard } from '@/components/crew/vault-card';

/**
 * The Word Vault (§5): collected cards on root-family shelves; uncollected
 * cards are silhouettes with counts — collection pull without naming what's
 * missing.
 */
export default async function VaultPage() {
  const child = (await childFromCookie())!;
  const [words, entries] = await Promise.all([
    prisma.word.findMany({ orderBy: [{ tier: 'asc' }, { headword: 'asc' }] }),
    prisma.wordVaultEntry.findMany({ where: { childId: child.id } }),
  ]);
  const entryByWord = new Map(entries.map((entry) => [entry.wordId, entry]));

  const shelves = new Map<string, typeof words>();
  for (const word of words) {
    const shelf = word.rootFamily ?? 'detective-finds';
    shelves.set(shelf, [...(shelves.get(shelf) ?? []), word]);
  }

  return (
    <main className="crew-stage">
      <h1>The Word Vault</h1>
      <p className="cc-muted">
        {entries.length} words collected. Tap a card to flip it — gilded edges mean you really know it.
      </p>

      {[...shelves.entries()].map(([shelf, shelfWords]) => {
        const collectedHere = shelfWords.filter((word) => entryByWord.has(word.id));
        const hiddenCount = shelfWords.length - collectedHere.length;
        const shelfComplete = hiddenCount === 0 && shelfWords.length > 1;
        return (
          <section key={shelf}>
            <h2 style={{ marginBottom: 0, textTransform: 'capitalize' }}>
              {shelf === 'detective-finds' ? "Detective's finds" : `The ${shelf.split('-')[1]?.toUpperCase()} family`}
              {shelfComplete ? ' · shelf complete! 🏆' : ''}
            </h2>
            <div className="crew-shelf">
              {collectedHere.map((word) => (
                <VaultCard
                  key={word.id}
                  headword={word.headword}
                  definitionChild={word.definitionChild}
                  sentence={word.sentence}
                  tier={word.tier}
                  gilded={(entryByWord.get(word.id)?.masteryLevel ?? 0) >= ENGINE_CONFIG.mastery.cracked}
                />
              ))}
              {hiddenCount > 0 ? (
                <div
                  className="crew-card silhouette"
                  aria-label={`${hiddenCount} more cards to find on this shelf`}
                >
                  <span style={{ color: 'var(--cc-ink)', opacity: 0.7 }}>
                    {hiddenCount} more to find…
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        );
      })}

      <p>
        <a className="crew-tap" href="/crew">
          ← Back to Crew HQ
        </a>
      </p>
    </main>
  );
}
