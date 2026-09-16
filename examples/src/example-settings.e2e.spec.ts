import { expect, test } from "@playwright/test";

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
