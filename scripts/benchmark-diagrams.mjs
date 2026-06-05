import { existsSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = path.join(packageRoot, "dist", "index.js");

if (!existsSync(distEntry)) {
  console.error("@moritzbrantner/diagrams benchmark requires dist/. Run `bun run build` first.");
  process.exit(1);
}

const {
  DependencyGraph,
  GanttChart,
  RelationshipMap,
  UmlDiagram,
  getUmlDiagramBounds,
  getVisibleOrgChartNodes,
} = await import(distEntry);

const runFullMatrix = process.env.DIAGRAMS_BENCH_FULL === "1";
const thresholdMs = Number(process.env.DIAGRAMS_BENCH_THRESHOLD_MS ?? 1_500);
const dependencyNodeCount = runFullMatrix ? 1_000 : 500;
const dependencyEdgeCount = runFullMatrix ? 2_000 : 1_000;
const relationshipNodeCount = runFullMatrix ? 1_000 : 500;
const relationshipEdgeCount = runFullMatrix ? 2_000 : 1_000;
const umlNodeCount = runFullMatrix ? 1_000 : 500;
const umlEdgeCount = runFullMatrix ? 2_000 : 1_000;
const ganttTaskCount = runFullMatrix ? 2_000 : 1_000;
const orgDepth = runFullMatrix ? 6 : 5;
const orgWidth = runFullMatrix ? 4 : 4;
const results = [];

const orgNodes = createOrgTree(orgDepth, orgWidth);
const expandedIds = new Set(flattenOrgIds(orgNodes));
results.push(
  benchmark("diagrams.org.visible.large", () => {
    const visible = getVisibleOrgChartNodes(orgNodes, expandedIds);

    assert(visible.length > 100, "org benchmark should produce many visible nodes");
  }),
);

const dependencyNodes = createPositionedNodes(dependencyNodeCount);
const dependencyEdges = createDependencyEdges(dependencyEdgeCount, dependencyNodeCount);
results.push(
  benchmark("diagrams.dependency.render.large", () => {
    const markup = renderToStaticMarkup(
      React.createElement(DependencyGraph, {
        ariaLabel: "Large dependency graph",
        edges: dependencyEdges,
        nodes: dependencyNodes,
      }),
    );

    assertFiniteMarkup(markup);
  }),
);
results.push(
  benchmark("diagrams.dependency.render.interactive.large", () => {
    const markup = renderToStaticMarkup(
      React.createElement(DependencyGraph, {
        ariaLabel: "Large interactive dependency graph",
        defaultFocusedNodeId: "node-0",
        edges: dependencyEdges,
        nodeActions: [{ id: "inspect", label: "Inspect" }],
        nodes: dependencyNodes,
        onNodeSelect: () => undefined,
        selectedNodeId: "node-1",
      }),
    );

    assertFiniteMarkup(markup);
  }),
);

const relationshipNodes = createPositionedNodes(relationshipNodeCount);
const relationshipEdges = createEdges(relationshipEdgeCount, relationshipNodeCount);
results.push(
  benchmark("diagrams.relationship.render.large", () => {
    const markup = renderToStaticMarkup(
      React.createElement(RelationshipMap, {
        ariaLabel: "Large relationship map",
        edges: relationshipEdges,
        nodes: relationshipNodes,
      }),
    );

    assertFiniteMarkup(markup);
  }),
);

const umlNodes = createPositionedNodes(umlNodeCount);
const umlEdges = createEdges(umlEdgeCount, umlNodeCount);
results.push(
  benchmark("diagrams.uml.bounds.large", () => {
    const bounds = getUmlDiagramBounds(
      umlNodes.map((node) => ({
        ...node,
        height: node.height ?? 92,
        width: node.width ?? 184,
      })),
      umlEdges,
    );

    assert(Number.isFinite(bounds.x + bounds.y + bounds.width + bounds.height), "finite bounds");
    assert(bounds.width > 0 && bounds.height > 0, "positive bounds");
  }),
);
results.push(
  benchmark("diagrams.uml.render.large", () => {
    const markup = renderToStaticMarkup(
      React.createElement(UmlDiagram, {
        ariaLabel: "Large UML diagram",
        edges: umlEdges,
        nodes: umlNodes,
      }),
    );

    assertFiniteMarkup(markup);
  }),
);

const ganttTasks = createGanttTasks(ganttTaskCount);
results.push(
  benchmark("diagrams.gantt.render.large", () => {
    const markup = renderToStaticMarkup(
      React.createElement(GanttChart, {
        ariaLabel: "Large Gantt chart",
        endDate: "2026-12-31",
        startDate: "2026-01-01",
        tasks: ganttTasks,
      }),
    );

    assertFiniteMarkup(markup);
  }),
);

for (const result of results) {
  console.log(`${result.name}: ${result.durationMs.toFixed(1)}ms`);
}

if (!runFullMatrix) {
  console.log("diagrams.full-matrix.skipped: set DIAGRAMS_BENCH_FULL=1 to include larger inputs");
}

const slowBenchmarks = results.filter(
  (result) =>
    [
      "diagrams.org.visible.large",
      "diagrams.dependency.render.large",
      "diagrams.dependency.render.interactive.large",
      "diagrams.relationship.render.large",
      "diagrams.uml.bounds.large",
      "diagrams.gantt.render.large",
    ].includes(result.name) && result.durationMs > thresholdMs,
);

if (slowBenchmarks.length > 0) {
  console.error(
    `@moritzbrantner/diagrams stable benchmarks exceeded ${thresholdMs}ms: ${slowBenchmarks
      .map((result) => result.name)
      .join(", ")}`,
  );
  process.exit(1);
}

function benchmark(name, run) {
  const startedAt = performance.now();

  run();

  return {
    durationMs: performance.now() - startedAt,
    name,
  };
}

function createOrgTree(depth, width, prefix = "node") {
  if (depth <= 0) {
    return [];
  }

  return Array.from({ length: width }, (_, index) => {
    const id = `${prefix}-${index}`;

    return {
      children: createOrgTree(depth - 1, width, id),
      id,
      label: `Node ${id}`,
    };
  });
}

function flattenOrgIds(nodes) {
  return nodes.flatMap((node) => [node.id, ...flattenOrgIds(node.children ?? [])]);
}

function createPositionedNodes(count) {
  const columns = Math.ceil(Math.sqrt(count));

  return Array.from({ length: count }, (_, index) => ({
    description: `Description ${index}`,
    height: 92,
    id: `node-${index}`,
    label: `Node ${index}`,
    width: 184,
    x: (index % columns) * 260,
    y: Math.floor(index / columns) * 150,
  }));
}

function createEdges(count, nodeCount) {
  return Array.from({ length: count }, (_, index) => ({
    direction: index % 3 === 0 ? "both" : "forward",
    id: `edge-${index}`,
    kind: index % 5 === 0 ? "dependency" : "association",
    label: `Edge ${index}`,
    source: `node-${index % nodeCount}`,
    target: `node-${(index * 17 + 3) % nodeCount}`,
  }));
}

function createDependencyEdges(count, nodeCount) {
  const kinds = ["runtime", "build", "peer", "optional", "blocking"];

  return Array.from({ length: count }, (_, index) => ({
    direction: index % 3 === 0 ? "both" : "forward",
    id: `dependency-edge-${index}`,
    kind: kinds[index % kinds.length],
    label: `Dependency ${index}`,
    source: `node-${index % nodeCount}`,
    target: `node-${(index * 17 + 3) % nodeCount}`,
  }));
}

function createGanttTasks(count) {
  const start = Date.UTC(2026, 0, 1);

  return Array.from({ length: count }, (_, index) => {
    const startOffset = index % 300;
    const duration = 2 + (index % 21);

    return {
      deadlineDate: new Date(start + (startOffset + duration + 2) * 86_400_000).toISOString(),
      description: `Task ${index} description`,
      endDate: new Date(start + (startOffset + duration) * 86_400_000).toISOString(),
      id: `task-${index}`,
      label: `Task ${index}`,
      progress: (index % 100) / 100,
      startDate: new Date(start + startOffset * 86_400_000).toISOString(),
    };
  });
}

function assertFiniteMarkup(markup) {
  assert(!/NaN|Infinity/.test(markup), "rendered markup should not contain invalid numbers");
  assert(markup.length > 0, "rendered markup should not be empty");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
