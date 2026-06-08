"use client";

import { cn } from "@moritzbrantner/ui";
import * as React from "react";

import {
  clampFiniteNumber,
  DiagramSvgItemInteraction,
  type DiagramItemAction,
  defaultEdgeToneClasses,
  defaultToneClasses,
  getHullRoute,
  getNearestDiagramItem,
  getReactNodeAccessibleName,
  getSpatialBounds,
  isActivationKey,
  pointsToPath,
  useControlledSetState,
  type DiagramTone,
} from "./diagram-utils";

export type DecisionTreeNodeKind = "decision" | "outcome" | "action";

export type DecisionTreeNode = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  kind?: DecisionTreeNodeKind;
  tone?: DiagramTone;
  children?: readonly DecisionTreeBranch[];
};

export type DecisionTreeBranch = {
  id: string;
  label?: React.ReactNode;
  target?: DecisionTreeNode;
  tone?: DiagramTone;
};

export type DecisionTreeFlatNode = Omit<DecisionTreeNode, "children"> & {
  x?: number;
  y?: number;
};

export type DecisionTreeEdge = {
  id: string;
  source: string;
  target: string;
  label?: React.ReactNode;
  tone?: DiagramTone;
};

export type DecisionTreeNodeAction = DiagramItemAction<PositionedDecisionTreeNode>;

export type DecisionTreeBranchAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (edge: DecisionTreeEdge) => void;
};

export type DecisionTreeLayout = "tree" | "manual";

export type DecisionTreeProps = Omit<React.ComponentProps<"figure">, "children"> & {
  root?: DecisionTreeNode;
  nodes?: readonly DecisionTreeFlatNode[];
  edges?: readonly DecisionTreeEdge[];
  layout?: DecisionTreeLayout;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
  autoLayoutColumns?: number;
  selectedNodeId?: string | null;
  focusedNodeId?: string | null;
  defaultFocusedNodeId?: string | null;
  keyboardMode?: "tree" | "nodes" | "none";
  getNodeDisabled?: (node: PositionedDecisionTreeNode) => boolean;
  renderNodeSelection?: (node: PositionedDecisionTreeNode) => React.ReactNode;
  nodeActions?:
    | readonly DecisionTreeNodeAction[]
    | ((node: PositionedDecisionTreeNode) => readonly DecisionTreeNodeAction[]);
  onNodeSelect?: (node: PositionedDecisionTreeNode) => void;
  onNodeDeselect?: () => void;
  onFocusedNodeIdChange?: (node: PositionedDecisionTreeNode | null) => void;
  onNodeActionSelect?: (action: DecisionTreeNodeAction, node: PositionedDecisionTreeNode) => void;
  expandedNodeIds?: readonly string[];
  defaultExpandedNodeIds?: readonly string[];
  onExpandedNodeIdsChange?: (
    nodeIds: string[],
    node: PositionedDecisionTreeNode,
    expanded: boolean,
  ) => void;
  branchActions?:
    | readonly DecisionTreeBranchAction[]
    | ((edge: DecisionTreeEdge) => readonly DecisionTreeBranchAction[]);
  onBranchSelect?: (edge: DecisionTreeEdge) => void;
};

type PositionedDecisionTreeNode = DecisionTreeFlatNode & {
  x: number;
  y: number;
  width: number;
  height: number;
};

const NODE_WIDTH = 188;
const NODE_HEIGHT = 88;
const LEVEL_GAP = 128;
const SIBLING_GAP = 72;

function DecisionTree({
  root,
  nodes = [],
  edges = [],
  layout = "tree",
  ariaLabel = "Decision tree",
  caption,
  emptyMessage = "No decisions to display.",
  padding = 32,
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
  expandedNodeIds,
  defaultExpandedNodeIds,
  onExpandedNodeIdsChange,
  branchActions,
  onBranchSelect,
  className,
  ...props
}: DecisionTreeProps) {
  const { flatNodes: allFlatNodes, flatEdges: allFlatEdges } = React.useMemo(
    () => (root ? flattenRoot(root) : { flatNodes: [...nodes], flatEdges: [...edges] }),
    [edges, nodes, root],
  );
  const allNodeIds = React.useMemo(() => allFlatNodes.map((node) => node.id), [allFlatNodes]);
  const [internalExpandedNodeIds, setInternalExpandedNodeIds] = useControlledSetState({
    value: expandedNodeIds,
    defaultValue: defaultExpandedNodeIds ?? allNodeIds,
  });
  const { flatNodes, flatEdges } = React.useMemo(
    () => filterExpandedDecisionTree(allFlatNodes, allFlatEdges, internalExpandedNodeIds),
    [allFlatEdges, allFlatNodes, internalExpandedNodeIds],
  );
  const positionedNodes = React.useMemo(
    () => positionNodes(flatNodes, flatEdges, layout),
    [flatEdges, flatNodes, layout],
  );
  const nodeMap = React.useMemo(
    () => new Map(positionedNodes.map((node) => [node.id, node])),
    [positionedNodes],
  );
  const validEdges = flatEdges.filter(
    (edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target),
  );
  const resolvedKeyboardMode =
    keyboardMode ?? (onNodeSelect || nodeActions || onExpandedNodeIdsChange ? "tree" : "none");
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
    resolvedKeyboardMode !== "none"
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
    (nodeId: string | null) => {
      const nextNode = nodeId ? (nodeMap.get(nodeId) ?? null) : null;

      if (focusedNodeId === undefined) {
        setInternalFocusedNodeId(nodeId);
      }

      onFocusedNodeIdChange?.(nextNode);

      if (nodeId) {
        queueMicrotask(() => nodeRefs.current.get(nodeId)?.focus());
      }
    },
    [focusedNodeId, nodeMap, onFocusedNodeIdChange],
  );
  const toggleExpanded = React.useCallback(
    (node: PositionedDecisionTreeNode, expanded: boolean) => {
      const nextNodeIds = expanded
        ? Array.from(new Set([...internalExpandedNodeIds, node.id]))
        : Array.from(internalExpandedNodeIds).filter((id) => id !== node.id);

      setInternalExpandedNodeIds(nextNodeIds);
      onExpandedNodeIdsChange?.(nextNodeIds, node, expanded);
    },
    [internalExpandedNodeIds, onExpandedNodeIdsChange, setInternalExpandedNodeIds],
  );
  const handleNodeFocus = React.useCallback(
    (node: PositionedDecisionTreeNode) => {
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
    (event: React.KeyboardEvent<SVGGElement>, node: PositionedDecisionTreeNode) => {
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

      if (resolvedKeyboardMode === "tree") {
        const childEdge = validEdges.find((edge) => edge.source === node.id);
        const parentEdge = validEdges.find((edge) => edge.target === node.id);

        if (event.key === "ArrowRight" && childEdge) {
          event.preventDefault();
          focusNodeById(childEdge.target);
          return;
        }

        if (event.key === "ArrowLeft" && parentEdge) {
          event.preventDefault();
          focusNodeById(parentEdge.source);
          return;
        }
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
      validEdges,
    ],
  );
  const routePoints = validEdges.flatMap(
    (edge, index) =>
      getHullRoute({
        source: nodeMap.get(edge.source)!,
        target: nodeMap.get(edge.target)!,
        edgeIndex: index,
        obstacles: positionedNodes,
      }).points,
  );
  const bounds = getSpatialBounds(positionedNodes, routePoints);
  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${
    bounds.height + padding * 2
  }`;

  return (
    <figure
      data-slot="decision-tree"
      data-layout={layout}
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="decision-tree-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus decision tree scroll area
        </button>
        <svg
          data-slot="decision-tree-svg"
          role={onNodeSelect || nodeActions || onBranchSelect ? "group" : "img"}
          aria-label={ariaLabel}
          viewBox={viewBox}
          className="block min-h-80 w-full min-w-160 text-foreground"
        >
          {positionedNodes.length ? (
            <>
              <g data-slot="decision-tree-edges">
                {validEdges.map((edge, index) => (
                  <DecisionEdgeShape
                    key={edge.id}
                    edge={edge}
                    nodes={nodeMap}
                    obstacles={positionedNodes}
                    edgeIndex={index}
                    branchActions={branchActions}
                    onBranchSelect={onBranchSelect}
                  />
                ))}
              </g>
              <g data-slot="decision-tree-nodes">
                {positionedNodes.map((node) => (
                  <DiagramSvgItemInteraction
                    key={node.id}
                    item={node}
                    slot="decision-tree-node"
                    selected={selectedNodeId === node.id}
                    focused={effectiveFocusedNodeId === node.id}
                    disabled={Boolean(getNodeDisabled?.(node))}
                    keyboardMode={resolvedKeyboardMode === "none" ? "none" : "nodes"}
                    actions={
                      typeof nodeActions === "function" ? nodeActions(node) : (nodeActions ?? [])
                    }
                    renderSelection={renderNodeSelection}
                    onSelect={onNodeSelect}
                    onFocus={handleNodeFocus}
                    onKeyDown={handleNodeKeyDown}
                    onActionSelect={onNodeActionSelect}
                    setItemRef={setNodeRef}
                  >
                    <DecisionNodeShape node={node} />
                    {onExpandedNodeIdsChange || expandedNodeIds || defaultExpandedNodeIds ? (
                      allFlatEdges.some((edge) => edge.source === node.id) ? (
                        <foreignObject
                          x={node.x + node.width - 64}
                          y={node.y + 8}
                          width={56}
                          height={28}
                        >
                          <button
                            type="button"
                            data-slot="decision-tree-node-action"
                            aria-label={`${internalExpandedNodeIds.has(node.id) ? "Collapse" : "Expand"} ${getReactNodeAccessibleName(node.label, node.id)}`}
                            className="inline-flex h-7 items-center rounded-sm border bg-background/90 px-2 text-xs font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpanded(node, !internalExpandedNodeIds.has(node.id));
                            }}
                          >
                            {internalExpandedNodeIds.has(node.id) ? "Hide" : "Show"}
                          </button>
                        </foreignObject>
                      ) : null
                    ) : null}
                  </DiagramSvgItemInteraction>
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
      {caption ? (
        <figcaption className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function DecisionEdgeShape({
  edge,
  nodes,
  obstacles,
  edgeIndex,
  branchActions,
  onBranchSelect,
}: {
  edge: DecisionTreeEdge;
  nodes: Map<string, PositionedDecisionTreeNode>;
  obstacles: readonly PositionedDecisionTreeNode[];
  edgeIndex: number;
  branchActions?: DecisionTreeProps["branchActions"];
  onBranchSelect?: DecisionTreeProps["onBranchSelect"];
}) {
  const source = nodes.get(edge.source);
  const target = nodes.get(edge.target);

  if (!source || !target) {
    return null;
  }

  const route = getHullRoute({ source, target, edgeIndex, obstacles });
  const points = route.points;
  const labelPoint = route.labelPoint ?? points[Math.floor(points.length / 2)] ?? points[0];
  const resolvedActions =
    typeof branchActions === "function" ? branchActions(edge) : (branchActions ?? []);

  return (
    <g
      data-slot="decision-tree-edge"
      role={onBranchSelect ? "button" : undefined}
      aria-label={onBranchSelect ? getReactNodeAccessibleName(edge.label, edge.id) : undefined}
      tabIndex={onBranchSelect ? 0 : undefined}
      className={onBranchSelect ? "cursor-pointer outline-none" : undefined}
      onClick={onBranchSelect ? () => onBranchSelect(edge) : undefined}
      onKeyDown={
        onBranchSelect
          ? (event) => {
              if (isActivationKey(event)) {
                event.preventDefault();
                onBranchSelect(edge);
              }
            }
          : undefined
      }
    >
      <path
        d={pointsToPath(points)}
        fill="none"
        strokeWidth={2}
        className={defaultEdgeToneClasses[edge.tone ?? "default"]}
      />
      {edge.label && labelPoint ? (
        <foreignObject x={labelPoint.x - 54} y={labelPoint.y - 20} width={108} height={30}>
          <div className="flex items-center justify-center gap-1 rounded-md border bg-background px-2 py-1 text-center text-xs text-muted-foreground shadow-sm">
            {edge.label}
            {resolvedActions.map((action) => (
              <button
                key={action.id}
                type="button"
                data-slot="decision-tree-branch-action"
                aria-label={getReactNodeAccessibleName(action.label, action.id)}
                disabled={action.disabled}
                className="inline-flex size-5 items-center justify-center rounded-sm border bg-background text-[10px] text-foreground disabled:opacity-50"
                onClick={(event) => {
                  event.stopPropagation();
                  action.onSelect?.(edge);
                  onBranchSelect?.(edge);
                }}
              >
                {action.icon ?? action.label}
              </button>
            ))}
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

function DecisionNodeShape({ node }: { node: PositionedDecisionTreeNode }) {
  const tone =
    node.tone ??
    (node.kind === "outcome" ? "success" : node.kind === "action" ? "accent" : "default");

  return (
    <foreignObject
      data-slot="decision-tree-node"
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
    >
      <div
        data-node-id={node.id}
        data-kind={node.kind ?? "decision"}
        data-tone={tone}
        className={cn(
          "grid size-full content-center gap-1 rounded-md border p-3 text-center text-sm shadow-sm",
          defaultToneClasses[tone],
        )}
      >
        <div className="font-medium leading-5">{node.label}</div>
        {node.description ? (
          <div className="line-clamp-2 text-xs leading-4 text-muted-foreground">
            {node.description}
          </div>
        ) : null}
      </div>
    </foreignObject>
  );
}

function flattenRoot(root: DecisionTreeNode) {
  const flatNodes: DecisionTreeFlatNode[] = [];
  const flatEdges: DecisionTreeEdge[] = [];

  function visit(node: DecisionTreeNode) {
    flatNodes.push({
      id: node.id,
      label: node.label,
      description: node.description,
      kind: node.kind,
      tone: node.tone,
    });

    for (const branch of node.children ?? []) {
      if (!branch.target) {
        continue;
      }

      flatEdges.push({
        id: branch.id,
        source: node.id,
        target: branch.target.id,
        label: branch.label,
        tone: branch.tone,
      });
      visit(branch.target);
    }
  }

  visit(root);
  return { flatNodes, flatEdges };
}

function positionNodes(
  nodes: readonly DecisionTreeFlatNode[],
  edges: readonly DecisionTreeEdge[],
  layout: DecisionTreeLayout,
): PositionedDecisionTreeNode[] {
  if (layout === "manual") {
    return nodes.map((node, index) => ({
      ...node,
      x: clampFiniteNumber(node.x, (index % 3) * (NODE_WIDTH + SIBLING_GAP)),
      y: clampFiniteNumber(node.y, Math.floor(index / 3) * (NODE_HEIGHT + LEVEL_GAP)),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    }));
  }

  const levels = new Map<string, number>();
  const targets = new Set(edges.map((edge) => edge.target));
  const roots = nodes.filter((node) => !targets.has(node.id));
  const queue = roots.length
    ? roots.map((node) => ({ id: node.id, level: 0 }))
    : nodes.slice(0, 1).map((node) => ({ id: node.id, level: 0 }));

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];

    if (levels.has(item.id)) {
      continue;
    }

    levels.set(item.id, item.level);
    for (const edge of edges.filter((candidate) => candidate.source === item.id)) {
      queue.push({ id: edge.target, level: item.level + 1 });
    }
  }

  const levelCounts = new Map<number, number>();

  return nodes.map((node) => {
    const level = levels.get(node.id) ?? 0;
    const slot = levelCounts.get(level) ?? 0;
    levelCounts.set(level, slot + 1);

    return {
      ...node,
      x: slot * (NODE_WIDTH + SIBLING_GAP),
      y: level * (NODE_HEIGHT + LEVEL_GAP),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
  });
}

function filterExpandedDecisionTree(
  nodes: readonly DecisionTreeFlatNode[],
  edges: readonly DecisionTreeEdge[],
  expandedNodeIds: ReadonlySet<string>,
) {
  const targets = new Set(edges.map((edge) => edge.target));
  const roots = nodes.filter((node) => !targets.has(node.id));
  const visibleNodeIds = new Set<string>();
  const queue = roots.length
    ? roots.map((node) => node.id)
    : nodes.slice(0, 1).map((node) => node.id);

  while (queue.length) {
    const nodeId = queue.shift()!;
    if (visibleNodeIds.has(nodeId)) {
      continue;
    }

    visibleNodeIds.add(nodeId);

    if (!expandedNodeIds.has(nodeId)) {
      continue;
    }

    for (const edge of edges) {
      if (edge.source === nodeId) {
        queue.push(edge.target);
      }
    }
  }

  return {
    flatNodes: nodes.filter((node) => visibleNodeIds.has(node.id)),
    flatEdges: edges.filter(
      (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
    ),
  };
}

export { DecisionTree };
export type { DiagramTone as DecisionTreeTone, PositionedDecisionTreeNode };
