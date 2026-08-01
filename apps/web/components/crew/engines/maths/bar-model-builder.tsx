'use client';

/**
 * The Bar Model Builder (BUILD-DISTRICT-MATHS §3) — the Alphabet Rail of
 * this district. Big on stage in See-it Mode, side tool in practice, ABSENT
 * in Plain mode: the scaffold fading is the furniture.
 *
 * Tap-tap everywhere (Phase 4 accessibility rule; drag is Phase 5 polish):
 * add a bar, tap it to work on it, split it into equal parts, label a part
 * from the number pad, mark the mystery part. The "does my model match the
 * story?" check is AUTHORED per item — the reference arrives on the stem,
 * nothing is inferred. Reduced motion is honoured by the CSS (no transforms
 * fire under prefers-reduced-motion).
 */
import { useState } from 'react';
import {
  addBar,
  emptyModel,
  labelBar,
  matchesReference,
  removeBar,
  splitBar,
  toggleUnknown,
  type BarModelState,
  type ReferenceBar,
} from '@/lib/crew/bar-model';
import { NumberPad } from './number-pad';

export function BarModelBuilder({
  reference,
  stage,
}: {
  reference: ReferenceBar[] | null;
  stage: 'stage' | 'corner';
}) {
  const [model, setModel] = useState<BarModelState>(emptyModel());
  const [workingOn, setWorkingOn] = useState<number | null>(null);
  const [labelling, setLabelling] = useState(false);
  const [verdict, setVerdict] = useState<string | null>(null);

  const selected = model.bars.find((bar) => bar.id === workingOn) ?? null;

  function update(next: BarModelState) {
    setModel(next);
    setVerdict(null);
  }

  return (
    <div className={`crew-barmodel${stage === 'corner' ? ' corner' : ''}`} aria-label="Bar Model Builder">
      <div className="crew-barmodel-bars">
        {model.bars.map((bar) => (
          <button
            key={bar.id}
            type="button"
            className={`crew-barmodel-bar${workingOn === bar.id ? ' working' : ''}`}
            onClick={() => setWorkingOn(bar.id)}
            aria-pressed={workingOn === bar.id}
            aria-label={`Bar with ${bar.parts} part${bar.parts === 1 ? '' : 's'}${bar.unknown ? ', holds the mystery number' : ''}`}
          >
            {Array.from({ length: bar.parts }, (_, index) => (
              <span key={index} className={`crew-barmodel-part${bar.unknown ? ' mystery' : ''}`}>
                {bar.unknown && index === bar.parts - 1 ? '?' : (bar.partValue ?? '')}
              </span>
            ))}
          </button>
        ))}
        {model.bars.length === 0 ? (
          <p className="crew-barmodel-empty">Build the story: add a bar for each quantity.</p>
        ) : null}
      </div>

      <div className="crew-barmodel-tools" role="group" aria-label="Builder tools">
        <button type="button" className="crew-tile" onClick={() => update(addBar(model))}>
          + bar
        </button>
        {selected ? (
          <>
            <button type="button" className="crew-tile" onClick={() => update(splitBar(model, selected.id, 1))}>
              split +
            </button>
            <button type="button" className="crew-tile" onClick={() => update(splitBar(model, selected.id, -1))}>
              join −
            </button>
            <button type="button" className="crew-tile" onClick={() => setLabelling(!labelling)}>
              label
            </button>
            <button type="button" className="crew-tile" onClick={() => update(toggleUnknown(model, selected.id))}>
              mystery ?
            </button>
            <button
              type="button"
              className="crew-tile"
              onClick={() => {
                update(removeBar(model, selected.id));
                setWorkingOn(null);
              }}
            >
              take away
            </button>
          </>
        ) : null}
      </div>

      {labelling && selected ? (
        <NumberPad
          label="Label one part"
          onCommit={(value) => {
            update(labelBar(model, selected.id, value));
            setLabelling(false);
          }}
        />
      ) : null}

      {reference ? (
        <p>
          <button
            type="button"
            className="crew-tap"
            onClick={() => setVerdict(matchesReference(model, reference).note)}
          >
            Does my model match the story?
          </button>
        </p>
      ) : null}
      {verdict ? (
        <p className="crew-barmodel-verdict" role="status">
          {verdict}
        </p>
      ) : null}
    </div>
  );
}
