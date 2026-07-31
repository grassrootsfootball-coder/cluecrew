import { prisma } from '@cluecrew/db';
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

  // The Crew is the family (manifesto §7 v1.1). Names and roles ONLY — no
  // progress, no ranks, nothing measurable, because crew-mates are never
  // compared. Nothing about billing or the account crosses into this app.
  const household = await prisma.parentAccount.findUnique({
    where: { id: child.parentId },
    select: {
      displayName: true,
      children: {
        where: { deletedAt: null, id: { not: child.id } },
        select: { id: true, crewName: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  const crewMates = household?.children.map((sibling) => sibling.crewName) ?? [];

  const cracked = crew.caseSummaries.filter((summary) => summary.status === 'cracked').length;
  const onTheBoard = crew.caseSummaries.filter((summary) => summary.status !== 'cracked').length;
  const firstVisit = crew.caseSummaries.length === 0;

  // A booked mock paper (Addendum B). The chip only appears when one exists —
  // mocks are the parent's to schedule, never HQ's to push (anti-cram, §3).
  const bookedPaper = await prisma.mockSitting.findFirst({
    where: { childId: child.id, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
    select: { id: true },
  });

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
            {/* role="img": aria-label on a generic span is prohibited and
                would be discarded, leaving the lantern silent (its emoji is
                aria-hidden). */}
            <span role="img" aria-label={`Streak lantern: ${crew.streak.state}`}>
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
        <p>
          <StartLoopButton childId={child.id} label={VOICE.hqStartShift} />
        </p>

        {bookedPaper ? (
          <p data-testid="booked-paper">
            {/* Addendum A's Boss Case intro row, as the invitation. */}
            <a className="crew-tap" href="/crew/mock">
              Big one today. Real exam rules: no tools, just you.
            </a>
          </p>
        ) : null}

        {/* Orientation lives here permanently, open on a first visit and
            folded away afterwards: a child arriving for the first time could
            not tell what a shift was, and there was nowhere to find out. */}
        <details className="crew-how" open={firstVisit}>
          <summary>{VOICE.howHeading}</summary>
          <ol className="crew-how-steps">
            {VOICE.howSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="crew-how-close">{VOICE.howClose}</p>
        </details>

        <details className="crew-how" open={firstVisit}>
          <summary>{VOICE.crewHeading}</summary>
          <ul className="crew-roster">
            <li>{VOICE.crewChild(child.crewName)}</li>
            {household?.displayName ? <li>{VOICE.crewParent(household.displayName)}</li> : null}
            {crewMates.length > 0 ? <li>{VOICE.crewMates(crewMates)}</li> : null}
            <li>{VOICE.crewPartner}</li>
          </ul>
        </details>
      </section>

      <section className="crew-panel">
        <h2 style={{ marginTop: 0 }}>The districts</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a className="crew-door" href="/crew/district">
            <span>VR District</span>
            <span className="door-sub">{countWord(cracked, 'case')} cracked</span>
            <span aria-hidden>🚪</span>
          </a>
          <a className="crew-door" href="/crew/casefile">
            <span>{VOICE.caseFileLink}</span>
            <span className="door-sub">{crew.rankLabel}</span>
            <span aria-hidden>🗂️</span>
          </a>
          {/* No aria-label on the locked doors: it is prohibited on a generic
              div, and it only duplicated the visible label inside, which is
              announced already. */}
          {[0, 1, 2].map((index) => (
            <div key={index} className="crew-door locked">
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
