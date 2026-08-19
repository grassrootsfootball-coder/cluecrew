/**
 * AUTHORED FIELDS CONTAINING A QUOTATION FROM THEIR OWN PASSAGE, WITH NO DECLARED SPAN
 * (Annie's §4, measured 2026-08-19 — R327).
 *
 * **THESE ARE TWO POPULATIONS AT ONCE AND THAT IS WHY THEY MATTER.**
 *
 *   · **They refuse the next time a rule tightens.** `favoring` sat inside a walkScript for weeks
 *     and only became a refusal when the US-spelling rule reached that field. Every undeclared
 *     quotation is a future refusal waiting on an unrelated change.
 *   · **And nothing verifies them against the source.** `check:source-quotes` reads the fields
 *     Annie named — `attractorQuote`, `defeaterQuote`. A quotation embedded in prose is checked by
 *     nothing, so it can drift from the passage silently, which is exactly the fault that check
 *     exists to catch elsewhere.
 *
 * **THE MECHANISM HAS EXISTED ALL ALONG AND IS UNUSED.** `checkChildFacingText` takes
 * `quotedSpans`; declaring the span both exempts it from our house rules and brings it under the
 * source check. **Nothing was missing but the declaration.**
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const PASSAGES = resolve(import.meta.dirname, '../content/passages');
const AUTHORED = ['walkScript', 'walk', 'hintCore', 'text', 'prompt', 'sentence', 'note'];
/** A quotation mark pair around at least four words — short enough to catch, long enough to mean it. */
const QUOTED = /['"“‘]([^'"”’]{18,}?)['"”’]/g;
const flat = (s: string) => s.replace(/\s+/g, ' ').trim();

function passages(): Map<string, string> {
  const out = new Map<string, string>();
  for (const name of readdirSync(PASSAGES).filter((n) => n.endsWith('.json'))) {
    const p = JSON.parse(readFileSync(join(PASSAGES, name), 'utf8')) as Record<string, unknown>;
    const text = [p.extract, p.body, p.text].find((t) => typeof t === 'string') as string | undefined;
    if (typeof p.id === 'string' && text) out.set(p.id, flat(text));
  }
  if (out.size === 0) throw new Error('no passages parsed — refusing to report from a failed read');
  return out;
}

async function main() {
  const text = passages();
  const items = await prisma.item.findMany({ select: { id: true, status: true, stem: true, explanation: true } });
  requirePopulation('undeclared quotations', { 'passages': text.size, 'items': items.length });

  const findings: { itemId: string; status: string; field: string; quote: string; passageRef: string }[] = [];
  let declaredSpans = 0;

  for (const item of items) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const explanation = (item.explanation ?? {}) as Record<string, unknown>;
    const ref = typeof stem.passageRef === 'string' ? stem.passageRef : null;
    if (!ref) continue;
    const source = text.get(ref);
    if (!source) continue;
    const declared = new Set<string>([
      ...(((explanation.quotes as { text?: string }[]) ?? []).map((q) => flat(q?.text ?? ''))),
      ...(((stem.quotes as { text?: string }[]) ?? []).map((q) => flat(q?.text ?? ''))),
    ].filter(Boolean));
    declaredSpans += declared.size;

    for (const [field, value] of [...Object.entries(stem), ...Object.entries(explanation)]) {
      if (!AUTHORED.includes(field) || typeof value !== 'string') continue;
      QUOTED.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = QUOTED.exec(value)) !== null) {
        const quote = flat(m[1]!);
        if (declared.has(quote)) continue;
        // Only count it when the passage really does contain it — otherwise it is our own
        // quotation marks around our own words, which is a different thing entirely.
        if (source.includes(quote)) {
          findings.push({ itemId: item.id, status: item.status, field, quote, passageRef: ref });
        }
      }
    }
  }

  const byItem = new Set(findings.map((f) => f.itemId));
  const live = findings.filter((f) => f.status === 'LIVE');
  console.log('undeclared quotations in authored fields');
  console.log(`  passages read              : ${text.size}`);
  console.log(`  spans already declared     : ${declaredSpans}`);
  console.log(`  UNDECLARED quotations      : ${findings.length}`);
  console.log(`    across items             : ${byItem.size}`);
  console.log(`    on LIVE items            : ${live.length}`);
  const byField = new Map<string, number>();
  for (const f of findings) byField.set(f.field, (byField.get(f.field) ?? 0) + 1);
  for (const [f, n] of [...byField].sort((a, b) => b[1] - a[1])) console.log(`      ${f}: ${n}`);
  console.log('\n  Each is BOTH a future refusal and a quotation nothing verifies against its source.');
  console.log('  The mechanism to fix it has existed all along: declare the span.');
  await prisma.$disconnect();
}

main();
