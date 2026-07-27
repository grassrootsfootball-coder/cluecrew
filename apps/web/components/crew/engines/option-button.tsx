'use client';

/**
 * The one answer tile. Every engine renders options through this so the juice
 * lives in a single place (Addendum A §2.2):
 *  - tap: press-down scale + ripple + immediate lock (§2.1 100ms rule)
 *  - correct: pops 1.12 → 1.0 with an amber spark burst from the tile
 *  - not yet: two gentle ≤6px cycles and a coral glow — never violent, never
 *    red, never a buzzer
 *
 * Plain mode (Boss Cases) deliberately keeps its calm: no pop, no sparks.
 * The contrast is the point (P4).
 */
import type { ReactNode } from 'react';

export type OptionOutcome = 'correct' | 'not-yet' | null;

/** Eight sparks on a fixed fan — deterministic, no per-render randomness. */
const SPARKS = [0, 45, 90, 135, 180, 225, 270, 315].map((degrees) => {
  const radians = (degrees * Math.PI) / 180;
  return { dx: `${Math.round(Math.cos(radians) * 58)}px`, dy: `${Math.round(Math.sin(radians) * 58)}px` };
});

export function OptionButton({
  optionId,
  selected,
  outcome,
  locked,
  plain,
  onSelect,
  children,
}: {
  optionId: string;
  selected: boolean;
  outcome: OptionOutcome;
  locked: boolean;
  plain?: boolean;
  onSelect: (optionId: string) => void;
  children: ReactNode;
}) {
  const juice = plain ? '' : outcome === 'correct' ? ' is-correct' : outcome === 'not-yet' ? ' is-not-yet' : '';

  return (
    <button
      type="button"
      className={`crew-tap${selected ? ' selected' : ''}${juice}`}
      aria-pressed={selected}
      disabled={locked}
      onClick={() => onSelect(optionId)}
    >
      {children}
      {outcome === 'correct' && !plain ? (
        <span className="crew-spark" aria-hidden>
          {SPARKS.map((spark, index) => (
            <i key={index} style={{ ['--dx' as never]: spark.dx, ['--dy' as never]: spark.dy }} />
          ))}
        </span>
      ) : null}
    </button>
  );
}
