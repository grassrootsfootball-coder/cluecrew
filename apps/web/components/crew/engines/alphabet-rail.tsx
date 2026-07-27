'use client';

/**
 * The Alphabet Rail (BUILD-PHASE-4 §3) — the signature tool. Tap two letters
 * to see the jump between them; mirror mode shows the reverse alphabet.
 * Big on stage first, corner tool later, absent in Plain mode: scaffold
 * fading built into the UI itself.
 */
import { useState } from 'react';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function AlphabetRail({ stage }: { stage: 'stage' | 'corner' }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [mirror, setMirror] = useState(false);

  function tap(letter: string) {
    setPicked((current) => {
      if (current.includes(letter)) return current.filter((candidate) => candidate !== letter);
      return [...current.slice(-1), letter];
    });
  }

  const jump =
    picked.length === 2
      ? Math.abs(LETTERS.indexOf(picked[1]!) - LETTERS.indexOf(picked[0]!))
      : null;

  return (
    <div className={`crew-rail${stage === 'corner' ? ' corner' : ''}`} aria-label="Alphabet Rail tool">
      {LETTERS.map((letter, index) => (
        <button
          key={letter}
          type="button"
          className={`letter${picked.includes(letter) ? ' picked' : ''}`}
          onClick={() => tap(letter)}
          aria-pressed={picked.includes(letter)}
        >
          {letter}
          {mirror ? <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.7 }}>{LETTERS[25 - index]}</span> : null}
        </button>
      ))}
      <div className="jump" role="status">
        {jump !== null
          ? `${picked[0]} to ${picked[1]}: ${jump} jump${jump === 1 ? '' : 's'}`
          : 'Tap two letters to count the jump'}
        {' · '}
        <button type="button" className="letter" style={{ minWidth: 84 }} onClick={() => setMirror((value) => !value)}>
          {mirror ? 'mirror on' : 'mirror off'}
        </button>
      </div>
    </div>
  );
}
