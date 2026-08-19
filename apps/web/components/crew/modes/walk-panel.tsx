/**
 * WALK — a worked solution, revealed a sentence at a time.
 *
 * **THE MODE'S PROMISE CHANGED IN THE SAME ACT AS THIS FILE** (David's ruling, 2026-08-19). Walk
 * was specified as a faded example — *do one together, finish one, do one alone* — and the 670
 * authored scripts are nothing of the kind: each is a single 3-to-4-sentence explanation of one
 * item's answer, with no step structure at all (R232). Rather than bend the content to fit the
 * name or ship a promise the product does not keep, Walk IS a worked solution and the Daily Loop's
 * copy says so. The narrowing is stated, not absorbed.
 *
 * **THE REVEAL IS PER SENTENCE, NOT ALL AT ONCE**, matching `ReplayWalk` — the child taps for the
 * next line, so a worked solution is still something they move through rather than a wall of text
 * handed over. Splitting on sentence ends is a PRESENTATION choice over authored prose; it changes
 * no words, and the last tap shows the whole script exactly as written.
 *
 * **SERVING IS GATED ON A REVIEWER READ, NOT ON THIS COMPONENT EXISTING.** The API returns nothing
 * for an item whose script no reviewer has approved, and this panel says so plainly instead of
 * rendering an empty box. Today that is every item.
 */
'use client';

import { useEffect, useState } from 'react';

interface WalkContent {
  itemId: string;
  sentences: string[];
  /** Present when the API declined to serve, with the reason a person can act on. */
  withheld?: string;
}

export function WalkPanel({ itemId, childId, onDone }: { itemId: string; childId: string; onDone: () => void }) {
  const [content, setContent] = useState<WalkContent | null>(null);
  const [shown, setShown] = useState(1);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/crew/${childId}/walk/${itemId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: WalkContent) => { if (live) setContent(body); })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [childId, itemId]);

  if (failed) {
    // A READER REFUSES A SHAPE IT CANNOT PARSE; IT NEVER RETURNS EMPTY (R173). A failed fetch and
    // "there is no script" are different facts and must not render the same way.
    return (
      <div className="crew-replay" role="status" data-testid="walk-failed">
        <p style={{ margin: 0 }}>That way in did not load. Tap try again in a moment.</p>
      </div>
    );
  }
  if (!content) return <p data-testid="walk-loading">Getting it ready…</p>;

  if (content.withheld || content.sentences.length === 0) {
    return (
      <div className="crew-replay" role="status" data-testid="walk-withheld" data-reason={content.withheld}>
        <p style={{ margin: 0 }}>This way in is not ready yet. Try another one.</p>
      </div>
    );
  }

  const all = shown >= content.sentences.length;
  return (
    <div className="crew-replay" role="group" aria-label="Walk this one with me" data-testid="walk-panel">
      {content.sentences.slice(0, shown).map((line, i) => (
        <p key={i} style={{ margin: '0.35rem 0' }}>{line}</p>
      ))}
      {/*
        **"GOT IT" WAS THE WRONG BUTTON AND IT IS RULED OUT** (Annie, 2026-08-19 — R310). A child who
        has NOT understood taps it anyway, because it is the only way out of the panel — so whatever
        it records is not comprehension. **A claim must never be collected from the one control a
        child has no alternative to.**

        This is a DISMISS, so it is named as one. `Close` says what the tap does and asserts nothing
        about the child. If a comprehension signal is ever wanted here it needs a second control and
        a real choice between them; until then the panel asks nothing and records nothing.
      */}
      <button
        className="crew-tap"
        data-testid={all ? 'walk-close' : 'walk-next'}
        onClick={() => (all ? onDone() : setShown((n) => n + 1))}
      >
        {all ? 'Close' : 'Next bit'}
      </button>
    </div>
  );
}
