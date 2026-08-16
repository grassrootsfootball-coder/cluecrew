'use client';

/**
 * COMPREHENSION (English district) — the passage, then the question.
 *
 * **DAVID'S THREE RULINGS, 2026-08-16, and each one is load-bearing:**
 *
 * 1. **THE PASSAGE STAYS VISIBLE THROUGHOUT AND NEVER COLLAPSES.** An 11+ paper has the text in
 *    front of the child while she answers. Collapsing it makes a comprehension question a MEMORY
 *    question, which is a different skill and not the one being tested.
 * 2. **THE CITED WINDOW IS HIGHLIGHTED FROM THE START, and the "go to lines" control stays as well
 *    — the highlight says where, the control takes her there.** Beyond kindness: every hint we ship
 *    says "read line 8", and the affordance test that placed every distractor in this bank was run
 *    on the premise that the child is IN that window. A child hunting for lines 29 to 33 is being
 *    tested on scrolling.
 * 3. **The window is HIGHLIGHTED, never ISOLATED.** The whole passage stays readable, because a
 *    retrieval item's distractors are routinely true elsewhere in the text — hiding the rest would
 *    turn a wrong-scope distractor into an unanswerable one.
 *
 * **ONE SCROLLING COLUMN, NOT SIDE BY SIDE.** At 375px there is no side, and a layout that only
 * works on a desk is not the exam room. The passage takes its own scroll region with the item
 * beneath it, so the text can be scrolled without the question leaving the screen.
 *
 * **AND IT REFUSES RATHER THAN DEGRADES.** An item that cites a passage it cannot load renders an
 * unmissable notice and does not present itself as answerable. The whole finding of this district
 * was three silent fallbacks letting an undeliverable item look delivered; a blank space where the
 * passage should be would be the fourth.
 */
import { useCallback, useRef } from 'react';
import { OptionButton } from './option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from './shared';
import { shortRange } from '@/lib/crew/cited-lines';

export interface PassageView {
  id: string;
  title: string | null;
  lines: Array<{ n: number | null; text: string }>;
  citedLines: number[];
}

export default function ComprehensionEngine({
  stem, options, selected, onSelect, outcome, passage,
}: EngineProps & { passage?: PassageView }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const firstCitedRef = useRef<HTMLParagraphElement | null>(null);

  const cited = new Set(passage?.citedLines ?? []);
  // `[]` declares the WHOLE passage as the window (R120) — a positive statement, not an absence.
  const wholePassage = passage != null && cited.size === 0;

  const goToLines = useCallback(() => {
    const target = firstCitedRef.current;
    const box = scrollRef.current;
    if (!target || !box) return;
    // A little above the first cited line, so she sees the line before it and knows where she is.
    //
    // BEHAVIOUR IS CHOSEN, NOT ASSUMED. `smooth` is ignored outright in some engines and settings —
    // it moved nothing at all in verification while `auto` scrolled correctly — and reduced motion
    // is a core feature here, not an add-on (D4). So: instant when motion is reduced OR when smooth
    // is unavailable, and the scroll is CONFIRMED afterwards rather than trusted. A control that
    // silently does nothing is the failure this whole district is about.
    const top = Math.max(0, target.offsetTop - 12);
    const reduced = typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    // If nothing has moved shortly after, the smooth path was ignored: land her there anyway.
    window.setTimeout(() => {
      if (box.scrollTop < top - 24) box.scrollTop = top;
    }, 400);
  }, []);

  const needsPassage = typeof stem.passageRef === 'string' && stem.passageRef.length > 0;
  if (needsPassage && !passage) {
    return (
      <p
        data-testid="comprehension-passage-missing"
        style={{
          border: '2px solid #b00', padding: '0.75rem', borderRadius: 8,
          background: '#fff4f4', color: '#7a0000', fontWeight: 600,
        }}
      >
        This question is about a story, and the story is not here. Do not answer it yet.
      </p>
    );
  }

  /**
   * WHICH LINE THE CONTROL SCROLLS TO, COMPUTED PURELY AND BEFORE RENDER.
   *
   * The first version decided this DURING the map, with `!seen && (seen = true)` — a mutation in
   * render to pick which element got the ref. It typechecked, it read correctly, and the ref was
   * never attached, so "go to lines" silently did nothing: `goToLines` returned early on a null ref
   * and the passage sat still. Found by tapping it in a browser and watching `scrollTop` stay at 0.
   *
   * Mutating during render is unsafe under React's double-render, and the failure mode is exactly
   * the one this district keeps producing: correct-looking code that quietly does nothing.
   */
  const firstCitedIndex = passage
    ? passage.lines.findIndex((l) => l.n !== null && cited.has(l.n))
    : -1;

  return (
    <div>
      {passage ? (
        <section aria-label="The passage" style={{ marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            {passage.title ? <strong style={{ fontSize: '1.05rem' }}>{passage.title}</strong> : null}
            {cited.size > 0 ? (
              <button
                type="button"
                onClick={goToLines}
                data-testid="go-to-lines"
                className="cc-button"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.9rem' }}
              >
                Go to {cited.size === 1 ? 'line' : 'lines'} {shortRange(passage.citedLines)}
              </button>
            ) : null}
            {wholePassage ? (
              <span className="cc-muted" style={{ fontSize: '0.9rem' }}>This one is about the whole story.</span>
            ) : null}
          </div>

          {/*
            OWN SCROLL REGION. The passage scrolls inside this box; the question below never leaves
            the screen. `max-height` in `vh` so a long extract does not push the item off a phone.
          */}
          <div
            ref={scrollRef}
            data-testid="passage-scroll"
            style={{
              // `position: relative` IS LOAD-BEARING, not decoration. `offsetTop` is measured from
              // the nearest POSITIONED ancestor, and without this the cited line's offset was
              // measured against something outside the box — so "go to lines" computed a target of
              // roughly zero and scrolled nowhere. It looked correct in every static check and
              // failed only when tapped.
              position: 'relative',
              maxHeight: '46vh', overflowY: 'auto', padding: '0.6rem 0.7rem',
              border: '1px solid #d8d8d8', borderRadius: 8, background: '#fffdf8',
              fontSize: '1.02rem', lineHeight: 1.55,
            }}
          >
            {passage.lines.map((line, i) => {
              // A BLANK SEPARATOR IS A PARAGRAPH BREAK, not a line. It carries no number in the
              // data and gets none here — a real paper does not number the white space either.
              if (line.n === null && line.text.trim() === '') {
                return <div key={`sep-${i}`} style={{ height: '0.6rem' }} aria-hidden="true" />;
              }
              const isCited = line.n !== null && cited.has(line.n);
              return (
                <p
                  key={line.n ?? `x-${i}`}
                  ref={i === firstCitedIndex ? firstCitedRef : undefined}
                  style={{
                    margin: 0, display: 'flex', gap: '0.7rem',
                    // HIGHLIGHTED, NEVER ISOLATED. Every line stays readable and legible; the
                    // window is marked with a background and a rule, not by hiding its neighbours.
                    background: isCited ? '#fff3c4' : 'transparent',
                    borderLeft: isCited ? '3px solid #d9a400' : '3px solid transparent',
                    paddingLeft: '0.35rem',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      minWidth: '2.1rem', textAlign: 'right', color: '#8a8a8a',
                      fontVariantNumeric: 'tabular-nums', userSelect: 'none',
                    }}
                  >
                    {line.n ?? ''}
                  </span>
                  <span>{line.text}</span>
                </p>
              );
            })}
          </div>
        </section>
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
