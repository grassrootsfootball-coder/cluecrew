'use client';

/**
 * The dialogue choice (STORY BIBLE §9): 2–3 options, all in-voice, colouring
 * the scene only. COSMETIC STATE ONLY, structurally: the selection lives in
 * localStorage on this device and this component contains no fetch — there
 * is nothing here that CAN write to learning state.
 */
import { useEffect, useState } from 'react';

export function DialogueChoice({
  choiceId,
  prompt,
  options,
}: {
  choiceId: string;
  prompt: string;
  options: string[];
}) {
  const storageKey = `crew-story-choice-${choiceId}`;
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    setChosen(window.localStorage.getItem(storageKey));
  }, [storageKey]);

  function choose(option: string) {
    window.localStorage.setItem(storageKey, option);
    setChosen(option);
  }

  return (
    <div className="crew-story-choice" role="group" aria-label="What do you do?">
      <p className="crew-story-choice-prompt">{prompt}</p>
      {chosen ? (
        <p className="crew-story-choice-made">
          <em>You: &ldquo;{chosen}&rdquo;</em>
        </p>
      ) : (
        <div className="crew-story-choice-options">
          {options.map((option) => (
            <button key={option} type="button" className="crew-tap" onClick={() => choose(option)}>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
