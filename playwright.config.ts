import { defineConfig } from '@playwright/test';
const production = process.env.TEST_PRODUCTION === '1';
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  outputDir: 'artifacts/test-results',
  reporter: 'list',
  use: {
    baseURL: production ? 'http://127.0.0.1:3101' : 'http://127.0.0.1:3100',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node e2e/fixtures/auth-backend.mjs',
      url: 'http://127.0.0.1:3112/health',
      env: { ATLAS_TEST_ORIGIN: production ? 'http://127.0.0.1:3101' : 'http://127.0.0.1:3100' },
      reuseExistingServer: false,
    },
    {
      env: {
        ATLAS_TEST_MODE: production ? '0' : '1',
        NEXT_PUBLIC_ATLAS_BACKEND_URL: 'http://127.0.0.1:3112',
        NEXT_PUBLIC_ATLAS_AUTH_TENANT: 'atlas',
      },
      command: production
        ? 'bun start --hostname 127.0.0.1 --port 3101'
        : 'bun dev --hostname 127.0.0.1 --port 3100',
      url: production ? 'http://127.0.0.1:3101' : 'http://127.0.0.1:3100',
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
