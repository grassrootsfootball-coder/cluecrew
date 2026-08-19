/**
 * ENG-003-A-CZ-A8 — THE SPAN EXTENDS FORWARD (Annie's sixth return, 2026-08-19).
 *
 * **BOTH PROPOSED REPAIRS REFUSED.** Option A was refused because its span is precisely the card she
 * held as probable category 2 the day before. The ruled span is the paragraph the gap sits in:
 *
 *   Three weeks later the row of new labels ___ brighter than anything else in the corridor.
 *   Dev had joined the club, although he still refused to give up his apples.
 *
 * **"Three weeks later" is a relative marker and tense-neutral, so `is` remains defensible; the
 * anchor is a finite past-tense verb inside the presented text** — `had joined`, which the forward
 * extension is what brings in. That is why it extends forward rather than back.
 *
 * **THE PARAGRAPH IS FOUND FROM THE GAP, NEVER FROM THE START OF THE CURRENT SPAN** (Cowork's
 * finding: its own first attempt still crossed the scene break, because it took the paragraph start
 * from the span start — and the current span BEGINS in the previous scene, on
 * `"They might," he agreed.`). Derived here from the vehicle's own `___(N)___` marker, and asserted
 * against her ruled text rather than trusted.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';

const P = resolve(import.meta.dirname, '../content/passages');
const ID = 'ENG-003-A-CZ-A8';
const WRITE = process.argv.includes('--write');

/** Her ruled span, quoted from the ruling. The derivation must reproduce this or the run refuses. */
const RULED =
  'Three weeks later the row of new labels ___ brighter than anything else in the corridor. '
  + 'Dev had joined the club, although he still refused to give up his apples.';

async function main(): Promise<void> {
  const item = await prisma.item.findUniqueOrThrow({ where: { id: ID }, select: { stem: true } });
  const stem = { ...(item.stem as Record<string, unknown>) };
  const body = JSON.parse(readFileSync(`${P}/${String(stem.passageRef)}.json`, 'utf8')).body as string;

  const at = body.indexOf(`___(${stem.gapIndex as number})___`);
  if (at < 0) throw new Error(`vehicle carries no ___(${stem.gapIndex})___ marker`);
  // FROM THE GAP. Both bounds, so a scene break on either side cannot be crossed.
  const start = body.lastIndexOf('\n', at) + 1;
  const endRaw = body.indexOf('\n', at);
  const derived = body.slice(start, endRaw < 0 ? body.length : endRaw).trim()
    .replace(`___(${stem.gapIndex as number})___`, '___');

  if (derived !== RULED) {
    console.error('REFUSED — the paragraph derived from the gap is not her ruled span:');
    console.error(`  derived: ${JSON.stringify(derived)}`);
    console.error(`  ruled  : ${JSON.stringify(RULED)}`);
    process.exit(1);
  }
  console.log('derivation matches her ruled span exactly.');

  const text = String(stem.text);
  const cut = text.indexOf(' — ');
  const head = text.slice(0, cut);
  const before = text.slice(cut + 3).trim();
  stem.text = `${head} — ${derived}`;

  /**
   * THE SPAN AND ITS R23 DECLARATION ARE ONE CHANGE (R80's rule, applied to an exemption).
   *
   * The stem declares the carrier as the vehicle's own sentence so the child-facing cap does not
   * measure it as our wording. Extending the span without moving the declaration left it naming
   * text that no longer exists — and `check:db-content`, which now holds ENG-003 blocking-grade
   * (R209), failed the item within seconds: *"declares a quoted span that is not in the text"*.
   * The exemption is still needed and still correct; only its text moves.
   */
  const quotes = Array.isArray(stem.quotes) ? [...(stem.quotes as Array<Record<string, unknown>>)] : [];
  const q = quotes.find((entry) => typeof entry.text === 'string' && String(entry.text).includes('___'));
  if (!q) throw new Error('REFUSED: no R23 quote declaration carrying the gap — cannot move what is not there');
  const declaredBefore = String(q.text);
  q.text = derived;
  stem.quotes = quotes;

  console.log(`\nwas: ${before}`);
  console.log(`now: ${derived}`);
  // The old carrier opened in the PREVIOUS scene, which is why this row carried quotation marks.
  console.log(`\nquotation marks: carrier ${/^[“"]/.test(before) ? 'HAD' : 'had none'} -> `
    + `${/^[“"]/.test(derived) ? 'HAS' : 'has none'}; vehicle paragraph ${/[“"]/.test(derived) ? 'quotes' : 'does not quote'} this span.`);

  console.log(`\nR23 declaration moved with it:\n  was: ${declaredBefore.slice(0, 70)}…\n  now: ${derived.slice(0, 70)}…`);

  if (WRITE) {
    await prisma.item.update({ where: { id: ID }, data: { stem: stem as object } });
    console.log('\nAPPLIED.');
  } else {
    console.log('\nDry run. Re-run with --write.');
  }
  await prisma.$disconnect();
}

void main();
