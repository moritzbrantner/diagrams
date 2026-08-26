import { describe, expect, test } from "vitest";

import { decodeDiagramViewState, encodeDiagramViewState } from "./view-state";

describe("diagram view state", () => {
  test("round-trips durable shareable interaction state", () => {
    const encoded = encodeDiagramViewState({
      highlightedElement: { kind: "node", id: "api:primary" },
      inspectedEdgeId: "api-db",
      searchQuery: "database",
      viewport: { x: -40, y: 20, width: 720, height: 420 },
    });

    expect(decodeDiagramViewState(encoded)).toEqual({
      highlightedElement: { kind: "node", id: "api:primary" },
      inspectedEdgeId: "api-db",
      searchQuery: "database",
      viewport: { x: -40, y: 20, width: 720, height: 420 },
    });
  });

  test("ignores malformed state", () => {
    expect(
      decodeDiagramViewState(
        "diagram.viewport=0,0,-1,20&diagram.highlight=%7Bbad&diagram.search=%20%20",
      ),
    ).toEqual({});
  });
});
