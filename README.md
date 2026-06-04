# @moritzbrantner/diagrams

Diagram primitives for React 19 applications. This package is for authored structural diagrams,
UML diagrams, process and Gantt-style flows, org structures, relationship maps, dependency graphs,
and other graph-based visualizations.

Use `@moritzbrantner/charts` for line, bar, area, donut, histogram, sparkline, Recharts wrappers,
density-aware data visualizations, analytical chart controls, and chart data processing.

## Install

```sh
bun add @moritzbrantner/diagrams @moritzbrantner/ui react react-dom
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

## Burndown Chart

```tsx
import { BurndownChart } from "@moritzbrantner/diagrams";

export function SprintBurndown() {
  return (
    <BurndownChart
      ariaLabel="Sprint burndown"
      startDate="2026-04-01"
      endDate="2026-04-15"
      totalWork={48}
      points={[
        { date: "2026-04-01", remaining: 48 },
        { date: "2026-04-06", remaining: 31 },
        { date: "2026-04-12", remaining: 11 },
        { date: "2026-04-15", remaining: 4 },
      ]}
    />
  );
}
```

## Gantt Chart

```tsx
import { GanttChart } from "@moritzbrantner/diagrams";

export function ReleasePlan() {
  return (
    <GanttChart
      ariaLabel="Release plan"
      startDate="2026-04-01"
      endDate="2026-04-24"
      tasks={[
        {
          id: "brief",
          label: "Release brief",
          startDate: "2026-04-01",
          endDate: "2026-04-04",
          earliestStartDate: "2026-04-01",
          deadlineDate: "2026-04-05",
          progress: 1,
        },
        {
          id: "components",
          label: "Component work",
          startDate: "2026-04-04",
          endDate: "2026-04-14",
          earliestStartDate: "2026-04-03",
          deadlineDate: "2026-04-16",
          progress: 0.68,
        },
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

## Scope

`@moritzbrantner/diagrams` intentionally does not export analytical chart adapters. Keep
time-series, categorical, statistical, and quantitative chart work in `@moritzbrantner/charts`; use
this package for diagrams whose primary meaning comes from nodes, edges, hierarchy, sequence, state,
dependency, scheduling, deadlines, or process structure.
