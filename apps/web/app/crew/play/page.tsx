import { childFromCookie } from '@/lib/crew/server';
import { PlayRunner } from '@/components/crew/play-runner';

export default async function PlayPage() {
  const child = (await childFromCookie())!;
  return <PlayRunner childId={child.id} />;
}
