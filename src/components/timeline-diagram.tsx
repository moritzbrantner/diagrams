"use client";

import * as React from "react";

import { cn } from "../lib/cn";

import {
  clampFiniteNumber,
  defaultEdgeToneClasses,
  defaultToneClasses,
  type DiagramTone,
} from "./diagram-utils";

export type TimelineDiagramDate = Date | string | number;
export type TimelineDiagramItemKind = "milestone" | "event" | "deadline" | "release";

export type TimelineDiagramItem = {
  id: string;
  date: TimelineDiagramDate;
  label: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  kind?: TimelineDiagramItemKind;
  tone?: DiagramTone;
};

export type TimelineDiagramOrientation = "horizontal" | "vertical";

export type TimelineDiagramProps = Omit<React.ComponentProps<"figure">, "children"> & {
  items: readonly TimelineDiagramItem[];
  orientation?: TimelineDiagramOrientation;
  startDate?: TimelineDiagramDate;
  endDate?: TimelineDiagramDate;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
};

type PositionedTimelineItem = TimelineDiagramItem & {
  timestamp: number;
  x: number;
  y: number;
};

const TIMELINE_WIDTH = 760;
const TIMELINE_HEIGHT = 220;
const TIMELINE_PADDING = 56;

function TimelineDiagram({
  items,
  orientation = "horizontal",
  startDate,
  endDate,
  ariaLabel = "Timeline diagram",
  caption,
  emptyMessage = "No timeline items.",
  className,
  ...props
}: TimelineDiagramProps) {
  const datedItems = React.useMemo(() => {
    const parsed = items
      .map((item) => ({ item, timestamp: toTimestamp(item.date) }))
      .filter((entry): entry is { item: TimelineDiagramItem; timestamp: number } =>
        Number.isFinite(entry.timestamp),
      );
    const explicitStart = toTimestamp(startDate);
    const explicitEnd = toTimestamp(endDate);
    const minDate = Number.isFinite(explicitStart)
      ? explicitStart
      : Math.min(...parsed.map((entry) => entry.timestamp));
    const maxDate = Number.isFinite(explicitEnd)
      ? explicitEnd
      : Math.max(...parsed.map((entry) => entry.timestamp));
    const span = Math.max(1, maxDate - minDate);

    return parsed
      .sort((a, b) => a.timestamp - b.timestamp)
      .map<PositionedTimelineItem>(({ item, timestamp }, index) => ({
        ...item,
        timestamp,
        x:
          TIMELINE_PADDING +
          ((timestamp - minDate) / span) * (TIMELINE_WIDTH - TIMELINE_PADDING * 2),
        y: index % 2 === 0 ? 76 : 148,
      }));
  }, [endDate, items, startDate]);

  return (
    <figure
      data-slot="timeline-diagram"
      data-orientation={orientation}
      className={cn("grid min-w-0 gap-2 rounded-md border bg-card text-card-foreground", className)}
      {...props}
    >
      {orientation === "vertical" ? (
        <div role="list" aria-label={ariaLabel} className="grid gap-3 p-3">
          {datedItems.length ? (
            datedItems.map((item) => (
              <div
                key={item.id}
                role="listitem"
                data-slot="timeline-diagram-item"
                data-kind={item.kind ?? "event"}
                data-tone={item.tone ?? "default"}
                className={cn(
                  "grid gap-1 rounded-md border p-3",
                  defaultToneClasses[item.tone ?? "default"],
                )}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {formatDate(item.timestamp)}
                </div>
                <div className="font-medium leading-5">{item.label}</div>
                {item.description ? (
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                ) : null}
                {item.meta ? (
                  <div className="text-xs text-muted-foreground">{item.meta}</div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
          )}
        </div>
      ) : (
        <div
          data-slot="timeline-diagram-scroll-area"
          role="region"
          aria-label={`${ariaLabel} scroll area`}
          className="overflow-auto"
        >
          <button type="button" className="sr-only">
            Focus timeline diagram scroll area
          </button>
          <svg
            data-slot="timeline-diagram-svg"
            role="img"
            aria-label={ariaLabel}
            viewBox={`0 0 ${TIMELINE_WIDTH} ${TIMELINE_HEIGHT}`}
            className="block min-h-56 w-full min-w-160"
          >
            <line
              data-slot="timeline-diagram-axis"
              x1={TIMELINE_PADDING}
              x2={TIMELINE_WIDTH - TIMELINE_PADDING}
              y1={112}
              y2={112}
              strokeWidth={2}
              className={defaultEdgeToneClasses.muted}
            />
            {datedItems.length ? (
              datedItems.map((item) => (
                <g
                  key={item.id}
                  data-slot="timeline-diagram-marker"
                  data-kind={item.kind ?? "event"}
                >
                  <line
                    x1={item.x}
                    x2={item.x}
                    y1={112}
                    y2={item.y}
                    strokeWidth={1.5}
                    className={defaultEdgeToneClasses[item.tone ?? "default"]}
                  />
                  <circle
                    cx={item.x}
                    cy={112}
                    r={6}
                    className={cn(
                      "stroke-2",
                      item.tone === "danger"
                        ? "fill-destructive stroke-destructive"
                        : "fill-background stroke-primary",
                    )}
                  />
                  <foreignObject x={item.x - 82} y={item.y - 48} width={164} height={92}>
                    <div
                      data-slot="timeline-diagram-item"
                      data-tone={item.tone ?? "default"}
                      className={cn(
                        "grid max-h-[88px] gap-1 overflow-hidden rounded-md border p-2 text-xs",
                        defaultToneClasses[item.tone ?? "default"],
                      )}
                    >
                      <div className="font-medium leading-4">{item.label}</div>
                      <div className="text-muted-foreground">{formatDate(item.timestamp)}</div>
                      {item.meta ? <div className="text-muted-foreground">{item.meta}</div> : null}
                    </div>
                  </foreignObject>
                </g>
              ))
            ) : (
              <text
                x={TIMELINE_WIDTH / 2}
                y={TIMELINE_HEIGHT / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-sm"
              >
                {emptyMessage}
              </text>
            )}
          </svg>
        </div>
      )}
      {caption ? (
        <figcaption className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function toTimestamp(date: TimelineDiagramDate | undefined) {
  if (date === undefined) {
    return Number.NaN;
  }

  const value = date instanceof Date ? date.getTime() : new Date(date).getTime();

  return clampFiniteNumber(value, Number.NaN);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(timestamp),
  );
}

export { TimelineDiagram };
export type { DiagramTone as TimelineDiagramTone };
