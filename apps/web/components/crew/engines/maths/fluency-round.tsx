'use client';

/**
 * The warm-up fluency round (BUILD-DISTRICT-MATHS §6): 8 quick facts on the
 * number pad. Progress is a filling row of beads — questions answered, never
 * seconds counted. A missed fact simply shows the fact (the teaching is the
 * schedule's job, not this thread's); nothing here can end a streak.
 */
import { useState } from 'react';
import type { FluencyQuestion } from '@/lib/crew/fluency';
import { NumberPad } from './number-pad';

export function FluencyRound({
  questions,
  onDone,
}: {
  questions: FluencyQuestion[];
  onDone: (correct: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [beat, setBeat] = useState<string | null>(null);

  const question = questions[index];
  if (!question) return null;

  function commit(value: number) {
    const right = value === question!.answer;
    setBeat(right ? 'Locked in.' : `${question!.prompt} makes ${question!.answer}.`);
    const nextCorrect = right ? correct + 1 : correct;
    setCorrect(nextCorrect);
    setTimeout(() => {
      setBeat(null);
      if (index + 1 >= questions.length) onDone(nextCorrect);
      else setIndex(index + 1);
    }, right ? 350 : 1400);
  }

  return (
    <div className="crew-fluency">
      <div className="crew-fluency-beads" aria-label={`${index} of ${questions.length} done`}>
        {questions.map((_, beadIndex) => (
          <span key={beadIndex} className={`crew-bead${beadIndex < index ? ' filled' : ''}`} aria-hidden />
        ))}
      </div>
      <p className="crew-fluency-prompt">{question.prompt}</p>
      {beat ? (
        <p role="status" className="crew-fluency-beat">
          {beat}
        </p>
      ) : (
        <NumberPad label="Your answer" onCommit={commit} />
      )}
    </div>
  );
}
