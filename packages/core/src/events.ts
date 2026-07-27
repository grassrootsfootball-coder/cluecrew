/**
 * Canonical analytics event names (BUILD-PHASE-1 §6).
 * Every feature must emit from this vocabulary or extend it via PR to this file.
 * Events NEVER contain free text a child wrote, item content, or anything
 * beyond IDs and enums. This table is the future evidence base for any
 * success-rate claim (manifesto L1) — completeness of instrumentation is
 * launch-critical.
 */
export const EVENT_NAMES = [
  'session_started',
  'session_ended',
  'case_opened',
  'mode_selected',
  'attempt_submitted',
  'case_cracked',
  'word_collected',
  'rank_up',
  'warmup_completed',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export function isEventName(name: string): name is EventName {
  return (EVENT_NAMES as readonly string[]).includes(name);
}

/** Props must be IDs and enums only — no free text, no item content. */
export type EventProps = Record<string, string | number | boolean | null>;

export interface AnalyticsEvent {
  name: EventName;
  childId?: string;
  parentId?: string;
  props: EventProps;
}

export function assertEvent(event: AnalyticsEvent): AnalyticsEvent {
  if (!isEventName(event.name)) {
    throw new Error(`Unknown event name: ${event.name} — extend packages/core/src/events.ts via PR`);
  }
  for (const [key, value] of Object.entries(event.props)) {
    if (typeof value === 'string' && value.length > 128) {
      throw new Error(`Event prop "${key}" looks like free text; events carry IDs and enums only`);
    }
  }
  return event;
}
