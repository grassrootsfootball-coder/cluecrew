'use client';

/**
 * A seeded Vault word inside chapter prose (Law 5): tappable, defined in a
 * small card, collectable to the Vault. Reading feeds collecting.
 */
import { useState } from 'react';

export function WordTap({
  childId,
  word,
}: {
  childId: string;
  word: { id: string; headword: string; definitionChild: string };
}) {
  const [open, setOpen] = useState(false);
  const [collected, setCollected] = useState(false);

  async function collect() {
    const response = await fetch(`/api/story/${childId}/collect-word`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId: word.id }),
    });
    if (response.ok) setCollected(true);
  }

  return (
    <span className="crew-story-word-wrap">
      <button
        type="button"
        className="crew-story-word"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {word.headword}
      </button>
      {open ? (
        <span className="crew-story-word-card" role="dialog" aria-label={`${word.headword} definition`}>
          <strong>{word.headword}</strong> — {word.definitionChild}{' '}
          {collected ? (
            <em>In your vault. 🏮</em>
          ) : (
            <button type="button" className="crew-tap" onClick={() => void collect()}>
              Collect it
            </button>
          )}
        </span>
      ) : null}
    </span>
  );
}
