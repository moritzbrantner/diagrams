"use client";

import * as React from "react";

import { cn } from "../lib/cn";

import {
  clampFiniteNumber,
  defaultEdgeToneClasses,
  defaultToneClasses,
  defaultSvgToneClasses,
  getOrthogonalRoute,
  getSpatialBounds,
  pointsToPath,
  type DiagramDirection,
  type DiagramPoint,
  type DiagramTone,
} from "./diagram-utils";

export type SwimlaneDiagramOrientation = "horizontal" | "vertical";
export type SwimlaneDiagramStatus = "pending" | "active" | "done" | "blocked" | "warning";
export type SwimlaneDiagramConnectorKind =
  | "default"
  | "dependency"
  | "blocking"
  | "success"
  | "risk";

export type SwimlaneDiagramLane = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  tone?: DiagramTone;
};

export type SwimlaneDiagramStep = {
  id: string;
  laneId: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  status?: SwimlaneDiagramStatus;
  tone?: DiagramTone;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type SwimlaneDiagramConnector = {
  id: string;
  source: string;
  target: string;
  label?: React.ReactNode;
  kind?: SwimlaneDiagramConnectorKind;
  direction?: DiagramDirection;
  points?: readonly DiagramPoint[];
};

export type SwimlaneDiagramProps = Omit<React.ComponentProps<"figure">, "children"> & {
  lanes: readonly SwimlaneDiagramLane[];
  steps?: readonly SwimlaneDiagramStep[];
  connectors?: readonly SwimlaneDiagramConnector[];
  orientation?: SwimlaneDiagramOrientation;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
};

type PositionedSwimlaneDiagramStep = SwimlaneDiagramStep &
  Required<Pick<SwimlaneDiagramStep, "x" | "y">> & {
    width: number;
    height: number;
  };

type PositionedSwimlaneDiagramLane = SwimlaneDiagramLane & {
  x: number;
  y: number;
  width: number;
  height: number;
};

const STEP_WIDTH = 180;
const STEP_HEIGHT = 96;
const LANE_HEADER = 132;
const LANE_SIZE = 168;
const STEP_GAP = 72;
const connectorTone: Record<SwimlaneDiagramConnectorKind, DiagramTone> = {
  default: "default",
  dependency: "accent",
  blocking: "danger",
  success: "success",
  risk: "warning",
};
const statusTone: Record<SwimlaneDiagramStatus, DiagramTone> = {
  pending: "muted",
  active: "accent",
  done: "success",
  blocked: "danger",
  warning: "warning",
};

function SwimlaneDiagram({
  lanes,
  steps = [],
  connectors = [],
  orientation = "horizontal",
  ariaLabel = "Swimlane diagram",
  caption,
  emptyMessage = "No swimlane steps.",
  padding = 32,
  className,
  ...props
}: SwimlaneDiagramProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
  const laneIds = React.useMemo(() => new Set(lanes.map((lane) => lane.id)), [lanes]);
  const validSteps = steps.filter((step) => laneIds.has(step.laneId));
  const positionedLanes = React.useMemo(
    () => positionLanes(lanes, validSteps, orientation),
    [lanes, orientation, validSteps],
  );
  const laneMap = React.useMemo(
    () => new Map(positionedLanes.map((lane) => [lane.id, lane])),
    [positionedLanes],
  );
  const positionedSteps = React.useMemo(
    () => positionSteps(validSteps, laneMap, orientation),
    [laneMap, orientation, validSteps],
  );
  const stepMap = React.useMemo(
    () => new Map(positionedSteps.map((step) => [step.id, step])),
    [positionedSteps],
  );
  const validConnectors = connectors.filter(
    (connector) => stepMap.has(connector.source) && stepMap.has(connector.target),
  );
  const routePoints = validConnectors.flatMap((connector, index) =>
    connector.points?.length
      ? connector.points
      : getOrthogonalRoute(stepMap.get(connector.source)!, stepMap.get(connector.target)!, index),
  );
  const bounds = getSpatialBounds([...positionedLanes, ...positionedSteps], routePoints);
  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${
    bounds.height + padding * 2
  }`;
  const markerId = `swimlane-diagram-arrow-${markerPrefix}`;

  return (
    <figure
      data-slot="swimlane-diagram"
      data-orientation={orientation}
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="swimlane-diagram-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus swimlane diagram scroll area
        </button>
        <svg
          data-slot="swimlane-diagram-svg"
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
          {positionedLanes.length && positionedSteps.length ? (
            <>
              <g data-slot="swimlane-diagram-lanes">
                {positionedLanes.map((lane) => (
                  <g
                    key={lane.id}
                    data-slot="swimlane-diagram-lane"
                    data-tone={lane.tone ?? "muted"}
                  >
                    <rect
                      x={lane.x}
                      y={lane.y}
                      width={lane.width}
                      height={lane.height}
                      rx={8}
                      strokeWidth={1.5}
                      className={defaultSvgToneClasses[lane.tone ?? "muted"]}
                    />
                    <foreignObject
                      x={lane.x + 12}
                      y={lane.y + 12}
                      width={orientation === "horizontal" ? LANE_HEADER - 24 : lane.width - 24}
                      height={72}
                    >
                      <div className="grid gap-1 text-sm">
                        <div className="font-medium leading-5">{lane.label}</div>
                        {lane.description ? (
                          <div className="text-xs text-muted-foreground">{lane.description}</div>
                        ) : null}
                      </div>
                    </foreignObject>
                  </g>
                ))}
              </g>
              <g data-slot="swimlane-diagram-connectors">
                {validConnectors.map((connector, index) => (
                  <SwimlaneConnectorShape
                    key={connector.id}
                    connector={connector}
                    steps={stepMap}
                    markerId={markerId}
                    connectorIndex={index}
                  />
                ))}
              </g>
              <g data-slot="swimlane-diagram-steps">
                {positionedSteps.map((step) => (
                  <SwimlaneStepShape key={step.id} step={step} />
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

function SwimlaneConnectorShape({
  connector,
  steps,
  markerId,
  connectorIndex,
}: {
  connector: SwimlaneDiagramConnector;
  steps: Map<string, PositionedSwimlaneDiagramStep>;
  markerId: string;
  connectorIndex: number;
}) {
  const source = steps.get(connector.source);
  const target = steps.get(connector.target);

  if (!source || !target) {
    return null;
  }

  const points = connector.points?.length
    ? connector.points
    : getOrthogonalRoute(source, target, connectorIndex);
  const direction = connector.direction ?? "forward";
  const markerUrl = `url(#${markerId})`;
  const labelPoint = points[Math.floor(points.length / 2)] ?? points[0];

  return (
    <g data-slot="swimlane-diagram-connector" data-kind={connector.kind ?? "default"}>
      <path
        d={pointsToPath(points)}
        fill="none"
        strokeWidth={2}
        className={defaultEdgeToneClasses[connectorTone[connector.kind ?? "default"]]}
        markerStart={direction === "backward" || direction === "both" ? markerUrl : undefined}
        markerEnd={direction === "forward" || direction === "both" ? markerUrl : undefined}
      />
      {connector.label && labelPoint ? (
        <foreignObject x={labelPoint.x - 68} y={labelPoint.y - 22} width={136} height={32}>
          <div className="inline-flex max-w-34 rounded-md border bg-background px-2 py-1 text-center text-xs text-muted-foreground shadow-sm">
            {connector.label}
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

function SwimlaneStepShape({ step }: { step: PositionedSwimlaneDiagramStep }) {
  const tone = step.tone ?? (step.status ? statusTone[step.status] : "default");

  return (
    <foreignObject
      data-slot="swimlane-diagram-step"
      x={step.x}
      y={step.y}
      width={step.width}
      height={step.height}
    >
      <div
        data-step-id={step.id}
        data-status={step.status}
        data-tone={tone}
        className={cn(
          "grid size-full content-start gap-1 rounded-md border p-3 text-sm shadow-sm",
          defaultToneClasses[tone],
        )}
      >
        <div className="font-medium leading-5">{step.label}</div>
        {step.description ? (
          <div className="line-clamp-2 text-xs leading-4 text-muted-foreground">
            {step.description}
          </div>
        ) : null}
        {step.meta ? (
          <div className="mt-auto text-xs text-muted-foreground">{step.meta}</div>
        ) : null}
      </div>
    </foreignObject>
  );
}

function positionLanes(
  lanes: readonly SwimlaneDiagramLane[],
  steps: readonly SwimlaneDiagramStep[],
  orientation: SwimlaneDiagramOrientation,
): PositionedSwimlaneDiagramLane[] {
  const maxLaneItems = Math.max(
    1,
    ...lanes.map((lane) => steps.filter((step) => step.laneId === lane.id).length),
  );
  const length = LANE_HEADER + maxLaneItems * (STEP_WIDTH + STEP_GAP);

  return lanes.map((lane, index) =>
    orientation === "horizontal"
      ? {
          ...lane,
          x: 0,
          y: index * LANE_SIZE,
          width: Math.max(520, length),
          height: LANE_SIZE - 16,
        }
      : {
          ...lane,
          x: index * (STEP_WIDTH + STEP_GAP),
          y: 0,
          width: STEP_WIDTH + 40,
          height: Math.max(420, LANE_HEADER + maxLaneItems * (STEP_HEIGHT + STEP_GAP)),
        },
  );
}

function positionSteps(
  steps: readonly SwimlaneDiagramStep[],
  laneMap: Map<string, PositionedSwimlaneDiagramLane>,
  orientation: SwimlaneDiagramOrientation,
): PositionedSwimlaneDiagramStep[] {
  const laneCounts = new Map<string, number>();

  return steps.map((step) => {
    const lane = laneMap.get(step.laneId);
    const count = laneCounts.get(step.laneId) ?? 0;
    laneCounts.set(step.laneId, count + 1);

    const fallback =
      lane && orientation === "horizontal"
        ? { x: lane.x + LANE_HEADER + count * (STEP_WIDTH + STEP_GAP), y: lane.y + 36 }
        : {
            x: (lane?.x ?? 0) + 20,
            y: (lane?.y ?? 0) + LANE_HEADER + count * (STEP_HEIGHT + STEP_GAP),
          };

    return {
      ...step,
      x: clampFiniteNumber(step.x, fallback.x),
      y: clampFiniteNumber(step.y, fallback.y),
      width: Math.max(120, clampFiniteNumber(step.width, STEP_WIDTH)),
      height: Math.max(72, clampFiniteNumber(step.height, STEP_HEIGHT)),
    };
  });
}

export { SwimlaneDiagram };
export type {
  DiagramDirection as SwimlaneDiagramDirection,
  DiagramPoint as SwimlaneDiagramPoint,
  DiagramTone as SwimlaneDiagramTone,
  PositionedSwimlaneDiagramLane,
  PositionedSwimlaneDiagramStep,
};
