import { describe, expect, test } from "vitest";

import {
  applyDiagramViewDelta,
  decodeDiagramViewState,
  encodeDiagramViewState,
} from "./view-state";

describe("diagram view state", () => {
  test("round-trips durable shareable state deterministically", () => {
    const encoded = encodeDiagramViewState({
      collapsedIds: ["billing", "api", "billing"],
      highlightedElement: { kind: "node", id: "orders" },
      inspectedEdgeId: "api-orders",
      searchQuery: "orders",
      viewport: { x: -20, y: 10, width: 800, height: 500 },
    });

    expect(decodeDiagramViewState(encoded)).toEqual({
      collapsedIds: ["api", "billing"],
      highlightedElement: { kind: "node", id: "orders" },
      inspectedEdgeId: "api-orders",
      searchQuery: "orders",
      viewport: { x: -20, y: 10, width: 800, height: 500 },
    });
  });

  test("ignores invalid URL state", () => {
    expect(decodeDiagramViewState("viewport=0,0,-1,10&highlight=thing:nope")).toEqual({});
  });

  test("applies small durable deltas without rebuilding unrelated state", () => {
    const initial = {
      highlightedElement: { kind: "node" as const, id: "orders" },
      searchQuery: "orders",
      viewport: { x: 0, y: 0, width: 800, height: 500 },
    };

    expect(
      applyDiagramViewDelta(initial, {
        type: "viewport",
        viewport: { x: 40, y: 20, width: 800, height: 500 },
        reason: "pan",
      }),
    ).toEqual({
      ...initial,
      viewport: { x: 40, y: 20, width: 800, height: 500 },
    });
  });

  test("returns the existing state when a delta is already satisfied", () => {
    const state = {
      collapsedIds: ["api", "billing"],
      highlightedElement: { kind: "node" as const, id: "orders" },
      searchQuery: "orders",
      viewport: { x: 0, y: 0, width: 800, height: 500 },
    };

    expect(
      applyDiagramViewDelta(state, {
        type: "viewport",
        viewport: state.viewport,
        reason: "programmatic",
      }),
    ).toBe(state);
    expect(
      applyDiagramViewDelta(state, {
        type: "highlighted-element",
        element: { kind: "node", id: "orders" },
      }),
    ).toBe(state);
    expect(
      applyDiagramViewDelta(state, {
        type: "collapsed-ids",
        ids: ["billing", "api", "billing"],
      }),
    ).toBe(state);
  });

  test("retains explicit clears for preview-backed durable state", () => {
    const clearedHighlight = applyDiagramViewDelta({}, {
      type: "highlighted-element",
      element: null,
    });
    expect(clearedHighlight).toEqual({ highlightedElement: null });
    expect(
      applyDiagramViewDelta(clearedHighlight, { type: "highlighted-element", element: null }),
    ).toBe(clearedHighlight);

    const clearedInspector = applyDiagramViewDelta({}, { type: "inspected-edge", edgeId: null });
    expect(clearedInspector).toEqual({ inspectedEdgeId: null });
    expect(applyDiagramViewDelta(clearedInspector, { type: "inspected-edge", edgeId: null })).toBe(
      clearedInspector,
    );
  });

  test("canonicalizes empty and unordered durable values", () => {
    const state = applyDiagramViewDelta(
      {
        collapsedIds: ["stale"],
        inspectedEdgeId: "edge",
        searchQuery: "query",
      },
      { type: "collapsed-ids", ids: ["billing", "api", "billing", ""] },
    );

    expect(state.collapsedIds).toEqual(["api", "billing"]);
    expect(applyDiagramViewDelta(state, { type: "search-query", query: "   " })).toEqual({
      collapsedIds: ["api", "billing"],
      inspectedEdgeId: "edge",
    });
  });
});
