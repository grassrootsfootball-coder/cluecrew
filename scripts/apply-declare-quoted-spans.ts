/**
 * DECLARE THE SPANS THE ITEMS ARE ALREADY QUOTING (Annie's §4, applied 2026-08-19 — R331).
 *
 * **MECHANICAL, AND EACH DECLARATION DOES TWO THINGS AT ONCE.** It turns a future refusal into a
 * verified quotation: the span is exempted from OUR house rules (it is not our voice) and brought
 * under `check:source-quotes`, which asserts it against the passage. **Nothing was missing but the
 * declaration** — the mechanism has existed all along.
 *
 * **NO TEXT MOVES.** Not one character of any stem, hint or walk script changes. The declaration is
 * a statement ABOUT text that is already there, so a reviewer comparing before and after sees the
 * same words with a record attached.
 *
 * **EVERY SPAN IS ASSERTED AGAINST THE PASSAGE BEFORE IT IS WRITTEN.** A declaration that does not
 * resolve is worse than none: `checkChildFacingText` reports an unresolvable claim and keeps the
 * text in scope, so a bad declaration would look like an exemption and act like a fault. Any span
 * not found verbatim in its declared passage refuses the whole run.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const PASSAGES = resolve(import.meta.dirname, '../content/passages');
const AUTHORED = ['walkScript', 'walk', 'hintCore', 'text', 'prompt', 'sentence', 'note'];
const QUOTED = /['"“‘]([^'"”’]{18,}?)['"”’]/g;
const flat = (s: string) => s.replace(/\s+/g, ' ').trim();

function passages(): Map<string, string> {
  const out = new Map<string, string>();
  for (const name of readdirSync(PASSAGES).filter((n) => n.endsWith('.json'))) {
    const p = JSON.parse(readFileSync(join(PASSAGES, name), 'utf8')) as Record<string, unknown>;
    const text = [p.extract, p.body, p.text].find((t) => typeof t === 'string') as string | undefined;
    if (typeof p.id === 'string' && text) out.set(p.id, flat(text));
  }
  if (out.size === 0) throw new Error('no passages parsed — refusing to declare from a failed read');
  return out;
}

async function main() {
  const source = passages();
  const items = await prisma.item.findMany({ include: { options: true, questionType: { select: { mechanic: true } } } });

  const plan: { id: string; explanation: Record<string, unknown>; added: string[] }[] = [];
  const unresolvable: string[] = [];

  for (const item of items) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const explanation = { ...((item.explanation ?? {}) as Record<string, unknown>) };
    const ref = typeof stem.passageRef === 'string' ? stem.passageRef : null;
    if (!ref) continue;
    const text = source.get(ref);
    if (!text) continue;

    const existing = ((explanation.quotes as { text?: string }[]) ?? []).filter((q) => typeof q?.text === 'string');
    const declared = new Set(existing.map((q) => flat(q.text!)));
    const found: string[] = [];

    for (const [field, value] of [...Object.entries(stem), ...Object.entries(explanation)]) {
      if (!AUTHORED.includes(field) || typeof value !== 'string') continue;
      QUOTED.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = QUOTED.exec(value)) !== null) {
        const quote = flat(m[1]!);
        if (declared.has(quote) || found.includes(quote)) continue;
        if (!text.includes(quote)) continue; // our own quotation marks around our own words
        found.push(quote);
      }
    }
    if (found.length === 0) continue;

    // Assert every span resolves before planning the write.
    for (const q of found) {
      if (!text.includes(q)) { unresolvable.push(`${item.id}: "${q.slice(0, 50)}"`); }
    }
    explanation.quotes = [...existing, ...found.map((t) => ({ text: t, passageRef: ref, rule: 'quoted-from-passage' }))];
    plan.push({ id: item.id, explanation, added: found });
  }

  if (unresolvable.length > 0) {
    console.error(`REFUSED — ${unresolvable.length} span(s) do not resolve, nothing written:`);
    for (const u of unresolvable.slice(0, 8)) console.error(`  ${u}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  // The gate must still pass with the declarations in place — a declaration that breaks an item
  // is not an improvement.
  for (const p of plan) {
    const item = items.find((i) => i.id === p.id)!;
    const faults = checkItemChildFacing({
      id: item.id, stem: item.stem, explanation: p.explanation,
      mechanic: item.questionType.mechanic, options: item.options,
    }).filter(isBlocking);
    if (faults.length > 0) {
      throw new Error(`REFUSED at ${p.id}: declaring its spans leaves ${faults.length} blocking fault(s) — ${faults.map((f) => f.detail).join(' | ')}`);
    }
  }

  const total = plan.reduce((n, p) => n + p.added.length, 0);
  console.log(`items gaining declarations: ${plan.length} · spans declared: ${total}`);
  if (!process.argv.includes('--write')) {
    for (const p of plan.slice(0, 4)) console.log(`  ${p.id}: ${p.added.map((a) => `"${a.slice(0, 45)}…"`).join(' · ')}`);
    console.log('\nDry run. Re-run with --write.');
    await prisma.$disconnect();
    return;
  }
  for (const p of plan) await prisma.item.update({ where: { id: p.id }, data: { explanation: p.explanation as object } });

  const back = await prisma.item.findMany({ where: { id: { in: plan.map((p) => p.id) } }, select: { id: true, explanation: true } });
  const declaredNow = back.reduce((n, b) => n + (((b.explanation as { quotes?: unknown[] })?.quotes ?? []).length), 0);
  console.log(`\nwritten ${plan.length} items · quotes on those rows now: ${declaredNow}`);
  await prisma.$disconnect();
}

main();
