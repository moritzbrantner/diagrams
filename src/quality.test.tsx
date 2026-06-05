import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
  ArchitectureDiagram,
  BurndownChart,
  DecisionTree,
  DependencyGraph,
  EntityRelationshipDiagram,
  GanttChart,
  JourneyMap,
  MindMap,
  OrgChart,
  RelationshipMap,
  SequenceDiagram,
  StateMachineDiagram,
  SwimlaneDiagram,
  TimelineDiagram,
  UmlDiagram,
  getVisibleOrgChartNodes,
  insertOrgChartNode,
  removeOrgChartNode,
  updateOrgChartNode,
  type GanttChartTask,
  type OrgChartNodeData,
} from "@moritzbrantner/diagrams";

describe("diagram quality invariants", () => {
  test("emits finite SVG geometry for routed edges and date scales", () => {
    const { container } = render(
      <>
        <RelationshipMap
          ariaLabel="Dependency map"
          nodes={[
            { id: "api", label: "API", x: 0, y: 0 },
            { id: "orders", label: "Orders", x: 260, y: 120 },
            { id: "billing", label: "Billing", x: 520, y: 0 },
          ]}
          edges={[
            { id: "api-orders", source: "api", target: "orders", label: "routes" },
            {
              id: "orders-billing",
              source: "orders",
              target: "billing",
              direction: "both",
              points: [
                { x: 260, y: 120 },
                { x: 380, y: 220 },
                { x: 520, y: 0 },
              ],
            },
          ]}
        />
        <BurndownChart
          ariaLabel="Sprint burndown"
          startDate="2026-04-01"
          endDate="2026-04-01"
          totalWork={40}
          points={[
            { date: "2026-04-01", remaining: 40 },
            { date: "2026-04-01", remaining: 20 },
          ]}
        />
        <GanttChart
          ariaLabel="Release plan"
          startDate="2026-04-01"
          endDate="2026-04-01"
          tasks={[
            {
              id: "brief",
              label: "Brief",
              startDate: "2026-04-01",
              endDate: "2026-04-01",
            },
          ]}
        />
        <SequenceDiagram
          ariaLabel="Sequence"
          participants={[
            { id: "client", label: "Client" },
            { id: "api", label: "API" },
          ]}
          messages={[{ id: "request", from: "client", to: "api", label: "Request" }]}
        />
        <SwimlaneDiagram
          ariaLabel="Swimlane"
          lanes={[{ id: "team", label: "Team" }]}
          steps={[
            { id: "start", laneId: "team", label: "Start", x: Number.NaN },
            { id: "end", laneId: "team", label: "End", y: Number.POSITIVE_INFINITY },
          ]}
          connectors={[{ id: "start-end", source: "start", target: "end" }]}
        />
        <DependencyGraph
          ariaLabel="Dependencies"
          nodes={[
            { id: "app", label: "App", x: Number.NaN },
            { id: "pkg", label: "Package", y: Number.POSITIVE_INFINITY },
          ]}
          edges={[{ id: "app-pkg", source: "app", target: "pkg" }]}
        />
        <ArchitectureDiagram
          ariaLabel="Architecture"
          nodes={[
            { id: "api", label: "API", x: Number.NaN },
            { id: "db", label: "DB", kind: "database" },
          ]}
          connections={[{ id: "api-db", source: "api", target: "db" }]}
        />
        <EntityRelationshipDiagram
          ariaLabel="ERD"
          entities={[
            { id: "orders", name: "orders", x: Number.NaN },
            { id: "customers", name: "customers", y: Number.POSITIVE_INFINITY },
          ]}
          relations={[{ id: "customers-orders", source: "customers", target: "orders" }]}
        />
        <DecisionTree
          ariaLabel="Decision"
          nodes={[
            { id: "ready", label: "Ready?", x: Number.NaN },
            { id: "ship", label: "Ship", y: Number.POSITIVE_INFINITY },
          ]}
          edges={[{ id: "ready-ship", source: "ready", target: "ship" }]}
          layout="manual"
        />
        <StateMachineDiagram
          ariaLabel="State"
          states={[
            { id: "draft", label: "Draft", x: Number.NaN },
            { id: "review", label: "Review", y: Number.POSITIVE_INFINITY },
          ]}
          transitions={[{ id: "draft-review", source: "draft", target: "review" }]}
        />
        <MindMap
          ariaLabel="Mind"
          nodes={[
            { id: "root", label: "Root", x: Number.NaN },
            { id: "child", label: "Child", parentId: "root", y: Number.POSITIVE_INFINITY },
          ]}
        />
        <TimelineDiagram
          ariaLabel="Timeline"
          items={[
            { id: "valid", date: "2026-04-01", label: "Valid" },
            { id: "invalid", date: "not-a-date", label: "Invalid" },
          ]}
        />
      </>,
    );

    expectNoInvalidSvgGeometry(container);
  });

  test("ignores invalid dates without rendering NaN or Infinity", () => {
    const { container } = render(
      <>
        <BurndownChart
          ariaLabel="Invalid burndown"
          startDate="not-a-date"
          endDate="also-not-a-date"
          points={[
            { date: "not-a-date", remaining: 8 },
            { date: "2026-04-02", remaining: 4 },
          ]}
        />
        <GanttChart
          ariaLabel="Invalid Gantt"
          startDate="not-a-date"
          endDate="also-not-a-date"
          tasks={[
            {
              deadlineDate: "not-a-date",
              earliestStartDate: "also-not-a-date",
              endDate: "not-a-date",
              id: "invalid",
              label: "Invalid",
              startDate: "not-a-date",
            },
            {
              endDate: "2026-04-04",
              id: "valid",
              label: "Valid",
              startDate: "2026-04-02",
            },
          ]}
        />
      </>,
    );

    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expectNoInvalidSvgGeometry(container);
    expect(screen.getByRole("img", { name: "Invalid burndown" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Invalid Gantt" })).toBeTruthy();
  });

  test("renders empty states with stable accessible surfaces", () => {
    render(
      <>
        <RelationshipMap nodes={[]} emptyMessage="No relationships" />
        <BurndownChart points={[]} emptyMessage="No sprint data" />
        <GanttChart tasks={[]} emptyMessage="No scheduled work" />
        <SequenceDiagram participants={[]} emptyMessage="No sequence" />
        <SwimlaneDiagram lanes={[]} emptyMessage="No swimlanes" />
        <DependencyGraph nodes={[]} emptyMessage="No dependency nodes" />
        <ArchitectureDiagram nodes={[]} emptyMessage="No architecture nodes" />
        <EntityRelationshipDiagram entities={[]} emptyMessage="No entities" />
        <DecisionTree nodes={[]} emptyMessage="No decisions" />
        <StateMachineDiagram states={[]} emptyMessage="No states" />
        <MindMap nodes={[]} emptyMessage="No mind nodes" />
        <TimelineDiagram items={[]} emptyMessage="No timeline" />
        <JourneyMap phases={[]} emptyMessage="No journey" />
      </>,
    );

    expect(screen.getByRole("img", { name: "Relationship map" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Burndown chart" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Gantt chart" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Sequence diagram" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Swimlane diagram" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Dependency graph" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Architecture diagram" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Entity relationship diagram" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Decision tree" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "State machine diagram" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Mind map" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Timeline diagram" })).toBeTruthy();
    expect(screen.getByRole("grid", { name: "Journey map" })).toBeTruthy();
    expect(screen.getByText("No relationships")).toBeTruthy();
    expect(screen.getByText("No sprint data")).toBeTruthy();
    expect(screen.getByText("No scheduled work")).toBeTruthy();
    expect(screen.getByText("No sequence")).toBeTruthy();
    expect(screen.getByText("No journey")).toBeTruthy();
  });

  test("keeps tree helpers and task rendering from mutating caller input", () => {
    const nodes: OrgChartNodeData[] = [
      {
        children: [{ id: "design", label: "Design" }],
        id: "owner",
        label: "Owner",
      },
    ];
    const tasks: GanttChartTask[] = [
      {
        endDate: "2026-04-04",
        id: "brief",
        label: "Brief",
        progress: 0.4,
        startDate: "2026-04-01",
      },
    ];
    const nodeSnapshot = structuredClone(nodes);
    const taskSnapshot = structuredClone(tasks);

    getVisibleOrgChartNodes(nodes, new Set(["owner"]));
    insertOrgChartNode(nodes, "owner", { id: "platform", label: "Platform" });
    updateOrgChartNode(nodes, "design", (node) => ({ ...node, label: "Design systems" }));
    removeOrgChartNode(nodes, "design");
    render(<GanttChart tasks={tasks} />);

    expect(nodes).toEqual(nodeSnapshot);
    expect(tasks).toEqual(taskSnapshot);
  });

  test("falls back from disabled focused nodes in keyboard-managed diagrams", () => {
    const onUmlSelect = vi.fn();

    const { container } = render(
      <>
        <OrgChart
          nodes={[
            {
              children: [
                { id: "design", label: "Design" },
                { id: "platform", label: "Platform" },
              ],
              id: "owner",
              label: "Owner",
            },
          ]}
          defaultExpandedDepth={2}
          defaultFocusedNodeId="design"
          getNodeDisabled={(node) => node.id === "design"}
          onNodeSelect={vi.fn()}
        />
        <UmlDiagram
          ariaLabel="Focusable services"
          defaultFocusedNodeId="orders"
          getNodeDisabled={(node) => node.id === "orders"}
          nodes={[
            { id: "api", label: "API", x: 0, y: 0 },
            { id: "orders", label: "Orders", x: 260, y: 0 },
          ]}
          onNodeSelect={onUmlSelect}
        />
      </>,
    );

    const disabledOrgNode = screen
      .getByRole("treeitem", { name: "Design" })
      .querySelector('[data-slot="org-chart-node"]');
    const focusedOrgNode = container.querySelector(
      '[data-slot="org-chart-node"][data-focused="true"]',
    );
    const disabledUmlNode = container.querySelector(
      '[data-slot="uml-diagram-node-interaction"][data-node-id="orders"]',
    );
    const focusedUmlNode = container.querySelector(
      '[data-slot="uml-diagram-node-interaction"][data-focused="true"]',
    );

    expect(disabledOrgNode?.getAttribute("data-disabled")).toBe("true");
    expect(focusedOrgNode?.getAttribute("data-disabled")).toBeNull();
    expect(disabledUmlNode?.getAttribute("data-disabled")).toBe("true");
    expect(focusedUmlNode?.getAttribute("data-disabled")).toBeNull();
  });
});

function expectNoInvalidSvgGeometry(container: HTMLElement) {
  const invalid: string[] = [];
  const finiteAttributes = ["x", "y", "x1", "x2", "y1", "y2", "cx", "cy", "r", "rx", "ry"];
  const nonNegativeAttributes = ["height", "width"];

  for (const element of Array.from(container.querySelectorAll("svg *"))) {
    for (const attribute of finiteAttributes) {
      const value = element.getAttribute(attribute);

      if (value !== null && value !== "auto" && !Number.isFinite(Number(value))) {
        invalid.push(`${element.tagName}[${attribute}="${value}"]`);
      }
    }

    for (const attribute of nonNegativeAttributes) {
      const value = element.getAttribute(attribute);

      if (value !== null && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        invalid.push(`${element.tagName}[${attribute}="${value}"]`);
      }
    }

    for (const attribute of ["d", "points", "transform"]) {
      const value = element.getAttribute(attribute);

      if (value && /NaN|Infinity/.test(value)) {
        invalid.push(`${element.tagName}[${attribute}="${value}"]`);
      }
    }
  }

  expect(invalid).toEqual([]);
}
