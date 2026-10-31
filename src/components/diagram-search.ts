import type {
  DiagramEdgeDescriptor,
  DiagramElementRef,
  DiagramInteractiveProps,
  DiagramNodeDescriptor,
  DiagramPathHighlightMode,
  DiagramSearchResult,
} from "../diagram-types";
import type * as React from "react";

export function buildDiagramSearchIndex<TNode, TEdge>(
  nodes: readonly DiagramNodeDescriptor<TNode>[],
  edges: readonly DiagramEdgeDescriptor<TEdge>[],
  getSearchText?: DiagramInteractiveProps<TNode, TEdge>["getSearchText"],
): (DiagramSearchResult<TNode, TEdge> & { searchText: string })[] {
  return [
    ...nodes.map((node) => {
      const label = getDiagramSearchLabel(node.label, node.id);
      return {
        ref: { kind: "node" as const, id: node.id },
        label,
        item: node.item,
        searchText:
          getSearchText?.({ kind: "node", id: node.id, item: node.item }) ??
          getDefaultDiagramSearchText(node.id, node.label, node.item),
      };
    }),
    ...edges.map((edge) => {
      const label = getDiagramSearchLabel(edge.label, edge.id);
      return {
        ref: { kind: "edge" as const, id: edge.id },
        label,
        item: edge.item,
        searchText:
          getSearchText?.({ kind: "edge", id: edge.id, item: edge.item }) ??
          getDefaultDiagramSearchText(
            edge.id,
            edge.label,
            edge.item,
            edge.sourceId,
            edge.targetId,
            edge.kind,
            edge.direction,
          ),
      };
    }),
  ].map((entry) => ({ ...entry, searchText: entry.searchText.toLowerCase() }));
}

export function getConnectedElementIds<TEdge>(
  edges: readonly DiagramEdgeDescriptor<TEdge>[],
  activeElement: DiagramElementRef | null,
  mode: DiagramPathHighlightMode,
) {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  if (!activeElement) {
    return { nodeIds, edgeIds };
  }

  if (activeElement.kind === "edge") {
    const activeEdge = edges.find((edge) => edge.id === activeElement.id);

    if (activeEdge) {
      edgeIds.add(activeEdge.id);
      nodeIds.add(activeEdge.sourceId);
      nodeIds.add(activeEdge.targetId);
    }

    return { nodeIds, edgeIds };
  }

  nodeIds.add(activeElement.id);

  if (mode === "neighbors") {
    for (const edge of edges) {
      if (edge.sourceId === activeElement.id || edge.targetId === activeElement.id) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.sourceId);
        nodeIds.add(edge.targetId);
      }
    }

    return { nodeIds, edgeIds };
  }

  const queue = [activeElement.id];
  const visited = new Set(queue);

  while (queue.length) {
    const nodeId = queue.shift()!;

    for (const edge of edges) {
      const directions = getTraversalDirections(edge);
      const traversable =
        mode === "connected"
          ? edge.sourceId === nodeId || edge.targetId === nodeId
          : mode === "incoming"
            ? directions.some((direction) => direction.to === nodeId)
            : directions.some((direction) => direction.from === nodeId);

      if (!traversable) {
        continue;
      }

      edgeIds.add(edge.id);

      const nextNodes =
        mode === "connected"
          ? [edge.sourceId, edge.targetId]
          : mode === "incoming"
            ? directions
                .filter((direction) => direction.to === nodeId)
                .map((direction) => direction.from)
            : directions
                .filter((direction) => direction.from === nodeId)
                .map((direction) => direction.to);

      for (const nextNode of nextNodes) {
        nodeIds.add(nextNode);

        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          queue.push(nextNode);
        }
      }
    }
  }

  return { nodeIds, edgeIds };
}

export function isSameDiagramElementRef(first: DiagramElementRef, second: DiagramElementRef) {
  return first.kind === second.kind && first.id === second.id;
}

function getTraversalDirections<TEdge>(edge: DiagramEdgeDescriptor<TEdge>) {
  if (edge.direction === "backward") {
    return [{ from: edge.targetId, to: edge.sourceId }];
  }

  if (edge.direction === "both" || edge.direction === "none") {
    return [
      { from: edge.sourceId, to: edge.targetId },
      { from: edge.targetId, to: edge.sourceId },
    ];
  }

  return [{ from: edge.sourceId, to: edge.targetId }];
}

function getDefaultDiagramSearchText(
  id: string,
  label: React.ReactNode,
  item: unknown,
  ...extraValues: unknown[]
) {
  const values = [id, getPrimitiveReactNodeText(label), ...extraValues];

  if (item && typeof item === "object") {
    for (const value of Object.values(item as Record<string, unknown>)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        values.push(String(value));
      }
    }
  }

  return values.filter(Boolean).join(" ");
}

function getDiagramSearchLabel(label: React.ReactNode, fallback: string) {
  return getPrimitiveReactNodeText(label) || fallback;
}

function getPrimitiveReactNodeText(value: React.ReactNode) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
