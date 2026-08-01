import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';
import { requireChildScope } from '@/lib/child-token';
import { shuffleOptionsForChild } from '@/lib/crew/shuffle';
import { storyEnabled } from '@/lib/story';

/**
 * The clue-tap payload (scoped task 2): a LIVE item rendered in a no-stakes
 * frame. Grading is local to the reader — including the correct id here is
 * deliberate; nothing about this beat is assessment, and no attempt is ever
 * recorded from it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ childId: string; itemId: string }> },
) {
  if (!storyEnabled()) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { childId, itemId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

  const item = await prisma.item.findUnique({ where: { id: itemId }, include: { options: true } });
  if (!item || item.status !== 'LIVE') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const options = shuffleOptionsForChild(item.options, childId, item.id);
  const correct = options.find((option) => option.isCorrect);
  return NextResponse.json({
    stem: item.stem,
    options: options.map((option) => ({
      id: option.id,
      label:
        typeof option.content === 'object' && option.content !== null && 'value' in option.content
          ? String((option.content as { value: unknown }).value)
          : String(option.content),
    })),
    correctOptionId: correct?.id ?? '',
  });
}
