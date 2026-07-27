import { notFound } from 'next/navigation';
import { REGION_CAVEAT, UNKNOWN_REGION } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { visibleChapters } from '@/lib/casebook/chapters';

export default async function ChapterPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const parent = (await currentParent())!;
  const { chapterId } = await params;
  const chapter = visibleChapters(process.env.APP_ENV).find((candidate) => candidate.id === chapterId);
  if (!chapter) notFound();

  const region =
    chapter.dynamicBlock === 'region' && parent.regionCode && parent.regionCode !== 'unknown'
      ? await prisma.region.findUnique({ where: { id: parent.regionCode } })
      : null;

  return (
    <main className="cc-container">
      <p className="cc-muted">
        Chapter {chapter.number} · {chapter.minutes} min read
        {chapter.sensitive && process.env.APP_ENV !== 'production' ? ' · awaiting final approval' : ''}
      </p>
      <h1>{chapter.title}</h1>
      {chapter.paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}

      {chapter.dynamicBlock === 'region' ? (
        <div className="cc-card">
          {region ? (
            <>
              <h2 style={{ marginTop: 0 }}>{region.name}</h2>
              <p>{region.formatSummary}</p>
              <p>
                <strong>Typical test time:</strong> {region.typicalTestMonth}
                <br />
                <strong>Subjects tested:</strong> {region.subjects.join(', ')}
              </p>
              {region.notes ? <p>{region.notes}</p> : null}
              <p className="cc-muted">
                Source: <a href={region.sourceUrl}>{new URL(region.sourceUrl).hostname}</a> (checked{' '}
                {region.lastVerified.toLocaleDateString('en-GB')})
              </p>
            </>
          ) : (
            <>
              <h2 style={{ marginTop: 0 }}>{UNKNOWN_REGION.name}</h2>
              <p>{UNKNOWN_REGION.formatSummary}</p>
              <p className="cc-muted">
                Choose your area in <a href="/parent/children">Children</a> settings or re-run
                onboarding to see your region here.
              </p>
            </>
          )}
          <p className="cc-caveat">{REGION_CAVEAT}</p>
        </div>
      ) : null}

      <p>
        <a className="cc-button-quiet" href="/parent/casebook">
          ← All chapters
        </a>
      </p>
    </main>
  );
}
