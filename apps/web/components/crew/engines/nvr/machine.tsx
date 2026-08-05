'use client';

/**
 * THE MACHINE (BUILD-DISTRICT-NVR §2): series, matrices and analogies —
 * shape goes in, a rule transforms it, what comes out?
 *
 * The manipulative is a STEP-THROUGH control: the child walks the stem one
 * panel at a time and names the change before answering. It lights a panel
 * that is already on the table — it transforms the STEM only and never
 * touches the options, so it cannot hand over the answer.
 *
 * Fade contract (spec §2) via `rail`: 'stage' = the step control big on
 * stage, 'corner' = the same control as a small side tool, 'none' = absent
 * (Plain mode, GL-faithful). Tap-tap throughout — no drag anywhere.
 *
 * Reduced motion: nothing here moves. The lit panel is an outline plus a
 * spoken step count, so the static render carries the identical meaning
 * (Addendum A §2.5).
 */
import { useState } from 'react';
import { NvrOptions, NvrPanels, NvrTool, readStem } from './visual';
import type { EngineProps } from '../shared';

export default function MachineEngine({
  stem,
  options,
  rail,
  selected,
  onSelect,
  outcome,
}: EngineProps) {
  const view = readStem(stem);
  const [step, setStep] = useState(0);

  const count = view.panels.length;
  const grid = view.sectionType === 'matrix' && count > 3;
  const lit = rail === 'none' ? [] : [Math.min(step, Math.max(count - 1, 0))];

  return (
    <div className="crew-nvr">
      <p className="crew-nvr-prompt">{view.prompt}</p>

      <NvrPanels
        panels={view.panels}
        decoration={view.stemDecoration}
        layout={grid ? 'grid' : 'row'}
        lit={lit}
        tail
      />

      {rail === 'none' ? null : (
        <NvrTool
          rail={rail}
          title="Step through it"
          caption={`Step ${Math.min(step + 1, count)} of ${count}. Say what changed.`}
        >
          <button
            type="button"
            className="crew-tile"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            Back a step
          </button>
          <button
            type="button"
            className="crew-tile"
            disabled={step >= count - 1}
            onClick={() => setStep((current) => Math.min(count - 1, current + 1))}
          >
            Next step
          </button>
          <button type="button" className="crew-tile" onClick={() => setStep(0)}>
            Start again
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
