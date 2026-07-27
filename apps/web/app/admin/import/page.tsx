import { bulkImportAction } from '@/lib/actions/admin-items';

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="cc-container">
      <h1>Bulk import</h1>
      <p className="cc-muted">
        Paste a JSON array of items. Everything lands as DRAFT with provenance preserved —{' '}
        <code>ai-draft:&lt;model&gt;</code> imports can never skip human review (§5).
      </p>
      {error ? (
        <p role="alert">The payload did not validate — check the JSON shape and authoredBy values.</p>
      ) : null}
      <form className="cc-form" action={bulkImportAction} style={{ maxWidth: 720 }}>
        <label>
          Items JSON
          <textarea
            name="payload"
            rows={16}
            required
            defaultValue={JSON.stringify(
              [
                {
                  questionTypeId: 'vr-11-number-series',
                  difficultyTier: 2,
                  authoredBy: 'ai-draft:example-model',
                  stem: { prompt: 'What number comes next?', series: [2, 4, 6, 8] },
                  explanation: {},
                  options: [
                    { content: { value: 10 }, isCorrect: true, misconceptionId: null },
                    { content: { value: 9 }, isCorrect: false, misconceptionId: 'vr-series-off-by-one' },
                  ],
                },
              ],
              null,
              2,
            )}
          />
        </label>
        <button className="cc-button" type="submit">
          Import as DRAFT
        </button>
      </form>
    </main>
  );
}
