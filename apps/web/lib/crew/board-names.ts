/**
 * The Detective's Board rename layer (STORY BIBLE §6, feature-flagged):
 * naming is SKIN ONLY — code vocabulary (bossCase, mock, sitting) is
 * unchanged everywhere. Two locks restated: framing wraps the before and
 * after, never the paper; and nothing here can see a score, so nothing here
 * can vary by one.
 */
export interface BoardVoice {
  /** HQ chip + sitting intro, replacing the plain "Big one today" line. */
  hallLine: string;
  /** The identical completion beat, regardless of score (Law 2). */
  completionLine: string;
  /** Appended to the kind abandon copy. */
  rescheduleLine: string;
  examName: string;
  preliminaryName: string;
}

export function boardVoice(storyOn: boolean): BoardVoice | null {
  if (!storyOn) return null;
  return {
    hallLine: 'No tools in here, Detective. Just you — which is plenty.',
    completionLine: 'The Board has your paper. However it went, you sat it like a detective.',
    rescheduleLine: 'The Board reschedules all the time. So do we.',
    examName: "the Detective's Board Exam",
    preliminaryName: "the Board's Preliminary",
  };
}
