import { clampFiniteNumber, getSpatialBounds } from "../diagram-utils";

import {
  NODE_SUMMARY_PREFIX,
  PART_SUMMARY_PREFIX,
  SUMMARY_NODE_HEIGHT,
  SUMMARY_NODE_WIDTH,
} from "./constants";
import { getDependencyGraphNodeAccessibleName } from "./labels";

import type {
  DependencyGraphEdge,
  DependencyGraphProps,
  PositionedDependencyGraphNode,
  PositionedDependencyGraphPart,
  RenderDependencyGraphNode,
} from "./types";

export function getMinimizedPartProjection(
  parts: readonly PositionedDependencyGraphPart[],
  minimizedPartIds: ReadonlySet<string>,
  getMinimizedPartLabel: DependencyGraphProps["getMinimizedPartLabel"],
) {
  const hiddenNodeIds = new Set<string>();
  const hiddenNodeToProxyId = new Map<string, string>();
  const summaryNodes: RenderDependencyGraphNode[] = [];
  const expandedParts: PositionedDependencyGraphPart[] = [];

  for (const positionedPart of parts) {
    if (!minimizedPartIds.has(positionedPart.part.id)) {
      expandedParts.push(positionedPart);
      continue;
    }

    const summaryNode = getDependencyGraphPartSummaryNode(positionedPart, getMinimizedPartLabel);

    summaryNodes.push(summaryNode);

    for (const node of positionedPart.nodes) {
      hiddenNodeIds.add(node.id);
      hiddenNodeToProxyId.set(node.id, summaryNode.id);
    }
  }

  return { expandedParts, hiddenNodeIds, hiddenNodeToProxyId, summaryNodes };
}

export function getMinimizedNodeProjection({
  edges,
  getMinimizedNodeLabel,
  hiddenNodeIds,
  minimizedNodeIds,
  nodeMap,
}: {
  edges: readonly DependencyGraphEdge[];
  getMinimizedNodeLabel: DependencyGraphProps["getMinimizedNodeLabel"];
  hiddenNodeIds: ReadonlySet<string>;
  minimizedNodeIds: ReadonlySet<string>;
  nodeMap: Map<string, PositionedDependencyGraphNode>;
}) {
  const branchHiddenNodeIds = new Set<string>();
  const hiddenNodeToProxyId = new Map<string, string>();
  const summaryNodes: RenderDependencyGraphNode[] = [];

  for (const rootNodeId of minimizedNodeIds) {
    const rootNode = nodeMap.get(rootNodeId);

    if (!rootNode || hiddenNodeIds.has(rootNode.id) || branchHiddenNodeIds.has(rootNode.id)) {
      continue;
    }

    const hiddenNodes = getTransitiveOutgoingDependencyNodes({
      edges,
      excludedNodeIds: new Set([...hiddenNodeIds, rootNode.id]),
      nodeMap,
      rootNodeId,
    }).filter((node) => !branchHiddenNodeIds.has(node.id));

    if (!hiddenNodes.length) {
      continue;
    }

    const summaryNode = getDependencyGraphNodeSummaryNode(
      rootNode,
      hiddenNodes,
      getMinimizedNodeLabel,
    );

    summaryNodes.push(summaryNode);

    for (const node of hiddenNodes) {
      branchHiddenNodeIds.add(node.id);
      hiddenNodeToProxyId.set(node.id, summaryNode.id);
    }
  }

  return {
    hiddenNodeIds: branchHiddenNodeIds,
    hiddenNodeToProxyId,
    summaryNodes,
  };
}

export function getCollapsibleDependencyGraphNodeMap({
  edges,
  hiddenNodeIds,
  nodeMap,
  nodes,
}: {
  edges: readonly DependencyGraphEdge[];
  hiddenNodeIds: ReadonlySet<string>;
  nodeMap: Map<string, PositionedDependencyGraphNode>;
  nodes: readonly PositionedDependencyGraphNode[];
}) {
  const result = new Map<string, readonly PositionedDependencyGraphNode[]>();

  for (const node of nodes) {
    if (hiddenNodeIds.has(node.id) || node.minimizable === false) {
      continue;
    }

    const hiddenNodes = getTransitiveOutgoingDependencyNodes({
      edges,
      excludedNodeIds: new Set([...hiddenNodeIds, node.id]),
      nodeMap,
      rootNodeId: node.id,
    });

    if (hiddenNodes.length) {
      result.set(node.id, hiddenNodes);
    }
  }

  return result;
}

function getDependencyGraphPartSummaryNode(
  positionedPart: PositionedDependencyGraphPart,
  getMinimizedPartLabel: DependencyGraphProps["getMinimizedPartLabel"],
): RenderDependencyGraphNode {
  const width = Math.max(120, clampFiniteNumber(positionedPart.part.width, SUMMARY_NODE_WIDTH));
  const height = Math.max(72, clampFiniteNumber(positionedPart.part.height, SUMMARY_NODE_HEIGHT));
  const label =
    getMinimizedPartLabel?.(positionedPart.part, positionedPart.nodes) ?? positionedPart.part.label;

  return {
    description:
      positionedPart.part.description ??
      `${positionedPart.nodes.length} ${positionedPart.nodes.length === 1 ? "node" : "nodes"}`,
    group: "Minimized part",
    height,
    id: `${PART_SUMMARY_PREFIX}${positionedPart.part.id}`,
    label,
    summary: {
      hiddenNodes: positionedPart.nodes,
      kind: "part",
      part: positionedPart.part,
      sourceId: positionedPart.part.id,
    },
    tone: positionedPart.part.tone ?? "muted",
    width,
    x:
      positionedPart.part.x ??
      positionedPart.bounds.x + positionedPart.bounds.width / 2 - width / 2,
    y:
      positionedPart.part.y ??
      positionedPart.bounds.y + positionedPart.bounds.height / 2 - height / 2,
  };
}

function getDependencyGraphNodeSummaryNode(
  rootNode: PositionedDependencyGraphNode,
  hiddenNodes: readonly PositionedDependencyGraphNode[],
  getMinimizedNodeLabel: DependencyGraphProps["getMinimizedNodeLabel"],
): RenderDependencyGraphNode {
  const bounds = getSpatialBounds(hiddenNodes);
  const width = SUMMARY_NODE_WIDTH;
  const height = SUMMARY_NODE_HEIGHT;
  const label =
    getMinimizedNodeLabel?.(rootNode, hiddenNodes) ??
    `${hiddenNodes.length} ${hiddenNodes.length === 1 ? "dependency" : "dependencies"}`;

  return {
    description: `Collapsed from ${getDependencyGraphNodeAccessibleName(rootNode)}`,
    group: "Minimized branch",
    height,
    id: `${NODE_SUMMARY_PREFIX}${rootNode.id}`,
    label,
    summary: {
      hiddenNodes,
      kind: "node",
      rootNode,
      sourceId: rootNode.id,
    },
    tone: "muted",
    width,
    x: bounds.x + bounds.width / 2 - width / 2,
    y: bounds.y + bounds.height / 2 - height / 2,
  };
}

function getTransitiveOutgoingDependencyNodes({
  edges,
  excludedNodeIds,
  nodeMap,
  rootNodeId,
}: {
  edges: readonly DependencyGraphEdge[];
  excludedNodeIds: ReadonlySet<string>;
  nodeMap: Map<string, PositionedDependencyGraphNode>;
  rootNodeId: string;
}) {
  const result: PositionedDependencyGraphNode[] = [];
  const visited = new Set<string>([rootNodeId]);
  const queue = [rootNodeId];

  while (queue.length) {
    const currentNodeId = queue.shift()!;

    for (const edge of edges) {
      if (edge.source !== currentNodeId || visited.has(edge.target)) {
        continue;
      }

      visited.add(edge.target);

      if (excludedNodeIds.has(edge.target)) {
        continue;
      }

      const targetNode = nodeMap.get(edge.target);

      if (!targetNode) {
        continue;
      }

      result.push(targetNode);
      queue.push(edge.target);
    }
  }

  return result;
}
