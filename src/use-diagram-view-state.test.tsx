import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { getDurableDiagramInteractionProps, useDiagramViewState } from "./use-diagram-view-state";

describe("useDiagramViewState", () => {
  test("updates uncontrolled durable state through deltas", () => {
    const { result } = renderHook(() =>
      useDiagramViewState({
        defaultValue: { highlightedElement: { kind: "node", id: "orders" } },
      }),
    );

    act(() => {
      result.current[1]({ type: "search-query", query: " payments " });
    });

    expect(result.current[0]).toEqual({
      highlightedElement: { kind: "node", id: "orders" },
      searchQuery: "payments",
    });
  });

  test("keeps the supplied controlled value authoritative across rejected deltas", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDiagramViewState({ value: {}, onChange }));

    act(() => {
      result.current[1]({ type: "search-query", query: "rejected" });
      result.current[1]({
        type: "viewport",
        viewport: { x: 10, y: 20, width: 800, height: 500 },
        reason: "pan",
      });
    });

    expect(onChange).toHaveBeenNthCalledWith(
      2,
      { viewport: { x: 10, y: 20, width: 800, height: 500 } },
      {
        type: "viewport",
        viewport: { x: 10, y: 20, width: 800, height: 500 },
        reason: "pan",
      },
    );
  });

  test("does not emit an already-satisfied delta", () => {
    const onChange = vi.fn();
    const onDelta = vi.fn();
    const { result } = renderHook(() =>
      useDiagramViewState({
        defaultValue: { highlightedElement: { kind: "node", id: "orders" } },
        onChange,
        onDelta,
      }),
    );

    act(() => {
      result.current[1]({
        type: "highlighted-element",
        element: { kind: "node", id: "orders" },
      });
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(onDelta).not.toHaveBeenCalled();
  });

  test("adapts only durable-safe canvas callbacks", () => {
    const dispatch = vi.fn();
    const props = getDurableDiagramInteractionProps(
      {
        highlightedElement: { kind: "node", id: "orders" },
        searchQuery: "orders",
        viewport: { x: 0, y: 0, width: 800, height: 500 },
      },
      dispatch,
    );

    expect(props).not.toHaveProperty("onHighlightedElementChange");
    expect(props).not.toHaveProperty("onInspectedEdgeIdChange");

    const clearedProps = getDurableDiagramInteractionProps(
      { highlightedElement: null, inspectedEdgeId: null },
      dispatch,
    );
    expect(clearedProps.highlightedElement).toBeNull();
    expect(clearedProps.inspectedEdgeId).toBeNull();

    props.onViewportChange?.({ x: 10, y: 20, width: 800, height: 500 }, "pan");
    props.onSearchQueryChange?.("payments");

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: "viewport",
      viewport: { x: 10, y: 20, width: 800, height: 500 },
      reason: "pan",
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: "search-query",
      query: "payments",
    });
  });
});
