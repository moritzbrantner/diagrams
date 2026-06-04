import { expect } from "storybook/test";

import { BurndownChart, GanttChart, OrgChart, ProcessMap, RelationshipMap } from "./index";

import type { Meta, StoryObj } from "@storybook/react-vite";
import type React from "react";

function StoryFrame({ children }: { children?: React.ReactNode }) {
  return <div className="mx-auto grid max-w-5xl gap-6 p-4">{children}</div>;
}

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OrgChartStory: Story = {
  name: "Org Chart",
  render: () => (
    <StoryFrame>
      <OrgChart
        nodes={[
          {
            id: "owner",
            label: "Program owner",
            description: "Sets release scope",
            children: [
              {
                id: "design",
                label: "Design systems",
                description: "Maintains primitives",
              },
              {
                id: "platform",
                label: "Frontend platform",
                description: "Validates package consumers",
                children: [
                  {
                    id: "quality",
                    label: "Quality",
                    description: "Runs checks",
                  },
                ],
              },
            ],
          },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("treeitem", { name: "Program owner" })).toBeVisible();
    await expect(canvas.getByText("Quality")).toBeVisible();
  },
};

export const ProcessMapStory: Story = {
  name: "Process Map",
  render: () => (
    <StoryFrame>
      <ProcessMap
        steps={[
          {
            id: "discover",
            label: "Discover",
            description: "Map stakeholders and decision points.",
            meta: "Complete",
            status: "done",
            tone: "success",
          },
          {
            id: "shape",
            label: "Shape",
            description: "Turn the diagram into a release plan.",
            meta: "Active",
            status: "active",
            tone: "accent",
          },
          {
            id: "share",
            label: "Share",
            description: "Publish the artifact with context.",
            meta: "Next",
            status: "pending",
          },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("list")).toBeVisible();
    await expect(canvas.getByText("Shape")).toBeVisible();
  },
};

export const RelationshipMapStory: Story = {
  name: "Relationship Map",
  render: () => (
    <StoryFrame>
      <RelationshipMap
        ariaLabel="Story relationship map"
        nodes={[
          {
            id: "product",
            label: "Product",
            description: "Priorities",
            x: 0,
            y: 90,
          },
          {
            id: "design",
            label: "Design",
            description: "Components",
            x: 280,
            y: 0,
            tone: "success",
          },
          {
            id: "engineering",
            label: "Engineering",
            description: "Package",
            x: 280,
            y: 180,
          },
          {
            id: "governance",
            label: "Governance",
            description: "Approval",
            x: 560,
            y: 90,
            tone: "warning",
          },
        ]}
        edges={[
          {
            id: "product-design",
            source: "product",
            target: "design",
            label: "briefs",
          },
          {
            id: "product-engineering",
            source: "product",
            target: "engineering",
            label: "prioritizes",
          },
          {
            id: "engineering-governance",
            source: "engineering",
            target: "governance",
            label: "submits",
            kind: "risk",
          },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story relationship map" })).toBeVisible();
    await expect(canvas.getByText("Governance")).toBeVisible();
  },
};

export const BurndownChartStory: Story = {
  name: "Burndown Chart",
  render: () => (
    <StoryFrame>
      <BurndownChart
        ariaLabel="Story burndown chart"
        points={[
          { id: "day-1", date: "2026-04-01", remaining: 48 },
          { id: "day-3", date: "2026-04-03", remaining: 42 },
          { id: "day-6", date: "2026-04-06", remaining: 31 },
          { id: "day-9", date: "2026-04-09", remaining: 24 },
          { id: "day-12", date: "2026-04-12", remaining: 11 },
          { id: "day-15", date: "2026-04-15", remaining: 4 },
        ]}
        startDate="2026-04-01"
        endDate="2026-04-15"
        totalWork={48}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story burndown chart" })).toBeVisible();
    await expect(canvas.getByText("Remaining")).toBeVisible();
  },
};

export const GanttChartStory: Story = {
  name: "Gantt Chart",
  render: () => (
    <StoryFrame>
      <GanttChart
        ariaLabel="Story Gantt chart"
        tasks={[
          {
            id: "brief",
            label: "Release brief",
            description: "Scope and approval",
            startDate: "2026-04-01",
            endDate: "2026-04-04",
            earliestStartDate: "2026-04-01",
            deadlineDate: "2026-04-05",
            progress: 1,
            tone: "success",
          },
          {
            id: "components",
            label: "Component work",
            description: "Build primitives",
            startDate: "2026-04-04",
            endDate: "2026-04-14",
            earliestStartDate: "2026-04-03",
            deadlineDate: "2026-04-16",
            progress: 0.68,
          },
          {
            id: "validation",
            label: "Validation",
            description: "Tests and docs",
            startDate: "2026-04-15",
            endDate: "2026-04-22",
            earliestStartDate: "2026-04-12",
            deadlineDate: "2026-04-21",
            progress: 0.3,
            tone: "warning",
          },
        ]}
        startDate="2026-04-01"
        endDate="2026-04-24"
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Story Gantt chart" })).toBeVisible();
    await expect(canvas.getByText("Component work")).toBeVisible();
    await expect(canvas.getAllByText("Deadline")).toHaveLength(3);
  },
};
