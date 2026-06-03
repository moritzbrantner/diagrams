import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

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
} from "@moritzbrantner/diagrams";

import "./styles.css";

import type React from "react";

const trendData = [
  { label: "Jan", actual: 42, target: 38 },
  { label: "Feb", actual: 51, target: 44 },
  { label: "Mar", actual: 48, target: 50 },
  { label: "Apr", actual: 63, target: 57 },
  { label: "May", actual: 71, target: 66 },
  { label: "Jun", actual: 84, target: 76 },
];

const chartSeries = [
  { key: "actual", label: "Actual", color: "var(--chart-1)" },
  { key: "target", label: "Target", color: "var(--chart-2)" },
];

const processSteps = [
  {
    id: "discover",
    label: "Discover",
    description: "Map stakeholders and decision points.",
    meta: "Complete",
    status: "done" as const,
    tone: "success" as const,
  },
  {
    id: "shape",
    label: "Shape",
    description: "Turn the diagram into a release plan.",
    meta: "Active",
    status: "active" as const,
    tone: "accent" as const,
  },
  {
    id: "share",
    label: "Share",
    description: "Publish the artifact with context.",
    meta: "Next",
    status: "pending" as const,
  },
];

function ExampleSection({
  children,
  title,
  testId,
}: {
  children: React.ReactNode;
  title: string;
  testId: string;
}) {
  return (
    <section
      data-testid={testId}
      className="grid gap-4 border-t py-8 first:border-t-0"
    >
      <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
      {children}
    </section>
  );
}

function App() {
  return (
    <main className="mx-auto grid max-w-6xl gap-2 px-4 py-8 text-foreground">
      <header className="grid gap-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-normal">
          @moritzbrantner/diagrams
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Diagram and lightweight visual primitives for authored structural,
          relationship, process, and presentation views.
        </p>
      </header>

      <ExampleSection
        title="Recharts wrapper"
        testId="recharts-wrapper-example"
      >
        <ChartContainer
          config={{
            actual: { label: "Actual", color: "var(--chart-1)" },
            target: { label: "Target", color: "var(--chart-2)" },
          }}
          className="min-h-80"
        >
          <LineChart data={trendData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
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
      </ExampleSection>

      <ExampleSection title="Native charts" testId="native-chart-examples">
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartLineGraph
            ariaLabel="Monthly line trend"
            data={trendData}
            series={chartSeries}
            xKey="label"
            caption="Simple line trend."
          />
          <ChartBarGraph
            ariaLabel="Monthly bar comparison"
            data={trendData}
            series={chartSeries}
            xKey="label"
            caption="Grouped bar comparison."
          />
          <ChartHistogramGraph
            ariaLabel="Response time histogram"
            values={[
              82, 88, 93, 101, 108, 112, 119, 124, 132, 140, 148, 161, 175, 199,
            ]}
            bins={[100, 130, 160]}
            countLabel="Requests"
            formatValue={(value) => `${value}ms`}
          />
          <div className="grid gap-6">
            <ChartDonutGraph
              ariaLabel="Work split donut"
              data={[
                { label: "Discovery", value: 34 },
                { label: "Delivery", value: 46 },
                { label: "Review", value: 20 },
              ]}
              labelKey="label"
              centerLabel="Work"
            />
            <ChartSparkline
              ariaLabel="Weekly confidence sparkline"
              data={trendData}
              series={{
                key: "actual",
                label: "Actual",
                color: "var(--chart-3)",
              }}
              showPoints
            />
          </div>
        </div>
      </ExampleSection>

      <ExampleSection title="Organization chart" testId="org-chart-example">
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
      </ExampleSection>

      <ExampleSection title="Process map" testId="process-map-example">
        <ProcessMap steps={processSteps} />
      </ExampleSection>

      <ExampleSection
        title="Relationship map"
        testId="relationship-map-example"
      >
        <RelationshipMap
          ariaLabel="Release relationship map"
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
      </ExampleSection>

      <ExampleSection title="Recharts bars" testId="recharts-bar-example">
        <ChartContainer
          config={{
            actual: { label: "Actual", color: "var(--chart-4)" },
            target: { label: "Target", color: "var(--chart-5)" },
          }}
          className="min-h-80"
        >
          <BarChart data={trendData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="actual" fill="var(--color-actual)" radius={4} />
            <Bar dataKey="target" fill="var(--color-target)" radius={4} />
          </BarChart>
        </ChartContainer>
      </ExampleSection>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
