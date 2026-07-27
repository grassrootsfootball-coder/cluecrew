/**
 * Teach-Back engine (BUILD-PHASE-3 §6, manifesto §7): the child corrects the
 * mascot's authored mistake. All content comes from the Misconception table;
 * the engine never generates text (S3). Evaluation is deterministic — both
 * answers are picks from authored options, never free text.
 */
import { z } from 'zod';

export const teachbackContentSchema = z
  .object({
    /** The mascot's authored working, step by step. */
    working: z.array(z.string().min(1).max(200)).min(2).max(6),
    /** Index of the step containing the slip. */
    wrongStepIndex: z.number().int().min(0),
    /** Authored correction options; exactly one is correct. */
    corrections: z
      .array(z.object({ text: z.string().min(1).max(200), correct: z.boolean() }))
      .min(2)
      .max(4),
  })
  .superRefine((value, ctx) => {
    if (value.wrongStepIndex >= value.working.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'wrongStepIndex out of range' });
    }
    if (value.corrections.filter((correction) => correction.correct).length !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'exactly one correction must be correct' });
    }
  });

export type TeachbackContent = z.infer<typeof teachbackContentSchema>;

export interface TeachbackTriggerInputs {
  /** Case just crossed the cracked threshold this session. */
  justCracked: boolean;
  /** A review succeeded on a previously lapsed unit. */
  reviewSuccessAfterLapse: boolean;
  /** Already earned the taughtBack badge for this case. */
  alreadyTaughtBack: boolean;
  /** Authored teach-back content exists for a misconception of this type. */
  contentAvailable: boolean;
}

export function shouldTriggerTeachback(inputs: TeachbackTriggerInputs): boolean {
  if (inputs.alreadyTaughtBack || !inputs.contentAvailable) return false;
  return inputs.justCracked || inputs.reviewSuccessAfterLapse;
}

export interface TeachbackAnswer {
  chosenStepIndex: number;
  chosenCorrectionIndex: number;
}

export interface TeachbackResult {
  stepCorrect: boolean;
  correctionCorrect: boolean;
  /** Both parts right ⇒ taughtBack badge + small mastery bump. */
  success: boolean;
}

export function evaluateTeachback(content: TeachbackContent, answer: TeachbackAnswer): TeachbackResult {
  const stepCorrect = answer.chosenStepIndex === content.wrongStepIndex;
  const correctionCorrect = content.corrections[answer.chosenCorrectionIndex]?.correct === true;
  return { stepCorrect, correctionCorrect, success: stepCorrect && correctionCorrect };
}
