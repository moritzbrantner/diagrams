"use client";

import { cn } from "@moritzbrantner/ui";
import * as React from "react";

import { defaultToneClasses, type DiagramTone } from "./diagram-utils";

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

export type JourneyMapProps = Omit<React.ComponentProps<"figure">, "children"> & {
  phases: readonly JourneyMapPhase[];
  touchpoints?: readonly JourneyMapTouchpoint[];
  lanes?: readonly JourneyMapLane[];
  items?: readonly JourneyMapItem[];
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
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
  className,
  ...props
}: JourneyMapProps) {
  const phaseIds = React.useMemo(() => new Set(phases.map((phase) => phase.id)), [phases]);
  const laneIds = React.useMemo(() => new Set(lanes.map((lane) => lane.id)), [lanes]);
  const validTouchpoints = touchpoints.filter((touchpoint) => phaseIds.has(touchpoint.phaseId));
  const validItems = items.filter((item) => phaseIds.has(item.phaseId) && laneIds.has(item.laneId));
  const gridTemplateColumns = `repeat(${Math.max(1, phases.length)}, minmax(13rem, 1fr))`;

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
        className="overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus journey map scroll area
        </button>
        {phases.length ? (
          <div role="grid" aria-label={ariaLabel} className="min-w-max p-3">
            <div
              role="row"
              data-slot="journey-map-phases"
              className="grid gap-3"
              style={{ gridTemplateColumns }}
            >
              {phases.map((phase) => (
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
              {phases.map((phase) => (
                <div key={phase.id} role="gridcell" className="grid content-start gap-2">
                  {validTouchpoints
                    .filter((touchpoint) => touchpoint.phaseId === phase.id)
                    .map((touchpoint) => (
                      <div
                        key={touchpoint.id}
                        data-slot="journey-map-touchpoint"
                        data-sentiment={touchpoint.sentiment ?? "neutral"}
                        className={cn(
                          "grid gap-1 rounded-md border p-3 text-sm",
                          sentimentClasses[touchpoint.sentiment ?? "neutral"],
                        )}
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
                      </div>
                    ))}
                </div>
              ))}
            </div>
            {lanes.map((lane) => (
              <div
                key={lane.id}
                role="row"
                data-slot="journey-map-lane"
                className="mt-3 grid gap-3"
                style={{ gridTemplateColumns }}
              >
                {phases.map((phase, index) => (
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
                        <div
                          key={item.id}
                          data-slot="journey-map-item"
                          data-tone={item.tone ?? "default"}
                          className={cn(
                            "grid gap-1 rounded-md border p-3 text-sm",
                            defaultToneClasses[item.tone ?? "default"],
                          )}
                        >
                          <div className="font-medium leading-5">{item.label}</div>
                          {item.description ? (
                            <div className="text-muted-foreground">{item.description}</div>
                          ) : null}
                        </div>
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

export { JourneyMap };
export type { DiagramTone as JourneyMapTone };
