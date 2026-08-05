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
  retries: process.env.CI ? 1 : 0,
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
    command: process.env.CI ? `pnpm start` : `pnpm dev`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
