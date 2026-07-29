import { prisma } from '@cluecrew/db';
import { childFromCookie } from '@/lib/crew/server';
import { hqState } from '@/lib/crew/orchestrator';
import { nextStepFor, rankLadder } from '@/lib/crew/casefile';
import { VOICE, countWord } from '@/lib/voice';

/**
 * The child's own case file — the overview they had nowhere to see.
 *
 * Everything here is self-referential by design: their rank, their stamps,
 * their words, their lantern. No other child appears, nothing is ranked
 * against anyone, and nothing on this page can go down (D2/D3).
 */
export default async function CaseFilePage() {
  const child = await childFromCookie();
  // Pages render in parallel with the layout in the App Router, so the
  // layout's missing-child gate does NOT stop this body executing.
  if (!child) return null;

  const [{ crew, stats }, wordsCollected, wordsGilded] = await Promise.all([
    hqState(child.id),
    prisma.wordVaultEntry.count({ where: { childId: child.id } }),
    prisma.wordVaultEntry.count({ where: { childId: child.id, masteryLevel: { gte: 0.8 } } }),
  ]);

  const cracked = crew.caseSummaries.filter((summary) => summary.status === 'cracked');
  const working = crew.caseSummaries.filter((summary) => summary.status !== 'cracked');
  const next = nextStepFor({
    rank: crew.rank,
    casesCracked: stats.casesCracked,
    streakWeeks: child.streakWeeks,
    taughtBackCount: stats.taughtBackCount,
    bossCaseParticipated: stats.bossCaseParticipated,
  });
  const ladder = rankLadder(crew.rank);

  return (
    <main className="crew-stage">
      <h1>Your case file</h1>
      <p className="crew-lede">{VOICE.caseFileLede}</p>

      <section className="crew-panel">
        <h2 style={{ marginTop: 0 }}>{crew.rankLabel}</h2>
        <p className="crew-next-step">{next.line}</p>
        <ol className="crew-ladder">
          {ladder.map((step) => (
            <li
              key={step.label}
              className={`crew-rung${step.held ? ' held' : ''}${step.current ? ' current' : ''}`}
            >
              <span className="crew-rung-mark" aria-hidden>
                {step.held ? '★' : '·'}
              </span>
              {step.label}
              {step.current ? <span className="crew-rung-you"> — you are here</span> : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="crew-panel">
        <h2 style={{ marginTop: 0 }}>Stamps</h2>
        {cracked.length === 0 ? (
          <p style={{ marginBottom: 0 }}>{VOICE.caseFileNoStamps}</p>
        ) : (
          <>
            <p>{countWord(cracked.length, 'case')} cracked. Once stamped, always stamped.</p>
            <ul className="crew-stamp-list">
              {cracked.map((summary) => (
                <li key={summary.caseId} className="crew-stamp-item">
                  <strong>{summary.title}</strong>
                  {summary.taughtBack ? ' 🎓' : ''}
                </li>
              ))}
            </ul>
          </>
        )}
        {working.length > 0 ? (
          <p className="crew-location-note">
            {countWord(working.length, 'case')} on the board right now.
          </p>
        ) : null}
      </section>

      <section className="crew-panel">
        <h2 style={{ marginTop: 0 }}>The vault</h2>
        {wordsCollected === 0 ? (
          <p style={{ marginBottom: 0 }}>{VOICE.caseFileNoWords}</p>
        ) : (
          <p style={{ marginBottom: 0 }}>
            {wordsCollected} words collected
            {wordsGilded > 0 ? `, ${wordsGilded} of them gilded` : ''}.{' '}
            <a href="/crew/vault">Open the vault</a>
          </p>
        )}
      </section>

      <section className="crew-panel">
        <h2 style={{ marginTop: 0 }}>The lantern</h2>
        <p style={{ marginBottom: 0 }}>
          <span className="crew-lantern" aria-hidden>
            🏮
          </span>{' '}
          {crew.streak.state === 'alive' ? VOICE.streakAlive : VOICE.streakRekindled}{' '}
          {crew.streak.weeks > 0 ? VOICE.caseFileWeeks(crew.streak.weeks) : VOICE.caseFileLanternNew}
        </p>
      </section>

      <p>
        <a className="crew-tap" href="/crew">
          ← Back to HQ
        </a>
      </p>
    </main>
  );
}
