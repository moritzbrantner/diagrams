"use client";

import * as React from "react";

import { cn } from "@moritzbrantner/ui";

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
};

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
  className,
  ...props
}: RelationshipMapProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
  const positionedNodes = React.useMemo(
    () => getPositionedNodes(nodes, autoLayoutColumns),
    [nodes, autoLayoutColumns],
  );
  const nodeMap = React.useMemo(
    () => new Map(positionedNodes.map((node) => [node.id, node])),
    [positionedNodes],
  );
  const validEdges = edges.filter((edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target));
  const bounds = getBounds(positionedNodes, validEdges);
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
          role="img"
          aria-label={ariaLabel}
          viewBox={viewBox}
          className="block min-h-72 w-full min-w-160 text-foreground"
        >
          <defs>
            <marker
              id={markerIds.arrow}
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
              <g data-slot="relationship-map-edges">
                {validEdges.map((edge, edgeIndex) => (
                  <RelationshipMapEdgeShape
                    key={edge.id}
                    edge={edge}
                    nodes={nodeMap}
                    markerId={markerIds.arrow}
                    edgeIndex={edgeIndex}
                  />
                ))}
              </g>
              <g data-slot="relationship-map-nodes">
                {positionedNodes.map((node) => (
                  <RelationshipMapNodeShape key={node.id} node={node} />
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
  markerId,
  edgeIndex,
}: {
  edge: RelationshipMapEdge;
  nodes: Map<string, PositionedRelationshipMapNode>;
  markerId: string;
  edgeIndex: number;
}) {
  const source = nodes.get(edge.source);
  const target = nodes.get(edge.target);

  if (!source || !target) {
    return null;
  }

  const points = edge.points?.length ? edge.points : getRoutePoints(source, target, edgeIndex);
  const path = pointsToPath(points);
  const direction = edge.direction ?? "forward";
  const labelPoint = points[Math.floor(points.length / 2)] ?? points[0];
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

function getRoutePoints(
  source: PositionedRelationshipMapNode,
  target: PositionedRelationshipMapNode,
  edgeIndex: number,
) {
  const sourcePoint = {
    x: source.x + source.width,
    y: source.y + source.height / 2,
  };
  const targetPoint = { x: target.x, y: target.y + target.height / 2 };
  const offset = (edgeIndex % 3) * 12;
  const midX = (sourcePoint.x + targetPoint.x) / 2 + offset;

  return [sourcePoint, { x: midX, y: sourcePoint.y }, { x: midX, y: targetPoint.y }, targetPoint];
}

function pointsToPath(points: readonly RelationshipMapPoint[]) {
  const [first, ...rest] = points;

  if (!first) {
    return "";
  }

  return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(" ")}`;
}

export { RelationshipMap };
export type {
  RelationshipMapProps,
  RelationshipMapNode,
  RelationshipMapEdge,
  RelationshipMapEdgeKind,
  RelationshipMapDirection,
  RelationshipMapPoint,
  RelationshipMapTone,
};
