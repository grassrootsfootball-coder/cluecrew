'use client';

/**
 * THE WORKSHOP (BUILD-DISTRICT-MATHS §2): word problems across every strand,
 * with the Bar Model Builder beside the story. The Builder follows the rail
 * contract exactly — stage in See-it, corner in practice, ABSENT in Plain —
 * and answers stay multiple choice, matching GL.
 *
 * Stem payload: { prompt, barModel?: { reference: ReferenceBar[] } }.
 */
import { OptionButton } from '../option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from '../shared';
import type { ReferenceBar } from '@/lib/crew/bar-model';
import { BarModelBuilder } from './bar-model-builder';

export default function WorkshopEngine({ stem, options, rail, selected, onSelect, outcome }: EngineProps) {
  const barModel = stem.barModel as { reference?: ReferenceBar[] } | undefined;

  return (
    <div>
      <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>

      {rail !== 'none' ? (
        <BarModelBuilder reference={barModel?.reference ?? null} stage={rail} />
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
