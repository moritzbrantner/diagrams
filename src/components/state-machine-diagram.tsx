"use client";

import { cn } from "@moritzbrantner/ui";
import * as React from "react";

import {
  clampFiniteNumber,
  diagramCanvasLabelVisibilityClass,
  DiagramSvgItemInteraction,
  getDiagramCanvasStyle,
  type DiagramItemAction,
  defaultEdgeToneClasses,
  defaultToneClasses,
  getAutoGridPosition,
  getHullRoute,
  getNearestDiagramItem,
  getReactNodeAccessibleName,
  getSpatialBounds,
  isActivationKey,
  pointsToPath,
  useDiagramCanvasInteractions,
  useDiagramCanvasSettings,
  type DiagramDirection,
  type DiagramInteractiveProps,
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
  direction?: DiagramDirection;
  points?: readonly DiagramPoint[];
  waypoints?: readonly DiagramPoint[];
};

export type StateMachineStateAction = DiagramItemAction<PositionedStateMachineState>;

export type StateMachineDiagramProps = Omit<React.ComponentProps<"figure">, "children"> & {
  states: readonly StateMachineState[];
  transitions?: readonly StateMachineTransition[];
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
  autoLayoutColumns?: number;
  selectedStateId?: string | null;
  focusedStateId?: string | null;
  defaultFocusedStateId?: string | null;
  keyboardMode?: "nodes" | "none";
  getStateDisabled?: (state: PositionedStateMachineState) => boolean;
  renderStateSelection?: (state: PositionedStateMachineState) => React.ReactNode;
  stateActions?:
    | readonly StateMachineStateAction[]
    | ((state: PositionedStateMachineState) => readonly StateMachineStateAction[]);
  onStateSelect?: (state: PositionedStateMachineState) => void;
  onStateDeselect?: () => void;
  onFocusedStateIdChange?: (state: PositionedStateMachineState | null) => void;
  onStateActionSelect?: (
    action: StateMachineStateAction,
    state: PositionedStateMachineState,
  ) => void;
  selectedTransitionId?: string | null;
  onTransitionSelect?: (transition: StateMachineTransition) => void;
} & DiagramInteractiveProps<PositionedStateMachineState, StateMachineTransition>;

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
  selectedStateId,
  focusedStateId,
  defaultFocusedStateId,
  keyboardMode,
  getStateDisabled,
  renderStateSelection,
  stateActions,
  onStateSelect,
  onStateDeselect,
  onFocusedStateIdChange,
  onStateActionSelect,
  selectedTransitionId,
  onTransitionSelect,
  interactiveFeatures,
  viewport,
  defaultViewport,
  onViewportChange,
  highlightedElement,
  defaultHighlightedElement,
  onHighlightedElementChange,
  searchQuery,
  defaultSearchQuery,
  onSearchQueryChange,
  focusedSearchResult,
  onFocusedSearchResultChange,
  getSearchText,
  inspectedEdgeId,
  defaultInspectedEdgeId,
  onInspectedEdgeIdChange,
  renderEdgeInspector,
  className,
  ...props
}: StateMachineDiagramProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
  const {
    menu: canvasSettingsMenu,
    setScrollAreaElement: setCanvasSettingsScrollAreaElement,
    svgProps: canvasSettingsSvgProps,
  } = useDiagramCanvasSettings();
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
  const resolvedKeyboardMode = keyboardMode ?? (onStateSelect || stateActions ? "nodes" : "none");
  const stateRefs = React.useRef(new Map<string, SVGGElement>());
  const [internalFocusedStateId, setInternalFocusedStateId] = React.useState<string | null>(
    () => defaultFocusedStateId ?? null,
  );
  const enabledStates = React.useMemo(
    () => positionedStates.filter((state) => !getStateDisabled?.(state)),
    [getStateDisabled, positionedStates],
  );
  const requestedFocusedStateId =
    focusedStateId !== undefined ? focusedStateId : internalFocusedStateId;
  const effectiveFocusedStateId =
    resolvedKeyboardMode === "nodes"
      ? (enabledStates.find((state) => state.id === requestedFocusedStateId)?.id ??
        enabledStates[0]?.id ??
        null)
      : null;
  const setStateRef = React.useCallback((stateId: string, element: SVGGElement | null) => {
    if (element) {
      stateRefs.current.set(stateId, element);
    } else {
      stateRefs.current.delete(stateId);
    }
  }, []);
  const focusStateById = React.useCallback(
    (stateId: string | null) => {
      const nextState = stateId ? (stateMap.get(stateId) ?? null) : null;

      if (focusedStateId === undefined) {
        setInternalFocusedStateId(stateId);
      }

      onFocusedStateIdChange?.(nextState);

      if (stateId) {
        queueMicrotask(() => stateRefs.current.get(stateId)?.focus());
      }
    },
    [focusedStateId, onFocusedStateIdChange, stateMap],
  );
  const handleStateFocus = React.useCallback(
    (state: PositionedStateMachineState) => {
      if (getStateDisabled?.(state)) {
        return;
      }

      if (focusedStateId === undefined) {
        setInternalFocusedStateId(state.id);
      }

      onFocusedStateIdChange?.(state);
    },
    [focusedStateId, getStateDisabled, onFocusedStateIdChange],
  );
  const handleStateKeyDown = React.useCallback(
    (event: React.KeyboardEvent<SVGGElement>, state: PositionedStateMachineState) => {
      if (resolvedKeyboardMode === "none" || getStateDisabled?.(state)) {
        return;
      }

      if (isActivationKey(event)) {
        event.preventDefault();
        onStateSelect?.(state);
        return;
      }

      if (event.key === "Escape") {
        if (selectedStateId != null && onStateDeselect) {
          event.preventDefault();
          onStateDeselect();
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
      const nextState = getNearestDiagramItem(
        state,
        enabledStates.filter((item) => item.id !== state.id),
        event.key,
      );

      if (nextState) {
        focusStateById(nextState.id);
      }
    },
    [
      enabledStates,
      focusStateById,
      getStateDisabled,
      onStateDeselect,
      onStateSelect,
      resolvedKeyboardMode,
      selectedStateId,
    ],
  );
  const transitionRoutes = validTransitions.flatMap((transition, index) => {
    const source = stateMap.get(transition.source);
    const target = stateMap.get(transition.target);

    if (!source || !target) {
      return [];
    }

    const route = getHullRoute({
      source,
      target,
      edgeIndex: index,
      obstacles: positionedStates,
      points: transition.points,
      waypoints: transition.waypoints,
      selfLoop: source.id === target.id,
    });

    return [{ transition, transitionIndex: index, route }];
  });
  const routePoints = transitionRoutes.flatMap(({ route }) => route.points);
  const bounds = getSpatialBounds(positionedStates, routePoints);
  const canvasStyle = getDiagramCanvasStyle(bounds, {
    minHeight: 320,
    minWidth: 640,
    padding,
  });
  const interaction = useDiagramCanvasInteractions({
    interactiveFeatures,
    contentBounds: bounds,
    nodes: positionedStates.map((state) => ({
      id: state.id,
      item: state,
      label: state.label,
      bounds: { x: state.x, y: state.y, width: state.width, height: state.height },
    })),
    edges: transitionRoutes.map(({ transition, route }) => ({
      id: transition.id,
      item: transition,
      sourceId: transition.source,
      targetId: transition.target,
      label: transition.event ?? transition.guard ?? transition.action,
      kind: transition.kind,
      direction: transition.direction,
      labelPoint:
        route.labelPoint ?? route.points[Math.floor(route.points.length / 2)] ?? route.points[0],
    })),
    viewport,
    defaultViewport,
    onViewportChange,
    highlightedElement,
    defaultHighlightedElement,
    onHighlightedElementChange,
    searchQuery,
    defaultSearchQuery,
    onSearchQueryChange,
    focusedSearchResult,
    onFocusedSearchResultChange,
    inspectedEdgeId,
    defaultInspectedEdgeId,
    onInspectedEdgeIdChange,
    getSearchText,
    renderEdgeInspector,
    padding,
  });
  const setScrollAreaElement = React.useCallback(
    (element: HTMLDivElement | null) => {
      setCanvasSettingsScrollAreaElement(element);
      interaction.setScrollAreaElement(element);
    },
    [interaction, setCanvasSettingsScrollAreaElement],
  );
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
        ref={setScrollAreaElement}
        data-slot="state-machine-diagram-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="relative overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus state machine diagram scroll area
        </button>
        <svg
          {...canvasSettingsSvgProps}
          data-slot="state-machine-diagram-svg"
          role={onStateSelect || stateActions || onTransitionSelect ? "group" : "img"}
          aria-label={ariaLabel}
          viewBox={interaction.viewBox}
          style={canvasStyle}
          className={cn(
            "block min-h-80 w-full min-w-160 text-foreground",
            diagramCanvasLabelVisibilityClass,
          )}
          {...interaction.svgProps}
        >
          <defs>
            <marker
              id={markerId}
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
          {positionedStates.length ? (
            <>
              <g data-slot="state-machine-diagram-transitions">
                {transitionRoutes.map(({ transition, transitionIndex, route }) => (
                  <TransitionShape
                    key={transition.id}
                    transition={transition}
                    states={stateMap}
                    obstacles={positionedStates}
                    markerId={markerId}
                    transitionIndex={transitionIndex}
                    route={route}
                    selected={selectedTransitionId === transition.id}
                    onTransitionSelect={onTransitionSelect}
                    highlightState={interaction.getEdgeHighlightState(transition.id)}
                    interactionProps={interaction.getEdgeInteractionProps(transition.id)}
                  />
                ))}
              </g>
              <g data-slot="state-machine-diagram-states">
                {positionedStates.map((state) => (
                  <DiagramSvgItemInteraction
                    key={state.id}
                    item={state}
                    slot="state-machine-diagram-state"
                    selected={selectedStateId === state.id}
                    focused={effectiveFocusedStateId === state.id}
                    disabled={Boolean(getStateDisabled?.(state))}
                    keyboardMode={resolvedKeyboardMode}
                    actions={
                      typeof stateActions === "function"
                        ? stateActions(state)
                        : (stateActions ?? [])
                    }
                    renderSelection={renderStateSelection}
                    onSelect={onStateSelect}
                    onFocus={handleStateFocus}
                    onKeyDown={handleStateKeyDown}
                    onActionSelect={onStateActionSelect}
                    setItemRef={(stateId, element) => {
                      setStateRef(stateId, element);
                      interaction.setNodeElement(stateId, element);
                    }}
                    highlightState={interaction.getNodeHighlightState(state.id)}
                    interactionProps={interaction.getNodeInteractionProps(state.id)}
                  >
                    <StateShape state={state} />
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
        {interaction.overlay}
        {canvasSettingsMenu}
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
  obstacles,
  markerId,
  transitionIndex,
  route: providedRoute,
  selected,
  onTransitionSelect,
  highlightState,
  interactionProps,
}: {
  transition: StateMachineTransition;
  states: Map<string, PositionedStateMachineState>;
  obstacles: readonly PositionedStateMachineState[];
  markerId: string;
  transitionIndex: number;
  route?: ReturnType<typeof getHullRoute>;
  selected: boolean;
  onTransitionSelect?: StateMachineDiagramProps["onTransitionSelect"];
  highlightState?: "active" | "related" | "dimmed";
  interactionProps?: React.SVGProps<SVGGElement>;
}) {
  const source = states.get(transition.source);
  const target = states.get(transition.target);

  if (!source || !target) {
    return null;
  }

  const route =
    providedRoute ??
    getHullRoute({
      source,
      target,
      edgeIndex: transitionIndex,
      obstacles,
      points: transition.points,
      waypoints: transition.waypoints,
      selfLoop: source.id === target.id,
    });
  const points = route.points;
  const labelPoint = route.labelPoint ?? points[Math.floor(points.length / 2)] ?? points[0];
  const direction = transition.direction ?? "forward";
  const markerUrl = `url(#${markerId})`;
  const accessibleLabel = getReactNodeAccessibleName(
    transition.event ?? transition.guard ?? transition.action,
    transition.id,
  );

  return (
    <g
      data-diagram-edge="true"
      data-slot="state-machine-diagram-transition"
      data-kind={transition.kind ?? "transition"}
      data-selected={selected ? "true" : undefined}
      data-highlight-state={highlightState}
      role={onTransitionSelect ? "button" : undefined}
      aria-label={onTransitionSelect ? accessibleLabel : undefined}
      aria-pressed={onTransitionSelect ? selected : undefined}
      aria-describedby={interactionProps?.["aria-describedby"]}
      tabIndex={onTransitionSelect ? 0 : interactionProps?.tabIndex}
      className={cn(
        "transition-opacity data-[highlight-state=dimmed]:opacity-25",
        onTransitionSelect && "cursor-pointer outline-none",
      )}
      onClick={
        onTransitionSelect || interactionProps?.onClick
          ? (event) => {
              interactionProps?.onClick?.(event);
              onTransitionSelect?.(transition);
            }
          : undefined
      }
      onPointerEnter={interactionProps?.onPointerEnter}
      onPointerLeave={interactionProps?.onPointerLeave}
      onFocus={interactionProps?.onFocus}
      onBlur={interactionProps?.onBlur}
      onKeyDown={
        onTransitionSelect || interactionProps?.onKeyDown
          ? (event) => {
              interactionProps?.onKeyDown?.(event);
              if (onTransitionSelect && isActivationKey(event)) {
                event.preventDefault();
                onTransitionSelect(transition);
              }
            }
          : undefined
      }
    >
      <path
        d={pointsToPath(points)}
        fill="none"
        strokeWidth={selected ? 3 : 2}
        strokeDasharray={transition.kind === "internal" ? "6 6" : undefined}
        className={defaultEdgeToneClasses[transitionTone[transition.kind ?? "transition"]]}
        markerStart={direction === "backward" || direction === "both" ? markerUrl : undefined}
        markerEnd={direction === "forward" || direction === "both" ? markerUrl : undefined}
      />
      {(transition.event || transition.guard || transition.action) && labelPoint ? (
        <foreignObject
          data-diagram-label="true"
          x={labelPoint.x - 82}
          y={labelPoint.y - 30}
          width={164}
          height={52}
        >
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
