import { getCenter, normalizeBounds } from "./diagram-geometry";

import type { DiagramBounds, DiagramBoundsItem, DiagramPoint } from "../diagram-types";

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
  // Every candidate route and label position tests against every obstacle, so normalize them once.
  const obstacleBounds = obstacles.map(normalizeBounds);

  if (points?.length) {
    const routePoints = simplifyRoutePoints(points);

    return {
      labelPoint: getRouteLabelPoint(routePoints, obstacleBounds),
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
        obstacleBounds,
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
      labelPoint: getRouteLabelPoint(routePoints, obstacleBounds),
      points: routePoints,
    };
  }

  const start = getBoundaryAnchor(source, targetCenter);
  const end = getBoundaryAnchor(target, sourceCenter);
  const routePoints = getBestOrthogonalRoute({
    edgeIndex,
    end,
    obstacleBounds,
    source,
    start,
    target,
  });

  return {
    labelPoint: getRouteLabelPoint(routePoints, obstacleBounds),
    points: routePoints,
  };
}

function getBestOrthogonalRoute({
  source,
  target,
  start,
  end,
  obstacleBounds,
  edgeIndex,
}: {
  source: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>;
  target: Required<Pick<DiagramBoundsItem, "x" | "y" | "width" | "height">>;
  start: BoundaryAnchor;
  end: BoundaryAnchor;
  obstacleBounds: readonly DiagramBounds[];
  edgeIndex: number;
}) {
  const sourceBounds = normalizeBounds(source);
  const targetBounds = normalizeBounds(target);
  const routeObstacles = obstacleBounds.filter(
    (obstacle) => !sameBounds(sourceBounds, obstacle) && !sameBounds(targetBounds, obstacle),
  );
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
      score: getRouteScore(points, routeObstacles),
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

function getRouteScore(points: readonly DiagramPoint[], obstacles: readonly DiagramBounds[]) {
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
      if (segmentIntersectsBounds(start, end, obstacle, 10)) {
        score += 1200;
      }
    }
  }

  return score;
}

function getRouteLabelPoint(
  points: readonly DiagramPoint[],
  obstacles: readonly DiagramBounds[],
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

function getLabelObstaclePenalty(point: DiagramPoint, obstacles: readonly DiagramBounds[]) {
  const labelBounds = normalizeBounds({
    x: point.x - 76,
    y: point.y - 24,
    width: 152,
    height: 48,
  });

  return obstacles.reduce(
    (penalty, obstacle) => penalty + (boundsOverlap(labelBounds, obstacle, 8) ? 800 : 0),
    0,
  );
}

function boundsOverlap(firstBounds: DiagramBounds, secondBounds: DiagramBounds, padding = 0) {
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
  bounds: DiagramBounds,
  padding = 0,
) {
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

function sameBounds(firstBounds: DiagramBounds, secondBounds: DiagramBounds) {
  return (
    firstBounds.x === secondBounds.x &&
    firstBounds.y === secondBounds.y &&
    firstBounds.width === secondBounds.width &&
    firstBounds.height === secondBounds.height
  );
}
