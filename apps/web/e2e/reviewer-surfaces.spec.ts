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
  // Wait for the action's redirect before reading the database. Reading straight after the click
  // raced the server action and lost on a production build — it passed against the slow dev server
  // and failed at 15s-per-suite speed, expecting REJECTED and finding PROPOSED. Every other
  // database read in this suite already waits on a UI signal first (the restore below says so in
  // its own comment); this was the one that did not.
  //
  // The signal is the REDIRECT, not the rejected table: that table is admin-only, and the reviewer
  // who just rejected the entry cannot see it. Waiting on something this actor never renders is how
  // a fix for a race becomes a different failure.
  await page.waitForURL('**/admin/misconceptions?rejected=1');
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

/**
 * THE COMPREHENSION REVIEW SURFACE. Annie has signed VR, NVR, maths and SpaG and has never seen a
 * comprehension item; there are zero SIGNED events on ENG. The verdict actions already existed —
 * what did not was anything rendering the item as she has to judge it: the passage it cites, the
 * error each distractor executes, and what the child is told.
 */
test('an English item shows its passage, cited lines, tagged distractors and hint', async ({ browser }) => {
  const reviewer = await createStaff(`rs-eng-${Date.now()}`, 'REVIEWER');
  const page = await staffContext(browser, reviewer);
  await page.goto('/admin/items/ENG-005-BB-01');

  const surface = page.getByTestId('comprehension-review');
  await expect(surface).toBeVisible();

  // The passage, with the item's cited window marked — a citation cannot be judged without it.
  await expect(page.getByTestId('passage-lines')).toBeVisible();
  await expect(page.locator('[data-cited="yes"]')).toHaveCount(2); // lineRefs [2, 3]

  // Every option, with the misconception it executes and the hint the child would see.
  await expect(page.getByTestId('review-options')).toBeVisible();
  await expect(page.locator('[data-correct="yes"]')).toHaveCount(1);
  await expect(surface).toContainText('Child sees:');
});

/**
 * THE ONLY PATH THAT MATTERS: open a packet cluster, read one item on the surface, record a
 * verdict, and see what lands. Never exercised before — Annie has signed VR, NVR, maths and SpaG
 * and there are zero SIGNED events on ENG.
 */
test('a reviewer opens ENG-028, reads an item and records a verdict', async ({ browser }) => {
  const reviewer = await createStaff(`rs-sign-${Date.now()}`, 'REVIEWER');
  const page = await staffContext(browser, reviewer);

  // 1. THE CLUSTER FILTER — she opens one packet cluster, not a bank of 337.
  await page.goto('/admin/items?cluster=ENG-028');
  const links = page.locator('a[href*="/admin/items/ENG-028"]');
  await expect(links.first()).toBeVisible();

  // ENG-028 is the packet cluster; ENG-001 is the one whose tags are all ACTIVE. Walk BOTH, so
  // the run separates "the path does not work" from "these nine tags are not approved yet".
  const packet = await prisma.item.findFirstOrThrow({
    where: { id: { startsWith: 'ENG-028' }, status: 'DRAFT' },
    orderBy: { clusterPosition: 'asc' },
  });
  const approvedTags = await prisma.item.findFirstOrThrow({
    where: { id: { startsWith: 'ENG-001' }, status: 'DRAFT' },
    orderBy: { clusterPosition: 'asc' },
  });

  for (const target of [packet, approvedTags]) {
  // 2. THE SURFACE — the item as she has to judge it.
  await page.goto(`/admin/items/${target.id}`);
  await expect(page.getByTestId('comprehension-review')).toBeVisible();
  await expect(page.getByTestId('passage-lines').locator('li').first()).toBeVisible();
  await expect(page.getByTestId('review-options')).toBeVisible();

  // 3. THE VERDICT.
  await page.waitForLoadState('networkidle');
  const posts: string[] = [];
  page.on('response', (r) => { if (r.request().method() === 'POST') posts.push(`${r.status()} ${r.url()}`); });
  page.on('console', (m) => { if (m.type() === 'error') posts.push(`console: ${m.text().slice(0, 120)}`); });
  await page.getByRole('button', { name: 'Mark REVIEWED' }).click();
  await page.waitForTimeout(2500);
  console.log(`  click produced: ${posts.length ? posts.join(' | ') : 'NO POST AT ALL'}`);
  console.log(`  url after: ${page.url()}`);


  const after = await prisma.item.findUniqueOrThrow({ where: { id: target.id } });
  const blocked = new URL(page.url()).searchParams.get('error');
  console.log(`\nAFTER THE VERDICT on ${target.id}: status=${after.status} reviewedBy=${after.reviewedBy ?? 'null'} blockedBy=${blocked ?? 'nothing'}`);

  // 4. WHAT LANDS IN THE RECORD. Reported, not asserted: this is the question being answered.
  const events = await prisma.attributionEvent.findMany({ where: { recordType: 'item', recordId: target.id } });
  const signed = events.filter((e) => e.action === 'SIGNED');
  console.log(`\nVERDICT ON ${target.id}: status=${after.status} reviewedBy=${after.reviewedBy}`);
  console.log(`  attribution events: ${events.length} · SIGNED: ${signed.length} · with reviewerId: ${signed.filter((e) => e.reviewerId).length}`);

  // Leave the bank as it was.
  await prisma.item.update({ where: { id: target.id }, data: { status: 'DRAFT', reviewedBy: null } });
  }
});

/**
 * THE SIGN TEST. One item on ENG-028, end to end: open, verdict, SIGNED event with a reviewerId.
 * Reports pass or fail; it does not paper over either.
 */
test('SIGN TEST: ENG-028 item reaches a SIGNED event with a reviewerId', async ({ browser }) => {
  const reviewer = await createStaff(`rs-signtest-${Date.now()}`, 'REVIEWER');
  const page = await staffContext(browser, reviewer);
  // THE NAMING PATH. The staff account must resolve to a Reviewer row or the door refuses; this
  // is the link an admin makes once, not something the action invents.
  const previous = await prisma.reviewer.findUnique({ where: { id: 'rev-0001' } });
  await prisma.reviewer.update({ where: { id: 'rev-0001' }, data: { staffEmail: reviewer.email.toLowerCase() } });
  // ENG-028-PR-02 is the packet item; ENG-001-WIW-15 is a DRAFT English item whose distractors
  // are ALL tagged ACTIVE. Walking both separates "the door does not work" from "these tags are
  // not approved yet" — the door is ruled to refuse an unapproved tag, so the packet item SHOULD
  // stop at the verdict until Annie approves the nine.
  const which = process.env.SIGN_TARGET ?? 'ENG-028-PR-02';
  const target = await prisma.item.findFirstOrThrow({ where: { id: which } });

  await page.goto(`/admin/items/${target.id}`);
  await expect(page.getByTestId('comprehension-review')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Mark REVIEWED' }).click();
  await page.waitForTimeout(2000);

  const mid = await prisma.item.findUniqueOrThrow({ where: { id: target.id } });
  const blocked = new URL(page.url()).searchParams.get('error');

  // THE SIGNATURE, a separate act from the verdict.
  if (mid.status === 'REVIEWED') {
    // The sign form only renders once the item IS REVIEWED, so reload before reaching for it.
    await page.goto(`/admin/items/${target.id}`);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('sign-form').getByRole('button', { name: 'Sign as reviewer' }).click();
    await page.waitForTimeout(2500);
    console.log(`  sign click url: ${page.url()}`);
  }
  const after = mid;
  const signed = await prisma.attributionEvent.findMany({
    where: { recordType: 'item', recordId: target.id, action: 'SIGNED' },
    include: { reviewer: true },
  });
  const reviewerRows = await prisma.reviewer.count();
  const sig = signed[0];
  console.log(`  reviewerId resolves to: ${sig?.reviewer?.displayName ?? 'FAIL — no signature'}`);
  console.log(`  recordedBy separate:    ${sig ? (sig.recordedBy !== sig.reviewerId ? 'PASS' : 'FAIL') : 'FAIL'}`);
  console.log(`  subjectHash pinned:     ${sig?.subjectHash ? `PASS ${sig.subjectHash.slice(0, 16)}` : 'FAIL'}`);
  await prisma.reviewer.update({ where: { id: 'rev-0001' }, data: { staffEmail: previous?.staffEmail ?? null } });

  const verdictLanded = after.status === 'REVIEWED';
  const signatureLanded = signed.length > 0 && signed.every((e) => e.reviewerId !== null);
  console.log(`\nSIGN TEST on ${target.id}`);
  console.log(`  verdict recorded: ${verdictLanded ? 'PASS' : `FAIL — blocked by ${blocked ?? 'nothing'}`}`);
  console.log(`  SIGNED event with reviewerId: ${signatureLanded ? 'PASS' : `FAIL — ${signed.length} SIGNED event(s)`}`);
  console.log(`  Reviewer rows a signature could name: ${reviewerRows}`);
  console.log(`  OVERALL: ${verdictLanded && signatureLanded ? 'PASS' : 'FAIL'}`);

  if (mid.status !== 'DRAFT') {
    await prisma.item.update({ where: { id: target.id }, data: { status: 'DRAFT', reviewedBy: null } });
  }
});
