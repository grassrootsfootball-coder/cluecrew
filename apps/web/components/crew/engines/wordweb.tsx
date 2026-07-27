'use client';

/** WORD WEB (§2): card decks — meanings weighed side by side. */
import { optionLabel, stemText, type EngineProps } from './shared';

export default function WordWebEngine({ stem, options, selected, onSelect }: EngineProps) {
  const words = Array.isArray(stem.words) ? (stem.words as string[]) : null;
  const groupA = Array.isArray(stem.groupA) ? (stem.groupA as string[]) : null;
  const groupB = Array.isArray(stem.groupB) ? (stem.groupB as string[]) : null;

  return (
    <div>
      <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>
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
