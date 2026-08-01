/**
 * REVIEWER role boundary (Phase 2 §5, David's ruling 2026-08-01):
 *   - the invite flow hands over ZERO credentials: admin sends an email,
 *     the reviewer sets their own password and enrolls TOTP, one code
 *     proves the authenticator before the role activates;
 *   - a 2FA-enrolled account cannot sign in on a password alone;
 *   - the reviewer reaches ONLY the review surfaces; every excluded route
 *     answers a real 403, server-enforced at the middleware — the evidence
 *     this spec exists to produce.
 */
import { expect, request, test } from '@playwright/test';
import { prisma } from '@cluecrew/db';
import { totpCode } from '../lib/totp';
import { staffContext, createStaff, cleanupFixtures } from './fixtures';

const EXCLUDED_ROUTES = [
  '/admin/audit',
  '/admin/bursaries',
  '/admin/reviews',
  '/admin/regions',
  '/admin/import',
];

const reviewerEmail = `e2e-invited-reviewer-${Date.now()}@cluecrew.test`;
const REVIEWER_PASSWORD = 'ReviewerOwn!2026';

test.afterAll(async () => {
  await prisma.staffInvite.deleteMany({ where: { email: reviewerEmail } });
  await prisma.parentAccount.deleteMany({ where: { email: reviewerEmail } });
  await cleanupFixtures();
});

test('invite → own password → TOTP enrolment → role active; no hand-carried credentials', async ({
  browser,
}) => {
  // An admin sends the invite from the dashboard.
  const admin = await createStaff(`inviter-${Date.now()}`, 'ADMIN');
  const adminPage = await staffContext(browser, admin);
  await adminPage.goto('/admin');
  await adminPage.fill('form[action] input[name="email"]', reviewerEmail);
  await adminPage.selectOption('select[name="role"]', 'REVIEWER');
  await adminPage.getByRole('button', { name: 'Send invite' }).click();
  await adminPage.waitForURL('**/admin?invited=1');

  const invite = await prisma.staffInvite.findUnique({ where: { email: reviewerEmail } });
  expect(invite?.role).toBe('REVIEWER');
  expect(invite?.acceptedAt).toBeNull();

  // The invitee accepts: the dev helper stands in for reading the email.
  const api = await request.newContext({ baseURL: 'http://localhost:3100' });
  const link = await api.get(`/api/dev/staff-invite-link?email=${encodeURIComponent(reviewerEmail)}`);
  const { url } = (await link.json()) as { url: string };

  const inviteePage = await (await browser.newContext()).newPage();
  await inviteePage.goto(url);
  await inviteePage.fill('input[name="password"]', REVIEWER_PASSWORD);
  const secret = (await inviteePage.getByTestId('totp-secret').innerText()).trim();
  expect(secret.length).toBeGreaterThanOrEqual(16);
  await inviteePage.fill('input[name="totpCode"]', totpCode(secret));
  await inviteePage.getByRole('button', { name: 'Activate my access' }).click();
  await inviteePage.waitForURL('**/admin?welcome=1');

  const account = await prisma.parentAccount.findUnique({ where: { email: reviewerEmail } });
  expect(account?.staffRole).toBe('REVIEWER');
  expect(account?.totpEnabledAt).not.toBeNull();
  await api.dispose();
});

test('a 2FA account refuses password-only sign-in; with the code it enters', async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/admin');
  await page.fill('input[name="email"]', reviewerEmail);
  await page.fill('input[name="password"]', REVIEWER_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Refused: still on the sign-in surface, no admin nav.
  await expect(page.getByRole('navigation', { name: 'Admin' })).toHaveCount(0);

  const account = await prisma.parentAccount.findUniqueOrThrow({ where: { email: reviewerEmail } });
  await page.goto('/admin');
  await page.fill('input[name="email"]', reviewerEmail);
  await page.fill('input[name="password"]', REVIEWER_PASSWORD);
  await page.fill('input[name="totp"]', totpCode(account.totpSecret!));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('navigation', { name: 'Admin' })).toBeVisible({ timeout: 45_000 });
});

test('the 403 wall: a REVIEWER token is refused on every excluded route', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const account = await prisma.parentAccount.findUniqueOrThrow({ where: { email: reviewerEmail } });
  await page.goto('/admin');
  await page.fill('input[name="email"]', reviewerEmail);
  await page.fill('input[name="password"]', REVIEWER_PASSWORD);
  await page.fill('input[name="totp"]', totpCode(account.totpSecret!));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('navigation', { name: 'Admin' })).toBeVisible({ timeout: 45_000 });

  // The allowed world works.
  const items = await page.goto('/admin/items');
  expect(items!.status()).toBe(200);
  const words = await page.goto('/admin/words');
  expect(words!.status()).toBe(200);
  const misconceptions = await page.goto('/admin/misconceptions');
  expect(misconceptions!.status()).toBe(200);

  // Every excluded route answers a real 403 — server-enforced, not hidden.
  for (const route of EXCLUDED_ROUTES) {
    const response = await page.goto(route);
    expect(response!.status(), `${route} must 403 for REVIEWER`).toBe(403);
  }
  // The bursary evidence API sits behind the same wall.
  const evidence = await page.request.get('/api/admin/bursary-evidence/any-id');
  expect(evidence.status()).toBe(403);
});
