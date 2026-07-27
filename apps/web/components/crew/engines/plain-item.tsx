'use client';

/**
 * Plain mode (§2, P4): exam-faithful multiple choice from the SAME item rows.
 * No theme, no mascot, no rail — the contrast is the pedagogy. Used by the
 * boss closer now and Phase 6 mocks later.
 */
import { OptionButton } from './option-button';
import { optionLabel, outcomeFor, type EngineProps } from './shared';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function PlainItem({ stem, options, selected, onSelect, outcome }: EngineProps) {
  const series = Array.isArray(stem.series) ? (stem.series as Array<string | number>).join(',  ') : null;
  const parts: string[] = [];
  if (typeof stem.prompt === 'string') parts.push(stem.prompt);
  if (typeof stem.word1 === 'string' && typeof stem.word2 === 'string') {
    parts.push(`${stem.word1}   (${stem.word2})`);
  }
  if (typeof stem.sentence === 'string') parts.push(stem.sentence);
  if (typeof stem.wordWithGap === 'string') parts.push(stem.wordWithGap);
  if (typeof stem.sum === 'string') parts.push(stem.sum);
  if (Array.isArray(stem.words)) parts.push((stem.words as string[]).join(',  '));
  if (Array.isArray(stem.pairA) && typeof stem.stemWord === 'string') {
    parts.push(`${(stem.pairA as string[]).join(' is to ')} as ${stem.stemWord} is to …`);
  }
  if (Array.isArray(stem.clues)) parts.push(...(stem.clues as string[]));
  if (typeof stem.question === 'string') parts.push(stem.question);
  if (stem.code && typeof stem.code === 'object') {
    parts.push(
      Object.entries(stem.code as Record<string, string>)
        .map(([from, to]) => `${from} = ${to}`)
        .join(',  '),
    );
  }

  return (
    <div className="crew-plain">
      {parts.map((part, index) => (
        <p key={index} style={{ margin: '0 0 0.6rem' }}>
          {part}
        </p>
      ))}
      {series ? <p style={{ fontWeight: 600 }}>{series}, …</p> : null}
      <ol style={{ paddingLeft: 0, listStyle: 'none' }}>
        {options.map((option, index) => (
          <li key={option.id} style={{ margin: '0.3rem 0' }}>
            {/* plain: no pop, no sparks — the Boss Case keeps its calm (P4) */}
            <OptionButton
              optionId={option.id}
              selected={selected === option.id}
              outcome={outcomeFor(option.id, outcome)}
              locked={Boolean(outcome)}
              plain
              onSelect={onSelect}
            >
              {LETTERS[index]}. {optionLabel(option.content)}
            </OptionButton>
          </li>
        ))}
      </ol>
    </div>
  );
}
