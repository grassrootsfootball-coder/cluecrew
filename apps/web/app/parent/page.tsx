import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { billingNow } from '@/lib/billing';
import { GENTLE_WEEKLY_TARGET, parentDashboard } from '@/lib/parent/dashboard';

/**
 * Parent HQ dashboard, live (BUILD-PHASE-5 §4). Tells parents what to DO,
 * not just what happened. Rhythm framing, never league table; percentages
 * behind a tap; calm runway, no countdown urgency. A parent who never opens
 * this misses nothing critical — the weekly email carries the same story.
 */
export default async function ParentDashboardPage() {
  const parent = (await currentParent())!;
  const [dashboards, subscription] = await Promise.all([
    parentDashboard(parent.id),
    prisma.subscription.findUnique({ where: { parentId: parent.id } }),
  ]);

  const now = billingNow();
  const trialDaysLeft =
    subscription?.status === 'trialing' && subscription.trialEndsAt
      ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / 86_400_000))
      : null;

  return (
    <main className="cc-container">
      <h1>Hello, {parent.displayName}</h1>

      {trialDaysLeft !== null ? (
        <div className="cc-card">
          <strong>
            Trial: {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} remaining.
          </strong>{' '}
          <span className="cc-muted">
            Add payment details any time in <a href="/parent/billing">Billing</a>. Your child sees
            none of this.
          </span>
        </div>
      ) : null}

      {dashboards.length === 0 ? (
        <div className="cc-card">
          <h2 style={{ marginTop: 0 }}>Let&apos;s set up your first detective</h2>
          <p>
            Two minutes in <a href="/onboarding">onboarding</a> and their Crew HQ is ready — first
            name, year group, and how they like to work.
          </p>
        </div>
      ) : null}

      {dashboards.map((child) => (
        <section key={child.childId} className="cc-card">
          <h2 style={{ marginTop: 0 }}>{child.crewName}</h2>

          {child.runway.casesCracked === 0 && child.sessionsThisWeek === 0 ? (
            <div className="cc-card" style={{ marginTop: 0 }}>
              <h3 style={{ marginTop: 0 }}>{child.crewName} hasn&apos;t started yet</h3>
              <p>
                Nothing to read here until they do — and that is fine. Their first session takes
                fifteen minutes: a warm-up, one detective Case, and one exam-style question.
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong>What you can do:</strong> open Crew HQ with them once, let them pick any
                case that looks interesting, then leave them to it. This page fills in on its own
                from the first session, and the Sunday email starts once there is something worth
                telling you.
              </p>
            </div>
          ) : null}

          <h3>This week</h3>
          {child.sessionsThisWeek === 0 ? (
            <p>
              No sessions yet this week — the loop takes 15 minutes, and any day counts. A gentle
              rhythm of {GENTLE_WEEKLY_TARGET} days a week is the whole aim.
            </p>
          ) : (
            <p>
              {child.sessionsThisWeek} of a gentle {GENTLE_WEEKLY_TARGET} sessions ·{' '}
              {child.minutesThisWeek} minutes ·{' '}
              {child.streak.state === 'alive'
                ? `${child.streak.weeks}-week rhythm going strong 🏮`
                : 'rhythm rekindling — today relights it 🏮'}
            </p>
          )}

          {(child.clicking.length > 0 || child.developing.length > 0) && (
            <>
              <h3>What&apos;s clicking / what&apos;s tricky</h3>
              <ul>
                {child.clicking.map((insight) => (
                  <li key={insight.label}>
                    <strong>{insight.label}:</strong> {insight.state}.
                    <details style={{ display: 'inline-block', marginLeft: '0.4rem' }}>
                      <summary className="cc-muted" style={{ cursor: 'pointer', display: 'inline' }}>
                        detail
                      </summary>{' '}
                      <span className="cc-muted">{insight.masteryPercent}% mastered</span>
                    </details>
                  </li>
                ))}
                {child.developing.map((insight) => (
                  <li key={insight.label}>
                    <strong>{insight.label}:</strong> {insight.state}. Try this:{' '}
                    <em>{insight.action}</em>
                    <details style={{ display: 'inline-block', marginLeft: '0.4rem' }}>
                      <summary className="cc-muted" style={{ cursor: 'pointer', display: 'inline' }}>
                        detail
                      </summary>{' '}
                      <span className="cc-muted">{insight.masteryPercent}% mastered</span>
                    </details>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3>Words this week</h3>
          {child.wordsThisWeek.length === 0 ? (
            <p className="cc-muted">New words land here after each warm-up.</p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {child.wordsThisWeek.map((word) => (
                  <span key={word.headword} className="cc-card" style={{ margin: 0, padding: '0.5rem 0.8rem' }}>
                    <strong>{word.headword}</strong>
                    <br />
                    <span className="cc-muted" style={{ fontSize: '0.85rem' }}>{word.definitionChild}</span>
                  </span>
                ))}
              </div>
              <p className="cc-muted">{child.wordPrompt}</p>
            </>
          )}

          <h3>Exam runway</h3>
          <p>
            {child.runway.monthsToExam !== null
              ? `${child.runway.monthsToExam} months to the test window. `
              : 'Set an exam year in Children to see the runway. '}
            {child.runway.casesCracked} of {child.runway.casesTotal} VR cases cracked.{' '}
            {child.runway.nextMilestone}
          </p>
        </section>
      ))}

      <p className="cc-muted">
        A summary of all this reaches your inbox each Sunday — nothing here is homework for you.
      </p>
    </main>
  );
}
