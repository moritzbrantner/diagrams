"use client";

import * as React from "react";

import { cn } from "@moritzbrantner/ui";
import {
  getHullRoute,
  getNearestDiagramItem,
  getReactNodeAccessibleName,
  getSpatialBounds,
  isActivationKey,
  pointsToPath,
  useControlledSetState,
  type DiagramPoint,
} from "./diagram-utils";

type RelationshipMapEdgeKind = "default" | "dependency" | "blocking" | "success" | "risk";
type RelationshipMapDirection = "forward" | "backward" | "both" | "none";
type RelationshipMapTone = "default" | "accent" | "success" | "warning" | "danger" | "muted";

type RelationshipMapPoint = {
  x: number;
  y: number;
};

type RelationshipMapNode = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  group?: React.ReactNode;
  groupId?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  tone?: RelationshipMapTone;
};

type RelationshipMapEdge = {
  id: string;
  source: string;
  target: string;
  label?: React.ReactNode;
  kind?: RelationshipMapEdgeKind;
  direction?: RelationshipMapDirection;
  points?: RelationshipMapPoint[];
  waypoints?: readonly DiagramPoint[];
};

type RelationshipMapNodeAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (node: PositionedRelationshipMapNode) => void;
};

type PositionedRelationshipMapNode = RelationshipMapNode &
  Required<Pick<RelationshipMapNode, "x" | "y">> & {
    width: number;
    height: number;
  };

type RelationshipMapProps = Omit<React.ComponentProps<"figure">, "children"> & {
  nodes: readonly RelationshipMapNode[];
  edges?: readonly RelationshipMapEdge[];
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
  autoLayoutColumns?: number;
  selectedNodeId?: string | null;
  focusedNodeId?: string | null;
  defaultFocusedNodeId?: string | null;
  keyboardMode?: "nodes" | "none";
  getNodeDisabled?: (node: PositionedRelationshipMapNode) => boolean;
  renderNodeSelection?: (node: PositionedRelationshipMapNode) => React.ReactNode;
  nodeActions?:
    | readonly RelationshipMapNodeAction[]
    | ((node: PositionedRelationshipMapNode) => readonly RelationshipMapNodeAction[]);
  onNodeSelect?: (node: PositionedRelationshipMapNode) => void;
  onNodeDeselect?: () => void;
  onFocusedNodeIdChange?: (node: PositionedRelationshipMapNode | null) => void;
  onNodeActionSelect?: (
    action: RelationshipMapNodeAction,
    node: PositionedRelationshipMapNode,
  ) => void;
  collapsedGroupIds?: readonly string[];
  defaultCollapsedGroupIds?: readonly string[];
  onCollapsedGroupIdsChange?: (groupIds: string[], groupId: string, collapsed: boolean) => void;
};

type RenderRelationshipMapNode = PositionedRelationshipMapNode & {
  summary?: {
    groupId: string;
    hiddenNodes: readonly PositionedRelationshipMapNode[];
  };
};

const GROUP_SUMMARY_PREFIX = "__relationship-map-group-summary-";

const DEFAULT_NODE_WIDTH = 184;
const DEFAULT_NODE_HEIGHT = 92;
const AUTO_LAYOUT_GAP = { x: 88, y: 72 } as const;

const nodeToneClasses: Record<RelationshipMapTone, string> = {
  default: "border-border bg-background",
  accent: "border-primary/40 bg-primary/5",
  success: "border-emerald-500/40 bg-emerald-500/10",
  warning: "border-amber-500/50 bg-amber-500/10",
  danger: "border-destructive/40 bg-destructive/10",
  muted: "border-border bg-muted/60",
};

const edgeKindClasses: Record<RelationshipMapEdgeKind, string> = {
  default: "stroke-muted-foreground",
  dependency: "stroke-primary",
  blocking: "stroke-destructive",
  success: "stroke-emerald-600 dark:stroke-emerald-400",
  risk: "stroke-amber-600 dark:stroke-amber-400",
};

function RelationshipMap({
  nodes,
  edges = [],
  ariaLabel = "Relationship map",
  caption,
  emptyMessage = "No relationships to display.",
  padding = 32,
  autoLayoutColumns,
  selectedNodeId,
  focusedNodeId,
  defaultFocusedNodeId,
  keyboardMode,
  getNodeDisabled,
  renderNodeSelection,
  nodeActions,
  onNodeSelect,
  onNodeDeselect,
  onFocusedNodeIdChange,
  onNodeActionSelect,
  collapsedGroupIds,
  defaultCollapsedGroupIds,
  onCollapsedGroupIdsChange,
  className,
  ...props
}: RelationshipMapProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
  const originalPositionedNodes = React.useMemo(
    () => getPositionedNodes(nodes, autoLayoutColumns),
    [nodes, autoLayoutColumns],
  );
  const [internalCollapsedGroups, setInternalCollapsedGroups] = useControlledSetState({
    value: collapsedGroupIds,
    defaultValue: defaultCollapsedGroupIds,
  });
  const projection = React.useMemo(
    () => getRelationshipMapGroupProjection(originalPositionedNodes, internalCollapsedGroups),
    [internalCollapsedGroups, originalPositionedNodes],
  );
  const positionedNodes = React.useMemo<RenderRelationshipMapNode[]>(
    () => [
      ...originalPositionedNodes.filter((node) => !projection.hiddenNodeToProxyId.has(node.id)),
      ...projection.summaryNodes,
    ],
    [originalPositionedNodes, projection.hiddenNodeToProxyId, projection.summaryNodes],
  );
  const nodeMap = React.useMemo(
    () => new Map(positionedNodes.map((node) => [node.id, node])),
    [positionedNodes],
  );
  const validEdges = edges
    .map((edge) => ({
      ...edge,
      source: projection.hiddenNodeToProxyId.get(edge.source) ?? edge.source,
      target: projection.hiddenNodeToProxyId.get(edge.target) ?? edge.target,
    }))
    .filter((edge) => edge.source !== edge.target || nodeMap.has(edge.source))
    .filter((edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target));
  const resolvedKeyboardMode = keyboardMode ?? (onNodeSelect || nodeActions ? "nodes" : "none");
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
    (node: PositionedRelationshipMapNode) => {
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
    (event: React.KeyboardEvent<SVGGElement>, node: PositionedRelationshipMapNode) => {
      if (resolvedKeyboardMode === "none" || getNodeDisabled?.(node)) {
        return;
      }

      if (isActivationKey(event)) {
        event.preventDefault();
        onNodeSelect?.(node);
        return;
      }

      if (event.key === "Escape") {
        if (selectedNodeId != null && onNodeDeselect) {
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

      const nextNode = getNearestDiagramItem(
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
  const toggleGroup = React.useCallback(
    (groupId: string, collapsed: boolean) => {
      const nextGroupIds = collapsed
        ? Array.from(new Set([...internalCollapsedGroups, groupId]))
        : Array.from(internalCollapsedGroups).filter((id) => id !== groupId);

      setInternalCollapsedGroups(nextGroupIds);
      onCollapsedGroupIdsChange?.(nextGroupIds, groupId, collapsed);
    },
    [internalCollapsedGroups, onCollapsedGroupIdsChange, setInternalCollapsedGroups],
  );
  const routePoints = validEdges.flatMap((edge, edgeIndex) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);

    return source && target
      ? getHullRoute({
          source,
          target,
          edgeIndex,
          obstacles: positionedNodes,
          points: edge.points,
          waypoints: edge.waypoints,
          selfLoop: source.id === target.id,
        }).points
      : [];
  });
  const bounds = getSpatialBounds(positionedNodes, routePoints, {
    x: 0,
    y: 0,
    width: 640,
    height: 320,
  });
  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${
    bounds.height + padding * 2
  }`;
  const markerIds = {
    arrow: `relationship-arrow-${markerPrefix}`,
  };

  return (
    <figure
      data-slot="relationship-map"
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="relationship-map-scroll-area"
        aria-label={`${ariaLabel} scroll area`}
        className="overflow-auto"
        tabIndex={0}
      >
        <svg
          data-slot="relationship-map-svg"
          role={onNodeSelect || nodeActions ? "group" : "img"}
          aria-label={ariaLabel}
          viewBox={viewBox}
          className="block min-h-72 w-full min-w-160 text-foreground"
        >
          <defs>
            <marker
              id={markerIds.arrow}
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
          {positionedNodes.length ? (
            <>
              <g data-slot="relationship-map-edges">
                {validEdges.map((edge, edgeIndex) => (
                  <RelationshipMapEdgeShape
                    key={edge.id}
                    edge={edge}
                    nodes={nodeMap}
                    obstacles={positionedNodes}
                    markerId={markerIds.arrow}
                    edgeIndex={edgeIndex}
                  />
                ))}
              </g>
              <g data-slot="relationship-map-nodes">
                {positionedNodes.map((node) => (
                  <RelationshipMapInteractiveNode
                    key={node.id}
                    node={node}
                    selected={selectedNodeId === node.id}
                    focused={effectiveFocusedNodeId === node.id}
                    disabled={Boolean(getNodeDisabled?.(node))}
                    keyboardMode={resolvedKeyboardMode}
                    nodeActions={nodeActions}
                    renderNodeSelection={renderNodeSelection}
                    onNodeSelect={onNodeSelect}
                    onNodeFocus={handleNodeFocus}
                    onNodeKeyDown={handleNodeKeyDown}
                    onNodeActionSelect={onNodeActionSelect}
                    onToggleGroup={
                      node.summary ? () => toggleGroup(node.summary!.groupId, false) : undefined
                    }
                    setNodeRef={setNodeRef}
                  />
                ))}
              </g>
            </>
          ) : (
            <text
              data-slot="relationship-map-empty"
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
      {caption ? (
        <figcaption
          data-slot="relationship-map-caption"
          className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground"
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function RelationshipMapEdgeShape({
  edge,
  nodes,
  obstacles,
  markerId,
  edgeIndex,
}: {
  edge: RelationshipMapEdge;
  nodes: Map<string, RenderRelationshipMapNode>;
  obstacles: readonly RenderRelationshipMapNode[];
  markerId: string;
  edgeIndex: number;
}) {
  const source = nodes.get(edge.source);
  const target = nodes.get(edge.target);

  if (!source || !target) {
    return null;
  }

  const route = getHullRoute({
    source,
    target,
    edgeIndex,
    obstacles,
    points: edge.points,
    waypoints: edge.waypoints,
    selfLoop: source.id === target.id,
  });
  const points = route.points;
  const path = pointsToPath(points);
  const direction = edge.direction ?? "forward";
  const labelPoint = route.labelPoint ?? points[Math.floor(points.length / 2)] ?? points[0];
  const markerUrl = `url(#${markerId})`;

  return (
    <g data-slot="relationship-map-edge" data-kind={edge.kind ?? "default"}>
      <path
        d={path}
        fill="none"
        strokeWidth="2"
        className={cn(edgeKindClasses[edge.kind ?? "default"])}
        markerStart={direction === "backward" || direction === "both" ? markerUrl : undefined}
        markerEnd={direction === "forward" || direction === "both" ? markerUrl : undefined}
      />
      {edge.label && labelPoint ? (
        <foreignObject
          data-slot="relationship-map-edge-label"
          x={labelPoint.x - 70}
          y={labelPoint.y - 26}
          width="140"
          height="32"
        >
          <div className="inline-flex max-w-36 rounded-md border bg-background px-2 py-1 text-center text-xs text-muted-foreground shadow-sm">
            {edge.label}
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

function RelationshipMapInteractiveNode({
  node,
  selected,
  focused,
  disabled,
  keyboardMode,
  nodeActions,
  renderNodeSelection,
  onNodeSelect,
  onNodeFocus,
  onNodeKeyDown,
  onNodeActionSelect,
  onToggleGroup,
  setNodeRef,
}: {
  node: RenderRelationshipMapNode;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  keyboardMode: "nodes" | "none";
  nodeActions?: RelationshipMapProps["nodeActions"];
  renderNodeSelection?: RelationshipMapProps["renderNodeSelection"];
  onNodeSelect?: RelationshipMapProps["onNodeSelect"];
  onNodeFocus: (node: PositionedRelationshipMapNode) => void;
  onNodeKeyDown: (
    event: React.KeyboardEvent<SVGGElement>,
    node: PositionedRelationshipMapNode,
  ) => void;
  onNodeActionSelect?: RelationshipMapProps["onNodeActionSelect"];
  onToggleGroup?: () => void;
  setNodeRef: (nodeId: string, element: SVGGElement | null) => void;
}) {
  const resolvedActions =
    typeof nodeActions === "function" ? nodeActions(node) : (nodeActions ?? []);
  const accessibleName = getReactNodeAccessibleName(node.label, node.id);

  return (
    <g
      data-slot="relationship-map-node-interaction"
      data-node-id={node.id}
      data-selected={selected ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      role={onNodeSelect && !resolvedActions.length ? "button" : undefined}
      aria-label={onNodeSelect && !resolvedActions.length ? accessibleName : undefined}
      aria-pressed={onNodeSelect && !resolvedActions.length ? selected : undefined}
      aria-disabled={onNodeSelect && !resolvedActions.length ? disabled || undefined : undefined}
      tabIndex={keyboardMode === "nodes" && focused && !disabled ? 0 : -1}
      className={cn(
        "outline-none",
        onNodeSelect &&
          "cursor-pointer focus-visible:[&_[data-slot='relationship-map-node-focus']]:stroke-ring",
        disabled && "opacity-60",
      )}
      onClick={
        onNodeSelect && !disabled
          ? () => {
              onNodeSelect(node);
            }
          : undefined
      }
      onFocus={() => onNodeFocus(node)}
      onKeyDown={(event) => onNodeKeyDown(event, node)}
      ref={(element) => setNodeRef(node.id, element)}
    >
      {selected ? (
        (renderNodeSelection?.(node) ?? (
          <rect
            data-slot="relationship-map-node-focus"
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
          data-slot="relationship-map-node-focus"
          x={node.x - 6}
          y={node.y - 6}
          width={node.width + 12}
          height={node.height + 12}
          rx="12"
          className="fill-transparent stroke-ring stroke-2"
        />
      ) : null}
      <RelationshipMapNodeShape node={node} />
      {onToggleGroup ? (
        <foreignObject x={node.x + node.width - 52} y={node.y + 8} width={44} height={28}>
          <button
            type="button"
            data-slot="relationship-map-node-action"
            aria-label={`Expand ${accessibleName}`}
            className="inline-flex h-7 items-center rounded-sm border bg-background/90 px-2 text-xs font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={(event) => {
              event.stopPropagation();
              onToggleGroup();
            }}
          >
            Show
          </button>
        </foreignObject>
      ) : null}
      {resolvedActions.length ? (
        <RelationshipMapNodeActions
          actions={resolvedActions}
          node={node}
          onNodeActionSelect={onNodeActionSelect}
        />
      ) : null}
    </g>
  );
}

function RelationshipMapNodeActions({
  actions,
  node,
  onNodeActionSelect,
}: {
  actions: readonly RelationshipMapNodeAction[];
  node: PositionedRelationshipMapNode;
  onNodeActionSelect?: RelationshipMapProps["onNodeActionSelect"];
}) {
  const actionSize = 28;
  const actionGap = 4;
  const width = actions.length * actionSize + Math.max(0, actions.length - 1) * actionGap;

  return (
    <foreignObject
      data-slot="relationship-map-node-actions"
      x={node.x + node.width - width - 8}
      y={node.y + node.height - actionSize - 8}
      width={width}
      height={actionSize}
    >
      <div className="flex gap-1">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            data-slot="relationship-map-node-action"
            data-action-id={action.id}
            data-destructive={action.destructive ? "true" : undefined}
            aria-label={getReactNodeAccessibleName(action.label, action.id)}
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

function RelationshipMapNodeShape({ node }: { node: PositionedRelationshipMapNode }) {
  return (
    <foreignObject
      data-slot="relationship-map-node"
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
    >
      <div
        data-node-id={node.id}
        data-tone={node.tone ?? "default"}
        className={cn(
          "grid size-full content-start gap-1 rounded-md border p-3 text-sm shadow-sm",
          nodeToneClasses[node.tone ?? "default"],
        )}
      >
        {node.group ? (
          <div data-slot="relationship-map-node-group" className="text-xs text-muted-foreground">
            {node.group}
          </div>
        ) : null}
        <div data-slot="relationship-map-node-label" className="font-medium leading-5">
          {node.label}
        </div>
        {node.description ? (
          <div
            data-slot="relationship-map-node-description"
            className="line-clamp-2 text-xs leading-4 text-muted-foreground"
          >
            {node.description}
          </div>
        ) : null}
      </div>
    </foreignObject>
  );
}

function getPositionedNodes(
  nodes: readonly RelationshipMapNode[],
  autoLayoutColumns = Math.ceil(Math.sqrt(nodes.length || 1)),
) {
  const seen = new Set<string>();

  return nodes.reduce<PositionedRelationshipMapNode[]>((positioned, node, index) => {
    if (seen.has(node.id)) {
      return positioned;
    }

    seen.add(node.id);
    const width = node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.height ?? DEFAULT_NODE_HEIGHT;
    const column = index % autoLayoutColumns;
    const row = Math.floor(index / autoLayoutColumns);

    positioned.push({
      ...node,
      width,
      height,
      x: node.x ?? column * (DEFAULT_NODE_WIDTH + AUTO_LAYOUT_GAP.x),
      y: node.y ?? row * (DEFAULT_NODE_HEIGHT + AUTO_LAYOUT_GAP.y),
    });

    return positioned;
  }, []);
}

function getBounds(
  nodes: readonly PositionedRelationshipMapNode[],
  edges: readonly RelationshipMapEdge[],
) {
  if (!nodes.length) {
    return { x: 0, y: 0, width: 640, height: 320 };
  }

  const nodePoints = nodes.flatMap((node) => [
    { x: node.x, y: node.y },
    { x: node.x + node.width, y: node.y + node.height },
  ]);
  const edgePoints = edges.flatMap((edge) => edge.points ?? []);
  const points = [...nodePoints, ...edgePoints];
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: Math.max(320, maxX - minX),
    height: Math.max(220, maxY - minY),
  };
}

function getRelationshipMapGroupProjection(
  nodes: readonly PositionedRelationshipMapNode[],
  collapsedGroupIds: ReadonlySet<string>,
) {
  const hiddenNodeToProxyId = new Map<string, string>();
  const summaryNodes: RenderRelationshipMapNode[] = [];
  const groups = new Map<string, PositionedRelationshipMapNode[]>();

  for (const node of nodes) {
    const groupId = getRelationshipMapNodeGroupId(node);

    if (groupId) {
      groups.set(groupId, [...(groups.get(groupId) ?? []), node]);
    }
  }

  for (const [groupId, groupNodes] of groups) {
    if (!collapsedGroupIds.has(groupId) || !groupNodes.length) {
      continue;
    }

    const bounds = getSpatialBounds(groupNodes);
    const width = Math.max(150, Math.min(220, bounds.width));
    const height = 82;
    const label = groupNodes[0]?.group ?? groupId;
    const summaryNode: RenderRelationshipMapNode = {
      id: `${GROUP_SUMMARY_PREFIX}${groupId}`,
      label,
      description: `${groupNodes.length} ${groupNodes.length === 1 ? "node" : "nodes"}`,
      group: "Collapsed group",
      groupId,
      tone: "muted",
      width,
      height,
      x: bounds.x + bounds.width / 2 - width / 2,
      y: bounds.y + bounds.height / 2 - height / 2,
      summary: { groupId, hiddenNodes: groupNodes },
    };

    summaryNodes.push(summaryNode);

    for (const node of groupNodes) {
      hiddenNodeToProxyId.set(node.id, summaryNode.id);
    }
  }

  return { hiddenNodeToProxyId, summaryNodes };
}

function getRelationshipMapNodeGroupId(node: RelationshipMapNode) {
  if (node.groupId) {
    return node.groupId;
  }

  return typeof node.group === "string" || typeof node.group === "number"
    ? String(node.group)
    : undefined;
}

export { RelationshipMap };
export type {
  RelationshipMapProps,
  RelationshipMapNode,
  RelationshipMapEdge,
  RelationshipMapEdgeKind,
  RelationshipMapDirection,
  RelationshipMapNodeAction,
  RelationshipMapPoint,
  RelationshipMapTone,
  PositionedRelationshipMapNode,
};
