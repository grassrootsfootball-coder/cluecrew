'use client';

/**
 * ERROR-SPOT (SPaG) — the options ARE the sentence, in order.
 *
 * `en-spag-punct-spot` and `en-spag-spelling-spot` are one interaction: four segments that
 * reconstruct a single sentence, plus **N — "No mistake"**, which is a verdict ABOUT the sentence
 * rather than a piece of it. The stem says which mistake class to hunt.
 *
 * **THE RENDERING CONSTRAINT IS THE ITEM, NOT A PREFERENCE.** `stem.segmentsInOptions` means the
 * four options are the sentence in pieces, in order. Laid out as independent tiles the child cannot
 * READ the sentence, so she cannot find the mistake — a stacked list shows her a different question
 * from the one authored. So the segments flow inline, in order, wrapping as prose.
 *
 * **48px IS MET BY LINE SPACING, NOT BY PADDING** (David's ruling). A 48px tile has padding and
 * margin and stops being prose; a 48px LINE BOX keeps the words reading as a sentence while giving
 * every segment a full-height tap target. Hence `lineHeight: 48px` on the paragraph and vertical
 * padding of zero on the segments.
 *
 * **THE BOUNDARY PROBLEM, which is the whole design.** If segment edges are invisible the child
 * cannot choose deliberately; if they are loud the sentence stops reading as a sentence. What is
 * used here, weakest cue that still works:
 *   · a thin vertical rule BETWEEN segments only — not a box around each, so no segment is
 *     enclosed and the eye still runs left-to-right through the sentence;
 *   · a resting tint so faint it reads as paper rather than as a control, alternating nothing —
 *     every segment looks the same, because one that stands out would be a hint;
 *   · the segment's own words carry the emphasis on hover/focus/selection, where a deliberate
 *     choice is being made and loudness is wanted.
 * The separator is a `::before` on every segment after the first, so it belongs to the GAP and not
 * to either side of it.
 *
 * **N IS SET APART BY POSITION AND SHAPE, NOT BY A LABEL.** It sits on its own line beneath the
 * sentence, as a bordered pill rather than an inline run of words — a different kind of object,
 * said by the layout. A label explaining that N is not part of the sentence would be an admission
 * the layout had failed.
 */
import { OptionButton } from './option-button';
import { ScopeNote } from './scope-note';
import { optionLabel, outcomeFor, stemText, type EngineProps } from './shared';

/** The verdict option: authored as label `N`, and never part of the reconstructed sentence. */
const isVerdict = (label: string, value: string): boolean =>
  label.toUpperCase() === 'N' || /^no (mistake|error)$/i.test(value.trim());

export default function ErrorSpotEngine({ stem, options, selected, onSelect, outcome }: EngineProps) {
  const segmented = stem.segmentsInOptions === true;
  const rows = options.map((o) => {
    const content = o.content as { label?: string; value?: string };
    return { id: o.id, label: content?.label ?? '', value: optionLabel(o.content), raw: content?.value ?? '' };
  });
  const segments = rows.filter((r) => !isVerdict(r.label, r.raw));
  const verdict = rows.find((r) => isVerdict(r.label, r.raw));

  // NOT SEGMENTED — fall back to plain tiles rather than pretending. An item without
  // `segmentsInOptions` is not a sentence in pieces, and rendering it as one would be a lie about
  // the authored shape.
  if (!segmented) {
    return (
      <div>
        <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>
        <p style={{ margin: '0 0 0.6rem' }}><ScopeNote kind="on-the-card" /></p>
        <div role="group" aria-label="Answer choices">
          {rows.map((r) => (
            <OptionButton
              key={r.id} optionId={r.id} selected={selected === r.id}
              outcome={outcomeFor(r.id, outcome)} locked={Boolean(outcome)} onSelect={onSelect}
            >
              {r.value}
            </OptionButton>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: '1.05rem' }}>{stemText(stem)}</p>
      {/*
        NO PASSAGE, NO CONTROL, SO THE NOTE TAKES THE CONTROL'S PLACE (R175). A child arriving from
        a comprehension item has just learned that the way to find out where to look is to tap the
        button beside the title. There is no button here and no title; the note says why.
      */}
      <p style={{ margin: '0 0 0.6rem' }}><ScopeNote kind="on-the-card" /></p>

      {/*
        THE SENTENCE, VISIBLE AS A SENTENCE, AT EVERY WIDTH (Annie's row 23; R209). Below 600px the
        tappable segments are full-width rows — three inline attempts at that width are documented
        in crew.css, and none survives the 48px target — so the ROWS carry the choosing and THIS
        carries the reading: the sentence as continuous read-only prose, authored order (safe since
        R192 serves segments unshuffled). Hidden at >=600px, where the segments themselves read
        inline and a second copy would be noise.

        **THE PREVIEW IS NOT DECORATION, IT IS THE REPAIR** (Annie, 2026-08-21 — R546). It was
        `aria-hidden` on the reasoning that "a screen reader already receives the sentence once,
        through the group below". **It does not.** The group's name is *"The sentence, in four
        parts…"* — a DESCRIPTION of the sentence, not the sentence — so with the preview hidden a
        child heard the words only as four separate button labels and **never as continuous prose**.
        That is the same deficit the preview exists to repair below 600px, arriving in the ear at
        every width.
      */}
      <p
        className="crew-errorspot-sentence-preview"
        data-testid="errorspot-sentence-preview"
      >
        {/*
          THE PREVIEW CARRIES THE SENTENCE'S REAL PUNCTUATION AND MUST NEVER NORMALISE IT (Annie,
          2026-08-19). The segment values are joined and NOTHING ELSE happens to them: no quote
          straightening, no spacing repair, no trimming of a stray mark. On these items the
          punctuation IS the question — PU-06 turns on a question mark sitting OUTSIDE a closing
          quote, and a tidy-up that "fixed" it would delete the item while leaving it on screen
          looking correct. Any future formatting of this line is a content change, not a style one.
        */}
        {segments.map((s) => s.value).join(' ')}
      </p>

      {/*
        THE SENTENCE. One paragraph, segments inline in authored order, wrapping naturally. The
        48px line box gives each segment a full tap target vertically without any of them becoming
        a tile. `role="group"` so the whole thing is announced as one set of choices.
      */}
      <p
        className="crew-errorspot"
        data-testid="errorspot-sentence"
        role="group"
        aria-label="The sentence, in four parts. Choose the part with the mistake."
        style={{ fontSize: '1.15rem', lineHeight: 1.75, margin: '0.4rem 0 0.9rem' }}
      >
        {segments.map((s, i) => (
          <button
            key={s.id}
            type="button"
            data-testid="errorspot-segment"
            data-first={i === 0 ? 'true' : undefined}
            className={`crew-seg${selected === s.id ? ' selected' : ''}`}
            data-outcome={outcomeFor(s.id, outcome) ?? undefined}
            disabled={Boolean(outcome)}
            onClick={() => onSelect(s.id)}
          >
            {s.value}
          </button>
        ))}
      </p>

      {verdict ? (
        // ITS OWN LINE, ITS OWN SHAPE. A pill beneath the sentence — the layout says "different
        // kind of thing" so no sentence has to.
        <div data-testid="errorspot-verdict" style={{ marginTop: '0.2rem' }}>
          <OptionButton
            optionId={verdict.id}
            selected={selected === verdict.id}
            outcome={outcomeFor(verdict.id, outcome)}
            locked={Boolean(outcome)}
            onSelect={onSelect}
          >
            {verdict.value}
          </OptionButton>
        </div>
      ) : null}
    </div>
  );
}
