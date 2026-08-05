/**
 * Recording a decision made away from the platform (David's ruling,
 * 2026-08-02). The thing under test is the DISTINCTION: whose judgement it
 * was, versus who typed it in, must survive into the record and the audit log
 * and must be impossible to merge.
 *
 * Every misconception this test touches is one it created, with a `zz-e2e-`
 * prefix, and it deletes them afterwards. It never approves a real proposal.
 */
import { expect, test } from '@playwright/test';
import { prisma } from '@cluecrew/db';
import { cleanupFixtures, createStaff, staffContext } from './fixtures';

const PREFIX = 'zz-e2e-verbal-';

test.afterAll(async () => {
  await prisma.adminAuditLog.deleteMany({ where: { targetId: { startsWith: PREFIX } } });
  await prisma.misconception.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await cleanupFixtures();
});

async function seedProposals(count: number): Promise<string[]> {
  const ids: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const id = `${PREFIX}${Date.now()}-${index}`;
    await prisma.misconception.create({
      data: {
        id,
        district: 'VR',
        description: `Test proposal ${index}`,
        childHint: 'Have another go — read it again.',
        status: 'PROPOSED',
        proposedBy: 'ai-corpus:v1',
        sourcePattern: 'corpus:test',
      },
    });
    ids.push(id);
  }
  return ids;
}

test('an admin records a reviewer’s verbal decisions in bulk, and both names survive', async ({
  browser,
}) => {
  const ids = await seedProposals(3);
  const reviewer = await createStaff(`verbal-rev-${Date.now()}`, 'REVIEWER');
  const admin = await createStaff(`verbal-adm-${Date.now()}`, 'ADMIN');
  const page = await staffContext(browser, admin);
  await page.goto('/admin/misconceptions');

  // The recording panel is a catch-up tool, not the standing process, so it
  // lives behind a disclosure (2026-08-02 restructure).
  await page.getByText('Recording decisions made away from the screen').click();
  const form = page.getByTestId('bulk-record-form');
  await form.getByLabel('Whose decision was this?').selectOption({ label: `Fixture REVIEWER (${reviewer.email})` });
  await form.getByLabel('What did they say?').fill('Approved at the sitting; no changes asked for.');
  for (const id of ids) await form.locator(`input[name="ids"][value="${id}"]`).check();
  await page.getByTestId('bulk-record-submit').click();

  await expect(page.getByRole('status')).toContainText('Recorded 3');

  const rows = await prisma.misconception.findMany({ where: { id: { in: ids } } });
  for (const row of rows) {
    expect(row.status).toBe('ACTIVE');
    // The distinction, in the record itself.
    expect(row.approvedBy).toBe(`human:${reviewer.email}`);
    expect(row.recordedBy).toBe(`human:${admin.email}`);
    expect(row.approvedBy).not.toBe(row.recordedBy);
    expect(row.approvalMethod).toContain('verbal');
    expect(row.approvalNote).toContain('Approved at the sitting');
  }

  // One audit row PER RECORD, each naming both people.
  const audit = await prisma.adminAuditLog.findMany({ where: { targetId: { in: ids } } });
  expect(audit).toHaveLength(3);
  for (const entry of audit) {
    const detail = entry.detail as { approvedBy: string; recordedBy: string };
    expect(entry.action).toBe('misconception.approve_recorded');
    expect(detail.approvedBy).toBe(`human:${reviewer.email}`);
    expect(detail.recordedBy).toBe(`human:${admin.email}`);
  }

  // The audit page shows both, in separate columns.
  await page.goto('/admin/audit');
  const decider = page.getByTestId('audit-decider').first();
  await expect(decider).toContainText(reviewer.email);
  await expect(page.getByTestId('audit-recorder').first()).toContainText(admin.email);
});

test('a reviewer cannot reach the record-for-someone-else form', async ({ browser }) => {
  await seedProposals(1);
  const reviewer = await createStaff(`verbal-rev2-${Date.now()}`, 'REVIEWER');
  const page = await staffContext(browser, reviewer);
  await page.goto('/admin/misconceptions');
  // A reviewer decides as themselves; the one-at-a-time buttons are theirs.
  await expect(page.getByTestId('bulk-record-form')).toHaveCount(0);
  // A reviewer decides as themselves — bulk as the primary path, plus the
  // one-at-a-time buttons behind the disclosure.
  await expect(page.getByTestId('bulk-approve-form')).toBeVisible();
  await page.getByText('Or decide them one at a time').click();
  await expect(page.getByRole('button', { name: /Approve — question writers/ }).first()).toBeVisible();
});

test('the queue explains itself without training', async ({ browser }) => {
  await seedProposals(1);
  const admin = await createStaff(`verbal-adm2-${Date.now()}`, 'ADMIN');
  const page = await staffContext(browser, admin);
  await page.goto('/admin/misconceptions');
  // What it is, what happens if I approve, and what happens if I do nothing.
  await expect(page.locator('#queue')).toContainText('Waiting for your decision');
  const queue = page.getByTestId('proposed-queue');
  await expect(queue).toContainText('Nothing here is in use');
  await expect(queue).toContainText('never reaches a child');
});
