import { expect, test } from "@playwright/test";

import {
  collectBrowserErrors,
  expectA11yClean,
  expectNoBrowserErrors,
  expectNoInvalidSvgGeometry,
  expectNoVisibleTextOverflow,
} from "./testing/playwright";

test("examples page renders seeded diagrams and chart primitives", async ({
  page,
}) => {
  const errors = collectBrowserErrors(page);

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "@moritzbrantner/diagrams" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("recharts-wrapper-example").locator(".recharts-wrapper"),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Monthly line trend" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Monthly bar comparison" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Response time histogram" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Work split donut" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Weekly confidence sparkline" }),
  ).toBeVisible();
  await expect(
    page.getByRole("treeitem", { name: "Program owner" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("process-map-example").getByRole("list"),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Release relationship map" }),
  ).toBeVisible();

  await expectA11yClean(page);
  await expectNoInvalidSvgGeometry(page);
  await expectNoVisibleTextOverflow(page);
  expectNoBrowserErrors(errors);
});
