import { notFound } from 'next/navigation';
import { FAMILY_BY_TYPE, railAvailable } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import HintSurface from './hint-surface';

/**
 * VR ITEM MID-HINT — the surface question (Annie's seventh return, 2026-08-19).
 *
 * Six of the 23 held hints instruct a physical act or name a tool. Nothing in the data shows
 * whether the child's screen offers either; only the screen does. This renders the REAL engine
 * with the REAL rail and the REAL not-yet panel, so what is on the card is what a child meets.
 *
 * **NO REVIEW FURNITURE INSIDE THE CARD FRAME** (the N-badge lesson, and the orange-banner lesson
 * after it). The page heading sits outside the element the render captures; which item is which
 * goes in the FILENAME, not on the card. A reviewer should never have to work out which parts of
 * a screenshot are real.
 */
export default async function VrHintDebugPage() {
  if (process.env.APP_ENV === 'production') notFound();

  // One item per family under test: vr-07 (code — rail available) and vr-14 (bridge — no rail).
  const items = await prisma.item.findMany({
    where: { questionTypeId: { in: ['vr-07-letters-for-numbers', 'vr-14-letter-connections'] }, status: 'LIVE' },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });
  const pick = ['vr-07-letters-for-numbers', 'vr-14-letter-connections']
    .map((t) => items.find((i) => i.questionTypeId === t))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  // The hint a child actually meets on a wrong answer, read from the library.
  const hints = new Map<string, string>();
  for (const it of pick) {
    const tagged = it.options.find((o) => o.misconceptionId);
    if (!tagged?.misconceptionId) continue;
    const m = await prisma.misconception.findUnique({
      where: { id: tagged.misconceptionId }, select: { childHint: true },
    });
    if (m?.childHint) hints.set(it.id, m.childHint);
  }

  return (
    <main className="crew-stage" style={{ maxWidth: 640, margin: '0 auto', padding: '1rem' }}>
      <h1>VR item mid-hint</h1>
      {pick.map((item) => (
        <section key={item.id} style={{ margin: '1.5rem 0' }}>
          <p className="cc-muted" style={{ fontSize: '0.85rem' }}>{item.id} · {item.questionTypeId}</p>
          <HintSurface
            captureId={item.id}
            stem={item.stem as Record<string, unknown>}
            family={(FAMILY_BY_TYPE as Record<string, string>)[item.questionTypeId] ?? 'wordweb'}
            rail={railAvailable(
              ((FAMILY_BY_TYPE as Record<string, string>)[item.questionTypeId] ?? 'wordweb') as never,
              item.questionTypeId,
            ) ? 'stage' : 'none'}
            options={item.options.map((o) => ({ id: o.id, content: o.content }))}
            hint={hints.get(item.id) ?? '(no hint tagged)'}
          />
        </section>
      ))}
    </main>
  );
}
