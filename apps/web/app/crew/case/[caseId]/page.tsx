import { notFound } from 'next/navigation';
import { MODES, type Mode } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { childFromCookie } from '@/lib/crew/server';
import { SpeakButton } from '@/components/crew/speak-button';
import { StartLoopButton } from '@/components/crew/start-loop-button';
import { VOICE } from '@/lib/voice';

const MODE_ICONS: Record<Mode, string> = {
  watch: '🎬',
  walk: '👣',
  see: '👀',
  hear: '🎧',
  try: '🕵️',
};

/** Case open (§4.1): one panel + two sentences, skippable, then the Modes shelf. */
export default async function CaseIntroPage({ params }: { params: Promise<{ caseId: string }> }) {
  const child = await childFromCookie();
  // Pages render in parallel with the layout in the App Router, so the
  // layout's missing-child gate does NOT stop this body executing. Bail
  // quietly; CrewLayout owns the warm, in-world gate the child sees.
  if (!child) return null;
  const { caseId } = await params;
  const caseRow = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRow) notFound();

  const narrative = (caseRow.narrativeIntro as { text?: string }).text ?? '';
  const lastUsed = child.lastUsedMode as Mode | null;

  return (
    <main className="crew-stage">
      <h1>{caseRow.title}</h1>
      <section className="crew-panel" style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
        <p style={{ marginTop: 0, flex: 1 }}>{narrative}</p>
        <SpeakButton text={narrative} />
      </section>

      <section className="crew-panel">
        <h2 style={{ marginTop: 0 }}>{VOICE.modeShelfHeader}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {MODES.map((mode) => (
            <span
              key={mode}
              className={`crew-tap${mode === (lastUsed ?? 'watch') ? ' selected' : ''}`}
              aria-hidden
            >
              {MODE_ICONS[mode]} {VOICE.modeLabels[mode]}
            </span>
          ))}
        </div>
        <p className="cc-muted">Pick any way in once the case opens. Always your call.</p>
        <StartLoopButton childId={child.id} caseId={caseId} label="Open the case" />
      </section>

      <p>
        <a className="crew-tap" href="/crew/district">
          ← Back to the district
        </a>
      </p>
    </main>
  );
}
