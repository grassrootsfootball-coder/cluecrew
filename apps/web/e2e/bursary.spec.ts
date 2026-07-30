/**
 * Phase 2 gate #9 (flow half): application → admin queue → capacity-gated
 * decision. The zero-UI-reads grep check runs as a CI script.
 *
 * Both accounts are this test's own: the applicant parent, and the admin who
 * reviews the queue. The admin used to be the shared seed account, and its
 * sign-in was one of the two order-dependent failures in the suite.
 */
import { expect, test } from '@playwright/test';
import { cleanupFixtures, createFamily, createStaff, signInAsParent, staffContext } from './fixtures';

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==',
  'base64',
);

test.afterAll(cleanupFixtures);

test('bursary: apply with evidence; approval is capacity-gated; waitlist works', async ({
  browser,
}) => {
  const applicant = await createFamily('bursary-applicant');
  const admin = await createStaff('bursary', 'ADMIN');

  const parentContext = await browser.newContext();
  const parentPage = await parentContext.newPage();
  await signInAsParent(parentPage, applicant.email);

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
  const adminPage = await staffContext(browser, admin);
  await adminPage.goto('/admin/bursaries');
  const card = adminPage.locator('.cc-card', { hasText: applicant.email });
  await expect(card).toContainText('RECEIVED');
  await expect(card.getByRole('link', { name: 'school-letter.png' })).toBeVisible();

  // With few paid subscriptions, capacity is 0 → approval must be blocked.
  await card.getByRole('button', { name: 'Approve' }).click();
  await expect(adminPage.getByText('All places are currently taken')).toBeVisible();

  await adminPage
    .locator('.cc-card', { hasText: applicant.email })
    .getByRole('button', { name: 'Waitlist' })
    .click();
  await expect(adminPage.locator('.cc-card', { hasText: applicant.email })).toContainText(
    'WAITLISTED',
  );
  await adminPage.context().close();
});
