/**
 * THE RENDER SWEEP — every English item through the reviewer surface, logged.
 *
 * The surface was verified on ONE item. Annie will open hundreds, and every rendering fault she
 * hits reads to her as a defect in the ITEM rather than in the screen. This opens each one and logs
 * what is missing.
 *
 * LOG ONLY. It asserts nothing and fails nothing — the output is the deliverable. Run explicitly;
 * it is not wired into CI.
 *
 * ORDER: ENG-001 first, because it is the packet cluster and the hard case (every item carries five
 * options where the rest of the bank carries four).
 */
import { test } from '@playwright/test';
import { prisma } from '@cluecrew/db';
import { cleanupFixtures, createStaff, staffContext } from './fixtures';

test.afterAll(async () => { await cleanupFixtures(); });

interface Fault { id: string; what: string }

test('render sweep over every English item', async ({ browser }) => {
  test.setTimeout(20 * 60 * 1000);
  const reviewer = await createStaff(`rs-sweep-${Date.now()}`, 'REVIEWER');
  const page = await staffContext(browser, reviewer);

  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } },
    include: { options: true },
    orderBy: [{ id: 'asc' }],
  });
  // Packet clusters first.
  const order = [...items].sort((a, b) => {
    const rank = (id: string) => (id.startsWith('ENG-001') ? 0 : id.startsWith('ENG-028') ? 1 : 2);
    return rank(a.id) - rank(b.id) || a.id.localeCompare(b.id);
  });

  const tagIds = [...new Set(items.flatMap((i) => i.options.map((o) => o.misconceptionId)).filter((m): m is string => m !== null))];
  const lib = Object.fromEntries((await prisma.misconception.findMany({
    where: { id: { in: tagIds } }, select: { id: true, description: true, childHint: true, status: true },
  })).map((m) => [m.id, m]));

  const faults: Fault[] = [];
  const log = (id: string, what: string) => faults.push({ id, what });
  let rendered = 0;

  for (const item of order) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const explanation = (item.explanation ?? {}) as Record<string, unknown>;
    const refs = Array.isArray(item.lineRefs) ? (item.lineRefs as number[]) : [];
    const quotes = Array.isArray(stem.quotes) ? (stem.quotes as unknown[]) : [];

    const res = await page.goto(`/admin/items/${item.id}`, { waitUntil: 'domcontentloaded' });
    if (!res || res.status() >= 400) { log(item.id, `page returned ${res?.status() ?? 'no response'}`); continue; }
    const surface = page.getByTestId('comprehension-review');
    if (await surface.count() === 0) { log(item.id, 'no review surface rendered'); continue; }
    rendered += 1;

    // 1. PASSAGE + LINE NUMBERS
    const lineCount = await page.getByTestId('passage-lines').locator('li').count();
    if (typeof stem.passageRef === 'string' && lineCount === 0) log(item.id, `passage ${String(stem.passageRef)} declared but no lines rendered`);
    if (typeof stem.passageRef !== 'string') log(item.id, 'no passageRef declared');

    // 2. CITED WINDOW == lineRefs
    if (lineCount > 0) {
      const highlighted = await page.locator('[data-cited="yes"]').count();
      if (highlighted !== refs.length) log(item.id, `highlighted ${highlighted} line(s), lineRefs has ${refs.length}`);
    }

    // 3. STEM + declared quotations
    const stemText = (await page.getByTestId('stem-text').textContent()) ?? '';
    if (!stemText.trim()) log(item.id, 'stem renders empty');
    if (quotes.length) {
      const shown = await page.getByTestId('stem-quotes').locator('li').count();
      if (shown !== quotes.length) log(item.id, `${quotes.length} quotation(s) declared, ${shown} rendered`);
    }

    // 4/5/6. OPTIONS: key flag, tag, execution note, description, hint
    const rows = await page.getByTestId('review-options').locator('tbody tr').count();
    if (rows !== item.options.length) log(item.id, `${item.options.length} options stored, ${rows} rendered`);
    const keys = await page.locator('[data-correct="yes"]').count();
    if (keys !== 1) log(item.id, `${keys} option(s) marked KEY`);
    const body = (await surface.textContent()) ?? '';
    for (const o of item.options) {
      if (o.isCorrect) continue;
      if (!o.misconceptionId) { log(item.id, 'an incorrect option carries no misconception'); continue; }
      const m = lib[o.misconceptionId];
      if (!m) { log(item.id, `${o.misconceptionId} is not in the library`); continue; }
      if (!m.description?.trim()) log(item.id, `${o.misconceptionId} has NO DESCRIPTION — renders blank`);
      if (!m.childHint?.trim()) log(item.id, `${o.misconceptionId} has NO CHILD HINT — renders blank`);
      if (m.status !== 'ACTIVE') log(item.id, `${o.misconceptionId} is ${m.status}, not ACTIVE`);
      if (!o.misconceptionExecution?.trim()) log(item.id, `option tagged ${o.misconceptionId} has no execution note`);
      if (m.description?.trim() && !body.includes(m.description.slice(0, 30))) log(item.id, `${o.misconceptionId} description not on the page`);
    }

    // 7. WALK SCRIPT
    const walk = Array.isArray(explanation.walkScript) ? (explanation.walkScript as unknown[]) : [];
    const walkShown = await page.getByTestId('walk-script').locator('li').count();
    if (walk.length === 0) log(item.id, 'no walk script stored');
    else if (walkShown !== walk.length) log(item.id, `${walk.length} walk step(s) stored, ${walkShown} rendered`);
  }

  const byWhat = faults.reduce<Record<string, string[]>>((a, f) => {
    const k = f.what.replace(/^[\w-]+ /, (m) => (m.startsWith('en-') ? 'TAG ' : m));
    (a[k] ??= []).push(f.id);
    return a;
  }, {});

  console.log(`\nRENDER SWEEP — ${rendered} of ${order.length} items rendered a surface · ${faults.length} fault(s)\n`);
  for (const [what, ids] of Object.entries(byWhat).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`${String(ids.length).padStart(4)}  ${what}`);
    console.log(`      ${ids.slice(0, 8).join(', ')}${ids.length > 8 ? ` … +${ids.length - 8}` : ''}`);
  }
});
