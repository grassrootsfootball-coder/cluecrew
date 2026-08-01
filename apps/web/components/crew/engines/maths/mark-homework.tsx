'use client';

/**
 * MARK THE HOMEWORK (BUILD-DISTRICT-MATHS §2): a worked solution with one
 * authored slip. The child reads the steps and taps the one that doesn't
 * hold — Walk-mode's assessment twin. The OPTIONS are the steps, so Case
 * and Plain render from the same rows (in Plain the steps are a plain
 * numbered list and the answer is a plain choice).
 *
 * Voice note: the child-facing frame is "find the slip" — D1 applies here
 * like everywhere.
 *
 * Stem payload: { prompt, working: string[] } where working[i] pairs with
 * option i (the step text repeated as the option content).
 */
import { OptionButton } from '../option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from '../shared';

export default function MarkHomeworkEngine({ stem, options, rail, selected, onSelect, outcome }: EngineProps) {
  const working = Array.isArray(stem.working) ? (stem.working as string[]) : [];

  return (
    <div>
      <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>

      {rail !== 'none' && working.length > 0 ? (
        <div className="crew-homework" aria-hidden>
          {working.map((line, index) => (
            <p key={index} className="crew-homework-line">
              <span className="crew-homework-num">{index + 1}.</span> {line}
            </p>
          ))}
        </div>
      ) : null}

      <p style={{ fontWeight: 600 }}>Tap the step where the slip lives.</p>
      <div role="group" aria-label="Answer choices">
        {options.map((option, index) => (
          <OptionButton
            key={option.id}
            optionId={option.id}
            selected={selected === option.id}
            outcome={outcomeFor(option.id, outcome)}
            locked={Boolean(outcome)}
            onSelect={onSelect}
          >
            {`Step ${index + 1}: ${optionLabel(option.content)}`}
          </OptionButton>
        ))}
      </div>
    </div>
  );
}
