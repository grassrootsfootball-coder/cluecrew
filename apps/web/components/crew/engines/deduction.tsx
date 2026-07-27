'use client';

/**
 * DEDUCTION DEN (§2): statements as clue cards the child can mark as used
 * while working the mini-mystery.
 */
import { useState } from 'react';
import { optionLabel, stemText, type EngineProps } from './shared';

export default function DeductionEngine({ stem, options, selected, onSelect }: EngineProps) {
  const clues = Array.isArray(stem.clues) ? (stem.clues as string[]) : [];
  const question = typeof stem.question === 'string' ? stem.question : '';
  const [used, setUsed] = useState<Set<number>>(new Set());

  function toggleClue(index: number) {
    setUsed((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div>
      <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>
      <div style={{ display: 'grid', gap: '8px', maxWidth: 640 }}>
        {clues.map((clue, index) => (
          <button
            key={index}
            type="button"
            className={`crew-tap${used.has(index) ? ' selected' : ''}`}
            style={{ textAlign: 'left', fontWeight: 500 }}
            aria-pressed={used.has(index)}
            onClick={() => toggleClue(index)}
          >
            🔎 {clue}
            {used.has(index) ? ' ✓' : ''}
          </button>
        ))}
      </div>
      <p style={{ fontWeight: 700, fontSize: '1.15rem' }}>{question}</p>

      <div role="group" aria-label="Answer choices">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`crew-tap${selected === option.id ? ' selected' : ''}`}
            aria-pressed={selected === option.id}
            onClick={() => onSelect(option.id)}
          >
            {optionLabel(option.content)}
          </button>
        ))}
      </div>
    </div>
  );
}
