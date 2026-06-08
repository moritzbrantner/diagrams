import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  collectBrowserErrors,
  expectNoBrowserErrors,
  expectNoInvalidSvgGeometry,
} from "../examples/src/testing/playwright";

import type { Page } from "@playwright/test";

const storyIds = [
  "diagrams-components--org-chart-story",
  "diagrams-components--process-map-story",
  "diagrams-components--relationship-map-story",
  "diagrams-components--interactive-relationship-map-story",
  "diagrams-components--gantt-chart-story",
  "diagrams-components--interactive-gantt-chart-story",
  "diagrams-uml-diagram--default",
  "diagrams-components--sequence-diagram-story",
  "diagrams-components--swimlane-diagram-story",
  "diagrams-components--dependency-graph-story",
  "diagrams-components--interactive-dependency-graph-story",
  "diagrams-components--architecture-diagram-story",
  "diagrams-components--interactive-architecture-diagram-story",
  "diagrams-components--entity-relationship-diagram-story",
  "diagrams-components--decision-tree-story",
  "diagrams-components--interactive-decision-tree-story",
  "diagrams-components--state-machine-diagram-story",
  "diagrams-components--interactive-state-machine-diagram-story",
  "diagrams-components--journey-map-story",
  "diagrams-components--timeline-diagram-story",
  "diagrams-components--interactive-timeline-diagram-story",
  "diagrams-components--mind-map-story",
  "diagrams-components--interactive-mind-map-story",
] as const;

for (const storyId of storyIds) {
  test(`${storyId} has no accessibility or geometry regressions`, async ({ page }) => {
    const errors = collectBrowserErrors(page);

    await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
    await expect(page.locator("#storybook-root")).toBeVisible();
    await expect(page.locator("#storybook-root")).not.toBeEmpty();

    await expectStoryA11yClean(page);
    await expectNoInvalidSvgGeometry(page);
    expectNoBrowserErrors(errors);
  });
}

async function expectStoryA11yClean(page: Page) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await waitForAxeIdle(page);

    try {
      await page.evaluate(() => {
        delete (window as Window & { axe?: unknown }).axe;
      });

      const results = await new AxeBuilder({ page })
        .include("#storybook-root")
        .disableRules(["landmark-one-main", "page-has-heading-one", "region"])
        .analyze();

      expect(results.violations).toEqual([]);
      return;
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("Axe is already running")) {
        throw error;
      }

      lastError = error;
      await page.waitForTimeout(100 * (attempt + 1));
    }
  }

  throw lastError;
}

async function waitForAxeIdle(page: Page) {
  await page.waitForFunction(
    () => {
      const windowWithAxe = window as Window & { axe?: { _running?: boolean } };

      return windowWithAxe.axe?._running !== true;
    },
    undefined,
    { timeout: 10_000 },
  );
}
