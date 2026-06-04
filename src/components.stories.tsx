import { expect } from "storybook/test";

import { OrgChart, ProcessMap, RelationshipMap } from "./index";

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
