'use client';

/**
 * The ONLY writer of mascot state (BUILD-PHASE-4 §7, gate #6 — a CI check
 * enforces that no other module calls setMascotState). Components subscribe
 * via useMascotState; engine outcomes drive transitions through
 * mascotEvent(). Keeping this single door means Phase 5's art swap is a file
 * replacement, not a refactor.
 */
import { useSyncExternalStore } from 'react';

export const MASCOT_STATES = [
  'idle',
  'curious',
  'thinking',
  'celebrating',
  'encouraging',
  'sleeping',
  'pointing',
  'proud',
] as const;

export type MascotState = (typeof MASCOT_STATES)[number];

let current: MascotState = 'idle';
const listeners = new Set<() => void>();

function setMascotState(state: MascotState): void {
  current = state;
  for (const listener of listeners) listener();
}

export type MascotEvent =
  | 'question_shown'
  | 'answer_correct'
  | 'answer_not_yet'
  | 'case_cracked'
  | 'teachback_shown'
  | 'wind_down'
  | 'hq_greeting'
  | 'browsing';

const EVENT_TO_STATE: Record<MascotEvent, MascotState> = {
  question_shown: 'thinking',
  answer_correct: 'celebrating',
  // Post-miss must be visibly distinct from celebrating but equally warm (§7).
  answer_not_yet: 'encouraging',
  case_cracked: 'proud',
  teachback_shown: 'pointing',
  wind_down: 'sleeping',
  hq_greeting: 'idle',
  browsing: 'curious',
};

export function mascotEvent(event: MascotEvent): void {
  setMascotState(EVENT_TO_STATE[event]);
}

/** Debug-panel only (gate #6). Guarded so production UI cannot reach it. */
export function debugSetMascotState(state: MascotState): void {
  if (process.env.NODE_ENV === 'production') return;
  setMascotState(state);
}

export function useMascotState(): MascotState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => current,
  );
}
