import type { DiagramBounds, DiagramBoundsItem, DiagramPoint } from "../diagram-types";

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

export function getBoundsCenter(bounds: DiagramBounds | undefined): DiagramPoint | null {
  return bounds ? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 } : null;
}

export function normalizeBounds(item: DiagramBoundsItem): DiagramBounds {
  return {
    x: clampFiniteNumber(item.x, 0),
    y: clampFiniteNumber(item.y, 0),
    width: Math.max(0, clampFiniteNumber(item.width, 0)),
    height: Math.max(0, clampFiniteNumber(item.height, 0)),
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

function getItemCenter(item: DiagramBoundsItem): DiagramPoint {
  const x = clampFiniteNumber(item.x, 0);
  const y = clampFiniteNumber(item.y, 0);
  const width = Math.max(0, clampFiniteNumber(item.width, 0));
  const height = Math.max(0, clampFiniteNumber(item.height, 0));

  return { x: x + width / 2, y: y + height / 2 };
}
