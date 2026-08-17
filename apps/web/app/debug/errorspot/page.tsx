/**
 * ERROR-SPOT SURFACE — harness. Dev and staging only; 404 in production.
 *
 * The segment boundary is the whole design and cannot be settled by a spec: invisible and the child
 * cannot choose deliberately, loud and the sentence stops reading as a sentence. This renders the
 * real component against real stored items so it can be looked at, at 375px.
 */
import { notFound } from 'next/navigation';
import { prisma } from '@cluecrew/db';
import { ErrorSpotHarness } from './harness';
import '../../crew/crew.css';

export const dynamic = 'force-dynamic';

export default async function ErrorSpotDebugPage() {
  if (process.env.APP_ENV === 'production') notFound();

  const items = await prisma.item.findMany({
    where: { questionTypeId: { in: ['en-spag-punct-spot', 'en-spag-spelling-spot'] } },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
    take: 4,
  });

  return (
    <main className="cc-container crew-app">
      <h1>Error-spot surface — harness</h1>
      <p className="cc-muted">
        The options ARE the sentence, in order, plus N. Segments flow as prose and are independently
        tappable; 48px is met by the line box rather than by padding. Narrow the window to 375px.
      </p>
      <hr />
      {items.map((item) => (
        <section key={item.id} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem' }}>{item.id}</h2>
          <ErrorSpotHarness
            stem={item.stem as Record<string, unknown>}
            options={item.options.map((o) => ({ id: o.id, content: o.content }))}
          />
        </section>
      ))}
    </main>
  );
}
