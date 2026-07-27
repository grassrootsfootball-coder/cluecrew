'use client';

/**
 * The Daily Loop runner (BUILD-PHASE-4 §4). This component RENDERS what the
 * engine decides — it holds zero pedagogy. Activities arrive from the API;
 * answers go back; feedback beats, ceremonies and the wind-down are staged
 * here. Mascot state changes flow only through mascotController.
 */
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { mascotEvent } from './mascot-controller';
import { Mascot } from './mascot';
import { SpeakButton } from './speak-button';
import { stemText } from './engines/shared';

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
  affirmation?: string;
  childHint?: string;
  cracked?: boolean;
  bonusWord?: { headword: string; definitionChild: string } | null;
}

const MODE_BLURBS: Record<string, string> = {
  watch: 'Picture the detective walking the trail, one clue at a time. Watch how each step follows from the last.',
  walk: "Let's do one together, then one where you finish it, then one that is all yours.",
  see: 'Here it is as a picture — move through it slowly and see the pattern with your eyes.',
  hear: 'Close your eyes if you like. Listen to how the clue is built, piece by piece.',
  try: 'Straight to the magnifying glass — you can always hop back for a different way in.',
};

export function PlayRunner({ childId }: { childId: string }) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [ceremony, setCeremony] = useState<AnswerResult | null>(null);
  const [beads, setBeads] = useState(0);
  const [ended, setEnded] = useState<{ wordsToday?: number } | null>(null);
  const [teachStep, setTeachStep] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const shownAt = useRef(Date.now());
  const loading = useRef(false);
  const finished = useRef(false);

  const seconds = () => Math.min(600, Math.round((Date.now() - shownAt.current) / 1000));

  const loadActivity = useCallback(async () => {
    // The wind-down is terminal, and only one activity fetch may run at a
    // time — otherwise a second fetch can race session end and overwrite the
    // goodbye screen with "no session".
    if (loading.current || finished.current) return;
    loading.current = true;
    try {
      setSelected(null);
      setFeedback(null);
      setTeachStep(null);
      const response = await fetch(`/api/crew/${childId}/session/activity`);
      const next = (await response.json()) as Activity;
      shownAt.current = Date.now();
      if (next.kind === 'wind_down') {
        finished.current = true;
        mascotEvent('wind_down');
        const endResponse = await fetch(`/api/crew/${childId}/session`, { method: 'DELETE' });
        setEnded(await endResponse.json());
        setActivity(next);
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

  async function submit(optionId?: string, skipFeedbackBeat = false) {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/crew/${childId}/session/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, secondsElapsed: seconds() }),
      });
      if (!response.ok) {
        // Answer raced a state change (e.g. a double tap) — just re-sync.
        await loadActivity();
        return;
      }
      const result = (await response.json()) as AnswerResult;
      setBeads((count) => count + 1);
      if (result.cracked) {
        mascotEvent('case_cracked');
        setCeremony(result);
        return;
      }
      if (skipFeedbackBeat) {
        await loadActivity();
        return;
      }
      mascotEvent(result.correct ? 'answer_correct' : 'answer_not_yet');
      setFeedback(result);
    } finally {
      setBusy(false);
    }
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
      <div className="crew-stage">
        <p>Opening your case file…</p>
      </div>
    );
  }

  if (activity.kind === 'no_session') {
    return (
      <div className="crew-stage">
        <p>No case open right now.</p>
        <a className="crew-tap primary" href="/crew">
          Back to Crew HQ
        </a>
      </div>
    );
  }

  if (activity.kind === 'wind_down' || ended) {
    return (
      <div className="crew-stage crew-ceremony">
        <Mascot size={120} />
        <h1>Case closed for today.</h1>
        {ended?.wordsToday ? (
          <p>
            {ended.wordsToday} word{ended.wordsToday === 1 ? '' : 's'} joined your Vault today. 📚
          </p>
        ) : null}
        <p style={{ fontSize: '1.3rem' }}>See you tomorrow, Detective.</p>
        <a className="crew-tap primary" href="/crew">
          Back to Crew HQ
        </a>
      </div>
    );
  }

  // Crack ceremony (§4.5) — stamp, spark, bonus word. Skippable via Continue.
  if (ceremony) {
    return (
      <div className="crew-stage crew-ceremony">
        <div className="crew-stamp" style={{ position: 'static', display: 'inline-block', fontSize: '2rem', padding: '0.5rem 1rem' }}>
          CASE CRACKED ✓
        </div>
        <Mascot size={110} />
        <p style={{ fontSize: '1.25rem' }}>{ceremony.affirmation ?? 'You cracked it!'}</p>
        {ceremony.bonusWord ? (
          <p className="crew-celebrate" style={{ display: 'inline-block' }}>
            Bonus Word Card: <strong>{ceremony.bonusWord.headword}</strong> — {ceremony.bonusWord.definitionChild}
          </p>
        ) : null}
        <p>
          <button className="crew-tap primary" onClick={() => { setCeremony(null); void loadActivity(); }}>
            Continue
          </button>
        </p>
      </div>
    );
  }

  const frame = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      <div className="crew-beads" aria-label={`${beads} clues answered so far`}>
        {Array.from({ length: Math.max(beads + 3, 8) }, (_, index) => (
          <span key={index} className={`crew-bead${index < beads ? ' filled' : ''}`} />
        ))}
      </div>
      {activity.kind === 'item' && !activity.plain ? <Mascot size={64} /> : null}
    </div>
  );

  return (
    <div className="crew-stage">
      {frame}

      {activity.kind === 'word_collect' && !feedback ? (
        <section className="crew-panel" aria-live="polite">
          <h2 style={{ marginTop: 0 }}>A new Word Card! ✨</h2>
          <p style={{ fontSize: '1.5rem', margin: '0.25rem 0' }}>
            <strong>{activity.word.headword}</strong> <SpeakButton text={`${activity.word.headword}. ${activity.word.definitionChild}. ${activity.word.sentence}`} />
          </p>
          <p>{activity.word.definitionChild}</p>
          <p style={{ fontStyle: 'italic' }}>{activity.word.sentence}</p>
          <button className="crew-tap primary" disabled={busy} onClick={() => void submit(undefined, true)}>
            Add it to my Vault
          </button>
        </section>
      ) : null}

      {activity.kind === 'word_review' && !feedback ? (
        <section className="crew-panel">
          <h2 style={{ marginTop: 0 }}>
            Word check <SpeakButton text={activity.prompt} />
          </h2>
          <p style={{ fontSize: '1.3rem' }}>{activity.prompt}</p>
          <div role="group" aria-label="Answer choices">
            {activity.options.map((option) => (
              <button key={option.id} className="crew-tap" disabled={busy} onClick={() => void submit(option.id)}>
                {option.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activity.kind === 'mode_content' ? (
        <section className="crew-panel">
          {activity.forced ? (
            <h2 style={{ marginTop: 0 }}>Let&apos;s look at this another way.</h2>
          ) : (
            <h2 style={{ marginTop: 0 }}>Fancy a quick look at another way in?</h2>
          )}
          <p style={{ fontSize: '1.15rem' }}>
            {MODE_BLURBS[activity.mode] ?? MODE_BLURBS.walk}{' '}
            <SpeakButton text={MODE_BLURBS[activity.mode] ?? ''} />
          </p>
          <p className="cc-muted">({activity.caseTitle} — the full {activity.mode} clip lands with the real artwork.)</p>
          <button
            className="crew-tap primary"
            onClick={async () => {
              await modeApi(activity.mode, 'open');
              await modeApi(activity.mode, 'complete');
              await loadActivity();
            }}
          >
            Done — back to the case
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
          <h2 style={{ marginTop: 0 }}>Your turn to teach! 🎓</h2>
          <p>The mascot tried this one — but one step went wobbly. Tap the wobbly step:</p>
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
              <p style={{ fontWeight: 700 }}>Now — what should the mascot do instead?</p>
              <div style={{ display: 'grid', gap: '8px', maxWidth: 640 }}>
                {activity.corrections.map((correction, index) => (
                  <button key={index} className="crew-tap" style={{ textAlign: 'left' }} onClick={() => void submitTeachback(index)}>
                    {correction}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {activity.kind === 'item' && !feedback ? (
        <section aria-live="polite">
          {!activity.plain ? (
            <p className="cc-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SpeakButton text={stemText(activity.stem)} /> Tap the speaker to hear it.
            </p>
          ) : null}
          {activity.plain ? (
            <PlainItem
              stem={activity.stem}
              options={activity.options}
              rail="none"
              selected={selected}
              onSelect={setSelected}
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
                />
              );
            })()
          )}
          <p>
            <button className="crew-tap primary" disabled={!selected || busy} onClick={() => void submit(selected!)}>
              That&apos;s my answer
            </button>
          </p>
        </section>
      ) : null}

      {feedback ? (
        feedback.correct ? (
          <section className="crew-celebrate" role="status">
            <p style={{ margin: 0, fontSize: '1.2rem' }}>
              ✔ {feedback.affirmation ?? 'Nicely worked out!'}
            </p>
            <button className="crew-tap primary" onClick={() => void loadActivity()}>
              Next clue
            </button>
          </section>
        ) : (
          <section className="crew-notyet" role="status">
            <p style={{ margin: 0, fontSize: '1.2rem' }}>Not yet — you&apos;re on the trail.</p>
            {feedback.childHint ? <p style={{ marginBottom: 0 }}>{feedback.childHint}</p> : null}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <button className="crew-tap primary" onClick={() => void loadActivity()}>
                Try another?
              </button>
              <button
                className="crew-tap"
                onClick={async () => {
                  await modeApi('walk', 'open');
                  await modeApi('walk', 'complete');
                  await loadActivity();
                }}
              >
                Show me a way in
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
          I&apos;m done for now
        </button>
      </p>
    </div>
  );
}
