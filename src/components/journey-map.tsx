"use client";

import * as React from "react";

import { cn } from "../internal/cn";

import {
  defaultToneClasses,
  getReactNodeAccessibleName,
  type DiagramTone,
  useDiagramZoomControls,
} from "./diagram-utils";

export type JourneyMapPhase = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  tone?: DiagramTone;
};

export type JourneyMapTouchpoint = {
  id: string;
  phaseId: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  sentiment?: "positive" | "neutral" | "negative";
  owner?: React.ReactNode;
  meta?: React.ReactNode;
};

export type JourneyMapLane = {
  id: string;
  label: React.ReactNode;
};

export type JourneyMapItem = {
  id: string;
  phaseId: string;
  laneId: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  tone?: DiagramTone;
};

export type JourneyMapTouchpointAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (touchpoint: JourneyMapTouchpoint) => void;
};

export type JourneyMapItemAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (item: JourneyMapItem) => void;
};

export type JourneyMapProps = Omit<React.ComponentProps<"figure">, "children"> & {
  phases: readonly JourneyMapPhase[];
  touchpoints?: readonly JourneyMapTouchpoint[];
  lanes?: readonly JourneyMapLane[];
  items?: readonly JourneyMapItem[];
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  selectedTouchpointId?: string | null;
  selectedItemId?: string | null;
  getTouchpointDisabled?: (touchpoint: JourneyMapTouchpoint) => boolean;
  getItemDisabled?: (item: JourneyMapItem) => boolean;
  touchpointActions?:
    | readonly JourneyMapTouchpointAction[]
    | ((touchpoint: JourneyMapTouchpoint) => readonly JourneyMapTouchpointAction[]);
  itemActions?:
    | readonly JourneyMapItemAction[]
    | ((item: JourneyMapItem) => readonly JourneyMapItemAction[]);
  onTouchpointSelect?: (touchpoint: JourneyMapTouchpoint) => void;
  onItemSelect?: (item: JourneyMapItem) => void;
  onTouchpointActionSelect?: (
    action: JourneyMapTouchpointAction,
    touchpoint: JourneyMapTouchpoint,
  ) => void;
  onItemActionSelect?: (action: JourneyMapItemAction, item: JourneyMapItem) => void;
  collapsedPhaseIds?: readonly string[];
  collapsedLaneIds?: readonly string[];
};

const sentimentClasses: Record<NonNullable<JourneyMapTouchpoint["sentiment"]>, string> = {
  positive: "border-emerald-500/40 bg-emerald-500/10",
  neutral: "border-border bg-background",
  negative: "border-destructive/40 bg-destructive/10",
};

function JourneyMap({
  phases,
  touchpoints = [],
  lanes = [],
  items = [],
  ariaLabel = "Journey map",
  caption,
  emptyMessage = "No journey phases.",
  selectedTouchpointId,
  selectedItemId,
  getTouchpointDisabled,
  getItemDisabled,
  touchpointActions,
  itemActions,
  onTouchpointSelect,
  onItemSelect,
  onTouchpointActionSelect,
  onItemActionSelect,
  collapsedPhaseIds = [],
  collapsedLaneIds = [],
  className,
  ...props
}: JourneyMapProps) {
  const phaseIds = React.useMemo(() => new Set(phases.map((phase) => phase.id)), [phases]);
  const laneIds = React.useMemo(() => new Set(lanes.map((lane) => lane.id)), [lanes]);
  const visiblePhases = phases.filter((phase) => !collapsedPhaseIds.includes(phase.id));
  const visiblePhaseIds = new Set(visiblePhases.map((phase) => phase.id));
  const visibleLanes = lanes.filter((lane) => !collapsedLaneIds.includes(lane.id));
  const visibleLaneIds = new Set(visibleLanes.map((lane) => lane.id));
  const validTouchpoints = touchpoints.filter(
    (touchpoint) => phaseIds.has(touchpoint.phaseId) && visiblePhaseIds.has(touchpoint.phaseId),
  );
  const validItems = items.filter(
    (item) =>
      phaseIds.has(item.phaseId) &&
      laneIds.has(item.laneId) &&
      visiblePhaseIds.has(item.phaseId) &&
      visibleLaneIds.has(item.laneId),
  );
  const collapsedPhaseSummaries = phases.filter((phase) => collapsedPhaseIds.includes(phase.id));
  const collapsedLaneSummaries = lanes.filter((lane) => collapsedLaneIds.includes(lane.id));
  const gridTemplateColumns = `repeat(${Math.max(1, visiblePhases.length)}, minmax(13rem, 1fr))`;
  const { controls: zoomControls, zoomStyle } = useDiagramZoomControls();

  return (
    <figure
      data-slot="journey-map"
      className={cn("grid min-w-0 gap-2 rounded-md border bg-card text-card-foreground", className)}
      {...props}
    >
      <div
        data-slot="journey-map-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="relative overflow-auto"
      >
        {zoomControls}
        <button type="button" className="sr-only">
          Focus journey map scroll area
        </button>
        {phases.length ? (
          <div role="grid" aria-label={ariaLabel} className="min-w-max p-3" style={zoomStyle}>
            {collapsedPhaseSummaries.length || collapsedLaneSummaries.length ? (
              <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {collapsedPhaseSummaries.map((phase) => (
                  <span
                    key={phase.id}
                    data-slot="journey-map-phase-summary"
                    className="rounded-md border px-2 py-1"
                  >
                    {phase.label}:{" "}
                    {touchpoints.filter((touchpoint) => touchpoint.phaseId === phase.id).length +
                      items.filter((item) => item.phaseId === phase.id).length}{" "}
                    hidden
                  </span>
                ))}
                {collapsedLaneSummaries.map((lane) => (
                  <span
                    key={lane.id}
                    data-slot="journey-map-lane-summary"
                    className="rounded-md border px-2 py-1"
                  >
                    {lane.label}: {items.filter((item) => item.laneId === lane.id).length} hidden
                  </span>
                ))}
              </div>
            ) : null}
            <div
              role="row"
              data-slot="journey-map-phases"
              className="grid gap-3"
              style={{ gridTemplateColumns }}
            >
              {visiblePhases.map((phase) => (
                <div
                  key={phase.id}
                  role="columnheader"
                  data-slot="journey-map-phase"
                  data-tone={phase.tone ?? "default"}
                  className={cn(
                    "grid min-h-24 gap-1 rounded-md border p-3",
                    defaultToneClasses[phase.tone ?? "default"],
                  )}
                >
                  <div className="font-medium leading-5">{phase.label}</div>
                  {phase.description ? (
                    <div className="text-sm text-muted-foreground">{phase.description}</div>
                  ) : null}
                </div>
              ))}
            </div>
            <div
              role="row"
              data-slot="journey-map-touchpoints"
              className="mt-3 grid gap-3"
              style={{ gridTemplateColumns }}
            >
              {visiblePhases.map((phase) => (
                <div key={phase.id} role="gridcell" className="grid content-start gap-2">
                  {validTouchpoints
                    .filter((touchpoint) => touchpoint.phaseId === phase.id)
                    .map((touchpoint) => (
                      <JourneyTouchpoint
                        key={touchpoint.id}
                        touchpoint={touchpoint}
                        selected={selectedTouchpointId === touchpoint.id}
                        disabled={Boolean(getTouchpointDisabled?.(touchpoint))}
                        actions={
                          typeof touchpointActions === "function"
                            ? touchpointActions(touchpoint)
                            : (touchpointActions ?? [])
                        }
                        onTouchpointSelect={onTouchpointSelect}
                        onTouchpointActionSelect={onTouchpointActionSelect}
                      />
                    ))}
                </div>
              ))}
            </div>
            {visibleLanes.map((lane) => (
              <div
                key={lane.id}
                role="row"
                data-slot="journey-map-lane"
                className="mt-3 grid gap-3"
                style={{ gridTemplateColumns }}
              >
                {visiblePhases.map((phase, index) => (
                  <div
                    key={`${lane.id}-${phase.id}`}
                    role="gridcell"
                    className="grid content-start gap-2"
                  >
                    {index === 0 ? (
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        {lane.label}
                      </div>
                    ) : null}
                    {validItems
                      .filter((item) => item.phaseId === phase.id && item.laneId === lane.id)
                      .map((item) => (
                        <JourneyItem
                          key={item.id}
                          item={item}
                          selected={selectedItemId === item.id}
                          disabled={Boolean(getItemDisabled?.(item))}
                          actions={
                            typeof itemActions === "function"
                              ? itemActions(item)
                              : (itemActions ?? [])
                          }
                          onItemSelect={onItemSelect}
                          onItemActionSelect={onItemActionSelect}
                        />
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div
            role="grid"
            aria-label={ariaLabel}
            className="p-6 text-center text-sm text-muted-foreground"
          >
            {emptyMessage}
          </div>
        )}
      </div>
      {caption ? (
        <figcaption className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function JourneyTouchpoint({
  touchpoint,
  selected,
  disabled,
  actions,
  onTouchpointSelect,
  onTouchpointActionSelect,
}: {
  touchpoint: JourneyMapTouchpoint;
  selected: boolean;
  disabled: boolean;
  actions: readonly JourneyMapTouchpointAction[];
  onTouchpointSelect?: JourneyMapProps["onTouchpointSelect"];
  onTouchpointActionSelect?: JourneyMapProps["onTouchpointActionSelect"];
}) {
  return (
    <div
      role={onTouchpointSelect && !actions.length ? "button" : undefined}
      aria-label={
        onTouchpointSelect ? getReactNodeAccessibleName(touchpoint.label, touchpoint.id) : undefined
      }
      aria-pressed={onTouchpointSelect ? selected : undefined}
      data-slot="journey-map-touchpoint"
      data-sentiment={touchpoint.sentiment ?? "neutral"}
      data-selected={selected ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      tabIndex={onTouchpointSelect && !disabled ? 0 : undefined}
      className={cn(
        "grid gap-1 rounded-md border p-3 text-sm outline-none",
        sentimentClasses[touchpoint.sentiment ?? "neutral"],
        selected && "ring-2 ring-primary",
        disabled && "opacity-60",
        onTouchpointSelect && "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50",
      )}
      onClick={onTouchpointSelect && !disabled ? () => onTouchpointSelect(touchpoint) : undefined}
      onKeyDown={
        onTouchpointSelect
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onTouchpointSelect(touchpoint);
              }
            }
          : undefined
      }
    >
      <div className="font-medium leading-5">{touchpoint.label}</div>
      {touchpoint.description ? (
        <div className="text-muted-foreground">{touchpoint.description}</div>
      ) : null}
      {touchpoint.owner || touchpoint.meta ? (
        <div className="text-xs text-muted-foreground">
          {touchpoint.owner}
          {touchpoint.owner && touchpoint.meta ? " · " : null}
          {touchpoint.meta}
        </div>
      ) : null}
      <JourneyActions
        actions={actions}
        onSelect={(action) => {
          action.onSelect?.(touchpoint);
          onTouchpointActionSelect?.(action, touchpoint);
        }}
      />
    </div>
  );
}

function JourneyItem({
  item,
  selected,
  disabled,
  actions,
  onItemSelect,
  onItemActionSelect,
}: {
  item: JourneyMapItem;
  selected: boolean;
  disabled: boolean;
  actions: readonly JourneyMapItemAction[];
  onItemSelect?: JourneyMapProps["onItemSelect"];
  onItemActionSelect?: JourneyMapProps["onItemActionSelect"];
}) {
  return (
    <div
      role={onItemSelect && !actions.length ? "button" : undefined}
      aria-label={onItemSelect ? getReactNodeAccessibleName(item.label, item.id) : undefined}
      aria-pressed={onItemSelect ? selected : undefined}
      data-slot="journey-map-item"
      data-tone={item.tone ?? "default"}
      data-selected={selected ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      tabIndex={onItemSelect && !disabled ? 0 : undefined}
      className={cn(
        "grid gap-1 rounded-md border p-3 text-sm outline-none",
        defaultToneClasses[item.tone ?? "default"],
        selected && "ring-2 ring-primary",
        disabled && "opacity-60",
        onItemSelect && "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50",
      )}
      onClick={onItemSelect && !disabled ? () => onItemSelect(item) : undefined}
      onKeyDown={
        onItemSelect
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onItemSelect(item);
              }
            }
          : undefined
      }
    >
      <div className="font-medium leading-5">{item.label}</div>
      {item.description ? <div className="text-muted-foreground">{item.description}</div> : null}
      <JourneyActions
        actions={actions}
        onSelect={(action) => {
          action.onSelect?.(item);
          onItemActionSelect?.(action, item);
        }}
      />
    </div>
  );
}

function JourneyActions<
  TAction extends {
    id: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    disabled?: boolean;
    destructive?: boolean;
  },
>({ actions, onSelect }: { actions: readonly TAction[]; onSelect: (action: TAction) => void }) {
  if (!actions.length) {
    return null;
  }

  return (
    <div className="flex gap-1">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          data-slot="journey-map-action"
          aria-label={getReactNodeAccessibleName(action.label, action.id)}
          disabled={action.disabled}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-xs font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            action.destructive && "text-destructive",
          )}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(action);
          }}
        >
          {action.icon ?? action.label}
        </button>
      ))}
    </div>
  );
}

export { JourneyMap };
export type { DiagramTone as JourneyMapTone };
