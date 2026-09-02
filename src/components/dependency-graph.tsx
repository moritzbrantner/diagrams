"use client";

import * as React from "react";

import { cn } from "../internal/cn";

import { edgeToneByKind } from "./dependency-graph/constants";
import { DependencyGraphEdgeShape } from "./dependency-graph/edge-shape";
import { DependencyGraphInteractiveNode } from "./dependency-graph/interactive-node";
import { getDependencyGraphNodeMinimizeControl } from "./dependency-graph/minimize-controls";
import { DependencyGraphPartHull } from "./dependency-graph/parts";
import { useDependencyGraphModel } from "./dependency-graph/use-dependency-graph-model";
import { diagramCanvasLabelVisibilityClass, useDiagramCanvasSettings } from "./diagram-utils";

import type { DependencyGraphProps } from "./dependency-graph/types";

function DependencyGraph({
  nodes,
  edges = [],
  showLegend = false,
  ariaLabel = "Dependency graph",
  caption,
  emptyMessage = "No dependencies to display.",
  padding = 32,
  autoLayoutColumns = 3,
  parts,
  minimizedPartIds,
  defaultMinimizedPartIds,
  onMinimizedPartIdsChange,
  enableNodeMinimize,
  minimizedNodeIds,
  defaultMinimizedNodeIds,
  onMinimizedNodeIdsChange,
  minimizeControls = "auto",
  getMinimizedNodeLabel,
  getMinimizedPartLabel,
  nodeActionPlacement = "inside-bottom-end",
  keyboardMode,
  focusedNodeId,
  defaultFocusedNodeId,
  onFocusedNodeIdChange,
  nodeActions,
  selectedNodeId,
  getNodeDisabled,
  renderNodeSelection,
  onNodeActionSelect,
  onNodeSelect,
  onNodeDeselect,
  interactiveFeatures,
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
  getSearchText,
  inspectedEdgeId,
  defaultInspectedEdgeId,
  onInspectedEdgeIdChange,
  renderEdgeInspector,
  className,
  ...figureProps
}: DependencyGraphProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
  const {
    menu: canvasSettingsMenu,
    setScrollAreaElement: setCanvasSettingsScrollAreaElement,
    svgProps: canvasSettingsSvgProps,
  } = useDiagramCanvasSettings();
  const model = useDependencyGraphModel({
    autoLayoutColumns,
    defaultFocusedNodeId,
    defaultHighlightedElement,
    defaultInspectedEdgeId,
    defaultMinimizedNodeIds,
    defaultMinimizedPartIds,
    defaultSearchQuery,
    defaultViewport,
    enableNodeMinimize,
    edges,
    focusedNodeId,
    focusedSearchResult,
    getMinimizedNodeLabel,
    getMinimizedPartLabel,
    getNodeDisabled,
    getSearchText,
    highlightedElement,
    inspectedEdgeId,
    interactiveFeatures,
    keyboardMode,
    minimizeControls,
    minimizedNodeIds,
    minimizedPartIds,
    nodes,
    onFocusedNodeIdChange,
    onFocusedSearchResultChange,
    onHighlightedElementChange,
    onInspectedEdgeIdChange,
    onMinimizedNodeIdsChange,
    onMinimizedPartIdsChange,
    onNodeDeselect,
    onNodeSelect,
    onSearchQueryChange,
    onViewportChange,
    padding,
    parts,
    renderEdgeInspector,
    searchQuery,
    selectedNodeId,
    viewport,
  });
  const setScrollAreaElement = React.useCallback(
    (element: HTMLDivElement | null) => {
      setCanvasSettingsScrollAreaElement(element);
      model.interaction.setScrollAreaElement(element);
    },
    [model.interaction, setCanvasSettingsScrollAreaElement],
  );
  const markerId = `dependency-graph-arrow-${markerPrefix}`;

  return (
    <figure
      data-slot="dependency-graph"
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...figureProps}
    >
      <div
        ref={setScrollAreaElement}
        data-slot="dependency-graph-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="relative overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus dependency graph scroll area
        </button>
        <svg
          {...canvasSettingsSvgProps}
          data-slot="dependency-graph-svg"
          role={onNodeSelect || nodeActions ? "group" : "img"}
          aria-label={ariaLabel}
          viewBox={model.interaction.viewBox}
          style={model.canvasStyle}
          className={cn(
            "block min-h-72 w-full min-w-160 text-foreground",
            diagramCanvasLabelVisibilityClass,
          )}
          {...model.interaction.svgProps}
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="10"
              markerHeight="10"
              markerUnits="userSpaceOnUse"
              refX="10"
              refY="5"
              orient="auto-start-reverse"
              viewBox="0 0 10 10"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-current text-muted-foreground" />
            </marker>
          </defs>
          {model.positionedNodes.length ? (
            <>
              <g data-slot="dependency-graph-parts">
                {model.partProjection.expandedParts.map((part) => (
                  <DependencyGraphPartHull
                    key={part.part.id}
                    positionedPart={part}
                    minimizeControls={minimizeControls}
                    onMinimize={() => model.togglePartMinimized(part.part, true)}
                  />
                ))}
              </g>
              <g data-slot="dependency-graph-edges">
                {model.edgeRoutes.map(({ edge, edgeIndex, route }) => (
                  <DependencyGraphEdgeShape
                    key={edge.id}
                    edge={edge}
                    nodes={model.nodeMap}
                    obstacles={model.positionedNodes}
                    markerId={markerId}
                    edgeIndex={edgeIndex}
                    route={route}
                    highlightState={model.interaction.getEdgeHighlightState(edge.id)}
                    interactionProps={model.interaction.getEdgeInteractionProps(edge.id)}
                  />
                ))}
              </g>
              <g data-slot="dependency-graph-nodes">
                {model.positionedNodes.map((node) => (
                  <DependencyGraphInteractiveNode
                    key={node.id}
                    node={node}
                    minimizeControl={getDependencyGraphNodeMinimizeControl({
                      collapsibleNodeHiddenNodes: model.collapsibleNodeHiddenNodes,
                      minimizeControls,
                      node,
                      nodeMinimizeEnabled: model.resolvedEnableNodeMinimize,
                      onToggleNodeMinimized: model.toggleNodeMinimized,
                      onTogglePartMinimized: model.togglePartMinimized,
                    })}
                    nodeActions={nodeActions}
                    nodeActionPlacement={nodeActionPlacement}
                    selected={selectedNodeId === node.id}
                    focused={model.effectiveFocusedNodeId === node.id}
                    disabled={Boolean(getNodeDisabled?.(node))}
                    keyboardMode={model.resolvedKeyboardMode}
                    renderNodeSelection={renderNodeSelection}
                    onNodeActionSelect={onNodeActionSelect}
                    onNodeFocus={model.handleNodeFocus}
                    onNodeKeyDown={model.handleNodeKeyDown}
                    onNodeSelect={onNodeSelect}
                    setNodeRef={(nodeId, element) => {
                      model.setNodeRef(nodeId, element);
                      model.interaction.setNodeElement(nodeId, element);
                    }}
                    highlightState={model.interaction.getNodeHighlightState(node.id)}
                    interactionProps={model.interaction.getNodeInteractionProps(node.id)}
                  />
                ))}
              </g>
            </>
          ) : (
            <text
              x={model.bounds.x + model.bounds.width / 2}
              y={model.bounds.y + model.bounds.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-sm"
            >
              {emptyMessage}
            </text>
          )}
        </svg>
        {model.interaction.overlay}
        {canvasSettingsMenu}
      </div>
      {showLegend ? (
        <div
          data-slot="dependency-graph-legend"
          className="flex flex-wrap gap-2 border-t px-3 py-2 text-xs text-muted-foreground"
        >
          {Object.keys(edgeToneByKind).map((kind) => (
            <span key={kind} className="rounded-md border px-2 py-1">
              {kind}
            </span>
          ))}
        </div>
      ) : null}
      {caption ? (
        <figcaption className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export { DependencyGraph };
export type {
  DependencyGraphEdge,
  DependencyGraphEdgeKind,
  DependencyGraphKeyboardMode,
  DependencyGraphMinimizeControls,
  DependencyGraphNode,
  DependencyGraphNodeAction,
  DependencyGraphNodeActionPlacement,
  DependencyGraphPart,
  DependencyGraphProps,
  DependencyGraphStatus,
  PositionedDependencyGraphNode,
} from "./dependency-graph/types";
export type {
  DiagramDirection as DependencyGraphDirection,
  DiagramPoint as DependencyGraphPoint,
  DiagramTone as DependencyGraphTone,
} from "./dependency-graph/types";
