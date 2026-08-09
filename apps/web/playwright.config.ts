import { config as loadEnv } from 'dotenv';
import { defineConfig } from '@playwright/test';

// e2e/fixtures.ts builds each test's accounts through Prisma, so the test
// process needs DATABASE_URL as well as the web server. dotenv does not
// override variables already set, so CI's own environment still wins.
loadEnv({ path: '../../.env', quiet: true });

// 3100 by default; E2E_PORT lets a second session test against its own dev
// server while another one holds the default port.
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  /**
   * NO RETRIES, ANYWHERE (David, 2026-08-09).
   *
   * CI used to retry once. A retry that turns a real race green is a discarded signal, and it was
   * discarding one: `reviewer-surfaces` asserts a row's status straight after a server action and
   * loses that race on a fast server. The retry passed, CI stayed green, and the fault survived.
   * That is the same fault as an unread build one level down — a check whose failures are absorbed
   * before anyone reads them.
   *
   * If this makes CI red, the answer is to fix the race, not to restore the retry.
   */
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Keep evidence when something fails on CI. Diagnosing the mid-session
    // timeouts cost several 20-minute round trips of guessing because a
    // failed run left nothing behind but a stack trace.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // The trimmed headless shell intermittently locks its renderer on the
    // crew app (reproduced on /crew/play; fine in real Chrome). Use full
    // Chromium's new headless mode instead.
    channel: 'chromium',
  },
  webServer: {
    /**
     * A PRODUCTION BUILD EVERYWHERE BY DEFAULT (David, 2026-08-09).
     *
     * Local runs used `next dev`, CI used `next start`, and the two behaved differently enough to
     * matter: the same two specs took 2.2 minutes against dev and 15.1 SECONDS against a build —
     * roughly nine times faster, because dev compiles each route on first hit. That gap did more
     * than waste time. It changed which tests failed: dev's slowness hid a read-after-write race
     * that a production server loses instantly, so "passes locally, fails in CI" was a category of
     * its own rather than a coincidence.
     *
     * Same binary as CI now. `pnpm e2e` builds first; E2E_DEV=1 opts back into the dev server for
     * iterating on a single spec, where the compile cost is paid once and the speed does not matter.
     */
    command: process.env.E2E_DEV ? `pnpm dev` : `pnpm start`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
