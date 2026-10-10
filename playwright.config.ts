import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5183',
    headless: true,
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5183 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:5183',
    reuseExistingServer: !process.env.CI,
  },
});
