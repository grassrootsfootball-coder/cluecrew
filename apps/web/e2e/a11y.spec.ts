/**
 * WCAG 2.2 AA automated pass (BUILD-PHASE-5 §7, gate #8): axe on every route
 * family, ZERO critical violations. Serious violations are reported for the
 * manual audit but do not (yet) fail the build — the manual audit closes them.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, request, test, type Page } from '@playwright/test';

async function analyze(page: Page, label: string): Promise<void> {
  // Tag filtering alone let a real defect through: aria-prohibited-attr is not
  // carried by the wcag2*/wcag22aa tags, so aria-label on generic <div>/<span>
  // elements — silently discarded by screen readers — scored a clean 100 here
  // while Lighthouse's broader rule set caught it. The ARIA rules are included
  // explicitly rather than widening to every best-practice rule.
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .withRules(['aria-prohibited-attr', 'aria-allowed-attr', 'aria-required-attr'])
    .analyze();
  const critical = results.violations.filter((violation) => violation.impact === 'critical');
  const serious = results.violations.filter((violation) => violation.impact === 'serious');
  if (serious.length > 0) {
    console.log(`[a11y] ${label}: ${serious.length} serious finding(s) for the manual audit:`);
    for (const violation of serious) console.log(`  - ${violation.id}: ${violation.help}`);
  }
  expect(critical, `${label} must have zero critical a11y violations`).toEqual([]);
}

test('marketing and auth routes have zero critical a11y violations', async ({ page }) => {
  for (const path of ['/', '/pricing', '/faq', '/safeguarding', '/accessibility', '/privacy', '/bursary', '/login', '/signup', '/casebook-sample', '/11-plus/kent']) {
    await page.goto(path);
    await analyze(page, path);
  }
});

test('parent HQ routes have zero critical a11y violations', async ({ page }) => {
  const api = await request.newContext({ baseURL: 'http://localhost:3100' });
  const { csrfToken } = (await (await api.get('/api/auth/csrf')).json()) as { csrfToken: string };
  await api.post('/api/auth/callback/credentials', {
    form: { csrfToken, email: 'test-family@cluecrew.test', password: 'CrewTest!2026' },
  });
  const cookies = (await api.storageState()).cookies;
  await page.context().addCookies(
    cookies.map((cookie) => ({ name: cookie.name, value: cookie.value, domain: 'localhost', path: '/' })),
  );
  await api.dispose();

  for (const path of ['/parent', '/parent/children', '/parent/billing', '/parent/casebook', '/parent/casebook/what-the-11-plus-is', '/parent/account']) {
    await page.goto(path);
    await analyze(page, path);
  }
});

test('child app routes have zero critical a11y violations', async ({ page }) => {
  const api = await request.newContext({ baseURL: 'http://localhost:3100' });
  const { csrfToken } = (await (await api.get('/api/auth/csrf')).json()) as { csrfToken: string };
  await api.post('/api/auth/callback/credentials', {
    form: { csrfToken, email: 'test-family@cluecrew.test', password: 'CrewTest!2026' },
  });
  const children = (await (await api.get('/api/parent/children')).json()) as {
    children: Array<{ id: string }>;
  };
  const childId = children.children[0]!.id;
  await api.post('/api/child-session', { data: { childId } });
  const crewToken = (await api.storageState()).cookies.find((cookie) => cookie.name === 'crew_token')!;
  await page.context().addCookies([
    { name: 'crew_token', value: crewToken.value, domain: 'localhost', path: '/' },
  ]);

  for (const path of ['/crew', '/crew/district', '/crew/vault', '/crew/case/case-vr-11']) {
    await page.goto(path);
    await analyze(page, path);
  }

  // Park the session on a practice item so /crew/play is audited with a
  // mechanic engine, the Alphabet Rail and the mascot all on stage — the
  // heaviest and most-used screen in the product, and the one whose ARIA
  // defects went unnoticed while it was never loaded here. Parked last so
  // nothing audited in between can disturb the session state.
  const session = `/api/crew/${childId}/session`;
  await api.post(session, { data: {} });
  let parked = false;
  for (let step = 0; step < 60 && !parked; step++) {
    const current = (await (await api.get(`${session}/activity`)).json()) as {
      kind: string;
      activityKind?: string;
      plain?: boolean;
      options?: Array<{ id: string }>;
    };
    if (current.kind === 'item' && current.activityKind === 'practice_item' && !current.plain) {
      parked = true;
      break;
    }
    if (current.kind === 'item' || current.kind === 'word_review') {
      await api.post(`${session}/answer`, {
        data: { optionId: current.options?.[0]?.id, secondsElapsed: 5 },
      });
    } else if (current.kind === 'word_collect') {
      await api.post(`${session}/answer`, { data: { secondsElapsed: 3 } });
    } else if (current.kind === 'mode_content') {
      await api.post(`${session}/mode`, { data: { action: 'decline' } });
    } else if (current.kind === 'teachback') {
      await api.post(`${session}/teachback`, {
        data: { stepIndex: 0, correctionIndex: 0, secondsElapsed: 5 },
      });
    } else {
      break;
    }
  }
  expect(parked, 'could not reach a practice item to audit /crew/play').toBe(true);
  await api.dispose();

  await page.goto('/crew/play');
  // The mechanic mounts client-side, and under `next dev` this route compiles
  // on first hit — audit it only once the answer choices are actually on stage.
  await page
    .locator('[role="group"][aria-label="Answer choices"]')
    .first()
    .waitFor({ timeout: 60_000 });
  await analyze(page, '/crew/play');
});
