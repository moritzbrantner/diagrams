"use client";

import { cn } from "@moritzbrantner/ui";
import { Maximize2Icon, Minimize2Icon } from "lucide-react";
import * as React from "react";

import {
  clampFiniteNumber,
  defaultEdgeToneClasses,
  defaultSvgToneClasses,
  defaultToneClasses,
  getAutoGridPosition,
  getSpatialBounds,
  pointsToPath,
  type DiagramDirection,
  type DiagramPoint,
  type DiagramTone,
} from "./diagram-utils";

export type DependencyGraphStatus = "stable" | "active" | "deprecated" | "blocked" | "at-risk";
export type DependencyGraphEdgeKind = "runtime" | "build" | "peer" | "optional" | "blocking";
export type DependencyGraphKeyboardMode = "nodes" | "none";
export type DependencyGraphNodeActionPlacement = "inside-bottom-end" | "outside-top-end";
export type DependencyGraphMinimizeControls = "auto" | "always" | "none";

export type DependencyGraphNode = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  group?: React.ReactNode;
  partId?: string;
  version?: React.ReactNode;
  status?: DependencyGraphStatus;
  minimizable?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  tone?: DiagramTone;
};

export type DependencyGraphPart = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  nodeIds?: readonly string[];
  tone?: DiagramTone;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type DependencyGraphNodeAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (node: PositionedDependencyGraphNode) => void;
};

export type DependencyGraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: React.ReactNode;
  kind?: DependencyGraphEdgeKind;
  direction?: DiagramDirection;
  points?: readonly DiagramPoint[];
  waypoints?: readonly DiagramPoint[];
};

export type DependencyGraphProps = Omit<React.ComponentProps<"figure">, "children"> & {
  nodes: readonly DependencyGraphNode[];
  edges?: readonly DependencyGraphEdge[];
  showLegend?: boolean;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
  autoLayoutColumns?: number;
  parts?: readonly DependencyGraphPart[];
  minimizedPartIds?: readonly string[];
  defaultMinimizedPartIds?: readonly string[];
  onMinimizedPartIdsChange?: (
    partIds: string[],
    part: DependencyGraphPart,
    minimized: boolean,
  ) => void;
  enableNodeMinimize?: boolean;
  minimizedNodeIds?: readonly string[];
  defaultMinimizedNodeIds?: readonly string[];
  onMinimizedNodeIdsChange?: (
    nodeIds: string[],
    node: PositionedDependencyGraphNode,
    minimized: boolean,
  ) => void;
  minimizeControls?: DependencyGraphMinimizeControls;
  getMinimizedNodeLabel?: (
    node: PositionedDependencyGraphNode,
    hiddenNodes: readonly PositionedDependencyGraphNode[],
  ) => React.ReactNode;
  getMinimizedPartLabel?: (
    part: DependencyGraphPart,
    hiddenNodes: readonly PositionedDependencyGraphNode[],
  ) => React.ReactNode;
  selectedNodeId?: string | null;
  keyboardMode?: DependencyGraphKeyboardMode;
  focusedNodeId?: string | null;
  defaultFocusedNodeId?: string | null;
  onFocusedNodeIdChange?: (node: PositionedDependencyGraphNode | null) => void;
  nodeActionPlacement?: DependencyGraphNodeActionPlacement;
  getNodeDisabled?: (node: PositionedDependencyGraphNode) => boolean;
  renderNodeSelection?: (node: PositionedDependencyGraphNode) => React.ReactNode;
  nodeActions?:
    | readonly DependencyGraphNodeAction[]
    | ((node: PositionedDependencyGraphNode) => readonly DependencyGraphNodeAction[]);
  onNodeSelect?: (node: PositionedDependencyGraphNode) => void;
  onNodeDeselect?: () => void;
  onNodeActionSelect?: (
    action: DependencyGraphNodeAction,
    node: PositionedDependencyGraphNode,
  ) => void;
};

type PositionedDependencyGraphNode = DependencyGraphNode &
  Required<Pick<DependencyGraphNode, "x" | "y">> & {
    width: number;
    height: number;
  };

type DependencyGraphSummaryKind = "part" | "node";

type DependencyGraphSummary = {
  kind: DependencyGraphSummaryKind;
  sourceId: string;
  hiddenNodes: readonly PositionedDependencyGraphNode[];
  part?: DependencyGraphPart;
  rootNode?: PositionedDependencyGraphNode;
};

type RenderDependencyGraphNode = PositionedDependencyGraphNode & {
  summary?: DependencyGraphSummary;
};

type PositionedDependencyGraphPart = {
  part: DependencyGraphPart;
  nodeIds: Set<string>;
  nodes: readonly PositionedDependencyGraphNode[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type DependencyGraphEdgeRoute = {
  points: readonly DiagramPoint[];
  labelPoint?: DiagramPoint;
};

type RenderDependencyGraphEdge = DependencyGraphEdge & {
  source: string;
  target: string;
};

const DEFAULT_NODE_WIDTH = 188;
const DEFAULT_NODE_HEIGHT = 104;
const edgeToneByKind: Record<DependencyGraphEdgeKind, DiagramTone> = {
  runtime: "accent",
  build: "default",
  peer: "success",
  optional: "muted",
  blocking: "danger",
};
const statusTone: Record<DependencyGraphStatus, DiagramTone> = {
  stable: "success",
  active: "accent",
  deprecated: "muted",
  blocked: "danger",
  "at-risk": "warning",
};
const PART_HULL_PADDING = 28;
const SUMMARY_NODE_WIDTH = 168;
const SUMMARY_NODE_HEIGHT = 84;
const PART_SUMMARY_PREFIX = "__dependency-graph-part-summary-";
const NODE_SUMMARY_PREFIX = "__dependency-graph-node-summary-";

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
  selectedNodeId,
  keyboardMode,
  focusedNodeId,
  defaultFocusedNodeId,
  onFocusedNodeIdChange,
  nodeActionPlacement = "inside-bottom-end",
  getNodeDisabled,
  renderNodeSelection,
  nodeActions,
  onNodeSelect,
  onNodeDeselect,
  onNodeActionSelect,
  className,
  ...props
}: DependencyGraphProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
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
  const nodeRefs = React.useRef(new Map<string, SVGGElement>());
  const [internalFocusedNodeId, setInternalFocusedNodeId] = React.useState<string | null>(
    () => defaultFocusedNodeId ?? null,
  );
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
  const requestedFocusedNodeId =
    focusedNodeId !== undefined ? focusedNodeId : internalFocusedNodeId;
  const effectiveFocusedNodeId =
    resolvedKeyboardMode === "nodes"
      ? (enabledNodes.find((node) => node.id === requestedFocusedNodeId)?.id ??
        enabledNodes[0]?.id ??
        null)
      : null;
  const setNodeRef = React.useCallback((nodeId: string, element: SVGGElement | null) => {
    if (element) {
      nodeRefs.current.set(nodeId, element);
    } else {
      nodeRefs.current.delete(nodeId);
    }
  }, []);
  const focusNodeById = React.useCallback(
    (nodeId: string | null, shouldFocusElement = true) => {
      const nextNode = nodeId ? (nodeMap.get(nodeId) ?? null) : null;

      if (focusedNodeId === undefined) {
        setInternalFocusedNodeId(nodeId);
      }

      onFocusedNodeIdChange?.(nextNode);

      if (nodeId && shouldFocusElement) {
        queueMicrotask(() => nodeRefs.current.get(nodeId)?.focus());
      }
    },
    [focusedNodeId, nodeMap, onFocusedNodeIdChange],
  );
  const handleNodeFocus = React.useCallback(
    (node: PositionedDependencyGraphNode) => {
      if (getNodeDisabled?.(node)) {
        return;
      }

      if (focusedNodeId === undefined) {
        setInternalFocusedNodeId(node.id);
      }

      onFocusedNodeIdChange?.(node);
    },
    [focusedNodeId, getNodeDisabled, onFocusedNodeIdChange],
  );
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
  const handleNodeKeyDown = React.useCallback(
    (event: React.KeyboardEvent<SVGGElement>, node: PositionedDependencyGraphNode) => {
      if (resolvedKeyboardMode === "none" || getNodeDisabled?.(node)) {
        return;
      }

      if (isActivationKey(event)) {
        event.preventDefault();
        onNodeSelect?.(node);
        return;
      }

      if (event.key === "Escape") {
        if (selectedNodeId != null && onNodeSelect && onNodeDeselect) {
          event.preventDefault();
          onNodeDeselect();
        }

        return;
      }

      if (
        event.key !== "ArrowRight" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp"
      ) {
        return;
      }

      event.preventDefault();

      const nextNode = getNearestDependencyGraphNode(
        node,
        enabledNodes.filter((item) => item.id !== node.id),
        event.key,
      );

      if (nextNode) {
        focusNodeById(nextNode.id);
      }
    },
    [
      enabledNodes,
      focusNodeById,
      getNodeDisabled,
      onNodeDeselect,
      onNodeSelect,
      resolvedKeyboardMode,
      selectedNodeId,
    ],
  );
  const routePoints = validEdges.flatMap((edge, index) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);

    return source && target ? getDependencyGraphEdgeRoute(edge, source, target, index).points : [];
  });
  const partBounds = partProjection.expandedParts.map((part) => part.bounds);
  const bounds = getSpatialBounds([...positionedNodes, ...partBounds], routePoints);
  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${
    bounds.height + padding * 2
  }`;
  const markerId = `dependency-graph-arrow-${markerPrefix}`;

  return (
    <figure
      data-slot="dependency-graph"
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="dependency-graph-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus dependency graph scroll area
        </button>
        <svg
          data-slot="dependency-graph-svg"
          role={onNodeSelect || nodeActions ? "group" : "img"}
          aria-label={ariaLabel}
          viewBox={viewBox}
          className="block min-h-72 w-full min-w-160 text-foreground"
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-current text-muted-foreground" />
            </marker>
          </defs>
          {positionedNodes.length ? (
            <>
              <g data-slot="dependency-graph-parts">
                {partProjection.expandedParts.map((part) => (
                  <DependencyGraphPartHull
                    key={part.part.id}
                    positionedPart={part}
                    minimizeControls={minimizeControls}
                    onMinimize={() => togglePartMinimized(part.part, true)}
                  />
                ))}
              </g>
              <g data-slot="dependency-graph-edges">
                {validEdges.map((edge, index) => (
                  <DependencyGraphEdgeShape
                    key={edge.id}
                    edge={edge}
                    nodes={nodeMap}
                    markerId={markerId}
                    edgeIndex={index}
                  />
                ))}
              </g>
              <g data-slot="dependency-graph-nodes">
                {positionedNodes.map((node) => (
                  <DependencyGraphInteractiveNode
                    key={node.id}
                    node={node}
                    minimizeControl={getDependencyGraphNodeMinimizeControl({
                      collapsibleNodeHiddenNodes,
                      minimizeControls,
                      node,
                      nodeMinimizeEnabled: resolvedEnableNodeMinimize,
                      onToggleNodeMinimized: toggleNodeMinimized,
                      onTogglePartMinimized: togglePartMinimized,
                    })}
                    nodeActions={nodeActions}
                    nodeActionPlacement={nodeActionPlacement}
                    selected={selectedNodeId === node.id}
                    focused={effectiveFocusedNodeId === node.id}
                    disabled={Boolean(getNodeDisabled?.(node))}
                    keyboardMode={resolvedKeyboardMode}
                    renderNodeSelection={renderNodeSelection}
                    onNodeActionSelect={onNodeActionSelect}
                    onNodeFocus={handleNodeFocus}
                    onNodeKeyDown={handleNodeKeyDown}
                    onNodeSelect={onNodeSelect}
                    setNodeRef={setNodeRef}
                  />
                ))}
              </g>
            </>
          ) : (
            <text
              x={bounds.x + bounds.width / 2}
              y={bounds.y + bounds.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-sm"
            >
              {emptyMessage}
            </text>
          )}
        </svg>
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

type DependencyGraphNodeMinimizeControl = {
  ariaLabel: string;
  expanded: boolean;
  onToggle: () => void;
};

function DependencyGraphPartHull({
  positionedPart,
  minimizeControls,
  onMinimize,
}: {
  positionedPart: PositionedDependencyGraphPart;
  minimizeControls: DependencyGraphMinimizeControls;
  onMinimize: () => void;
}) {
  if (minimizeControls === "none") {
    return (
      <g data-slot="dependency-graph-part" data-part-id={positionedPart.part.id}>
        <DependencyGraphPartHullShape positionedPart={positionedPart} />
      </g>
    );
  }

  const label = getDependencyGraphPartAccessibleName(positionedPart.part);

  return (
    <g data-slot="dependency-graph-part" data-part-id={positionedPart.part.id}>
      <DependencyGraphPartHullShape positionedPart={positionedPart} />
      <foreignObject
        x={positionedPart.bounds.x + positionedPart.bounds.width - 36}
        y={positionedPart.bounds.y + 8}
        width={28}
        height={28}
      >
        <button
          type="button"
          data-slot="dependency-graph-part-control"
          aria-label={`Minimize ${label}`}
          aria-expanded="true"
          className="inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-muted-foreground shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={(event) => {
            event.stopPropagation();
            onMinimize();
          }}
        >
          <Minimize2Icon aria-hidden="true" className="size-3.5" />
        </button>
      </foreignObject>
    </g>
  );
}

function DependencyGraphPartHullShape({
  positionedPart,
}: {
  positionedPart: PositionedDependencyGraphPart;
}) {
  const tone = positionedPart.part.tone ?? "muted";

  return (
    <>
      <rect
        data-slot="dependency-graph-part-hull"
        x={positionedPart.bounds.x}
        y={positionedPart.bounds.y}
        width={positionedPart.bounds.width}
        height={positionedPart.bounds.height}
        rx={16}
        strokeDasharray="6 6"
        className={cn("opacity-70", defaultSvgToneClasses[tone])}
      />
      <foreignObject
        x={positionedPart.bounds.x + 12}
        y={positionedPart.bounds.y + 8}
        width={Math.max(96, positionedPart.bounds.width - 56)}
        height={36}
      >
        <div className="grid gap-0.5 overflow-hidden text-xs leading-4 text-muted-foreground">
          <div className="truncate font-medium text-foreground">{positionedPart.part.label}</div>
          {positionedPart.part.description ? (
            <div className="truncate">{positionedPart.part.description}</div>
          ) : null}
        </div>
      </foreignObject>
    </>
  );
}

function DependencyGraphInteractiveNode({
  node,
  minimizeControl,
  nodeActions,
  nodeActionPlacement,
  selected,
  focused,
  disabled,
  keyboardMode,
  renderNodeSelection,
  onNodeActionSelect,
  onNodeFocus,
  onNodeKeyDown,
  onNodeSelect,
  setNodeRef,
}: {
  node: RenderDependencyGraphNode;
  minimizeControl?: DependencyGraphNodeMinimizeControl;
  nodeActions?: DependencyGraphProps["nodeActions"];
  nodeActionPlacement: DependencyGraphNodeActionPlacement;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  keyboardMode: DependencyGraphKeyboardMode;
  renderNodeSelection?: DependencyGraphProps["renderNodeSelection"];
  onNodeActionSelect?: DependencyGraphProps["onNodeActionSelect"];
  onNodeFocus: (node: PositionedDependencyGraphNode) => void;
  onNodeKeyDown: (
    event: React.KeyboardEvent<SVGGElement>,
    node: PositionedDependencyGraphNode,
  ) => void;
  onNodeSelect?: DependencyGraphProps["onNodeSelect"];
  setNodeRef: (nodeId: string, element: SVGGElement | null) => void;
}) {
  const resolvedActions =
    typeof nodeActions === "function" ? nodeActions(node) : (nodeActions ?? []);
  const interactive = Boolean(onNodeSelect) && !disabled;
  const accessibleName = getDependencyGraphNodeAccessibleName(node);
  const selectNode = React.useCallback(() => {
    if (!disabled) {
      onNodeSelect?.(node);
    }
  }, [disabled, node, onNodeSelect]);
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<SVGGElement>) => {
      onNodeKeyDown(event, node);
    },
    [node, onNodeKeyDown],
  );

  return (
    <g
      data-slot="dependency-graph-node-interaction"
      data-node-id={node.id}
      data-selected={selected ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      role={onNodeSelect && resolvedActions.length === 0 ? "button" : undefined}
      aria-label={onNodeSelect && resolvedActions.length === 0 ? accessibleName : undefined}
      aria-pressed={onNodeSelect && resolvedActions.length === 0 ? selected : undefined}
      aria-disabled={
        onNodeSelect && resolvedActions.length === 0 ? disabled || undefined : undefined
      }
      tabIndex={keyboardMode === "nodes" && focused && !disabled ? 0 : -1}
      className={cn(
        "outline-none",
        onNodeSelect &&
          "cursor-pointer focus-visible:[&_[data-slot='dependency-graph-node-focus']]:stroke-ring",
        disabled && "opacity-60",
      )}
      onClick={interactive ? selectNode : undefined}
      onFocus={() => onNodeFocus(node)}
      onKeyDown={handleKeyDown}
      ref={(element) => setNodeRef(node.id, element)}
    >
      {selected ? (
        (renderNodeSelection?.(node) ?? (
          <rect
            data-slot="dependency-graph-node-focus"
            x={node.x - 6}
            y={node.y - 6}
            width={node.width + 12}
            height={node.height + 12}
            rx="12"
            className="fill-transparent stroke-primary stroke-2"
          />
        ))
      ) : focused ? (
        <rect
          data-slot="dependency-graph-node-focus"
          x={node.x - 6}
          y={node.y - 6}
          width={node.width + 12}
          height={node.height + 12}
          rx="12"
          className="fill-transparent stroke-ring stroke-2"
        />
      ) : null}
      <DependencyGraphNodeShape node={node} />
      {minimizeControl ? (
        <DependencyGraphNodeMinimizeButton control={minimizeControl} node={node} />
      ) : null}
      {resolvedActions.length ? (
        <DependencyGraphNodeActions
          actions={resolvedActions}
          node={node}
          placement={nodeActionPlacement}
          onNodeActionSelect={onNodeActionSelect}
        />
      ) : null}
    </g>
  );
}

function DependencyGraphNodeMinimizeButton({
  control,
  node,
}: {
  control: DependencyGraphNodeMinimizeControl;
  node: RenderDependencyGraphNode;
}) {
  return (
    <foreignObject x={node.x + node.width - 36} y={node.y + 8} width={28} height={28}>
      <button
        type="button"
        data-slot="dependency-graph-node-minimize-control"
        aria-label={control.ariaLabel}
        aria-expanded={control.expanded}
        className="inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-muted-foreground shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={(event) => {
          event.stopPropagation();
          control.onToggle();
        }}
      >
        {control.expanded ? (
          <Minimize2Icon aria-hidden="true" className="size-3.5" />
        ) : (
          <Maximize2Icon aria-hidden="true" className="size-3.5" />
        )}
      </button>
    </foreignObject>
  );
}

function DependencyGraphNodeActions({
  actions,
  node,
  placement,
  onNodeActionSelect,
}: {
  actions: readonly DependencyGraphNodeAction[];
  node: PositionedDependencyGraphNode;
  placement: DependencyGraphNodeActionPlacement;
  onNodeActionSelect?: DependencyGraphProps["onNodeActionSelect"];
}) {
  const actionSize = 28;
  const actionGap = 4;
  const width = actions.length * actionSize + Math.max(0, actions.length - 1) * actionGap;
  const x = node.x + node.width - width - 8;
  const y =
    placement === "outside-top-end"
      ? node.y - actionSize - 4
      : node.y + node.height - actionSize - 8;

  return (
    <foreignObject
      data-slot="dependency-graph-node-actions"
      data-placement={placement}
      x={x}
      y={y}
      width={width}
      height={actionSize}
    >
      <div className="flex gap-1">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            data-slot="dependency-graph-node-action"
            data-action-id={action.id}
            data-destructive={action.destructive ? "true" : undefined}
            aria-label={getDependencyGraphActionAccessibleLabel(action)}
            disabled={action.disabled}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-xs font-medium text-foreground shadow-sm outline-none transition-colors",
              "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
              action.destructive &&
                "text-destructive hover:bg-destructive/10 hover:text-destructive",
              "[&_svg]:size-3.5",
            )}
            onClick={(event) => {
              event.stopPropagation();
              action.onSelect?.(node);
              onNodeActionSelect?.(action, node);
            }}
          >
            {action.icon ?? action.label}
          </button>
        ))}
      </div>
    </foreignObject>
  );
}

function DependencyGraphEdgeShape({
  edge,
  nodes,
  markerId,
  edgeIndex,
}: {
  edge: RenderDependencyGraphEdge;
  nodes: Map<string, RenderDependencyGraphNode>;
  markerId: string;
  edgeIndex: number;
}) {
  const source = nodes.get(edge.source);
  const target = nodes.get(edge.target);

  if (!source || !target) {
    return null;
  }

  const route = getDependencyGraphEdgeRoute(edge, source, target, edgeIndex);
  const points = route.points;
  const direction = edge.direction ?? "forward";
  const markerUrl = `url(#${markerId})`;
  const labelPoint = route.labelPoint ?? points[Math.floor(points.length / 2)] ?? points[0];
  const tone = edgeToneByKind[edge.kind ?? "runtime"];

  return (
    <g data-slot="dependency-graph-edge" data-kind={edge.kind ?? "runtime"}>
      <path
        d={pointsToPath(points)}
        fill="none"
        strokeWidth={2}
        strokeDasharray={edge.kind === "optional" ? "6 6" : undefined}
        className={defaultEdgeToneClasses[tone]}
        markerStart={direction === "backward" || direction === "both" ? markerUrl : undefined}
        markerEnd={direction === "forward" || direction === "both" ? markerUrl : undefined}
      />
      {edge.label && labelPoint ? (
        <foreignObject x={labelPoint.x - 70} y={labelPoint.y - 22} width={140} height={34}>
          <div
            data-slot="dependency-graph-edge-label"
            className="inline-flex max-w-36 rounded-md border bg-background px-2 py-1 text-center text-xs text-muted-foreground shadow-sm"
          >
            {edge.label}
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

function DependencyGraphNodeShape({ node }: { node: RenderDependencyGraphNode }) {
  const tone = node.tone ?? (node.status ? statusTone[node.status] : "default");

  return (
    <foreignObject
      data-slot={node.summary ? "dependency-graph-summary-node" : "dependency-graph-node"}
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
    >
      <div
        data-node-id={node.id}
        data-status={node.status}
        data-tone={tone}
        className={cn(
          "grid size-full content-start gap-1 rounded-md border p-3 text-sm shadow-sm",
          defaultToneClasses[tone],
        )}
      >
        {node.group ? <div className="text-xs text-muted-foreground">{node.group}</div> : null}
        <div className="font-medium leading-5">{node.label}</div>
        {node.description ? (
          <div className="line-clamp-2 text-xs leading-4 text-muted-foreground">
            {node.description}
          </div>
        ) : null}
        {node.version || node.status ? (
          <div className="mt-auto text-xs text-muted-foreground">
            {node.version}
            {node.version && node.status ? " · " : null}
            {node.status}
          </div>
        ) : null}
      </div>
    </foreignObject>
  );
}

function positionDependencyGraphParts(
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

function getMinimizedPartProjection(
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

function getMinimizedNodeProjection({
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

function getCollapsibleDependencyGraphNodeMap({
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

function remapDependencyGraphEdges(
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

function positionNodes(
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

function getDependencyGraphNodeCenter(node: PositionedDependencyGraphNode): DiagramPoint {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  };
}

function getDependencyGraphEdgeRoute(
  edge: DependencyGraphEdge,
  sourceNode: PositionedDependencyGraphNode,
  targetNode: PositionedDependencyGraphNode,
  edgeIndex: number,
): DependencyGraphEdgeRoute {
  if (edge.points?.length) {
    return {
      labelPoint: edge.points[Math.floor(edge.points.length / 2)],
      points: edge.points,
    };
  }

  if (sourceNode.id === targetNode.id) {
    const offset = 32 + (edgeIndex % 3) * 16;
    const start = {
      x: sourceNode.x + sourceNode.width,
      y: sourceNode.y + sourceNode.height * 0.34,
    };
    const end = {
      x: sourceNode.x + sourceNode.width,
      y: sourceNode.y + sourceNode.height * 0.68,
    };

    return {
      labelPoint: {
        x: sourceNode.x + sourceNode.width + offset,
        y: sourceNode.y + sourceNode.height / 2,
      },
      points: [start, { x: start.x + offset, y: start.y }, { x: start.x + offset, y: end.y }, end],
    };
  }

  const sourceCenter = getDependencyGraphNodeCenter(sourceNode);
  const targetCenter = getDependencyGraphNodeCenter(targetNode);

  if (edge.waypoints?.length) {
    const sourceToward = edge.waypoints[0] ?? targetCenter;
    const targetToward = edge.waypoints[edge.waypoints.length - 1] ?? sourceCenter;
    const source = getDependencyGraphBoundaryPoint(sourceNode, sourceToward);
    const target = getDependencyGraphBoundaryPoint(targetNode, targetToward);

    return {
      labelPoint: edge.waypoints[Math.floor(edge.waypoints.length / 2)],
      points: [source, ...edge.waypoints, target],
    };
  }

  const source = getDependencyGraphBoundaryPoint(sourceNode, targetCenter);
  const target = getDependencyGraphBoundaryPoint(targetNode, sourceCenter);
  const offset = (edgeIndex % 3) * 12;
  const middleX = (source.x + target.x) / 2 + offset;

  return {
    labelPoint: {
      x: (source.x + target.x) / 2,
      y: (source.y + target.y) / 2,
    },
    points: [source, { x: middleX, y: source.y }, { x: middleX, y: target.y }, target],
  };
}

function getDependencyGraphBoundaryPoint(
  node: PositionedDependencyGraphNode,
  toward: DiagramPoint,
): DiagramPoint {
  const center = getDependencyGraphNodeCenter(node);
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const halfWidth = node.width / 2;
  const halfHeight = node.height / 2;

  if (dx === 0 && dy === 0) {
    return { x: center.x + halfWidth, y: center.y };
  }

  if (Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth) {
    return {
      x: center.x + (dx > 0 ? halfWidth : -halfWidth),
      y: center.y + (dy * halfWidth) / Math.max(Math.abs(dx), 1),
    };
  }

  return {
    x: center.x + (dx * halfHeight) / Math.max(Math.abs(dy), 1),
    y: center.y + (dy > 0 ? halfHeight : -halfHeight),
  };
}

function getDependencyGraphNodeMinimizeControl({
  collapsibleNodeHiddenNodes,
  minimizeControls,
  node,
  nodeMinimizeEnabled,
  onToggleNodeMinimized,
  onTogglePartMinimized,
}: {
  collapsibleNodeHiddenNodes: Map<string, readonly PositionedDependencyGraphNode[]>;
  minimizeControls: DependencyGraphMinimizeControls;
  node: RenderDependencyGraphNode;
  nodeMinimizeEnabled: boolean;
  onToggleNodeMinimized: (node: PositionedDependencyGraphNode, minimized: boolean) => void;
  onTogglePartMinimized: (part: DependencyGraphPart, minimized: boolean) => void;
}): DependencyGraphNodeMinimizeControl | undefined {
  if (minimizeControls === "none") {
    return undefined;
  }

  if (node.summary?.kind === "part" && node.summary.part) {
    const label = getDependencyGraphNodeAccessibleName(node);

    return {
      ariaLabel: `Expand ${label}`,
      expanded: false,
      onToggle: () => onTogglePartMinimized(node.summary!.part!, false),
    };
  }

  if (node.summary?.kind === "node" && node.summary.rootNode) {
    const label = getDependencyGraphNodeAccessibleName(node);

    return {
      ariaLabel: `Expand ${label}`,
      expanded: false,
      onToggle: () => onToggleNodeMinimized(node.summary!.rootNode!, false),
    };
  }

  if (!nodeMinimizeEnabled || node.minimizable === false) {
    return undefined;
  }

  const hiddenNodes = collapsibleNodeHiddenNodes.get(node.id);

  if (!hiddenNodes?.length && minimizeControls !== "always") {
    return undefined;
  }

  const label = getDependencyGraphNodeAccessibleName(node);

  return {
    ariaLabel: `Minimize ${label}`,
    expanded: true,
    onToggle: () => {
      if (hiddenNodes?.length) {
        onToggleNodeMinimized(node, true);
      }
    },
  };
}

function getNearestDependencyGraphNode(
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

function getDependencyGraphNodeAccessibleName(node: DependencyGraphNode) {
  return typeof node.label === "string" || typeof node.label === "number"
    ? String(node.label)
    : node.id;
}

function getDependencyGraphPartAccessibleName(part: DependencyGraphPart) {
  return typeof part.label === "string" || typeof part.label === "number"
    ? String(part.label)
    : part.id;
}

function getDependencyGraphActionAccessibleLabel(action: DependencyGraphNodeAction) {
  return typeof action.label === "string" || typeof action.label === "number"
    ? String(action.label)
    : action.id;
}

function isActivationKey(event: React.KeyboardEvent) {
  return event.key === "Enter" || event.key === " ";
}

export { DependencyGraph };
export type {
  DiagramDirection as DependencyGraphDirection,
  DiagramPoint as DependencyGraphPoint,
  DiagramTone as DependencyGraphTone,
  PositionedDependencyGraphNode,
};
