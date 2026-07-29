import { childFromCookie } from '@/lib/crew/server';
import { PlayRunner } from '@/components/crew/play-runner';

export default async function PlayPage() {
  const child = await childFromCookie();
  // Pages render in parallel with the layout in the App Router, so the
  // layout's missing-child gate does NOT stop this body executing. Bail
  // quietly; CrewLayout owns the warm, in-world gate the child sees.
  if (!child) return null;
  return <PlayRunner childId={child.id} />;
}
