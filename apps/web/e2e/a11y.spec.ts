/**
 * WCAG 2.2 AA automated pass (BUILD-PHASE-5 §7, gate #8): axe on every route
 * family, ZERO critical violations. Serious violations are reported for the
 * manual audit but do not (yet) fail the build — the manual audit closes them.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, request, test, type Page } from '@playwright/test';

async function analyze(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
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
  await api.post('/api/child-session', { data: { childId: children.children[0]!.id } });
  const crewToken = (await api.storageState()).cookies.find((cookie) => cookie.name === 'crew_token')!;
  await page.context().addCookies([
    { name: 'crew_token', value: crewToken.value, domain: 'localhost', path: '/' },
  ]);
  await api.dispose();

  for (const path of ['/crew', '/crew/district', '/crew/vault', '/crew/case/case-vr-11']) {
    await page.goto(path);
    await analyze(page, path);
  }
});
