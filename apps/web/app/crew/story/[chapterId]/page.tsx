import { notFound } from 'next/navigation';
import { prisma } from '@cluecrew/db';
import { DialogueChoice } from '@/components/crew/story/dialogue-choice';
import { ClueTap } from '@/components/crew/story/clue-tap';
import { WordTap } from '@/components/crew/story/word-tap';
import { chapterById, readable } from '@/lib/crew/chapters';
import { childFromCookie } from '@/lib/crew/server';
import { storyEnabled } from '@/lib/story';

/**
 * The Chapter Reader (STORY BIBLE v1.2 §9): a calm reading surface — the
 * book the child is in. Opt-in, replayable, never gating practice (Law 3);
 * audio playback when the chapter carries it (Law 4); seeded words tappable
 * (Law 5). Dyslexia and reduced-motion settings arrive through the crew
 * layout exactly as everywhere else. Flag off → this page does not exist.
 */
export default async function ChapterReaderPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  if (!storyEnabled()) notFound();
  const child = await childFromCookie();
  if (!child) return null; // the crew layout owns the warm gate

  const { chapterId } = await params;
  const chapter = chapterById(chapterId);
  if (!chapter || !readable(chapter)) notFound();

  // Resolve seeded words once, server-side.
  const words = await prisma.word.findMany({
    where: {
      status: 'LIVE',
      OR: chapter.seededWordIds.flatMap((wordId) => [{ id: wordId }, { headword: wordId }]),
    },
    select: { id: true, headword: true, definitionChild: true },
  });
  const wordByHead = new Map(words.map((word) => [word.headword.toLowerCase(), word]));

  // Body: paragraphs, [[word]] → WordTap where the word resolves.
  const paragraphs = chapter.body.split(/\n\n+/);

  return (
    <main className="crew-stage crew-story">
      <p className="crew-story-kicker">The story so far · {chapter.season.toUpperCase()}</p>
      <h1>{chapter.title}</h1>
      {chapter.spotImage ? (
        <img className="crew-story-spot" src={chapter.spotImage} alt="" />
      ) : (
        <div className="crew-story-spot placeholder" aria-hidden>
          ☂
        </div>
      )}
      {chapter.audioRef ? (
        // Law 4: pre-generated narration, cached by the service worker.
        <audio className="crew-story-audio" controls preload="none" src={chapter.audioRef} />
      ) : null}

      <div className="crew-story-body">
        {paragraphs.map((paragraph, index) => {
          const parts = paragraph.split(/(\[\[[^\]]+\]\])/);
          return (
            <p key={index}>
              {parts.map((part, partIndex) => {
                const marked = /^\[\[([^\]]+)\]\]$/.exec(part);
                if (!marked) return <span key={partIndex}>{part}</span>;
                const word = wordByHead.get(marked[1]!.toLowerCase());
                return word ? (
                  <WordTap key={partIndex} childId={child.id} word={word} />
                ) : (
                  <span key={partIndex}>{marked[1]}</span>
                );
              })}
            </p>
          );
        })}
      </div>

      {chapter.clueTap ? (
        <ClueTap childId={child.id} itemId={chapter.clueTap.itemId} prompt={chapter.clueTap.prompt} />
      ) : null}

      {chapter.choice ? (
        <DialogueChoice
          choiceId={chapter.choice.id}
          prompt={chapter.choice.prompt}
          options={chapter.choice.options}
        />
      ) : null}

      <p>
        <a className="crew-tap" href="/crew/casefile">
          ← Back to the case file
        </a>
      </p>
    </main>
  );
}
