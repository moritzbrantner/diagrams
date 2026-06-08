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

    await expectA11yClean(page);
    await expectNoInvalidSvgGeometry(page);
    await expectNoVisibleTextOverflow(page);
    expectNoBrowserErrors(errors);
  });
}
