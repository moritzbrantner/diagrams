import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  outputDir: "test-results/storybook",
  testDir: ".",
  testMatch: "src/**/*.storybook.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:6017",
    trace: "on-first-retry",
  },
  webServer: {
    command: "bunx storybook dev --host 127.0.0.1 --port 6017 --ci",
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:6017",
  },
  projects: [
    {
      name: "storybook-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 1000, width: 1440 },
      },
    },
  ],
});
