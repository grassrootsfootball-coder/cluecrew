import { currentParent } from '@/lib/auth';
import { awaitingApproval, visibleChapters } from '@/lib/casebook/chapters';

export default async function CasebookPage() {
  await currentParent();
  const chapters = visibleChapters(process.env.APP_ENV);

  return (
    <main className="cc-container">
      <h1>The Parents&apos; Casebook</h1>
      <p className="cc-muted">
        The 11+ explained for busy parents — including anyone who did not grow up in the UK system.
        Each chapter is under five minutes.
      </p>
      <ol style={{ paddingLeft: '1.25rem' }}>
        {chapters.map((chapter) => (
          <li key={chapter.id} style={{ margin: '0.6rem 0' }}>
            <a href={`/parent/casebook/${chapter.id}`}>{chapter.title}</a>{' '}
            <span className="cc-muted">
              · {chapter.minutes} min read
              {awaitingApproval(chapter) ? ' · awaiting final approval' : ''}
            </span>
          </li>
        ))}
      </ol>
    </main>
  );
}
