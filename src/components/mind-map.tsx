"use client";

import * as React from "react";

import { cn } from "../internal/cn";

import {
  clampFiniteNumber,
  DiagramSvgItemInteraction,
  getDiagramCanvasStyle,
  type DiagramItemAction,
  defaultEdgeToneClasses,
  defaultToneClasses,
  getBoundaryPoint,
  getNearestDiagramItem,
  getReactNodeAccessibleName,
  getSpatialBounds,
  isActivationKey,
  type DiagramTone,
  useControlledSetState,
  useDiagramCanvasInteractions,
} from "./diagram-utils";

export type MindMapNode = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  tone?: DiagramTone;
  children?: readonly MindMapNode[];
};

export type MindMapFlatNode = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  parentId?: string;
  x?: number;
  y?: number;
  tone?: DiagramTone;
};

export type MindMapLayout = "radial" | "tree";

export type MindMapNodeAction = DiagramItemAction<PositionedMindMapNode>;

export type MindMapProps = Omit<React.ComponentProps<"figure">, "children"> & {
  root?: MindMapNode;
  nodes?: readonly MindMapFlatNode[];
  layout?: MindMapLayout;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
  selectedNodeId?: string | null;
  focusedNodeId?: string | null;
  defaultFocusedNodeId?: string | null;
  keyboardMode?: "nodes" | "none";
  getNodeDisabled?: (node: PositionedMindMapNode) => boolean;
  renderNodeSelection?: (node: PositionedMindMapNode) => React.ReactNode;
  nodeActions?:
    | readonly MindMapNodeAction[]
    | ((node: PositionedMindMapNode) => readonly MindMapNodeAction[]);
  onNodeSelect?: (node: PositionedMindMapNode) => void;
  onNodeDeselect?: () => void;
  onFocusedNodeIdChange?: (node: PositionedMindMapNode | null) => void;
  onNodeActionSelect?: (action: MindMapNodeAction, node: PositionedMindMapNode) => void;
  expandedNodeIds?: readonly string[];
  defaultExpandedNodeIds?: readonly string[];
  onExpandedNodeIdsChange?: (
    nodeIds: string[],
    node: PositionedMindMapNode,
    expanded: boolean,
  ) => void;
};

type PositionedMindMapNode = MindMapFlatNode & {
  x: number;
  y: number;
  width: number;
  height: number;
};

const NODE_WIDTH = 176;
const NODE_HEIGHT = 76;

function MindMap({
  root,
  nodes = [],
  layout = "radial",
  ariaLabel = "Mind map",
  caption,
  emptyMessage = "No mind map nodes.",
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
  className,
  ...props
}: MindMapProps) {
  const allFlatNodes = React.useMemo(() => (root ? flattenRoot(root) : [...nodes]), [nodes, root]);
  const allNodeIds = React.useMemo(() => allFlatNodes.map((node) => node.id), [allFlatNodes]);
  const [internalExpandedNodeIds, setInternalExpandedNodeIds] = useControlledSetState({
    value: expandedNodeIds,
    defaultValue: defaultExpandedNodeIds ?? allNodeIds,
  });
  const flatNodes = React.useMemo(
    () => filterExpandedMindMapNodes(allFlatNodes, internalExpandedNodeIds),
    [allFlatNodes, internalExpandedNodeIds],
  );
  const positionedNodes = React.useMemo(
    () => positionNodes(flatNodes, layout),
    [flatNodes, layout],
  );
  const nodeMap = React.useMemo(
    () => new Map(positionedNodes.map((node) => [node.id, node])),
    [positionedNodes],
  );
  const edges = positionedNodes
    .filter((node) => node.parentId && nodeMap.has(node.parentId))
    .map((node) => ({ source: nodeMap.get(node.parentId!)!, target: node }));
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
  const handleNodeFocus = React.useCallback(
    (node: PositionedMindMapNode) => {
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
    (event: React.KeyboardEvent<SVGGElement>, node: PositionedMindMapNode) => {
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
  const toggleExpanded = React.useCallback(
    (node: PositionedMindMapNode, expanded: boolean) => {
      const nextNodeIds = expanded
        ? Array.from(new Set([...internalExpandedNodeIds, node.id]))
        : Array.from(internalExpandedNodeIds).filter((id) => id !== node.id);

      setInternalExpandedNodeIds(nextNodeIds);
      onExpandedNodeIdsChange?.(nextNodeIds, node, expanded);
    },
    [internalExpandedNodeIds, onExpandedNodeIdsChange, setInternalExpandedNodeIds],
  );
  const bounds = getSpatialBounds(positionedNodes);
  const canvasStyle = getDiagramCanvasStyle(bounds, {
    minHeight: 320,
    minWidth: 640,
    padding,
  });
  const {
    overlay: interactionOverlay,
    setScrollAreaElement: setInteractionScrollAreaElement,
    svgProps: interactionSvgProps,
    viewBox: interactionViewBox,
  } = useDiagramCanvasInteractions({
    interactiveFeatures: { viewport: true },
    contentBounds: bounds,
    nodes: positionedNodes.map((node) => ({
      id: node.id,
      item: node,
      label: node.label,
      bounds: { x: node.x, y: node.y, width: node.width, height: node.height },
    })),
    edges: edges.map(({ source, target }) => ({
      id: `${source.id}-${target.id}`,
      item: { source, target },
      sourceId: source.id,
      targetId: target.id,
    })),
    padding,
  });

  return (
    <figure
      data-slot="mind-map"
      data-layout={layout}
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        ref={setInteractionScrollAreaElement}
        data-slot="mind-map-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="relative overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus mind map scroll area
        </button>
        <svg
          data-slot="mind-map-svg"
          role={onNodeSelect || nodeActions ? "group" : "img"}
          aria-label={ariaLabel}
          viewBox={interactionViewBox}
          style={canvasStyle}
          className="block min-h-80 w-full min-w-160 text-foreground"
          {...interactionSvgProps}
        >
          {positionedNodes.length ? (
            <>
              <g data-slot="mind-map-edges">
                {edges.map((edge) => (
                  <MindMapEdgeShape key={`${edge.source.id}-${edge.target.id}`} edge={edge} />
                ))}
              </g>
              <g data-slot="mind-map-nodes">
                {positionedNodes.map((node) => (
                  <DiagramSvgItemInteraction
                    key={node.id}
                    item={node}
                    slot="mind-map-node"
                    selected={selectedNodeId === node.id}
                    focused={effectiveFocusedNodeId === node.id}
                    disabled={Boolean(getNodeDisabled?.(node))}
                    keyboardMode={resolvedKeyboardMode}
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
                    <MindMapNodeShape node={node} />
                    {onExpandedNodeIdsChange || expandedNodeIds || defaultExpandedNodeIds ? (
                      allFlatNodes.some((item) => item.parentId === node.id) ? (
                        <foreignObject
                          x={node.x + node.width - 64}
                          y={node.y + 8}
                          width={56}
                          height={28}
                        >
                          <button
                            type="button"
                            data-slot="mind-map-node-action"
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
        {interactionOverlay}
      </div>
      {caption ? (
        <figcaption className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function MindMapEdgeShape({
  edge,
}: {
  edge: { source: PositionedMindMapNode; target: PositionedMindMapNode };
}) {
  const sourceCenter = {
    x: edge.source.x + edge.source.width / 2,
    y: edge.source.y + edge.source.height / 2,
  };
  const targetCenter = {
    x: edge.target.x + edge.target.width / 2,
    y: edge.target.y + edge.target.height / 2,
  };
  const source = getBoundaryPoint(edge.source, targetCenter);
  const target = getBoundaryPoint(edge.target, sourceCenter);

  return (
    <path
      data-slot="mind-map-edge"
      d={`M ${source.x} ${source.y} C ${(source.x + target.x) / 2} ${source.y}, ${(source.x + target.x) / 2} ${target.y}, ${target.x} ${target.y}`}
      fill="none"
      strokeWidth={2}
      className={defaultEdgeToneClasses.muted}
    />
  );
}

function MindMapNodeShape({ node }: { node: PositionedMindMapNode }) {
  return (
    <foreignObject
      data-slot="mind-map-node"
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
    >
      <div
        data-node-id={node.id}
        data-tone={node.tone ?? "default"}
        className={cn(
          "grid size-full content-center gap-1 rounded-md border p-3 text-center text-sm shadow-sm",
          defaultToneClasses[node.tone ?? "default"],
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

function flattenRoot(root: MindMapNode) {
  const flatNodes: MindMapFlatNode[] = [];

  function visit(node: MindMapNode, parentId?: string) {
    flatNodes.push({
      id: node.id,
      label: node.label,
      description: node.description,
      parentId,
      tone: node.tone,
    });

    for (const child of node.children ?? []) {
      visit(child, node.id);
    }
  }

  visit(root);
  return flatNodes;
}

function positionNodes(
  nodes: readonly MindMapFlatNode[],
  layout: MindMapLayout,
): PositionedMindMapNode[] {
  if (layout === "tree") {
    const levelCounts = new Map<number, number>();
    const levels = new Map<string, number>();

    for (const node of nodes) {
      levels.set(node.id, node.parentId ? (levels.get(node.parentId) ?? 0) + 1 : 0);
    }

    return nodes.map((node) => {
      const level = levels.get(node.id) ?? 0;
      const slot = levelCounts.get(level) ?? 0;
      levelCounts.set(level, slot + 1);

      return {
        ...node,
        x: clampFiniteNumber(node.x, level * 248),
        y: clampFiniteNumber(node.y, slot * 116),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      };
    });
  }

  const center = { x: 320, y: 220 };
  const rootNode = nodes.find((node) => !node.parentId) ?? nodes[0];
  const children = nodes.filter((node) => node.id !== rootNode?.id);

  return nodes.map((node, index) => {
    if (node.id === rootNode?.id) {
      return {
        ...node,
        x: clampFiniteNumber(node.x, center.x - NODE_WIDTH / 2),
        y: clampFiniteNumber(node.y, center.y - NODE_HEIGHT / 2),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      };
    }

    const childIndex = Math.max(
      0,
      children.findIndex((child) => child.id === node.id),
    );
    const angle = (childIndex / Math.max(1, children.length)) * Math.PI * 2 - Math.PI / 2;
    const radius = 220 + Math.floor(index / 8) * 72;

    return {
      ...node,
      x: clampFiniteNumber(node.x, center.x + Math.cos(angle) * radius - NODE_WIDTH / 2),
      y: clampFiniteNumber(node.y, center.y + Math.sin(angle) * radius - NODE_HEIGHT / 2),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
  });
}

function filterExpandedMindMapNodes(
  nodes: readonly MindMapFlatNode[],
  expandedNodeIds: ReadonlySet<string>,
) {
  const rootNode = nodes.find((node) => !node.parentId) ?? nodes[0];

  if (!rootNode) {
    return [];
  }

  const visibleNodeIds = new Set<string>();
  const queue = [rootNode.id];

  while (queue.length) {
    const nodeId = queue.shift()!;
    if (visibleNodeIds.has(nodeId)) {
      continue;
    }

    visibleNodeIds.add(nodeId);

    if (!expandedNodeIds.has(nodeId)) {
      continue;
    }

    for (const child of nodes.filter((node) => node.parentId === nodeId)) {
      queue.push(child.id);
    }
  }

  return nodes.filter((node) => visibleNodeIds.has(node.id));
}

export { MindMap };
export type { DiagramTone as MindMapTone, PositionedMindMapNode };
