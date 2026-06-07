"use client";

import { cn } from "@moritzbrantner/ui";
import * as React from "react";

import {
  clampFiniteNumber,
  defaultEdgeToneClasses,
  defaultToneClasses,
  getOrthogonalRoute,
  getSpatialBounds,
  pointsToPath,
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
  className,
  ...props
}: DecisionTreeProps) {
  const { flatNodes, flatEdges } = React.useMemo(
    () => (root ? flattenRoot(root) : { flatNodes: [...nodes], flatEdges: [...edges] }),
    [edges, nodes, root],
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
  const routePoints = validEdges.flatMap((edge, index) =>
    getOrthogonalRoute(nodeMap.get(edge.source)!, nodeMap.get(edge.target)!, index),
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
          role="img"
          aria-label={ariaLabel}
          viewBox={viewBox}
          className="block min-h-80 w-full min-w-160 text-foreground"
        >
          {positionedNodes.length ? (
            <>
              <g data-slot="decision-tree-edges">
                {validEdges.map((edge, index) => (
                  <DecisionEdgeShape key={edge.id} edge={edge} nodes={nodeMap} edgeIndex={index} />
                ))}
              </g>
              <g data-slot="decision-tree-nodes">
                {positionedNodes.map((node) => (
                  <DecisionNodeShape key={node.id} node={node} />
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
  edgeIndex,
}: {
  edge: DecisionTreeEdge;
  nodes: Map<string, PositionedDecisionTreeNode>;
  edgeIndex: number;
}) {
  const source = nodes.get(edge.source);
  const target = nodes.get(edge.target);

  if (!source || !target) {
    return null;
  }

  const points = getOrthogonalRoute(source, target, edgeIndex);
  const labelPoint = points[Math.floor(points.length / 2)] ?? points[0];

  return (
    <g data-slot="decision-tree-edge">
      <path
        d={pointsToPath(points)}
        fill="none"
        strokeWidth={2}
        className={defaultEdgeToneClasses[edge.tone ?? "default"]}
      />
      {edge.label && labelPoint ? (
        <foreignObject x={labelPoint.x - 54} y={labelPoint.y - 20} width={108} height={30}>
          <div className="rounded-md border bg-background px-2 py-1 text-center text-xs text-muted-foreground shadow-sm">
            {edge.label}
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

export { DecisionTree };
export type { DiagramTone as DecisionTreeTone, PositionedDecisionTreeNode };
