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
  type DiagramPoint,
  type DiagramTone,
} from "./diagram-utils";

export type StateMachineStateKind = "initial" | "state" | "final" | "choice" | "parallel";

export type StateMachineState = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  kind?: StateMachineStateKind;
  activities?: readonly React.ReactNode[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  tone?: DiagramTone;
};

export type StateMachineTransitionKind = "transition" | "internal" | "timeout" | "error";

export type StateMachineTransition = {
  id: string;
  source: string;
  target: string;
  event?: React.ReactNode;
  guard?: React.ReactNode;
  action?: React.ReactNode;
  kind?: StateMachineTransitionKind;
  points?: readonly DiagramPoint[];
};

export type StateMachineDiagramProps = Omit<React.ComponentProps<"figure">, "children"> & {
  states: readonly StateMachineState[];
  transitions?: readonly StateMachineTransition[];
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
  autoLayoutColumns?: number;
};

type PositionedStateMachineState = StateMachineState &
  Required<Pick<StateMachineState, "x" | "y">> & {
    width: number;
    height: number;
  };

const STATE_WIDTH = 188;
const STATE_HEIGHT = 96;
const transitionTone: Record<StateMachineTransitionKind, DiagramTone> = {
  transition: "default",
  internal: "muted",
  timeout: "warning",
  error: "danger",
};

function StateMachineDiagram({
  states,
  transitions = [],
  ariaLabel = "State machine diagram",
  caption,
  emptyMessage = "No states to display.",
  padding = 32,
  autoLayoutColumns = 3,
  className,
  ...props
}: StateMachineDiagramProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
  const positionedStates = React.useMemo(
    () => positionStates(states, autoLayoutColumns),
    [autoLayoutColumns, states],
  );
  const stateMap = React.useMemo(
    () => new Map(positionedStates.map((state) => [state.id, state])),
    [positionedStates],
  );
  const validTransitions = transitions.filter(
    (transition) => stateMap.has(transition.source) && stateMap.has(transition.target),
  );
  const routePoints = validTransitions.flatMap((transition, index) =>
    transition.points?.length
      ? transition.points
      : getOrthogonalRoute(
          stateMap.get(transition.source)!,
          stateMap.get(transition.target)!,
          index,
        ),
  );
  const bounds = getSpatialBounds(positionedStates, routePoints);
  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${
    bounds.height + padding * 2
  }`;
  const markerId = `state-machine-diagram-arrow-${markerPrefix}`;

  return (
    <figure
      data-slot="state-machine-diagram"
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="state-machine-diagram-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus state machine diagram scroll area
        </button>
        <svg
          data-slot="state-machine-diagram-svg"
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
          {positionedStates.length ? (
            <>
              <g data-slot="state-machine-diagram-transitions">
                {validTransitions.map((transition, index) => (
                  <TransitionShape
                    key={transition.id}
                    transition={transition}
                    states={stateMap}
                    markerId={markerId}
                    transitionIndex={index}
                  />
                ))}
              </g>
              <g data-slot="state-machine-diagram-states">
                {positionedStates.map((state) => (
                  <StateShape key={state.id} state={state} />
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

function TransitionShape({
  transition,
  states,
  markerId,
  transitionIndex,
}: {
  transition: StateMachineTransition;
  states: Map<string, PositionedStateMachineState>;
  markerId: string;
  transitionIndex: number;
}) {
  const source = states.get(transition.source);
  const target = states.get(transition.target);

  if (!source || !target) {
    return null;
  }

  const points = transition.points?.length
    ? transition.points
    : getOrthogonalRoute(source, target, transitionIndex);
  const labelPoint = points[Math.floor(points.length / 2)] ?? points[0];

  return (
    <g data-slot="state-machine-diagram-transition" data-kind={transition.kind ?? "transition"}>
      <path
        d={pointsToPath(points)}
        fill="none"
        strokeWidth={2}
        strokeDasharray={transition.kind === "internal" ? "6 6" : undefined}
        className={defaultEdgeToneClasses[transitionTone[transition.kind ?? "transition"]]}
        markerEnd={`url(#${markerId})`}
      />
      {(transition.event || transition.guard || transition.action) && labelPoint ? (
        <foreignObject x={labelPoint.x - 82} y={labelPoint.y - 30} width={164} height={52}>
          <div className="grid rounded-md border bg-background px-2 py-1 text-center text-xs text-muted-foreground shadow-sm">
            {transition.event ? (
              <span className="font-medium text-foreground">{transition.event}</span>
            ) : null}
            {transition.guard ? <span>[{transition.guard}]</span> : null}
            {transition.action ? <span>{transition.action}</span> : null}
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

function StateShape({ state }: { state: PositionedStateMachineState }) {
  if (state.kind === "initial" || state.kind === "final") {
    return (
      <g data-slot="state-machine-diagram-state" data-kind={state.kind} data-state-id={state.id}>
        <circle
          cx={state.x + state.width / 2}
          cy={state.y + state.height / 2}
          r={state.kind === "initial" ? 14 : 18}
          className={
            state.kind === "initial" ? "fill-foreground" : "fill-background stroke-foreground"
          }
          strokeWidth={2}
        />
        {state.kind === "final" ? (
          <circle
            cx={state.x + state.width / 2}
            cy={state.y + state.height / 2}
            r={10}
            className="fill-foreground"
          />
        ) : null}
      </g>
    );
  }

  return (
    <foreignObject
      data-slot="state-machine-diagram-state"
      x={state.x}
      y={state.y}
      width={state.width}
      height={state.height}
    >
      <div
        data-state-id={state.id}
        data-kind={state.kind ?? "state"}
        data-tone={state.tone ?? "default"}
        className={cn(
          "grid size-full content-center gap-1 rounded-md border p-3 text-center text-sm shadow-sm",
          defaultToneClasses[state.tone ?? "default"],
        )}
      >
        <div className="font-medium leading-5">{state.label}</div>
        {state.description ? (
          <div className="line-clamp-2 text-xs leading-4 text-muted-foreground">
            {state.description}
          </div>
        ) : null}
        {state.activities?.length ? (
          <div className="flex flex-wrap justify-center gap-x-1 text-xs text-muted-foreground">
            {state.activities.map((activity, index) => (
              <React.Fragment key={index}>
                {index > 0 ? <span aria-hidden="true">·</span> : null}
                <span>{activity}</span>
              </React.Fragment>
            ))}
          </div>
        ) : null}
      </div>
    </foreignObject>
  );
}

function positionStates(
  states: readonly StateMachineState[],
  columns: number,
): PositionedStateMachineState[] {
  return states.map((state, index) => {
    const fallback = getAutoGridPosition(
      index,
      columns,
      { x: 96, y: 88 },
      { width: STATE_WIDTH, height: STATE_HEIGHT },
    );
    const simple = state.kind === "initial" || state.kind === "final";

    return {
      ...state,
      x: clampFiniteNumber(state.x, fallback.x),
      y: clampFiniteNumber(state.y, fallback.y),
      width: simple ? 48 : Math.max(120, clampFiniteNumber(state.width, STATE_WIDTH)),
      height: simple ? 48 : Math.max(72, clampFiniteNumber(state.height, STATE_HEIGHT)),
    };
  });
}

export { StateMachineDiagram };
export type {
  DiagramPoint as StateMachineDiagramPoint,
  DiagramTone as StateMachineDiagramTone,
  PositionedStateMachineState,
};
