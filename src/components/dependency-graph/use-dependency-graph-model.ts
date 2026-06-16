import * as React from "react";

import { positionDependencyGraphParts, positionNodes, remapDependencyGraphEdges } from "./layout";
import {
  getCollapsibleDependencyGraphNodeMap,
  getMinimizedNodeProjection,
  getMinimizedPartProjection,
} from "./projections";
import { useDependencyGraphCanvas } from "./use-dependency-graph-canvas";
import { useDependencyGraphKeyboard } from "./use-dependency-graph-keyboard";

import type {
  DependencyGraphEdge,
  DependencyGraphMinimizeControls,
  DependencyGraphNode,
  DependencyGraphPart,
  DependencyGraphProps,
  PositionedDependencyGraphNode,
  RenderDependencyGraphNode,
} from "./types";

type UseDependencyGraphModelOptions = DependencyGraphProps & {
  autoLayoutColumns: number;
  edges: readonly DependencyGraphEdge[];
  minimizeControls: DependencyGraphMinimizeControls;
  nodes: readonly DependencyGraphNode[];
  padding: number;
};

export function useDependencyGraphModel({
  autoLayoutColumns,
  defaultFocusedNodeId,
  defaultMinimizedNodeIds,
  defaultMinimizedPartIds,
  edges,
  enableNodeMinimize,
  focusedNodeId,
  getMinimizedNodeLabel,
  getMinimizedPartLabel,
  getNodeDisabled,
  keyboardMode,
  minimizedNodeIds,
  minimizedPartIds,
  nodes,
  onFocusedNodeIdChange,
  onMinimizedNodeIdsChange,
  onMinimizedPartIdsChange,
  onNodeDeselect,
  onNodeSelect,
  padding,
  parts,
  selectedNodeId,
  ...interactionProps
}: UseDependencyGraphModelOptions) {
  const originalPositionedNodes = React.useMemo(
    () => positionNodes(nodes, autoLayoutColumns),
    [autoLayoutColumns, nodes],
  );
  const originalNodeMap = React.useMemo(
    () => new Map(originalPositionedNodes.map((node) => [node.id, node])),
    [originalPositionedNodes],
  );
  const originalValidEdges = React.useMemo(
    () =>
      edges.filter((edge) => originalNodeMap.has(edge.source) && originalNodeMap.has(edge.target)),
    [edges, originalNodeMap],
  );
  const positionedParts = React.useMemo(
    () => positionDependencyGraphParts(parts, originalPositionedNodes),
    [parts, originalPositionedNodes],
  );
  const [internalMinimizedPartIds, setInternalMinimizedPartIds] = React.useState<string[]>(() => [
    ...(defaultMinimizedPartIds ?? []),
  ]);
  const currentMinimizedPartIds = React.useMemo(
    () => new Set(minimizedPartIds ?? internalMinimizedPartIds),
    [internalMinimizedPartIds, minimizedPartIds],
  );
  const partProjection = React.useMemo(
    () =>
      getMinimizedPartProjection(positionedParts, currentMinimizedPartIds, getMinimizedPartLabel),
    [currentMinimizedPartIds, getMinimizedPartLabel, positionedParts],
  );
  const resolvedEnableNodeMinimize =
    enableNodeMinimize ??
    Boolean(minimizedNodeIds || defaultMinimizedNodeIds || onMinimizedNodeIdsChange);
  const [internalMinimizedNodeIds, setInternalMinimizedNodeIds] = React.useState<string[]>(() => [
    ...(defaultMinimizedNodeIds ?? []),
  ]);
  const currentMinimizedNodeIds = React.useMemo(
    () => new Set(minimizedNodeIds ?? internalMinimizedNodeIds),
    [internalMinimizedNodeIds, minimizedNodeIds],
  );
  const nodeProjection = React.useMemo(
    () =>
      getMinimizedNodeProjection({
        edges: originalValidEdges,
        getMinimizedNodeLabel,
        hiddenNodeIds: partProjection.hiddenNodeIds,
        minimizedNodeIds: currentMinimizedNodeIds,
        nodeMap: originalNodeMap,
      }),
    [
      currentMinimizedNodeIds,
      getMinimizedNodeLabel,
      originalNodeMap,
      originalValidEdges,
      partProjection.hiddenNodeIds,
    ],
  );
  const hiddenNodeToProxyId = React.useMemo(
    () =>
      new Map<string, string>([
        ...partProjection.hiddenNodeToProxyId,
        ...nodeProjection.hiddenNodeToProxyId,
      ]),
    [nodeProjection.hiddenNodeToProxyId, partProjection.hiddenNodeToProxyId],
  );
  const positionedNodes = React.useMemo<RenderDependencyGraphNode[]>(
    () => [
      ...originalPositionedNodes.filter((node) => !hiddenNodeToProxyId.has(node.id)),
      ...partProjection.summaryNodes,
      ...nodeProjection.summaryNodes,
    ],
    [
      hiddenNodeToProxyId,
      nodeProjection.summaryNodes,
      originalPositionedNodes,
      partProjection.summaryNodes,
    ],
  );
  const nodeMap = React.useMemo(
    () => new Map(positionedNodes.map((node) => [node.id, node])),
    [positionedNodes],
  );
  const validEdges = React.useMemo(
    () => remapDependencyGraphEdges(originalValidEdges, hiddenNodeToProxyId, nodeMap),
    [hiddenNodeToProxyId, nodeMap, originalValidEdges],
  );
  const resolvedKeyboardMode = keyboardMode ?? (onNodeSelect ? "nodes" : "none");
  const enabledNodes = React.useMemo(
    () => positionedNodes.filter((node) => !getNodeDisabled?.(node)),
    [getNodeDisabled, positionedNodes],
  );
  const collapsibleNodeHiddenNodes = React.useMemo(
    () =>
      getCollapsibleDependencyGraphNodeMap({
        edges: originalValidEdges,
        hiddenNodeIds: new Set([...partProjection.hiddenNodeIds, ...nodeProjection.hiddenNodeIds]),
        nodeMap: originalNodeMap,
        nodes: originalPositionedNodes,
      }),
    [
      nodeProjection.hiddenNodeIds,
      originalNodeMap,
      originalPositionedNodes,
      originalValidEdges,
      partProjection.hiddenNodeIds,
    ],
  );
  const { effectiveFocusedNodeId, handleNodeFocus, handleNodeKeyDown, setNodeRef } =
    useDependencyGraphKeyboard({
      defaultFocusedNodeId,
      enabledNodes,
      focusedNodeId,
      getNodeDisabled,
      nodeMap,
      onFocusedNodeIdChange,
      onNodeDeselect,
      onNodeSelect,
      resolvedKeyboardMode,
      selectedNodeId,
    });

  const togglePartMinimized = React.useCallback(
    (part: DependencyGraphPart, minimized: boolean) => {
      const nextMinimizedPartIds = minimized
        ? Array.from(new Set([...currentMinimizedPartIds, part.id]))
        : Array.from(currentMinimizedPartIds).filter((partId) => partId !== part.id);

      if (minimizedPartIds === undefined) {
        setInternalMinimizedPartIds(nextMinimizedPartIds);
      }

      onMinimizedPartIdsChange?.(nextMinimizedPartIds, part, minimized);
    },
    [currentMinimizedPartIds, minimizedPartIds, onMinimizedPartIdsChange],
  );

  const toggleNodeMinimized = React.useCallback(
    (node: PositionedDependencyGraphNode, minimized: boolean) => {
      const nextMinimizedNodeIds = minimized
        ? Array.from(new Set([...currentMinimizedNodeIds, node.id]))
        : Array.from(currentMinimizedNodeIds).filter((nodeId) => nodeId !== node.id);

      if (minimizedNodeIds === undefined) {
        setInternalMinimizedNodeIds(nextMinimizedNodeIds);
      }

      onMinimizedNodeIdsChange?.(nextMinimizedNodeIds, node, minimized);
    },
    [currentMinimizedNodeIds, minimizedNodeIds, onMinimizedNodeIdsChange],
  );

  const { bounds, canvasStyle, edgeRoutes, interaction } = useDependencyGraphCanvas({
    ...interactionProps,
    nodeMap,
    padding,
    partBounds: partProjection.expandedParts.map((part) => part.bounds),
    positionedNodes,
    validEdges,
  });

  return {
    bounds,
    canvasStyle,
    collapsibleNodeHiddenNodes,
    effectiveFocusedNodeId,
    edgeRoutes,
    handleNodeFocus,
    handleNodeKeyDown,
    interaction,
    nodeMap,
    positionedNodes,
    partProjection,
    resolvedEnableNodeMinimize,
    resolvedKeyboardMode,
    setNodeRef,
    toggleNodeMinimized,
    togglePartMinimized,
  };
}
