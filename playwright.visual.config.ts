import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  outputDir: "test-results/visual",
  snapshotPathTemplate:
    "src/components/__screenshots__/{testFileName}/{projectName}/{arg}{ext}",
  testDir: ".",
  testMatch: "src/**/*.visual.spec.ts",
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
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 1000, width: 1440 },
      },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
