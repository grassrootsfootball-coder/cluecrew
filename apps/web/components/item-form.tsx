import type { ItemOption, QuestionType } from '@cluecrew/db';

/**
 * Pragmatic Phase 2 item editor: structured JSON textareas validated
 * server-side. A friendlier per-mechanic editor arrives with content
 * authoring at scale.
 */
export function ItemFormFields({
  questionTypes,
  defaults,
}: {
  questionTypes: QuestionType[];
  defaults?: {
    questionTypeId: string;
    difficultyTier: number;
    stem: unknown;
    explanation: unknown;
    options: Array<Pick<ItemOption, 'content' | 'isCorrect' | 'misconceptionId'>>;
  };
}) {
  return (
    <>
      <label>
        Question type
        <select name="questionTypeId" required defaultValue={defaults?.questionTypeId ?? ''}>
          <option value="" disabled>
            Choose…
          </option>
          {questionTypes.map((questionType) => (
            <option key={questionType.id} value={questionType.id}>
              {questionType.id} — {questionType.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Difficulty tier (1–5, authored estimate)
        <input
          name="difficultyTier"
          type="number"
          min={1}
          max={5}
          required
          defaultValue={defaults?.difficultyTier ?? 3}
        />
      </label>
      <label>
        Stem (JSON — structured content, never HTML)
        <textarea
          name="stem"
          rows={4}
          required
          defaultValue={JSON.stringify(defaults?.stem ?? { prompt: '' }, null, 2)}
        />
      </label>
      <label>
        Options (JSON array; every incorrect option needs a misconceptionId before LIVE)
        <textarea
          name="options"
          rows={10}
          required
          defaultValue={JSON.stringify(
            defaults?.options.map((option) => ({
              content: option.content,
              isCorrect: option.isCorrect,
              misconceptionId: option.misconceptionId,
            })) ?? [
              { content: { value: '' }, isCorrect: true, misconceptionId: null },
              { content: { value: '' }, isCorrect: false, misconceptionId: '' },
            ],
            null,
            2,
          )}
        />
      </label>
      <label>
        Explanation asset refs (JSON, per-mode)
        <textarea
          name="explanation"
          rows={3}
          defaultValue={JSON.stringify(defaults?.explanation ?? {}, null, 2)}
        />
      </label>
    </>
  );
}
