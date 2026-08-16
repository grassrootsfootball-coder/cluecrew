'use client';

/**
 * COMPREHENSION (English district) — the question and its options.
 *
 * **THIS DOES NOT RENDER THE PASSAGE, AND THAT IS DELIBERATE.** The passage surface is the one
 * thing between a signed bank and a child that is NOT a wiring fault, and it is being scoped as a
 * question for David to rule on before it is built: what a child sees, how the numbered lines are
 * shown, where the item sits, and how the cited window is made findable.
 *
 * So this component completes the ROUTING — `engines.comprehension` now resolves, and a
 * comprehension item no longer falls through `?? engines.wordweb` into a synonym tile with a blank
 * question. It does not complete the DELIVERY.
 *
 * IT SAYS SO ON SCREEN RATHER THAN LOOKING FINISHED. An item that needs a passage and has none
 * renders a visible, unmissable notice instead of a question a child cannot answer. That is the
 * whole finding this district produced: three defaults in series, each individually reasonable,
 * which together let an undeliverable item look delivered. A component that silently omitted the
 * passage would be the fourth.
 */
import { OptionButton } from './option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from './shared';

export default function ComprehensionEngine({ stem, options, selected, onSelect, outcome }: EngineProps) {
  const needsPassage = typeof stem.passageRef === 'string' && stem.passageRef.length > 0;
  const lineRefs = Array.isArray(stem.lineRefs) ? (stem.lineRefs as number[]) : null;

  return (
    <div>
      {needsPassage ? (
        <p
          data-testid="comprehension-passage-missing"
          style={{
            border: '2px solid #b00', padding: '0.75rem', borderRadius: 8,
            background: '#fff4f4', color: '#7a0000', fontWeight: 600,
          }}
        >
          This question is about a passage, and the passage is not on screen yet. Do not answer it.
          {lineRefs?.length ? ` It asks about line${lineRefs.length > 1 ? 's' : ''} ${lineRefs.join(', ')}.` : ''}
        </p>
      ) : null}

      <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>

      <div role="group" aria-label="Answer choices">
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
