import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  testDir: ".",
  testMatch: "examples/src/**/*.e2e.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:41736",
    trace: "on-first-retry",
  },
  webServer: {
    command: "bunx vite --host 127.0.0.1 --port 41736 --strictPort",
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:41736",
  },
  projects: [
    {
      name: "desktop-chromium",
      testMatch: "examples/src/**/*.e2e.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testMatch: "examples/src/**/*.e2e.spec.ts",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "desktop-firefox-smoke",
      testMatch: "examples/src/**/*.cross-browser.spec.ts",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "desktop-webkit-smoke",
      testMatch: "examples/src/**/*.cross-browser.spec.ts",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
