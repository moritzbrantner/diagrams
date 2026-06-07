"use client";

import * as React from "react";

export type DiagramPoint = {
  x: number;
  y: number;
};

export type DiagramTone = "default" | "accent" | "success" | "warning" | "danger" | "muted";
export type DiagramDirection = "forward" | "backward" | "both" | "none";

export type DiagramBoundsItem = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type DiagramBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const defaultToneClasses: Record<DiagramTone, string> = {
  default: "border-border bg-background",
  accent: "border-primary/40 bg-primary/5",
  success: "border-emerald-500/40 bg-emerald-500/10",
  warning: "border-amber-500/50 bg-amber-500/10",
  danger: "border-destructive/40 bg-destructive/10",
  muted: "border-border bg-muted/60",
};

export const defaultSvgToneClasses: Record<DiagramTone, string> = {
  default: "fill-background stroke-border",
  accent: "fill-primary/5 stroke-primary/40",
  success: "fill-emerald-500/10 stroke-emerald-500/40",
  warning: "fill-amber-500/10 stroke-amber-500/50",
  danger: "fill-destructive/10 stroke-destructive/40",
  muted: "fill-muted/60 stroke-border",
};

export const defaultEdgeToneClasses: Record<DiagramTone, string> = {
  default: "stroke-muted-foreground",
  accent: "stroke-primary",
  success: "stroke-emerald-600 dark:stroke-emerald-400",
  warning: "stroke-amber-600 dark:stroke-amber-400",
  danger: "stroke-destructive",
  muted: "stroke-border",
};

export function clampFiniteNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getAutoGridPosition(
  index: number,
  columns = 3,
  gap = { x: 96, y: 80 },
  size = { width: 200, height: 96 },
): DiagramPoint {
  const columnCount = Math.max(1, Math.floor(clampFiniteNumber(columns, 3)));
  const column = index % columnCount;
  const row = Math.floor(index / columnCount);

  return {
    x: column * (size.width + gap.x),
    y: row * (size.height + gap.y),
  };
}

export function getSpatialBounds(
  items: readonly DiagramBoundsItem[],
  points: readonly DiagramPoint[] = [],
  fallback: DiagramBounds = { x: 0, y: 0, width: 640, height: 320 },
): DiagramBounds {
  const xs: number[] = [];
  const ys: number[] = [];

  for (const item of items) {
    const x = clampFiniteNumber(item.x, Number.NaN);
    const y = clampFiniteNumber(item.y, Number.NaN);
    const width = Math.max(0, clampFiniteNumber(item.width, 0));
    const height = Math.max(0, clampFiniteNumber(item.height, 0));

    if (Number.isFinite(x) && Number.isFinite(y)) {
      xs.push(x, x + width);
      ys.push(y, y + height);
    }
  }

  for (const point of points) {
    const x = clampFiniteNumber(point.x, Number.NaN);
    const y = clampFiniteNumber(point.y, Number.NaN);

    if (Number.isFinite(x) && Number.isFinite(y)) {
      xs.push(x);
      ys.push(y);
    }
  }

  if (!xs.length || !ys.length) {
    return fallback;
  }

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  return {
    x: minX,
    y: minY,
    width: Math.max(1, Math.max(...xs) - minX),
    height: Math.max(1, Math.max(...ys) - minY),
  };
}

export function pointsToPath(points: readonly DiagramPoint[]) {
  const finitePoints = points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  );

  if (!finitePoints.length) {
    return "";
  }

  return finitePoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function getCenter(item: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>) {
  return {
    x: item.x + item.width / 2,
    y: item.y + item.height / 2,
  };
}

export function getOrthogonalRoute(
  source: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>,
  target: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>,
  edgeIndex = 0,
) {
  const start = getCenter(source);
  const end = getCenter(target);
  const offset = (edgeIndex % 3) * 12;
  const middleX = (start.x + end.x) / 2 + offset;

  return [start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end];
}

export function getBoundaryPoint(
  rect: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>,
  toward: DiagramPoint,
): DiagramPoint {
  const center = getCenter(rect);
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;

  if (dx === 0 && dy === 0) {
    return { x: center.x + halfWidth, y: center.y };
  }

  if (Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth) {
    return {
      x: center.x + (dx > 0 ? halfWidth : -halfWidth),
      y: center.y + (dy * halfWidth) / Math.max(Math.abs(dx), 1),
    };
  }

  return {
    x: center.x + (dx * halfHeight) / Math.max(Math.abs(dy), 1),
    y: center.y + (dy > 0 ? halfHeight : -halfHeight),
  };
}

export type HullRouteInput = {
  source: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>;
  target: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>;
  edgeIndex?: number;
  points?: readonly DiagramPoint[];
  waypoints?: readonly DiagramPoint[];
  selfLoop?: boolean;
};

export type HullRoute = {
  points: readonly DiagramPoint[];
  labelPoint?: DiagramPoint;
};

export function getHullRoute({
  source,
  target,
  edgeIndex = 0,
  points,
  waypoints,
  selfLoop,
}: HullRouteInput): HullRoute {
  if (points?.length) {
    return {
      labelPoint: points[Math.floor(points.length / 2)],
      points,
    };
  }

  if (selfLoop) {
    const offset = 32 + (edgeIndex % 3) * 16;
    const start = { x: source.x + source.width, y: source.y + source.height * 0.34 };
    const end = { x: source.x + source.width, y: source.y + source.height * 0.68 };

    return {
      labelPoint: { x: source.x + source.width + offset, y: source.y + source.height / 2 },
      points: [start, { x: start.x + offset, y: start.y }, { x: end.x + offset, y: end.y }, end],
    };
  }

  const sourceCenter = getCenter(source);
  const targetCenter = getCenter(target);

  if (waypoints?.length) {
    const start = getBoundaryPoint(source, waypoints[0] ?? targetCenter);
    const end = getBoundaryPoint(target, waypoints[waypoints.length - 1] ?? sourceCenter);

    return {
      labelPoint: waypoints[Math.floor(waypoints.length / 2)],
      points: [start, ...waypoints, end],
    };
  }

  const start = getBoundaryPoint(source, targetCenter);
  const end = getBoundaryPoint(target, sourceCenter);
  const offset = (edgeIndex % 3) * 12;
  const middleX = (start.x + end.x) / 2 + offset;

  return {
    labelPoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    points: [start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end],
  };
}

export type DiagramKeyboardKey = "ArrowRight" | "ArrowLeft" | "ArrowDown" | "ArrowUp";

export function getNearestDiagramItem<T extends DiagramBoundsItem>(
  current: T,
  candidates: readonly T[],
  key: DiagramKeyboardKey,
): T | null {
  const currentCenter = getItemCenter(current);
  const horizontal = key === "ArrowRight" || key === "ArrowLeft";
  const forward = key === "ArrowRight" || key === "ArrowDown";

  return (
    candidates
      .map((candidate) => {
        const center = getItemCenter(candidate);
        const primaryDelta = horizontal ? center.x - currentCenter.x : center.y - currentCenter.y;
        const perpendicularDelta = horizontal
          ? center.y - currentCenter.y
          : center.x - currentCenter.x;

        return {
          candidate,
          primaryDelta,
          perpendicularDistance: Math.abs(perpendicularDelta),
          totalDistance: Math.hypot(center.x - currentCenter.x, center.y - currentCenter.y),
        };
      })
      .filter((item) => (forward ? item.primaryDelta > 0 : item.primaryDelta < 0))
      .sort(
        (first, second) =>
          first.perpendicularDistance - second.perpendicularDistance ||
          first.totalDistance - second.totalDistance,
      )[0]?.candidate ?? null
  );
}

export function useControlledSetState({
  value,
  defaultValue,
}: {
  value?: readonly string[];
  defaultValue?: readonly string[];
}) {
  const [internalValue, setInternalValue] = React.useState<string[]>(() => [
    ...(defaultValue ?? []),
  ]);
  const currentValue = React.useMemo(() => new Set(value ?? internalValue), [internalValue, value]);
  const setValue = React.useCallback(
    (nextValue: string[]) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }
    },
    [value],
  );

  return [currentValue, setValue] as const;
}

export function getReactNodeAccessibleName(value: React.ReactNode, fallback: string) {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

export function isActivationKey(event: React.KeyboardEvent) {
  return event.key === "Enter" || event.key === " ";
}

export type DiagramItemAction<TItem> = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (item: TItem) => void;
};

export function DiagramSvgItemInteraction<
  TItem extends Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">> & {
    id: string;
    label?: React.ReactNode;
  },
>({
  item,
  slot,
  selected,
  focused,
  disabled,
  keyboardMode,
  actions,
  accessibleName,
  renderSelection,
  onSelect,
  onFocus,
  onKeyDown,
  onActionSelect,
  setItemRef,
  children,
}: {
  item: TItem;
  slot: string;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  keyboardMode: "nodes" | "none";
  actions?: readonly DiagramItemAction<TItem>[];
  accessibleName?: string;
  renderSelection?: (item: TItem) => React.ReactNode;
  onSelect?: (item: TItem) => void;
  onFocus: (item: TItem) => void;
  onKeyDown: (event: React.KeyboardEvent<SVGGElement>, item: TItem) => void;
  onActionSelect?: (action: DiagramItemAction<TItem>, item: TItem) => void;
  setItemRef: (itemId: string, element: SVGGElement | null) => void;
  children: React.ReactNode;
}) {
  const resolvedActions = actions ?? [];
  const resolvedAccessibleName = accessibleName ?? getReactNodeAccessibleName(item.label, item.id);
  const role = onSelect && resolvedActions.length === 0 ? "button" : undefined;

  return (
    <g
      data-slot={`${slot}-interaction`}
      data-item-id={item.id}
      data-selected={selected ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      role={role}
      aria-label={role ? resolvedAccessibleName : undefined}
      aria-pressed={role ? selected : undefined}
      aria-disabled={role ? disabled || undefined : undefined}
      tabIndex={keyboardMode === "nodes" && focused && !disabled ? 0 : -1}
      className={[
        "outline-none",
        onSelect ? `cursor-pointer focus-visible:[&_[data-slot='${slot}-focus']]:stroke-ring` : "",
        disabled ? "opacity-60" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onSelect && !disabled ? () => onSelect(item) : undefined}
      onFocus={() => onFocus(item)}
      onKeyDown={(event) => onKeyDown(event, item)}
      ref={(element) => setItemRef(item.id, element)}
    >
      {selected ? (
        (renderSelection?.(item) ?? (
          <rect
            data-slot={`${slot}-focus`}
            x={item.x - 6}
            y={item.y - 6}
            width={item.width + 12}
            height={item.height + 12}
            rx="12"
            className="fill-transparent stroke-primary stroke-2"
          />
        ))
      ) : focused ? (
        <rect
          data-slot={`${slot}-focus`}
          x={item.x - 6}
          y={item.y - 6}
          width={item.width + 12}
          height={item.height + 12}
          rx="12"
          className="fill-transparent stroke-ring stroke-2"
        />
      ) : null}
      {children}
      {resolvedActions.length ? (
        <DiagramSvgItemActions
          actions={resolvedActions}
          item={item}
          slot={slot}
          onActionSelect={onActionSelect}
        />
      ) : null}
    </g>
  );
}

function DiagramSvgItemActions<TItem extends { id: string }>({
  actions,
  item,
  slot,
  onActionSelect,
}: {
  actions: readonly DiagramItemAction<TItem>[];
  item: TItem & Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>;
  slot: string;
  onActionSelect?: (action: DiagramItemAction<TItem>, item: TItem) => void;
}) {
  const actionSize = 28;
  const actionGap = 4;
  const width = actions.length * actionSize + Math.max(0, actions.length - 1) * actionGap;

  return (
    <foreignObject
      data-slot={`${slot}-actions`}
      x={item.x + item.width - width - 8}
      y={item.y + item.height - actionSize - 8}
      width={width}
      height={actionSize}
    >
      <div className="flex gap-1">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            data-slot={`${slot}-action`}
            data-action-id={action.id}
            data-destructive={action.destructive ? "true" : undefined}
            aria-label={getReactNodeAccessibleName(action.label, action.id)}
            disabled={action.disabled}
            className={[
              "inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-xs font-medium text-foreground shadow-sm outline-none transition-colors",
              "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
              action.destructive
                ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                : "",
              "[&_svg]:size-3.5",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={(event) => {
              event.stopPropagation();
              action.onSelect?.(item);
              onActionSelect?.(action, item);
            }}
          >
            {action.icon ?? action.label}
          </button>
        ))}
      </div>
    </foreignObject>
  );
}

function getItemCenter(item: DiagramBoundsItem): DiagramPoint {
  const x = clampFiniteNumber(item.x, 0);
  const y = clampFiniteNumber(item.y, 0);
  const width = Math.max(0, clampFiniteNumber(item.width, 0));
  const height = Math.max(0, clampFiniteNumber(item.height, 0));

  return { x: x + width / 2, y: y + height / 2 };
}
