/**
 * THE LOCATOR: DOES A HINT'S OWN QUOTED PHRASE POINT AT THE SENTENCE HOLDING THE KEY?
 * (Annie, 2026-08-22 — R574.)
 *
 * **SHE SPLIT THIS OUT OF "COACHING", AND THE SPLIT IS WHY IT IS BUILDABLE.** "Coaching" names an
 * OUTCOME — the child is handed the answer — and two unrelated mechanisms produce it:
 *
 *   SHAPE A  RESTATEMENT.  The hint says the key again in other words.
 *            `WIW-05`: *"The words keep going and going. So does the climb."*
 *            key: *"To show the climb went on and on and was hard work."*
 *   SHAPE B  THE LOCATOR.  The hint quotes a phrase; the phrase locates a sentence; the key is in it.
 *            `WIW-12`: quotes *'never in his life'* -> *"Never in his life had he seen a river
 *            before…"*, and the key is *"A river."*
 *
 * **A RESTATEMENT AND A POINTER HAVE NOTHING IN COMMON EXCEPT THEIR EFFECT**, so one word over both
 * is why she would have refused the whole check. Shape B is a LOOKUP at every step — resolve the
 * span, take the sentence, test for the key — and every input is stored. **Shape A is a reading and
 * stays reader-only.**
 *
 * **THE EARLIER CONTAINMENT ROUTE IS RETIRED, and it is worth saying why rather than deleting it.**
 * It scored `WIW-05` at 0.20 on the shared word `climb` — but `climb` is the TOPIC, not the answer,
 * so it fired on a word the hint could not avoid using. It found a real fault by a mechanism that
 * was not the fault's mechanism. That is the R173 shape: **the right answer for the wrong reason**,
 * and keeping it would have made the restatement band look covered.
 *
 * **THE BOUND TRAVELS AS A COUNT, NOT A CAVEAT (her instruction).** This is findable where the hint
 * QUOTES and unfindable where it DESCRIBES, so **the population is hints containing a quoted
 * string** — printed beside the result on every run, never after somebody asks.
 *
 * Every row is a CANDIDATE. Whether a hint gives its key away is her judgement, not this file's (R94).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chooseHint } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { declareMayBeEmpty, requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO, 'content/passages');

const STOP = new Set(
  ('a an the and or but of in on at to for from with is are was were be been being it its this that these'
  + ' those what which who whom how why when where do does did not no so as if then than you your yours he'
  + ' she they them his her their there here one two more most just also very can could would should will'
  + ' about into out up down over under again still had has have').split(' '),
);
const contentWords = (s: string) => [...new Set(
  s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)),
)];

/**
 * **QUOTED SPANS ONLY — this is the population boundary, not an implementation detail.** An earlier
 * version also tried every 3-gram of the hint, which quietly widened the population past the one she
 * bounded and would have made "unfindable where it describes" untrue on the face of the run.
 */
const quotedSpans = (hint: string): string[] =>
  [...hint.matchAll(/['‘"“]([^'’"”]{4,})['’"”]/g)].map((m) => (m[1] ?? '').trim()).filter(Boolean);

/** The sentence of `text` containing `at`. Sentences end on . ! ? or a line break. */
function sentenceAround(text: string, at: number): string {
  const before = Math.max(...['.', '!', '?', '\n'].map((c) => text.lastIndexOf(c, Math.max(0, at - 1))));
  const afters = ['.', '!', '?', '\n'].map((c) => text.indexOf(c, at)).filter((i) => i !== -1);
  return text.slice(before + 1, afters.length ? Math.min(...afters) + 1 : text.length).trim();
}

function passages(): Map<string, string> {
  const out = new Map<string, string>();
  for (const f of readdirSync(PASSAGES).filter((n) => n.endsWith('.json'))) {
    const p = JSON.parse(readFileSync(join(PASSAGES, f), 'utf8')) as { id?: string; extract?: unknown };
    if (typeof p.id === 'string' && typeof p.extract === 'string') out.set(p.id, p.extract);
  }
  return out;
}

async function main() {
  const texts = passages();
  const items = await prisma.item.findMany({ where: { status: 'LIVE' }, include: { options: { orderBy: { id: 'asc' } } } });
  const withHint = items.filter((i) => {
    const h = (i.explanation as { hintCore?: unknown } | null)?.hintCore;
    return typeof h === 'string' && h.trim() !== '' && chooseHint(i.explanation as never).serves === 'library';
  });

  const hintOf = (i: typeof withHint[number]) => String((i.explanation as { hintCore: string }).hintCore);
  const quoting = withHint.filter((i) => quotedSpans(hintOf(i)).length > 0);
  const describing = withHint.filter((i) => quotedSpans(hintOf(i)).length === 0);

  requirePopulation('check:hint-locator', {
    'LIVE item(s) carrying an unserved hint': withHint.length,
    'of those, hint(s) containing a quoted string — THE POPULATION': quoting.length,
    'passage file(s) with an extract': texts.size,
  });

  const candidates: string[] = [];
  const unresolved: string[] = [];
  let noPassage = 0;

  for (const i of quoting.sort((a, b) => a.id.localeCompare(b.id))) {
    const hint = hintOf(i);
    const key = String(((i.options.find((o) => o.isCorrect)?.content ?? {}) as { value?: unknown }).value ?? '');
    const kw = contentWords(key);
    const ref = (i.stem as { passageRef?: unknown }).passageRef;
    const text = typeof ref === 'string' ? texts.get(ref) : undefined;
    if (!text) { noPassage++; continue; }

    let landed = false;
    for (const span of quotedSpans(hint)) {
      const at = text.toLowerCase().indexOf(span.toLowerCase());
      if (at === -1) { unresolved.push(`      ${i.id}: quoted "${span}" is not in ${String(ref)}`); continue; }
      landed = true;
      const sentence = sentenceAround(text, at);
      const sw = contentWords(sentence);
      const shared = kw.filter((w) => sw.includes(w));
      if (shared.length > 0 && shared.length / Math.max(1, kw.length) >= 0.5) {
        candidates.push(
          `  CANDIDATE  ${i.id}\n      quoted span : "${span}"\n      resolves to : ${sentence}`
          + `\n      key in it   : ${shared.join(', ')}\n      hint: ${hint}\n      key : ${key}`,
        );
      }
    }
    if (!landed) { /* every span unresolved; already reported above */ }
  }

  declareMayBeEmpty('check:hint-locator', 'candidate locator hint(s)', candidates.length,
    'A bank whose hints quote the passage without quoting near the answer would legitimately produce '
    + `none. ${quoting.length} quoting hint(s) WERE screened, and that count is printed below, so zero `
    + 'candidates can never be read as zero hints checked.');

  console.log(`\n${candidates.length} CANDIDATE(S) — each a row worth her reading, never a verdict.\n`);
  for (const c of candidates) console.log(`${c}\n`);
  console.log(
    '  THE BOUND, AS A COUNT:\n'
    + `      ${quoting.length} hint(s) contain a quoted string   — FINDABLE, and this is the population.\n`
    + `      ${describing.length} hint(s) point by DESCRIBING       — UNFINDABLE. Matching a description to a\n`
    + '                                        moment is a reading, not a lookup, and nothing here\n'
    + '                                        attempts it.\n'
    + `      ${noPassage} quoting hint(s) sit on an item whose passage this cannot read.\n`
    + `      ${unresolved.length} quoted span(s) did not resolve in their own passage:\n`
    + (unresolved.join('\n') || '      (none)')
    + '\n\n  SHAPE A — RESTATEMENT — IS NOT SCREENED HERE AND IS NOT CLAIMED. A hint that says the key\n'
    + '  again in other words shares no mechanism with a pointer, only an effect, and the effect is\n'
    + '  what the word "coaching" names. It stays a reading.',
  );
  await prisma.$disconnect();
}

void main();
