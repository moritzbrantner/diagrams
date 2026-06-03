import { expect, test } from "@playwright/test";

const stories = [
  { id: "diagrams-components--charts", name: "charts", responsive: true },
  {
    id: "diagrams-components--org-chart-story",
    name: "org-chart",
    responsive: true,
  },
  {
    id: "diagrams-components--process-map-story",
    name: "process-map",
    responsive: true,
  },
  {
    id: "diagrams-components--relationship-map-story",
    name: "relationship-map",
    responsive: true,
  },
] as const;

for (const story of stories) {
  test(`${story.name} visual snapshot`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chromium" && !story.responsive,
      "desktop-only visual story",
    );

    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await expect(page.locator("#storybook-root")).toBeVisible();
    await expect(page.locator("#storybook-root")).not.toBeEmpty();
    await expect(page.locator("#storybook-root")).toHaveScreenshot(`${story.name}.png`);
  });
}
