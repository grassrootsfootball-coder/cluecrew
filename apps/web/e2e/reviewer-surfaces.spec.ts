/**
 * The reviewer's own surfaces (David's approved follow-ups, 2026-08-02):
 * soft reject with a confirmation step, a nav that only offers doors that
 * open, bulk approve as yourself, and landing back at the queue rather than
 * the top of the page.
 *
 * Every row this touches is one it created (`zz-e2e-` prefix) and deletes.
 * It never decides a real proposal.
 */
import { expect, test } from '@playwright/test';
import { prisma } from '@cluecrew/db';
import { cleanupFixtures, createStaff, staffContext } from './fixtures';

const PREFIX = 'zz-e2e-rs-';

test.afterAll(async () => {
  await prisma.adminAuditLog.deleteMany({ where: { targetId: { startsWith: PREFIX } } });
  await prisma.misconception.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await cleanupFixtures();
});

async function seed(count: number): Promise<string[]> {
  const ids: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const id = `${PREFIX}${Date.now()}-${index}`;
    await prisma.misconception.create({
      data: {
        id,
        district: 'VR',
        description: `Queue entry ${index}`,
        childHint: 'Have another go — check each part.',
        status: 'PROPOSED',
        proposedBy: 'ai-corpus:v1',
        sourcePattern: 'corpus:test',
      },
    });
    ids.push(id);
  }
  return ids;
}

/**
 * SAFETY RULE FOR THIS FILE: only ever tick checkboxes for ids this test
 * created. `select-all` on a shared dev database ticks the REAL corpus
 * backlog too — which is exactly how an earlier version of this test
 * approved all 71 live proposals under a throwaway fixture account.
 */
test('a reviewer bulk-approves as themselves — their own name, no recorder', async ({ browser }) => {
  const ids = await seed(3);
  const reviewer = await createStaff(`rs-rev-${Date.now()}`, 'REVIEWER');
  const page = await staffContext(browser, reviewer);
  await page.goto('/admin/misconceptions');

  await expect(page.getByTestId('bulk-approve-form')).toBeVisible();
  for (const id of ids) await page.locator(`input[name="ids"][value="${id}"]`).check();
  await page.getByTestId('bulk-approve-submit').click();

  await expect(page.getByRole('status')).toContainText('3 approved');
  const rows = await prisma.misconception.findMany({ where: { id: { in: ids } } });
  for (const row of rows) {
    expect(row.status).toBe('ACTIVE');
    expect(row.approvedBy).toBe(`human:${reviewer.email}`);
    // In-platform: nobody transcribed this, so there is no recorder.
    expect(row.recordedBy).toBeNull();
    expect(row.approvalMethod).toBe('in-platform');
  }
});

test('select-all ticks the whole queue in one click', async ({ browser }) => {
  const ids = await seed(4);
  const reviewer = await createStaff(`rs-all-${Date.now()}`, 'REVIEWER');
  const page = await staffContext(browser, reviewer);
  await page.goto('/admin/misconceptions');
  await page.getByTestId('select-all').first().click();
  const count = await page.getByTestId('selected-count').first().textContent();
  expect(Number(count!.replace(/\D/g, ''))).toBeGreaterThanOrEqual(ids.length);
  // Clear again: this test never submits, and a stray tick must not survive.
  await page.getByTestId('select-none').first().click();
  await expect(page.getByTestId('selected-count').first()).toHaveText('0 selected');
});

test('rejecting takes two clicks, keeps the row, and an admin can restore it', async ({ browser }) => {
  const [id] = await seed(1);
  const reviewer = await createStaff(`rs-rej-${Date.now()}`, 'REVIEWER');
  const page = await staffContext(browser, reviewer);
  await page.goto('/admin/misconceptions');

  // First click only ASKS.
  await page.locator(`#m-${id}`).getByRole('link', { name: 'Reject this one…' }).click();
  await expect(page.getByTestId('confirm-reject')).toBeVisible();
  expect(await prisma.misconception.findUnique({ where: { id: id! } })).toMatchObject({
    status: 'PROPOSED',
  });

  // Second click does it — and the row survives.
  await page.getByTestId('confirm-reject-submit').click();
  const rejectedRow = await prisma.misconception.findUnique({ where: { id: id! } });
  expect(rejectedRow).not.toBeNull();
  expect(rejectedRow!.status).toBe('REJECTED');
  expect(rejectedRow!.rejectedBy).toBe(`human:${reviewer.email}`);

  // A rejected entry is as unusable as a proposal: only ACTIVE serves.
  const usable = await prisma.misconception.count({ where: { id: id!, status: 'ACTIVE' } });
  expect(usable).toBe(0);

  // The admin sees it and can put it back.
  const admin = await createStaff(`rs-adm-${Date.now()}`, 'ADMIN');
  const adminPage = await staffContext(browser, admin);
  await adminPage.goto('/admin/misconceptions');
  await expect(adminPage.getByTestId(`rejected-${id}`)).toBeVisible();
  await adminPage.getByTestId(`restore-${id}`).click();
  // The action redirects; wait for the row to leave the rejected table rather
  // than racing the server.
  await expect(adminPage.getByTestId(`rejected-${id}`)).toHaveCount(0);
  expect(await prisma.misconception.findUnique({ where: { id: id! } })).toMatchObject({
    status: 'PROPOSED',
    rejectedBy: null,
  });
});

test('the nav offers a reviewer only doors that open', async ({ browser }) => {
  const reviewer = await createStaff(`rs-nav-${Date.now()}`, 'REVIEWER');
  const page = await staffContext(browser, reviewer);
  await page.goto('/admin');
  const nav = page.getByRole('navigation', { name: 'Admin' });

  for (const hidden of ['Bulk import', 'Regions', 'Bursaries', 'Audit log']) {
    await expect(nav.getByRole('link', { name: hidden })).toHaveCount(0);
  }
  for (const shown of ['Misconceptions', 'Items', 'Words']) {
    await expect(nav.getByRole('link', { name: shown })).toBeVisible();
  }

  // Every link the nav DOES offer must actually open — the whole point.
  const hrefs = await nav.getByRole('link').evaluateAll((links) =>
    links.map((link) => (link as HTMLAnchorElement).getAttribute('href')!),
  );
  for (const href of hrefs) {
    const response = await page.goto(href);
    expect(response?.status(), `${href} should open for a reviewer`).toBeLessThan(400);
  }
});

test('an admin still sees the full nav', async ({ browser }) => {
  const admin = await createStaff(`rs-navadm-${Date.now()}`, 'ADMIN');
  const page = await staffContext(browser, admin);
  await page.goto('/admin');
  const nav = page.getByRole('navigation', { name: 'Admin' });
  await expect(nav.getByRole('link', { name: 'Audit log' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Regions' })).toBeVisible();
});

test('approving lands back at the queue, not the top of the page', async ({ browser }) => {
  const ids = await seed(2);
  const reviewer = await createStaff(`rs-scroll-${Date.now()}`, 'REVIEWER');
  const page = await staffContext(browser, reviewer);
  await page.setViewportSize({ width: 1100, height: 500 });
  await page.goto('/admin/misconceptions');
  for (const id of ids) await page.locator(`input[name="ids"][value="${id}"]`).check();
  await page.getByTestId('bulk-approve-submit').click();
  await expect(page.getByRole('status')).toBeVisible();
  // The behaviour that matters is where the reader ends up, not the URL: the
  // queue heading must be on screen without scrolling.
  await expect(page.locator('#queue')).toBeInViewport();
});
