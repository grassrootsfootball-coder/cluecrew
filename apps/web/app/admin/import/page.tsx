import { bulkImportAction } from '@/lib/actions/admin-items';

/**
 * ONE MESSAGE PER REFUSAL (R1060). This page used to print "The payload did not validate" for every
 * error code, including a similarity rejection and a broken index, so the person importing was told
 * to fix the JSON when the JSON was fine.
 */
const MESSAGES: Record<string, string> = {
  invalid: 'The payload did not validate — check the JSON shape and authoredBy values.',
  solution: 'Blocked: a maths item’s solution expression does not produce its keyed option. Nothing was imported.',
  similarity: 'Blocked: the similarity gate matched an item too closely to the source corpus. Nothing was imported (Addendum E §3).',
  'similarity-index-unreadable':
    'Blocked: a similarity index is configured (SIMILARITY_INDEX_PATH) but cannot be read, so nothing could be screened and nothing was imported. Restore the file or correct the path. Unset it only if no index has landed.',
  'unapproved-misconception': 'Blocked: a misconception id in the batch is still PROPOSED. Approve it in the misconception queue first.',
  'retired-misconception': 'Blocked: a misconception id in the batch is RETIRED. Retag those options onto its successor.',
  'unknown-misconception': 'Blocked: a misconception id in the batch has no library row.',
};

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
      {error ? <p role="alert">{MESSAGES[error] ?? `Blocked (${error}). Nothing was imported.`}</p> : null}
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
