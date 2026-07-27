'use client';

/**
 * BRIDGE (§2): the relationship between pair A visually lifts and drops onto
 * pair B — the child builds the bridge before answering.
 */
import { OptionButton } from './option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from './shared';

export default function BridgeEngine({ stem, options, selected, onSelect, outcome }: EngineProps) {
  const pairA = Array.isArray(stem.pairA) ? (stem.pairA as string[]) : null;
  const stemWord = typeof stem.stemWord === 'string' ? stem.stemWord : null;
  const chosen = selected ? optionLabel(options.find((option) => option.id === selected)?.content) : '?';

  return (
    <div>
      <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>
      {pairA && stemWord ? (
        <div style={{ display: 'grid', gap: '0.5rem', justifyItems: 'center', maxWidth: 560 }}>
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
            <span className="crew-tile" style={{ cursor: 'default', minWidth: 90 }}>{pairA[0]}</span>
            <svg width="90" height="30" aria-hidden>
              <path d="M5 25 Q45 -8 85 25" stroke="var(--cc-nvr-violet)" strokeWidth="4" fill="none" />
            </svg>
            <span className="crew-tile" style={{ cursor: 'default', minWidth: 90 }}>{pairA[1]}</span>
          </div>
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
            <span className="crew-tile" style={{ cursor: 'default', minWidth: 90 }}>{stemWord}</span>
            <svg width="90" height="30" aria-hidden>
              <path
                d="M5 25 Q45 -8 85 25"
                stroke="var(--cc-nvr-violet)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={selected ? undefined : '6 6'}
              />
            </svg>
            <span className="crew-tile" style={{ cursor: 'default', minWidth: 90, borderStyle: selected ? 'solid' : 'dashed' }}>
              {chosen}
            </span>
          </div>
          <p className="cc-muted" style={{ margin: 0 }}>
            The same bridge carries both pairs.
          </p>
        </div>
      ) : null}

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
