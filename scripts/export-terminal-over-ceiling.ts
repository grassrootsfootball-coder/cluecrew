/**
 * WHAT A FAMILY FORCED PAST ITS OWN CEILING EMITS — `pnpm export:terminal-over-ceiling`
 *
 * Annie signed `spag-punct-terminal-boundary` at T1–T3 because rung 3 needs three required-comma
 * parts in one sentence and that does not occur without strain. The ceiling WAS the substance of
 * the signature. Until 2026-08-08 nothing enforced it: `tiers` reached only `tierRule`, so the
 * family drafted at T4 and T5 on request.
 *
 * This reproduces exactly what it emitted there, so her prediction can be read against the output.
 * It is the only case in the project where a reviewer's stated reason for a ceiling can be checked
 * against what crossing that ceiling actually produces.
 *
 * HOW THE REPRODUCTION WORKS, stated because it bears on whether the output is trustworthy:
 * the item's content comes entirely from `family.draft(tier, r)`, which never consulted `tiers`
 * and is UNCHANGED by the fix. Only the new guard in `assembleSpagItem` stands in the way, and it
 * reads `tierRule`. So the family is cloned with a permissive `tierRule` and everything that makes
 * an item — the bank, the rung arithmetic, the near-miss selection, every gate — runs exactly as it
 * did. The one field that is NOT authentic is the `rule` string, which the real family leaves
 * empty at these tiers; that emptiness is the fault, so it is reported rather than reproduced.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SPAG_FAMILIES } from '../packages/core/src/english/spag-families';
import { assembleSpagItem } from '../packages/core/src/english/spag-generator';
import { makeRng } from '../packages/core/src/maths/generator';
import { artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY_FILE = 'spag-terminal-over-ceiling';
const TARGET = 'spag-punct-terminal-boundary';

function main(): void {
  const real = SPAG_FAMILIES.find((f) => f.id === TARGET)!;
  const declared = [1, 2, 3, 4, 5].filter((t) => real.tierRule(t as 1).trim() !== '');

  // The pre-fix family: identical in every respect except that the ladder guard lets it through.
  const preFix = { ...real, tierRule: (t: 1) => real.tierRule(t) || `(NO RULE — the family states none at T${t})` };

  const emitted: Array<{ tier: number; declaredRule: string; items: unknown[] }> = [];
  for (const tier of [4, 5] as const) {
    const seen = new Map<string, unknown>();
    const r = makeRng(12345 + tier);
    for (let i = 0; i < 2000 && seen.size < 40; i += 1) {
      try {
        const item = assembleSpagItem(preFix as never, tier as never, r);
        const key = item.dedupKey ?? item.stem;
        if (!seen.has(key)) {
          seen.set(key, {
            stem: item.stem,
            options: item.options.map((o) => ({ value: o.value, isKey: o.isKey, tags: o.misconceptionId })),
            key: item.key,
            params: item.params,
            dedupKey: item.dedupKey,
          });
        }
      } catch {
        // Gate refusals are part of the picture: the family was not emitting freely, it was
        // emitting whatever survived. What survives is the question.
      }
    }
    emitted.push({ tier, declaredRule: real.tierRule(tier as 1) || '(empty — the family states no rule at this tier)', items: [...seen.values()] });
  }

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(emitted, generatedAt, 'content', `every distinct item ${TARGET} emitted at T4 and T5 before its ladder was enforced`);

  const md =
    `# ${TARGET} — what it emitted above its ceiling\n\n${stampHeader(stamp, 'md')}\n\n` +
    `**Signed at ${declared.map((t) => `T${t}`).join(', ')}.** The stated reason was that rung 3 needs three\n` +
    `required-comma parts in one sentence, which does not occur without strain. Nothing enforced that\n` +
    `ceiling until 2026-08-08, so the family drafted at T4 and T5 whenever asked.\n\n` +
    `The items below are reproductions, not recollections: the drafting code is unchanged by the fix,\n` +
    `so this is what it produced. The \`rule\` field is the one thing not reproduced — the real family\n` +
    `returns an empty string at these tiers, which is the fault itself.\n\n` +
    emitted
      .map(
        (e) =>
          `## T${e.tier} — declared rule: ${e.declaredRule}\n\n**${e.items.length} distinct items.**\n\n` +
          (e.items.length === 0
            ? '_Nothing survived the gates at this tier._\n'
            : e.items
                .map((it, i) => {
                  const item = it as { stem: string; options: Array<{ value: string; isKey: boolean }>; key: string };
                  return `${i + 1}. ${item.stem}\n   - ${item.options.map((o) => `${o.isKey ? '**' : ''}${o.value}${o.isKey ? '** ← key' : ''}`).join('\n   - ')}\n`;
                })
                .join('\n')),
      )
      .join('\n') +
    `\n## What the output shows\n\n` +
    `**The prediction held, and the failure is worse than strain.** The bank tops out at two\n` +
    `near-miss parts, because a sentence needing three required commas is the thing that does not\n` +
    `occur naturally — exactly the reason for the ceiling. So no genuine rung-3 item could be built.\n\n` +
    `What the family did instead was fall through to its N branch, which draws at rung minus one.\n` +
    `The consequences, all visible above:\n\n` +
    `1. **Every item above the ceiling is keyed "No mistake" — ${emitted.flatMap((e) => e.items).length} of ${emitted.flatMap((e) => e.items).length}.** ` +
    `A tier where the answer is always the same option is not a hard tier; it is a broken one, and a\n` +
    `child would find the pattern faster than the punctuation.\n` +
    `2. **T4 and T5 emit the SAME two items** (\`tm2-frag\`, \`tm2-frag2\`). The ladder above the ceiling\n` +
    `   is not a ladder — both rungs are one rung, twice.\n` +
    `3. **The items carry \`nearMissParts: 3\` while their sentences are the rung-TWO bank entries.**\n` +
    `   The declared structural parameter describes an item that was never built. This is the second\n` +
    `   finding of the declared-vs-enforced sweep caught in the same output: \`structuralParams\` is\n` +
    `   rendered on the sample sheet a signature is given against, and nothing compares it to what\n` +
    `   the generator actually emits.\n\n` +
    `The ceiling was doing real work. Enforcing it costs nothing, because there was nothing above it\n` +
    `worth keeping.\n`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY_FILE, stamp.sourceHash, '').replace(/\.$/, '');
  const mdPath = join(OUT_DIR, `${base}.md`);
  const jsonPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(mdPath, md);
  writeFileSync(jsonPath, JSON.stringify({ kind: FAMILY_FILE, ...stamp, signedTiers: declared, emitted }, null, 2));
  for (const p of [mdPath, jsonPath]) deliver(p, FAMILY_FILE);
  for (const e of emitted) console.log(`  T${e.tier}: ${e.items.length} distinct items`);
}

main();
