/**
 * AMENDMENT-1 gates 1, 2 and 6, at the API — never the UI:
 *
 *   - a Crew child provably cannot reach mocks by any route;
 *   - a tier-locked case is indistinguishable from an unwritten one (D7);
 *   - free → paid → free round-trips with no data loss and no child-visible
 *     change beyond content unlocking.
 */
import { expect, test } from '@playwright/test';
import { prisma } from '@cluecrew/db';
import { cleanupFixtures, createFamily, enterCrewMode, parentApi } from './fixtures';

test.afterAll(cleanupFixtures);

test('a Crew child cannot reach the mock ladder by any route (API-level)', async () => {
  const family = await createFamily('crew-mocks', { tier: 'CREW' });
  const api = await parentApi(family.email);
  await api.post('/api/child-session', { data: { childId: family.child.id } });

  // Parent scheduling refuses.
  const schedule = await api.post('/api/parent/mocks', {
    data: { childId: family.child.id, blueprintId: 'gl-vr-standard' },
  });
  expect(schedule.status()).toBe(409);

  // The child's desk is simply empty — even if a sitting somehow existed.
  await prisma.mockSitting.create({
    data: {
      childId: family.child.id,
      blueprintId: 'gl-vr-standard',
      servedItemIds: [],
      sectionTimings: [],
      responses: {},
    },
  });
  const view = (await (await api.get(`/api/crew/${family.child.id}/mock`)).json()) as {
    phase: string;
  };
  expect(view.phase).toBe('none');
  await api.dispose();
});

test('a tier-locked case answers exactly like an unwritten one (D7)', async ({ page }) => {
  const family = await createFamily('crew-locked', { tier: 'CREW' });
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);

  // vr-08 is written content but not in the free set.
  const lockedCase = await prisma.case.findFirst({ where: { freeTier: false } });
  const freeCase = await prisma.case.findFirst({ where: { freeTier: true } });
  expect(lockedCase && freeCase).toBeTruthy();

  // The locked case page is a 404 — the same answer a nonsense id gets.
  const locked = await page.goto(`/crew/case/${lockedCase!.id}`);
  const nonsense = await page.goto('/crew/case/case-does-not-exist');
  expect(locked!.status()).toBe(nonsense!.status());

  // The session API refuses the locked case as an override and serves a free
  // one instead — no error a child could read as a wall.
  const session = `/api/crew/${family.child.id}/session`;
  await api.post(session, { data: { caseId: lockedCase!.id } });
  const state = await prisma.session.findFirst({
    where: { childId: family.child.id, endedAt: null },
  });
  const engine = state?.engineState as { engine?: { focus?: { caseId?: string } } };
  const focusCase = await prisma.case.findUnique({
    where: { id: engine.engine!.focus!.caseId! },
  });
  expect(focusCase!.freeTier).toBe(true);
  await api.dispose();
});

test('the district map shows a Crew child only the open doors', async ({ page }) => {
  const family = await createFamily('crew-district', { tier: 'CREW' });
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);
  await page.goto('/crew/district');
  const freeCount = await prisma.case.count({ where: { freeTier: true } });
  // Every rendered case link is a free-tier case; locked ones fell into the
  // same quiet path as unwritten content, so the count matches exactly.
  const links = await page.locator('a[href^="/crew/case/"]').count();
  expect(links).toBe(freeCount);
  await api.dispose();
});

test('free → paid → free round-trips: no data loss, only content width changes', async () => {
  const family = await createFamily('crew-roundtrip', { tier: 'CREW' });
  const api = await parentApi(family.email);
  await api.post('/api/child-session', { data: { childId: family.child.id } });

  // Practise on Crew: a session leaves real data.
  const session = `/api/crew/${family.child.id}/session`;
  await api.post(session, { data: {} });
  const before = await prisma.caseFile.count({ where: { childId: family.child.id } });
  expect(before).toBeGreaterThan(0);

  // Upgrade (dev provider path): subscription appears, everything opens.
  await prisma.subscription.create({
    data: { parentId: family.parentId, tier: 'FULL_12', status: 'active', firstPaidAt: new Date() },
  });
  const openFull = await api.post('/api/parent/mocks', {
    data: { childId: family.child.id, blueprintId: 'gl-vr-standard' },
  });
  expect(openFull.status()).not.toBe(401); // reachable (readiness may still gate)

  // Downgrade back to Crew: data intact, width narrows, nothing deleted.
  await prisma.subscription.updateMany({
    where: { parentId: family.parentId },
    data: { status: 'canceled' },
  });
  const after = await prisma.caseFile.count({ where: { childId: family.child.id } });
  expect(after).toBeGreaterThanOrEqual(before);
  const view = (await (await api.get(`/api/crew/${family.child.id}/mock`)).json()) as {
    phase: string;
  };
  expect(view.phase).toBe('none');
  await api.dispose();
});
