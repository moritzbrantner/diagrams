import * as React from "react";

import {
  getDiagramCanvasStyle,
  getSpatialBounds,
  useDiagramCanvasInteractions,
} from "../diagram-utils";

import { getDependencyGraphEdgeRoute } from "./layout";

import type { DependencyGraphEdge, DependencyGraphProps, RenderDependencyGraphNode } from "./types";

export function useDependencyGraphCanvas({
  defaultHighlightedElement,
  defaultInspectedEdgeId,
  defaultSearchQuery,
  defaultViewport,
  focusedSearchResult,
  getSearchText,
  highlightedElement,
  inspectedEdgeId,
  interactiveFeatures,
  nodeMap,
  onFocusedSearchResultChange,
  onHighlightedElementChange,
  onInspectedEdgeIdChange,
  onSearchQueryChange,
  onViewportChange,
  padding,
  partBounds,
  positionedNodes,
  renderEdgeInspector,
  searchQuery,
  validEdges,
  viewport,
}: Pick<
  DependencyGraphProps,
  | "defaultHighlightedElement"
  | "defaultInspectedEdgeId"
  | "defaultSearchQuery"
  | "defaultViewport"
  | "focusedSearchResult"
  | "getSearchText"
  | "highlightedElement"
  | "inspectedEdgeId"
  | "interactiveFeatures"
  | "onFocusedSearchResultChange"
  | "onHighlightedElementChange"
  | "onInspectedEdgeIdChange"
  | "onSearchQueryChange"
  | "onViewportChange"
  | "renderEdgeInspector"
  | "searchQuery"
  | "viewport"
> & {
  nodeMap: Map<string, RenderDependencyGraphNode>;
  padding: number;
  partBounds: readonly { x: number; y: number; width: number; height: number }[];
  positionedNodes: readonly RenderDependencyGraphNode[];
  validEdges: readonly DependencyGraphEdge[];
}) {
  const edgeRoutes = React.useMemo(
    () =>
      validEdges.flatMap((edge, index) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);

        if (!source || !target) {
          return [];
        }

        return [
          {
            edge,
            edgeIndex: index,
            route: getDependencyGraphEdgeRoute(edge, source, target, index, positionedNodes),
          },
        ];
      }),
    [nodeMap, positionedNodes, validEdges],
  );
  const routePoints = edgeRoutes.flatMap(({ route }) => route.points);
  const bounds = getSpatialBounds([...positionedNodes, ...partBounds], routePoints);
  const canvasStyle = getDiagramCanvasStyle(bounds, {
    minHeight: 288,
    minWidth: 640,
    padding,
  });
  const nodeDescriptors = React.useMemo(
    () =>
      positionedNodes.map((node) => ({
        id: node.id,
        item: node,
        label: node.label,
        bounds: { x: node.x, y: node.y, width: node.width, height: node.height },
      })),
    [positionedNodes],
  );
  const edgeDescriptors = React.useMemo(
    () =>
      edgeRoutes.map(({ edge, route }) => ({
        id: edge.id,
        item: edge,
        sourceId: edge.source,
        targetId: edge.target,
        label: edge.label,
        kind: edge.kind,
        direction: edge.direction,
        labelPoint:
          route.labelPoint ?? route.points[Math.floor(route.points.length / 2)] ?? route.points[0],
      })),
    [edgeRoutes],
  );
  const interaction = useDiagramCanvasInteractions({
    interactiveFeatures,
    contentBounds: bounds,
    nodes: nodeDescriptors,
    edges: edgeDescriptors,
    viewport,
    defaultViewport,
    onViewportChange,
    highlightedElement,
    defaultHighlightedElement,
    onHighlightedElementChange,
    searchQuery,
    defaultSearchQuery,
    onSearchQueryChange,
    focusedSearchResult,
    onFocusedSearchResultChange,
    inspectedEdgeId,
    defaultInspectedEdgeId,
    onInspectedEdgeIdChange,
    getSearchText,
    renderEdgeInspector,
    padding,
  });

  return { bounds, canvasStyle, edgeRoutes, interaction };
}
