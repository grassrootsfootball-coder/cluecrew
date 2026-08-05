/**
 * THE HUMAN-REVIEW BREAKDOWN — `pnpm export:vr-human-review`
 *
 * The reviewer asked for an item-by-item breakdown of the VR questions the
 * automated gate cannot verify — the meaning-based cases, where "is this the
 * closest synonym" or "do these three belong together" turns on judgement no
 * wordlist settles. This produces exactly the five fields she listed, for
 * every such item in the free ten, grouped by category.
 *
 * Scope is DERIVED, not hand-picked: a free-tier case whose question type the
 * word-puzzle gate does not solve. That is the honest definition of
 * "unverified" — everything the machine has already confirmed is left out, and
 * everything it cannot reach is in.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deliver, freshnessStamp } from './lib/export-destination';
import { PRINT_CSS, esc } from './lib/review-pack-format';
import { prisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const TODAY = new Date().toISOString().slice(0, 10);

/** The free-ten types the gate SOLVES — excluded, because they are verified. */
const MACHINE_VERIFIED = new Set([
  'vr-01-insert-letter',
  'vr-07-letters-for-numbers',
  'vr-09-letter-series',
  'vr-11-number-series',
]);

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(renderValue).join(' · ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}=${renderValue(v)}`)
      .join(' ');
  }
  return String(value);
}

/** The question as the child meets it: the prompt plus any structured payload. */
function stemText(stem: Record<string, unknown>): string {
  const prompt = String(stem.prompt ?? '');
  const payload = Object.entries(stem)
    .filter(([key]) => key !== 'prompt')
    .map(([key, value]) => `${key}: ${renderValue(value)}`)
    .join(' · ');
  return payload ? `${prompt}  [${payload}]` : prompt;
}

interface OutItem {
  itemId: string;
  category: string;
  questionTypeId: string;
  tier: number;
  stem: string;
  correctAnswer: string;
  distractors: Array<{ value: string; misconceptionId: string | null; misconceptionTag: string | null }>;
}

async function main(): Promise<void> {
  const cases = await prisma.case.findMany({ where: { freeTier: true }, orderBy: { orderInDistrict: 'asc' } });
  const groups: Array<{ id: string; title: string; questionTypeId: string; mechanic: string; items: OutItem[] }> = [];

  for (const kase of cases) {
    if (MACHINE_VERIFIED.has(kase.questionTypeId)) continue;
    const type = await prisma.questionType.findUnique({ where: { id: kase.questionTypeId } });
    const items = await prisma.item.findMany({
      where: { questionTypeId: kase.questionTypeId },
      include: { options: { include: { misconception: true } } },
      orderBy: [{ difficultyTier: 'asc' }, { id: 'asc' }],
    });

    const out: OutItem[] = items.map((item) => {
      const stem = (item.stem ?? {}) as Record<string, unknown>;
      const correct = item.options.filter((o) => o.isCorrect);
      return {
        itemId: item.id,
        category: kase.title,
        questionTypeId: kase.questionTypeId,
        tier: item.difficultyTier,
        stem: stemText(stem),
        correctAnswer: correct.map((o) => renderValue((o.content as { value?: unknown; pair?: unknown }).value ?? (o.content as { pair?: unknown }).pair)).join(' / '),
        distractors: item.options
          .filter((o) => !o.isCorrect)
          .map((o) => {
            const content = (o.content ?? {}) as Record<string, unknown>;
            return {
              value: renderValue('value' in content ? content.value : (content.pair ?? content)),
              misconceptionId: o.misconceptionId,
              misconceptionTag: o.misconception?.description ?? null,
            };
          }),
      };
    });

    groups.push({ id: kase.id, title: kase.title, questionTypeId: kase.questionTypeId, mechanic: type?.mechanic ?? 'unknown', items: out });
  }

  const total = groups.reduce((sum, g) => sum + g.items.length, 0);

  const html = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8">
<title>VR human-review breakdown — ${TODAY}</title>
<style>
${PRINT_CSS}
</style></head>
<body>
<div class="cover">
  <h1>VR items needing human review</h1>
  <p>Generated ${TODAY}. The ${total} free-tier VR items the automated gate cannot verify — the
  meaning-based categories, where the right answer turns on judgement no wordlist settles.</p>
  <dl>
    <dt>What this is</dt>
    <dd>Every item in the six free-tier categories the word-puzzle gate does not solve, with the
        five fields you asked for: category, question/stem, correct answer, distractors with their
        misconception tags, and the intended tier.</dd>
    <dt>What is NOT here</dt>
    <dd>The four machine-verified categories — insert-letter, letters-for-numbers, letter series and
        number series — whose keys and single-answer status are already confirmed by
        <code>pnpm check:word-puzzles</code>. Nothing there needs your eye on tag accuracy or tier
        the way these do.</dd>
    <dt>On the count</dt>
    <dd>You mentioned 62 unverified questions; the full human-review set across the free ten is
        ${total}, in the six categories below. Your 62 are a subset of these — tell me if you meant a
        narrower slice and I will scope to it exactly.</dd>
  </dl>
</div>
${groups
  .map(
    (group) => `<section>
  <h2>${esc(group.title)}</h2>
  <p class="muted"><code>${esc(group.questionTypeId)}</code> · interaction <code>${esc(group.mechanic)}</code> · ${group.items.length} items</p>
  ${group.items
    .map(
      (item, index) => `<div class="block">
    <div class="block-head">
      <span class="num">${index + 1} of ${group.items.length}</span>
      <span class="tag">tier ${item.tier}</span>
      <code>${esc(item.itemId)}</code>
    </div>
    <p class="stem">${esc(item.stem)}</p>
    <p><strong>Correct:</strong> ${esc(item.correctAnswer)}</p>
    <ul class="options">
      ${item.distractors
        .map(
          (d) => `<li>
        <span class="opt">${esc(d.value)}</span>
        <span class="mis">${
          d.misconceptionId
            ? `<code>${esc(d.misconceptionId)}</code> — ${esc(d.misconceptionTag)}`
            : '<strong>NO TAG</strong>'
        }</span>
      </li>`,
        )
        .join('')}
    </ul>
  </div>`,
    )
    .join('\n')}
</section>`,
  )
  .join('\n')}
</body></html>`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = `vr-human-review-breakdown-${TODAY}`;
  const htmlPath = join(OUT_DIR, `${base}.html`);
  const jsonPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(htmlPath, html);
  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        kind: 'vr-human-review-breakdown',
        ...freshnessStamp(groups, new Date().toISOString()),
        generated: TODAY,
        note: 'Free-tier VR items the automated gate cannot verify. Five fields per item for tag-accuracy, tier-fit and false-negative review.',
        itemCount: total,
        categories: groups.map((g) => ({ category: g.title, questionTypeId: g.questionTypeId, mechanic: g.mechanic, items: g.items })),
      },
      null,
      2,
    ),
  );

  console.log(`${groups.length} categories · ${total} items → ${htmlPath}`);
  for (const g of groups) console.log(`  ${g.id.padEnd(11)} ${String(g.items.length).padStart(3)}  ${g.title}`);
  deliver(htmlPath);
  deliver(jsonPath);
  await prisma.$disconnect();
}

void main();
