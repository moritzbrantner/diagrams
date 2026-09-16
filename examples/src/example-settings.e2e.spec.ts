import { expect, test } from "@playwright/test";

test("preserves example preference edits while shared settings initialize", async ({ page }) => {
  let releaseFoundation!: () => void;
  let markFoundationRequested!: () => void;
  const foundationGate = new Promise<void>((resolve) => {
    releaseFoundation = resolve;
  });
  const foundationRequested = new Promise<void>((resolve) => {
    markFoundationRequested = resolve;
  });

  await page.route("**/settings-browser.js", async (route) => {
    markFoundationRequested();
    await foundationGate;
    await route.continue();
  });

  await page.goto("/architecture-diagram/");
  await foundationRequested;

  const toggle = page.getByTestId("show-api-shape-setting");
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await expect(toggle).not.toBeChecked();

  releaseFoundation();

  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const raw = window.localStorage.getItem("diagrams.examples.settings.user.v2");
          if (!raw) return null;
          const snapshot = JSON.parse(raw) as {
            overrides?: Record<string, { value?: unknown }>;
          };
          return snapshot.overrides?.["examples.show_api_shape"]?.value;
        }),
      { timeout: 15_000 },
    )
    .toBe(false);
  await expect(toggle).not.toBeChecked();
});

test("example settings remain usable when browser storage rejects writes", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function setItem() {
      throw new DOMException("Storage disabled for test", "QuotaExceededError");
    };
  });

  await page.goto("/architecture-diagram/");

  const toggle = page.getByTestId("show-api-shape-setting");
  const settingRow = toggle.locator("..");
  await expect(settingRow).toHaveAttribute("data-settings-foundation", "degraded", {
    timeout: 15_000,
  });
  await expect(toggle).toBeChecked();

  await toggle.uncheck();

  await expect(toggle).not.toBeChecked();
  await expect(page.getByRole("heading", { name: "API shape" })).toHaveCount(0);
});
