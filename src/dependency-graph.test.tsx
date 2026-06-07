import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { DependencyGraph } from "./dependency-graph";

describe("DependencyGraph", () => {
  test("keeps static rendering as an image and filters invalid edges", () => {
    const { container } = render(
      <DependencyGraph
        ariaLabel="Package dependencies"
        nodes={[
          { id: "app", label: "App" },
          { id: "pkg", label: "Package" },
        ]}
        edges={[
          { id: "valid", source: "app", target: "pkg" },
          { id: "invalid", source: "app", target: "missing" },
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: "Package dependencies" })).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="dependency-graph-edge"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-slot="dependency-graph-node"]')).toHaveLength(2);
  });

  test("routes automatic edges to node hulls instead of centers", () => {
    const { container } = render(
      <DependencyGraph
        ariaLabel="Hull dependencies"
        nodes={[
          { id: "app", label: "App", x: 0, y: 0 },
          { id: "pkg", label: "Package", x: 260, y: 0 },
        ]}
        edges={[{ id: "app-pkg", source: "app", target: "pkg" }]}
      />,
    );

    const path = container.querySelector('[data-slot="dependency-graph-edge"] path');

    expect(path?.getAttribute("d")).toBe("M 188 52 L 224 52 L 224 52 L 260 52");
    expect(path?.getAttribute("d")).not.toContain("M 94 52");
    expect(path?.getAttribute("d")).not.toContain("354 52");
  });

  test("clips diagonal routes to the rectangular node boundary", () => {
    const { container } = render(
      <DependencyGraph
        ariaLabel="Diagonal dependencies"
        nodes={[
          { id: "app", label: "App", x: 0, y: 0 },
          { id: "pkg", label: "Package", x: 260, y: 180 },
        ]}
        edges={[{ id: "app-pkg", source: "app", target: "pkg" }]}
      />,
    );

    const path = container.querySelector('[data-slot="dependency-graph-edge"] path');
    const d = path?.getAttribute("d") ?? "";

    expect(d).toContain("M 169.11111111111111 104");
    expect(d).toContain("278.8888888888889 180");
    expect(d).not.toContain("M 94 52");
    expect(d).not.toContain("354 232");
  });

  test("preserves explicit edge points and supports hull-clipped waypoints", () => {
    const { container, rerender } = render(
      <DependencyGraph
        ariaLabel="Manual dependencies"
        nodes={[
          { id: "app", label: "App", x: 0, y: 0 },
          { id: "pkg", label: "Package", x: 260, y: 0 },
        ]}
        edges={[
          {
            id: "manual",
            source: "app",
            target: "pkg",
            points: [
              { x: 10, y: 20 },
              { x: 120, y: 60 },
              { x: 240, y: 20 },
            ],
          },
        ]}
      />,
    );

    expect(
      container.querySelector('[data-slot="dependency-graph-edge"] path')?.getAttribute("d"),
    ).toBe("M 10 20 L 120 60 L 240 20");

    rerender(
      <DependencyGraph
        ariaLabel="Waypoint dependencies"
        nodes={[
          { id: "app", label: "App", x: 0, y: 0 },
          { id: "pkg", label: "Package", x: 260, y: 0 },
        ]}
        edges={[
          {
            id: "waypoint",
            source: "app",
            target: "pkg",
            waypoints: [{ x: 220, y: 140 }],
          },
        ]}
      />,
    );

    expect(
      container.querySelector('[data-slot="dependency-graph-edge"] path')?.getAttribute("d"),
    ).toBe("M 168.45454545454544 104 L 220 140 L 274.8181818181818 104");
  });

  test("renders self edges as finite hull loops", () => {
    const { container } = render(
      <DependencyGraph
        ariaLabel="Self dependencies"
        nodes={[{ id: "app", label: "App", x: 0, y: 0 }]}
        edges={[{ id: "self", source: "app", target: "app" }]}
      />,
    );

    const d = container
      .querySelector('[data-slot="dependency-graph-edge"] path')
      ?.getAttribute("d");

    expect(d).toBe("M 188 35.36 L 220 35.36 L 220 70.72 L 188 70.72");
    expect(d).not.toContain("NaN");
  });

  test("supports selectable nodes", () => {
    const onNodeSelect = vi.fn();
    const { container } = render(
      <DependencyGraph
        ariaLabel="Selectable dependencies"
        selectedNodeId="pkg"
        nodes={[
          { id: "app", label: "App", x: 0, y: 0 },
          { id: "pkg", label: "Package", x: 260, y: 0 },
        ]}
        onNodeSelect={onNodeSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Package" }));

    expect(screen.getByRole("group", { name: "Selectable dependencies" })).toBeTruthy();
    expect(onNodeSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "pkg", x: 260, y: 0 }));
    expect(
      container
        .querySelector('[data-slot="dependency-graph-node-interaction"][data-node-id="pkg"]')
        ?.getAttribute("data-selected"),
    ).toBe("true");
  });

  test("minimizes explicit parts into summary nodes and remaps external edges", () => {
    const onMinimizedPartIdsChange = vi.fn();
    const onNodeSelect = vi.fn();
    const { container } = render(
      <DependencyGraph
        ariaLabel="Part dependencies"
        parts={[{ id: "runtime", label: "Runtime", nodeIds: ["api", "worker"] }]}
        nodes={[
          { id: "app", label: "App", x: 0, y: 80 },
          { id: "api", label: "API", x: 260, y: 0 },
          { id: "worker", label: "Worker", x: 260, y: 160 },
        ]}
        edges={[
          { id: "app-api", source: "app", target: "api" },
          { id: "api-worker", source: "api", target: "worker" },
        ]}
        onMinimizedPartIdsChange={onMinimizedPartIdsChange}
        onNodeSelect={onNodeSelect}
      />,
    );

    expect(container.querySelector('[data-slot="dependency-graph-part-hull"]')).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Minimize Runtime" }));

    expect(screen.queryByText("API")).toBeNull();
    expect(screen.queryByText("Worker")).toBeNull();
    expect(container.querySelectorAll('[data-slot="dependency-graph-summary-node"]')).toHaveLength(
      1,
    );
    expect(container.querySelectorAll('[data-slot="dependency-graph-edge"]')).toHaveLength(1);
    expect(onMinimizedPartIdsChange).toHaveBeenCalledWith(
      ["runtime"],
      expect.objectContaining({ id: "runtime" }),
      true,
    );
    expect(onNodeSelect).not.toHaveBeenCalled();
  });

  test("respects controlled minimized parts", () => {
    const { container } = render(
      <DependencyGraph
        ariaLabel="Controlled part dependencies"
        minimizedPartIds={["runtime"]}
        parts={[{ id: "runtime", label: "Runtime", nodeIds: ["api", "worker"] }]}
        nodes={[
          { id: "app", label: "App", x: 0, y: 80 },
          { id: "api", label: "API", x: 260, y: 0 },
          { id: "worker", label: "Worker", x: 260, y: 160 },
        ]}
      />,
    );

    expect(screen.queryByText("API")).toBeNull();
    expect(screen.queryByText("Worker")).toBeNull();
    expect(container.querySelectorAll('[data-slot="dependency-graph-summary-node"]')).toHaveLength(
      1,
    );
  });

  test("minimizes transitive downstream node branches with cycle protection", () => {
    const onMinimizedNodeIdsChange = vi.fn();
    const { container } = render(
      <DependencyGraph
        ariaLabel="Branch dependencies"
        enableNodeMinimize
        nodes={[
          { id: "app", label: "App", x: 0, y: 0 },
          { id: "pkg", label: "Package", x: 260, y: 0 },
          { id: "ui", label: "UI", x: 520, y: 0 },
          { id: "docs", label: "Docs", x: 260, y: 160 },
        ]}
        edges={[
          { id: "app-pkg", source: "app", target: "pkg" },
          { id: "pkg-ui", source: "pkg", target: "ui" },
          { id: "ui-app", source: "ui", target: "app" },
          { id: "docs-ui", source: "docs", target: "ui" },
        ]}
        onMinimizedNodeIdsChange={onMinimizedNodeIdsChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Minimize App" }));

    expect(screen.getByText("App")).toBeTruthy();
    expect(screen.queryByText("Package")).toBeNull();
    expect(screen.queryByText("UI")).toBeNull();
    expect(screen.getByText("2 dependencies")).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="dependency-graph-edge"]')).toHaveLength(3);
    expect(onMinimizedNodeIdsChange).toHaveBeenCalledWith(
      ["app"],
      expect.objectContaining({ id: "app" }),
      true,
    );
  });

  test("skips hidden branch nodes during keyboard focus fallback", () => {
    const { container } = render(
      <DependencyGraph
        ariaLabel="Hidden focus dependencies"
        defaultFocusedNodeId="pkg"
        defaultMinimizedNodeIds={["app"]}
        enableNodeMinimize
        nodes={[
          { id: "app", label: "App", x: 0, y: 0 },
          { id: "pkg", label: "Package", x: 260, y: 0 },
        ]}
        edges={[{ id: "app-pkg", source: "app", target: "pkg" }]}
        onNodeSelect={vi.fn()}
      />,
    );

    expect(screen.queryByText("Package")).toBeNull();
    expect(
      container
        .querySelector('[data-slot="dependency-graph-node-interaction"][data-node-id="app"]')
        ?.getAttribute("data-focused"),
    ).toBe("true");
  });

  test("does not select nodes when built-in minimize controls are clicked", () => {
    const onNodeSelect = vi.fn();

    render(
      <DependencyGraph
        ariaLabel="Control dependencies"
        enableNodeMinimize
        nodes={[
          { id: "app", label: "App", x: 0, y: 0 },
          { id: "pkg", label: "Package", x: 260, y: 0 },
        ]}
        edges={[{ id: "app-pkg", source: "app", target: "pkg" }]}
        onNodeSelect={onNodeSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Minimize App" }));

    expect(onNodeSelect).not.toHaveBeenCalled();
  });

  test("moves keyboard focus to the nearest spatial node", async () => {
    render(
      <DependencyGraph
        ariaLabel="Spatial dependencies"
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

  test("selects and deselects nodes with the keyboard", () => {
    const onNodeSelect = vi.fn();
    const onNodeDeselect = vi.fn();

    render(
      <DependencyGraph
        ariaLabel="Keyboard dependencies"
        selectedNodeId="pkg"
        defaultFocusedNodeId="pkg"
        nodes={[
          { id: "app", label: "App", x: 0, y: 0 },
          { id: "pkg", label: "Package", x: 260, y: 0 },
        ]}
        onNodeSelect={onNodeSelect}
        onNodeDeselect={onNodeDeselect}
      />,
    );

    const selectedNode = screen.getByRole("button", { name: "Package" });

    fireEvent.keyDown(selectedNode, { key: "Enter" });
    fireEvent.keyDown(selectedNode, { key: "Escape" });

    expect(onNodeSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "pkg" }));
    expect(onNodeDeselect).toHaveBeenCalledTimes(1);
  });

  test("skips disabled nodes during keyboard navigation and prevents disabled selection", async () => {
    const onNodeSelect = vi.fn();

    render(
      <DependencyGraph
        ariaLabel="Disabled dependencies"
        defaultFocusedNodeId="left"
        nodes={[
          { id: "left", label: "Left", x: 0, y: 0 },
          { id: "center", label: "Center", x: 260, y: 0 },
          { id: "right", label: "Right", x: 520, y: 0 },
        ]}
        getNodeDisabled={(node) => node.id === "center"}
        onNodeSelect={onNodeSelect}
      />,
    );

    const left = screen.getByRole("button", { name: "Left" });
    const center = screen.getByRole("button", { name: "Center" });

    fireEvent.click(center);
    left.focus();
    fireEvent.keyDown(left, { key: "ArrowRight" });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Right" })).toBe(document.activeElement),
    );
    expect(center.getAttribute("aria-disabled")).toBe("true");
    expect(center.getAttribute("data-disabled")).toBe("true");
    expect(onNodeSelect).not.toHaveBeenCalled();
  });

  test("supports node actions without selecting the node", () => {
    const onNodeSelect = vi.fn();
    const onNodeActionSelect = vi.fn();
    const onSelectAction = vi.fn();

    render(
      <DependencyGraph
        ariaLabel="Action dependencies"
        selectedNodeId="pkg"
        nodes={[
          { id: "app", label: "App", x: 0, y: 0 },
          { id: "pkg", label: "Package", x: 260, y: 0 },
        ]}
        nodeActions={[
          { id: "inspect", label: "Inspect", onSelect: onSelectAction },
          { id: "delete", label: "Delete", destructive: true },
        ]}
        onNodeActionSelect={onNodeActionSelect}
        onNodeSelect={onNodeSelect}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Inspect" })[1] as HTMLElement);

    expect(onSelectAction).toHaveBeenCalledWith(expect.objectContaining({ id: "pkg" }));
    expect(onNodeActionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "inspect" }),
      expect.objectContaining({ id: "pkg" }),
    );
    expect(onNodeSelect).not.toHaveBeenCalled();
  });

  test("renders a custom node selection affordance", () => {
    const { container } = render(
      <DependencyGraph
        ariaLabel="Custom selection dependencies"
        selectedNodeId="pkg"
        nodes={[
          { id: "app", label: "App", x: 0, y: 0 },
          { id: "pkg", label: "Package", x: 260, y: 0 },
        ]}
        renderNodeSelection={(node) => (
          <circle
            data-slot="custom-dependency-selection"
            cx={node.x + node.width}
            cy={node.y}
            r={8}
          />
        )}
      />,
    );

    expect(container.querySelector('[data-slot="custom-dependency-selection"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="dependency-graph-node-focus"]')).toBeNull();
  });
});
