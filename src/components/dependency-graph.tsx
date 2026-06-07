"use client";

import { cn } from "@moritzbrantner/ui";
import * as React from "react";

import {
  clampFiniteNumber,
  defaultEdgeToneClasses,
  defaultToneClasses,
  getAutoGridPosition,
  getOrthogonalRoute,
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

export type DependencyGraphNode = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  group?: React.ReactNode;
  version?: React.ReactNode;
  status?: DependencyGraphStatus;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  tone?: DiagramTone;
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

function DependencyGraph({
  nodes,
  edges = [],
  showLegend = false,
  ariaLabel = "Dependency graph",
  caption,
  emptyMessage = "No dependencies to display.",
  padding = 32,
  autoLayoutColumns = 3,
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
  const positionedNodes = React.useMemo(
    () => positionNodes(nodes, autoLayoutColumns),
    [autoLayoutColumns, nodes],
  );
  const nodeMap = React.useMemo(
    () => new Map(positionedNodes.map((node) => [node.id, node])),
    [positionedNodes],
  );
  const validEdges = edges.filter((edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target));
  const resolvedKeyboardMode = keyboardMode ?? (onNodeSelect ? "nodes" : "none");
  const nodeRefs = React.useRef(new Map<string, SVGGElement>());
  const [internalFocusedNodeId, setInternalFocusedNodeId] = React.useState<string | null>(
    () => defaultFocusedNodeId ?? null,
  );
  const enabledNodes = React.useMemo(
    () => positionedNodes.filter((node) => !getNodeDisabled?.(node)),
    [getNodeDisabled, positionedNodes],
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
  const routePoints = validEdges.flatMap((edge, index) =>
    edge.points?.length
      ? edge.points
      : getOrthogonalRoute(nodeMap.get(edge.source)!, nodeMap.get(edge.target)!, index),
  );
  const bounds = getSpatialBounds(positionedNodes, routePoints);
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

function DependencyGraphInteractiveNode({
  node,
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
  node: PositionedDependencyGraphNode;
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
  edge: DependencyGraphEdge;
  nodes: Map<string, PositionedDependencyGraphNode>;
  markerId: string;
  edgeIndex: number;
}) {
  const source = nodes.get(edge.source);
  const target = nodes.get(edge.target);

  if (!source || !target) {
    return null;
  }

  const points = edge.points?.length ? edge.points : getOrthogonalRoute(source, target, edgeIndex);
  const direction = edge.direction ?? "forward";
  const markerUrl = `url(#${markerId})`;
  const labelPoint = points[Math.floor(points.length / 2)] ?? points[0];
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

function DependencyGraphNodeShape({ node }: { node: PositionedDependencyGraphNode }) {
  const tone = node.tone ?? (node.status ? statusTone[node.status] : "default");

  return (
    <foreignObject
      data-slot="dependency-graph-node"
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
