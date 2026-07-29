import { childFromCookie } from '@/lib/crew/server';
import { hqState } from '@/lib/crew/orchestrator';
import { Mascot } from '@/components/crew/mascot';
import { StartLoopButton } from '@/components/crew/start-loop-button';
import { VOICE, beatLine, countWord } from '@/lib/voice';

/** Crew HQ (BUILD-PHASE-4 §6) in the Addendum A voice. */
export default async function CrewHqPage() {
  const child = await childFromCookie();
  // Pages render in parallel with the layout in the App Router, so the
  // layout's missing-child gate does NOT stop this body executing. Bail
  // quietly; CrewLayout owns the warm, in-world gate the child sees.
  if (!child) return null;
  const { crew } = await hqState(child.id);

  const cracked = crew.caseSummaries.filter((summary) => summary.status === 'cracked').length;
  const onTheBoard = crew.caseSummaries.filter((summary) => summary.status !== 'cracked').length;
  const firstVisit = crew.caseSummaries.length === 0;

  return (
    <main className="crew-stage">
      <header style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Mascot size={84} />
        <div>
          <h1 style={{ margin: 0 }}>
            {firstVisit ? `You're in, ${child.crewName}.` : VOICE.hqReturning(onTheBoard)}
          </h1>
          <p style={{ margin: '0.2rem 0' }}>
            <strong>{crew.rankLabel}</strong>
            {' · '}
            <span aria-label={`Streak lantern: ${crew.streak.state}`}>
              <span className="crew-lantern" aria-hidden>
                🏮
              </span>{' '}
              {crew.streak.state === 'alive' ? VOICE.streakAlive : VOICE.streakRekindled}
            </span>
          </p>
        </div>
      </header>

      <section className="crew-panel">
        <h2 style={{ marginTop: 0 }}>{firstVisit ? VOICE.hqFirstVisit : "Today's shift"}</h2>
        <div className="crew-stones">
          <div className="crew-stone" style={{ ['--i' as never]: 0 }}>
            {crew.hasReviewsDue ? 'Warm-up. Old ground first.' : 'Warm-up'}
          </div>
          <div className="crew-stone" style={{ ['--i' as never]: 1 }}>
            Today&apos;s case
          </div>
          <div className="crew-stone" style={{ ['--i' as never]: 2 }}>
            One big question
          </div>
        </div>
        <p className="cc-muted">{beatLine('warmup-open')}</p>
        <p style={{ marginBottom: 0 }}>
          <StartLoopButton childId={child.id} label={VOICE.hqStartShift} />
        </p>
      </section>

      <section className="crew-panel">
        <h2 style={{ marginTop: 0 }}>The districts</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a className="crew-door" href="/crew/district">
            <span>VR District</span>
            <span className="door-sub">{countWord(cracked, 'case')} cracked</span>
            <span aria-hidden>🚪</span>
          </a>
          {[0, 1, 2].map((index) => (
            <div key={index} className="crew-door locked" aria-label={VOICE.lockedDistrict}>
              <span className="door-sub" aria-hidden>
                ? ? ?
              </span>
              <span className="door-sub">{VOICE.lockedDistrict}</span>
              <span className="door-glyph" aria-hidden>
                🔒
              </span>
            </div>
          ))}
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
