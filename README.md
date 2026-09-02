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
bun add @moritzbrantner/diagrams react react-dom
```

Import the package-owned stylesheet once when using the React renderers:

```ts
import "@moritzbrantner/diagrams/styles.css";
```

The published package does not require `@moritzbrantner/ui`. Theme surfaces can be
overridden with the `--diagrams-*` CSS custom properties.

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
| `@moritzbrantner/ui` | `^1.0.0`                    | Provides the shared Atlas stylesheet and design tokens. |
| TypeScript           | Repository compiler version | Public types are checked from the generated package.    |

## API Stability

The package is pre-`1.0`. Public APIs may change, but intentional changes are tracked through
Changesets, changelog entries, and the committed API report in `etc/diagrams.api.md`. Breaking
changes should include migration notes.

## Styling Contract

Diagram components use the shared Atlas token classes from `@moritzbrantner/ui`. Import the
stylesheet once in the consuming app before rendering diagrams:

```ts
import "@moritzbrantner/ui/atlas/styles.css";
```

The package does not inject global styles at runtime. If the stylesheet is omitted, diagrams still
render structurally, but colors, spacing, borders, focus rings, and dark-mode tokens are not
guaranteed to match the documented examples.

## Which Diagram Should I Use?

| Use case                                      | Component                       |
| --------------------------------------------- | ------------------------------- |
| Service maps, boundaries, queues, data stores | `ArchitectureDiagram`           |
| Branching decisions and outcomes              | `DecisionTree`                  |
| Package, module, team, or service dependency  | `DependencyGraph`               |
| Tables, fields, keys, cardinality             | `EntityRelationshipDiagram`     |
| Scheduled work across dates                   | `GanttChart`                    |
| Phased user/customer journeys                 | `JourneyMap`                    |
| Radial or tree-like idea decomposition        | `MindMap`                       |
| Hierarchical teams or ownership               | `OrgChart`                      |
| Linear workflow status                        | `ProcessMap`                    |
| Stakeholder, ownership, risk, or control maps | `RelationshipMap`               |
| Ordered participant interactions              | `SequenceDiagram`               |
| States, transitions, guards, terminal states  | `StateMachineDiagram`           |
| Work grouped by team, role, or system         | `SwimlaneDiagram`               |
| Milestones and events over time               | `TimelineDiagram`               |
| UML class, state, or general node-edge views  | `UmlDiagram`, `UmlClassDiagram` |

Choose the most specific component first. Use `RelationshipMap`, `DependencyGraph`, or `UmlDiagram`
when the domain is genuinely a node-edge graph and none of the stricter structures fit.

## Interactive Diagrams

SVG-backed graph diagrams share optional interactive canvas props from `DiagramInteractiveProps`.
Set `interactiveFeatures` to `true` for the full bundle, or pass an object to choose features:

- `viewport` enables pan, wheel zoom, fit, reset, and controlled viewport callbacks.
- `pathHighlight` highlights neighbors, incoming paths, outgoing paths, or connected paths.
- `search` adds diagram search and focuses matching nodes or edges.
- `edgeInspector` exposes hover/focus tooltips and click-open edge details.
- `controls` controls whether the floating toolbar is automatic, always visible, or hidden.

```tsx
import * as React from "react";
import {
  RelationshipMap,
  type DiagramElementRef,
  type DiagramViewport,
} from "@moritzbrantner/diagrams";

export function InteractiveServiceMap() {
  const [viewport, setViewport] = React.useState<DiagramViewport>();
  const [highlightedElement, setHighlightedElement] = React.useState<DiagramElementRef | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [inspectedEdgeId, setInspectedEdgeId] = React.useState<string | null>(null);

  return (
    <RelationshipMap
      ariaLabel="Interactive service relationship map"
      interactiveFeatures={{
        controls: "always",
        edgeInspector: true,
        pathHighlight: { mode: "neighbors" },
        search: true,
        viewport: true,
      }}
      viewport={viewport}
      onViewportChange={setViewport}
      highlightedElement={highlightedElement}
      onHighlightedElementChange={setHighlightedElement}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      inspectedEdgeId={inspectedEdgeId}
      onInspectedEdgeIdChange={setInspectedEdgeId}
      renderEdgeInspector={(context) => (
        <div className="grid gap-1">
          <strong>{context.label ?? context.edgeId}</strong>
          <span>
            {context.sourceId} to {context.targetId}
          </span>
        </div>
      )}
      nodes={[
        { id: "web", label: "Web", x: 0, y: 0 },
        { id: "api", label: "API", x: 280, y: 0 },
        { id: "db", label: "Database", x: 560, y: 0 },
      ]}
      edges={[
        { id: "web-api", source: "web", target: "api", label: "requests" },
        { id: "api-db", source: "api", target: "db", label: "reads" },
      ]}
    />
  );
}
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
Generated API documentation is published under <https://moritzbrantner.github.io/diagrams/api/>.

## API Overview

- `ArchitectureDiagram` for systems, boundaries, stores, queues, and external integrations.
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

## Interaction Pattern

Interactive diagrams keep their static `role="img"` surface until selection, actions, or keyboard
props are supplied. Node-like diagrams use the same controlled shape:

```tsx
import { RelationshipMap } from "@moritzbrantner/diagrams";

export function InteractiveMap() {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>("api");

  return (
    <RelationshipMap
      ariaLabel="Service relationships"
      selectedNodeId={selectedNodeId}
      onNodeSelect={(node) => setSelectedNodeId(node.id)}
      onNodeDeselect={() => setSelectedNodeId(null)}
      nodeActions={[
        {
          id: "inspect",
          label: "Inspect",
          onSelect: (node) => console.log(node.id),
        },
      ]}
      nodes={[
        { id: "api", label: "API", x: 0, y: 0 },
        { id: "db", label: "Database", x: 280, y: 0 },
      ]}
      edges={[{ id: "api-db", source: "api", target: "db", label: "reads" }]}
    />
  );
}
```

When interaction is enabled, arrow keys move focus between enabled items and Enter or Space
activates the focused item.

## Collapse Controls

Hierarchical and grouped diagrams expose controlled collapse state. Expansion defaults to fully
expanded when no state is supplied.

```tsx
import { ArchitectureDiagram, DecisionTree } from "@moritzbrantner/diagrams";

export function CollapsibleDiagrams() {
  return (
    <>
      <DecisionTree
        expandedNodeIds={["root"]}
        root={{
          id: "root",
          label: "Launch?",
          children: [
            {
              id: "yes",
              label: "Yes",
              target: {
                id: "ship",
                label: "Ship",
                children: [
                  { id: "announce", label: "Announce", target: { id: "done", label: "Done" } },
                ],
              },
            },
          ],
        }}
      />
      <ArchitectureDiagram
        collapsedBoundaryIds={["platform"]}
        boundaries={[{ id: "platform", label: "Platform" }]}
        nodes={[
          { id: "api", label: "API", boundaryId: "platform" },
          { id: "db", label: "Database", boundaryId: "platform" },
          { id: "user", label: "User", x: 560, y: 0 },
        ]}
        connections={[{ id: "user-api", source: "user", target: "api" }]}
      />
    </>
  );
}
```

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

## Canvas Interactions

Node-edge SVG diagrams are static by default. Pass `interactiveFeatures={true}` to enable built-in
pan/zoom controls, connected-path highlighting, local search, and the edge inspector.

```tsx
<RelationshipMap
  interactiveFeatures={true}
  nodes={[
    { id: "product", label: "Product" },
    { id: "engineering", label: "Engineering" },
  ]}
  edges={[{ id: "handoff", source: "product", target: "engineering", label: "handoff" }]}
/>
```

Viewport, search, highlight, and inspector state can be controlled by host applications.

```tsx
import * as React from "react";
import { RelationshipMap, type DiagramViewport } from "@moritzbrantner/diagrams";

export function ControlledCanvas() {
  const [viewport, setViewport] = React.useState<DiagramViewport>({
    x: -40,
    y: -40,
    width: 720,
    height: 420,
  });

  return (
    <RelationshipMap
      interactiveFeatures={{ viewport: true, controls: "always" }}
      viewport={viewport}
      onViewportChange={setViewport}
      nodes={[
        { id: "api", label: "API" },
        { id: "db", label: "DB" },
      ]}
      edges={[{ id: "api-db", source: "api", target: "db", label: "writes" }]}
    />
  );
}
```

```tsx
import * as React from "react";
import { DependencyGraph } from "@moritzbrantner/diagrams";

export function SearchableGraph() {
  const [query, setQuery] = React.useState("orders");

  return (
    <DependencyGraph
      interactiveFeatures={{ search: true, pathHighlight: true }}
      searchQuery={query}
      onSearchQueryChange={setQuery}
      nodes={[
        { id: "orders", label: "Orders" },
        { id: "billing", label: "Billing" },
      ]}
      edges={[{ id: "orders-billing", source: "orders", target: "billing", label: "events" }]}
    />
  );
}
```

```tsx
import { ArchitectureDiagram } from "@moritzbrantner/diagrams";

<ArchitectureDiagram
  interactiveFeatures={{ edgeInspector: true }}
  nodes={[
    { id: "api", label: "API" },
    { id: "orders", label: "Orders" },
  ]}
  connections={[{ id: "api-orders", source: "api", target: "orders", protocol: "HTTP" }]}
  renderEdgeInspector={(context) => (
    <div>
      {context.edgeId}: {context.sourceId} to {context.targetId}
    </div>
  )}
/>;
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
