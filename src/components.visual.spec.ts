import { expect, test } from "@playwright/test";

const stories = [
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
  {
    id: "diagrams-components--gantt-chart-story",
    name: "gantt-chart",
    responsive: true,
  },
  {
    id: "diagrams-uml-diagram--default",
    name: "uml-diagram",
    responsive: true,
  },
  {
    id: "diagrams-components--sequence-diagram-story",
    name: "sequence-diagram",
    responsive: true,
  },
  {
    id: "diagrams-components--swimlane-diagram-story",
    name: "swimlane-diagram",
    responsive: true,
  },
  {
    id: "diagrams-components--dependency-graph-story",
    name: "dependency-graph",
    responsive: true,
  },
  {
    id: "diagrams-components--architecture-diagram-story",
    name: "architecture-diagram",
    responsive: true,
  },
  {
    id: "diagrams-components--entity-relationship-diagram-story",
    name: "entity-relationship-diagram",
    responsive: true,
  },
  {
    id: "diagrams-components--decision-tree-story",
    name: "decision-tree",
    responsive: true,
  },
  {
    id: "diagrams-components--state-machine-diagram-story",
    name: "state-machine-diagram",
    responsive: true,
  },
  {
    id: "diagrams-components--journey-map-story",
    name: "journey-map",
    responsive: true,
  },
  {
    id: "diagrams-components--timeline-diagram-story",
    name: "timeline-diagram",
    responsive: true,
  },
  {
    id: "diagrams-components--mind-map-story",
    name: "mind-map",
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
