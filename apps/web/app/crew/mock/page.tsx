import { childFromCookie } from '@/lib/crew/server';
import { MockRunner } from '@/components/crew/mock-runner';
import { boardVoice } from '@/lib/crew/board-names';
import { storyEnabled } from '@/lib/story';

/**
 * The mock sitting screen (ADDENDUM-B §3). Deliberately bare: no mascot, no
 * rail, no district theme — full-screen Plain mode is the whole design (P4).
 */
export default async function MockPage() {
  const child = await childFromCookie();
  if (!child) return null; // the crew layout owns the signed-out view
  return <MockRunner childId={child.id} board={boardVoice(storyEnabled())} />;
}
