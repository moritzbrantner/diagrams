import * as React from "react";

import { defaultEdgeToneClasses, pointsToPath } from "../diagram-utils";

import { edgeToneByKind } from "./constants";
import { getDependencyGraphEdgeRoute } from "./layout";

import type {
  DependencyGraphEdgeRoute,
  RenderDependencyGraphEdge,
  RenderDependencyGraphNode,
} from "./types";

export function DependencyGraphEdgeShape({
  edge,
  nodes,
  obstacles,
  markerId,
  edgeIndex,
  route: providedRoute,
  highlightState,
  interactionProps,
}: {
  edge: RenderDependencyGraphEdge;
  nodes: Map<string, RenderDependencyGraphNode>;
  obstacles: readonly RenderDependencyGraphNode[];
  markerId: string;
  edgeIndex: number;
  route?: DependencyGraphEdgeRoute;
  highlightState?: "active" | "related" | "dimmed";
  interactionProps?: React.SVGProps<SVGGElement>;
}) {
  const source = nodes.get(edge.source);
  const target = nodes.get(edge.target);

  if (!source || !target) {
    return null;
  }

  const route =
    providedRoute ?? getDependencyGraphEdgeRoute(edge, source, target, edgeIndex, obstacles);
  const points = route.points;
  const direction = edge.direction ?? "forward";
  const markerUrl = `url(#${markerId})`;
  const labelPoint = route.labelPoint ?? points[Math.floor(points.length / 2)] ?? points[0];
  const tone = edgeToneByKind[edge.kind ?? "runtime"];

  return (
    <g
      data-diagram-edge="true"
      data-slot="dependency-graph-edge"
      data-kind={edge.kind ?? "runtime"}
      data-highlight-state={highlightState}
      className="transition-opacity data-[highlight-state=dimmed]:opacity-25"
      {...interactionProps}
    >
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
        <foreignObject
          data-diagram-label="true"
          x={labelPoint.x - 70}
          y={labelPoint.y - 22}
          width={140}
          height={34}
        >
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
