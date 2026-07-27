import { notFound } from 'next/navigation';
import { MODES, type Mode } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { childFromCookie } from '@/lib/crew/server';
import { SpeakButton } from '@/components/crew/speak-button';
import { StartLoopButton } from '@/components/crew/start-loop-button';

const MODE_LABELS: Record<Mode, string> = {
  watch: '🎬 Watch it',
  walk: '👣 Walk it',
  see: '👀 See it',
  hear: '🎧 Hear it',
  try: '🕵️ Try it',
};

/** Case open (§4.1): one panel + two sentences, skippable, then the Modes shelf. */
export default async function CaseIntroPage({ params }: { params: Promise<{ caseId: string }> }) {
  const child = (await childFromCookie())!;
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
        <h2 style={{ marginTop: 0 }}>How do you want to crack it?</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {MODES.map((mode) => (
            <span
              key={mode}
              className={`crew-tap${mode === (lastUsed ?? 'watch') ? ' selected' : ''}`}
              aria-hidden
            >
              {MODE_LABELS[mode]}
            </span>
          ))}
        </div>
        <p className="cc-muted">
          Pick any way in once the case starts — the choice is always yours.
        </p>
        <StartLoopButton childId={child.id} caseId={caseId} label="Open this case" />
      </section>

      <p>
        <a className="crew-tap" href="/crew/district">
          ← Back to the district
        </a>
      </p>
    </main>
  );
}
