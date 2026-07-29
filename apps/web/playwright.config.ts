import { defineConfig } from '@playwright/test';

const PORT = 3100;

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
