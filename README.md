# @moritzbrantner/diagrams

Diagram and lightweight visual primitives for React 19 applications. This package is for semantic,
authored, structural, process, org, relationship, and lightweight presentation visuals.

Use `@moritzbrantner/charts` for density-aware data visualizations, binned series, analytical chart
controls, and chart data processing.

## Install

```sh
bun add @moritzbrantner/diagrams @moritzbrantner/ui react react-dom recharts
```

Import the shared UI stylesheet once in your app:

```ts
import "@moritzbrantner/ui/atlas/styles.css";
```

## Example Page

Run the local example page for experimentation:

```sh
bun run dev
```

Build the same page for GitHub Pages:

```sh
bun run build:examples
```

The deployed example is served from <https://moritzbrantner.github.io/diagrams/>.

## Relationship Map

```tsx
import { RelationshipMap } from "@moritzbrantner/diagrams";

export function Stakeholders() {
  return (
    <RelationshipMap
      ariaLabel="Stakeholder map"
      nodes={[
        { id: "product", label: "Product", x: 0, y: 80 },
        { id: "design", label: "Design", x: 280, y: 0, tone: "success" },
        { id: "engineering", label: "Engineering", x: 280, y: 160 },
      ]}
      edges={[
        {
          id: "product-design",
          source: "product",
          target: "design",
          label: "briefs",
        },
        {
          id: "product-eng",
          source: "product",
          target: "engineering",
          label: "prioritizes",
        },
      ]}
    />
  );
}
```

## Process Map

```tsx
import { ProcessMap } from "@moritzbrantner/diagrams";

export function ReleaseProcess() {
  return (
    <ProcessMap
      steps={[
        { id: "scope", label: "Scope", status: "done", tone: "success" },
        { id: "build", label: "Build", status: "active", tone: "accent" },
        { id: "ship", label: "Ship", status: "pending" },
      ]}
    />
  );
}
```

## Org Chart

```tsx
import { OrgChart } from "@moritzbrantner/diagrams";

export function Team() {
  return (
    <OrgChart
      nodes={[
        {
          id: "owner",
          label: "Program owner",
          children: [
            { id: "design", label: "Design systems" },
            { id: "platform", label: "Frontend platform" },
          ],
        },
      ]}
    />
  );
}
```

## UML Diagram

```tsx
import { UmlDiagram } from "@moritzbrantner/diagrams/uml-diagram";

export function OrderFlow() {
  return (
    <UmlDiagram
      ariaLabel="Order service dependencies"
      nodes={[
        { id: "api", label: "API Gateway", x: 0, y: 0 },
        { id: "orders", label: "Orders Service", x: 280, y: 0 },
      ]}
      edges={[{ id: "api-orders", source: "api", target: "orders", label: "routes" }]}
    />
  );
}
```

## Recharts Wrapper

```tsx
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@moritzbrantner/diagrams/charts";
import { Line, LineChart, XAxis } from "recharts";

const data = [
  { month: "Jan", actual: 42 },
  { month: "Feb", actual: 51 },
];

export function WrappedRecharts() {
  return (
    <ChartContainer config={{ actual: { label: "Actual", color: "var(--chart-1)" } }}>
      <LineChart data={data} accessibilityLayer>
        <XAxis dataKey="month" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="actual" stroke="var(--color-actual)" />
      </LineChart>
    </ChartContainer>
  );
}
```

## Native Line Graph

```tsx
import { ChartLineGraph } from "@moritzbrantner/diagrams/charts";

export function Trend() {
  return (
    <ChartLineGraph
      ariaLabel="Monthly trend"
      data={[
        { month: "Jan", actual: 42 },
        { month: "Feb", actual: 51 },
      ]}
      series={[{ key: "actual", label: "Actual", color: "var(--chart-1)" }]}
      xKey="month"
    />
  );
}
```
