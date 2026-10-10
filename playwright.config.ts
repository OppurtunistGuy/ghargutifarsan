import { defineConfig } from '@playwright/test';

// Fixture number for the "configured" project only; never real business configuration.
const TEST_WHATSAPP_NUMBER = '919800000000';

const env = (extra: Record<string, string>) => ({
  ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)),
  ...extra,
});

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: 'list',
  use: {
    headless: true,
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
    trace: 'retain-on-failure',
  },
  projects: [
    // The site as it ships, with the business number from src/config/business.ts.
    { name: 'storefront', testIgnore: /whatsapp-configured/, use: { baseURL: 'http://127.0.0.1:5183' } },
    // VITE_WHATSAPP_NUMBER overriding that number at build time.
    { name: 'whatsapp-configured', testMatch: /whatsapp-configured\.spec\.ts/, use: { baseURL: 'http://127.0.0.1:5184' } },
  ],
  webServer: [
    {
      command: 'npm run dev -- --port 5183 --strictPort --host 127.0.0.1',
      url: 'http://127.0.0.1:5183',
      reuseExistingServer: !process.env.CI,
      env: env({ VITE_WHATSAPP_NUMBER: '' }),
    },
    {
      command: 'npm run dev -- --port 5184 --strictPort --host 127.0.0.1',
      url: 'http://127.0.0.1:5184',
      reuseExistingServer: !process.env.CI,
      env: env({ VITE_WHATSAPP_NUMBER: TEST_WHATSAPP_NUMBER }),
    },
  ],
});
