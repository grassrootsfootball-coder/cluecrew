'use client';

/**
 * THE FOLDING ROOM (BUILD-DISTRICT-NVR §2): nets, fold-and-punch, hidden
 * shapes and plan views.
 *
 * The manipulative is a TAP-TO-FOLD step control. Each type gets its own
 * short walk, and every walk stops one step SHORT of the answer:
 *  - nets: the fold order, one square ringed at a time. Which faces end up
 *    opposite stays the child's to work out.
 *  - fold-and-punch: flat sheet → folded in half → the punch through both
 *    layers → "now picture it opened out". The opened sheet is the answer,
 *    so the tool never draws it.
 *  - hidden shapes: hold the hunted shape close and trace its edges.
 *  - plan views: drop the grid over the stacks, then look straight down.
 * Every step redraws the STEM only; no option is ever touched.
 *
 * Fade contract (spec §2) via `rail`: 'stage' = the fold control big on
 * stage, 'corner' = the same control as a small side tool, 'none' = absent
 * and the stem sits exactly as generated (Plain mode). Tap-tap throughout —
 * no drag anywhere.
 *
 * Reduced motion: folding is a step, not an animation. Each step is an
 * instant redraw with a caption, so the static render says the same thing
 * (Addendum A §2.5).
 */
import { useMemo, useState } from 'react';
import type { NvrDecoration, Visual } from '@cluecrew/core';
import { NvrOptions, NvrPanels, NvrTool, NvrVisual, readStem, type PanelRing } from './visual';
import type { EngineProps } from '../shared';

interface FoldStep {
  caption: string;
  panels: Visual[];
  decoration?: NvrDecoration;
  ring?: PanelRing | null;
  shadeRight?: boolean;
  hold?: boolean;
}

const EMPTY_SHEET: Visual[] = [{ elements: [] }];

/**
 * The walk for one section type, plus the step the item RESTS on — the step
 * whose picture is the generated stem, so the child always opens on the full
 * stem and rewinds to see how it got there.
 */
function buildWalk(
  sectionType: string,
  panels: Visual[],
  decoration: NvrDecoration | undefined,
): { steps: FoldStep[]; rest: number; forward: string } {
  const stem: FoldStep = { caption: '', panels, decoration };

  if (sectionType === 'nets') {
    const marks = panels[0]?.elements ?? [];
    return {
      forward: 'Fold it',
      rest: 0,
      steps: [
        { ...stem, caption: 'The flat net. Six squares, six marks.' },
        ...marks.map((mark, index) => ({
          ...stem,
          caption: `Fold this square up. Square ${index + 1} of ${marks.length}.`,
          ring: { panel: 0, x: mark.x, y: mark.y },
        })),
      ],
    };
  }

  if (sectionType === 'fold-punch') {
    return {
      forward: 'Fold it',
      rest: 3,
      steps: [
        { caption: 'The sheet, flat. The dashes show the fold.', panels: EMPTY_SHEET, decoration },
        {
          caption: 'Folded in half. Two layers of paper now.',
          panels: EMPTY_SHEET,
          decoration,
          shadeRight: true,
        },
        { ...stem, caption: 'The punch goes through both layers.', shadeRight: true },
        { ...stem, caption: 'Now picture it opened out.' },
      ],
    };
  }

  if (sectionType === 'hidden-shapes') {
    return {
      forward: 'Next step',
      rest: 0,
      steps: [
        { ...stem, caption: 'This is the shape you are hunting.' },
        { ...stem, caption: 'Hold it close. Trace its edges with your eyes.', hold: true },
      ],
    };
  }

  if (sectionType === 'plan-views') {
    return {
      forward: 'Next step',
      rest: 0,
      steps: [
        { ...stem, caption: 'The stacks, seen from the side.' },
        { ...stem, caption: 'Drop a grid over them.', decoration: 'plan-grid' },
        { ...stem, caption: 'Now look straight down. What covers each square?', decoration: 'plan-grid' },
      ],
    };
  }

  return { forward: 'Next step', rest: 0, steps: [{ ...stem, caption: 'Look at it closely.' }] };
}

export default function FoldingRoomEngine({
  stem,
  options,
  rail,
  selected,
  onSelect,
  outcome,
}: EngineProps) {
  const view = readStem(stem);
  const walk = useMemo(
    () => buildWalk(view.sectionType, view.panels, view.stemDecoration),
    [view.sectionType, view.panels, view.stemDecoration],
  );
  const [step, setStep] = useState(walk.rest);

  const current = walk.steps[Math.min(step, walk.steps.length - 1)] ?? walk.steps[0]!;
  const shown = rail === 'none' ? { panels: view.panels, decoration: view.stemDecoration } : current;

  return (
    <div className="crew-nvr">
      <p className="crew-nvr-prompt">{view.prompt}</p>

      <NvrPanels
        panels={shown.panels}
        decoration={shown.decoration}
        ring={rail === 'none' ? null : current.ring}
        shadeRight={rail === 'none' ? false : current.shadeRight}
      />

      {rail === 'none' ? null : (
        <NvrTool rail={rail} title="The folding room" caption={current.caption}>
          <button
            type="button"
            className="crew-tile"
            disabled={step === 0}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
          >
            Back a step
          </button>
          <button
            type="button"
            className="crew-tile"
            disabled={step >= walk.steps.length - 1}
            onClick={() => setStep((value) => Math.min(walk.steps.length - 1, value + 1))}
          >
            {walk.forward}
          </button>
          <button type="button" className="crew-tile" onClick={() => setStep(0)}>
            Start again
          </button>
          {current.hold && view.panels[0] ? (
            <NvrVisual visual={view.panels[0]} ariaLabel="The shape, held close" big />
          ) : null}
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
