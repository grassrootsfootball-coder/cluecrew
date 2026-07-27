/**
 * Phase 2 gate #9 (flow half): application → admin queue → capacity-gated
 * decision. The zero-UI-reads grep guarantee runs as a CI script.
 */
import { expect, request, test } from '@playwright/test';

const PASSWORD = 'E2eBursary!2026';
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==',
  'base64',
);

test('bursary: apply with evidence; approval is capacity-gated; waitlist works', async ({
  browser,
}) => {
  const email = `e2e-bursary-${Date.now()}@cluecrew.test`;
  const api = await request.newContext({ baseURL: 'http://localhost:3100' });
  await api.post('/api/auth/signup', {
    data: { email, password: PASSWORD, displayName: 'Bursary Parent' },
  });
  const { url } = (await (
    await api.get(`/api/dev/verification-link?email=${encodeURIComponent(email)}`)
  ).json()) as { url: string };
  await api.get(url);
  await api.dispose();

  const parentContext = await browser.newContext();
  const parentPage = await parentContext.newPage();
  await parentPage.goto('/login');
  await parentPage.fill('input[name="email"]', email);
  await parentPage.fill('input[name="password"]', PASSWORD);
  await parentPage.getByRole('button', { name: 'Sign in' }).click();
  await parentPage.waitForURL('**/parent');

  await parentPage.goto('/bursary');
  await parentPage.selectOption('select[name="confirmation"]', 'fsm');
  await parentPage.setInputFiles('input[name="evidence"]', {
    name: 'school-letter.png',
    mimeType: 'image/png',
    buffer: PNG_1PX,
  });
  await parentPage.getByRole('button', { name: 'Send application' }).click();
  await parentPage.waitForURL('**/bursary?state=received');
  await parentContext.close();

  // Admin reviews the queue.
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto('/admin');
  await adminPage.fill('input[name="email"]', 'staff-admin@cluecrew.test');
  await adminPage.fill('input[name="password"]', 'CrewStaff!2026');
  await adminPage.getByRole('button', { name: 'Sign in' }).click();
  await expect(adminPage.getByRole('navigation', { name: 'Admin' })).toBeVisible();

  await adminPage.goto('/admin/bursaries');
  const card = adminPage.locator('.cc-card', { hasText: email });
  await expect(card).toContainText('RECEIVED');
  await expect(card.getByRole('link', { name: 'school-letter.png' })).toBeVisible();

  // With few paid subscriptions, capacity is 0 → approval must be blocked.
  await card.getByRole('button', { name: 'Approve' }).click();
  await expect(adminPage.getByText('All places are currently taken')).toBeVisible();

  await adminPage
    .locator('.cc-card', { hasText: email })
    .getByRole('button', { name: 'Waitlist' })
    .click();
  await expect(adminPage.locator('.cc-card', { hasText: email })).toContainText('WAITLISTED');
  await adminContext.close();
});
