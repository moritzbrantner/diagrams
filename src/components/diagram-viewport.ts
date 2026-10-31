import { getBoundsCenter } from "./diagram-geometry";

import type {
  DiagramBounds,
  DiagramElementRef,
  DiagramEdgeDescriptor,
  DiagramNodeDescriptor,
  DiagramPoint,
  DiagramViewport,
  DiagramViewportChangeReason,
} from "../diagram-types";
import type * as React from "react";

export function getFittedViewport(bounds: DiagramBounds, padding = 32): DiagramViewport {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: Math.max(1, bounds.width + padding * 2),
    height: Math.max(1, bounds.height + padding * 2),
  };
}

export function getDiagramCanvasStyle(
  bounds: DiagramBounds,
  {
    minHeight = 0,
    minWidth = 0,
    padding = 32,
  }: {
    minHeight?: number;
    minWidth?: number;
    padding?: number;
  } = {},
): React.CSSProperties {
  const width = Math.ceil(Math.max(minWidth, bounds.width + padding * 2));
  const height = Math.ceil(Math.max(minHeight, bounds.height + padding * 2));

  return {
    height,
    width: `max(100%, ${width}px)`,
  };
}

export function diagramViewportEquals(first: DiagramViewport, second: DiagramViewport) {
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

const WHEEL_LINE_PIXEL_SIZE = 16;
const WHEEL_PAGE_PIXEL_SIZE = 800;

export function getWheelDeltaPixels(
  event: Pick<React.WheelEvent, "deltaMode" | "deltaX" | "deltaY">,
  scrollArea: HTMLElement | null,
) {
  const pageSize = scrollArea?.clientHeight || WHEEL_PAGE_PIXEL_SIZE;
  const multiplier =
    event.deltaMode === 1 ? WHEEL_LINE_PIXEL_SIZE : event.deltaMode === 2 ? pageSize : 1;

  return {
    x: event.deltaX * multiplier,
    y: event.deltaY * multiplier,
  };
}

export function scrollElementByWheelDelta(element: HTMLElement, axis: "x" | "y", delta: number) {
  if (!Number.isFinite(delta) || delta === 0) {
    return false;
  }

  const current = axis === "x" ? element.scrollLeft : element.scrollTop;
  const max =
    axis === "x"
      ? Math.max(0, element.scrollWidth - element.clientWidth)
      : Math.max(0, element.scrollHeight - element.clientHeight);
  const next = Math.min(max, Math.max(0, current + delta));

  if (Math.abs(next - current) < 0.5) {
    return false;
  }

  if (axis === "x") {
    element.scrollLeft = next;
  } else {
    element.scrollTop = next;
  }

  return true;
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

function getViewportZoom(viewport: DiagramViewport, fittedViewport: DiagramViewport) {
  const widthZoom = fittedViewport.width / Math.max(viewport.width, 1);
  const heightZoom = fittedViewport.height / Math.max(viewport.height, 1);

  return Math.min(widthZoom, heightZoom);
}

export function clampDiagramViewport(viewport: DiagramViewport, fittedViewport: DiagramViewport) {
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

export function focusViewportOnElement<TNode, TEdge>(
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
