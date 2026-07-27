'use client';

/** CODEBREAKER (§2): series, codes and sums with the Alphabet Rail on hand. */
import { AlphabetRail } from './alphabet-rail';
import { OptionButton } from './option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from './shared';

export default function CodeEngine({ stem, options, rail, selected, onSelect, outcome }: EngineProps) {
  const series = Array.isArray(stem.series) ? (stem.series as Array<string | number>) : null;
  const code = stem.code as Record<string, string> | undefined;
  const sum = typeof stem.sum === 'string' ? stem.sum : null;

  return (
    <div>
      <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>
      {series ? (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {series.map((term, index) => (
            <span key={index} className="crew-tile" aria-hidden style={{ cursor: 'default' }}>
              {term}
            </span>
          ))}
          <span className="crew-tile" style={{ borderStyle: 'dashed', cursor: 'default' }}>
            ?
          </span>
        </div>
      ) : null}
      {code ? (
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {Object.entries(code).map(([from, to]) => (
            <span key={from} className="crew-tile" style={{ cursor: 'default', minWidth: 72 }}>
              {from} → {to}
            </span>
          ))}
        </div>
      ) : null}
      {sum ? <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{sum}</p> : null}

      {rail !== 'none' ? <AlphabetRail stage={rail} /> : null}

      <div role="group" aria-label="Answer choices" style={{ marginTop: '1rem' }}>
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
