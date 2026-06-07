"use client";

import * as React from "react";

import { cn } from "@moritzbrantner/ui";

type GanttChartDate = Date | number | string;
type GanttChartTone = "default" | "accent" | "success" | "warning" | "danger" | "muted";

type GanttChartTask = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  startDate: GanttChartDate;
  endDate: GanttChartDate;
  earliestStartDate?: GanttChartDate;
  deadlineDate?: GanttChartDate;
  progress?: number;
  tone?: GanttChartTone;
};

type GanttChartProps = Omit<React.ComponentProps<"figure">, "children"> & {
  tasks?: readonly GanttChartTask[];
  startDate?: GanttChartDate;
  endDate?: GanttChartDate;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  rowHeight?: number;
  width?: number;
  tickCount?: number;
  formatDate?: (date: Date) => string;
};

type PreparedGanttTask = GanttChartTask & {
  start: number;
  end: number;
  earliestStart?: number;
  deadline?: number;
};

const DEFAULT_GANTT_WIDTH = 880;
const GANTT_LABEL_WIDTH = 208;
const GANTT_PADDING = {
  top: 42,
  right: 28,
  bottom: 34,
  left: 16,
} as const;
const DEFAULT_ROW_HEIGHT = 58;
const DAY_MS = 86_400_000;

const taskToneClasses: Record<GanttChartTone, string> = {
  default: "fill-primary",
  accent: "fill-sky-600 dark:fill-sky-400",
  success: "fill-emerald-600 dark:fill-emerald-400",
  warning: "fill-amber-600 dark:fill-amber-400",
  danger: "fill-destructive",
  muted: "fill-muted-foreground",
};

function GanttChart({
  tasks = [],
  startDate,
  endDate,
  ariaLabel = "Gantt chart",
  caption,
  emptyMessage = "No scheduled tasks to display.",
  rowHeight = DEFAULT_ROW_HEIGHT,
  width = DEFAULT_GANTT_WIDTH,
  tickCount = 6,
  formatDate = formatShortDate,
  className,
  ...props
}: GanttChartProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
  const preparedTasks = React.useMemo(() => prepareGanttTasks(tasks), [tasks]);
  const domain = React.useMemo(
    () => getGanttDomain(preparedTasks, startDate, endDate),
    [endDate, preparedTasks, startDate],
  );
  const height =
    GANTT_PADDING.top + GANTT_PADDING.bottom + Math.max(1, preparedTasks.length) * rowHeight;
  const chartX = GANTT_PADDING.left + GANTT_LABEL_WIDTH;
  const chartWidth = Math.max(220, width - chartX - GANTT_PADDING.right);
  const ticks = getDateTicks(domain.start, domain.end, tickCount);
  const markerId = `gantt-deadline-${markerPrefix}`;

  return (
    <figure
      data-slot="gantt-chart"
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="gantt-chart-scroll-area"
        aria-label={`${ariaLabel} scroll area`}
        role="region"
        className="overflow-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        tabIndex={0}
      >
        <svg
          data-slot="gantt-chart-svg"
          role="img"
          aria-label={ariaLabel}
          viewBox={`0 0 ${width} ${height}`}
          className="block w-full min-w-220 text-foreground"
        >
          <defs>
            <marker id={markerId} markerWidth="8" markerHeight="8" refX="4" refY="4">
              <path d="M 0 0 L 8 4 L 0 8 z" className="fill-destructive" />
            </marker>
          </defs>
          <g data-slot="gantt-chart-grid">
            {ticks.map((tick) => {
              const x = scaleTime(tick, domain.start, domain.end, chartX, chartWidth);

              return (
                <g key={`tick-${tick}`}>
                  <line
                    x1={x}
                    x2={x}
                    y1={GANTT_PADDING.top - 12}
                    y2={height - GANTT_PADDING.bottom}
                    className="stroke-border"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={22}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[11px]"
                  >
                    {formatDate(new Date(tick))}
                  </text>
                </g>
              );
            })}
            {preparedTasks.map((task, index) => {
              const y = getRowY(index, rowHeight);

              return (
                <line
                  key={`row-${task.id}`}
                  x1={GANTT_PADDING.left}
                  x2={width - GANTT_PADDING.right}
                  y1={y + rowHeight}
                  y2={y + rowHeight}
                  className="stroke-border/80"
                  strokeWidth="1"
                />
              );
            })}
          </g>
          {preparedTasks.length ? (
            <g data-slot="gantt-chart-tasks">
              {preparedTasks.map((task, index) => (
                <GanttChartTaskShape
                  key={task.id}
                  task={task}
                  index={index}
                  rowHeight={rowHeight}
                  chartX={chartX}
                  chartWidth={chartWidth}
                  domainStart={domain.start}
                  domainEnd={domain.end}
                  markerId={markerId}
                  formatDate={formatDate}
                />
              ))}
            </g>
          ) : (
            <text
              data-slot="gantt-chart-empty"
              x={width / 2}
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
          data-slot="gantt-chart-caption"
          className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground"
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function GanttChartTaskShape({
  task,
  index,
  rowHeight,
  chartX,
  chartWidth,
  domainStart,
  domainEnd,
  markerId,
  formatDate,
}: {
  task: PreparedGanttTask;
  index: number;
  rowHeight: number;
  chartX: number;
  chartWidth: number;
  domainStart: number;
  domainEnd: number;
  markerId: string;
  formatDate: (date: Date) => string;
}) {
  const rowY = getRowY(index, rowHeight);
  const barHeight = Math.min(24, Math.max(16, rowHeight - 26));
  const barY = rowY + (rowHeight - barHeight) / 2;
  const startX = scaleTime(task.start, domainStart, domainEnd, chartX, chartWidth);
  const endX = scaleTime(task.end, domainStart, domainEnd, chartX, chartWidth);
  const barWidth = Math.max(3, endX - startX);
  const progress = Math.min(1, Math.max(0, task.progress ?? 0));
  const isLate = typeof task.deadline === "number" && task.end > task.deadline;

  return (
    <g data-slot="gantt-chart-task" data-task-id={task.id} data-late={isLate || undefined}>
      <foreignObject
        data-slot="gantt-chart-task-label"
        x={GANTT_PADDING.left}
        y={rowY + 8}
        width={GANTT_LABEL_WIDTH - 16}
        height={rowHeight - 12}
      >
        <div className="grid size-full min-w-0 content-center gap-0.5 pr-3 text-sm">
          <div className="truncate font-medium leading-5">{task.label}</div>
          {task.description ? (
            <div className="truncate text-xs leading-4 text-muted-foreground">
              {task.description}
            </div>
          ) : null}
        </div>
      </foreignObject>
      {typeof task.earliestStart === "number" ? (
        <GanttMarker
          slot="gantt-chart-earliest-start"
          timestamp={task.earliestStart}
          domainStart={domainStart}
          domainEnd={domainEnd}
          chartX={chartX}
          chartWidth={chartWidth}
          y1={barY - 9}
          y2={barY + barHeight + 9}
          className="stroke-emerald-600 dark:stroke-emerald-400"
          label="Earliest"
          labelClassName="fill-emerald-700 dark:fill-emerald-300"
          formatDate={formatDate}
        />
      ) : null}
      <rect
        data-slot="gantt-chart-task-bar"
        x={startX}
        y={barY}
        width={barWidth}
        height={barHeight}
        rx="5"
        className={cn(taskToneClasses[isLate ? "danger" : (task.tone ?? "default")])}
      >
        <title>{`${formatDate(new Date(task.start))} - ${formatDate(new Date(task.end))}`}</title>
      </rect>
      {progress > 0 ? (
        <rect
          data-slot="gantt-chart-task-progress"
          x={startX}
          y={barY}
          width={Math.max(2, barWidth * progress)}
          height={barHeight}
          rx="5"
          className="fill-background/35"
        />
      ) : null}
      {typeof task.deadline === "number" ? (
        <GanttMarker
          slot="gantt-chart-deadline"
          timestamp={task.deadline}
          domainStart={domainStart}
          domainEnd={domainEnd}
          chartX={chartX}
          chartWidth={chartWidth}
          y1={barY - 11}
          y2={barY + barHeight + 11}
          className="stroke-destructive"
          label="Deadline"
          labelClassName="fill-destructive"
          markerEnd={`url(#${markerId})`}
          formatDate={formatDate}
        />
      ) : null}
    </g>
  );
}

function GanttMarker({
  slot,
  timestamp,
  domainStart,
  domainEnd,
  chartX,
  chartWidth,
  y1,
  y2,
  className,
  label,
  labelClassName,
  markerEnd,
  formatDate,
}: {
  slot: string;
  timestamp: number;
  domainStart: number;
  domainEnd: number;
  chartX: number;
  chartWidth: number;
  y1: number;
  y2: number;
  className: string;
  label: string;
  labelClassName: string;
  markerEnd?: string;
  formatDate: (date: Date) => string;
}) {
  const x = scaleTime(timestamp, domainStart, domainEnd, chartX, chartWidth);

  return (
    <g data-slot={slot}>
      <line
        x1={x}
        x2={x}
        y1={y1}
        y2={y2}
        className={className}
        strokeDasharray="4 4"
        strokeWidth="2"
        markerEnd={markerEnd}
      >
        <title>{`${label}: ${formatDate(new Date(timestamp))}`}</title>
      </line>
      <text x={x + 5} y={y1 - 2} className={cn("text-[10px] font-medium", labelClassName)}>
        {label}
      </text>
    </g>
  );
}

function prepareGanttTasks(tasks: readonly GanttChartTask[]) {
  return tasks
    .map((task) => {
      const start = toDayTimestamp(task.startDate);
      const requestedEnd = toDayTimestamp(task.endDate);
      const end = Math.max(start + DAY_MS, requestedEnd);
      const earliestStart = task.earliestStartDate ? toDayTimestamp(task.earliestStartDate) : NaN;
      const deadline = task.deadlineDate ? toDayTimestamp(task.deadlineDate) : NaN;

      return {
        ...task,
        start,
        end,
        earliestStart: Number.isFinite(earliestStart) ? earliestStart : undefined,
        deadline: Number.isFinite(deadline) ? deadline : undefined,
      };
    })
    .filter((task) => Number.isFinite(task.start) && Number.isFinite(task.end));
}

function getGanttDomain(
  tasks: readonly PreparedGanttTask[],
  startDate?: GanttChartDate,
  endDate?: GanttChartDate,
) {
  const taskDates = tasks.flatMap((task) => [
    task.start,
    task.end,
    task.earliestStart ?? task.start,
    task.deadline ?? task.end,
  ]);
  const now = toDayTimestamp(new Date());
  const minTaskDate = Math.min(...taskDates, now);
  const maxTaskDate = Math.max(...taskDates, now + DAY_MS);
  const requestedStart = startDate ? toDayTimestamp(startDate) : NaN;
  const requestedEnd = endDate ? toDayTimestamp(endDate) : NaN;
  const start = Number.isFinite(requestedStart) ? requestedStart : minTaskDate;
  const end = Math.max(Number.isFinite(requestedEnd) ? requestedEnd : maxTaskDate, start + DAY_MS);

  return { start, end };
}

function getRowY(index: number, rowHeight: number) {
  return GANTT_PADDING.top + index * rowHeight;
}

function toDayTimestamp(date: GanttChartDate) {
  const parsed = date instanceof Date ? date : new Date(date);

  return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function getDateTicks(start: number, end: number, requestedCount: number) {
  const count = Math.max(2, requestedCount);
  const step = (end - start) / (count - 1);

  return Array.from({ length: count }, (_, index) => start + step * index);
}

function scaleTime(value: number, min: number, max: number, x: number, width: number) {
  return x + ((value - min) / Math.max(1, max - min)) * width;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export { GanttChart };
export type { GanttChartDate, GanttChartProps, GanttChartTask, GanttChartTone };
