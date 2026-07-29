'use client';

/**
 * The Daily Loop runner (BUILD-PHASE-4 §4) with the voice (Addendum A Part 1)
 * and the juice (Part 2). This component RENDERS what the engine decides — it
 * holds zero pedagogy. Mascot state changes flow only through mascotController;
 * sound flows only through soundController (files land later, cues are wired).
 *
 * Juice moments implemented here: option tap, correct, not yet, progress
 * beads, case cracked (the set piece), word collected, rank up, session
 * wind-down, and the deliberately restrained Boss Case.
 */
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { mascotEvent } from './mascot-controller';
import { playCue } from './sound-controller';
import { Mascot } from './mascot';
import { SpeakButton } from './speak-button';
import { stemText } from './engines/shared';
import {
  VOICE,
  beatLine,
  correctLine,
  loadingLine,
  FIRST_LOADING_LINE,
  notYetLine,
  windDownLine,
} from '@/lib/voice';

const engines = {
  code: dynamic(() => import('./engines/code')),
  stowaway: dynamic(() => import('./engines/stowaway')),
  wordweb: dynamic(() => import('./engines/wordweb')),
  bridge: dynamic(() => import('./engines/bridge')),
  deduction: dynamic(() => import('./engines/deduction')),
};
const PlainItem = dynamic(() => import('./engines/plain-item'));

type Activity =
  | { kind: 'no_session' }
  | { kind: 'wind_down' }
  | { kind: 'mode_content'; mode: string; forced: boolean; caseId: string; caseTitle: string }
  | { kind: 'teachback'; caseId: string; working: string[]; corrections: string[] }
  | { kind: 'word_collect'; word: { headword: string; definitionChild: string; sentence: string; tier: number } }
  | { kind: 'word_review'; direction: string; prompt: string; options: Array<{ id: string; label: string }> }
  | {
      kind: 'item';
      activityKind: string;
      family: keyof typeof engines;
      plain: boolean;
      rail: 'stage' | 'corner' | 'none';
      stem: Record<string, unknown>;
      options: Array<{ id: string; content: unknown }>;
    };

interface AnswerResult {
  correct: boolean;
  childHint?: string;
  cracked?: boolean;
  bonusWord?: { headword: string; definitionChild: string } | null;
}

interface EndResult {
  wordsToday?: string[];
  rankUp?: string | null;
}

const MODE_BLURBS: Record<string, string> = {
  watch: 'Watch me walk the trail, one clue at a time. Notice how each step follows the last.',
  walk: "We'll do one together, then one where you finish it, then one that's all yours.",
  see: "Here it is as a picture. Move through it slowly and you'll see the pattern.",
  hear: 'Close your eyes if you like. Listen to how the clue is built, piece by piece.',
  try: 'Straight to the magnifying glass. You can always come back for another way in.',
};

/** The set piece runs ~2.5s, and is skippable after the first time (§2.2). */
const CEREMONY_MS = 2500;
const SEEN_CEREMONY_KEY = 'crew-seen-crack';
/** Anticipation before a reveal — free tension (§2.1). */
const ANTICIPATION_MS = 200;

export function PlayRunner({ childId }: { childId: string }) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [outcome, setOutcome] = useState<{ optionId: string; correct: boolean } | null>(null);
  const [ceremony, setCeremony] = useState<AnswerResult | null>(null);
  const [canSkipCeremony, setCanSkipCeremony] = useState(false);
  const [beads, setBeads] = useState(0);
  const [justFilled, setJustFilled] = useState(false);
  const [vaultCount, setVaultCount] = useState(0);
  const [vaultBounce, setVaultBounce] = useState(false);
  const [flyer, setFlyer] = useState<{ word: string; from: DOMRect } | null>(null);
  const [ended, setEnded] = useState<EndResult | null>(null);
  const [rankUp, setRankUp] = useState<string | null>(null);
  const [teachStep, setTeachStep] = useState<number | null>(null);
  // Deterministic on the first render (server and hydration agree), then
  // rotated from an effect so the line still varies between visits. A
  // useState initializer would run on BOTH server and client and pick two
  // different variants — a hydration mismatch that makes React throw the tree
  // away and rebuild it, which also races in-flight taps.
  const [loadingLabel, setLoadingLabel] = useState(FIRST_LOADING_LINE);
  useEffect(() => setLoadingLabel(loadingLine()), []);
  const shownAt = useRef(Date.now());
  const loading = useRef(false);
  const finished = useRef(false);
  const vaultChip = useRef<HTMLSpanElement>(null);
  const collectCard = useRef<HTMLDivElement>(null);

  const seconds = () => Math.min(600, Math.round((Date.now() - shownAt.current) / 1000));

  const loadActivity = useCallback(async () => {
    if (loading.current || finished.current) return;
    loading.current = true;
    try {
      setSelected(null);
      setFeedback(null);
      setOutcome(null);
      setTeachStep(null);
      const response = await fetch(`/api/crew/${childId}/session/activity`);
      const next = (await response.json()) as Activity;
      shownAt.current = Date.now();
      if (next.kind === 'wind_down') {
        finished.current = true;
        mascotEvent('wind_down');
        playCue('wind-down');
        const endResponse = await fetch(`/api/crew/${childId}/session`, { method: 'DELETE' });
        const summary = (await endResponse.json()) as EndResult;
        setEnded(summary);
        setActivity(next);
        if (summary.rankUp) {
          // Rank up owns the screen for ~3s, then the wind-down settles in.
          setRankUp(summary.rankUp);
          mascotEvent('case_cracked');
          playCue('rank-up');
          window.setTimeout(() => {
            setRankUp(null);
            mascotEvent('wind_down');
          }, 3000);
        }
        return;
      }
      if (finished.current) return;
      if (next.kind === 'teachback') mascotEvent('teachback_shown');
      else if (next.kind === 'item' || next.kind === 'word_review') mascotEvent('question_shown');
      else mascotEvent('browsing');
      setActivity(next);
    } finally {
      loading.current = false;
    }
  }, [childId]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  /** Beads fill with a pop and a glow trail; they never drain (§2.2). */
  function fillBead() {
    setBeads((count) => count + 1);
    setJustFilled(true);
    window.setTimeout(() => setJustFilled(false), 460);
  }

  async function submit(optionId?: string) {
    if (outcome) return;
    const response = await fetch(`/api/crew/${childId}/session/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, secondsElapsed: seconds() }),
    });
    if (!response.ok) {
      await loadActivity();
      return;
    }
    const result = (await response.json()) as AnswerResult;
    fillBead();

    if (optionId) setOutcome({ optionId, correct: result.correct });
    mascotEvent(result.correct ? 'answer_correct' : 'answer_not_yet');
    playCue(result.correct ? 'correct' : 'not-yet');
    setFeedback(result);

    if (result.cracked) {
      // Anticipation beat, then the set piece.
      window.setTimeout(() => {
        mascotEvent('case_cracked');
        playCue('case-cracked');
        setCeremony(result);
        setCanSkipCeremony(window.localStorage.getItem(SEEN_CEREMONY_KEY) === '1');
        window.localStorage.setItem(SEEN_CEREMONY_KEY, '1');
        window.setTimeout(() => setCanSkipCeremony(true), CEREMONY_MS);
      }, ANTICIPATION_MS + 400);
    }
  }

  /** Word collected: the card flies an arc to the vault chip, which bounces. */
  async function collectWord(headword: string) {
    const from = collectCard.current?.getBoundingClientRect();
    if (from) setFlyer({ word: headword, from });
    setVaultCount((count) => count + 1);
    setVaultBounce(true);
    playCue('word-collected');
    window.setTimeout(() => setVaultBounce(false), 540);
    window.setTimeout(() => setFlyer(null), 720);

    const response = await fetch(`/api/crew/${childId}/session/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secondsElapsed: seconds() }),
    });
    if (response.ok) fillBead();
    await loadActivity();
  }

  async function modeApi(mode: string, action: 'open' | 'complete' | 'decline') {
    await fetch(`/api/crew/${childId}/session/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, action, secondsElapsed: action === 'complete' ? seconds() : 0 }),
    });
  }

  async function submitTeachback(correctionIndex: number) {
    await fetch(`/api/crew/${childId}/session/teachback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepIndex: teachStep ?? 0, correctionIndex, secondsElapsed: seconds() }),
    });
    await loadActivity();
  }

  if (!activity) {
    return (
      <div className="crew-shimmer" role="status">
        <span className="glass" aria-hidden>
          🔍
        </span>
        <p>{loadingLabel}</p>
      </div>
    );
  }

  if (activity.kind === 'no_session') {
    return (
      <div className="crew-stage">
        <p>Nothing open on the board right now.</p>
        <a className="crew-tap primary" href="/crew">
          Back to HQ
        </a>
      </div>
    );
  }

  /* ---------- Rank up: full screen, amber-only confetti (§2.2) ---------- */
  if (rankUp) {
    return (
      <div className="crew-rankup" data-testid="rank-up">
        <div className="crew-confetti" aria-hidden>
          {Array.from({ length: 26 }, (_, index) => (
            <i
              key={index}
              style={{
                left: `${(index * 3.9) % 100}%`,
                animationDelay: `${(index % 7) * 120}ms`,
                animationDuration: `${2000 + (index % 5) * 220}ms`,
              }}
            />
          ))}
        </div>
        <span className="crew-badge" aria-hidden>
          🎖️
        </span>
        <Mascot size={120} />
        <p className="crew-ribbon">{VOICE.rankUp(rankUp)}</p>
      </div>
    );
  }

  /* ---------- Wind-down: words fan out, lantern pulses, lights dim ---------- */
  if (activity.kind === 'wind_down' || ended) {
    const words = ended?.wordsToday ?? [];
    return (
      <div className="crew-stage crew-winddown" data-testid="wind-down">
        <Mascot size={120} />
        <div className="crew-fan">
          {words.map((word, index) => (
            <span
              key={`${word}-${index}`}
              style={{
                ['--i' as never]: index,
                ['--rot' as never]: `${(index - (words.length - 1) / 2) * 7}deg`,
              }}
            >
              {word}
            </span>
          ))}
        </div>
        <p style={{ fontSize: '1.3rem' }}>{windDownLine()}</p>
        <p>
          <span className="crew-lantern pulse" aria-hidden>
            🏮
          </span>
        </p>
        <a className="crew-tap primary" href="/crew">
          Back to HQ
        </a>
      </div>
    );
  }

  /* ---------- Case cracked: the set piece (§2.2) ---------- */
  if (ceremony) {
    return (
      <>
        <div className="crew-dim" aria-hidden />
        <div className="crew-stage crew-ceremony" data-testid="case-cracked">
          <div className="crew-casefile">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span className="crew-ink" aria-hidden />
              <span className="crew-dust" aria-hidden />
              <span className="crew-bigstamp">{VOICE.crackedStamp}</span>
            </div>
          </div>
          <Mascot size={110} />
          <p style={{ fontSize: '1.25rem' }}>{beatLine('cracked')}</p>
          {ceremony.bonusWord ? (
            <p className="crew-celebrate" style={{ display: 'inline-block' }}>
              {beatLine('word-collected')} <strong>{ceremony.bonusWord.headword}</strong> —{' '}
              {ceremony.bonusWord.definitionChild}
            </p>
          ) : null}
          <p>
            <button
              className="crew-tap primary"
              disabled={!canSkipCeremony}
              onClick={() => {
                setCeremony(null);
                void loadActivity();
              }}
            >
              Keep going
            </button>
          </p>
        </div>
      </>
    );
  }

  const frame = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      {/* role="img": aria-label is prohibited on a generic div, so the beads
          would otherwise carry no accessible name. Beads only ever fill,
          never drain (Addendum A §2.2), so the label counts work done. */}
      <div className="crew-beads" role="img" aria-label={`${beads} clues worked so far`}>
        {Array.from({ length: Math.max(beads + 3, 8) }, (_, index) => (
          <span
            key={index}
            className={`crew-bead${index < beads ? ' filled' : ''}${
              justFilled && index === beads - 1 ? ' just-filled' : ''
            }`}
          />
        ))}
      </div>
      <span className={`crew-vault-chip${vaultBounce ? ' bounce' : ''}`} ref={vaultChip}>
        📚 {vaultCount}
      </span>
      {activity.kind === 'item' && !activity.plain ? <Mascot size={64} /> : null}
    </div>
  );

  return (
    <div className="crew-stage">
      {frame}

      {flyer ? (
        <div
          className="crew-flyer"
          aria-hidden
          style={{
            left: flyer.from.left,
            top: flyer.from.top,
            ['--dx' as never]: `${(vaultChip.current?.getBoundingClientRect().left ?? 0) - flyer.from.left}px`,
            ['--dy' as never]: `${(vaultChip.current?.getBoundingClientRect().top ?? 0) - flyer.from.top}px`,
          }}
        >
          {flyer.word}
        </div>
      ) : null}

      {activity.kind === 'word_collect' ? (
        <section className="crew-panel" aria-live="polite" ref={collectCard}>
          <h2 style={{ marginTop: 0 }}>
            {beatLine('word-collected')} <strong>{activity.word.headword}</strong>{' '}
            <SpeakButton
              text={`${activity.word.headword}. ${activity.word.definitionChild}. ${activity.word.sentence}`}
            />
          </h2>
          <p>{activity.word.definitionChild}</p>
          <p style={{ fontStyle: 'italic' }}>{activity.word.sentence}</p>
          <button
            className="crew-tap primary"
            data-testid="collect-word"
            onClick={() => void collectWord(activity.word.headword)}
          >
            Into the vault
          </button>
        </section>
      ) : null}

      {activity.kind === 'word_review' && !feedback ? (
        <section className="crew-panel">
          <h2 style={{ marginTop: 0 }}>
            Vault check <SpeakButton text={activity.prompt} />
          </h2>
          <p style={{ fontSize: '1.3rem' }}>{activity.prompt}</p>
          <div role="group" aria-label="Answer choices">
            {activity.options.map((option) => (
              <button
                key={option.id}
                className="crew-tap"
                disabled={Boolean(outcome)}
                onClick={() => void submit(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activity.kind === 'mode_content' ? (
        <section className="crew-panel">
          <h2 style={{ marginTop: 0 }}>
            {activity.forced ? "Let's look at this another way." : beatLine('second-miss')}
          </h2>
          <p style={{ fontSize: '1.15rem' }}>
            {MODE_BLURBS[activity.mode] ?? MODE_BLURBS.walk}{' '}
            <SpeakButton text={MODE_BLURBS[activity.mode] ?? ''} />
          </p>
          <p className="cc-muted">
            ({activity.caseTitle} — the full {activity.mode} clip lands with the real artwork.)
          </p>
          <button
            className="crew-tap primary"
            onClick={async () => {
              await modeApi(activity.mode, 'open');
              await modeApi(activity.mode, 'complete');
              await loadActivity();
            }}
          >
            Back to the case
          </button>
          {!activity.forced ? (
            <button
              className="crew-tap"
              onClick={async () => {
                await modeApi(activity.mode, 'decline');
                await loadActivity();
              }}
            >
              No thanks, keep going
            </button>
          ) : null}
        </section>
      ) : null}

      {activity.kind === 'teachback' ? (
        <section className="crew-panel">
          <h2 style={{ marginTop: 0 }}>Your turn to teach.</h2>
          <p>I had a go at this one, but a step went wobbly. Tap the wobbly step:</p>
          <div style={{ display: 'grid', gap: '8px', maxWidth: 640 }}>
            {activity.working.map((step, index) => (
              <button
                key={index}
                className={`crew-tap${teachStep === index ? ' selected' : ''}`}
                style={{ textAlign: 'left', fontWeight: 500 }}
                aria-pressed={teachStep === index}
                onClick={() => setTeachStep(index)}
              >
                💭 {step}
              </button>
            ))}
          </div>
          {teachStep !== null ? (
            <>
              <p style={{ fontWeight: 700 }}>Now — what should I have done instead?</p>
              <div style={{ display: 'grid', gap: '8px', maxWidth: 640 }}>
                {activity.corrections.map((correction, index) => (
                  <button
                    key={index}
                    className="crew-tap"
                    style={{ textAlign: 'left' }}
                    onClick={() => void submitTeachback(index)}
                  >
                    {correction}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {activity.kind === 'item' ? (
        <section aria-live="polite">
          {activity.plain ? (
            <p className="cc-muted" data-testid="boss-intro">
              {VOICE.bossIntro}
            </p>
          ) : (
            <p className="cc-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SpeakButton text={stemText(activity.stem)} /> Tap the speaker to hear it.
            </p>
          )}
          {activity.plain ? (
            <PlainItem
              stem={activity.stem}
              options={activity.options}
              rail="none"
              selected={selected}
              onSelect={setSelected}
              outcome={outcome}
            />
          ) : (
            (() => {
              const Engine = engines[activity.family] ?? engines.wordweb;
              return (
                <Engine
                  stem={activity.stem}
                  options={activity.options}
                  rail={activity.rail}
                  selected={selected}
                  onSelect={setSelected}
                  outcome={outcome}
                />
              );
            })()
          )}
          {!outcome ? (
            <p>
              <button
                className="crew-tap primary"
                data-testid="lock-answer"
                disabled={!selected}
                onClick={() => void submit(selected!)}
              >
                That&apos;s my answer
              </button>
            </p>
          ) : null}
        </section>
      ) : null}

      {feedback ? (
        feedback.correct ? (
          <section className="crew-celebrate" role="status" data-testid="beat-correct">
            <p style={{ margin: 0, fontSize: '1.2rem' }}>
              ✔ {correctLine(activity.kind === 'item' ? activity.family : 'wordweb')}
            </p>
            <button className="crew-tap primary" data-testid="next-clue" onClick={() => void loadActivity()}>
              Next clue
            </button>
          </section>
        ) : (
          <section className="crew-notyet" role="status" data-testid="beat-not-yet">
            <p style={{ margin: 0, fontSize: '1.2rem' }}>{notYetLine()}</p>
            {feedback.childHint ? <p style={{ marginBottom: 0 }}>{feedback.childHint}</p> : null}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <button className="crew-tap primary" data-testid="try-again" onClick={() => void loadActivity()}>
                {VOICE.missAgain}
              </button>
              <button
                className="crew-tap"
                onClick={async () => {
                  await modeApi('walk', 'open');
                  await modeApi('walk', 'complete');
                  await loadActivity();
                }}
              >
                {VOICE.missWayIn}
              </button>
            </div>
          </section>
        )
      ) : null}

      <p style={{ marginTop: '2rem' }}>
        <button
          className="crew-tap"
          onClick={async () => {
            await fetch(`/api/crew/${childId}/session`, { method: 'DELETE' });
            window.location.href = '/crew';
          }}
        >
          That&apos;s me for now
        </button>
      </p>
    </div>
  );
}
