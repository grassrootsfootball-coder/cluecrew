/**
 * THE LINE-REFERENCE GATE — `pnpm check:line-refs`
 *
 * Resolves every line citation in the English bank against the passage it
 * cites: item stems (structured `lineRefs`, plus any prose citation) and walk
 * scripts (prose citations only — a script has no structured field, which is
 * exactly why its references went unchecked for three rounds).
 *
 * Same policy as the database content gate, for the same reason: a citation
 * on a SERVING item is wrong in front of a child and fails the build; one on
 * a DRAFT item is a queue of work and is reported. The rules themselves live
 * in packages/core/src/line-refs.ts, shared and tested.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkLineRefs, type LineRefFailure, type CitablePassage } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

const PASSAGE_DIR = resolve(import.meta.dirname, '../content/passages');

function loadPassages(): Map<string, CitablePassage> {
  const out = new Map<string, CitablePassage>();
  for (const entry of readdirSync(PASSAGE_DIR)) {
    if (!entry.endsWith('.json')) continue;
    const passage = JSON.parse(readFileSync(join(PASSAGE_DIR, entry), 'utf8')) as CitablePassage;
    out.set(passage.id, passage);
  }
  return out;
}

async function main(): Promise<void> {
  const passages = loadPassages();
  const serving: LineRefFailure[] = [];
  const draft: LineRefFailure[] = [];
  let checked = 0;
  let citing = 0;

  const items = await prisma.item.findMany({ include: { questionType: true } });
  for (const item of items) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const passageRef = stem.passageRef as string | undefined;
    if (!passageRef) continue;
    checked += 1;
    const passage = passages.get(passageRef);
    const lineRefs = Array.isArray(stem.lineRefs) ? (stem.lineRefs as number[]) : [];
    const gapRef = typeof stem.gapRef === 'number' ? stem.gapRef : undefined;
    const declaredQuotes = Array.isArray(stem.quotes)
      ? (stem.quotes as Array<{ text?: string }>).map((quote) => quote.text ?? '').filter(Boolean)
      : [];
    const bucket = item.status === 'LIVE' ? serving : draft;

    // R23 limit 1 — a declared passage NAME must actually be the passage's name. Verified here,
    // against the passage file, exactly as a quotation is. A name we invent for a worked example
    // is our word and gets reworded; declaring it must not be a way to smuggle one past the
    // ceiling. A declaration that does not resolve is REPORTED, never silently honoured.
    const declaredNames = Array.isArray(stem.passageNames)
      ? (stem.passageNames as string[]).filter((n) => typeof n === 'string' && n.trim())
      : [];
    if (declaredNames.length) {
      const body = passage
        ? passage.numberedLines.map((l) => l.text).join(' ').toLowerCase()
        : '';
      for (const name of declaredNames) {
        if (!passage) {
          bucket.push({ where: `item:${item.id} stem.passageNames`, rule: 'line-ref', detail: `declares passage name "${name}" but passage ${passageRef} is missing` });
        } else if (!new RegExp(`\\b${name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(body)) {
          bucket.push({ where: `item:${item.id} stem.passageNames`, rule: 'line-ref', detail: `declares passage name "${name}", which does not appear in ${passageRef}` });
        }
      }
    }

    bucket.push(
      ...checkLineRefs({
        label: `item:${item.id} stem`,
        passageRef,
        passage,
        lineRefs,
        gapRef,
        text: (stem.prompt as string) ?? '',
        declaredQuotes,
      }),
    );

    const explanation = (item.explanation ?? {}) as Record<string, unknown>;
    for (const field of ['walkScript', 'walk', 'hintCore'] as const) {
      const text = explanation[field];
      if (typeof text !== 'string' || !text.trim()) continue;
      const found = checkLineRefs({ label: `item:${item.id} explanation.${field}`, passageRef, passage, text });
      if (found.length > 0 || /\bline\b/i.test(text)) citing += 1;
      bucket.push(...found);
    }
  }

  console.log(
    `Line-reference gate: ${passages.size} passages · ${checked} item(s) citing a passage · ` +
      `${citing} explanation field(s) naming a line.`,
  );

  const report = (name: string, failures: LineRefFailure[]): void => {
    if (failures.length === 0) return;
    const byRule = failures.reduce<Record<string, number>>((acc, failure) => {
      acc[failure.rule] = (acc[failure.rule] ?? 0) + 1;
      return acc;
    }, {});
    console.log(
      `\n${name}: ${failures.length} — ` +
        Object.entries(byRule).map(([rule, count]) => `${rule}: ${count}`).join(', '),
    );
    for (const failure of failures) console.log(`  · ${failure.where}: ${failure.detail}`);
  };

  report('DRAFT backlog (not serving, not blocking)', draft);

  if (serving.length > 0) {
    console.error(`\nSERVING content FAILED the line-reference gate (${serving.length}):`);
    for (const failure of serving) console.error(`  ✗ ${failure.where}: ${failure.detail}`);
    console.error('\nA child is being sent to the wrong place. Fix it or take it out of service.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`\n${draft.length === 0 ? 'Every line reference resolves.' : 'Nothing serving cites a bad line.'}`);
  await prisma.$disconnect();
}

void main();
