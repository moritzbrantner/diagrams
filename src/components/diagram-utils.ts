"use client";

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
