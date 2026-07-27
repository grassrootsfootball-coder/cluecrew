'use client';

/**
 * Sound system (BUILD-PHASE-5 §3) — the single door for audio, mirroring
 * mascotController. Cues map to files at /sounds/<cue>.mp3; missing files are
 * silent no-ops, so the commissioned set (8–12 authored cues, no generative
 * audio) drops in with zero code changes.
 *
 * Rules encoded here: mixed quiet (0.35 gain), correct rotates 3 gentle
 * variants to avoid fatigue, not-yet is soft and unmistakably non-punitive
 * (the file brief says so; this code just plays it), global mute is one tap
 * from anywhere and persists, sound never carries sole meaning (every cue
 * accompanies a visual beat, never replaces one).
 */

export const SOUND_CUES = [
  'warmup-begin',
  'correct-1',
  'correct-2',
  'correct-3',
  'not-yet',
  'case-cracked',
  'word-collected',
  'rank-up',
  'wind-down',
] as const;

export type SoundCue = (typeof SOUND_CUES)[number];

const VOLUME = 0.35;
const MUTE_KEY = 'crew-muted';

let enabledBySettings = true;
let correctRotation = 0;
const missing = new Set<string>();

export function configureSound(enabled: boolean): void {
  enabledBySettings = enabled;
}

export function isMuted(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(MUTE_KEY) === '1';
}

export function toggleMute(): boolean {
  const next = !isMuted();
  window.localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  return next;
}

export function playCue(cue: SoundCue | 'correct'): void {
  if (typeof window === 'undefined' || !enabledBySettings || isMuted()) return;
  const resolved: SoundCue =
    cue === 'correct'
      ? (['correct-1', 'correct-2', 'correct-3'] as const)[correctRotation++ % 3]!
      : cue;
  if (missing.has(resolved)) return;
  const audio = new Audio(`/sounds/${resolved}.mp3`);
  audio.volume = VOLUME;
  audio.play().catch(() => missing.add(resolved)); // absent file → silent no-op
}
