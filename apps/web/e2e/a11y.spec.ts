/**
 * WCAG 2.2 AA automated pass (BUILD-PHASE-5 §7, gate #8): axe on every route
 * family, ZERO critical violations. Serious violations are reported for the
 * manual audit but do not (yet) fail the build — the manual audit closes them.
 *
 * Every test here builds its own family (see e2e/fixtures.ts). The five
 * /crew/play audits in particular need a child with no open session and no
 * accumulated review debt: sharing one meant each test parked on whatever the
 * previous test had left behind, and the setup loop grew longer every run.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { cleanupFixtures, copyCookies, createFamily, enterCrewMode, parentApi } from './fixtures';

/** One case per mechanic family, so every engine's markup gets audited. */
const FAMILY_CASES = [
  { family: 'code', caseId: 'case-vr-11' },
  { family: 'stowaway', caseId: 'case-vr-08' },
  { family: 'wordweb', caseId: 'case-vr-04' },
  { family: 'bridge', caseId: 'case-vr-03' },
  { family: 'deduction', caseId: 'case-vr-15' },
] as const;

test.afterAll(cleanupFixtures);

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
  const family = await createFamily('a11y-parent');
  const api = await parentApi(family.email);
  await copyCookies(page, api);
  await api.dispose();

  for (const path of ['/parent', '/parent/children', '/parent/billing', '/parent/casebook', '/parent/casebook/what-the-11-plus-is', '/parent/account']) {
    await page.goto(path);
    await analyze(page, path);
  }
});

/** A family of one, signed in, with the child's crew token on the page. */
async function ownChild(
  page: Page,
  label: string,
): Promise<{ api: APIRequestContext; childId: string }> {
  const family = await createFamily(label);
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);
  return { api, childId: family.child.id };
}

test('child app routes have zero critical a11y violations', async ({ page }) => {
  const { api } = await ownChild(page, 'a11y-child');
  for (const path of [
    '/crew',
    '/crew/district',
    '/crew/vault',
    '/crew/casefile',
    '/crew/case/case-vr-11',
  ]) {
    await page.goto(path);
    await analyze(page, path);
  }
  await api.dispose();
});

// One test per mechanic family rather than a single loop: each engine renders
// its own markup, so auditing one proves nothing about the other four — and it
// was this screen that hid the prohibited-ARIA defects while it went unloaded.
// Split so a slow or failing engine is isolated, retried and named on its own
// instead of consuming one shared deadline.
for (const { family, caseId } of FAMILY_CASES) {
  test(`/crew/play has zero critical a11y violations [${family}]`, async ({ page }) => {
    // Parking walks a short run of sequential API calls; CI is several times
    // slower than a laptop, so this needs more than the 60s default.
    test.setTimeout(180_000);
    const { api, childId } = await ownChild(page, `a11y-${family}`);
    const session = `/api/crew/${childId}/session`;
    // This child was created seconds ago, so there is no earlier session for
    // POST to resume and no review debt to clear first — the case asked for is
    // the case that gets served.
    await api.post(session, { data: { caseId } });

    let parked = false;
    for (let step = 0; step < 60 && !parked; step++) {
      const current = (await (await api.get(`${session}/activity`)).json()) as {
        kind: string;
        activityKind?: string;
        plain?: boolean;
        family?: string;
        options?: Array<{ id: string }>;
      };
      if (current.kind === 'item' && current.activityKind === 'practice_item' && !current.plain) {
        expect(current.family, `expected the ${family} engine for ${caseId}`).toBe(family);
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
    expect(parked, `could not reach a practice item for the ${family} engine`).toBe(true);
    await api.dispose();

    await page.goto('/crew/play');
    // The mechanic mounts client-side — audit once the choices are on stage.
    await page.locator('[role="group"][aria-label="Answer choices"]').first().waitFor();
    await analyze(page, `/crew/play [${family}]`);
  });
}
