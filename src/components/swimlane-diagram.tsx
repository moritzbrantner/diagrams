"use client";

import { cn } from "@moritzbrantner/ui";
import * as React from "react";

import {
  clampFiniteNumber,
  diagramCanvasLabelVisibilityClass,
  DiagramSvgItemInteraction,
  type DiagramItemAction,
  defaultEdgeToneClasses,
  defaultToneClasses,
  defaultSvgToneClasses,
  getHullRoute,
  getNearestDiagramItem,
  getReactNodeAccessibleName,
  getSpatialBounds,
  isActivationKey,
  pointsToPath,
  useDiagramCanvasInteractions,
  useDiagramCanvasSettings,
  useControlledSetState,
  type DiagramDirection,
  type DiagramInteractiveProps,
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
  waypoints?: readonly DiagramPoint[];
};

export type SwimlaneDiagramStepAction = DiagramItemAction<PositionedSwimlaneDiagramStep>;

export type SwimlaneDiagramProps = Omit<React.ComponentProps<"figure">, "children"> & {
  lanes: readonly SwimlaneDiagramLane[];
  steps?: readonly SwimlaneDiagramStep[];
  connectors?: readonly SwimlaneDiagramConnector[];
  orientation?: SwimlaneDiagramOrientation;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
  selectedStepId?: string | null;
  focusedStepId?: string | null;
  defaultFocusedStepId?: string | null;
  keyboardMode?: "nodes" | "none";
  getStepDisabled?: (step: PositionedSwimlaneDiagramStep) => boolean;
  renderStepSelection?: (step: PositionedSwimlaneDiagramStep) => React.ReactNode;
  stepActions?:
    | readonly SwimlaneDiagramStepAction[]
    | ((step: PositionedSwimlaneDiagramStep) => readonly SwimlaneDiagramStepAction[]);
  onStepSelect?: (step: PositionedSwimlaneDiagramStep) => void;
  onStepDeselect?: () => void;
  onFocusedStepIdChange?: (step: PositionedSwimlaneDiagramStep | null) => void;
  onStepActionSelect?: (
    action: SwimlaneDiagramStepAction,
    step: PositionedSwimlaneDiagramStep,
  ) => void;
  collapsedLaneIds?: readonly string[];
  defaultCollapsedLaneIds?: readonly string[];
  onCollapsedLaneIdsChange?: (
    laneIds: string[],
    lane: PositionedSwimlaneDiagramLane,
    collapsed: boolean,
  ) => void;
} & DiagramInteractiveProps<PositionedSwimlaneDiagramStep, SwimlaneDiagramConnector>;

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

type RenderSwimlaneDiagramStep = PositionedSwimlaneDiagramStep & {
  summary?: {
    lane: PositionedSwimlaneDiagramLane;
    hiddenSteps: readonly PositionedSwimlaneDiagramStep[];
  };
};

const STEP_WIDTH = 180;
const STEP_HEIGHT = 96;
const LANE_HEADER = 132;
const LANE_SIZE = 168;
const STEP_GAP = 72;
const LANE_SUMMARY_PREFIX = "__swimlane-diagram-lane-summary-";
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
  selectedStepId,
  focusedStepId,
  defaultFocusedStepId,
  keyboardMode,
  getStepDisabled,
  renderStepSelection,
  stepActions,
  onStepSelect,
  onStepDeselect,
  onFocusedStepIdChange,
  onStepActionSelect,
  collapsedLaneIds,
  defaultCollapsedLaneIds,
  onCollapsedLaneIdsChange,
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
}: SwimlaneDiagramProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
  const {
    menu: canvasSettingsMenu,
    setScrollAreaElement: setCanvasSettingsScrollAreaElement,
    svgProps: canvasSettingsSvgProps,
  } = useDiagramCanvasSettings();
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
  const [internalCollapsedLaneIds, setInternalCollapsedLaneIds] = useControlledSetState({
    value: collapsedLaneIds,
    defaultValue: defaultCollapsedLaneIds,
  });
  const laneProjection = React.useMemo(
    () => getSwimlaneLaneProjection(positionedLanes, positionedSteps, internalCollapsedLaneIds),
    [internalCollapsedLaneIds, positionedLanes, positionedSteps],
  );
  const renderSteps = React.useMemo<RenderSwimlaneDiagramStep[]>(
    () => [
      ...positionedSteps.filter((step) => !laneProjection.hiddenStepToProxyId.has(step.id)),
      ...laneProjection.summarySteps,
    ],
    [laneProjection.hiddenStepToProxyId, laneProjection.summarySteps, positionedSteps],
  );
  const stepMap = React.useMemo(
    () => new Map(renderSteps.map((step) => [step.id, step])),
    [renderSteps],
  );
  const validConnectors = connectors
    .map((connector) => ({
      ...connector,
      source: laneProjection.hiddenStepToProxyId.get(connector.source) ?? connector.source,
      target: laneProjection.hiddenStepToProxyId.get(connector.target) ?? connector.target,
    }))
    .filter((connector) => stepMap.has(connector.source) && stepMap.has(connector.target));
  const resolvedKeyboardMode = keyboardMode ?? (onStepSelect || stepActions ? "nodes" : "none");
  const stepRefs = React.useRef(new Map<string, SVGGElement>());
  const [internalFocusedStepId, setInternalFocusedStepId] = React.useState<string | null>(
    () => defaultFocusedStepId ?? null,
  );
  const enabledSteps = React.useMemo(
    () => renderSteps.filter((step) => !getStepDisabled?.(step)),
    [getStepDisabled, renderSteps],
  );
  const requestedFocusedStepId =
    focusedStepId !== undefined ? focusedStepId : internalFocusedStepId;
  const effectiveFocusedStepId =
    resolvedKeyboardMode === "nodes"
      ? (enabledSteps.find((step) => step.id === requestedFocusedStepId)?.id ??
        enabledSteps[0]?.id ??
        null)
      : null;
  const setStepRef = React.useCallback((stepId: string, element: SVGGElement | null) => {
    if (element) {
      stepRefs.current.set(stepId, element);
    } else {
      stepRefs.current.delete(stepId);
    }
  }, []);
  const focusStepById = React.useCallback(
    (stepId: string | null) => {
      const nextStep = stepId ? (stepMap.get(stepId) ?? null) : null;

      if (focusedStepId === undefined) {
        setInternalFocusedStepId(stepId);
      }

      onFocusedStepIdChange?.(nextStep);

      if (stepId) {
        queueMicrotask(() => stepRefs.current.get(stepId)?.focus());
      }
    },
    [focusedStepId, onFocusedStepIdChange, stepMap],
  );
  const handleStepFocus = React.useCallback(
    (step: RenderSwimlaneDiagramStep) => {
      if (getStepDisabled?.(step)) {
        return;
      }

      if (focusedStepId === undefined) {
        setInternalFocusedStepId(step.id);
      }

      onFocusedStepIdChange?.(step);
    },
    [focusedStepId, getStepDisabled, onFocusedStepIdChange],
  );
  const handleStepKeyDown = React.useCallback(
    (event: React.KeyboardEvent<SVGGElement>, step: RenderSwimlaneDiagramStep) => {
      if (resolvedKeyboardMode === "none" || getStepDisabled?.(step)) {
        return;
      }

      if (isActivationKey(event)) {
        event.preventDefault();
        onStepSelect?.(step);
        return;
      }

      if (event.key === "Escape") {
        if (selectedStepId != null && onStepDeselect) {
          event.preventDefault();
          onStepDeselect();
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
      const nextStep = getNearestDiagramItem(
        step,
        enabledSteps.filter((item) => item.id !== step.id),
        event.key,
      );

      if (nextStep) {
        focusStepById(nextStep.id);
      }
    },
    [
      enabledSteps,
      focusStepById,
      getStepDisabled,
      onStepDeselect,
      onStepSelect,
      resolvedKeyboardMode,
      selectedStepId,
    ],
  );
  const toggleLane = React.useCallback(
    (lane: PositionedSwimlaneDiagramLane, collapsed: boolean) => {
      const nextLaneIds = collapsed
        ? Array.from(new Set([...internalCollapsedLaneIds, lane.id]))
        : Array.from(internalCollapsedLaneIds).filter((id) => id !== lane.id);

      setInternalCollapsedLaneIds(nextLaneIds);
      onCollapsedLaneIdsChange?.(nextLaneIds, lane, collapsed);
    },
    [internalCollapsedLaneIds, onCollapsedLaneIdsChange, setInternalCollapsedLaneIds],
  );
  const connectorRoutes = validConnectors.flatMap((connector, index) => {
    const source = stepMap.get(connector.source);
    const target = stepMap.get(connector.target);

    if (!source || !target) {
      return [];
    }

    const route = getHullRoute({
      source,
      target,
      edgeIndex: index,
      obstacles: renderSteps,
      points: connector.points,
      waypoints: connector.waypoints,
      selfLoop: source.id === target.id,
    });

    return [{ connector, connectorIndex: index, route }];
  });
  const routePoints = connectorRoutes.flatMap(({ route }) => route.points);
  const bounds = getSpatialBounds([...positionedLanes, ...renderSteps], routePoints);
  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${
    bounds.height + padding * 2
  }`;
  const interaction = useDiagramCanvasInteractions({
    interactiveFeatures,
    contentBounds: bounds,
    nodes: renderSteps.map((step) => ({
      id: step.id,
      item: step,
      label: step.label,
      bounds: { x: step.x, y: step.y, width: step.width, height: step.height },
    })),
    edges: connectorRoutes.map(({ connector, route }) => ({
      id: connector.id,
      item: connector,
      sourceId: connector.source,
      targetId: connector.target,
      label: connector.label,
      kind: connector.kind,
      direction: connector.direction,
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
        ref={setScrollAreaElement}
        data-slot="swimlane-diagram-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="relative overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus swimlane diagram scroll area
        </button>
        <svg
          {...canvasSettingsSvgProps}
          data-slot="swimlane-diagram-svg"
          role={onStepSelect || stepActions ? "group" : "img"}
          aria-label={ariaLabel}
          viewBox={interactiveFeatures ? interaction.viewBox : viewBox}
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
          {positionedLanes.length && renderSteps.length ? (
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
                    {onCollapsedLaneIdsChange || collapsedLaneIds || defaultCollapsedLaneIds ? (
                      <foreignObject
                        x={lane.x + lane.width - 64}
                        y={lane.y + 12}
                        width={56}
                        height={28}
                      >
                        <button
                          type="button"
                          data-slot="swimlane-diagram-lane-action"
                          aria-label={`${internalCollapsedLaneIds.has(lane.id) ? "Expand" : "Collapse"} ${getReactNodeAccessibleName(lane.label, lane.id)}`}
                          className="inline-flex h-7 items-center rounded-sm border bg-background/90 px-2 text-xs font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleLane(lane, !internalCollapsedLaneIds.has(lane.id));
                          }}
                        >
                          {internalCollapsedLaneIds.has(lane.id) ? "Show" : "Hide"}
                        </button>
                      </foreignObject>
                    ) : null}
                  </g>
                ))}
              </g>
              <g data-slot="swimlane-diagram-connectors">
                {connectorRoutes.map(({ connector, connectorIndex, route }) => (
                  <SwimlaneConnectorShape
                    key={connector.id}
                    connector={connector}
                    steps={stepMap}
                    obstacles={renderSteps}
                    markerId={markerId}
                    connectorIndex={connectorIndex}
                    route={route}
                    highlightState={interaction.getEdgeHighlightState(connector.id)}
                    interactionProps={interaction.getEdgeInteractionProps(connector.id)}
                  />
                ))}
              </g>
              <g data-slot="swimlane-diagram-steps">
                {renderSteps.map((step) => (
                  <DiagramSvgItemInteraction
                    key={step.id}
                    item={step}
                    slot="swimlane-diagram-step"
                    selected={selectedStepId === step.id}
                    focused={effectiveFocusedStepId === step.id}
                    disabled={Boolean(getStepDisabled?.(step))}
                    keyboardMode={resolvedKeyboardMode}
                    actions={
                      typeof stepActions === "function" ? stepActions(step) : (stepActions ?? [])
                    }
                    renderSelection={renderStepSelection}
                    onSelect={onStepSelect}
                    onFocus={handleStepFocus}
                    onKeyDown={handleStepKeyDown}
                    onActionSelect={onStepActionSelect}
                    setItemRef={(stepId, element) => {
                      setStepRef(stepId, element);
                      interaction.setNodeElement(stepId, element);
                    }}
                    highlightState={interaction.getNodeHighlightState(step.id)}
                    interactionProps={interaction.getNodeInteractionProps(step.id)}
                  >
                    <SwimlaneStepShape step={step} />
                    {step.summary ? (
                      <foreignObject
                        x={step.x + step.width - 52}
                        y={step.y + 8}
                        width={44}
                        height={28}
                      >
                        <button
                          type="button"
                          data-slot="swimlane-diagram-step-action"
                          aria-label={`Expand ${getReactNodeAccessibleName(step.summary.lane.label, step.summary.lane.id)}`}
                          className="inline-flex h-7 items-center rounded-sm border bg-background/90 px-2 text-xs font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleLane(step.summary!.lane, false);
                          }}
                        >
                          Show
                        </button>
                      </foreignObject>
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

function SwimlaneConnectorShape({
  connector,
  steps,
  obstacles,
  markerId,
  connectorIndex,
  route: providedRoute,
  highlightState,
  interactionProps,
}: {
  connector: SwimlaneDiagramConnector;
  steps: Map<string, RenderSwimlaneDiagramStep>;
  obstacles: readonly RenderSwimlaneDiagramStep[];
  markerId: string;
  connectorIndex: number;
  route?: ReturnType<typeof getHullRoute>;
  highlightState?: "active" | "related" | "dimmed";
  interactionProps?: React.SVGProps<SVGGElement>;
}) {
  const source = steps.get(connector.source);
  const target = steps.get(connector.target);

  if (!source || !target) {
    return null;
  }

  const route =
    providedRoute ??
    getHullRoute({
      source,
      target,
      edgeIndex: connectorIndex,
      obstacles,
      points: connector.points,
      waypoints: connector.waypoints,
      selfLoop: source.id === target.id,
    });
  const points = route.points;
  const direction = connector.direction ?? "forward";
  const markerUrl = `url(#${markerId})`;
  const labelPoint = route.labelPoint ?? points[Math.floor(points.length / 2)] ?? points[0];

  return (
    <g
      data-diagram-edge="true"
      data-slot="swimlane-diagram-connector"
      data-kind={connector.kind ?? "default"}
      data-highlight-state={highlightState}
      className="transition-opacity data-[highlight-state=dimmed]:opacity-25"
      {...interactionProps}
    >
      <path
        d={pointsToPath(points)}
        fill="none"
        strokeWidth={2}
        className={defaultEdgeToneClasses[connectorTone[connector.kind ?? "default"]]}
        markerStart={direction === "backward" || direction === "both" ? markerUrl : undefined}
        markerEnd={direction === "forward" || direction === "both" ? markerUrl : undefined}
      />
      {connector.label && labelPoint ? (
        <foreignObject
          data-diagram-label="true"
          x={labelPoint.x - 68}
          y={labelPoint.y - 22}
          width={136}
          height={32}
        >
          <div className="inline-flex max-w-34 rounded-md border bg-background px-2 py-1 text-center text-xs text-muted-foreground shadow-sm">
            {connector.label}
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

function SwimlaneStepShape({ step }: { step: RenderSwimlaneDiagramStep }) {
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
        {step.summary ? (
          <div className="line-clamp-2 text-xs leading-4 text-muted-foreground">
            {step.summary.hiddenSteps.length} steps hidden
          </div>
        ) : step.description ? (
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

function getSwimlaneLaneProjection(
  lanes: readonly PositionedSwimlaneDiagramLane[],
  steps: readonly PositionedSwimlaneDiagramStep[],
  collapsedLaneIds: ReadonlySet<string>,
) {
  const hiddenStepToProxyId = new Map<string, string>();
  const summarySteps: RenderSwimlaneDiagramStep[] = [];

  for (const lane of lanes) {
    if (!collapsedLaneIds.has(lane.id)) {
      continue;
    }

    const laneSteps = steps.filter((step) => step.laneId === lane.id);
    if (!laneSteps.length) {
      continue;
    }

    const summaryStep: RenderSwimlaneDiagramStep = {
      id: `${LANE_SUMMARY_PREFIX}${lane.id}`,
      laneId: lane.id,
      label: lane.label,
      description: `${laneSteps.length} ${laneSteps.length === 1 ? "step" : "steps"}`,
      tone: lane.tone ?? "muted",
      x: lane.x + lane.width / 2 - STEP_WIDTH / 2,
      y: lane.y + lane.height / 2 - STEP_HEIGHT / 2,
      width: STEP_WIDTH,
      height: STEP_HEIGHT,
      summary: { lane, hiddenSteps: laneSteps },
    };

    summarySteps.push(summaryStep);

    for (const step of laneSteps) {
      hiddenStepToProxyId.set(step.id, summaryStep.id);
    }
  }

  return { hiddenStepToProxyId, summarySteps };
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
