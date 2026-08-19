'use client';

/**
 * COMPREHENSION (English district) — the passage, then the question.
 *
 * **DAVID'S THREE RULINGS, 2026-08-16, and each one is load-bearing:**
 *
 * 1. **THE PASSAGE STAYS VISIBLE THROUGHOUT AND NEVER COLLAPSES.** An 11+ paper has the text in
 *    front of the child while she answers. Collapsing it makes a comprehension question a MEMORY
 *    question, which is a different skill and not the one being tested.
 * 2. **THE CITED WINDOW IS HIGHLIGHTED ON TAP, NOT ON ARRIVAL** (David's ruling, 2026-08-17,
 *    REVERSING his 2026-08-16 ruling that it appear from the start). The control now does both
 *    jobs: it scrolls there AND it marks the window.
 *
 *    **WHAT DECIDED IT WAS A MEASUREMENT, NOT A PREFERENCE.** Cowork measured the bank: in
 *    **85 of 85** windowed items, the wrong-scope option is the ONLY option disposed of by the
 *    window. So the gold does not shade a region — **it marks exactly one wrong answer, every
 *    time.** `en-wrong-scope-retrieval` is an option true in a part of the passage the child was
 *    not sent to, and a highlight present before she reads answers it by interface.
 *
 *    **AND THE MECHANISM IS NARROWER THAN EITHER OBVIOUS READING.** It is not that she does not
 *    KNOW the window — the stem says "Read lines 3 to 4" in words. It is not that she has to
 *    LOCATE it — that is what the control is for, and it may keep doing it. It is that she must
 *    **APPLY** the window to the passage herself, and pre-drawn gold applies it for her. Tapping
 *    is her doing the applying; the mark is the result of an act, not a condition of the screen.
 *
 *    The original reasoning still holds for everything AFTER the tap: every hint we ship says
 *    "read line 8", and the affordance test that placed every distractor was run on the premise
 *    that the child is IN that window. A child hunting for lines 29 to 33 is being tested on
 *    scrolling — so the control stays, and after one tap the screen is exactly what it used to be
 *    on arrival.
 * 3. **The window is HIGHLIGHTED, never ISOLATED.** The whole passage stays readable, because a
 *    retrieval item's distractors are routinely true elsewhere in the text — hiding the rest would
 *    turn a wrong-scope distractor into an unanswerable one.
 *
 * **PASSAGE-PRIMARY (Annie's ruling, 2026-08-19 — R208).** None of the seven scoped two-span
 * options; the eighth is the layout. The PASSAGE owns the viewport — roughly 15 to 20 lines at
 * 375px — and the question sits beneath it as a PERSISTENT COLLAPSED DRAWER. **Scrolling is a
 * property of reading, not of the item**: nothing is declared on any item and no re-tier follows.
 * Defect 24 (two-span items unservable in a 5-line window) is DISSOLVED by this ruling, not fixed.
 *
 * **THE TAP COMPOSES WITH R174 BY STRUCTURE, NEVER BY SCROLL POSITION.** On a multi-span item the
 * control NAVIGATES: first tap scrolls to and marks span 1, the next tap span 2, cycling. The
 * target is computed from the item's cited lines (contiguous runs), so where the child has
 * scrolled can never change what the control does. Marks accumulate one-way, as ruled in R174.
 *
 * **AND IT REFUSES RATHER THAN DEGRADES.** An item that cites a passage it cannot load renders an
 * unmissable notice and does not present itself as answerable. The whole finding of this district
 * was three silent fallbacks letting an undeliverable item look delivered; a blank space where the
 * passage should be would be the fourth.
 */
import { useCallback, useRef, useState } from 'react';
import { OptionButton } from './option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from './shared';
import { shortRange } from '@/lib/crew/cited-lines';
import { ScopeNote } from './scope-note';

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
  const spanFirstRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  /**
   * WHICH SPANS SHE HAS APPLIED. Empty on arrival, one-way: a marked span stays marked, so the
   * mark is never something she can lose by looking away (R174). `nextSpan` is the control's next
   * target, decided by the ITEM'S STRUCTURE — never by where she happens to have scrolled (R208).
   */
  const [appliedSpans, setAppliedSpans] = useState<ReadonlySet<number>>(new Set());
  const [nextSpan, setNextSpan] = useState(0);
  /** The question drawer: persistent, collapsed on arrival. Reading first is the layout's claim. */
  const [drawerOpen, setDrawerOpen] = useState(false);

  const cited = new Set(passage?.citedLines ?? []);
  // `[]` declares the WHOLE passage as the window (R120) — a positive statement, not an absence.
  const wholePassage = passage != null && cited.size === 0;

  /** The cited lines as CONTIGUOUS RUNS — the spans the control navigates between. */
  const spans: number[][] = [];
  {
    const sorted = [...(passage?.citedLines ?? [])].sort((a, b) => a - b);
    for (const n of sorted) {
      const last = spans[spans.length - 1];
      if (last && n === last[last.length - 1]! + 1) last.push(n);
      else spans.push([n]);
    }
  }
  const spanOfLine = new Map<number, number>();
  spans.forEach((s, si) => s.forEach((n) => spanOfLine.set(n, si)));

  const goToLines = useCallback(() => {
    const si = nextSpan;
    const target = spanFirstRefs.current[si] ?? null;
    const box = scrollRef.current;
    // MARK FIRST, SCROLL SECOND, and mark even if the scroll cannot run. The two jobs are
    // independent: a missing ref is a reason not to scroll, never a reason to leave the window
    // unmarked. Ordering it the other way would have made the highlight depend on the ref bug this
    // file already carries a comment about.
    setAppliedSpans((prev) => new Set([...prev, si]));
    // Advance by STRUCTURE: next tap targets the next span, cycling. Scroll position plays no part.
    setNextSpan(spans.length > 0 ? (si + 1) % spans.length : 0);
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
  }, [nextSpan, spans.length]);

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
  const spanFirstLineIndex = new Map<number, number>();
  if (passage) {
    passage.lines.forEach((l, i) => {
      if (l.n === null) return;
      const si = spanOfLine.get(l.n);
      if (si !== undefined && !spanFirstLineIndex.has(si)) spanFirstLineIndex.set(si, i);
    });
  }
  const refSpanForLineIndex = new Map<number, number>();
  for (const [si, li] of spanFirstLineIndex) refSpanForLineIndex.set(li, si);

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
                Go to {(spans[nextSpan] ?? []).length === 1 ? 'line' : 'lines'}{' '}
                {shortRange(spans[nextSpan] ?? passage.citedLines)}
                {spans.length > 1 ? ` (${nextSpan + 1} of ${spans.length})` : ''}
              </button>
            ) : null}
            {/*
              THE CONTROL'S PLACE IS NEVER EMPTY. Same row, same position: either the button or the
              note that says why there is no button. The words moved to `scope-note.tsx` when two
              more engines needed them (R175) — this state has rendered since the surface was built
              and is the ONE of the three that was never missing.
            */}
            {wholePassage ? <ScopeNote kind="whole-passage" /> : null}
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
              // THE PASSAGE OWNS THE VIEWPORT (R208): ~15-20 lines at 375px. 64vh of an 812px
              // phone is ~520px ≈ 20 lines at this leading; the cap keeps desks from ballooning it.
              maxHeight: 'min(64vh, 520px)', overflowY: 'auto', padding: '0.6rem 0.7rem',
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
              // ON TAP, NOT ON ARRIVAL. `cited` still says WHICH lines; `windowApplied` says
              // whether she has applied the window yet.
              const lineSpan = line.n !== null ? spanOfLine.get(line.n) : undefined;
              const isCited = lineSpan !== undefined && appliedSpans.has(lineSpan);
              const refSpan = refSpanForLineIndex.get(i);
              return (
                <p
                  key={line.n ?? `x-${i}`}
                  ref={refSpan !== undefined ? (el) => { spanFirstRefs.current[refSpan] = el; } : undefined}
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

      {/*
        THE QUESTION DRAWER (R208). Persistent — always on screen, stuck to the bottom — and
        COLLAPSED on arrival, because the layout's claim is that reading comes first. Collapsed is
        not hidden: the header names what is waiting and one tap opens it. Without a passage there
        is nothing for the drawer to yield the viewport to, so the flat layout stands.
      */}
      {passage ? (
        <section
          data-testid="question-drawer"
          style={{
            position: 'sticky', bottom: 0, marginTop: '0.6rem',
            background: '#fffdf8', border: '1px solid #d8d8d8', borderRadius: '10px 10px 0 0',
            boxShadow: '0 -3px 10px rgba(0,0,0,0.07)',
          }}
        >
          <button
            type="button"
            data-testid="question-drawer-toggle"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
            style={{
              width: '100%', minHeight: 48, padding: '0.5rem 0.8rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: '1.02rem', fontWeight: 600, textAlign: 'left',
            }}
          >
            <span>{drawerOpen ? 'The question' : 'Ready? Open the question'}</span>
            <span aria-hidden="true">{drawerOpen ? '▾' : '▴'}</span>
          </button>
          {drawerOpen ? (
            <div style={{ padding: '0 0.8rem 0.8rem' }}>
              <p style={{ fontSize: '1.15rem', marginTop: 0 }}>{stemText(stem)}</p>
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
          ) : null}
        </section>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
