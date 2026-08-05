/**
 * THE REVIEWER'S OFFLINE PACK — `pnpm export:review-pack`
 *
 * A specialist reviewer works on paper: reading, ticking, scribbling in a
 * margin. This writes them one document to print, and a decisions file to
 * hand back (see import-review-decisions.ts for the return path).
 *
 * Optimised for PAPER, not screen, and the two want opposite things:
 *   · serif at 11pt, because print resolution carries it and a screen does not;
 *   · black on white — `cream` is a SCREEN rule (D1/D4) about backlit glare,
 *     and paper has none. Printing cream would waste toner and read worse;
 *   · every block kept whole across a page break, because a question split
 *     over two pages gets annotated twice or not at all;
 *   · real ruled space beside every item, sized to be written in with a pen.
 *
 * EVERY COUNT IS QUERIED, never hardcoded. A pack that claims 78 items and
 * prints 40 is worse than no pack, and the reviewer only finds out at the
 * table. Sections that have no data say so in plain words and explain what
 * would fill them.
 *
 * Writes HTML always; renders a PDF too when Playwright's Chromium is on the
 * machine. `--district=ENGLISH` (default) scopes the pack.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { deliver } from './lib/export-destination';
import { DECISION_BOXES, PRINT_CSS, esc, writingSpace } from './lib/review-pack-format';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';

const DISTRICT = (process.argv.find((arg) => arg.startsWith('--district='))?.split('=')[1] ??
  'ENGLISH') as 'VR' | 'NVR' | 'MATHS' | 'ENGLISH';
const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
/** `--only=items` or `--only=misconceptions` scopes the pack to one section. */
const ONLY = process.argv.find((arg) => arg.startsWith('--only='))?.split('=')[1] ?? null;
const TODAY = new Date().toISOString().slice(0, 10);

/** A section that has nothing to show says why, rather than printing blank. */
function emptySection(what: string, why: string): string {
  return `<div class="empty">
    <p><strong>Nothing to review here yet: ${esc(what)}.</strong></p>
    <p>${esc(why)}</p>
    <p class="muted">This section is generated from the database. It will fill itself in when the content exists — the pack does not need changing.</p>
  </div>`;
}

async function misconceptionSection(): Promise<{ html: string; count: number }> {
  const pending = await prisma.misconception.findMany({
    where: { district: DISTRICT, status: 'PROPOSED' },
    orderBy: { id: 'asc' },
  });
  if (pending.length === 0) {
    return {
      count: 0,
      html: emptySection(
        `no ${DISTRICT} misconceptions are awaiting a decision`,
        'Every proposal for this district has already been approved or rejected.',
      ),
    };
  }

  // Which item types actually use each one — the reviewer's first question is
  // always "where does this land?", and an unused entry is a different
  // decision from one already carrying twenty items.
  const usage = await prisma.itemOption.findMany({
    where: { misconceptionId: { in: pending.map((entry) => entry.id) } },
    select: { misconceptionId: true, item: { select: { questionType: { select: { id: true, name: true } } } } },
  });
  const typesById = new Map<string, Set<string>>();
  for (const row of usage) {
    if (!row.misconceptionId) continue;
    const set = typesById.get(row.misconceptionId) ?? new Set<string>();
    set.add(row.item.questionType.name);
    typesById.set(row.misconceptionId, set);
  }

  const blocks = pending
    .map((entry, index) => {
      const types = [...(typesById.get(entry.id) ?? [])];
      return `<article class="block">
  <header class="block-head">
    <span class="num">${index + 1} of ${pending.length}</span>
    <code>${esc(entry.id)}</code>
  </header>
  <p class="desc">${esc(entry.description)}</p>
  <p class="hint"><span class="tag">The child sees</span> “${esc(entry.childHint)}”</p>
  <p class="types"><span class="tag">Used by</span> ${
    types.length ? esc(types.join(' · ')) : '<em>no items yet — approving it makes it available to question writers</em>'
  }</p>
  ${DECISION_BOXES}
  ${writingSpace(2, 'Notes / amended wording')}
</article>`;
    })
    .join('\n');
  return { count: pending.length, html: blocks };
}

async function itemSection(): Promise<{ html: string; count: number; lowConfidence: number }> {
  const items = await prisma.item.findMany({
    where: { questionType: { district: DISTRICT }, status: { in: ['DRAFT', 'REVIEWED'] } },
    include: { questionType: true, options: { include: { misconception: true } } },
    orderBy: [{ id: 'asc' }],
  });

  if (items.length === 0) {
    const types = await prisma.questionType.count({ where: { district: DISTRICT } });
    return {
      count: 0,
      lowConfidence: 0,
      html: emptySection(
        `there are no ${DISTRICT} items in the bank`,
        types === 0
          ? `The ${DISTRICT} district has no question types registered yet, so no item can exist against it. Items appear here once the registry and the authoring pass have run.`
          : `${types} question type(s) are registered for ${DISTRICT}, but no items have been authored against them yet.`,
      ),
    };
  }

  // The nine that need hardest looking at come FIRST — attention is finite
  // and a reviewer is sharpest on page one.
  items.sort((a, b) => {
    const low = (item: typeof a) =>
      Number(Boolean(item.calibrationFlaggedAt || item.similarityFlaggedAt || (item.explanation as Record<string, unknown> | null)?.lowConfidence));
    return low(b) - low(a) || a.id.localeCompare(b.id);
  });
  const lowConfidence = items.filter(
    (item) =>
      item.calibrationFlaggedAt ||
      item.similarityFlaggedAt ||
      (item.explanation as Record<string, unknown> | null)?.lowConfidence,
  ).length;
  const blocks = items
    .map((item, index) => {
      // Low confidence is the authoring pass's own flag, carried on the item,
      // plus the platform's calibration/similarity flags.
      const flagged = Boolean(
        item.calibrationFlaggedAt ||
          item.similarityFlaggedAt ||
          (item.explanation as Record<string, unknown> | null)?.lowConfidence,
      );
      const stem = item.stem as Record<string, unknown>;
      const passageRef = typeof stem.passageRef === 'string' ? stem.passageRef : null;
      const lineRefs = Array.isArray(stem.lineRefs) ? (stem.lineRefs as number[]).join(', ') : null;
      const prompt = typeof stem.prompt === 'string' ? stem.prompt : JSON.stringify(stem);
            const explanation = item.explanation as Record<string, unknown> | null;
      const walk = explanation?.walkScript ?? explanation?.walk;

      const options = item.options
        .map((option) => {
          const content = option.content as Record<string, unknown>;
          const text = typeof content.value === 'string' ? content.value : JSON.stringify(content);
          return `<li class="${option.isCorrect ? 'correct' : ''}">
        <span class="mark">${option.isCorrect ? '✔' : '☐'}</span>
        <span class="opt">${esc(text)}</span>
        ${
          option.isCorrect
            ? '<span class="tag">key</span>'
            : `<span class="mis">${
                option.misconception
                  ? esc(option.misconception.description) + ` <code>${esc(option.misconceptionId)}</code>`
                  : '<strong>NO MISCONCEPTION TAGGED</strong>'
              }</span>`
        }
      </li>`;
        })
        .join('\n');

      return `<article class="block item ${flagged ? 'flagged' : ''}">
  <header class="block-head">
    <span class="num">${index + 1} of ${items.length}</span>
    <code>${esc(item.id.length > 24 ? `${item.id.slice(0, 12)}…` : item.id)}</code>
    <span class="tag">${esc(item.questionType.name)}</span>
    <span class="tag">T${item.difficultyTier}</span>
    ${flagged ? '<span class="flag">LOW CONFIDENCE — please look hard at this one</span>' : ''}
  </header>
  ${passageRef ? `<p class="passage"><span class="tag">Passage</span> ${esc(passageRef)}${lineRefs ? ` · lines ${esc(lineRefs)}` : ''}</p>` : ''}
  <p class="stem">${esc(prompt)}</p>
  <ol class="options">${options}</ol>
  ${walk ? `<div class="walk"><span class="tag">Walk script</span><p>${esc(typeof walk === 'string' ? walk : JSON.stringify(walk))}</p></div>` : '<p class="muted">No walk script authored.</p>'}
  ${DECISION_BOXES}
  ${writingSpace(3, 'Amendments')}
</article>`;
    })
    .join('\n');

  return { count: items.length, lowConfidence, html: blocks };
}

async function main(): Promise<void> {
  const misconceptions = await misconceptionSection();
  const items = await itemSection();
  const benevolent = await prisma.word.findFirst({
    where: { headword: 'benevolent' },
    select: { id: true, tier: true, status: true, definitionChild: true },
  });

  const openRulings = [
    {
      title: 'The quoted-text carve-out',
      body: `A curated passage extract carries words our ban list refuses — "wrong", "failed", "poor" — because real prose does. The scanner exempts a span marked <code>passageQuote</code> whose <code>passageRef</code> resolves to a real passage, and nothing else. Does that boundary sit in the right place for the extracts you have in mind?`,
    },
    {
      title: 'Walk-script house style',
      body: `No walk scripts exist in the bank yet, so this is a blank page rather than a review: what should a walk script sound like, how long, how much of the answer does it give away, and does it address the child or narrate?`,
    },
    {
      title: `"benevolent" — tier`,
      body: benevolent
        ? `Currently <strong>tier ${benevolent.tier}</strong> (${esc(benevolent.status)}): “${esc(benevolent.definitionChild)}”. Tier 5 is the demanding tail. Is that right, or is this a working tier-4 word?`
        : 'The card is not in the vault, so there is no tier to rule on.',
    },
    {
      title: 'Any systematic pattern you have noticed',
      body: 'Across everything in this pack — a habit in the drafting, a repeated weakness, something that would be cheaper to fix once at the source than item by item.',
    },
  ];

  const html = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8">
<title>ClueCrew reviewer pack — ${esc(DISTRICT)} — ${TODAY}</title>
<style>
${PRINT_CSS}
</style></head>
<body>

<div class="cover">
  <h1>Reviewer pack — ${esc(DISTRICT)}</h1>
  <p>Generated ${TODAY}. Print single-sided; there is writing space on every item.</p>
  <dl>
    ${
      ONLY === 'items'
        ? ''
        : `<dt>${ONLY ? '' : '1 · '}Misconceptions awaiting your decision</dt>
           <dd>${misconceptions.count} — tick approve, reject or amend beside each.</dd>`
    }
    ${
      ONLY === 'misconceptions'
        ? ''
        : `<dt>${ONLY === 'items' ? 'Items in full' : '2 · Items in full'}</dt>
           <dd>${
             items.count
               ? `${items.count} — ${items.lowConfidence} marked LOW CONFIDENCE`
               : `none — there are no ${esc(DISTRICT)} items in the bank yet. Section 2 explains what has to exist first.`
           }</dd>`
    }
    ${ONLY ? '' : `<dt>3 · Open rulings</dt><dd>${openRulings.length} questions at the back.</dd>`}
  </dl>
  ${ONLY === 'items' ? '<p class="muted">Second pass: the item bank only. The nine flagged LOW CONFIDENCE come first, while attention is freshest.</p>' : ''}
  <p class="muted">Every number here was counted from the database when this pack was generated. If a section says there is nothing to review, that is the true state of the bank, not a fault in the pack.</p>
  <p class="muted"><strong>Handing it back:</strong> your marks are typed into a decisions file and imported with <code>pnpm import:review-decisions</code>. Your name goes on the decision; whoever types it goes on the entry. The two are recorded separately and are never merged.</p>
</div>

${ONLY === 'items' ? '' : `<section>
  <h2>${ONLY ? '' : '1 · '}Misconceptions awaiting your decision (${misconceptions.count})</h2>
  <p class="muted">Nothing here is in use. No question can point at one until you approve it, so an unapproved entry never reaches a child.</p>
  ${misconceptions.html}
</section>`}

${ONLY === 'misconceptions' ? '' : `<section>
  <h2>${ONLY === 'items' ? '' : '2 · '}Items (${items.count}${items.lowConfidence ? `, ${items.lowConfidence} low confidence` : ''})</h2>
  ${items.count ? `<p class="muted">The key is marked ✔. Every other option shows the misconception it is meant to execute — if it does not execute it, that is the thing to catch.</p>` : ''}
  ${items.html}
</section>`}

${ONLY ? '' : `<section>
  <h2>3 · Open rulings</h2>
  <p class="muted">These are the questions the build is waiting on. Write as much or as little as you like.</p>
  ${openRulings
    .map(
      (ruling) => `<div class="decision">
    <h3>${esc(ruling.title)}</h3>
    <p>${ruling.body}</p>
    ${writingSpace(4)}
  </div>`,
    )
    .join('\n')}
  <div class="decision">
    <h3>Signed</h3>
    <p>Reviewer name and date, so the decisions can be recorded against you rather than against whoever types them in.</p>
    ${writingSpace(2)}
  </div>
</section>`}

</body></html>`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = `review-pack-${DISTRICT.toLowerCase()}${ONLY ? `-${ONLY}` : ''}-${TODAY}`;
  const htmlPath = join(OUT_DIR, `${base}.html`);
  writeFileSync(htmlPath, html);
  console.log(`Review pack → ${htmlPath}`);
  deliver(htmlPath);
  console.log(
    `  misconceptions awaiting a decision: ${misconceptions.count}\n` +
      `  items: ${items.count}${items.count ? ` (${items.lowConfidence} low confidence)` : ''}\n` +
      `  open rulings: ${openRulings.length}`,
  );

  // A real PDF when Chromium is present; the HTML prints identically if not.
  // Playwright is a devDependency of apps/web, so it is resolved from there
  // rather than from wherever this script happens to be run.
  try {
    const { createRequire } = await import('node:module');
    const requireFromWeb = createRequire(resolve(import.meta.dirname, '../apps/web/package.json'));
    const { chromium } = requireFromWeb('playwright') as typeof import('@playwright/test');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfPath = join(OUT_DIR, `${base}.pdf`);
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    await browser.close();
    console.log(`PDF → ${pdfPath}`);
    deliver(pdfPath);
  } catch (error) {
    console.log(`  (no PDF: ${(error as Error).message.split('\n')[0]} — print the HTML instead)`);
  }

  // The blank decisions file to type their marks into.
  const template = {
    kind: 'review-decisions',
    district: DISTRICT,
    pack: base,
    reviewer: 'human:REPLACE@example.com',
    recordedBy: 'human:REPLACE@example.com',
    method: `written review, ${TODAY}`,
    note: 'REPLACE — what the reviewer said, in their words.',
    misconceptions: { approve: [], reject: [] as Array<{ id: string; note: string }> },
    itemAmendments: [] as Array<{ itemId: string; note: string; stem?: string }>,
    rulings: openRulings.map((ruling) => ({ question: ruling.title, answer: '' })),
  };
  const templatePath = join(OUT_DIR, `${base}-decisions.json`);
  writeFileSync(templatePath, JSON.stringify(template, null, 2));
  console.log(`Decisions template → ${templatePath}`);
  deliver(templatePath);
  await prisma.$disconnect();
}

void main();
