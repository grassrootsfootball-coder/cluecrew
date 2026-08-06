'use client';

/** WORD WEB (§2): card decks — meanings weighed side by side. */
import { OptionButton } from './option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from './shared';

export default function WordWebEngine({ stem, options, selected, onSelect, outcome }: EngineProps) {
  const words = Array.isArray(stem.words) ? (stem.words as string[]) : null;
  const groupA = Array.isArray(stem.groupA) ? (stem.groupA as string[]) : null;
  const groupB = Array.isArray(stem.groupB) ? (stem.groupB as string[]) : null;
  // Carrier sentence (vr-04 T4-T5): disambiguates the sense of the word card.
  const sentence = typeof stem.sentence === 'string' ? stem.sentence : null;

  return (
    <div>
      <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>
      {sentence ? <p style={{ fontSize: '1.05rem', fontStyle: 'italic' }}>{sentence}</p> : null}
      {words ? (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {words.map((word) => (
            <span key={word} className="crew-card" style={{ width: 'auto', minHeight: 56, cursor: 'default' }}>
              <strong>{word}</strong>
            </span>
          ))}
        </div>
      ) : null}
      {groupA && groupB ? (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div className="crew-panel">
            {groupA.map((word) => (
              <div key={word}>
                <strong>{word}</strong>
              </div>
            ))}
          </div>
          <div className="crew-panel">
            {groupB.map((word) => (
              <div key={word}>
                <strong>{word}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div role="group" aria-label="Answer choices" style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap' }}>
        {options.map((option) => (
          <OptionButton
            key={option.id}
            optionId={option.id}
            selected={selected === option.id}
            outcome={outcomeFor(option.id, outcome)}
            locked={Boolean(outcome)}
            onSelect={onSelect}
          >
            {optionLabel(option.content)}
          </OptionButton>
        ))}
      </div>
    </div>
  );
}
