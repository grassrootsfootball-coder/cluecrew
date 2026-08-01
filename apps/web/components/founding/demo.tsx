'use client';

/**
 * The three playable questions (DEMAND-TEST-PACK-V2 §1.1) — the shop window.
 * Faithful product behaviour, not the product's engines: tap an option →
 * correct = amber spark + method praise · not-yet = coral + the item's real
 * misconception hint + another go. No score, no timer. Addendum A voice.
 *
 * These three items are inlined content, marked demo, and exist in no pool —
 * they are HUMAN-GATE content: reviewer sign-off before public DNS (they
 * join the reviewer's first sitting).
 *
 * Keyboard + screen-reader operable: options are buttons, feedback lands in
 * an aria-live region, and everything works at 375px.
 */
import { useRef, useState } from 'react';

declare global {
  interface Window {
    plausible?: (goal: string, options?: { props?: Record<string, string> }) => void;
  }
}

interface DemoOption {
  id: string;
  label: string;
  hint?: string; // the misconception this distractor catches — shown on tap
}

interface DemoItem {
  demo: true;
  family: 'codebreaker' | 'stowaway' | 'workshop';
  kicker: string;
  stem: string;
  options: DemoOption[];
  correctId: string;
  praise: string; // method-praise, never praise of the child (§1.3)
}

const ITEMS: DemoItem[] = [
  {
    demo: true,
    family: 'codebreaker',
    kicker: 'Codebreaker Lane — letters for numbers',
    stem: 'In this code every letter has a price: T = 6, A = 3, R = 5, S = 4. What does TARTS cost?',
    options: [
      { id: 'a', label: '24' },
      {
        id: 'b',
        label: '18',
        hint: 'So close — check the letter T. It appears twice, and it gets paid both times.',
      },
      {
        id: 'c',
        label: '23',
        hint: "The method's right — add the five prices one step at a time and see where the total drifts.",
      },
      {
        id: 'd',
        label: '20',
        hint: 'Five letters need five prices. Write them out — T, A, R, T, S — and add as you go.',
      },
    ],
    correctId: 'a',
    praise: 'You paid every letter, even the repeat — that is exactly how the code works!',
  },
  {
    demo: true,
    family: 'stowaway',
    kicker: 'Stowaway Alley — the hidden word',
    stem: "A small word is stowing away across the join of two words: 'There was much inside the box.' Which word is hiding?",
    options: [
      {
        id: 'a',
        label: 'MUCH',
        hint: 'MUCH is standing in plain sight. The stowaway hides across the JOIN — look at where one word ends and the next begins.',
      },
      { id: 'b', label: 'CHIN' },
      {
        id: 'c',
        label: 'SIDE',
        hint: 'SIDE lives inside one word. The stowaway straddles two — check the joins.',
      },
      {
        id: 'd',
        label: 'BOX',
        hint: 'BOX is a whole word doing its own job in the sentence. Look across the joins instead.',
      },
    ],
    correctId: 'b',
    praise: 'You read across the join — muCH INside. That is the detective move!',
  },
  {
    demo: true,
    family: 'workshop',
    kicker: 'The Workshop — pricing a job',
    stem: 'The Workshop is fixing a fence. Each panel needs 3 planks and the fence is 14 panels long. Planks come in packs of 10. How many packs does the Workshop need to buy?',
    options: [
      {
        id: 'a',
        label: '4 packs',
        hint: '42 planks means 4 packs only brings 40 — two planks short of a fence. When the job needs a bit more, buy the next whole pack.',
      },
      { id: 'b', label: '5 packs' },
      {
        id: 'c',
        label: '42 packs',
        hint: '42 is the number of PLANKS. The question asks about packs — and each pack holds 10.',
      },
      {
        id: 'd',
        label: '6 packs',
        hint: 'Six packs would cover it, but the Workshop watches the budget. How many packs is JUST enough for 42 planks?',
      },
    ],
    correctId: 'b',
    praise:
      'You worked out the planks, then rounded UP for the packs — exactly how the Workshop prices a job!',
  },
];

type Feedback = { kind: 'praise' | 'hint'; text: string } | null;

export function DemoWidget() {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [solved, setSolved] = useState(false);
  const [finished, setFinished] = useState(false);
  const started = useRef(false);

  const item = ITEMS[index]!;

  function choose(option: DemoOption) {
    if (solved) return;
    if (!started.current) {
      started.current = true;
      window.plausible?.('demo_started');
    }
    const correct = option.id === item.correctId;
    window.plausible?.('demo_q_answered', {
      props: { q: item.family, result: correct ? 'correct' : 'incorrect' },
    });
    if (correct) {
      setSolved(true);
      setFeedback({ kind: 'praise', text: item.praise });
    } else {
      setFeedback({
        kind: 'hint',
        text: `Not yet. ${option.hint ?? 'Have another look at the question.'} Have another go.`,
      });
    }
  }

  function next() {
    if (index + 1 >= ITEMS.length) {
      setFinished(true);
      window.plausible?.('demo_completed');
      return;
    }
    setIndex(index + 1);
    setSolved(false);
    setFeedback(null);
  }

  if (finished) {
    return (
      <div className="fd-demo" data-testid="demo-close-beat">
        <p className="fd-demo-close">
          That hint you just got when you slipped? Every wrong answer in ClueCrew is written to
          catch a real misconception and teach through it. A teacher signs off every question
          before any child sees it. That&apos;s the whole idea.
        </p>
      </div>
    );
  }

  return (
    <div className={`fd-demo ${item.family}`}>
      <p className="fd-demo-kicker">
        Question {index + 1} of {ITEMS.length} · {item.kicker}
      </p>
      <p className="fd-demo-stem">{item.stem}</p>
      <div className="fd-demo-options" role="group" aria-label="Answer choices">
        {item.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="fd-demo-option"
            onClick={() => choose(option)}
            disabled={solved && option.id !== item.correctId}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p
        aria-live="polite"
        className={
          feedback ? (feedback.kind === 'praise' ? 'fd-demo-praise' : 'fd-demo-hint') : 'fd-demo-quiet'
        }
      >
        {feedback?.text ?? ''}
      </p>
      {solved ? (
        <button type="button" className="cc-button" onClick={next}>
          {index + 1 >= ITEMS.length ? 'What was that hint about?' : 'Next question'}
        </button>
      ) : null}
    </div>
  );
}
