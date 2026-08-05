'use client';

/**
 * THE LINE-UP (BUILD-DISTRICT-NVR §2): suspects on a shelf — odd-one-out,
 * like-classification, and shape codes.
 *
 * The manipulative is the TAPPABLE CODE PANEL. Tap a letter and the shown
 * examples carrying that letter light up, so the child works out what the
 * letter stands for. It reads the stem's own labelled examples and lights
 * them; the options are never touched, so the code for the last shape stays
 * the child's to work out.
 *
 * Two sibling tools cover the classification types, which have no code table:
 * like-classification gets a hold-it-close pin over the shown group, and
 * odd-one-out — whose line-up IS the option row, so there is no stem to
 * transform — gets a property checklist that steers attention one axis at a
 * time. Neither changes any option.
 *
 * Fade contract (spec §2) via `rail`: 'stage' = the code panel big on stage,
 * 'corner' = the same panel as a small side tool, 'none' = absent (Plain
 * mode). Tap-tap throughout — no drag anywhere.
 *
 * Reduced motion: no motion carries meaning here. Lit panels are outlines
 * plus a caption, so the static render says the same thing (Addendum A §2.5).
 */
import { useState } from 'react';
import { NvrOptions, NvrPanels, NvrTool, NvrVisual, readStem } from './visual';
import type { EngineProps } from '../shared';

const PROPERTIES = [
  { id: 'shape', label: 'shape', caption: 'Look only at the shape. Do four of them match?' },
  { id: 'shading', label: 'shading', caption: 'Look only at the shading. Do four of them match?' },
  { id: 'size', label: 'size', caption: 'Look only at the size. Do four of them match?' },
  { id: 'turn', label: 'turn', caption: 'Look only at the way each one points.' },
] as const;

export default function LineUpEngine({
  stem,
  options,
  rail,
  selected,
  onSelect,
  outcome,
}: EngineProps) {
  const view = readStem(stem);
  const [letter, setLetter] = useState<string | null>(null);
  const [held, setHeld] = useState<number | null>(null);
  const [property, setProperty] = useState<string | null>(null);

  const labels = view.panelLabels ?? null;
  const codePanel = Boolean(labels && labels.some((label) => label !== '?'));
  const letters = codePanel
    ? [...new Set((labels ?? []).filter((label) => label !== '?').flatMap((label) => label.split('')))]
    : [];
  const carrying = letter
    ? (labels ?? []).flatMap((label, index) => (label !== '?' && label.includes(letter) ? [index] : []))
    : [];

  const lit = rail === 'none' ? [] : codePanel ? carrying : held !== null ? [held] : [];
  const holdable = !codePanel && view.panels.length > 0;

  return (
    <div className="crew-nvr">
      <p className="crew-nvr-prompt">{view.prompt}</p>

      <NvrPanels
        panels={view.panels}
        labels={labels}
        decoration={view.stemDecoration}
        lit={lit}
      />

      {rail !== 'none' && codePanel ? (
        <NvrTool
          rail={rail}
          title="The code panel"
          caption={
            letter
              ? `${letter} sits on ${carrying.length} of them. What do those share?`
              : 'Tap a letter. The pictures carrying it light up.'
          }
        >
          {letters.map((value) => (
            <button
              key={value}
              type="button"
              className={`crew-tile${letter === value ? ' landed' : ''}`}
              aria-pressed={letter === value}
              onClick={() => setLetter((current) => (current === value ? null : value))}
            >
              {value}
            </button>
          ))}
        </NvrTool>
      ) : null}

      {rail !== 'none' && holdable ? (
        <NvrTool
          rail={rail}
          title="Hold it close"
          caption={
            held === null
              ? 'Tap a picture to hold it close.'
              : `Holding picture ${held + 1}. Compare it with the group.`
          }
        >
          {view.panels.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`crew-tile${held === index ? ' landed' : ''}`}
              aria-pressed={held === index}
              onClick={() => setHeld((current) => (current === index ? null : index))}
            >
              {index + 1}
            </button>
          ))}
          {held !== null && view.panels[held] ? (
            <NvrVisual
              visual={view.panels[held]}
              decoration={view.stemDecoration}
              ariaLabel={`Picture ${held + 1}, held close`}
              big
            />
          ) : null}
        </NvrTool>
      ) : null}

      {rail !== 'none' && !codePanel && !holdable ? (
        <NvrTool
          rail={rail}
          title="One thing at a time"
          caption={PROPERTIES.find((entry) => entry.id === property)?.caption ?? 'Pick one thing to check first.'}
        >
          {PROPERTIES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`crew-tile${property === entry.id ? ' landed' : ''}`}
              aria-pressed={property === entry.id}
              onClick={() => setProperty((current) => (current === entry.id ? null : entry.id))}
            >
              {entry.label}
            </button>
          ))}
        </NvrTool>
      ) : null}

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
