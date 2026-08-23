'use client';

/** WORD WEB (§2): card decks — meanings weighed side by side. */
import { OptionButton } from './option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from './shared';
import { ScopeNote } from './scope-note';
import { splitCarrierAtGaps } from '../../../lib/crew/cloze-gap';

export default function WordWebEngine({ stem, options, selected, onSelect, outcome }: EngineProps) {
  const words = Array.isArray(stem.words) ? (stem.words as string[]) : null;
  const groupA = Array.isArray(stem.groupA) ? (stem.groupA as string[]) : null;
  const groupB = Array.isArray(stem.groupB) ? (stem.groupB as string[]) : null;
  // Carrier sentence (vr-04 T4-T5): disambiguates the sense of the word card.
  const sentence = typeof stem.sentence === 'string' ? stem.sentence : null;
  /**
   * CLOZE ONLY, AND GATED ON A PROPERTY NO VR ITEM CARRIES (R175).
   *
   * `cloze` reuses this renderer, so anything added here reaches all 21 VR types as well. A gap
   * reference is the one thing that is true of every cloze item and of nothing else in this engine,
   * so the note appears exactly where it belongs and cannot leak into VR. Both field names are
   * accepted because the migration `gapRef` -> `gapIndex` is mid-crossing (check:cloze-gaps).
   */
  const isCloze = typeof stem.gapIndex === 'number' || typeof stem.gapRef === 'number';

  return (
    <div>
      {/*
        THE CLOZE SPLIT (Annie's ruling via the fourth-return path, 2026-08-19). A cloze stem is
        stored as one string: instruction, an em-dash separator, then the carrier sentence. Printing
        it whole put typography between a child and the sentence. The renderer SPLITS at the first
        stored separator: instruction as the question line, carrier as its own block — the same
        visual grammar as the error-spot sentence preview, so "the sentence you are working on"
        looks the same in both SpaG families. A stem with no separator renders whole, unchanged.
      */}
      {(() => {
        const full = stemText(stem);
        const cut = isCloze ? full.indexOf(' — ') : -1;
        const instruction = cut >= 0 ? full.slice(0, cut).trim() : full;
        const carrier = cut >= 0 ? full.slice(cut + 3).trim() : null;
        return (
          <>
            <p style={{ fontSize: '1.15rem' }}>{instruction}</p>
            {isCloze ? <p style={{ margin: '0 0 0.6rem' }}><ScopeNote kind="on-the-card" /></p> : null}
            {carrier ? (
              /**
               * HER TWO CLOZE RULINGS ON THE SERVING SURFACE (119th thread — R668):
               * 1. THE EXCERPT IS SET OFF BY THE VEHICLE BLOCK, WITH NO ADDED QUOTATION MARKS —
               *    this block IS the set-off, and nothing here wraps the carrier in quotes.
               * 2. EVERY GAP NAMES ITSELF IN THE ACCESSIBILITY CHANNEL by the item's own gapIndex:
               *    the eye keeps the marker, the ear hears "gap N" instead of underscore noise —
               *    the marker is aria-hidden and the name is visually hidden, the same doubling
               *    the error-spot preview earned (R566: reading is parallel, listening is serial).
               */
              <p className="crew-errorspot-sentence-preview" data-testid="cloze-carrier" style={{ display: 'block' }}>
                {splitCarrierAtGaps(carrier).map((seg, n) => seg.kind === 'text'
                  ? <span key={n}>{seg.text}</span>
                  : (
                    <span key={n}>
                      <span aria-hidden="true">{seg.marker}</span>
                      <span className="fd-visually-hidden">{`gap ${typeof stem.gapIndex === 'number' ? stem.gapIndex : seg.printedIndex}`}</span>
                    </span>
                  ))}
              </p>
            ) : null}
          </>
        );
      })()}
      {sentence ? <p style={{ fontSize: '1.05rem', fontStyle: 'italic' }}>{sentence}</p> : null}
      {words ? (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {words.map((word) => (
            <span key={word} className="crew-card" style={{ width: 'auto', minHeight: 56, cursor: 'default' }}>
              <strong>{word}</strong>
            </span>
          ))}
        </div>
      ) : null}
      {groupA && groupB ? (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div className="crew-panel">
            {groupA.map((word) => (
              <div key={word}>
                <strong>{word}</strong>
              </div>
            ))}
          </div>
          <div className="crew-panel">
            {groupB.map((word) => (
              <div key={word}>
                <strong>{word}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div role="group" aria-label="Answer choices" style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap' }}>
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
