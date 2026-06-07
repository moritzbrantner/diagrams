"use client";

import * as React from "react";

import { cn } from "@moritzbrantner/ui";

import { getReactNodeAccessibleName, isActivationKey } from "./diagram-utils";

type BurndownChartDate = Date | number | string;

type BurndownChartPoint = {
  id?: string;
  date: BurndownChartDate;
  remaining: number;
};

type BurndownChartPointAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (point: PreparedBurndownPoint) => void;
};

type BurndownChartProps = Omit<React.ComponentProps<"figure">, "children"> & {
  points?: readonly BurndownChartPoint[];
  startDate?: BurndownChartDate;
  endDate?: BurndownChartDate;
  totalWork?: number;
  targetRemaining?: number;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  height?: number;
  xTickCount?: number;
  yTickCount?: number;
  formatDate?: (date: Date) => string;
  formatValue?: (value: number) => string;
  selectedPointId?: string | null;
  focusedPointId?: string | null;
  defaultFocusedPointId?: string | null;
  keyboardMode?: "nodes" | "none";
  getPointDisabled?: (point: PreparedBurndownPoint) => boolean;
  onPointSelect?: (point: PreparedBurndownPoint) => void;
  onPointDeselect?: () => void;
  onFocusedPointIdChange?: (point: PreparedBurndownPoint | null) => void;
  pointActions?:
    | readonly BurndownChartPointAction[]
    | ((point: PreparedBurndownPoint) => readonly BurndownChartPointAction[]);
  onPointActionSelect?: (action: BurndownChartPointAction, point: PreparedBurndownPoint) => void;
  showVariance?: boolean;
};

type PreparedBurndownPoint = BurndownChartPoint & {
  timestamp: number;
  id: string;
};

const BURNDOWN_WIDTH = 760;
const DEFAULT_BURNDOWN_HEIGHT = 320;
const BURNDOWN_PADDING = {
  top: 24,
  right: 28,
  bottom: 46,
  left: 58,
} as const;
const DAY_MS = 86_400_000;

function BurndownChart({
  points = [],
  startDate,
  endDate,
  totalWork,
  targetRemaining = 0,
  ariaLabel = "Burndown chart",
  caption,
  emptyMessage = "No burndown data to display.",
  height = DEFAULT_BURNDOWN_HEIGHT,
  xTickCount = 5,
  yTickCount = 5,
  formatDate = formatShortDate,
  formatValue = formatWorkValue,
  selectedPointId,
  focusedPointId,
  defaultFocusedPointId,
  keyboardMode,
  getPointDisabled,
  onPointSelect,
  onPointDeselect,
  onFocusedPointIdChange,
  pointActions,
  onPointActionSelect,
  showVariance = false,
  className,
  ...props
}: BurndownChartProps) {
  const preparedPoints = React.useMemo(() => prepareBurndownPoints(points), [points]);
  const domain = React.useMemo(
    () =>
      getBurndownDomain({
        points: preparedPoints,
        startDate,
        endDate,
        totalWork,
        targetRemaining,
      }),
    [endDate, preparedPoints, startDate, targetRemaining, totalWork],
  );
  const hasData = preparedPoints.length > 0 && domain.maxValue > domain.minValue;
  const plot = getPlotArea(height);
  const yTicks = getNumberTicks(domain.minValue, domain.maxValue, yTickCount);
  const xTicks = getDateTicks(domain.start, domain.end, xTickCount);
  const actualPath = hasData
    ? pointsToPath(
        preparedPoints.map((point) => ({
          x: scaleTime(point.timestamp, domain.start, domain.end, plot.x, plot.width),
          y: scaleNumber(point.remaining, domain.minValue, domain.maxValue, plot.y, plot.height),
        })),
      )
    : "";
  const idealPath = hasData
    ? pointsToPath([
        {
          x: scaleTime(domain.start, domain.start, domain.end, plot.x, plot.width),
          y: scaleNumber(domain.totalWork, domain.minValue, domain.maxValue, plot.y, plot.height),
        },
        {
          x: scaleTime(domain.end, domain.start, domain.end, plot.x, plot.width),
          y: scaleNumber(targetRemaining, domain.minValue, domain.maxValue, plot.y, plot.height),
        },
      ])
    : "";
  const resolvedKeyboardMode = keyboardMode ?? (onPointSelect || pointActions ? "nodes" : "none");
  const pointRefs = React.useRef(new Map<string, SVGCircleElement>());
  const [internalFocusedPointId, setInternalFocusedPointId] = React.useState<string | null>(
    () => defaultFocusedPointId ?? null,
  );
  const enabledPoints = React.useMemo(
    () => preparedPoints.filter((point) => !getPointDisabled?.(point)),
    [getPointDisabled, preparedPoints],
  );
  const effectiveFocusedPointId =
    resolvedKeyboardMode === "nodes"
      ? (enabledPoints.find(
          (point) =>
            point.id === (focusedPointId !== undefined ? focusedPointId : internalFocusedPointId),
        )?.id ??
        enabledPoints[0]?.id ??
        null)
      : null;
  const getIdealRemaining = React.useCallback(
    (timestamp: number) => {
      const ratio = (timestamp - domain.start) / Math.max(1, domain.end - domain.start);
      return domain.totalWork + (targetRemaining - domain.totalWork) * ratio;
    },
    [domain.end, domain.start, domain.totalWork, targetRemaining],
  );

  return (
    <figure
      data-slot="burndown-chart"
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="burndown-chart-scroll-area"
        aria-label={`${ariaLabel} scroll area`}
        role="region"
        className="overflow-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        tabIndex={0}
      >
        <svg
          data-slot="burndown-chart-svg"
          role={onPointSelect || pointActions ? "group" : "img"}
          aria-label={ariaLabel}
          viewBox={`0 0 ${BURNDOWN_WIDTH} ${height}`}
          className="block w-full min-w-180 text-foreground"
        >
          <g data-slot="burndown-chart-grid">
            {yTicks.map((tick) => {
              const y = scaleNumber(tick, domain.minValue, domain.maxValue, plot.y, plot.height);

              return (
                <g key={`y-${tick}`}>
                  <line
                    x1={plot.x}
                    x2={plot.x + plot.width}
                    y1={y}
                    y2={y}
                    className="stroke-border"
                    strokeWidth="1"
                  />
                  <text
                    x={plot.x - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px]"
                  >
                    {formatValue(tick)}
                  </text>
                </g>
              );
            })}
            {xTicks.map((tick) => {
              const x = scaleTime(tick, domain.start, domain.end, plot.x, plot.width);

              return (
                <g key={`x-${tick}`}>
                  <line
                    x1={x}
                    x2={x}
                    y1={plot.y}
                    y2={plot.y + plot.height}
                    className="stroke-border/70"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={plot.y + plot.height + 24}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[11px]"
                  >
                    {formatDate(new Date(tick))}
                  </text>
                </g>
              );
            })}
          </g>
          <line
            data-slot="burndown-chart-x-axis"
            x1={plot.x}
            x2={plot.x + plot.width}
            y1={plot.y + plot.height}
            y2={plot.y + plot.height}
            className="stroke-muted-foreground"
            strokeWidth="1.5"
          />
          <line
            data-slot="burndown-chart-y-axis"
            x1={plot.x}
            x2={plot.x}
            y1={plot.y}
            y2={plot.y + plot.height}
            className="stroke-muted-foreground"
            strokeWidth="1.5"
          />
          {hasData ? (
            <>
              <path
                data-slot="burndown-chart-ideal-line"
                d={idealPath}
                fill="none"
                className="stroke-muted-foreground"
                strokeDasharray="6 6"
                strokeWidth="2"
              />
              <path
                data-slot="burndown-chart-actual-line"
                d={actualPath}
                fill="none"
                className="stroke-primary"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              {showVariance
                ? preparedPoints.map((point) => {
                    const x = scaleTime(
                      point.timestamp,
                      domain.start,
                      domain.end,
                      plot.x,
                      plot.width,
                    );
                    const actualY = scaleNumber(
                      point.remaining,
                      domain.minValue,
                      domain.maxValue,
                      plot.y,
                      plot.height,
                    );
                    const idealY = scaleNumber(
                      getIdealRemaining(point.timestamp),
                      domain.minValue,
                      domain.maxValue,
                      plot.y,
                      plot.height,
                    );

                    return (
                      <line
                        key={`variance-${point.id}`}
                        data-slot="burndown-chart-variance"
                        x1={x}
                        x2={x}
                        y1={idealY}
                        y2={actualY}
                        className="stroke-amber-500"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                      />
                    );
                  })
                : null}
              {preparedPoints.map((point) => {
                const x = scaleTime(point.timestamp, domain.start, domain.end, plot.x, plot.width);
                const y = scaleNumber(
                  point.remaining,
                  domain.minValue,
                  domain.maxValue,
                  plot.y,
                  plot.height,
                );

                return (
                  <circle
                    key={point.id}
                    data-slot="burndown-chart-point"
                    data-point-id={point.id}
                    data-selected={selectedPointId === point.id ? "true" : undefined}
                    data-focused={effectiveFocusedPointId === point.id ? "true" : undefined}
                    data-disabled={getPointDisabled?.(point) ? "true" : undefined}
                    role={onPointSelect ? "button" : undefined}
                    aria-label={
                      onPointSelect
                        ? `${formatDate(new Date(point.timestamp))}: ${formatValue(point.remaining)}`
                        : undefined
                    }
                    aria-pressed={onPointSelect ? selectedPointId === point.id : undefined}
                    tabIndex={
                      resolvedKeyboardMode === "nodes" &&
                      effectiveFocusedPointId === point.id &&
                      !getPointDisabled?.(point)
                        ? 0
                        : -1
                    }
                    cx={x}
                    cy={y}
                    r={selectedPointId === point.id || effectiveFocusedPointId === point.id ? 6 : 4}
                    className={cn(
                      "fill-background outline-none",
                      selectedPointId === point.id ? "stroke-primary" : "stroke-primary",
                      getPointDisabled?.(point) && "opacity-60",
                      onPointSelect && "cursor-pointer",
                    )}
                    strokeWidth={selectedPointId === point.id ? 3 : 2}
                    onClick={
                      onPointSelect && !getPointDisabled?.(point)
                        ? () => onPointSelect(point)
                        : undefined
                    }
                    onFocus={() => {
                      if (focusedPointId === undefined) {
                        setInternalFocusedPointId(point.id);
                      }
                      onFocusedPointIdChange?.(point);
                    }}
                    onKeyDown={(event) => {
                      if (resolvedKeyboardMode === "none" || getPointDisabled?.(point)) {
                        return;
                      }
                      if (isActivationKey(event)) {
                        event.preventDefault();
                        onPointSelect?.(point);
                        return;
                      }
                      if (event.key === "Escape") {
                        if (selectedPointId != null && onPointDeselect) {
                          event.preventDefault();
                          onPointDeselect();
                        }
                        return;
                      }
                      if (
                        event.key !== "ArrowRight" &&
                        event.key !== "ArrowDown" &&
                        event.key !== "ArrowLeft" &&
                        event.key !== "ArrowUp"
                      ) {
                        return;
                      }
                      event.preventDefault();
                      const index = enabledPoints.findIndex(
                        (enabledPoint) => enabledPoint.id === point.id,
                      );
                      const next =
                        event.key === "ArrowRight" || event.key === "ArrowDown"
                          ? enabledPoints[Math.min(enabledPoints.length - 1, index + 1)]
                          : enabledPoints[Math.max(0, index - 1)];
                      if (next) {
                        if (focusedPointId === undefined) {
                          setInternalFocusedPointId(next.id);
                        }
                        onFocusedPointIdChange?.(next);
                        queueMicrotask(() => pointRefs.current.get(next.id)?.focus());
                      }
                    }}
                    ref={(element) => {
                      if (element) {
                        pointRefs.current.set(point.id, element);
                      } else {
                        pointRefs.current.delete(point.id);
                      }
                    }}
                  >
                    <title>{`${formatDate(new Date(point.timestamp))}: ${formatValue(point.remaining)}`}</title>
                  </circle>
                );
              })}
              {preparedPoints.map((point) => {
                const actions =
                  typeof pointActions === "function" ? pointActions(point) : (pointActions ?? []);
                if (!actions.length || point.id !== (selectedPointId ?? effectiveFocusedPointId)) {
                  return null;
                }
                const x = scaleTime(point.timestamp, domain.start, domain.end, plot.x, plot.width);
                const y = scaleNumber(
                  point.remaining,
                  domain.minValue,
                  domain.maxValue,
                  plot.y,
                  plot.height,
                );

                return (
                  <foreignObject
                    key={`actions-${point.id}`}
                    x={x + 10}
                    y={y - 14}
                    width={actions.length * 32}
                    height={28}
                  >
                    <div className="flex gap-1">
                      {actions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          data-slot="burndown-chart-point-action"
                          aria-label={getReactNodeAccessibleName(action.label, action.id)}
                          disabled={action.disabled}
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-xs font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                            action.destructive && "text-destructive",
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            action.onSelect?.(point);
                            onPointActionSelect?.(action, point);
                          }}
                        >
                          {action.icon ?? action.label}
                        </button>
                      ))}
                    </div>
                  </foreignObject>
                );
              })}
              <g data-slot="burndown-chart-legend">
                <line
                  x1={plot.x + plot.width - 168}
                  x2={plot.x + plot.width - 140}
                  y1={plot.y + 8}
                  y2={plot.y + 8}
                  className="stroke-primary"
                  strokeWidth="3"
                />
                <text
                  x={plot.x + plot.width - 132}
                  y={plot.y + 12}
                  className="fill-muted-foreground text-xs"
                >
                  Remaining
                </text>
                <line
                  x1={plot.x + plot.width - 82}
                  x2={plot.x + plot.width - 54}
                  y1={plot.y + 8}
                  y2={plot.y + 8}
                  className="stroke-muted-foreground"
                  strokeDasharray="6 6"
                  strokeWidth="2"
                />
                <text
                  x={plot.x + plot.width - 46}
                  y={plot.y + 12}
                  className="fill-muted-foreground text-xs"
                >
                  Ideal
                </text>
              </g>
            </>
          ) : (
            <text
              data-slot="burndown-chart-empty"
              x={BURNDOWN_WIDTH / 2}
              y={height / 2}
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
          data-slot="burndown-chart-caption"
          className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground"
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function prepareBurndownPoints(points: readonly BurndownChartPoint[]) {
  return points
    .map((point, index) => ({
      ...point,
      id: point.id ?? `${toDayTimestamp(point.date)}-${index}`,
      timestamp: toDayTimestamp(point.date),
      remaining: Math.max(0, point.remaining),
    }))
    .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.remaining))
    .sort((a, b) => a.timestamp - b.timestamp);
}

function getBurndownDomain({
  points,
  startDate,
  endDate,
  totalWork,
  targetRemaining,
}: {
  points: readonly PreparedBurndownPoint[];
  startDate?: BurndownChartDate;
  endDate?: BurndownChartDate;
  totalWork?: number;
  targetRemaining: number;
}) {
  const pointStart = points[0]?.timestamp ?? toDayTimestamp(new Date());
  const pointEnd = points[points.length - 1]?.timestamp ?? pointStart + DAY_MS;
  const requestedStart = startDate ? toDayTimestamp(startDate) : NaN;
  const requestedEnd = endDate ? toDayTimestamp(endDate) : NaN;
  const start = Number.isFinite(requestedStart) ? requestedStart : pointStart;
  const end = Math.max(Number.isFinite(requestedEnd) ? requestedEnd : pointEnd, start + DAY_MS);
  const maxPointValue = Math.max(...points.map((point) => point.remaining), 0);
  const resolvedTotalWork = Math.max(totalWork ?? maxPointValue, maxPointValue, targetRemaining, 1);
  const maxValue = getNiceMax(resolvedTotalWork);

  return {
    start,
    end,
    minValue: 0,
    maxValue,
    totalWork: resolvedTotalWork,
  };
}

function getPlotArea(height: number) {
  return {
    x: BURNDOWN_PADDING.left,
    y: BURNDOWN_PADDING.top,
    width: BURNDOWN_WIDTH - BURNDOWN_PADDING.left - BURNDOWN_PADDING.right,
    height: Math.max(120, height - BURNDOWN_PADDING.top - BURNDOWN_PADDING.bottom),
  };
}

function toDayTimestamp(date: BurndownChartDate) {
  const parsed = date instanceof Date ? date : new Date(date);

  return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function getDateTicks(start: number, end: number, requestedCount: number) {
  const count = Math.max(2, requestedCount);
  const step = (end - start) / (count - 1);

  return Array.from({ length: count }, (_, index) => start + step * index);
}

function getNumberTicks(min: number, max: number, requestedCount: number) {
  const count = Math.max(2, requestedCount);
  const step = (max - min) / (count - 1);

  return Array.from({ length: count }, (_, index) => min + step * index);
}

function getNiceMax(value: number) {
  if (value <= 5) {
    return 5;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return niceNormalized * magnitude;
}

function scaleTime(value: number, min: number, max: number, x: number, width: number) {
  return x + ((value - min) / Math.max(1, max - min)) * width;
}

function scaleNumber(value: number, min: number, max: number, y: number, height: number) {
  return y + height - ((value - min) / Math.max(1, max - min)) * height;
}

function pointsToPath(points: readonly { x: number; y: number }[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatWorkValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export { BurndownChart };
export type {
  BurndownChartDate,
  BurndownChartPoint,
  BurndownChartPointAction,
  BurndownChartProps,
  PreparedBurndownPoint,
};
