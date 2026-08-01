'use client';

/**
 * The mock sitting (ADDENDUM-B §3): full-screen Plain mode, no mascot, no
 * tools, no theme. Per-section timers with an amber-only final minute; no
 * pausing mid-section, but the child can always stop and the exit is kind.
 * Juice is suppressed to bead progress and soft chimes — the contrast with
 * Case mode is the pedagogy (P4).
 *
 * Every child-facing string here is from Addendum A §1.2's Boss Case rows or
 * quoted directly from Addendum B §3.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { playCue } from './sound-controller';
import { optionLabel } from './engines/shared';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface SectionItem {
  itemId: string;
  stem: unknown;
  options: Array<{ id: string; content: unknown }>;
  chosenOptionId: string | null;
}

type View =
  | { phase: 'none' }
  | {
      phase: 'ready';
      blueprintTitle: string;
      sectionCount: number;
      totalQuestions: number;
      totalMinutes: number;
    }
  | {
      phase: 'instructions';
      sectionIndex: number;
      sectionCount: number;
      instructions: string;
      minutes: number;
      questionCount: number;
    }
  | {
      phase: 'section';
      sittingId: string;
      sectionIndex: number;
      sectionCount: number;
      minutes: number;
      secondsLeft: number;
      items: SectionItem[];
    }
  | { phase: 'finished'; sittingId: string };

interface ChildResult {
  strengths: string[];
  focus: string | null;
}

/** Renders one plain question stem the same way PlainItem does. */
function stemLines(stem: Record<string, unknown>): string[] {
  const parts: string[] = [];
  if (typeof stem.prompt === 'string') parts.push(stem.prompt);
  if (typeof stem.word1 === 'string' && typeof stem.word2 === 'string') {
    parts.push(`${stem.word1}   (${stem.word2})`);
  }
  if (typeof stem.sentence === 'string') parts.push(stem.sentence);
  if (typeof stem.wordWithGap === 'string') parts.push(stem.wordWithGap);
  if (typeof stem.sum === 'string') parts.push(stem.sum);
  if (Array.isArray(stem.words)) parts.push((stem.words as string[]).join(',  '));
  if (Array.isArray(stem.series)) parts.push(`${(stem.series as Array<string | number>).join(',  ')}, …`);
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
  return parts;
}

export function MockRunner({ childId }: { childId: string }) {
  const [view, setView] = useState<View | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [stopPanel, setStopPanel] = useState(false);
  const [result, setResult] = useState<ChildResult | null>(null);
  const [over, setOver] = useState(false);
  const busy = useRef(false);
  const endingRef = useRef(false);

  const load = useCallback(async () => {
    // A hung request must never strand the sitting — same rule as the
    // practice runner: no fetch without a deadline.
    const response = await fetch(`/api/crew/${childId}/mock`, {
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null);
    if (!response?.ok) return;
    const next = (await response.json()) as View;
    setView(next);
    if (next.phase === 'section') setSecondsLeft(next.secondsLeft);
  }, [childId]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = useCallback(
    async (body: Record<string, unknown>): Promise<boolean> => {
      // Serialise, never drop: a child who taps "Finish section" while an
      // answer is still posting means BOTH. Dropping the second tap left the
      // section visibly running with a button that did nothing.
      while (busy.current) await new Promise((resolve) => setTimeout(resolve, 40));
      busy.current = true;
      try {
        // Deadline for the same reason as load(): a hung POST would wedge the
        // serialisation queue for the rest of the sitting.
        const response = await fetch(`/api/crew/${childId}/mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        }).catch(() => null);
        return response?.ok ?? false;
      } finally {
        busy.current = false;
      }
    },
    [childId],
  );

  // The section clock. The server owns the truth; this is the display.
  useEffect(() => {
    if (view?.phase !== 'section') return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [view?.phase, view?.phase === 'section' ? view.sectionIndex : -1]);

  const endSection = useCallback(async () => {
    if (view?.phase !== 'section' || endingRef.current) return;
    endingRef.current = true;
    const isLast = view.sectionIndex === view.sectionCount - 1;
    const sittingId = view.sittingId;
    const ended = await act({ action: 'end_section', sectionIndex: view.sectionIndex });
    if (!ended) {
      // A replay or a lost race — the server state is the truth; re-read it.
      endingRef.current = false;
      await load();
      return;
    }
    playCue(isLast ? 'paper-time' : 'section-chime');
    endingRef.current = false;
    if (isLast) {
      // Ending the last section completes the sitting server-side, so a
      // reload would find no OPEN paper and show the empty desk. This client
      // just finished it — go straight to the result.
      setOver(true);
      setView({ phase: 'finished', sittingId });
    } else {
      await load();
    }
  }, [act, load, view]);

  // Time reaching zero ends the section — no pausing, no extension (§3).
  useEffect(() => {
    if (view?.phase === 'section' && secondsLeft === 0) void endSection();
  }, [secondsLeft, view?.phase, endSection]);

  // The result, once the paper is complete.
  useEffect(() => {
    if (view?.phase !== 'finished') return;
    void (async () => {
      const response = await fetch(
        `/api/crew/${childId}/mock/result?sittingId=${view.sittingId}`,
      );
      if (response.ok) setResult((await response.json()) as ChildResult);
    })();
  }, [view, childId]);

  if (!view) {
    return (
      <div className="crew-shimmer" role="status">
        <p>Opening the case…</p>
      </div>
    );
  }

  if (view.phase === 'none') {
    return (
      <main className="crew-mock">
        <h1>No paper on the desk today.</h1>
        <p>The district&apos;s still open, though — the cases don&apos;t sit papers.</p>
        <p>
          <a className="crew-tap" href="/crew">
            Back to HQ
          </a>
        </p>
      </main>
    );
  }

  if (view.phase === 'ready') {
    return (
      <main className="crew-mock">
        <h1>Big one today. Real exam rules: no tools, just you.</h1>
        <p>
          {view.blueprintTitle} · {view.sectionCount} sections · {view.totalQuestions} questions ·{' '}
          {view.totalMinutes} minutes.
        </p>
        {/* Device guidance shown pre-sitting (§3). */}
        <p>Best on a tablet or laptop. Find a quiet spot first.</p>
        <button
          className="crew-tap primary"
          data-testid="start-paper"
          onClick={() => void act({ action: 'start' }).then(load)}
        >
          Start the paper
        </button>
      </main>
    );
  }

  if (view.phase === 'instructions') {
    return (
      <main className="crew-mock">
        <p className="crew-mock-progress">
          Section {view.sectionIndex + 1} of {view.sectionCount}
        </p>
        <p data-testid="section-instructions" style={{ fontSize: '1.15rem' }}>
          {view.instructions}
        </p>
        <p>
          {view.questionCount} questions. {view.minutes} minutes. The clock starts when you do.
        </p>
        <button
          className="crew-tap primary"
          data-testid="start-section"
          onClick={() =>
            void act({ action: 'start_section', sectionIndex: view.sectionIndex }).then(load)
          }
        >
          Start section {view.sectionIndex + 1}
        </button>
      </main>
    );
  }

  if (view.phase === 'section') {
    const finalMinute = secondsLeft <= 60;
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return (
      <main className="crew-mock">
        <header className={`crew-mock-clock${finalMinute ? ' final' : ''}`} role="timer">
          {/* Bead progress is the one piece of juice a Boss Case keeps (§3). */}
          <span aria-hidden className="crew-mock-bead" />
          <span data-testid="mock-clock">
            {minutes}:{String(seconds).padStart(2, '0')}
          </span>
          {finalMinute ? <span data-testid="final-minute"> Last minute. Finish what you can.</span> : null}
        </header>

        <ol className="crew-mock-paper">
          {view.items.map((item, index) => (
            <li key={item.itemId} className="crew-plain" data-testid={`mock-q-${index}`}>
              {stemLines(item.stem as Record<string, unknown>).map((line, lineIndex) => (
                <p key={lineIndex} style={{ margin: '0 0 0.5rem' }}>
                  {line}
                </p>
              ))}
              <div role="group" aria-label="Answer choices">
                {item.options.map((option, optionIndex) => (
                  <button
                    key={option.id}
                    className={`crew-tap${item.chosenOptionId === option.id ? ' selected' : ''}`}
                    aria-pressed={item.chosenOptionId === option.id}
                    onClick={() => {
                      // Optimistic mark; the server grades and can refuse late.
                      setView((current) =>
                        current?.phase === 'section'
                          ? {
                              ...current,
                              items: current.items.map((candidate) =>
                                candidate.itemId === item.itemId
                                  ? { ...candidate, chosenOptionId: option.id }
                                  : candidate,
                              ),
                            }
                          : current,
                      );
                      void act({ action: 'answer', itemId: item.itemId, optionId: option.id });
                    }}
                  >
                    {LETTERS[optionIndex]}. {optionLabel(option.content)}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <footer className="crew-mock-footer">
          <button className="crew-tap primary" data-testid="finish-section" onClick={() => void endSection()}>
            Finish section {view.sectionIndex + 1}
          </button>
          <button className="crew-tap" data-testid="stop-paper" onClick={() => setStopPanel(true)}>
            I want to stop
          </button>
        </footer>

        {stopPanel ? (
          <div className="crew-mock-stop" role="dialog" aria-label="Stop the paper">
            {/* Quoted from Addendum B §3 — the kind exit. */}
            <p>We&apos;ll call that one a practice run — no case file today.</p>
            <button
              className="crew-tap"
              data-testid="confirm-stop"
              onClick={() => void act({ action: 'abandon' }).then(() => (window.location.href = '/crew'))}
            >
              Stop for today
            </button>
            <button className="crew-tap primary" onClick={() => setStopPanel(false)}>
              Keep going
            </button>
          </div>
        ) : null}
      </main>
    );
  }

  // finished
  return (
    <main className="crew-mock" data-testid="mock-result">
      {over ? <h1>Time. Pens down, Detective.</h1> : <h1>That&apos;s the paper done.</h1>}
      {result ? (
        <>
          {result.strengths.length > 0 ? (
            <p data-testid="result-strengths" style={{ fontSize: '1.2rem' }}>
              {result.strengths.length === 2 ? 'Two you nailed' : 'One you nailed'}:{' '}
              {result.strengths.join(', ').toLowerCase()}.
            </p>
          ) : null}
          {result.focus ? (
            <p data-testid="result-focus" style={{ fontSize: '1.2rem' }}>
              One for next time: {result.focus.toLowerCase()}.
            </p>
          ) : null}
        </>
      ) : null}
      <p>
        <a className="crew-tap primary" href="/crew">
          Back to HQ
        </a>
      </p>
    </main>
  );
}
