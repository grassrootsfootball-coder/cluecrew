'use client';

/**
 * THE TURNTABLE (BUILD-DISTRICT-NVR §2): rotation and reflection.
 *
 * The manipulative turns and flips the STEM. Each tap on "Turn it" moves the
 * shown shape a quarter of a half-turn (45° on the grammar's grid); "Flip it"
 * mirrors it over the line the item draws. The transform is done by the same
 * pure functions the generator used (core grammar rotate/reflect), so what
 * the child turns is exactly what the key was built from — and the options
 * are never touched, so the tool cannot show the answer.
 *
 * Fade contract (spec §2) via `rail`: 'stage' = the turntable big on stage,
 * 'corner' = the same controls as a small side tool, 'none' = absent, with
 * the shape sitting exactly as generated (Plain mode). Tap-tap throughout —
 * no drag anywhere, which is this repo's accessibility baseline.
 *
 * Reduced motion: the turn is an instant state change, never an animation,
 * so the static render and the moving one carry identical meaning
 * (Addendum A §2.5).
 */
import { useState } from 'react';
import { reflect, reflectHorizontal, rotate, type Visual } from '@cluecrew/core';
import { NvrOptions, NvrPanels, NvrTool, readStem } from './visual';
import type { EngineProps } from '../shared';

export default function TurntableEngine({
  stem,
  options,
  rail,
  selected,
  onSelect,
  outcome,
}: EngineProps) {
  const view = readStem(stem);
  const [turn, setTurn] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const acrossTheUpDownLine = view.stemDecoration !== 'mirror-horizontal';
  const mirror = acrossTheUpDownLine ? reflect : reflectHorizontal;
  const moved = rail !== 'none' && (turn !== 0 || flipped);

  const shown: Visual[] = moved
    ? view.panels.map((panel) => ({
        elements: panel.elements.map((element) => {
          const mirrored = flipped ? mirror(element) : element;
          return turn === 0 ? mirrored : rotate(mirrored, turn);
        }),
      }))
    : view.panels;

  const caption = !moved
    ? 'Turn it or flip it. The shape moves, nothing else does.'
    : `${turn === 0 ? 'Not turned' : `Turned ${turn} degrees`}${flipped ? ', and flipped over' : ''}.`;

  return (
    <div className="crew-nvr">
      <p className="crew-nvr-prompt">{view.prompt}</p>

      <NvrPanels panels={shown} decoration={view.stemDecoration} lit={moved ? [0] : []} />

      {rail === 'none' ? null : (
        <NvrTool rail={rail} title="The turntable" caption={caption}>
          <button
            type="button"
            className="crew-tile"
            onClick={() => setTurn((current) => (current + 45) % 360)}
          >
            Turn it
          </button>
          <button
            type="button"
            className={`crew-tile${flipped ? ' landed' : ''}`}
            aria-pressed={flipped}
            onClick={() => setFlipped((current) => !current)}
          >
            Flip it
          </button>
          <button
            type="button"
            className="crew-tile"
            disabled={!moved}
            onClick={() => {
              setTurn(0);
              setFlipped(false);
            }}
          >
            Put it back
          </button>
        </NvrTool>
      )}

      <NvrOptions
        options={options}
        decoration={view.optionDecoration}
        selected={selected}
        onSelect={onSelect}
        outcome={outcome}
        plain={rail === 'none'}
      />
    </div>
  );
}
