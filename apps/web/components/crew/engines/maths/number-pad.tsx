'use client';

/**
 * The number pad (BUILD-DISTRICT-MATHS §5): numeric entry exists ONLY inside
 * NUMBER FORGE fluency drills and the Bar Model Builder's labels — every
 * item-bank answer stays multiple choice, matching GL. Tap-tap, big targets,
 * no keyboard needed (but hardware digits work too via the input).
 */
import { useState } from 'react';

export function NumberPad({
  label,
  onCommit,
}: {
  label: string;
  onCommit: (value: number) => void;
}) {
  const [entry, setEntry] = useState('');

  function press(digit: string) {
    if (entry.length >= 4) return;
    setEntry(entry + digit);
  }

  return (
    <div className="crew-numberpad" role="group" aria-label={label}>
      <output className="crew-numberpad-display" aria-live="polite">
        {entry || ' '}
      </output>
      <div className="crew-numberpad-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
          <button key={digit} type="button" className="crew-tile" onClick={() => press(digit)}>
            {digit}
          </button>
        ))}
        <button
          type="button"
          className="crew-tile"
          aria-label="Take one back"
          onClick={() => setEntry(entry.slice(0, -1))}
        >
          ⌫
        </button>
        <button
          type="button"
          className="crew-tile"
          disabled={entry === ''}
          onClick={() => {
            onCommit(Number(entry));
            setEntry('');
          }}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
