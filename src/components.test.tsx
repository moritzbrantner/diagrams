import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
  ChartAreaGraph,
  ChartBarGraph,
  ChartDonutGraph,
  ChartHistogramGraph,
  ChartLineGraph,
  ChartPretext,
  ChartPretextText,
  ChartSparkline,
} from "./charts";
import {
  OrgChart,
  insertOrgChartNode,
  removeOrgChartNode,
  updateOrgChartNode,
} from "./org-chart";
import { ProcessMap } from "./process-map";
import { RelationshipMap } from "./relationship-map";

const chartData = [
  { label: "Q1", actual: 24, target: 30 },
  { label: "Q2", actual: 36, target: 34 },
  { label: "Q3", actual: 42, target: 40 },
];

const chartSeries = [
  { key: "actual", label: "Actual", color: "var(--chart-1)" },
  { key: "target", label: "Target", color: "var(--chart-2)" },
];

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
  const node = branch.querySelector<HTMLElement>(
    '[data-slot="org-chart-node"]',
  );

  if (!node) {
    throw new Error(`Could not find org chart node ${name}`);
  }

  return node;
}

describe("chart graph components", () => {
  test("renders native line pretext before visible series", () => {
    render(
      <ChartLineGraph
        ariaLabel="Quarterly trend"
        data={chartData}
        series={chartSeries}
        pretext={[{ x: 300, y: 100, children: "Target range" }]}
      />,
    );

    const svg = screen.getByRole("img", { name: "Quarterly trend" });
    const pretext = svg.querySelector('[data-slot="chart-pretext"]');
    const series = svg.querySelector('[data-slot="chart-line-graph-series"]');

    expect(screen.getByText("Target range")).toBeTruthy();
    expect(pretext).not.toBeNull();
    expect(series).not.toBeNull();
    expect(pretext?.compareDocumentPosition(series as Element)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  test("renders bars, areas, sparkline, donut, labels, and empty states", () => {
    const { container, rerender } = render(
      <ChartBarGraph
        ariaLabel="Quarterly bars"
        data={chartData}
        series={chartSeries}
        summary="Pipeline is ahead."
        valueLabels
      />,
    );

    expect(screen.getByRole("img", { name: "Quarterly bars" })).toBeTruthy();
    expect(screen.getAllByText("Actual")).toHaveLength(1);
    expect(screen.getByText("Pipeline is ahead.")).toBeTruthy();
    expect(
      container.querySelectorAll('[data-slot="chart-value-label"]'),
    ).toHaveLength(6);

    rerender(
      <ChartAreaGraph
        ariaLabel="Quarterly area"
        data={chartData}
        series={chartSeries}
      />,
    );
    expect(screen.getByRole("img", { name: "Quarterly area" })).toBeTruthy();
    expect(
      container.querySelector('[data-slot="chart-area-graph-area"]'),
    ).not.toBeNull();

    rerender(
      <ChartSparkline
        ariaLabel="Quarterly sparkline"
        data={chartData}
        series={{ key: "actual", label: "Actual", color: "var(--chart-3)" }}
        showPoints
      />,
    );
    expect(
      screen.getByRole("img", { name: "Quarterly sparkline" }),
    ).toBeTruthy();

    rerender(
      <ChartDonutGraph
        ariaLabel="Quarterly donut"
        data={[
          { label: "Actual", value: 60 },
          { label: "Target", value: 40 },
        ]}
        labelKey="label"
      />,
    );
    expect(screen.getByRole("img", { name: "Quarterly donut" })).toBeTruthy();

    rerender(
      <ChartLineGraph
        ariaLabel="Empty trend"
        data={[]}
        series={chartSeries}
        emptyMessage="No trend data."
        noDataReason="Filters removed all rows."
      />,
    );
    expect(screen.getByText("No trend data.")).toBeTruthy();
    expect(screen.getByText("Filters removed all rows.")).toBeTruthy();
  });

  test("supports histogram bins and hover inspection", () => {
    const { container } = render(
      <ChartHistogramGraph
        ariaLabel="Score distribution"
        data={[
          { min: 0, max: 10, count: 4, label: "Low" },
          {
            min: 10,
            max: 20,
            count: 7,
            label: "High",
            color: "var(--chart-2)",
          },
        ]}
        countLabel="Responses"
      />,
    );
    const hitAreas = container.querySelectorAll('[data-slot="chart-hit-area"]');

    expect(hitAreas).toHaveLength(2);
    fireEvent.pointerEnter(hitAreas[1] as Element);

    const tooltip = container.querySelector(
      '[data-slot="chart-graph-tooltip"]',
    );

    expect(tooltip).not.toBeNull();
    expect(within(tooltip as HTMLElement).getByText("High")).toBeTruthy();
    expect(within(tooltip as HTMLElement).getByText("Responses")).toBeTruthy();
    expect(within(tooltip as HTMLElement).getByText("7")).toBeTruthy();
  });

  test("calls onDatumFocus and exposes standalone pretext primitives", () => {
    const handleDatumFocus = vi.fn();
    const { container, rerender } = render(
      <ChartLineGraph
        ariaLabel="Quarterly trend"
        data={chartData}
        series={chartSeries}
        xKey="label"
        onDatumFocus={handleDatumFocus}
      />,
    );

    fireEvent.focus(
      container.querySelectorAll('[data-slot="chart-hit-area"]')[1] as Element,
    );
    expect(handleDatumFocus).toHaveBeenCalledWith(chartData[1], 1);

    rerender(
      <svg>
        <ChartPretext>
          <ChartPretextText x={10} y={10}>
            Annotation
          </ChartPretextText>
        </ChartPretext>
      </svg>,
    );
    expect(screen.getByText("Annotation").getAttribute("data-slot")).toBe(
      "chart-pretext-text",
    );
  });
});

describe("OrgChart", () => {
  test("renders recursive children, empty state, and custom nodes", () => {
    const { rerender } = render(<OrgChart nodes={orgNodes} />);

    expect(screen.getByText("VP Product")).toBeTruthy();
    expect(screen.getByText("QA Lead")).toBeTruthy();

    rerender(<OrgChart nodes={[]} emptyMessage="No team" />);
    expect(screen.getByText("No team")).toBeTruthy();

    rerender(
      <OrgChart
        nodes={orgNodes}
        renderNode={(node) => <strong>{node.id}</strong>}
      />,
    );
    expect(screen.getByText("vp")).toBeTruthy();
  });

  test("supports branch expansion, node selection, and helpers", () => {
    const onNodeSelect = vi.fn();

    render(
      <OrgChart
        nodes={orgNodes}
        selectedNodeId="eng"
        onNodeSelect={onNodeSelect}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Collapse VP Product" }),
    );
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
      container
        .querySelector('[data-slot="process-map"]')
        ?.getAttribute("data-orientation"),
    ).toBe("horizontal");
    expect(
      container
        .querySelector('[data-slot="process-map-step"]')
        ?.getAttribute("data-tone"),
    ).toBe("success");
    expect(
      container
        .querySelector('[data-slot="process-map-connector"]')
        ?.getAttribute("aria-hidden"),
    ).toBe("true");

    rerender(<ProcessMap steps={steps} orientation="vertical" />);
    expect(
      container
        .querySelector('[data-slot="process-map"]')
        ?.getAttribute("data-orientation"),
    ).toBe("vertical");
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
    expect(
      container.querySelectorAll('[data-slot="relationship-map-edge"]'),
    ).toHaveLength(1);

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
    const path = container.querySelector(
      '[data-slot="relationship-map-edge"] path',
    );

    expect(path?.getAttribute("marker-start")).toContain("url(");
    expect(path?.getAttribute("marker-end")).toContain("url(");
    expect(path?.getAttribute("d")).toContain("M 100 100 L 180 140 L 280 200");

    rerender(<RelationshipMap nodes={[]} emptyMessage="No dependencies" />);
    expect(screen.getByText("No dependencies")).toBeTruthy();
  });
});
