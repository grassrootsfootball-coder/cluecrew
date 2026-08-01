'use client';

/**
 * The clue-tap (map rule 5, scoped task 2): one optional in-reader
 * interactive beat — a REAL item in a no-stakes frame. No scoring, no
 * mastery writes, no attempt records: the answer is graded locally from the
 * fetched payload and nothing is posted anywhere. Skippable always;
 * reduced-motion adds nothing to reduce (no animation exists here). The
 * taste in the story; the meal in the cases.
 */
import { useState } from 'react';

interface ClueTapItem {
  prompt: string;
  stem: { prompt?: string };
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
}

export function ClueTap({ childId, itemId, prompt }: { childId: string; itemId: string; prompt: string }) {
  const [item, setItem] = useState<ClueTapItem | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  if (skipped) return null;

  async function open() {
    const response = await fetch(`/api/story/${childId}/clue-tap/${itemId}`);
    if (response.ok) setItem({ prompt, ...(await response.json()) });
    else setSkipped(true); // the story never blocks on a missing beat
  }

  if (!item) {
    return (
      <div className="crew-story-cluetap">
        <button type="button" className="crew-tap primary" onClick={() => void open()}>
          {prompt}
        </button>{' '}
        <button type="button" className="crew-tap" onClick={() => setSkipped(true)}>
          Keep reading
        </button>
      </div>
    );
  }

  const solved = picked === item.correctOptionId;

  return (
    <div className="crew-story-cluetap" role="group" aria-label="A clue to try">
      <p style={{ fontWeight: 600 }}>{item.stem.prompt ?? ''}</p>
      <div className="crew-story-cluetap-options">
        {item.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`crew-tile${picked === option.id ? (option.id === item.correctOptionId ? ' lit' : ' dim') : ''}`}
            onClick={() => setPicked(option.id)}
            disabled={solved}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" style={{ minHeight: '1.4rem' }}>
        {picked === null
          ? ''
          : solved
            ? 'There it is. The cases have more where that came from.'
            : 'Not yet — look once more.'}
      </p>
      <button type="button" className="crew-tap" onClick={() => setSkipped(true)}>
        Back to the story
      </button>
    </div>
  );
}
