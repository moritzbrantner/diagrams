import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
  UmlClassDiagram,
  UmlDiagram,
  UmlStateDiagram,
  getUmlDiagramBounds,
  type PositionedUmlDiagramNode,
} from "./uml-diagram";

describe("UML diagram", () => {
  test("renders a generic diagram with accessible SVG and edge labels", () => {
    const { container } = render(
      <UmlDiagram
        ariaLabel="Order flow"
        nodes={[
          { id: "draft", label: "Draft", x: 0, y: 0 },
          { id: "paid", label: "Paid", x: 260, y: 0 },
        ]}
        edges={[
          {
            id: "pay",
            source: "draft",
            target: "paid",
            label: "pay()",
            kind: "transition",
          },
        ]}
        caption="Payment state transition."
      />,
    );

    expect(screen.getByRole("img", { name: "Order flow" })).toBeTruthy();
    expect(screen.getByText("Draft")).toBeTruthy();
    expect(screen.getByText("pay()")).toBeTruthy();
    expect(screen.getByText("Payment state transition.")).toBeTruthy();
    expect(container.querySelector('[data-slot="uml-diagram-edge"]')?.getAttribute("d")).toContain(
      "M",
    );
  });

  test("renders class diagrams with class sections and relationship markers", () => {
    const { container } = render(
      <UmlClassDiagram
        ariaLabel="Billing classes"
        classes={[
          {
            id: "invoice",
            name: "Invoice",
            attributes: ["+ total: Money", "- status: InvoiceStatus"],
            operations: ["+ markPaid(): void"],
            x: 0,
            y: 0,
          },
          {
            id: "payable",
            name: "Payable",
            kind: "interface",
            operations: ["+ pay(): Receipt"],
            x: 300,
            y: 24,
          },
        ]}
        relationships={[
          {
            id: "implements",
            source: "invoice",
            target: "payable",
            kind: "realization",
          },
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: "Billing classes" })).toBeTruthy();
    expect(screen.getByText("Invoice")).toBeTruthy();
    expect(screen.getByText("<<interface>>")).toBeTruthy();
    expect(screen.getByText("+ markPaid(): void")).toBeTruthy();
    expect(
      container.querySelector('[data-kind="realization"] [data-slot="uml-diagram-edge"]'),
    ).toBeTruthy();
    expect(
      container
        .querySelector('[data-kind="realization"] [data-slot="uml-diagram-edge"]')
        ?.getAttribute("marker-end"),
    ).toContain("uml-triangle");
  });

  test("renders state diagrams with pseudo states and transitions", () => {
    const { container } = render(
      <UmlStateDiagram
        ariaLabel="Upload states"
        states={[
          { id: "initial", kind: "initial", x: 0, y: 42 },
          {
            id: "uploading",
            label: "Uploading",
            activities: ["entry / startProgress()", "do / streamFile()"],
            x: 92,
            y: 0,
          },
          { id: "done", kind: "final", x: 360, y: 42 },
        ]}
        transitions={[
          { id: "start", source: "initial", target: "uploading" },
          { id: "finish", source: "uploading", target: "done", label: "complete" },
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: "Upload states" })).toBeTruthy();
    expect(screen.getByText("Uploading")).toBeTruthy();
    expect(screen.getByText("complete")).toBeTruthy();
    expect(container.querySelector('[data-kind="initial"] circle')).toBeTruthy();
    expect(container.querySelector('[data-kind="final"] circle')).toBeTruthy();
  });

  test("computes bounds from nodes and routed edge points", () => {
    const nodes: PositionedUmlDiagramNode[] = [
      { id: "a", label: "A", x: 10, y: 20, width: 100, height: 80 },
      { id: "b", label: "B", x: 260, y: 140, width: 100, height: 80 },
    ];

    expect(
      getUmlDiagramBounds(nodes, [
        { id: "edge", source: "a", target: "b", points: [{ x: 180, y: -20 }] },
      ]),
    ).toEqual({ x: 10, y: -20, width: 350, height: 240 });
  });

  test("supports selectable nodes and inline node actions", () => {
    const onNodeSelect = vi.fn();
    const onNodeActionSelect = vi.fn();

    render(
      <UmlDiagram
        ariaLabel="Editable services"
        selectedNodeId="orders"
        nodes={[
          { id: "api", label: "API", x: 0, y: 0 },
          { id: "orders", label: "Orders", x: 260, y: 0 },
        ]}
        nodeActions={[
          { id: "add", label: "Add node" },
          { id: "delete", label: "Delete node", destructive: true },
        ]}
        onNodeSelect={onNodeSelect}
        onNodeActionSelect={onNodeActionSelect}
      />,
    );

    const ordersNode = screen
      .getByText("Orders")
      .closest<SVGGElement>('[data-slot="uml-diagram-node-interaction"]');

    if (!ordersNode) {
      throw new Error("Could not find Orders node interaction target");
    }

    fireEvent.click(ordersNode);
    fireEvent.click(screen.getAllByRole("button", { name: "Add node" })[1] as HTMLElement);

    expect(onNodeSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "orders", x: 260, y: 0 }),
    );
    expect(onNodeActionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "add" }),
      expect.objectContaining({ id: "orders" }),
    );
  });

  test("moves keyboard focus to the nearest spatial node", async () => {
    render(
      <UmlDiagram
        ariaLabel="Spatial graph"
        defaultFocusedNodeId="center"
        nodes={[
          { id: "left", label: "Left", x: 0, y: 0 },
          { id: "center", label: "Center", x: 260, y: 0 },
          { id: "right", label: "Right", x: 520, y: 20 },
          { id: "down", label: "Down", x: 260, y: 180 },
        ]}
        onNodeSelect={vi.fn()}
      />,
    );

    const center = screen.getByRole("button", { name: "Center" });
    center.focus();

    fireEvent.keyDown(center, { key: "ArrowRight" });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Right" })).toBe(document.activeElement),
    );

    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowDown" });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Down" })).toBe(document.activeElement),
    );
  });

  test("selects the focused UML node with enter", () => {
    const onNodeSelect = vi.fn();

    render(
      <UmlDiagram
        ariaLabel="Selectable graph"
        nodes={[
          { id: "api", label: "API", x: 0, y: 0 },
          { id: "orders", label: "Orders", x: 260, y: 0 },
        ]}
        defaultFocusedNodeId="orders"
        onNodeSelect={onNodeSelect}
      />,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "Orders" }), { key: "Enter" });

    expect(onNodeSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "orders" }));
  });

  test("calls onNodeDeselect with escape when a UML node is selected", () => {
    const onNodeDeselect = vi.fn();

    render(
      <UmlDiagram
        ariaLabel="Selectable graph"
        selectedNodeId="orders"
        nodes={[
          { id: "api", label: "API", x: 0, y: 0 },
          { id: "orders", label: "Orders", x: 260, y: 0 },
        ]}
        defaultFocusedNodeId="orders"
        onNodeSelect={vi.fn()}
        onNodeDeselect={onNodeDeselect}
      />,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "Orders" }), { key: "Escape" });

    expect(onNodeDeselect).toHaveBeenCalledTimes(1);
  });

  test("skips disabled UML nodes during keyboard navigation", async () => {
    render(
      <UmlDiagram
        ariaLabel="Disabled graph"
        defaultFocusedNodeId="left"
        nodes={[
          { id: "left", label: "Left", x: 0, y: 0 },
          { id: "center", label: "Center", x: 260, y: 0 },
          { id: "right", label: "Right", x: 520, y: 0 },
        ]}
        getNodeDisabled={(node) => node.id === "center"}
        onNodeSelect={vi.fn()}
      />,
    );

    const left = screen.getByRole("button", { name: "Left" });
    left.focus();

    fireEvent.keyDown(left, { key: "ArrowRight" });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Right" })).toBe(document.activeElement),
    );
    expect(screen.getByRole("button", { name: "Center" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
  });

  test("renders a custom UML node selection affordance", () => {
    const { container } = render(
      <UmlDiagram
        ariaLabel="Custom selection graph"
        selectedNodeId="orders"
        nodes={[
          { id: "api", label: "API", x: 0, y: 0 },
          { id: "orders", label: "Orders", x: 260, y: 0 },
        ]}
        renderNodeSelection={(node) => (
          <circle data-slot="custom-node-selection" cx={node.x + node.width} cy={node.y} r={8} />
        )}
        onNodeSelect={vi.fn()}
      />,
    );

    expect(container.querySelector('[data-slot="custom-node-selection"]')).toBeTruthy();
  });
});
