import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { expect } from "storybook/test";

import {
  ChartBarGraph,
  ChartContainer,
  ChartDonutGraph,
  ChartHistogramGraph,
  ChartLegend,
  ChartLegendContent,
  ChartLineGraph,
  ChartSparkline,
  ChartTooltip,
  ChartTooltipContent,
  OrgChart,
  ProcessMap,
  RelationshipMap,
} from "./index";

import type { Meta, StoryObj } from "@storybook/react-vite";
import type React from "react";

const trendData = [
  { month: "Jan", actual: 42, target: 38 },
  { month: "Feb", actual: 51, target: 44 },
  { month: "Mar", actual: 48, target: 50 },
  { month: "Apr", actual: 63, target: 57 },
  { month: "May", actual: 71, target: 66 },
  { month: "Jun", actual: 84, target: 76 },
];

const chartSeries = [
  { key: "actual", label: "Actual", color: "var(--chart-1)" },
  { key: "target", label: "Target", color: "var(--chart-2)" },
];

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

export const Charts: Story = {
  render: () => (
    <StoryFrame>
      <ChartContainer
        config={{
          actual: { label: "Actual", color: "var(--chart-1)" },
          target: { label: "Target", color: "var(--chart-2)" },
        }}
        className="min-h-80"
      >
        <LineChart data={trendData} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            dataKey="actual"
            stroke="var(--color-actual)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="target"
            stroke="var(--color-target)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartLineGraph
          ariaLabel="Story line chart"
          data={trendData}
          series={chartSeries}
          xKey="month"
        />
        <ChartBarGraph
          ariaLabel="Story bar chart"
          data={trendData}
          series={chartSeries}
          xKey="month"
        />
        <ChartHistogramGraph
          ariaLabel="Story histogram"
          values={[
            82, 88, 93, 101, 108, 112, 119, 124, 132, 140, 148, 161, 175, 199,
          ]}
          bins={[100, 130, 160]}
        />
        <div className="grid gap-6">
          <ChartDonutGraph
            ariaLabel="Story donut chart"
            data={[
              { label: "Discovery", value: 34 },
              { label: "Delivery", value: 46 },
              { label: "Review", value: 20 },
            ]}
            labelKey="label"
            centerLabel="Work"
          />
          <ChartSparkline
            ariaLabel="Story sparkline"
            data={trendData}
            series={{ key: "actual", label: "Actual", color: "var(--chart-3)" }}
            showPoints
          />
        </div>
      </div>
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("img", { name: "Story line chart" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("img", { name: "Story bar chart" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("img", { name: "Story histogram" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("img", { name: "Story donut chart" }),
    ).toBeVisible();
  },
};

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
    await expect(
      canvas.getByRole("treeitem", { name: "Program owner" }),
    ).toBeVisible();
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
    await expect(
      canvas.getByRole("img", { name: "Story relationship map" }),
    ).toBeVisible();
    await expect(canvas.getByText("Governance")).toBeVisible();
  },
};

export const RechartsBars: Story = {
  render: () => (
    <StoryFrame>
      <ChartContainer
        config={{
          actual: { label: "Actual", color: "var(--chart-4)" },
          target: { label: "Target", color: "var(--chart-5)" },
        }}
        className="min-h-80"
      >
        <BarChart data={trendData} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="actual" fill="var(--color-actual)" radius={4} />
          <Bar dataKey="target" fill="var(--color-target)" radius={4} />
        </BarChart>
      </ChartContainer>
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Actual")).toBeVisible();
  },
};
