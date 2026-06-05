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
