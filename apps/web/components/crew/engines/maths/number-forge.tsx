'use client';

/**
 * NUMBER FORGE (BUILD-DISTRICT-MATHS §2): number, place value, operations
 * and sequences. Renders an optional number line and the Estimation Duel
 * frame ("closer to 300 or 500?" — clock-free, the mascot never hurries).
 * Item-bank answers are MC; free numeric entry lives only in the fluency
 * drills, not here.
 *
 * Stem payload: { prompt, numberLine?: { min, max, marks?: number[] },
 *                 duel?: true }.
 */
import { OptionButton } from '../option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from '../shared';

function NumberLine({ min, max, marks }: { min: number; max: number; marks: number[] }) {
  const span = max - min || 1;
  const position = (value: number) => ((value - min) / span) * 100;
  return (
    <svg viewBox="0 0 100 14" className="crew-numberline" aria-label={`Number line from ${min} to ${max}`}>
      <line x1="2" y1="7" x2="98" y2="7" stroke="currentColor" strokeWidth="0.6" />
      {[min, ...marks, max].map((value) => (
        <g key={value}>
          <line
            x1={2 + position(value) * 0.96}
            y1="4"
            x2={2 + position(value) * 0.96}
            y2="10"
            stroke="currentColor"
            strokeWidth="0.6"
          />
          <text x={2 + position(value) * 0.96} y="13.5" fontSize="3.2" textAnchor="middle">
            {value}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function NumberForgeEngine({ stem, options, rail, selected, onSelect, outcome }: EngineProps) {
  const numberLine = stem.numberLine as { min: number; max: number; marks?: number[] } | undefined;
  const duel = stem.duel === true;

  return (
    <div>
      <p style={{ fontSize: duel ? '1.4rem' : '1.15rem', fontWeight: duel ? 700 : undefined }}>
        {stemText(stem)}
      </p>
      {numberLine && rail !== 'none' ? (
        <NumberLine min={numberLine.min} max={numberLine.max} marks={numberLine.marks ?? []} />
      ) : null}
      <div
        role="group"
        aria-label="Answer choices"
        style={{ marginTop: '1rem' }}
        className={duel ? 'crew-duel' : undefined}
      >
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
