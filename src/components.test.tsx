import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ArchitectureDiagram } from "./architecture-diagram";
import { DecisionTree } from "./decision-tree";
import { DependencyGraph } from "./dependency-graph";
import { EntityRelationshipDiagram } from "./entity-relationship-diagram";
import { GanttChart } from "./gantt-chart";
import { JourneyMap } from "./journey-map";
import { MindMap } from "./mind-map";
import { OrgChart, insertOrgChartNode, removeOrgChartNode, updateOrgChartNode } from "./org-chart";
import { ProcessMap } from "./process-map";
import { RelationshipMap } from "./relationship-map";
import { SequenceDiagram } from "./sequence-diagram";
import { StateMachineDiagram } from "./state-machine-diagram";
import { SwimlaneDiagram } from "./swimlane-diagram";
import { TimelineDiagram } from "./timeline-diagram";

const orgNodes = [
  {
    id: "vp",
    label: "VP Product",
    description: "Business owner",
    children: [
      { id: "design", label: "Design Lead" },
      {
        id: "eng",
        label: "Engineering Lead",
        children: [{ id: "qa", label: "QA Lead" }],
      },
    ],
  },
];

function getOrgChartNode(name: string) {
  const branch = screen.getByRole("treeitem", { name });
  const node = branch.querySelector<HTMLElement>('[data-slot="org-chart-node"]');

  if (!node) {
    throw new Error(`Could not find org chart node ${name}`);
  }

  return node;
}

describe("OrgChart", () => {
  test("renders recursive children, empty state, and custom nodes", () => {
    const { rerender } = render(<OrgChart nodes={orgNodes} />);

    expect(screen.getByText("VP Product")).toBeTruthy();
    expect(screen.getByText("QA Lead")).toBeTruthy();

    rerender(<OrgChart nodes={[]} emptyMessage="No team" />);
    expect(screen.getByText("No team")).toBeTruthy();

    rerender(<OrgChart nodes={orgNodes} renderNode={(node) => <strong>{node.id}</strong>} />);
    expect(screen.getByText("vp")).toBeTruthy();
  });

  test("supports branch expansion, node selection, and helpers", () => {
    const onNodeSelect = vi.fn();

    render(<OrgChart nodes={orgNodes} selectedNodeId="eng" onNodeSelect={onNodeSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse VP Product" }));
    expect(screen.queryByText("Design Lead")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Expand VP Product" }));
    fireEvent.click(getOrgChartNode("Engineering Lead"));
    expect(onNodeSelect).toHaveBeenCalled();

    const inserted = insertOrgChartNode(orgNodes, "eng", {
      id: "ops",
      label: "Ops Lead",
    });
    const updated = updateOrgChartNode(inserted, "ops", (node) => ({
      ...node,
      label: "Ops",
    }));
    const removed = removeOrgChartNode(updated, "ops");

    expect(JSON.stringify(inserted)).toContain("Ops Lead");
    expect(JSON.stringify(updated)).toContain("Ops");
    expect(JSON.stringify(removed)).not.toContain("Ops");
  });
});

describe("ProcessMap", () => {
  test("renders horizontal and vertical orientations with status metadata", () => {
    const steps = [
      {
        id: "plan",
        label: "Plan",
        status: "done" as const,
        tone: "success" as const,
      },
      {
        id: "build",
        label: "Build",
        status: "active" as const,
        tone: "accent" as const,
      },
      { id: "ship", label: "Ship", status: "pending" as const },
    ];
    const { rerender, container } = render(<ProcessMap steps={steps} />);

    expect(screen.getByRole("list")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(
      container.querySelector('[data-slot="process-map"]')?.getAttribute("data-orientation"),
    ).toBe("horizontal");
    expect(
      container.querySelector('[data-slot="process-map-step"]')?.getAttribute("data-tone"),
    ).toBe("success");
    expect(
      container.querySelector('[data-slot="process-map-connector"]')?.getAttribute("aria-hidden"),
    ).toBe("true");

    rerender(<ProcessMap steps={steps} orientation="vertical" />);
    expect(
      container.querySelector('[data-slot="process-map"]')?.getAttribute("data-orientation"),
    ).toBe("vertical");
  });
});

describe("GanttChart", () => {
  test("renders task bars, earliest starts, deadlines, and late state", () => {
    const { container, rerender } = render(
      <GanttChart
        ariaLabel="Release plan"
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
            id: "validation",
            label: "Validation",
            startDate: "2026-04-15",
            endDate: "2026-04-22",
            earliestStartDate: "2026-04-12",
            deadlineDate: "2026-04-21",
            progress: 0.3,
          },
        ]}
        startDate="2026-04-01"
        endDate="2026-04-24"
      />,
    );

    expect(screen.getByRole("img", { name: "Release plan" })).toBeTruthy();
    expect(screen.getByText("Release brief")).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="gantt-chart-task-bar"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-slot="gantt-chart-earliest-start"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-slot="gantt-chart-deadline"]')).toHaveLength(2);
    expect(container.querySelector('[data-task-id="validation"]')?.getAttribute("data-late")).toBe(
      "true",
    );

    rerender(<GanttChart tasks={[]} emptyMessage="No release tasks" />);
    expect(screen.getByText("No release tasks")).toBeTruthy();
  });
});

describe("RelationshipMap", () => {
  test("renders nodes, direction markers, manual points, and empty state", () => {
    const relationshipNodes = [
      { id: "product", label: "Product", x: 0, y: 0 },
      { id: "sales", label: "Sales", x: 280, y: 0 },
      { id: "support", label: "Support", x: 280, y: 160 },
    ];
    const { container, rerender } = render(
      <RelationshipMap
        ariaLabel="Stakeholder map"
        nodes={relationshipNodes}
        edges={[
          { id: "valid", source: "product", target: "sales", label: "aligns" },
          { id: "invalid", source: "missing", target: "sales" },
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: "Stakeholder map" })).toBeTruthy();
    expect(screen.getByText("Product")).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="relationship-map-edge"]')).toHaveLength(1);

    rerender(
      <RelationshipMap
        nodes={relationshipNodes}
        edges={[
          {
            id: "both",
            source: "product",
            target: "support",
            direction: "both",
            points: [
              { x: 100, y: 100 },
              { x: 180, y: 140 },
              { x: 280, y: 200 },
            ],
          },
        ]}
      />,
    );
    const path = container.querySelector('[data-slot="relationship-map-edge"] path');

    expect(path?.getAttribute("marker-start")).toContain("url(");
    expect(path?.getAttribute("marker-end")).toContain("url(");
    expect(path?.getAttribute("d")).toContain("M 100 100 L 180 140 L 280 200");

    rerender(<RelationshipMap nodes={[]} emptyMessage="No dependencies" />);
    expect(screen.getByText("No dependencies")).toBeTruthy();
  });

  test("opens canvas settings from the context menu and toggles labels", () => {
    const { container } = render(
      <RelationshipMap
        ariaLabel="Label settings map"
        nodes={[
          { id: "product", label: "Product", x: 0, y: 0 },
          { id: "sales", label: "Sales", x: 280, y: 0 },
        ]}
        edges={[{ id: "briefs", source: "product", target: "sales", label: "briefs" }]}
      />,
    );
    const svg = screen.getByRole("img", { name: "Label settings map" });

    expect(svg.getAttribute("data-show-labels")).toBe("true");

    fireEvent.contextMenu(svg, { clientX: 24, clientY: 32 });
    expect(screen.getByRole("menu", { name: "Diagram settings" })).toBeTruthy();

    const labelsToggle = screen.getByRole("menuitemcheckbox", { name: /labels/i });
    expect(labelsToggle.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(labelsToggle);
    expect(svg.getAttribute("data-show-labels")).toBe("false");
    expect(labelsToggle.getAttribute("aria-checked")).toBe("false");
    expect(container.querySelector('[data-diagram-label="true"]')).toBeTruthy();
    expect(container.querySelector('[data-diagram-edge="true"]')).toBeTruthy();
    expect(svg.getAttribute("class")).toContain("hover");
  });

  test("supports interactive viewport controls, highlighting, search, and edge inspection", async () => {
    const onViewportChange = vi.fn();
    const { container } = render(
      <RelationshipMap
        ariaLabel="Interactive canvas map"
        interactiveFeatures={true}
        defaultViewport={{ x: -50, y: -50, width: 500, height: 300 }}
        onViewportChange={onViewportChange}
        nodes={[
          { id: "product", label: "Product", x: 0, y: 0 },
          { id: "sales", label: "Sales", x: 260, y: 0 },
          { id: "support", label: "Support", x: 520, y: 0 },
        ]}
        edges={[{ id: "briefs", source: "product", target: "sales", label: "briefs" }]}
        renderEdgeInspector={(context) => <div>Edge {context.edgeId}</div>}
      />,
    );
    const svg = screen.getByRole("img", { name: "Interactive canvas map" });
    const initialViewBox = svg.getAttribute("viewBox");

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(svg.getAttribute("viewBox")).not.toBe(initialViewBox);
    expect(onViewportChange).toHaveBeenCalledWith(expect.any(Object), "zoom");

    fireEvent.click(screen.getByRole("button", { name: "Reset view" }));
    expect(svg.getAttribute("viewBox")).toBe("-50 -50 500 300");
    expect(onViewportChange).toHaveBeenCalledWith(expect.any(Object), "reset");

    const product = container.querySelector<SVGGElement>(
      '[data-slot="relationship-map-node-interaction"][data-node-id="product"]',
    );
    const sales = container.querySelector<SVGGElement>(
      '[data-slot="relationship-map-node-interaction"][data-node-id="sales"]',
    );
    const support = container.querySelector<SVGGElement>(
      '[data-slot="relationship-map-node-interaction"][data-node-id="support"]',
    );
    const edge = container.querySelector<SVGGElement>('[data-slot="relationship-map-edge"]');

    if (!product || !sales || !support || !edge) {
      throw new Error("Expected relationship map interaction targets");
    }

    fireEvent.pointerEnter(product);
    expect(product.getAttribute("data-highlight-state")).toBe("active");
    expect(sales.getAttribute("data-highlight-state")).toBe("related");
    expect(support.getAttribute("data-highlight-state")).toBe("dimmed");
    expect(edge.getAttribute("data-highlight-state")).toBe("related");

    fireEvent.click(screen.getByRole("button", { name: "Search diagram" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Search diagram" }), {
      target: { value: "briefs" },
    });

    await screen.findByText("1 / 1");
    await screen.findByText("Edge briefs");
  });

  test("supports node selection, actions, disabled nodes, waypoints, and group collapse", () => {
    const onNodeSelect = vi.fn();
    const onNodeActionSelect = vi.fn();
    const relationshipNodes = [
      { id: "product", label: "Product", groupId: "team", group: "Team", x: 0, y: 0 },
      { id: "sales", label: "Sales", groupId: "team", group: "Team", x: 260, y: 0 },
      { id: "support", label: "Support", x: 520, y: 0 },
    ];
    const { container, rerender } = render(
      <RelationshipMap
        ariaLabel="Interactive stakeholder map"
        nodes={relationshipNodes}
        edges={[
          {
            id: "waypoint",
            source: "product",
            target: "support",
            waypoints: [{ x: 260, y: 160 }],
          },
        ]}
        selectedNodeId="product"
        onNodeSelect={onNodeSelect}
        getNodeDisabled={(node) => node.id === "sales"}
        nodeActions={[{ id: "inspect", label: "Inspect" }]}
        onNodeActionSelect={onNodeActionSelect}
      />,
    );

    expect(screen.getByRole("group", { name: "Interactive stakeholder map" })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Inspect" })[0]);
    expect(onNodeActionSelect).toHaveBeenCalled();
    expect(onNodeSelect).not.toHaveBeenCalled();
    expect(
      container
        .querySelector('[data-node-id="sales"]')
        ?.closest("g")
        ?.getAttribute("data-disabled"),
    ).toBe("true");
    expect(
      container.querySelector('[data-slot="relationship-map-edge"] path')?.getAttribute("d"),
    ).toContain("260 160");

    rerender(
      <RelationshipMap
        nodes={relationshipNodes}
        edges={[{ id: "remap", source: "product", target: "support" }]}
        collapsedGroupIds={["team"]}
        onCollapsedGroupIdsChange={vi.fn()}
      />,
    );
    expect(screen.queryByText("Product")).toBeNull();
    expect(screen.getByText("Team")).toBeTruthy();
  });
});

describe("Next diagram primitives", () => {
  test("renders sequence, timeline, and journey diagrams with accessible surfaces", () => {
    const { container } = render(
      <>
        <SequenceDiagram
          ariaLabel="Checkout sequence"
          participants={[
            { id: "client", label: "Client" },
            { id: "api", label: "API" },
          ]}
          messages={[
            { id: "request", from: "client", to: "api", label: "Request" },
            { id: "invalid", from: "client", to: "missing", label: "Invalid" },
          ]}
        />
        <TimelineDiagram
          ariaLabel="Release timeline"
          orientation="vertical"
          items={[
            { id: "scope", date: "2026-04-01", label: "Scope" },
            { id: "bad", date: "bad-date", label: "Invalid" },
          ]}
        />
        <JourneyMap
          ariaLabel="Adoption journey"
          phases={[{ id: "discover", label: "Discover" }]}
          touchpoints={[
            { id: "docs", phaseId: "discover", label: "Read docs" },
            { id: "missing", phaseId: "missing", label: "Missing" },
          ]}
        />
      </>,
    );

    expect(screen.getByRole("img", { name: "Checkout sequence" })).toBeTruthy();
    expect(screen.getByText("Request")).toBeTruthy();
    expect(screen.queryByText("Invalid")).toBeNull();
    expect(screen.getByRole("list", { name: "Release timeline" })).toBeTruthy();
    expect(
      container.querySelector('[data-slot="timeline-diagram"]')?.getAttribute("data-orientation"),
    ).toBe("vertical");
    expect(screen.getByRole("grid", { name: "Adoption journey" })).toBeTruthy();
    expect(screen.queryByText("Missing")).toBeNull();
  });

  test("renders node-edge diagrams, filters invalid references, and honors manual paths", () => {
    const manualPoints = [
      { x: 10, y: 20 },
      { x: 120, y: 60 },
      { x: 240, y: 20 },
    ];
    const { container } = render(
      <>
        <SwimlaneDiagram
          ariaLabel="Release swimlanes"
          lanes={[{ id: "team", label: "Team" }]}
          steps={[
            { id: "start", laneId: "team", label: "Start" },
            { id: "end", laneId: "team", label: "End" },
          ]}
          connectors={[
            { id: "valid", source: "start", target: "end", label: "next", points: manualPoints },
            { id: "invalid", source: "start", target: "missing" },
          ]}
        />
        <DependencyGraph
          ariaLabel="Dependency graph"
          nodes={[
            { id: "app", label: "App" },
            { id: "pkg", label: "Package" },
          ]}
          edges={[
            { id: "valid", source: "app", target: "pkg" },
            { id: "invalid", source: "app", target: "missing" },
          ]}
        />
        <ArchitectureDiagram
          ariaLabel="Architecture"
          nodes={[
            { id: "api", label: "API" },
            { id: "db", label: "DB", kind: "database" },
          ]}
          connections={[{ id: "api-db", source: "api", target: "db" }]}
        />
      </>,
    );

    expect(screen.getByRole("img", { name: "Release swimlanes" })).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="swimlane-diagram-connector"]')).toHaveLength(1);
    expect(
      container.querySelector('[data-slot="swimlane-diagram-connector"] path')?.getAttribute("d"),
    ).toContain("M 10 20 L 120 60 L 240 20");
    expect(screen.getByRole("img", { name: "Dependency graph" })).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="dependency-graph-edge"]')).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Architecture" })).toBeTruthy();
    expect(screen.getByText("DB")).toBeTruthy();
  });

  test("renders ERD, decision, state machine, and mind map diagrams", () => {
    const decisionRoot = {
      id: "ready",
      label: "Ready?",
      children: [
        {
          id: "yes",
          label: "Yes",
          target: { id: "ship", label: "Ship", kind: "outcome" as const },
        },
      ],
    };
    const mindRoot = {
      id: "diagrams",
      label: "Diagrams",
      children: [{ id: "workflow", label: "Workflow" }],
    };
    const decisionSnapshot = structuredClone(decisionRoot);
    const mindSnapshot = structuredClone(mindRoot);
    const { container } = render(
      <>
        <EntityRelationshipDiagram
          ariaLabel="Order ERD"
          entities={[
            { id: "orders", name: "orders", fields: [{ id: "id", name: "id", key: "primary" }] },
            { id: "customers", name: "customers", x: 320, y: 80 },
            { id: "payments", name: "payments", x: 280, y: 0 },
            { id: "invoices", name: "invoices", x: 0, y: 120 },
          ]}
          relations={[
            {
              id: "valid",
              source: "customers",
              target: "orders",
              sourceCardinality: "one",
              targetCardinality: "zero-or-many",
            },
            {
              id: "offset",
              source: "invoices",
              target: "payments",
            },
          ]}
        />
        <DecisionTree ariaLabel="Release decision" root={decisionRoot} />
        <StateMachineDiagram
          ariaLabel="Release states"
          states={[
            { id: "draft", label: "Draft" },
            { id: "review", label: "Review" },
          ]}
          transitions={[{ id: "submit", source: "draft", target: "review", event: "submit" }]}
        />
        <MindMap ariaLabel="Diagram mind map" root={mindRoot} />
      </>,
    );

    expect(screen.getByRole("img", { name: "Order ERD" })).toBeTruthy();
    expect(screen.getByText("orders")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Release decision" })).toBeTruthy();
    expect(
      container.querySelector('[data-slot="decision-tree"]')?.getAttribute("data-layout"),
    ).toBe("tree");
    expect(screen.getByRole("img", { name: "Release states" })).toBeTruthy();
    expect(screen.getByText("submit")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Diagram mind map" })).toBeTruthy();
    expect(screen.getByText("Workflow")).toBeTruthy();
    const offsetRelationPath = container
      .querySelectorAll('[data-slot="entity-relationship-diagram-relation"] path')[1]
      ?.getAttribute("d");

    if (!offsetRelationPath) {
      throw new Error("Expected ERD offset relation path");
    }

    const offsetRelationCoordinates =
      offsetRelationPath.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];

    expect(offsetRelationCoordinates.length).toBeGreaterThanOrEqual(4);
    expect(offsetRelationCoordinates[0]).toBeCloseTo(offsetRelationCoordinates[2]);
    expect(offsetRelationCoordinates[1]).not.toBeCloseTo(offsetRelationCoordinates[3]);
    expect(offsetRelationCoordinates[offsetRelationCoordinates.length - 4]).toBeCloseTo(
      offsetRelationCoordinates[offsetRelationCoordinates.length - 2],
    );
    expect(offsetRelationCoordinates[offsetRelationCoordinates.length - 3]).not.toBeCloseTo(
      offsetRelationCoordinates[offsetRelationCoordinates.length - 1],
    );
    expect(decisionRoot).toEqual(decisionSnapshot);
    expect(mindRoot).toEqual(mindSnapshot);
  });
});

describe("Interactive diagram additions", () => {
  test("collapses architecture boundaries and hierarchical branches", () => {
    const { rerender } = render(
      <ArchitectureDiagram
        nodes={[
          { id: "api", label: "API", boundaryId: "platform", x: 0, y: 0 },
          { id: "db", label: "DB", boundaryId: "platform", x: 260, y: 0 },
          { id: "user", label: "User", x: 520, y: 0 },
        ]}
        boundaries={[{ id: "platform", label: "Platform" }]}
        connections={[{ id: "user-api", source: "user", target: "api" }]}
        collapsedBoundaryIds={["platform"]}
      />,
    );

    expect(screen.queryByText("API")).toBeNull();
    expect(screen.getByText("Platform")).toBeTruthy();

    rerender(
      <DecisionTree
        expandedNodeIds={["root"]}
        root={{
          id: "root",
          label: "Launch?",
          children: [
            {
              id: "root-yes",
              label: "Yes",
              target: {
                id: "yes",
                label: "Yes",
                children: [
                  { id: "yes-ship", label: "Ship", target: { id: "ship", label: "Ship" } },
                ],
              },
            },
          ],
        }}
      />,
    );
    expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ship")).toBeNull();

    rerender(
      <MindMap
        expandedNodeIds={["root"]}
        root={{
          id: "root",
          label: "Release",
          children: [{ id: "scope", label: "Scope", children: [{ id: "risk", label: "Risk" }] }],
        }}
      />,
    );
    expect(screen.getByText("Scope")).toBeTruthy();
    expect(screen.queryByText("Risk")).toBeNull();
  });

  test("selects workflow and timeline domain items without invalid geometry", () => {
    const onStepSelect = vi.fn();
    const onMessageSelect = vi.fn();
    const onTaskSelect = vi.fn();
    const onTimelineSelect = vi.fn();
    const onJourneyItemSelect = vi.fn();
    const { container } = render(
      <>
        <ProcessMap
          steps={[
            { id: "plan", label: "Plan" },
            { id: "ship", label: "Ship" },
          ]}
          onStepSelect={onStepSelect}
        />
        <SequenceDiagram
          participants={[
            { id: "client", label: "Client" },
            { id: "api", label: "API" },
          ]}
          messages={[{ id: "request", from: "client", to: "api", label: "Request" }]}
          onMessageSelect={onMessageSelect}
        />
        <GanttChart
          tasks={[
            {
              id: "brief",
              label: "Brief",
              startDate: "2026-04-01",
              endDate: "2026-04-03",
            },
          ]}
          onTaskSelect={onTaskSelect}
          todayDate="2026-04-02"
        />
        <TimelineDiagram
          items={[{ id: "release", date: "2026-04-01", label: "Release" }]}
          onItemSelect={onTimelineSelect}
          visibleRange={{ startDate: "2026-01-01", endDate: "2026-12-31" }}
          groupBy="month"
        />
        <JourneyMap
          phases={[{ id: "buy", label: "Buy" }]}
          lanes={[{ id: "ops", label: "Ops" }]}
          items={[{ id: "handoff", phaseId: "buy", laneId: "ops", label: "Handoff" }]}
          onItemSelect={onJourneyItemSelect}
        />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Plan" }));
    fireEvent.click(screen.getByRole("button", { name: "Request" }));
    fireEvent.click(screen.getByRole("button", { name: "Brief" }));
    fireEvent.click(screen.getByRole("button", { name: "Release" }));
    fireEvent.click(screen.getByRole("button", { name: "Handoff" }));

    expect(onStepSelect).toHaveBeenCalled();
    expect(onMessageSelect).toHaveBeenCalled();
    expect(onTaskSelect).toHaveBeenCalled();
    expect(onTimelineSelect).toHaveBeenCalled();
    expect(onJourneyItemSelect).toHaveBeenCalled();
    expect(container.innerHTML).not.toContain("NaN");
    expect(container.querySelector('[data-slot="gantt-chart-today"]')).toBeTruthy();
  });
});
