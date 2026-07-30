/**
 * Per-test fixtures: every test that needs an account creates its own.
 *
 * Why this exists. Six spec files used to sign in as the seeded
 * test-family@cluecrew.test and the three seeded staff accounts, which
 * produced two distinct kinds of order-dependence:
 *
 *   1. Sessions outlive a test. Starting a crew session RESUMES an open one,
 *      so a child left parked mid-session by one test silently changed what
 *      the next test was looking at. The five /crew/play audits worked around
 *      this by deleting the previous test's session first.
 *   2. Practice history accumulates. On a dev database that is never reset,
 *      the shared child carried more review debt every run, so the setup
 *      loops got longer — until they crossed a deadline and looked flaky.
 *
 * A fresh child has no open session and no review debt, so both go away.
 *
 * Accounts are created straight through Prisma rather than by driving the
 * signup and onboarding forms. That is faster, and it keeps the signup
 * JOURNEY owned by the one test that actually asserts on it
 * (billing-journey.spec.ts) instead of being load-bearing for the whole suite.
 *
 * This module is test-only. It is never imported by the app, so it adds no
 * runtime surface — in particular, no dev endpoint that can mint a verified
 * parent or a staff admin.
 */
import { hash } from '@node-rs/argon2';
import { prisma, type StaffRole } from '@cluecrew/db';
import { expect, request, type APIRequestContext, type Browser, type Page } from '@playwright/test';

const BASE = 'http://localhost:3100';

/** One password for every fixture account, so the hash is computed once. */
export const FIXTURE_PASSWORD = 'E2eFixture!2026';

export interface FixtureChild {
  id: string;
  crewName: string;
}

export interface FixtureFamily {
  email: string;
  parentId: string;
  children: FixtureChild[];
  /** The first child — the one most tests want. */
  child: FixtureChild;
}

export interface FixtureStaff {
  id: string;
  email: string;
  role: Exclude<StaffRole, 'NONE'>;
}

/** Argon2 at these parameters costs ~100ms; every fixture shares one hash. */
let passwordHash: Promise<string> | undefined;
function fixturePasswordHash(): Promise<string> {
  passwordHash ??= hash(FIXTURE_PASSWORD, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  return passwordHash;
}

/** Everything this file created, for cleanupFixtures() to remove. */
const created: string[] = [];
let counter = 0;

function fixtureEmail(label: string): string {
  counter += 1;
  return `e2e-${label}-${Date.now()}-${counter}@cluecrew.test`;
}

/**
 * A verified parent with its own children. `crewNames` sets how many children
 * and what they are called; they come back in the order given.
 */
export async function createFamily(
  label: string,
  options: { crewNames?: string[]; regionCode?: string; yearGroup?: number } = {},
): Promise<FixtureFamily> {
  const email = fixtureEmail(label);
  const parent = await prisma.parentAccount.create({
    data: {
      email,
      passwordHash: await fixturePasswordHash(),
      emailVerified: new Date(),
      displayName: 'Fixture Parent',
      // A real Region.id — an orphan code falls back to "unknown" wherever the
      // registry renders, which has silently weakened assertions before.
      regionCode: options.regionCode ?? 'kent',
    },
  });
  created.push(parent.id);

  // Created one at a time: `include: { children: true }` returns no guaranteed
  // order, and tests address children by position.
  const children: FixtureChild[] = [];
  for (const crewName of options.crewNames ?? ['Robin']) {
    const child = await prisma.childProfile.create({
      data: {
        parentId: parent.id,
        crewName,
        yearGroup: options.yearGroup ?? 5,
        examYear: 2028,
        settings: { reducedMotion: false, dyslexiaFont: false, audioDefault: false },
      },
    });
    children.push({ id: child.id, crewName: child.crewName });
  }

  return { email, parentId: parent.id, children, child: children[0]! };
}

/** A staff account at one role. Two fixtures are never the same person, so
 *  the CMS "reviewer must differ from author" rule is satisfied by default. */
export async function createStaff(
  label: string,
  role: Exclude<StaffRole, 'NONE'>,
): Promise<FixtureStaff> {
  const email = fixtureEmail(`staff-${label}`);
  const staff = await prisma.parentAccount.create({
    data: {
      email,
      passwordHash: await fixturePasswordHash(),
      emailVerified: new Date(),
      displayName: `Fixture ${role}`,
      staffRole: role,
    },
  });
  created.push(staff.id);
  return { id: staff.id, email, role };
}

/**
 * Registers an account this module did not create — for the one test that
 * deliberately signs up through the real UI — so cleanup still collects it.
 */
export async function trackAccount(email: string): Promise<void> {
  const account = await prisma.parentAccount.findUnique({ where: { email }, select: { id: true } });
  if (account) created.push(account.id);
}

/**
 * Deletes every fixture account this file created. ParentAccount cascades to
 * children, and children to sessions, attempts, mastery and review rows, so
 * one delete per account clears the lot and the dev database does not fill up
 * with abandoned families.
 */
export async function cleanupFixtures(): Promise<void> {
  if (created.length > 0) {
    await prisma.parentAccount.deleteMany({ where: { id: { in: created } } });
    created.length = 0;
  }
  await prisma.$disconnect();
}

/** A signed-in parent API context (session cookies, no crew token). */
export async function parentApi(email: string): Promise<APIRequestContext> {
  const api = await request.newContext({ baseURL: BASE });
  const { csrfToken } = (await (await api.get('/api/auth/csrf')).json()) as { csrfToken: string };
  await api.post('/api/auth/callback/credentials', {
    form: { csrfToken, email, password: FIXTURE_PASSWORD },
  });
  const signedIn = (await api.storageState()).cookies.some((cookie) =>
    cookie.name.includes('authjs.session-token'),
  );
  expect(signedIn, `fixture parent ${email} could not sign in over the API`).toBe(true);
  return api;
}

/** Copies an API context's cookies onto a page, so the browser is signed in. */
export async function copyCookies(page: Page, api: APIRequestContext): Promise<void> {
  const cookies = (await api.storageState()).cookies;
  await page.context().addCookies(
    cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: 'localhost',
      path: '/',
    })),
  );
}

/** Mints a crew session for one child and puts the token on the page. */
export async function enterCrewMode(
  page: Page,
  api: APIRequestContext,
  childId: string,
): Promise<void> {
  const response = await api.post('/api/child-session', { data: { childId } });
  expect(response.ok(), 'minting a crew session for the fixture child').toBeTruthy();
  const crewToken = (await api.storageState()).cookies.find(
    (cookie) => cookie.name === 'crew_token',
  );
  expect(crewToken, 'the crew token cookie must be set').toBeTruthy();
  await page.context().addCookies([
    { name: 'crew_token', value: crewToken!.value, domain: 'localhost', path: '/' },
  ]);
}

/** Signs in through the real parent login form. */
export async function signInAsParent(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', FIXTURE_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/parent');
}

/**
 * Signs a staff member in at /admin. The form lives at /admin itself, so
 * success is the authenticated nav appearing rather than a URL change.
 *
 * On failure this reads the form's own error back, because the shared-account
 * version of this failed once as a bare timeout on a filled-in form — which
 * says nothing about whether the password was wrong, the account was locked,
 * or the role was missing.
 */
export async function signInAsStaff(page: Page, staff: FixtureStaff): Promise<Page> {
  await page.goto('/admin');
  await page.fill('input[name="email"]', staff.email);
  await page.fill('input[name="password"]', FIXTURE_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  const nav = page.getByRole('navigation', { name: 'Admin' });
  // /admin is the one area no other spec visits, so whichever staff test runs
  // first pays for compiling it AND its sign-in server action against the dev
  // server. That first submission has been measured well past 15s; the budget
  // is for a cold compile, not for how long a sign-in ought to take.
  const arrived = await nav
    .waitFor({ timeout: 45_000 })
    .then(() => true)
    .catch(() => false);
  if (!arrived) {
    const shown = await page.locator('main').innerText().catch(() => '(no main element)');
    // The page alone never says why: a filled-in form with no error looks the
    // same whether the password was wrong, the account was locked, the role
    // was missing, or the row had gone. Ask the database directly.
    const row = await prisma.parentAccount.findUnique({
      where: { email: staff.email },
      select: { staffRole: true, failedLogins: true, lockedUntil: true, emailVerified: true },
    });
    throw new Error(
      `staff sign-in failed for ${staff.email} (${staff.role}).\n` +
        `Account row: ${row ? JSON.stringify(row) : 'GONE — deleted before it was used'}\n` +
        `Page said:\n${shown.slice(0, 300)}`,
    );
  }
  return page;
}

/** A staff member signed in inside their own browser context. */
export async function staffContext(browser: Browser, staff: FixtureStaff): Promise<Page> {
  const context = await browser.newContext();
  return signInAsStaff(await context.newPage(), staff);
}
