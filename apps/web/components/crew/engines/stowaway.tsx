'use client';

/**
 * STOWAWAY (§2): letters that physically move. Selecting a letter previews
 * the move — it ghosts out of the first word and lands in the second.
 */
import { AlphabetRail } from './alphabet-rail';
import { optionLabel, stemText, type EngineProps } from './shared';

function Word({ word, ghostLetter }: { word: string; ghostLetter?: string | null }) {
  let ghosted = false;
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap' }} aria-label={word}>
      {word.split('').map((letter, index) => {
        const isGhost = !ghosted && ghostLetter != null && letter === ghostLetter && (ghosted = true);
        return (
          <span key={index} className={`crew-tile${isGhost ? ' ghost' : ''}`} style={{ cursor: 'default' }} aria-hidden>
            {letter}
          </span>
        );
      })}
    </span>
  );
}

export default function StowawayEngine({ stem, options, rail, selected, onSelect }: EngineProps) {
  const word1 = typeof stem.word1 === 'string' ? stem.word1 : null;
  const word2 = typeof stem.word2 === 'string' ? stem.word2 : null;
  const sentence = typeof stem.sentence === 'string' ? stem.sentence : null;
  const gapWord = typeof stem.wordWithGap === 'string' ? stem.wordWithGap : null;
  const selectedLetter = selected
    ? optionLabel(options.find((option) => option.id === selected)?.content)
    : null;
  const movingLetter = selectedLetter && selectedLetter.length === 1 ? selectedLetter : null;

  return (
    <div>
      <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>
      {word1 && word2 ? (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Word word={word1} ghostLetter={movingLetter} />
          <span aria-hidden>➜</span>
          <span style={{ display: 'inline-flex' }}>
            {movingLetter ? (
              <span className="crew-tile landed" aria-hidden>
                {movingLetter}
              </span>
            ) : null}
            <Word word={word2} />
          </span>
        </div>
      ) : null}
      {sentence ? <p className="crew-panel" style={{ fontSize: '1.2rem' }}>{sentence}</p> : null}
      {gapWord ? <p style={{ fontSize: '1.6rem', letterSpacing: '0.2em', fontWeight: 800 }}>{gapWord}</p> : null}

      {rail !== 'none' ? <AlphabetRail stage={rail} /> : null}

      <div role="group" aria-label="Answer choices" style={{ marginTop: '1rem' }}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`crew-tap${selected === option.id ? ' selected' : ''}`}
            aria-pressed={selected === option.id}
            onClick={() => onSelect(option.id)}
          >
            {optionLabel(option.content)}
          </button>
        ))}
      </div>
    </div>
  );
}
