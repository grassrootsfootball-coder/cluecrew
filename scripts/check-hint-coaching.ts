/**
 * CANDIDATE COACHING: DOES AN ITEM HINT GIVE ITS OWN KEY AWAY? (Annie, 2026-08-22 — R571.)
 *
 * **This is the question an ITEM hint takes, and only an item hint can fail it.** A library hint is
 * written against a misconception and does not know which item it will land on, so it cannot point
 * at the sentence that settles one. An item hint is written by somebody looking at a single item —
 * **and the sentence that settles that item is the sentence that contains the answer.** The fault is
 * structural, not careless.
 *
 * **TWO ROUTES, AND THEY CATCH DIFFERENT FAULTS. Neither alone would have found both known cases.**
 *
 *   CONTAINMENT       the hint reuses the key's own content words.
 *                     `WIW-05` — hint *"…So does the climb."*, key *"…the climb went on and on…"*.
 *   ANCHORED POINTING the hint quotes or reproduces a phrase from the passage; that phrase locates a
 *                     sentence; and the KEY's content is in that sentence.
 *                     `WIW-12` — hint quotes *'never in his life'*, which lands on *"Never in his
 *                     life had he seen a river before…"*, and the key is *"A river."*
 *
 * **`WIW-12` SHARES NOT ONE CONTENT WORD WITH ITS KEY.** Containment scores it 0.00 — it is
 * invisible to the obvious check, and it is the clearer of the two faults. A single-route detector
 * would have reported one of the two and looked like it worked.
 *
 * **WHAT THIS CANNOT REACH, AND SHE HAS RULED IT UNREACHABLE BEFORE.** A hint that points by
 * DESCRIBING rather than quoting — *"Read the sentence that comes just before he throws the brush
 * down"* — carries no locatable anchor. Matching a description to a sentence is a reading, not a
 * lookup, and this makes no attempt at it. That band is COUNTED AND NAMED on every run so its size
 * is never mistaken for zero.
 *
 * **EVERY OUTPUT IS A CANDIDATE, NEVER A VERDICT (R94).** The judgement of whether a hint gives the
 * key away is hers. This finds rows worth her looking at and marks WHY each one is there (R569).
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

/** Quoted spans first — she quotes with straight or curly marks — then any literal 3-gram. */
function anchors(hint: string): string[] {
  const quoted = [...hint.matchAll(/['‘"“]([^'’"”]{6,})['’"”]/g)].map((m) => m[1].trim());
  const words = hint.replace(/[^A-Za-z' ]/g, ' ').split(/\s+/).filter(Boolean);
  const grams: string[] = [];
  for (let n = Math.min(6, words.length); n >= 3; n--) {
    for (let i = 0; i + n <= words.length; i++) grams.push(words.slice(i, i + n).join(' '));
  }
  return [...new Set([...quoted, ...grams])];
}

/** The sentence of `text` containing `at`. Sentences end on . ! ? or a line break. */
function sentenceAround(text: string, at: number): string {
  const before = Math.max(
    ...['.', '!', '?', '\n'].map((c) => text.lastIndexOf(c, Math.max(0, at - 1))),
  );
  const afters = ['.', '!', '?', '\n'].map((c) => text.indexOf(c, at)).filter((i) => i !== -1);
  const end = afters.length ? Math.min(...afters) : text.length;
  return text.slice(before + 1, end + 1).trim();
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
  const items = await prisma.item.findMany({ where: { status: 'LIVE' }, include: { options: true } });
  const rows = items.filter((i) => {
    const h = (i.explanation as { hintCore?: unknown } | null)?.hintCore;
    return typeof h === 'string' && h.trim() !== '' && chooseHint(i.explanation as never).serves === 'library';
  });

  requirePopulation('check:hint-coaching', {
    'LIVE item(s)': items.length,
    'carrying an unserved item hint': rows.length,
    'passage file(s) with an extract': texts.size,
  });

  const containment: string[] = [];
  const pointing: string[] = [];
  const noAnchor: string[] = [];
  let withPassage = 0;

  for (const i of rows.sort((a, b) => a.id.localeCompare(b.id))) {
    const hint = String((i.explanation as { hintCore: string }).hintCore);
    const key = String(((i.options.find((o) => o.isCorrect)?.content ?? {}) as { value?: unknown }).value ?? '');
    const kw = contentWords(key);
    const hw = contentWords(hint);

    const shared = kw.filter((w) => hw.includes(w));
    const frac = kw.length ? shared.length / kw.length : 0;
    if (shared.length > 0) {
      containment.push(`  CONTAINMENT  ${i.id}  ${frac.toFixed(2)} of the key's content words are in the hint`
        + `\n      matched: ${shared.join(', ')}\n      hint: ${hint}\n      key : ${key}`);
    }

    const ref = (i.stem as { passageRef?: unknown }).passageRef;
    const text = typeof ref === 'string' ? texts.get(ref) : undefined;
    if (!text) continue;
    withPassage++;

    let hit: { anchor: string; sentence: string; shared: string[] } | null = null;
    for (const a of anchors(hint)) {
      const at = text.toLowerCase().indexOf(a.toLowerCase());
      if (at === -1) continue;
      const sentence = sentenceAround(text, at);
      const sw = contentWords(sentence);
      const s = kw.filter((w) => sw.includes(w));
      // The anchor must land somewhere the key actually lives, or it is a coincidence of wording.
      if (s.length > 0 && s.length / Math.max(1, kw.length) >= 0.5) { hit = { anchor: a, sentence, shared: s }; break; }
    }
    if (hit) {
      pointing.push(`  POINTING     ${i.id}  the hint's own phrase lands on the sentence holding the key`
        + `\n      anchor  : "${hit.anchor}"\n      sentence: ${hit.sentence}`
        + `\n      key in it: ${hit.shared.join(', ')}\n      hint: ${hint}\n      key : ${key}`);
    } else if (anchors(hint).every((a) => text.toLowerCase().indexOf(a.toLowerCase()) === -1) && shared.length === 0) {
      noAnchor.push(`      ${i.id}: ${hint}`);
    }
  }

  declareMayBeEmpty('check:hint-coaching / POINTING',
    'A bank whose hints never quote the passage would legitimately produce none. The count of hints '
    + 'carrying NO locatable anchor is printed beside it so an empty result cannot read as a clean bank.');

  console.log(`\n${containment.length + pointing.length} CANDIDATE(S). Each is a row worth reading, never a verdict.\n`);
  for (const l of [...pointing, ...containment]) console.log(`${l}\n`);
  console.log(
    `  ROUTES: ${pointing.length} by ANCHORED POINTING, ${containment.length} by CONTAINMENT.\n`
    + `  ${withPassage} of ${rows.length} hint(s) sit on an item whose passage this can read.\n`
    + `\n  THE BAND THIS CANNOT REACH: ${noAnchor.length} hint(s) carry no phrase found in their passage`
    + '\n  and share no word with their key. A hint that points by DESCRIBING a moment rather than'
    + '\n  quoting it is a reading, not a lookup, and nothing here attempts it. Counted, not silent:'
    + `\n${noAnchor.join('\n')}`,
  );
  await prisma.$disconnect();
}

void main();
