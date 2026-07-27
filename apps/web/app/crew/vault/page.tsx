import { ENGINE_CONFIG } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { childFromCookie } from '@/lib/crew/server';
import { VaultCard } from '@/components/crew/vault-card';
import { VOICE, countWord } from '@/lib/voice';

/**
 * The Word Vault (§5): collected cards on root-family shelves; uncollected
 * cards are silhouettes with counts — collection pull without naming what's
 * missing. A finished shelf lights up left to right and flips in sequence
 * (Addendum A §2.2).
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
      {entries.length === 0 ? (
        <div className="crew-panel crew-shimmer">
          <span className="glass" aria-hidden>
            🔍
          </span>
          <p style={{ margin: 0 }}>{VOICE.vaultEmpty}</p>
          <a className="crew-tap primary" href="/crew">
            Back to HQ
          </a>
        </div>
      ) : (
        <p className="cc-muted">
          {countWord(entries.length, 'word')} in the vault. Tap a card to flip it — a gilded edge
          means you really have it.
        </p>
      )}

      {[...shelves.entries()].map(([shelf, shelfWords]) => {
        const collectedHere = shelfWords.filter((word) => entryByWord.has(word.id));
        const hiddenCount = shelfWords.length - collectedHere.length;
        const shelfComplete = hiddenCount === 0 && shelfWords.length > 1;
        const familyName = shelf.split('-')[1]?.toUpperCase() ?? '';
        return (
          <section key={shelf}>
            <h2 style={{ marginBottom: 0, textTransform: 'capitalize' }}>
              {shelf === 'detective-finds' ? "Detective's finds" : `The ${familyName} family`}
            </h2>
            {shelfComplete ? (
              <p className="cc-muted" style={{ margin: '0.2rem 0 0' }}>
                {VOICE.shelfComplete(familyName || 'this')}
              </p>
            ) : null}
            <div className={`crew-shelf${shelfComplete ? ' complete' : ''}`}>
              {collectedHere.map((word, index) => (
                <VaultCard
                  key={word.id}
                  index={index}
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
                    {countWord(hiddenCount, 'card')} still out there…
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        );
      })}

      <p>
        <a className="crew-tap" href="/crew">
          ← Back to HQ
        </a>
      </p>
    </main>
  );
}
