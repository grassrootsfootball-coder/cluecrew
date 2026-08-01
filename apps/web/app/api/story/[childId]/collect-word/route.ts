import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logEvent, prisma } from '@cluecrew/db';
import { requireChildScope } from '@/lib/child-token';
import { storyEnabled } from '@/lib/story';

/**
 * Collect a seeded word from chapter prose into the Vault (Law 5). The one
 * write the story surface makes — a real Vault entry, same as a warm-up
 * collect; learning state is untouched.
 */
export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  if (!storyEnabled()) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

  const parsed = z
    .object({ wordId: z.string().min(1) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const word = await prisma.word.findFirst({
    where: { OR: [{ id: parsed.data.wordId }, { headword: parsed.data.wordId }] },
  });
  if (!word) return NextResponse.json({ error: 'word_not_found' }, { status: 404 });

  const existing = await prisma.wordVaultEntry.findUnique({
    where: { childId_wordId: { childId, wordId: word.id } },
  });
  if (!existing) {
    await prisma.wordVaultEntry.create({ data: { childId, wordId: word.id } });
    await logEvent({ name: 'word_collected', childId, props: { wordId: word.id, source: 'chapter' } });
  }
  return NextResponse.json({ ok: true });
}
