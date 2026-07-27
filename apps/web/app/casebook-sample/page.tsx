import { CHAPTERS } from '@/lib/casebook/chapters';
import { Plausible } from '@/components/plausible';

/** Free sample chapter — the lead magnet (§6). */
export default function CasebookSamplePage() {
  const chapter = CHAPTERS[0]!;
  return (
    <main className="cc-container">
      <Plausible />
      <p className="cc-muted">
        From the Parents&apos; Casebook — ten short chapters included with every ClueCrew plan.
      </p>
      <h1>{chapter.title}</h1>
      {chapter.paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      <div className="cc-card">
        <p style={{ marginTop: 0 }}>
          The other nine chapters — your region decoded, how scoring really works, supporting
          without pressuring, and what to do whatever the result — come with the free trial.
        </p>
        <a className="cc-button" href="/signup">
          Start the free 7-day trial — no card needed
        </a>
      </div>
    </main>
  );
}
