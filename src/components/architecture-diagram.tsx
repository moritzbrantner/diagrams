"use client";

import { cn } from "@moritzbrantner/ui";
import {
  CircleUserRoundIcon,
  CloudIcon,
  DatabaseIcon,
  HardDriveIcon,
  NetworkIcon,
  RadioTowerIcon,
  ServerIcon,
} from "lucide-react";
import * as React from "react";

import {
  clampFiniteNumber,
  defaultEdgeToneClasses,
  defaultToneClasses,
  defaultSvgToneClasses,
  getAutoGridPosition,
  getOrthogonalRoute,
  getSpatialBounds,
  pointsToPath,
  type DiagramDirection,
  type DiagramPoint,
  type DiagramTone,
} from "./diagram-utils";

export type ArchitectureDiagramBoundary = {
  id: string;
  label: React.ReactNode;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  tone?: DiagramTone;
};

export type ArchitectureDiagramNodeKind =
  | "service"
  | "database"
  | "queue"
  | "cache"
  | "external"
  | "user"
  | "gateway";

export type ArchitectureDiagramNode = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  kind?: ArchitectureDiagramNodeKind;
  boundaryId?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  tone?: DiagramTone;
};

export type ArchitectureDiagramConnectionKind = "sync" | "async" | "data" | "control" | "risk";

export type ArchitectureDiagramConnection = {
  id: string;
  source: string;
  target: string;
  label?: React.ReactNode;
  protocol?: React.ReactNode;
  kind?: ArchitectureDiagramConnectionKind;
  direction?: DiagramDirection;
  points?: readonly DiagramPoint[];
};

export type ArchitectureDiagramProps = Omit<React.ComponentProps<"figure">, "children"> & {
  nodes: readonly ArchitectureDiagramNode[];
  connections?: readonly ArchitectureDiagramConnection[];
  boundaries?: readonly ArchitectureDiagramBoundary[];
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
  autoLayoutColumns?: number;
};

type PositionedArchitectureDiagramNode = ArchitectureDiagramNode &
  Required<Pick<ArchitectureDiagramNode, "x" | "y">> & {
    width: number;
    height: number;
  };

type PositionedArchitectureDiagramBoundary = ArchitectureDiagramBoundary &
  Required<Pick<ArchitectureDiagramBoundary, "x" | "y" | "width" | "height">>;

const DEFAULT_NODE_WIDTH = 188;
const DEFAULT_NODE_HEIGHT = 104;
const connectionTone: Record<ArchitectureDiagramConnectionKind, DiagramTone> = {
  sync: "accent",
  async: "success",
  data: "default",
  control: "warning",
  risk: "danger",
};
const iconByKind: Record<
  ArchitectureDiagramNodeKind,
  React.ComponentType<{ className?: string }>
> = {
  service: ServerIcon,
  database: DatabaseIcon,
  queue: RadioTowerIcon,
  cache: HardDriveIcon,
  external: CloudIcon,
  user: CircleUserRoundIcon,
  gateway: NetworkIcon,
};

function ArchitectureDiagram({
  nodes,
  connections = [],
  boundaries = [],
  ariaLabel = "Architecture diagram",
  caption,
  emptyMessage = "No architecture nodes.",
  padding = 32,
  autoLayoutColumns = 3,
  className,
  ...props
}: ArchitectureDiagramProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
  const positionedNodes = React.useMemo(
    () => positionNodes(nodes, autoLayoutColumns),
    [autoLayoutColumns, nodes],
  );
  const positionedBoundaries = React.useMemo(
    () => positionBoundaries(boundaries, positionedNodes),
    [boundaries, positionedNodes],
  );
  const nodeMap = React.useMemo(
    () => new Map(positionedNodes.map((node) => [node.id, node])),
    [positionedNodes],
  );
  const validConnections = connections.filter(
    (connection) => nodeMap.has(connection.source) && nodeMap.has(connection.target),
  );
  const routePoints = validConnections.flatMap((connection, index) =>
    connection.points?.length
      ? connection.points
      : getOrthogonalRoute(nodeMap.get(connection.source)!, nodeMap.get(connection.target)!, index),
  );
  const bounds = getSpatialBounds([...positionedBoundaries, ...positionedNodes], routePoints);
  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${
    bounds.height + padding * 2
  }`;
  const markerId = `architecture-diagram-arrow-${markerPrefix}`;

  return (
    <figure
      data-slot="architecture-diagram"
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="architecture-diagram-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus architecture diagram scroll area
        </button>
        <svg
          data-slot="architecture-diagram-svg"
          role="img"
          aria-label={ariaLabel}
          viewBox={viewBox}
          className="block min-h-80 w-full min-w-160 text-foreground"
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
              <g data-slot="architecture-diagram-boundaries">
                {positionedBoundaries.map((boundary) => (
                  <g
                    key={boundary.id}
                    data-slot="architecture-diagram-boundary"
                    data-tone={boundary.tone ?? "muted"}
                  >
                    <rect
                      x={boundary.x}
                      y={boundary.y}
                      width={boundary.width}
                      height={boundary.height}
                      rx={8}
                      strokeWidth={1.5}
                      className={defaultSvgToneClasses[boundary.tone ?? "muted"]}
                    />
                    <text
                      x={boundary.x + 14}
                      y={boundary.y + 24}
                      className="fill-muted-foreground text-xs font-medium"
                    >
                      {boundary.label}
                    </text>
                  </g>
                ))}
              </g>
              <g data-slot="architecture-diagram-connections">
                {validConnections.map((connection, index) => (
                  <ArchitectureConnectionShape
                    key={connection.id}
                    connection={connection}
                    nodes={nodeMap}
                    markerId={markerId}
                    connectionIndex={index}
                  />
                ))}
              </g>
              <g data-slot="architecture-diagram-nodes">
                {positionedNodes.map((node) => (
                  <ArchitectureNodeShape key={node.id} node={node} />
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

function ArchitectureConnectionShape({
  connection,
  nodes,
  markerId,
  connectionIndex,
}: {
  connection: ArchitectureDiagramConnection;
  nodes: Map<string, PositionedArchitectureDiagramNode>;
  markerId: string;
  connectionIndex: number;
}) {
  const source = nodes.get(connection.source);
  const target = nodes.get(connection.target);

  if (!source || !target) {
    return null;
  }

  const points = connection.points?.length
    ? connection.points
    : getOrthogonalRoute(source, target, connectionIndex);
  const direction = connection.direction ?? "forward";
  const markerUrl = `url(#${markerId})`;
  const labelPoint = points[Math.floor(points.length / 2)] ?? points[0];
  const tone = connectionTone[connection.kind ?? "sync"];

  return (
    <g data-slot="architecture-diagram-connection" data-kind={connection.kind ?? "sync"}>
      <path
        d={pointsToPath(points)}
        fill="none"
        strokeWidth={2}
        strokeDasharray={connection.kind === "async" ? "6 6" : undefined}
        className={defaultEdgeToneClasses[tone]}
        markerStart={direction === "backward" || direction === "both" ? markerUrl : undefined}
        markerEnd={direction === "forward" || direction === "both" ? markerUrl : undefined}
      />
      {(connection.label || connection.protocol) && labelPoint ? (
        <foreignObject x={labelPoint.x - 74} y={labelPoint.y - 26} width={148} height={40}>
          <div
            data-slot="architecture-diagram-connection-label"
            className="grid rounded-md border bg-background px-2 py-1 text-center text-xs text-muted-foreground shadow-sm"
          >
            {connection.label ? <span>{connection.label}</span> : null}
            {connection.protocol ? <span>{connection.protocol}</span> : null}
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

function ArchitectureNodeShape({ node }: { node: PositionedArchitectureDiagramNode }) {
  const kind = node.kind ?? "service";
  const Icon = iconByKind[kind];

  return (
    <foreignObject
      data-slot="architecture-diagram-node"
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
    >
      <div
        data-node-id={node.id}
        data-kind={kind}
        data-tone={node.tone ?? "default"}
        className={cn(
          "grid size-full content-start gap-2 rounded-md border p-3 text-sm shadow-sm",
          defaultToneClasses[node.tone ?? "default"],
        )}
      >
        <div className="flex min-w-0 items-start gap-2">
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="font-medium leading-5">{node.label}</div>
            <div className="text-xs capitalize text-muted-foreground">{kind}</div>
          </div>
        </div>
        {node.description ? (
          <div className="line-clamp-2 text-xs leading-4 text-muted-foreground">
            {node.description}
          </div>
        ) : null}
      </div>
    </foreignObject>
  );
}

function positionNodes(
  nodes: readonly ArchitectureDiagramNode[],
  columns: number,
): PositionedArchitectureDiagramNode[] {
  return nodes.map((node, index) => {
    const fallback = getAutoGridPosition(
      index,
      columns,
      { x: 96, y: 84 },
      { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
    );

    return {
      ...node,
      x: clampFiniteNumber(node.x, fallback.x),
      y: clampFiniteNumber(node.y, fallback.y),
      width: Math.max(128, clampFiniteNumber(node.width, DEFAULT_NODE_WIDTH)),
      height: Math.max(80, clampFiniteNumber(node.height, DEFAULT_NODE_HEIGHT)),
    };
  });
}

function positionBoundaries(
  boundaries: readonly ArchitectureDiagramBoundary[],
  nodes: readonly PositionedArchitectureDiagramNode[],
): PositionedArchitectureDiagramBoundary[] {
  return boundaries.map((boundary, index) => {
    const childNodes = nodes.filter((node) => node.boundaryId === boundary.id);
    const fallback = getSpatialBounds(childNodes, [], {
      x: index * 280,
      y: 0,
      width: 256,
      height: 220,
    });

    return {
      ...boundary,
      x: clampFiniteNumber(boundary.x, fallback.x - 24),
      y: clampFiniteNumber(boundary.y, fallback.y - 44),
      width: Math.max(180, clampFiniteNumber(boundary.width, fallback.width + 48)),
      height: Math.max(140, clampFiniteNumber(boundary.height, fallback.height + 68)),
    };
  });
}

export { ArchitectureDiagram };
export type {
  DiagramDirection as ArchitectureDiagramDirection,
  DiagramPoint as ArchitectureDiagramPoint,
  DiagramTone as ArchitectureDiagramTone,
  PositionedArchitectureDiagramBoundary,
  PositionedArchitectureDiagramNode,
};
