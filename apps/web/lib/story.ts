/**
 * The story feature flag (STORY BIBLE v1.2 §9): all phase-1 story
 * infrastructure ships dark. S1 content flips it on when reviewed; it is
 * explicitly NOT a launch gate. One switch, read server-side only.
 */
export function storyEnabled(): boolean {
  return process.env.STORY_MODE === 'on';
}
