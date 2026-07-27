import { childFromCookie } from '@/lib/crew/server';
import { hqState } from '@/lib/crew/orchestrator';
import { Mascot } from '@/components/crew/mascot';
import { StartLoopButton } from '@/components/crew/start-loop-button';

/** Crew HQ (BUILD-PHASE-4 §6): the child's home. */
export default async function CrewHqPage() {
  const child = (await childFromCookie())!;
  const { crew } = await hqState(child.id);

  const crackedCount = crew.caseSummaries.filter((summary) => summary.status === 'cracked').length;

  return (
    <main className="crew-stage">
      <header style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Mascot size={84} />
        <div>
          <h1 style={{ margin: 0 }}>Welcome back, {child.crewName}.</h1>
          <p style={{ margin: '0.2rem 0' }}>
            <strong>{crew.rankLabel}</strong>
            {' · '}
            <span aria-label={`Streak lantern: ${crew.streak.state}`}>
              {crew.streak.state === 'alive'
                ? `🏮 Lantern lit — ${crew.streak.weeks} week${crew.streak.weeks === 1 ? '' : 's'} strong`
                : '🏮 Lantern rekindling — light it again today'}
            </span>
          </p>
        </div>
      </header>

      <section className="crew-panel">
        <h2 style={{ marginTop: 0 }}>Today&apos;s loop</h2>
        <div className="crew-stones">
          <div className="crew-stone">Warm-up{crew.hasReviewsDue ? ' 🔎' : ''}</div>
          <div className="crew-stone">Today&apos;s Case</div>
          <div className="crew-stone">One Big Question</div>
        </div>
        <p style={{ marginBottom: 0 }}>
          <StartLoopButton childId={child.id} label="Start today's loop" />
        </p>
      </section>

      <section className="crew-panel">
        <h2 style={{ marginTop: 0 }}>The districts</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a className="crew-door" href="/crew/district">
            <span>VR District</span>
            <span className="cc-muted">{crackedCount} cases cracked</span>
            <span>🚪</span>
          </a>
          <div className="crew-door locked" aria-label="A locked district — not open yet">
            <span>? ? ?</span>
            <span>🔒</span>
          </div>
          <div className="crew-door locked" aria-label="A locked district — not open yet">
            <span>? ? ?</span>
            <span>🔒</span>
          </div>
          <div className="crew-door locked" aria-label="A locked district — not open yet">
            <span>? ? ?</span>
            <span>🔒</span>
          </div>
        </div>
      </section>

      <p>
        <a className="crew-tap" href="/crew/vault">
          📚 Word Vault
        </a>
      </p>
    </main>
  );
}
