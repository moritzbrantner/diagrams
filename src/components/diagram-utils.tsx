"use client";

import {
  ChevronDownIcon,
  ChevronUpIcon,
  Maximize2Icon,
  RotateCcwIcon,
  SearchIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
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

export type DiagramElementKind = "node" | "edge";

export type DiagramElementRef = {
  kind: DiagramElementKind;
  id: string;
};

export type DiagramViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DiagramViewportChangeReason =
  | "fit"
  | "reset"
  | "pan"
  | "zoom"
  | "search"
  | "programmatic";

export type DiagramPathHighlightMode = "neighbors" | "incoming" | "outgoing" | "connected";

export type DiagramInteractiveFeatures =
  | boolean
  | {
      viewport?: boolean;
      pathHighlight?: boolean | { mode?: DiagramPathHighlightMode };
      search?: boolean;
      edgeInspector?: boolean;
      controls?: "auto" | "always" | "none";
    };

export type DiagramSearchResult<TNode, TEdge> = {
  ref: DiagramElementRef;
  label: string;
  item: TNode | TEdge;
};

export type DiagramEdgeInspectorContext<TNode, TEdge> = {
  edge: TEdge;
  source?: TNode;
  target?: TNode;
  edgeId: string;
  sourceId?: string;
  targetId?: string;
  label?: React.ReactNode;
  kind?: string;
  direction?: string;
};

export type DiagramNodeDescriptor<TNode> = {
  id: string;
  item: TNode;
  label?: React.ReactNode;
  bounds: DiagramBounds;
};

export type DiagramEdgeDescriptor<TEdge> = {
  id: string;
  item: TEdge;
  sourceId: string;
  targetId: string;
  label?: React.ReactNode;
  kind?: string;
  direction?: DiagramDirection | string;
  labelPoint?: DiagramPoint;
};

export type DiagramInteractiveProps<TNode, TEdge> = {
  interactiveFeatures?: DiagramInteractiveFeatures;
  viewport?: DiagramViewport;
  defaultViewport?: DiagramViewport;
  onViewportChange?: (viewport: DiagramViewport, reason: DiagramViewportChangeReason) => void;
  highlightedElement?: DiagramElementRef | null;
  defaultHighlightedElement?: DiagramElementRef | null;
  onHighlightedElementChange?: (element: DiagramElementRef | null) => void;
  searchQuery?: string;
  defaultSearchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  focusedSearchResult?: DiagramElementRef | null;
  onFocusedSearchResultChange?: (result: DiagramSearchResult<TNode, TEdge> | null) => void;
  getSearchText?: (item: { kind: DiagramElementKind; id: string; item: TNode | TEdge }) => string;
  inspectedEdgeId?: string | null;
  defaultInspectedEdgeId?: string | null;
  onInspectedEdgeIdChange?: (edgeId: string | null) => void;
  renderEdgeInspector?: (context: DiagramEdgeInspectorContext<TNode, TEdge>) => React.ReactNode;
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
  return getBoundaryAnchor(rect, toward).point;
}

type BoundaryAnchor = {
  normal: DiagramPoint;
  point: DiagramPoint;
};

const ROUTE_ENDPOINT_STUB_LENGTH = 18;

function getBoundaryAnchor(
  rect: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>,
  toward: DiagramPoint,
): BoundaryAnchor {
  const center = getCenter(rect);
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;

  if (dx === 0 && dy === 0) {
    return {
      normal: { x: 1, y: 0 },
      point: { x: center.x + halfWidth, y: center.y },
    };
  }

  if (Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth) {
    return {
      normal: { x: dx > 0 ? 1 : -1, y: 0 },
      point: {
        x: center.x + (dx > 0 ? halfWidth : -halfWidth),
        y: center.y + (dy * halfWidth) / Math.max(Math.abs(dx), 1),
      },
    };
  }

  return {
    normal: { x: 0, y: dy > 0 ? 1 : -1 },
    point: {
      x: center.x + (dx * halfHeight) / Math.max(Math.abs(dy), 1),
      y: center.y + (dy > 0 ? halfHeight : -halfHeight),
    },
  };
}

function getEndpointStub(anchor: BoundaryAnchor): DiagramPoint {
  return {
    x: anchor.point.x + anchor.normal.x * ROUTE_ENDPOINT_STUB_LENGTH,
    y: anchor.point.y + anchor.normal.y * ROUTE_ENDPOINT_STUB_LENGTH,
  };
}

export type HullRouteInput = {
  source: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>;
  target: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>;
  edgeIndex?: number;
  obstacles?: readonly DiagramBoundsItem[];
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
  obstacles = [],
  points,
  waypoints,
  selfLoop,
}: HullRouteInput): HullRoute {
  if (points?.length) {
    const routePoints = simplifyRoutePoints(points);

    return {
      labelPoint: getRouteLabelPoint(routePoints, obstacles),
      points: routePoints,
    };
  }

  if (selfLoop) {
    const offset = 32 + (edgeIndex % 3) * 16;
    const start = { x: source.x + source.width, y: source.y + source.height * 0.34 };
    const end = { x: source.x + source.width, y: source.y + source.height * 0.68 };

    return {
      labelPoint: getRouteLabelPoint(
        [start, { x: start.x + offset, y: start.y }, { x: end.x + offset, y: end.y }, end],
        obstacles,
        { x: source.x + source.width + offset + 10, y: source.y + source.height / 2 },
      ),
      points: simplifyRoutePoints([
        start,
        { x: start.x + offset, y: start.y },
        { x: end.x + offset, y: end.y },
        end,
      ]),
    };
  }

  const sourceCenter = getCenter(source);
  const targetCenter = getCenter(target);

  if (waypoints?.length) {
    const start = getBoundaryPoint(source, waypoints[0] ?? targetCenter);
    const end = getBoundaryPoint(target, waypoints[waypoints.length - 1] ?? sourceCenter);
    const routePoints = simplifyRoutePoints([start, ...waypoints, end]);

    return {
      labelPoint: getRouteLabelPoint(routePoints, obstacles),
      points: routePoints,
    };
  }

  const start = getBoundaryAnchor(source, targetCenter);
  const end = getBoundaryAnchor(target, sourceCenter);
  const routePoints = getBestOrthogonalRoute({
    edgeIndex,
    end,
    obstacles,
    source,
    start,
    target,
  });

  return {
    labelPoint: getRouteLabelPoint(routePoints, obstacles),
    points: routePoints,
  };
}

function getBestOrthogonalRoute({
  source,
  target,
  start,
  end,
  obstacles,
  edgeIndex,
}: {
  source: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>;
  target: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>;
  start: BoundaryAnchor;
  end: BoundaryAnchor;
  obstacles: readonly DiagramBoundsItem[];
  edgeIndex: number;
}) {
  const offset = getRouteOffset(edgeIndex);
  const clearance = 24 + Math.abs(offset);
  const routeStart = getEndpointStub(start);
  const routeEnd = getEndpointStub(end);
  const middleX = (routeStart.x + routeEnd.x) / 2 + offset;
  const middleY = (routeStart.y + routeEnd.y) / 2 + offset;
  const leftX = Math.min(source.x, target.x) - clearance;
  const rightX = Math.max(source.x + source.width, target.x + target.width) + clearance;
  const topY = Math.min(source.y, target.y) - clearance;
  const bottomY = Math.max(source.y + source.height, target.y + target.height) + clearance;
  const candidates = [
    [
      start.point,
      routeStart,
      { x: middleX, y: routeStart.y },
      { x: middleX, y: routeEnd.y },
      routeEnd,
      end.point,
    ],
    [
      start.point,
      routeStart,
      { x: routeStart.x, y: middleY },
      { x: routeEnd.x, y: middleY },
      routeEnd,
      end.point,
    ],
    [
      start.point,
      routeStart,
      { x: leftX, y: routeStart.y },
      { x: leftX, y: routeEnd.y },
      routeEnd,
      end.point,
    ],
    [
      start.point,
      routeStart,
      { x: rightX, y: routeStart.y },
      { x: rightX, y: routeEnd.y },
      routeEnd,
      end.point,
    ],
    [
      start.point,
      routeStart,
      { x: routeStart.x, y: topY },
      { x: routeEnd.x, y: topY },
      routeEnd,
      end.point,
    ],
    [
      start.point,
      routeStart,
      { x: routeStart.x, y: bottomY },
      { x: routeEnd.x, y: bottomY },
      routeEnd,
      end.point,
    ],
  ].map(simplifyOrthogonalRoutePoints);

  return candidates
    .map((points) => ({
      points,
      score: getRouteScore(points, obstacles, [source, target]),
    }))
    .sort((first, second) => first.score - second.score)[0].points;
}

function getRouteOffset(edgeIndex: number) {
  return [0, 14, -14, 28, -28][edgeIndex % 5] ?? 0;
}

function simplifyRoutePoints(points: readonly DiagramPoint[]) {
  const finitePoints = points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  );
  const simplified: DiagramPoint[] = [];

  for (const point of finitePoints) {
    const previous = simplified[simplified.length - 1];

    if (previous && Math.abs(previous.x - point.x) < 0.5 && Math.abs(previous.y - point.y) < 0.5) {
      continue;
    }

    simplified.push(point);
  }

  return simplified;
}

function simplifyOrthogonalRoutePoints(points: readonly DiagramPoint[]) {
  const simplified: DiagramPoint[] = [];

  for (const point of simplifyRoutePoints(points)) {
    simplified.push(point);

    while (simplified.length >= 3) {
      const end = simplified[simplified.length - 1];
      const middle = simplified[simplified.length - 2];
      const start = simplified[simplified.length - 3];

      if (!pointIsBetweenCollinearPoints(start, middle, end)) {
        break;
      }

      simplified.splice(simplified.length - 2, 1);
    }
  }

  return simplified;
}

function pointIsBetweenCollinearPoints(
  start: DiagramPoint,
  middle: DiagramPoint,
  end: DiagramPoint,
) {
  const epsilon = 0.5;
  const sameX = Math.abs(start.x - middle.x) < epsilon && Math.abs(middle.x - end.x) < epsilon;
  const sameY = Math.abs(start.y - middle.y) < epsilon && Math.abs(middle.y - end.y) < epsilon;

  if (!sameX && !sameY) {
    return false;
  }

  return (
    middle.x >= Math.min(start.x, end.x) - epsilon &&
    middle.x <= Math.max(start.x, end.x) + epsilon &&
    middle.y >= Math.min(start.y, end.y) - epsilon &&
    middle.y <= Math.max(start.y, end.y) + epsilon
  );
}

function getRouteScore(
  points: readonly DiagramPoint[],
  obstacles: readonly DiagramBoundsItem[],
  endpointItems: readonly DiagramBoundsItem[],
) {
  let score = points.length * 4;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);

    score += segmentLength * 0.02;

    if (segmentLength < 1) {
      score += 1000;
    }

    for (const obstacle of obstacles) {
      if (endpointItems.some((item) => sameBounds(item, obstacle))) {
        continue;
      }

      if (segmentIntersectsBounds(start, end, obstacle, 10)) {
        score += 1200;
      }
    }
  }

  return score;
}

function getRouteLabelPoint(
  points: readonly DiagramPoint[],
  obstacles: readonly DiagramBoundsItem[],
  preferredPoint = getPolylineMidpoint(points),
) {
  const segment = getPolylineMidSegment(points);
  const horizontal = segment
    ? Math.abs(segment.end.x - segment.start.x) >= Math.abs(segment.end.y - segment.start.y)
    : true;
  const candidates = [
    preferredPoint,
    ...[18, -18, 34, -34, 52, -52].map((offset) =>
      horizontal
        ? { x: preferredPoint.x, y: preferredPoint.y + offset }
        : { x: preferredPoint.x + offset, y: preferredPoint.y },
    ),
    { x: preferredPoint.x + 36, y: preferredPoint.y + 24 },
    { x: preferredPoint.x - 36, y: preferredPoint.y - 24 },
  ];

  return candidates
    .map((candidate) => ({
      point: candidate,
      score:
        Math.hypot(candidate.x - preferredPoint.x, candidate.y - preferredPoint.y) +
        getLabelObstaclePenalty(candidate, obstacles),
    }))
    .sort((first, second) => first.score - second.score)[0].point;
}

function getPolylineMidpoint(points: readonly DiagramPoint[]) {
  const segment = getPolylineMidSegment(points);

  if (!segment) {
    return points[0] ?? { x: 0, y: 0 };
  }

  return {
    x: segment.start.x + (segment.end.x - segment.start.x) * segment.ratio,
    y: segment.start.y + (segment.end.y - segment.start.y) * segment.ratio,
  };
}

function getPolylineMidSegment(points: readonly DiagramPoint[]) {
  if (points.length < 2) {
    return null;
  }

  const lengths = points.slice(1).map((point, index) => {
    const previous = points[index];
    return Math.hypot(point.x - previous.x, point.y - previous.y);
  });
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = totalLength / 2;

  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];

    if (remaining <= length || index === lengths.length - 1) {
      return {
        end: points[index + 1],
        ratio: length > 0 ? remaining / length : 0,
        start: points[index],
      };
    }

    remaining -= length;
  }

  return null;
}

function getLabelObstaclePenalty(point: DiagramPoint, obstacles: readonly DiagramBoundsItem[]) {
  const labelBounds = {
    x: point.x - 76,
    y: point.y - 24,
    width: 152,
    height: 48,
  };

  return obstacles.reduce(
    (penalty, obstacle) => penalty + (boundsOverlap(labelBounds, obstacle, 8) ? 800 : 0),
    0,
  );
}

function boundsOverlap(first: DiagramBoundsItem, second: DiagramBoundsItem, padding = 0) {
  const firstBounds = normalizeBounds(first);
  const secondBounds = normalizeBounds(second);

  return (
    firstBounds.x < secondBounds.x + secondBounds.width + padding &&
    firstBounds.x + firstBounds.width > secondBounds.x - padding &&
    firstBounds.y < secondBounds.y + secondBounds.height + padding &&
    firstBounds.y + firstBounds.height > secondBounds.y - padding
  );
}

function segmentIntersectsBounds(
  start: DiagramPoint,
  end: DiagramPoint,
  boundsItem: DiagramBoundsItem,
  padding = 0,
) {
  const bounds = normalizeBounds(boundsItem);
  const left = bounds.x - padding;
  const right = bounds.x + bounds.width + padding;
  const top = bounds.y - padding;
  const bottom = bounds.y + bounds.height + padding;

  if (start.x === end.x) {
    const x = start.x;
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    return x >= left && x <= right && maxY >= top && minY <= bottom;
  }

  if (start.y === end.y) {
    const y = start.y;
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);

    return y >= top && y <= bottom && maxX >= left && minX <= right;
  }

  return lineIntersectsBounds(start, end, {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });
}

function lineIntersectsBounds(start: DiagramPoint, end: DiagramPoint, bounds: DiagramBounds) {
  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ];

  return corners.some((corner, index) =>
    linesIntersect(start, end, corner, corners[(index + 1) % corners.length]),
  );
}

function linesIntersect(
  firstStart: DiagramPoint,
  firstEnd: DiagramPoint,
  secondStart: DiagramPoint,
  secondEnd: DiagramPoint,
) {
  const direction = (a: DiagramPoint, b: DiagramPoint, c: DiagramPoint) =>
    (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
  const firstDirection = direction(secondStart, secondEnd, firstStart);
  const secondDirection = direction(secondStart, secondEnd, firstEnd);
  const thirdDirection = direction(firstStart, firstEnd, secondStart);
  const fourthDirection = direction(firstStart, firstEnd, secondEnd);

  return (
    ((firstDirection > 0 && secondDirection < 0) || (firstDirection < 0 && secondDirection > 0)) &&
    ((thirdDirection > 0 && fourthDirection < 0) || (thirdDirection < 0 && fourthDirection > 0))
  );
}

function sameBounds(first: DiagramBoundsItem, second: DiagramBoundsItem) {
  const firstBounds = normalizeBounds(first);
  const secondBounds = normalizeBounds(second);

  return (
    firstBounds.x === secondBounds.x &&
    firstBounds.y === secondBounds.y &&
    firstBounds.width === secondBounds.width &&
    firstBounds.height === secondBounds.height
  );
}

function normalizeBounds(item: DiagramBoundsItem): DiagramBounds {
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

export const diagramCanvasLabelVisibilityClass =
  "[&[data-show-labels='false']_[data-diagram-label]]:pointer-events-none [&[data-show-labels='false']_[data-diagram-label]]:opacity-0 [&[data-show-labels='false']_[data-diagram-label]]:transition-opacity [&[data-show-labels='false']_[data-diagram-edge]:hover_[data-diagram-label]]:opacity-100 [&[data-show-labels='false']_[data-diagram-edge]:focus-within_[data-diagram-label]]:opacity-100";

export function useDiagramCanvasSettings({
  defaultShowLabels = true,
}: {
  defaultShowLabels?: boolean;
} = {}) {
  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [showLabels, setShowLabels] = React.useState(defaultShowLabels);
  const [menuPosition, setMenuPosition] = React.useState<{ x: number; y: number } | null>(null);
  const setScrollAreaElement = React.useCallback((element: HTMLDivElement | null) => {
    scrollAreaRef.current = element;
  }, []);

  React.useEffect(() => {
    if (!menuPosition) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) {
        return;
      }

      setMenuPosition(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuPosition(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuPosition]);

  const handleCanvasContextMenu = React.useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    const target = event.target;

    if (
      target instanceof Element &&
      target.closest("button,a,input,select,textarea,[role='button']")
    ) {
      return;
    }

    const scrollArea = scrollAreaRef.current;

    if (!scrollArea) {
      return;
    }

    event.preventDefault();

    const scrollAreaRect = scrollArea.getBoundingClientRect();

    setMenuPosition({
      x: event.clientX - scrollAreaRect.left + scrollArea.scrollLeft,
      y: event.clientY - scrollAreaRect.top + scrollArea.scrollTop,
    });
  }, []);

  const menu = menuPosition ? (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-label="Diagram settings"
      data-slot="diagram-canvas-settings-menu"
      className="absolute z-20 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      style={{ left: menuPosition.x, top: menuPosition.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Settings</div>
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={showLabels}
        data-slot="diagram-canvas-settings-labels"
        className="flex w-full items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
        onClick={() => setShowLabels((current) => !current)}
      >
        <span>Labels</span>
        <span className="text-xs text-muted-foreground">{showLabels ? "On" : "Off"}</span>
      </button>
    </div>
  ) : null;

  return {
    menu,
    setScrollAreaElement,
    showLabels,
    svgProps: {
      "data-show-labels": showLabels ? "true" : "false",
      onContextMenu: handleCanvasContextMenu,
    },
  } as const;
}

const diagramCanvasOverlayButtonClass =
  "inline-flex size-8 items-center justify-center rounded-sm border bg-background/90 text-foreground shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4";

type ResolvedDiagramInteractiveFeatures = {
  enabled: boolean;
  viewport: boolean;
  pathHighlight: boolean;
  pathHighlightMode: DiagramPathHighlightMode;
  search: boolean;
  edgeInspector: boolean;
  controls: "auto" | "always" | "none";
};

export function getFittedViewport(bounds: DiagramBounds, padding = 32): DiagramViewport {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: Math.max(1, bounds.width + padding * 2),
    height: Math.max(1, bounds.height + padding * 2),
  };
}

function diagramViewportEquals(first: DiagramViewport, second: DiagramViewport) {
  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
}

export function zoomViewportAtPoint(
  viewport: DiagramViewport,
  point: DiagramPoint,
  zoomFactor: number,
  minZoom: number,
  maxZoom: number,
  fittedViewport = viewport,
): DiagramViewport {
  const currentZoom = getViewportZoom(viewport, fittedViewport);
  const nextZoom = Math.min(maxZoom, Math.max(minZoom, currentZoom * zoomFactor));
  const scale = currentZoom / nextZoom;
  const width = viewport.width * scale;
  const height = viewport.height * scale;
  const ratioX = (point.x - viewport.x) / viewport.width;
  const ratioY = (point.y - viewport.y) / viewport.height;

  return {
    x: point.x - width * ratioX,
    y: point.y - height * ratioY,
    width,
    height,
  };
}

export function panViewport(viewport: DiagramViewport, delta: DiagramPoint): DiagramViewport {
  return {
    ...viewport,
    x: viewport.x + delta.x,
    y: viewport.y + delta.y,
  };
}

export function getDiagramPointFromClientPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): DiagramPoint {
  const owner = svg.ownerSVGElement ?? svg;
  const viewBox = owner.viewBox.baseVal;
  const rect = owner.getBoundingClientRect();

  if (typeof owner.createSVGPoint === "function") {
    const point = owner.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = owner.getScreenCTM()?.inverse();

    if (matrix) {
      const transformed = point.matrixTransform(matrix);
      return { x: transformed.x, y: transformed.y };
    }
  }

  return {
    x: viewBox.x + ((clientX - rect.left) / Math.max(rect.width, 1)) * viewBox.width,
    y: viewBox.y + ((clientY - rect.top) / Math.max(rect.height, 1)) * viewBox.height,
  };
}

export function buildDiagramSearchIndex<TNode, TEdge>(
  nodes: readonly DiagramNodeDescriptor<TNode>[],
  edges: readonly DiagramEdgeDescriptor<TEdge>[],
  getSearchText?: DiagramInteractiveProps<TNode, TEdge>["getSearchText"],
): (DiagramSearchResult<TNode, TEdge> & { searchText: string })[] {
  return [
    ...nodes.map((node) => {
      const label = getDiagramSearchLabel(node.label, node.id);
      return {
        ref: { kind: "node" as const, id: node.id },
        label,
        item: node.item,
        searchText:
          getSearchText?.({ kind: "node", id: node.id, item: node.item }) ??
          getDefaultDiagramSearchText(node.id, node.label, node.item),
      };
    }),
    ...edges.map((edge) => {
      const label = getDiagramSearchLabel(edge.label, edge.id);
      return {
        ref: { kind: "edge" as const, id: edge.id },
        label,
        item: edge.item,
        searchText:
          getSearchText?.({ kind: "edge", id: edge.id, item: edge.item }) ??
          getDefaultDiagramSearchText(
            edge.id,
            edge.label,
            edge.item,
            edge.sourceId,
            edge.targetId,
            edge.kind,
            edge.direction,
          ),
      };
    }),
  ].map((entry) => ({ ...entry, searchText: entry.searchText.toLowerCase() }));
}

export function getConnectedElementIds<TEdge>(
  edges: readonly DiagramEdgeDescriptor<TEdge>[],
  activeElement: DiagramElementRef | null,
  mode: DiagramPathHighlightMode,
) {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  if (!activeElement) {
    return { nodeIds, edgeIds };
  }

  if (activeElement.kind === "edge") {
    const activeEdge = edges.find((edge) => edge.id === activeElement.id);

    if (activeEdge) {
      edgeIds.add(activeEdge.id);
      nodeIds.add(activeEdge.sourceId);
      nodeIds.add(activeEdge.targetId);
    }

    return { nodeIds, edgeIds };
  }

  nodeIds.add(activeElement.id);

  if (mode === "neighbors") {
    for (const edge of edges) {
      if (edge.sourceId === activeElement.id || edge.targetId === activeElement.id) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.sourceId);
        nodeIds.add(edge.targetId);
      }
    }

    return { nodeIds, edgeIds };
  }

  const queue = [activeElement.id];
  const visited = new Set(queue);

  while (queue.length) {
    const nodeId = queue.shift()!;

    for (const edge of edges) {
      const directions = getTraversalDirections(edge);
      const traversable =
        mode === "connected"
          ? edge.sourceId === nodeId || edge.targetId === nodeId
          : mode === "incoming"
            ? directions.some((direction) => direction.to === nodeId)
            : directions.some((direction) => direction.from === nodeId);

      if (!traversable) {
        continue;
      }

      edgeIds.add(edge.id);

      const nextNodes =
        mode === "connected"
          ? [edge.sourceId, edge.targetId]
          : mode === "incoming"
            ? directions
                .filter((direction) => direction.to === nodeId)
                .map((direction) => direction.from)
            : directions
                .filter((direction) => direction.from === nodeId)
                .map((direction) => direction.to);

      for (const nextNode of nextNodes) {
        nodeIds.add(nextNode);

        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          queue.push(nextNode);
        }
      }
    }
  }

  return { nodeIds, edgeIds };
}

export function useDiagramCanvasInteractions<TNode, TEdge>({
  interactiveFeatures,
  contentBounds,
  nodes,
  edges,
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
  padding = 32,
}: DiagramInteractiveProps<TNode, TEdge> & {
  contentBounds: DiagramBounds;
  nodes: readonly DiagramNodeDescriptor<TNode>[];
  edges: readonly DiagramEdgeDescriptor<TEdge>[];
  padding?: number;
}) {
  const features = React.useMemo(
    () => resolveDiagramInteractiveFeatures(interactiveFeatures),
    [interactiveFeatures],
  );
  const {
    x: contentBoundsX,
    y: contentBoundsY,
    width: contentBoundsWidth,
    height: contentBoundsHeight,
  } = contentBounds;
  const fittedViewport = React.useMemo(
    () =>
      getFittedViewport(
        {
          height: contentBoundsHeight,
          width: contentBoundsWidth,
          x: contentBoundsX,
          y: contentBoundsY,
        },
        padding,
      ),
    [contentBoundsHeight, contentBoundsWidth, contentBoundsX, contentBoundsY, padding],
  );
  const initialViewport = defaultViewport ?? fittedViewport;
  const [internalViewport, setInternalViewport] = React.useState<DiagramViewport>(initialViewport);
  const [internalHighlightedElement, setInternalHighlightedElement] =
    React.useState<DiagramElementRef | null>(() => defaultHighlightedElement ?? null);
  const [hoveredElement, setHoveredElement] = React.useState<DiagramElementRef | null>(null);
  const [internalSearchQuery, setInternalSearchQuery] = React.useState(defaultSearchQuery ?? "");
  const [focusedResultIndex, setFocusedResultIndex] = React.useState(0);
  const [internalInspectedEdgeId, setInternalInspectedEdgeId] = React.useState<string | null>(
    () => defaultInspectedEdgeId ?? null,
  );
  const [inspectorRole, setInspectorRole] = React.useState<"tooltip" | "dialog">("tooltip");
  const [inspectorPoint, setInspectorPoint] = React.useState<DiagramPoint | null>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const nodeRefs = React.useRef(new Map<string, SVGGElement>());
  const [scrollAreaElement, setScrollAreaStateElement] = React.useState<HTMLDivElement | null>(
    null,
  );
  const isPanningRef = React.useRef(false);
  const panStartRef = React.useRef<{
    clientX: number;
    clientY: number;
    viewport: DiagramViewport;
  } | null>(null);
  const isSpacePressedRef = React.useRef(false);

  React.useEffect(() => {
    if (viewport === undefined && defaultViewport === undefined) {
      queueMicrotask(() =>
        setInternalViewport((currentViewport) =>
          diagramViewportEquals(currentViewport, fittedViewport) ? currentViewport : fittedViewport,
        ),
      );
    }
  }, [defaultViewport, fittedViewport, viewport]);

  const currentViewport = viewport ?? internalViewport;
  const setViewport = React.useCallback(
    (nextViewport: DiagramViewport, reason: DiagramViewportChangeReason) => {
      const constrained = clampDiagramViewport(nextViewport, fittedViewport);

      if (viewport === undefined) {
        setInternalViewport((currentViewport) =>
          diagramViewportEquals(currentViewport, constrained) ? currentViewport : constrained,
        );
      }

      onViewportChange?.(constrained, reason);
    },
    [fittedViewport, onViewportChange, viewport],
  );
  const setScrollAreaElement = React.useCallback((element: HTMLDivElement | null) => {
    scrollAreaRef.current = element;
    setScrollAreaStateElement((currentElement) =>
      currentElement === element ? currentElement : element,
    );
  }, []);
  const setNodeElement = React.useCallback((nodeId: string, element: SVGGElement | null) => {
    if (element) {
      nodeRefs.current.set(nodeId, element);
    } else {
      nodeRefs.current.delete(nodeId);
    }
  }, []);
  const setHighlighted = React.useCallback(
    (element: DiagramElementRef | null) => {
      if (highlightedElement === undefined) {
        setInternalHighlightedElement(element);
      }

      onHighlightedElementChange?.(element);
    },
    [highlightedElement, onHighlightedElementChange],
  );
  const inspectEdge = React.useCallback(
    (edgeId: string | null, role: "tooltip" | "dialog" = "tooltip", point?: DiagramPoint) => {
      if (inspectedEdgeId === undefined) {
        setInternalInspectedEdgeId(edgeId);
      }

      setInspectorRole(role);
      setInspectorPoint(point ?? null);
      onInspectedEdgeIdChange?.(edgeId);
    },
    [inspectedEdgeId, onInspectedEdgeIdChange],
  );
  const clearInspector = React.useCallback(() => {
    inspectEdge(null);
  }, [inspectEdge]);
  const query = searchQuery ?? internalSearchQuery;
  const setQuery = React.useCallback(
    (nextQuery: string) => {
      if (searchQuery === undefined) {
        setInternalSearchQuery(nextQuery);
      }

      setFocusedResultIndex(0);
      onSearchQueryChange?.(nextQuery);
    },
    [onSearchQueryChange, searchQuery],
  );
  const searchIndex = React.useMemo(
    () => buildDiagramSearchIndex(nodes, edges, getSearchText),
    [edges, getSearchText, nodes],
  );
  const searchResults = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return searchIndex.filter((entry) => entry.searchText.includes(normalizedQuery));
  }, [query, searchIndex]);
  const controlledFocusedResult = focusedSearchResult
    ? (searchResults.find((result) => isSameDiagramElementRef(result.ref, focusedSearchResult)) ??
      null)
    : null;
  const effectiveFocusedSearchResult =
    controlledFocusedResult ??
    searchResults[focusedResultIndex % Math.max(searchResults.length, 1)] ??
    null;
  const inspectedId = inspectedEdgeId !== undefined ? inspectedEdgeId : internalInspectedEdgeId;
  const inspectedEdge = inspectedId ? edges.find((edge) => edge.id === inspectedId) : undefined;
  const activeElement =
    hoveredElement ??
    (features.search ? effectiveFocusedSearchResult?.ref : null) ??
    (highlightedElement !== undefined ? highlightedElement : internalHighlightedElement);
  const connectedElements = React.useMemo(
    () =>
      features.pathHighlight
        ? getConnectedElementIds(edges, activeElement ?? null, features.pathHighlightMode)
        : { nodeIds: new Set<string>(), edgeIds: new Set<string>() },
    [activeElement, edges, features.pathHighlight, features.pathHighlightMode],
  );

  React.useEffect(() => {
    if (!features.search || !query.trim()) {
      onFocusedSearchResultChange?.(null);
      return;
    }

    onFocusedSearchResultChange?.(effectiveFocusedSearchResult);

    if (!effectiveFocusedSearchResult) {
      return;
    }

    if (effectiveFocusedSearchResult.ref.kind === "node") {
      queueMicrotask(() =>
        nodeRefs.current.get(effectiveFocusedSearchResult.ref.id)?.focus({ preventScroll: true }),
      );
    } else if (features.edgeInspector) {
      queueMicrotask(() => inspectEdge(effectiveFocusedSearchResult.ref.id, "dialog"));
    }

    focusViewportOnElement(
      effectiveFocusedSearchResult.ref,
      nodes,
      edges,
      currentViewport,
      setViewport,
    );
  }, [
    currentViewport,
    edges,
    effectiveFocusedSearchResult,
    features.edgeInspector,
    features.search,
    inspectEdge,
    nodes,
    onFocusedSearchResultChange,
    query,
    setViewport,
  ]);

  React.useEffect(() => {
    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === " ") {
        isSpacePressedRef.current = true;
      }

      if (event.key === "Escape" && inspectedId && inspectedEdgeId === undefined) {
        clearInspector();
      }
    }

    function handleDocumentKeyUp(event: KeyboardEvent) {
      if (event.key === " ") {
        isSpacePressedRef.current = false;
      }
    }

    document.addEventListener("keydown", handleDocumentKeyDown);
    document.addEventListener("keyup", handleDocumentKeyUp);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
      document.removeEventListener("keyup", handleDocumentKeyUp);
    };
  }, [clearInspector, inspectedEdgeId, inspectedId]);

  const zoomAtCenter = React.useCallback(
    (zoomFactor: number) => {
      const center = {
        x: currentViewport.x + currentViewport.width / 2,
        y: currentViewport.y + currentViewport.height / 2,
      };
      setViewport(
        zoomViewportAtPoint(currentViewport, center, zoomFactor, 0.25, 4, fittedViewport),
        "zoom",
      );
    },
    [currentViewport, fittedViewport, setViewport],
  );
  const fit = React.useCallback(
    () => setViewport(fittedViewport, "fit"),
    [fittedViewport, setViewport],
  );
  const reset = React.useCallback(
    () => setViewport(defaultViewport ?? fittedViewport, "reset"),
    [defaultViewport, fittedViewport, setViewport],
  );
  const focusSearchResult = React.useCallback(
    (direction: 1 | -1) => {
      if (!searchResults.length) {
        return;
      }

      setFocusedResultIndex(
        (current) => (current + direction + searchResults.length) % searchResults.length,
      );
    },
    [searchResults.length],
  );
  const clearSearch = React.useCallback(() => {
    setQuery("");
    if (highlightedElement === undefined) {
      setInternalHighlightedElement(null);
    }
    onFocusedSearchResultChange?.(null);
  }, [highlightedElement, onFocusedSearchResultChange, setQuery]);

  const svgProps = {
    ref: (element: SVGSVGElement | null) => {
      svgRef.current = element;
    },
    onWheel: (event: React.WheelEvent<SVGSVGElement>) => {
      if (!features.viewport || (!event.ctrlKey && !event.metaKey)) {
        return;
      }

      event.preventDefault();
      const svg = svgRef.current;

      if (!svg) {
        return;
      }

      const point = getDiagramPointFromClientPoint(svg, event.clientX, event.clientY);
      const factor = event.deltaY > 0 ? 0.85 : 1.15;
      setViewport(
        zoomViewportAtPoint(currentViewport, point, factor, 0.25, 4, fittedViewport),
        "zoom",
      );
    },
    onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => {
      if (!features.viewport || event.button !== 0 || shouldIgnoreCanvasPanTarget(event.target)) {
        return;
      }

      if (!isSpacePressedRef.current && event.target !== event.currentTarget) {
        return;
      }

      isPanningRef.current = true;
      panStartRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        viewport: currentViewport,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: React.PointerEvent<SVGSVGElement>) => {
      if (!isPanningRef.current || !panStartRef.current) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const scaleX = panStartRef.current.viewport.width / Math.max(rect.width, 1);
      const scaleY = panStartRef.current.viewport.height / Math.max(rect.height, 1);

      setViewport(
        panViewport(panStartRef.current.viewport, {
          x: -(event.clientX - panStartRef.current.clientX) * scaleX,
          y: -(event.clientY - panStartRef.current.clientY) * scaleY,
        }),
        "pan",
      );
    },
    onPointerUp: (event: React.PointerEvent<SVGSVGElement>) => {
      if (!isPanningRef.current) {
        return;
      }

      isPanningRef.current = false;
      panStartRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    onKeyDown: (event: React.KeyboardEvent<SVGSVGElement>) => {
      if (!features.viewport) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomAtCenter(1.15);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomAtCenter(0.85);
      } else if (event.key === "0") {
        event.preventDefault();
        reset();
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        fit();
      }
    },
  } satisfies React.SVGProps<SVGSVGElement>;

  return {
    viewport: currentViewport,
    viewBox: `${currentViewport.x} ${currentViewport.y} ${currentViewport.width} ${currentViewport.height}`,
    setScrollAreaElement,
    setNodeElement,
    svgProps: features.enabled ? svgProps : {},
    overlay: features.enabled ? (
      <DiagramCanvasInteractionOverlay
        features={features}
        query={query}
        resultCount={searchResults.length}
        resultIndex={effectiveFocusedSearchResult ? focusedResultIndex % searchResults.length : -1}
        inspectedEdge={inspectedEdge}
        inspectorRole={inspectorRole}
        inspectorPoint={inspectorPoint}
        scrollArea={scrollAreaElement}
        viewport={currentViewport}
        nodes={nodes}
        renderEdgeInspector={renderEdgeInspector}
        onZoomIn={() => zoomAtCenter(1.15)}
        onZoomOut={() => zoomAtCenter(0.85)}
        onFit={fit}
        onReset={reset}
        onQueryChange={setQuery}
        onSearchNext={() => focusSearchResult(1)}
        onSearchPrevious={() => focusSearchResult(-1)}
        onSearchClear={clearSearch}
        onInspectorClose={clearInspector}
      />
    ) : null,
    getNodeHighlightState: (nodeId: string) =>
      getElementHighlightState({ kind: "node", id: nodeId }, activeElement, connectedElements),
    getEdgeHighlightState: (edgeId: string) =>
      getElementHighlightState({ kind: "edge", id: edgeId }, activeElement, connectedElements),
    getNodeInteractionProps: (nodeId: string) =>
      features.pathHighlight
        ? ({
            onPointerEnter: () => {
              const element = { kind: "node" as const, id: nodeId };
              setHoveredElement(element);
              setHighlighted(element);
            },
            onPointerLeave: () => {
              setHoveredElement(null);
              setHighlighted(null);
            },
            onFocus: () => {
              const element = { kind: "node" as const, id: nodeId };
              setHoveredElement(element);
              setHighlighted(element);
            },
            onBlur: () => {
              setHoveredElement(null);
              setHighlighted(null);
            },
          } satisfies React.SVGProps<SVGGElement>)
        : {},
    getEdgeInteractionProps: (edgeId: string) => {
      const edge = edges.find((item) => item.id === edgeId);
      const describedBy = features.edgeInspector ? `diagram-edge-inspector-${edgeId}` : undefined;

      return {
        tabIndex: features.edgeInspector ? 0 : undefined,
        "aria-describedby": inspectedId === edgeId ? describedBy : undefined,
        onPointerEnter: () => {
          const element = { kind: "edge" as const, id: edgeId };
          setHoveredElement(element);
          setHighlighted(element);
          if (features.edgeInspector) {
            inspectEdge(edgeId, "tooltip", edge?.labelPoint);
          }
        },
        onPointerLeave: () => {
          setHoveredElement(null);
          setHighlighted(null);
          if (
            features.edgeInspector &&
            inspectedEdgeId === undefined &&
            inspectorRole === "tooltip"
          ) {
            inspectEdge(null);
          }
        },
        onFocus: () => {
          const element = { kind: "edge" as const, id: edgeId };
          setHoveredElement(element);
          setHighlighted(element);
          if (features.edgeInspector) {
            inspectEdge(edgeId, "tooltip", edge?.labelPoint);
          }
        },
        onBlur: () => {
          setHoveredElement(null);
          setHighlighted(null);
          if (
            features.edgeInspector &&
            inspectedEdgeId === undefined &&
            inspectorRole === "tooltip"
          ) {
            inspectEdge(null);
          }
        },
        onClick: () => {
          if (features.edgeInspector) {
            inspectEdge(edgeId, "dialog", edge?.labelPoint);
          }
        },
        onKeyDown: (event: React.KeyboardEvent<SVGGElement>) => {
          if (event.key === "Escape" && features.edgeInspector && inspectedEdgeId === undefined) {
            inspectEdge(null);
          }
        },
      } satisfies React.SVGProps<SVGGElement>;
    },
    searchResults,
    focusedSearchResult: effectiveFocusedSearchResult,
    inspectEdge,
    clearInspector,
  };
}

function DiagramCanvasInteractionOverlay<TNode, TEdge>({
  features,
  query,
  resultCount,
  resultIndex,
  inspectedEdge,
  inspectorRole,
  inspectorPoint,
  scrollArea,
  viewport,
  nodes,
  renderEdgeInspector,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  onQueryChange,
  onSearchNext,
  onSearchPrevious,
  onSearchClear,
  onInspectorClose,
}: {
  features: ResolvedDiagramInteractiveFeatures;
  query: string;
  resultCount: number;
  resultIndex: number;
  inspectedEdge?: DiagramEdgeDescriptor<TEdge>;
  inspectorRole: "tooltip" | "dialog";
  inspectorPoint: DiagramPoint | null;
  scrollArea: HTMLDivElement | null;
  viewport: DiagramViewport;
  nodes: readonly DiagramNodeDescriptor<TNode>[];
  renderEdgeInspector?: DiagramInteractiveProps<TNode, TEdge>["renderEdgeInspector"];
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  onQueryChange: (query: string) => void;
  onSearchNext: () => void;
  onSearchPrevious: () => void;
  onSearchClear: () => void;
  onInspectorClose: () => void;
}) {
  const [searchOpen, setSearchOpen] = React.useState(Boolean(query));
  const effectiveSearchOpen = searchOpen || Boolean(query);
  const showControls =
    features.controls !== "none" &&
    (features.controls === "always" || features.viewport || features.search);
  const inspectorContext = inspectedEdge
    ? getDiagramEdgeInspectorContext(inspectedEdge, nodes)
    : null;
  const customInspectorContent = inspectorContext
    ? renderEdgeInspector?.(inspectorContext)
    : undefined;
  const inspectorContent =
    customInspectorContent !== undefined
      ? customInspectorContent
      : inspectorContext
        ? renderDefaultDiagramEdgeInspector(inspectorContext)
        : null;

  return (
    <>
      {showControls ? (
        <div
          data-slot="diagram-canvas-interaction-overlay"
          className="absolute right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] items-center gap-1"
        >
          {features.search && effectiveSearchOpen ? (
            <div className="flex min-w-0 items-center gap-1 rounded-sm border bg-background/90 p-1 shadow-sm">
              <SearchIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <input
                aria-label="Search diagram"
                value={query}
                className="h-7 w-32 min-w-0 bg-transparent px-1 text-sm outline-none sm:w-44"
                onChange={(event) => onQueryChange(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (event.shiftKey) {
                      onSearchPrevious();
                    } else {
                      onSearchNext();
                    }
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    onSearchClear();
                    setSearchOpen(false);
                  }
                }}
              />
              {query ? (
                <span className="whitespace-nowrap px-1 text-xs text-muted-foreground">
                  {resultCount ? `${resultIndex + 1} / ${resultCount}` : "0 / 0"}
                </span>
              ) : null}
              <button
                type="button"
                aria-label="Previous search result"
                disabled={!resultCount}
                className={diagramCanvasOverlayButtonClass}
                onClick={onSearchPrevious}
              >
                <ChevronUpIcon aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next search result"
                disabled={!resultCount}
                className={diagramCanvasOverlayButtonClass}
                onClick={onSearchNext}
              >
                <ChevronDownIcon aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Close search"
                className={diagramCanvasOverlayButtonClass}
                onClick={() => {
                  onSearchClear();
                  setSearchOpen(false);
                }}
              >
                <XIcon aria-hidden="true" />
              </button>
            </div>
          ) : null}
          {features.search && !effectiveSearchOpen ? (
            <button
              type="button"
              aria-label="Search diagram"
              className={diagramCanvasOverlayButtonClass}
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon aria-hidden="true" />
            </button>
          ) : null}
          {features.viewport ? (
            <>
              <button
                type="button"
                aria-label="Zoom in"
                className={diagramCanvasOverlayButtonClass}
                onClick={onZoomIn}
              >
                <ZoomInIcon aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                className={diagramCanvasOverlayButtonClass}
                onClick={onZoomOut}
              >
                <ZoomOutIcon aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Fit diagram"
                className={diagramCanvasOverlayButtonClass}
                onClick={onFit}
              >
                <Maximize2Icon aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Reset view"
                className={diagramCanvasOverlayButtonClass}
                onClick={onReset}
              >
                <RotateCcwIcon aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
      {inspectedEdge && inspectorContext && inspectorContent ? (
        <div
          id={`diagram-edge-inspector-${inspectedEdge.id}`}
          role={inspectorRole}
          aria-label={inspectorRole === "dialog" ? "Edge details" : undefined}
          data-slot="diagram-edge-inspector"
          className="absolute z-20 max-w-64 rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-md"
          style={getInspectorOverlayStyle(
            inspectorPoint ??
              inspectedEdge.labelPoint ??
              getDiagramEdgeFallbackPoint(inspectedEdge, nodes),
            viewport,
            scrollArea,
          )}
        >
          {inspectorRole === "dialog" ? (
            <button
              type="button"
              aria-label="Close edge details"
              className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-3.5"
              onClick={onInspectorClose}
            >
              <XIcon aria-hidden="true" />
            </button>
          ) : null}
          {inspectorContent}
        </div>
      ) : null}
    </>
  );
}

function resolveDiagramInteractiveFeatures(
  features: DiagramInteractiveFeatures | undefined,
): ResolvedDiagramInteractiveFeatures {
  if (features === true) {
    return {
      enabled: true,
      viewport: true,
      pathHighlight: true,
      pathHighlightMode: "neighbors",
      search: true,
      edgeInspector: true,
      controls: "auto",
    };
  }

  if (!features) {
    return {
      enabled: false,
      viewport: false,
      pathHighlight: false,
      pathHighlightMode: "neighbors",
      search: false,
      edgeInspector: false,
      controls: "auto",
    };
  }

  const pathHighlight = Boolean(features.pathHighlight);

  return {
    enabled: true,
    viewport: Boolean(features.viewport),
    pathHighlight,
    pathHighlightMode:
      typeof features.pathHighlight === "object"
        ? (features.pathHighlight.mode ?? "neighbors")
        : "neighbors",
    search: Boolean(features.search),
    edgeInspector: Boolean(features.edgeInspector),
    controls: features.controls ?? "auto",
  };
}

function getViewportZoom(viewport: DiagramViewport, fittedViewport: DiagramViewport) {
  const widthZoom = fittedViewport.width / Math.max(viewport.width, 1);
  const heightZoom = fittedViewport.height / Math.max(viewport.height, 1);

  return Math.min(widthZoom, heightZoom);
}

function clampDiagramViewport(viewport: DiagramViewport, fittedViewport: DiagramViewport) {
  const minScale = 1 / 4;
  const maxScale = 4;
  const minWidth = fittedViewport.width / maxScale;
  const maxWidth = fittedViewport.width / minScale;
  const minHeight = fittedViewport.height / maxScale;
  const maxHeight = fittedViewport.height / minScale;
  const width = Math.min(maxWidth, Math.max(minWidth, viewport.width));
  const height = Math.min(maxHeight, Math.max(minHeight, viewport.height));
  const marginX = fittedViewport.width * 0.25;
  const marginY = fittedViewport.height * 0.25;
  const minX = fittedViewport.x - width + marginX;
  const maxX = fittedViewport.x + fittedViewport.width - marginX;
  const minY = fittedViewport.y - height + marginY;
  const maxY = fittedViewport.y + fittedViewport.height - marginY;

  return {
    x: Math.min(maxX, Math.max(minX, viewport.x)),
    y: Math.min(maxY, Math.max(minY, viewport.y)),
    width,
    height,
  };
}

function shouldIgnoreCanvasPanTarget(target: EventTarget) {
  return (
    target instanceof Element &&
    Boolean(target.closest("button,a,input,select,textarea,[role='button'],[role='menuitem']"))
  );
}

function getElementHighlightState(
  element: DiagramElementRef,
  activeElement: DiagramElementRef | null | undefined,
  connectedElements: { nodeIds: Set<string>; edgeIds: Set<string> },
) {
  if (!activeElement) {
    return undefined;
  }

  if (isSameDiagramElementRef(element, activeElement)) {
    return "active" as const;
  }

  const related =
    element.kind === "node"
      ? connectedElements.nodeIds.has(element.id)
      : connectedElements.edgeIds.has(element.id);

  return related ? ("related" as const) : ("dimmed" as const);
}

function isSameDiagramElementRef(first: DiagramElementRef, second: DiagramElementRef) {
  return first.kind === second.kind && first.id === second.id;
}

function getTraversalDirections<TEdge>(edge: DiagramEdgeDescriptor<TEdge>) {
  if (edge.direction === "backward") {
    return [{ from: edge.targetId, to: edge.sourceId }];
  }

  if (edge.direction === "both" || edge.direction === "none") {
    return [
      { from: edge.sourceId, to: edge.targetId },
      { from: edge.targetId, to: edge.sourceId },
    ];
  }

  return [{ from: edge.sourceId, to: edge.targetId }];
}

function focusViewportOnElement<TNode, TEdge>(
  element: DiagramElementRef,
  nodes: readonly DiagramNodeDescriptor<TNode>[],
  edges: readonly DiagramEdgeDescriptor<TEdge>[],
  viewport: DiagramViewport,
  setViewport: (viewport: DiagramViewport, reason: DiagramViewportChangeReason) => void,
) {
  const point =
    element.kind === "node"
      ? getBoundsCenter(nodes.find((node) => node.id === element.id)?.bounds)
      : (edges.find((edge) => edge.id === element.id)?.labelPoint ?? null);

  if (!point || pointInViewport(point, viewport)) {
    return;
  }

  setViewport(
    {
      ...viewport,
      x: point.x - viewport.width / 2,
      y: point.y - viewport.height / 2,
    },
    "search",
  );
}

function pointInViewport(point: DiagramPoint, viewport: DiagramViewport) {
  return (
    point.x >= viewport.x &&
    point.x <= viewport.x + viewport.width &&
    point.y >= viewport.y &&
    point.y <= viewport.y + viewport.height
  );
}

function getBoundsCenter(bounds: DiagramBounds | undefined): DiagramPoint | null {
  return bounds ? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 } : null;
}

function getDefaultDiagramSearchText(
  id: string,
  label: React.ReactNode,
  item: unknown,
  ...extraValues: unknown[]
) {
  const values = [id, getPrimitiveReactNodeText(label), ...extraValues];

  if (item && typeof item === "object") {
    for (const value of Object.values(item as Record<string, unknown>)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        values.push(String(value));
      }
    }
  }

  return values.filter(Boolean).join(" ");
}

function getDiagramSearchLabel(label: React.ReactNode, fallback: string) {
  return getPrimitiveReactNodeText(label) || fallback;
}

function getPrimitiveReactNodeText(value: React.ReactNode) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function getDiagramEdgeInspectorContext<TNode, TEdge>(
  edge: DiagramEdgeDescriptor<TEdge>,
  nodes: readonly DiagramNodeDescriptor<TNode>[],
): DiagramEdgeInspectorContext<TNode, TEdge> {
  return {
    edge: edge.item,
    source: nodes.find((node) => node.id === edge.sourceId)?.item,
    target: nodes.find((node) => node.id === edge.targetId)?.item,
    edgeId: edge.id,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    label: edge.label,
    kind: edge.kind,
    direction: edge.direction,
  };
}

function renderDefaultDiagramEdgeInspector<TNode, TEdge>(
  context: DiagramEdgeInspectorContext<TNode, TEdge>,
) {
  const edge = context.edge as Record<string, unknown>;
  const sourceLabel = getRecordLabel(context.source, context.sourceId);
  const targetLabel = getRecordLabel(context.target, context.targetId);
  const metadata = [
    ["Kind", getRenderableMetadataValue(context.kind ?? edge.kind)],
    ["Status", getRenderableMetadataValue(edge.status)],
    ["Direction", getRenderableMetadataValue(context.direction)],
    ["Protocol", getRenderableMetadataValue(edge.protocol)],
    ["Source cardinality", getRenderableMetadataValue(edge.sourceCardinality)],
    ["Target cardinality", getRenderableMetadataValue(edge.targetCardinality)],
    [
      "Identifying",
      typeof edge.identifying === "boolean" ? (edge.identifying ? "Yes" : "No") : undefined,
    ],
    ["Event", getRenderableMetadataValue(edge.event)],
    ["Guard", getRenderableMetadataValue(edge.guard)],
    ["Action", getRenderableMetadataValue(edge.action)],
    ["Message kind", getRenderableMetadataValue(edge.kind)],
    ["Description", getRenderableMetadataValue(edge.description)],
    ["Source label", getRenderableMetadataValue(edge.sourceLabel)],
    ["Target label", getRenderableMetadataValue(edge.targetLabel)],
  ].filter((item): item is [string, React.ReactNode] => item[1] != null && item[1] !== "");
  const title =
    getRenderableMetadataValue(context.label) ??
    getRenderableMetadataValue(edge.label) ??
    getRenderableMetadataValue(edge.event) ??
    getRenderableMetadataValue(edge.id) ??
    context.edgeId;

  return (
    <div className="grid gap-2 pr-4">
      <div className="font-medium leading-5">{title}</div>
      <dl className="grid gap-1 text-xs">
        <div className="grid grid-cols-[auto_1fr] gap-x-2">
          <dt className="text-muted-foreground">From</dt>
          <dd className="min-w-0 truncate">{sourceLabel}</dd>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-2">
          <dt className="text-muted-foreground">To</dt>
          <dd className="min-w-0 truncate">{targetLabel}</dd>
        </div>
        {metadata.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[auto_1fr] gap-x-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 truncate">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function getRecordLabel(item: unknown, fallback: string | undefined) {
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const label = record.label ?? record.name ?? record.title;

    if (typeof label === "string" || typeof label === "number") {
      return String(label);
    }
  }

  return fallback ?? "";
}

function getRenderableMetadataValue(value: unknown): React.ReactNode | undefined {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    React.isValidElement(value)
  ) {
    return value;
  }

  return undefined;
}

function getDiagramEdgeFallbackPoint<TNode, TEdge>(
  edge: DiagramEdgeDescriptor<TEdge>,
  nodes: readonly DiagramNodeDescriptor<TNode>[],
) {
  const source = getBoundsCenter(nodes.find((node) => node.id === edge.sourceId)?.bounds);
  const target = getBoundsCenter(nodes.find((node) => node.id === edge.targetId)?.bounds);

  if (source && target) {
    return { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 };
  }

  return source ?? target ?? { x: 0, y: 0 };
}

function getInspectorOverlayStyle(
  point: DiagramPoint,
  viewport: DiagramViewport,
  scrollArea: HTMLDivElement | null,
): React.CSSProperties {
  if (!scrollArea) {
    return { right: 8, top: 48 };
  }

  const width = scrollArea.clientWidth || 320;
  const height = scrollArea.clientHeight || 240;
  const x = ((point.x - viewport.x) / Math.max(viewport.width, 1)) * width + scrollArea.scrollLeft;
  const y = ((point.y - viewport.y) / Math.max(viewport.height, 1)) * height + scrollArea.scrollTop;

  return {
    left: Math.min(
      scrollArea.scrollLeft + width - 272,
      Math.max(scrollArea.scrollLeft + 8, x + 12),
    ),
    top: Math.min(scrollArea.scrollTop + height - 140, Math.max(scrollArea.scrollTop + 8, y + 12)),
  };
}

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
  highlightState,
  interactionProps,
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
  highlightState?: "active" | "related" | "dimmed";
  interactionProps?: React.SVGProps<SVGGElement>;
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
      data-highlight-state={highlightState}
      role={role}
      aria-label={role ? resolvedAccessibleName : undefined}
      aria-pressed={role ? selected : undefined}
      aria-disabled={role ? disabled || undefined : undefined}
      tabIndex={keyboardMode === "nodes" && focused && !disabled ? 0 : -1}
      className={[
        "outline-none",
        onSelect ? `cursor-pointer focus-visible:[&_[data-slot='${slot}-focus']]:stroke-ring` : "",
        disabled ? "opacity-60" : "",
        "transition-opacity data-[highlight-state=related]:opacity-100 data-[disabled=true]:data-[highlight-state=related]:opacity-60 data-[highlight-state=dimmed]:opacity-25 data-[highlight-state=active]:[&_[data-slot$='-node']>div]:ring-2 data-[highlight-state=active]:[&_[data-slot$='-node']>div]:ring-ring/60 data-[highlight-state=active]:[&_[data-slot$='-summary-node']>div]:ring-2 data-[highlight-state=active]:[&_[data-slot$='-summary-node']>div]:ring-ring/60",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onSelect && !disabled ? () => onSelect(item) : undefined}
      onPointerEnter={interactionProps?.onPointerEnter}
      onPointerLeave={interactionProps?.onPointerLeave}
      onFocus={(event) => {
        interactionProps?.onFocus?.(event);
        onFocus(item);
      }}
      onBlur={interactionProps?.onBlur}
      onKeyDown={(event) => {
        interactionProps?.onKeyDown?.(event);
        onKeyDown(event, item);
      }}
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
