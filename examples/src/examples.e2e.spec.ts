import { expect, test } from "@playwright/test";

import {
  collectBrowserErrors,
  expectA11yClean,
  expectNoBrowserErrors,
  expectNoInvalidSvgGeometry,
  expectNoVisibleTextOverflow,
} from "./testing/playwright";

test("examples page renders seeded diagram primitives", async ({ page }) => {
  const errors = collectBrowserErrors(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "@moritzbrantner/diagrams" })).toBeVisible();
  await expect(
    page.getByTestId("uml-diagram-example").getByRole("img", {
      name: "Service dependency UML diagram",
    }),
  ).toBeVisible();
  await expect(page.getByRole("treeitem", { name: "Program owner" })).toBeVisible();
  await expect(page.getByTestId("process-map-example").getByRole("list")).toBeVisible();
  await expect(page.getByRole("img", { name: "Release relationship map" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Release burndown chart" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Release Gantt chart" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Release sequence diagram" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Release swimlane diagram" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Package dependency graph" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Service architecture diagram" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Order entity relationship diagram" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Release decision tree" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Release state machine diagram" })).toBeVisible();
  await expect(page.getByRole("grid", { name: "Adoption journey map" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Release timeline diagram" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Diagram mind map" })).toBeVisible();

  await expectA11yClean(page);
  await expectNoInvalidSvgGeometry(page);
  await expectNoVisibleTextOverflow(page);
  expectNoBrowserErrors(errors);
});
