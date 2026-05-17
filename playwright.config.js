// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120_000,       // 2 min per test — accounts for slowMo + interstitial wait
  expect: { timeout: 15_000 },
  fullyParallel: false,  // tests within a project run sequentially (avoids cart conflicts)
  workers: 3,            // 3 parallel workers — balances speed vs Shopify API rate limits
  retries: 1,
  reporter: [
    ['html', { open: 'never' }],  // full report saved to playwright-report/
    ['list'],                      // live pass/fail output in terminal
  ],

  use: {
    baseURL: 'https://rk4fqq-rc.myshopify.com',
    trace: 'on-first-retry',
    screenshot: 'always',          // screenshot every test, pass or fail
    video: 'on',                   // record every run
    // 3 s after every click, fill, or key press
    slowMo: 3000,
  },

  projects: [
    {
      name: 'Mobile Chrome — Pixel 7',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Mobile Safari — iPhone 14',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
