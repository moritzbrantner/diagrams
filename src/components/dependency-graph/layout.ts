import {
  clampFiniteNumber,
  getAutoGridPosition,
  getHullRoute,
  getSpatialBounds,
  type DiagramPoint,
} from "../diagram-utils";

import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH, PART_HULL_PADDING } from "./constants";

import type {
  DependencyGraphEdge,
  DependencyGraphEdgeRoute,
  DependencyGraphNode,
  DependencyGraphPart,
  PositionedDependencyGraphNode,
  PositionedDependencyGraphPart,
  RenderDependencyGraphEdge,
  RenderDependencyGraphNode,
} from "./types";

export function positionDependencyGraphParts(
  parts: readonly DependencyGraphPart[] | undefined,
  nodes: readonly PositionedDependencyGraphNode[],
): PositionedDependencyGraphPart[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const resolvedParts = parts !== undefined ? parts : inferDependencyGraphParts(nodes);

  return resolvedParts.flatMap((part) => {
    const nodeIds = new Set<string>(part.nodeIds ?? []);

    for (const node of nodes) {
      if (node.partId === part.id) {
        nodeIds.add(node.id);
      }
    }

    const partNodes = Array.from(nodeIds)
      .map((nodeId) => nodeMap.get(nodeId))
      .filter((node): node is PositionedDependencyGraphNode => Boolean(node));

    if (!partNodes.length) {
      return [];
    }

    return [
      {
        bounds: getDependencyGraphPartBounds(partNodes),
        nodeIds,
        nodes: partNodes,
        part,
      },
    ];
  });
}

export function remapDependencyGraphEdges(
  edges: readonly DependencyGraphEdge[],
  hiddenNodeToProxyId: Map<string, string>,
  nodeMap: Map<string, RenderDependencyGraphNode>,
): RenderDependencyGraphEdge[] {
  return edges.flatMap((edge) => {
    const source = hiddenNodeToProxyId.get(edge.source) ?? edge.source;
    const target = hiddenNodeToProxyId.get(edge.target) ?? edge.target;
    const remapped = source !== edge.source || target !== edge.target;

    if (!nodeMap.has(source) || !nodeMap.has(target) || (remapped && source === target)) {
      return [];
    }

    return [
      {
        ...edge,
        points: remapped ? undefined : edge.points,
        source,
        target,
        waypoints: remapped ? undefined : edge.waypoints,
      },
    ];
  });
}

export function positionNodes(
  nodes: readonly DependencyGraphNode[],
  columns: number,
): PositionedDependencyGraphNode[] {
  return nodes.map((node, index) => {
    const fallback = getAutoGridPosition(
      index,
      columns,
      { x: 88, y: 72 },
      { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
    );
    const width = Math.max(120, clampFiniteNumber(node.width, DEFAULT_NODE_WIDTH));
    const height = Math.max(72, clampFiniteNumber(node.height, DEFAULT_NODE_HEIGHT));

    return {
      ...node,
      x: clampFiniteNumber(node.x, fallback.x),
      y: clampFiniteNumber(node.y, fallback.y),
      width,
      height,
    };
  });
}

export function getDependencyGraphNodeCenter(node: PositionedDependencyGraphNode): DiagramPoint {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  };
}

export function getDependencyGraphEdgeRoute(
  edge: DependencyGraphEdge,
  sourceNode: PositionedDependencyGraphNode,
  targetNode: PositionedDependencyGraphNode,
  edgeIndex: number,
  obstacles: readonly RenderDependencyGraphNode[],
): DependencyGraphEdgeRoute {
  return getHullRoute({
    source: sourceNode,
    target: targetNode,
    edgeIndex,
    obstacles,
    points: edge.points,
    waypoints: edge.waypoints,
    selfLoop: sourceNode.id === targetNode.id,
  });
}

export function getNearestDependencyGraphNode(
  currentNode: PositionedDependencyGraphNode,
  candidates: PositionedDependencyGraphNode[],
  key: "ArrowRight" | "ArrowLeft" | "ArrowDown" | "ArrowUp",
): PositionedDependencyGraphNode | null {
  const currentCenter = getDependencyGraphNodeCenter(currentNode);
  const horizontal = key === "ArrowRight" || key === "ArrowLeft";
  const forward = key === "ArrowRight" || key === "ArrowDown";

  return (
    candidates
      .map((candidate) => {
        const center = getDependencyGraphNodeCenter(candidate);
        const primaryDelta = horizontal ? center.x - currentCenter.x : center.y - currentCenter.y;
        const perpendicularDelta = horizontal
          ? center.y - currentCenter.y
          : center.x - currentCenter.x;

        return {
          candidate,
          primaryDelta,
          perpendicularDistance: Math.abs(perpendicularDelta),
          totalDistance: Math.hypot(center.x - currentCenter.x, center.y - currentCenter.y),
        };
      })
      .filter((item) => (forward ? item.primaryDelta > 0 : item.primaryDelta < 0))
      .sort(
        (first, second) =>
          first.perpendicularDistance - second.perpendicularDistance ||
          first.totalDistance - second.totalDistance,
      )[0]?.candidate ?? null
  );
}

function inferDependencyGraphParts(
  nodes: readonly PositionedDependencyGraphNode[],
): DependencyGraphPart[] {
  return Array.from(new Set(nodes.flatMap((node) => (node.partId ? [node.partId] : [])))).map(
    (partId) => ({
      id: partId,
      label: partId,
    }),
  );
}

function getDependencyGraphPartBounds(nodes: readonly PositionedDependencyGraphNode[]) {
  const bounds = getSpatialBounds(nodes);

  return {
    x: bounds.x - PART_HULL_PADDING,
    y: bounds.y - PART_HULL_PADDING,
    width: bounds.width + PART_HULL_PADDING * 2,
    height: bounds.height + PART_HULL_PADDING * 2,
  };
}
