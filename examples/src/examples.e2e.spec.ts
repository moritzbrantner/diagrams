import { expect, test } from "@playwright/test";

import { diagramPages } from "./diagram-pages";
import {
  collectBrowserErrors,
  expectA11yClean,
  expectNoBrowserErrors,
  expectNoInvalidSvgGeometry,
  expectNoVisibleTextOverflow,
} from "./testing/playwright";

const diagramExpectations = {
  "architecture-diagram": { role: "img", name: "Service architecture diagram" },
  "decision-tree": { role: "img", name: "Release decision tree" },
  "dependency-graph": { role: "img", name: "Package dependency graph" },
  "entity-relationship-diagram": { role: "img", name: "Order entity relationship diagram" },
  "gantt-chart": { role: "img", name: "Release Gantt chart" },
  "journey-map": { role: "grid", name: "Adoption journey map" },
  "mind-map": { role: "img", name: "Diagram mind map" },
  "org-chart": { role: "treeitem", name: "Program owner" },
  "process-map": { role: "list" },
  "relationship-map": { role: "img", name: "Release relationship map" },
  "sequence-diagram": { role: "img", name: "Release sequence diagram" },
  "state-machine-diagram": { role: "img", name: "Release state machine diagram" },
  "swimlane-diagram": { role: "img", name: "Release swimlane diagram" },
  "timeline-diagram": { role: "img", name: "Release timeline diagram" },
  "uml-diagram": { role: "img", name: "Service dependency UML diagram" },
} as const;

test("examples index links to every diagram page", async ({ page }) => {
  const errors = collectBrowserErrors(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "@moritzbrantner/diagrams" })).toBeVisible();
  await expect(page.getByRole("link", { name: "API documentation" })).toBeVisible();

  for (const diagramPage of diagramPages) {
    await expect(page.getByRole("link", { name: diagramPage.label })).toBeVisible();
  }

  await expectA11yClean(page);
  await expectNoVisibleTextOverflow(page);
  expectNoBrowserErrors(errors);
});

test("example presentation preference persists through shared settings", async ({ page }) => {
  await page.goto("/architecture-diagram/");

  const toggle = page.getByTestId("show-api-shape-setting");
  const settingRow = toggle.locator("..");
  await expect(toggle).toBeChecked();
  await expect(settingRow).toHaveAttribute("data-settings-foundation", "ready", {
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name: "API shape" })).toBeVisible();

  await toggle.uncheck();
  await expect(page.getByRole("heading", { name: "API shape" })).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("diagrams.examples.settings.user.v2");
        if (!raw) return null;
        const snapshot = JSON.parse(raw) as {
          schema_version?: number;
          scope?: string;
          overrides?: Record<string, { value?: unknown }>;
        };
        return {
          schemaVersion: snapshot.schema_version,
          scope: snapshot.scope,
          showApiShape: snapshot.overrides?.["examples.show_api_shape"]?.value,
        };
      }),
    )
    .toEqual({ schemaVersion: 2, scope: "user", showApiShape: false });

  await page.reload();
  await expect(settingRow).toHaveAttribute("data-settings-foundation", "ready", {
    timeout: 15_000,
  });
  await expect(toggle).not.toBeChecked();
  await expect(page.getByRole("heading", { name: "API shape" })).toHaveCount(0);
});

for (const diagramPage of diagramPages) {
  test(`${diagramPage.slug} page renders its diagram`, async ({ page }) => {
    const errors = collectBrowserErrors(page);
    const expectation = diagramExpectations[diagramPage.slug];

    await page.goto(`/${diagramPage.slug}/`);
    await expect(page.getByRole("heading", { name: diagramPage.title })).toBeVisible();
    await expect(page.getByRole("link", { name: "Examples index" })).toBeVisible();

    if ("name" in expectation) {
      await expect(page.getByRole(expectation.role, { name: expectation.name })).toBeVisible();
    } else {
      await expect(page.getByRole(expectation.role)).toBeVisible();
    }

    if (diagramPage.slug === "architecture-diagram") {
      await expect(page.locator('[data-diagram-engine="wasm"]')).toBeVisible();
    }

    await expectA11yClean(page);
    await expectNoInvalidSvgGeometry(page);
    await expectNoVisibleTextOverflow(page);
    expectNoBrowserErrors(errors);
  });
}
