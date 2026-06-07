"use client";

import { cn } from "@moritzbrantner/ui";
import * as React from "react";

import {
  clampFiniteNumber,
  defaultEdgeToneClasses,
  defaultToneClasses,
  getReactNodeAccessibleName,
  isActivationKey,
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

export type TimelineDiagramItemAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (item: PositionedTimelineItem) => void;
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
  selectedItemId?: string | null;
  focusedItemId?: string | null;
  defaultFocusedItemId?: string | null;
  keyboardMode?: "nodes" | "none";
  getItemDisabled?: (item: PositionedTimelineItem) => boolean;
  itemActions?:
    | readonly TimelineDiagramItemAction[]
    | ((item: PositionedTimelineItem) => readonly TimelineDiagramItemAction[]);
  onItemSelect?: (item: PositionedTimelineItem) => void;
  onItemDeselect?: () => void;
  onFocusedItemIdChange?: (item: PositionedTimelineItem | null) => void;
  onItemActionSelect?: (action: TimelineDiagramItemAction, item: PositionedTimelineItem) => void;
  visibleRange?: { startDate?: TimelineDiagramDate; endDate?: TimelineDiagramDate };
  groupBy?: "none" | "month" | "year";
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
  selectedItemId,
  focusedItemId,
  defaultFocusedItemId,
  keyboardMode,
  getItemDisabled,
  itemActions,
  onItemSelect,
  onItemDeselect,
  onFocusedItemIdChange,
  onItemActionSelect,
  visibleRange,
  groupBy = "none",
  className,
  ...props
}: TimelineDiagramProps) {
  const datedItems = React.useMemo(() => {
    const rangeStart = toTimestamp(visibleRange?.startDate);
    const rangeEnd = toTimestamp(visibleRange?.endDate);
    const parsed = items
      .map((item) => ({ item, timestamp: toTimestamp(item.date) }))
      .filter((entry): entry is { item: TimelineDiagramItem; timestamp: number } =>
        Number.isFinite(entry.timestamp),
      )
      .filter(
        (entry) =>
          (!Number.isFinite(rangeStart) || entry.timestamp >= rangeStart) &&
          (!Number.isFinite(rangeEnd) || entry.timestamp <= rangeEnd),
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
  }, [endDate, items, startDate, visibleRange]);
  const resolvedKeyboardMode = keyboardMode ?? (onItemSelect || itemActions ? "nodes" : "none");
  const itemRefs = React.useRef(new Map<string, HTMLElement | SVGGElement>());
  const [internalFocusedItemId, setInternalFocusedItemId] = React.useState<string | null>(
    () => defaultFocusedItemId ?? null,
  );
  const enabledItems = React.useMemo(
    () => datedItems.filter((item) => !getItemDisabled?.(item)),
    [datedItems, getItemDisabled],
  );
  const effectiveFocusedItemId =
    resolvedKeyboardMode === "nodes"
      ? (enabledItems.find(
          (item) =>
            item.id === (focusedItemId !== undefined ? focusedItemId : internalFocusedItemId),
        )?.id ??
        enabledItems[0]?.id ??
        null)
      : null;
  const focusItemById = React.useCallback(
    (itemId: string | null) => {
      const nextItem = itemId ? (datedItems.find((item) => item.id === itemId) ?? null) : null;

      if (focusedItemId === undefined) {
        setInternalFocusedItemId(itemId);
      }

      onFocusedItemIdChange?.(nextItem);

      if (itemId) {
        queueMicrotask(() => itemRefs.current.get(itemId)?.focus());
      }
    },
    [datedItems, focusedItemId, onFocusedItemIdChange],
  );
  const handleItemKeyDown = React.useCallback(
    (event: React.KeyboardEvent, item: PositionedTimelineItem) => {
      if (resolvedKeyboardMode === "none" || getItemDisabled?.(item)) {
        return;
      }

      if (isActivationKey(event)) {
        event.preventDefault();
        onItemSelect?.(item);
        return;
      }

      if (event.key === "Escape") {
        if (selectedItemId != null && onItemDeselect) {
          event.preventDefault();
          onItemDeselect();
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
      const index = enabledItems.findIndex((enabledItem) => enabledItem.id === item.id);
      const next =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? enabledItems[Math.min(enabledItems.length - 1, index + 1)]
          : enabledItems[Math.max(0, index - 1)];
      focusItemById(next?.id ?? null);
    },
    [
      enabledItems,
      focusItemById,
      getItemDisabled,
      onItemDeselect,
      onItemSelect,
      resolvedKeyboardMode,
      selectedItemId,
    ],
  );

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
              <TimelineVerticalItem
                key={item.id}
                item={item}
                groupBy={groupBy}
                selected={selectedItemId === item.id}
                focused={effectiveFocusedItemId === item.id}
                disabled={Boolean(getItemDisabled?.(item))}
                keyboardMode={resolvedKeyboardMode}
                actions={
                  typeof itemActions === "function" ? itemActions(item) : (itemActions ?? [])
                }
                onItemSelect={onItemSelect}
                onItemActionSelect={onItemActionSelect}
                onItemFocus={(nextItem) => {
                  if (focusedItemId === undefined) {
                    setInternalFocusedItemId(nextItem.id);
                  }
                  onFocusedItemIdChange?.(nextItem);
                }}
                onItemKeyDown={handleItemKeyDown}
                setItemRef={(itemId, element) => {
                  if (element) {
                    itemRefs.current.set(itemId, element);
                  } else {
                    itemRefs.current.delete(itemId);
                  }
                }}
              />
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
            role={onItemSelect || itemActions ? "group" : "img"}
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
                  data-group={getTimelineGroup(item.timestamp, groupBy)}
                  data-selected={selectedItemId === item.id ? "true" : undefined}
                  data-focused={effectiveFocusedItemId === item.id ? "true" : undefined}
                  data-disabled={getItemDisabled?.(item) ? "true" : undefined}
                  role={
                    onItemSelect
                      ? (typeof itemActions === "function"
                          ? itemActions(item)
                          : (itemActions ?? [])
                        ).length
                        ? "group"
                        : "button"
                      : undefined
                  }
                  aria-label={
                    onItemSelect ? getReactNodeAccessibleName(item.label, item.id) : undefined
                  }
                  aria-pressed={
                    onItemSelect &&
                    !(typeof itemActions === "function" ? itemActions(item) : (itemActions ?? []))
                      .length
                      ? selectedItemId === item.id
                      : undefined
                  }
                  tabIndex={
                    resolvedKeyboardMode === "nodes" &&
                    effectiveFocusedItemId === item.id &&
                    !getItemDisabled?.(item)
                      ? 0
                      : -1
                  }
                  className={cn(
                    "outline-none",
                    onItemSelect && "cursor-pointer",
                    getItemDisabled?.(item) && "opacity-60",
                  )}
                  onClick={
                    onItemSelect && !getItemDisabled?.(item) ? () => onItemSelect(item) : undefined
                  }
                  onFocus={() => {
                    if (focusedItemId === undefined) {
                      setInternalFocusedItemId(item.id);
                    }
                    onFocusedItemIdChange?.(item);
                  }}
                  onKeyDown={(event) => handleItemKeyDown(event, item)}
                  ref={(element) => {
                    if (element) {
                      itemRefs.current.set(item.id, element);
                    } else {
                      itemRefs.current.delete(item.id);
                    }
                  }}
                >
                  {selectedItemId === item.id || effectiveFocusedItemId === item.id ? (
                    <rect
                      x={item.x - 90}
                      y={item.y - 54}
                      width={180}
                      height={104}
                      rx={10}
                      className={cn(
                        "fill-transparent stroke-2",
                        selectedItemId === item.id ? "stroke-primary" : "stroke-ring",
                      )}
                    />
                  ) : null}
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
                  {(typeof itemActions === "function" ? itemActions(item) : (itemActions ?? []))
                    .length ? (
                    <foreignObject x={item.x + 86} y={item.y - 42} width={96} height={28}>
                      <div className="flex gap-1">
                        {(typeof itemActions === "function"
                          ? itemActions(item)
                          : (itemActions ?? [])
                        ).map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            data-slot="timeline-diagram-item-action"
                            aria-label={getReactNodeAccessibleName(action.label, action.id)}
                            disabled={action.disabled}
                            className={cn(
                              "inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-xs font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                              action.destructive && "text-destructive",
                            )}
                            onClick={(event) => {
                              event.stopPropagation();
                              action.onSelect?.(item);
                              onItemActionSelect?.(action, item);
                            }}
                          >
                            {action.icon ?? action.label}
                          </button>
                        ))}
                      </div>
                    </foreignObject>
                  ) : null}
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

function TimelineVerticalItem({
  item,
  groupBy,
  selected,
  focused,
  disabled,
  keyboardMode,
  actions,
  onItemSelect,
  onItemActionSelect,
  onItemFocus,
  onItemKeyDown,
  setItemRef,
}: {
  item: PositionedTimelineItem;
  groupBy: NonNullable<TimelineDiagramProps["groupBy"]>;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  keyboardMode: "nodes" | "none";
  actions: readonly TimelineDiagramItemAction[];
  onItemSelect?: TimelineDiagramProps["onItemSelect"];
  onItemActionSelect?: TimelineDiagramProps["onItemActionSelect"];
  onItemFocus: (item: PositionedTimelineItem) => void;
  onItemKeyDown: (event: React.KeyboardEvent, item: PositionedTimelineItem) => void;
  setItemRef: (itemId: string, element: HTMLElement | SVGGElement | null) => void;
}) {
  return (
    <div
      role={onItemSelect && !actions.length ? "button" : "listitem"}
      aria-label={onItemSelect ? getReactNodeAccessibleName(item.label, item.id) : undefined}
      aria-pressed={onItemSelect ? selected : undefined}
      data-slot="timeline-diagram-item"
      data-kind={item.kind ?? "event"}
      data-tone={item.tone ?? "default"}
      data-group={getTimelineGroup(item.timestamp, groupBy)}
      data-selected={selected ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      tabIndex={keyboardMode === "nodes" && focused && !disabled ? 0 : -1}
      className={cn(
        "grid gap-1 rounded-md border p-3 outline-none",
        defaultToneClasses[item.tone ?? "default"],
        selected && "ring-2 ring-primary",
        focused && !selected && "ring-2 ring-ring/70",
        disabled && "opacity-60",
        onItemSelect && "cursor-pointer",
      )}
      onClick={onItemSelect && !disabled ? () => onItemSelect(item) : undefined}
      onFocus={() => onItemFocus(item)}
      onKeyDown={(event) => onItemKeyDown(event, item)}
      ref={(element) => setItemRef(item.id, element)}
    >
      {groupBy !== "none" ? (
        <div className="text-[11px] font-medium uppercase text-muted-foreground">
          {getTimelineGroup(item.timestamp, groupBy)}
        </div>
      ) : null}
      <div className="text-xs font-medium text-muted-foreground">{formatDate(item.timestamp)}</div>
      <div className="font-medium leading-5">{item.label}</div>
      {item.description ? (
        <div className="text-sm text-muted-foreground">{item.description}</div>
      ) : null}
      {item.meta ? <div className="text-xs text-muted-foreground">{item.meta}</div> : null}
      {actions.length ? (
        <div className="flex gap-1">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              data-slot="timeline-diagram-item-action"
              aria-label={getReactNodeAccessibleName(action.label, action.id)}
              disabled={action.disabled}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-xs font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                action.destructive && "text-destructive",
              )}
              onClick={(event) => {
                event.stopPropagation();
                action.onSelect?.(item);
                onItemActionSelect?.(action, item);
              }}
            >
              {action.icon ?? action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
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

function getTimelineGroup(
  timestamp: number,
  groupBy: NonNullable<TimelineDiagramProps["groupBy"]>,
) {
  if (groupBy === "year") {
    return new Intl.DateTimeFormat("en", { year: "numeric" }).format(new Date(timestamp));
  }

  if (groupBy === "month") {
    return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(
      new Date(timestamp),
    );
  }

  return "none";
}

export { TimelineDiagram };
export type { DiagramTone as TimelineDiagramTone, PositionedTimelineItem };
