'use client';

/**
 * Parent-side mocks (ADDENDUM-B §3 scheduling + §4 Stage 1 reporting).
 *
 * The honesty ladder, stage 1: raw score, percentage, per-type breakdown,
 * time-per-section, trajectory — and the plain-English note, verbatim from the
 * spec, that these are not predicted results. Nothing here ever frames an
 * outcome as foreseen: no forecast of any kind, no probability, no threshold
 * comparison (L1 — and the vocab scan now enforces the exact phrases).
 */
import { useCallback, useEffect, useState } from 'react';

interface BlueprintState {
  id: string;
  title: string;
  district: string;
  draft: boolean;
  servable: boolean;
  pending: boolean;
  allowedAt: string;
  blocked: boolean;
}

interface SittingReport {
  sittingId: string;
  blueprintTitle: string;
  district: string;
  satAt: string;
  report: {
    raw: number;
    total: number;
    percentage: number;
    perType: Array<{ questionTypeId: string; name: string; correct: number; total: number }>;
    sections: Array<{
      index: number;
      minutes: number;
      questionCount: number;
      correct: number;
      answered: number;
      secondsUsed: number | null;
    }>;
  };
}

interface MocksData {
  blueprints: BlueprintState[];
  sittings: SittingReport[];
  trajectory: Array<{ satAt: string; percentage: number; raw: number; total: number }>;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function MocksPanel({ childId, crewName }: { childId: string; crewName: string }) {
  const [data, setData] = useState<MocksData | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/parent/mocks?childId=${childId}`);
    if (response.ok) setData((await response.json()) as MocksData);
  }, [childId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function schedule(blueprintId: string) {
    setNotice(null);
    const response = await fetch('/api/parent/mocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, blueprintId }),
    });
    const result = (await response.json()) as { ok: boolean; reason?: string; allowedAt?: string };
    if (!result.ok) {
      setNotice(
        result.reason === 'cadence' && result.allowedAt
          ? `The next paper in this subject unlocks on ${shortDate(result.allowedAt)}.`
          : result.reason === 'shortfall'
            ? 'Not enough unseen paper questions are ready yet — we have flagged it on our side.'
            : result.reason === 'already_scheduled'
              ? `A paper is already waiting for ${crewName}.`
              : 'That paper is not available yet.',
      );
    }
    await load();
  }

  if (!data) return <p className="cc-muted">Loading…</p>;

  return (
    <section className="cc-card">
      <h2 style={{ marginTop: 0 }}>{crewName}</h2>

      <h3>Book a practice paper</h3>
      {/* The frequency cap, copy-explained rather than silently enforced (§3). */}
      <p className="cc-muted">
        One full paper per subject each week. The space between papers is deliberate: papers
        measure, daily practice teaches — and a calm run-up beats a cram (see{' '}
        <a href="/parent/casebook/mocks-and-what-results-mean">the Casebook on mocks</a>, including
        the exam-day rhythm page).
      </p>
      {data.blueprints.map((blueprint) => (
        <div key={blueprint.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0.4rem 0' }}>
          <span>
            {blueprint.title}
            {blueprint.draft ? (
              <em className="cc-muted"> — draft, awaiting specialist verification</em>
            ) : null}
          </span>
          {blueprint.pending ? (
            <span className="cc-muted">scheduled — ready in Crew HQ</span>
          ) : blueprint.blocked ? (
            <span className="cc-muted">next unlocks {shortDate(blueprint.allowedAt)}</span>
          ) : blueprint.servable ? (
            <button className="cc-button" onClick={() => void schedule(blueprint.id)}>
              Book for {crewName}
            </button>
          ) : (
            <span className="cc-muted">not yet available</span>
          )}
        </div>
      ))}
      {notice ? <p>{notice}</p> : null}
      <p className="cc-muted">
        Before the sitting: a tablet or laptop and a quiet room make it a fair run.
      </p>

      <h3>Results</h3>
      {/* The §4 note, verbatim, wraps every result view. */}
      <p>
        Real 11+ results are age-standardised; practice scores here show attainment and progress,
        not a predicted result.{' '}
        <a href="/parent/casebook/scoring-and-standardisation">
          How scoring and standardisation work
        </a>
        .
      </p>

      {data.sittings.length === 0 ? (
        <p className="cc-muted">No completed papers yet. Results land here after the first one.</p>
      ) : (
        <>
          {data.trajectory.length > 1 ? (
            <p data-testid="trajectory">
              Across sittings:{' '}
              {data.trajectory
                .map((point) => `${shortDate(point.satAt)} — ${point.percentage}%`)
                .join(' · ')}
            </p>
          ) : null}

          {data.sittings.map((sitting) => (
            <details key={sitting.sittingId} className="cc-card" data-testid="sitting-report">
              <summary style={{ cursor: 'pointer' }}>
                <strong>{sitting.blueprintTitle}</strong> · {shortDate(sitting.satAt)} ·{' '}
                {sitting.report.raw} of {sitting.report.total} ({sitting.report.percentage}%)
              </summary>
              <h4>By question type</h4>
              <ul>
                {sitting.report.perType.map((line) => (
                  <li key={line.questionTypeId}>
                    {line.name}: {line.correct} of {line.total}
                  </li>
                ))}
              </ul>
              <h4>Time per section</h4>
              <ul>
                {sitting.report.sections.map((section) => (
                  <li key={section.index}>
                    Section {section.index + 1}: {section.answered} of {section.questionCount}{' '}
                    answered
                    {section.secondsUsed !== null
                      ? ` in ${Math.round(section.secondsUsed / 60)} of ${section.minutes} minutes`
                      : ''}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </>
      )}
    </section>
  );
}
