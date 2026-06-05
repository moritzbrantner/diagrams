# @moritzbrantner/diagrams

[![CI](https://github.com/moritzbrantner/diagrams/actions/workflows/ci.yml/badge.svg)](https://github.com/moritzbrantner/diagrams/actions/workflows/ci.yml)
[![Pages](https://github.com/moritzbrantner/diagrams/actions/workflows/pages.yml/badge.svg)](https://github.com/moritzbrantner/diagrams/actions/workflows/pages.yml)
[![npm version](https://img.shields.io/npm/v/@moritzbrantner/diagrams.svg)](https://www.npmjs.com/package/@moritzbrantner/diagrams)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Diagram primitives for React 19 applications. This package is for authored structural diagrams,
UML diagrams, process and Gantt-style flows, org structures, relationship maps, dependency graphs,
and other graph-based visualizations.

Use `@moritzbrantner/charts` for line, bar, area, donut, histogram, sparkline, Recharts wrappers,
density-aware data visualizations, analytical chart controls, and chart data processing.

## Installation

```sh
bun add @moritzbrantner/diagrams @moritzbrantner/ui react react-dom
```

Import the shared UI stylesheet once in your app:

```ts
import "@moritzbrantner/ui/atlas/styles.css";
```

The package is published to public npm.

## Support Matrix

| Dependency           | Supported range             | Notes                                                   |
| -------------------- | --------------------------- | ------------------------------------------------------- |
| React                | `^19.0.0`                   | Required for exported React diagram primitives.         |
| React DOM            | `^19.0.0`                   | Required for examples and React rendering.              |
| `@moritzbrantner/ui` | `^0.9.1`                    | Provides the shared Atlas stylesheet and design tokens. |
| TypeScript           | Repository compiler version | Public types are checked from the generated package.    |

## API Stability

The package is pre-`1.0`. Public APIs may change, but intentional changes are tracked through
Changesets, changelog entries, and the committed API report in `etc/diagrams.api.md`. Breaking
changes should include migration notes.

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
Generated API documentation is published under <https://moritzbrantner.github.io/diagrams/api/>.

## API Overview

- `ArchitectureDiagram` for systems, boundaries, stores, queues, and external integrations.
- `BurndownChart` for sprint or scope burndown timelines.
- `DecisionTree` for branching decisions, actions, and outcomes.
- `DependencyGraph` for package, module, service, or team dependencies.
- `EntityRelationshipDiagram` for entities, fields, keys, and cardinality relationships.
- `GanttChart` for scheduled tasks, progress, earliest-start markers, and deadlines.
- `JourneyMap` for phase-based journeys, touchpoints, sentiment, and ownership.
- `MindMap` for radial or tree-like idea decomposition.
- `OrgChart`, `OrgChartNode`, `getVisibleOrgChartNodes`, `findOrgChartNode`,
  `insertOrgChartNode`, `updateOrgChartNode`, and `removeOrgChartNode` for hierarchical org or
  ownership structures.
- `ProcessMap`, `ProcessMapStep`, and `ProcessMapConnector` for horizontal and vertical workflow
  sequences.
- `RelationshipMap` for node-and-edge dependency, stakeholder, ownership, or risk maps.
- `SequenceDiagram` for ordered interactions between participants.
- `StateMachineDiagram` for state machines with events, guards, actions, and terminal states.
- `SwimlaneDiagram` for workflow steps grouped by team, role, or system.
- `TimelineDiagram` for structural milestone and event timelines.
- `UmlDiagram`, `UmlClassDiagram`, `UmlStateDiagram`, and `getUmlDiagramBounds` for generic UML,
  class, and state diagrams.

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

## Additional Diagram Primitives

```tsx
import {
  ArchitectureDiagram,
  DecisionTree,
  DependencyGraph,
  EntityRelationshipDiagram,
  JourneyMap,
  MindMap,
  SequenceDiagram,
  StateMachineDiagram,
  SwimlaneDiagram,
  TimelineDiagram,
} from "@moritzbrantner/diagrams";

<SequenceDiagram
  participants={[
    { id: "client", label: "Client" },
    { id: "api", label: "API" },
  ]}
  messages={[{ id: "request", from: "client", to: "api", label: "Request" }]}
/>;

<SwimlaneDiagram
  lanes={[{ id: "team", label: "Team" }]}
  steps={[{ id: "build", laneId: "team", label: "Build" }]}
/>;

<DependencyGraph
  nodes={[
    { id: "app", label: "App" },
    { id: "pkg", label: "Package" },
  ]}
  edges={[{ id: "app-pkg", source: "app", target: "pkg" }]}
/>;

<DependencyGraph
  selectedNodeId={selectedNodeId}
  onNodeSelect={(node) => setSelectedNodeId(node.id)}
  onNodeDeselect={() => setSelectedNodeId(null)}
  nodeActions={[
    { id: "inspect", label: "Inspect" },
    { id: "remove", label: "Remove", destructive: true },
  ]}
  nodes={[
    { id: "app", label: "App" },
    { id: "pkg", label: "Package" },
  ]}
  edges={[{ id: "app-pkg", source: "app", target: "pkg" }]}
/>;

<ArchitectureDiagram
  nodes={[
    { id: "api", label: "API" },
    { id: "db", label: "DB", kind: "database" },
  ]}
  connections={[{ id: "api-db", source: "api", target: "db", label: "writes" }]}
/>;

<EntityRelationshipDiagram
  entities={[{ id: "orders", name: "orders", fields: [{ id: "id", name: "id", key: "primary" }] }]}
/>;

<DecisionTree
  root={{
    id: "ready",
    label: "Ready?",
    children: [{ id: "yes", label: "Yes", target: { id: "ship", label: "Ship" } }],
  }}
/>;

<StateMachineDiagram
  states={[
    { id: "draft", label: "Draft" },
    { id: "review", label: "Review" },
  ]}
  transitions={[{ id: "submit", source: "draft", target: "review", event: "submit" }]}
/>;

<JourneyMap
  phases={[{ id: "discover", label: "Discover" }]}
  touchpoints={[{ id: "docs", phaseId: "discover", label: "Read docs" }]}
/>;

<TimelineDiagram items={[{ id: "beta", date: "2026-04-10", label: "Beta" }]} />;

<MindMap
  root={{ id: "diagrams", label: "Diagrams", children: [{ id: "workflow", label: "Workflow" }] }}
/>;
```

## Scope

`@moritzbrantner/diagrams` intentionally does not export analytical chart adapters. Keep
time-series, categorical, statistical, and quantitative chart work in `@moritzbrantner/charts`; use
this package for diagrams whose primary meaning comes from nodes, edges, hierarchy, sequence, state,
dependency, scheduling, deadlines, or process structure.
