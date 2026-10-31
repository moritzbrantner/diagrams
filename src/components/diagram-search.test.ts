import { describe, expect, it } from "vitest";

import { buildDiagramEdgeAdjacency, getConnectedElementIds } from "./diagram-search";

import type { DiagramEdgeDescriptor, DiagramPathHighlightMode } from "../diagram-types";

const edges: DiagramEdgeDescriptor<null>[] = [
  { id: "a-b", item: null, sourceId: "a", targetId: "b", direction: "forward" },
  { id: "c-b", item: null, sourceId: "c", targetId: "b", direction: "backward" },
  { id: "b-b", item: null, sourceId: "b", targetId: "b", direction: "forward" },
  { id: "c-d", item: null, sourceId: "c", targetId: "d", direction: "both" },
  { id: "e-a", item: null, sourceId: "e", targetId: "a", direction: "forward" },
  { id: "f-g", item: null, sourceId: "f", targetId: "g", direction: "none" },
];

function connected(mode: DiagramPathHighlightMode, useIndex: boolean) {
  const { nodeIds, edgeIds } = getConnectedElementIds(
    edges,
    { kind: "node", id: "a" },
    mode,
    useIndex ? buildDiagramEdgeAdjacency(edges) : undefined,
  );

  return { nodeIds: [...nodeIds], edgeIds: [...edgeIds] };
}

describe("getConnectedElementIds", () => {
  it("follows edge direction outward in breadth-first, input-edge order", () => {
    expect(connected("outgoing", false)).toEqual({
      nodeIds: ["a", "b", "c", "d"],
      edgeIds: ["a-b", "c-b", "b-b", "c-d"],
    });
  });

  it("follows edge direction inward", () => {
    expect(connected("incoming", false)).toEqual({
      nodeIds: ["a", "e"],
      edgeIds: ["e-a"],
    });
  });

  it("ignores direction for connected traversal and stays in the component", () => {
    expect(connected("connected", false)).toEqual({
      nodeIds: ["a", "b", "e", "c", "d"],
      edgeIds: ["a-b", "e-a", "c-b", "b-b", "c-d"],
    });
  });

  it.each(["outgoing", "incoming", "connected"] as const)(
    "gives the same %s result with a prebuilt adjacency index",
    (mode) => {
      expect(connected(mode, true)).toEqual(connected(mode, false));
    },
  );
});
