'use client';

/**
 * "One concept, five ways in" (LAUNCH-PACK-V3.1 §A): the depth-proof. All
 * five tabs carry the SAME concept — letter codes, the signature — using
 * real product assets wherever one exists in shippable form:
 *
 *   Watch — FLAGGED: no animatic exists yet (the case's watch asset is a
 *           placeholder path); the tab ships the mode's real product line
 *           with an honest in-production tag, per the pack's build note.
 *   Walk  — a stepped worked example with visibly fading scaffold. The
 *           steps are authored HERE (the in-app walk asset is also still
 *           placeholder) and join the reviewer's sitting with the demo items.
 *   See   — the real Alphabet Rail component, embedded and touchable.
 *   Hear  — the product's actual audio mechanism today: device speech with
 *           a visible transcript (recorded narration is the Phase 5 upgrade,
 *           tagged honestly).
 *   Try   — the letter-code demo item, same rules, same component.
 *
 * Mobile: the tab strip scrolls horizontally at 375px. Tabs are real tabs
 * (roving tablist), panels are labelled, nothing auto-plays.
 */
import { useState } from 'react';
import { AlphabetRail } from '@/components/crew/engines/alphabet-rail';
import { SpeakButton } from '@/components/crew/speak-button';
import { LETTER_CODE_ITEM, SingleItemCard } from '@/components/founding/demo';

const HEAR_TRANSCRIPT =
  'Every letter has a price. Read the code first: T is six, A is three, R is five, S is four. ' +
  'Now spell the word slowly, and add as you go. T, six. A, nine. R, fourteen. T again — it gets ' +
  'paid both times — twenty. S, twenty-four. The word costs twenty-four.';

const WALK_STEPS = [
  {
    label: 'Step 1 — watch one together',
    body: 'A = 2, B = 5, C = 4, T = 6. What does CAB cost? Letter by letter, adding as we go: C is 4. C‑A is 4 + 2 = 6. C‑A‑B is 6 + 5 = 11. CAB costs 11.',
    scaffold: 'full',
  },
  {
    label: 'Step 2 — you finish this one',
    body: 'Same code. What does BAT cost? B is 5. B‑A is 5 + 2 = 7. One letter left…',
    reveal: 'B‑A‑T is 7 + 6 = 13.',
    scaffold: 'half',
  },
  {
    label: 'Step 3 — all yours',
    body: 'Same code, new word: what does TACT cost? (Careful — one letter appears twice, and it gets paid every time.)',
    reveal: 'T + A + C + T = 6 + 2 + 4 + 6 = 18.',
    scaffold: 'none',
  },
] as const;

const TABS = ['Watch it', 'Walk it', 'See it', 'Hear it', 'Try it'] as const;

export function FiveWays() {
  const [tab, setTab] = useState(0);
  const [walkStep, setWalkStep] = useState(0);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  return (
    <div className="fd-fiveways" data-testid="five-ways">
      <div className="fd-fiveways-tabs" role="tablist" aria-label="Five ways into letter codes">
        {TABS.map((label, index) => (
          <button
            key={label}
            role="tab"
            id={`fw-tab-${index}`}
            aria-selected={tab === index}
            aria-controls={`fw-panel-${index}`}
            tabIndex={tab === index ? 0 : -1}
            className={`fd-fiveways-tab${tab === index ? ' active' : ''}`}
            onClick={() => setTab(index)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') setTab((tab + 1) % TABS.length);
              if (event.key === 'ArrowLeft') setTab((tab + TABS.length - 1) % TABS.length);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div id="fw-panel-0" role="tabpanel" aria-labelledby="fw-tab-0" hidden={tab !== 0}>
        <p className="fd-fiveways-tag">Early footage lands here first — the animation is in production.</p>
        <p>
          <em>
            &ldquo;Watch me walk the trail, one clue at a time. Notice how each step follows the
            last.&rdquo;
          </em>{' '}
          — every question type opens with a short animated explainer, ninety seconds at most,
          skippable always.
        </p>
      </div>

      <div id="fw-panel-1" role="tabpanel" aria-labelledby="fw-tab-1" hidden={tab !== 1}>
        <div className={`fd-walk scaffold-${WALK_STEPS[walkStep]!.scaffold}`}>
          <p className="fd-fiveways-kicker">{WALK_STEPS[walkStep]!.label}</p>
          <p>{WALK_STEPS[walkStep]!.body}</p>
          {'reveal' in WALK_STEPS[walkStep]! ? (
            revealed[walkStep] ? (
              <p className="fd-demo-praise">{(WALK_STEPS[walkStep] as { reveal: string }).reveal}</p>
            ) : (
              <button
                type="button"
                className="cc-button-quiet"
                onClick={() => setRevealed({ ...revealed, [walkStep]: true })}
              >
                Show the finish
              </button>
            )
          ) : null}
        </div>
        <p>
          {walkStep > 0 ? (
            <button type="button" className="cc-button-quiet" onClick={() => setWalkStep(walkStep - 1)}>
              ← Back
            </button>
          ) : null}{' '}
          {walkStep < WALK_STEPS.length - 1 ? (
            <button type="button" className="cc-button" onClick={() => setWalkStep(walkStep + 1)}>
              Next step
            </button>
          ) : null}
        </p>
        <p className="cc-muted">
          Guided, then half-guided, then solo — the scaffold fades on purpose. That is the
          tutoring claim, demonstrated.
        </p>
      </div>

      <div id="fw-panel-2" role="tabpanel" aria-labelledby="fw-tab-2" hidden={tab !== 2}>
        <p className="fd-fiveways-kicker">
          The Alphabet Rail — tap two letters and count the jump. This is the real tool from the
          app.
        </p>
        <AlphabetRail stage="stage" />
      </div>

      <div id="fw-panel-3" role="tabpanel" aria-labelledby="fw-tab-3" hidden={tab !== 3}>
        <p className="fd-fiveways-tag">
          Read aloud by your device — recorded narration is in production.
        </p>
        <p>
          <SpeakButton text={HEAR_TRANSCRIPT} /> <em>{HEAR_TRANSCRIPT}</em>
        </p>
      </div>

      <div id="fw-panel-4" role="tabpanel" aria-labelledby="fw-tab-4" hidden={tab !== 4}>
        <SingleItemCard item={LETTER_CODE_ITEM} />
      </div>
    </div>
  );
}
