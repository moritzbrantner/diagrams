import { describe, expect, test } from "vitest";

import { decodeDiagramViewState, encodeDiagramViewState } from "./view-state";

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
});
