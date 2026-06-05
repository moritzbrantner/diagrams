"use client";

import * as React from "react";

import { cn } from "../lib/cn";

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
          role="img"
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
                  <DependencyGraphNodeShape key={node.id} node={node} />
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

export { DependencyGraph };
export type {
  DiagramDirection as DependencyGraphDirection,
  DiagramPoint as DependencyGraphPoint,
  DiagramTone as DependencyGraphTone,
  PositionedDependencyGraphNode,
};
