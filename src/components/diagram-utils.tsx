"use client";

import * as React from "react";

export {
  diagramCanvasLabelVisibilityClass,
  useDiagramCanvasSettings,
} from "./diagram-canvas-state";
export { useDiagramZoomControls } from "./diagram-canvas-controls";
export { useDiagramCanvasInteractions } from "./diagram-canvas-interactions";
export {
  getDiagramEdgeFallbackPoint,
  getDiagramEdgeInspectorContext,
  getInspectorOverlayStyle,
  renderDefaultDiagramEdgeInspector,
} from "./diagram-edge-inspector";
export {
  clampFiniteNumber,
  getAutoGridPosition,
  getCenter,
  getNearestDiagramItem,
  getSpatialBounds,
  pointsToPath,
} from "./diagram-geometry";
export type { DiagramKeyboardKey } from "./diagram-geometry";
export { getBoundaryPoint, getHullRoute, getOrthogonalRoute } from "./diagram-routing";
export type { HullRoute, HullRouteInput } from "./diagram-routing";
export { buildDiagramSearchIndex, getConnectedElementIds } from "./diagram-search";
export { DiagramSvgItemInteraction } from "./diagram-svg-interaction";
export { defaultEdgeToneClasses, defaultSvgToneClasses, defaultToneClasses } from "./diagram-tones";
export {
  getDiagramCanvasStyle,
  getDiagramPointFromClientPoint,
  getFittedViewport,
  panViewport,
  zoomViewportAtPoint,
} from "./diagram-viewport";
export type {
  DiagramBounds,
  DiagramBoundsItem,
  DiagramDirection,
  DiagramEdgeDescriptor,
  DiagramEdgeInspectorContext,
  DiagramElementKind,
  DiagramElementRef,
  DiagramInteractiveFeatures,
  DiagramInteractiveProps,
  DiagramItemAction,
  DiagramNodeDescriptor,
  DiagramPathHighlightMode,
  DiagramPoint,
  DiagramSearchResult,
  DiagramTone,
  DiagramViewport,
  DiagramViewportChangeReason,
} from "../diagram-types";

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
