import { notFound } from 'next/navigation';
import { prisma } from '@cluecrew/db';
import PlayEngine from './play-engine';

/**
 * CLOZE SURFACE — harness (R211). Three items across both vehicles, served through the SAME
 * renderer a child meets (cloze reuses word-web deliberately), so Annie's 375px read is of the
 * real surface: instruction split from the carrier at the stored separator, scope note between,
 * carrier styled like the error-spot sentence preview. Her read of this surface is what stands
 * between the Gap Yard opening and today.
 */
export default async function ClozeDebugPage() {
  if (process.env.APP_ENV === 'production') notFound();
  const items = await prisma.item.findMany({
    where: { id: { in: ['ENG-003-A-CZ-A1', 'ENG-003-A-CZ-B1', 'ENG-003-A-CZ-B5'] } },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '1rem' }}>
      <h1>Cloze surface — harness</h1>
      <p className="cc-muted">
        The stem instruction is split from the carrier at the stored separator; the carrier renders
        as its own block, never inline typography. Narrow the window to 375px.
      </p>
      {items.map((item) => (
        <section key={item.id} style={{ margin: '1.6rem 0' }}>
          <h2 style={{ fontSize: '1rem' }}>{item.id}</h2>
          <PlayEngine
            stem={item.stem as Record<string, unknown>}
            options={item.options.map((o) => ({ id: o.id, content: o.content }))}
          />
        </section>
      ))}
    </main>
  );
}
