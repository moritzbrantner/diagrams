// Compatibility entry point. Prefer /core for server-safe model/state helpers and /react for client UI.
export * from "./architecture-diagram";
export * from "./decision-tree";
export * from "./dependency-graph";
export * from "./entity-relationship-diagram";
export * from "./gantt-chart";
export * from "./journey-map";
export * from "./mind-map";
export * from "./org-chart";
export * from "./process-map";
export * from "./relationship-map";
export * from "./sequence-diagram";
export * from "./state-machine-diagram";
export * from "./swimlane-diagram";
export * from "./timeline-diagram";
export * from "./uml-diagram";
export * from "./view-state";
export * from "./structured-data";
export type {
  DiagramBounds,
  DiagramBoundsItem,
  DiagramDirection,
  DiagramElementKind,
  DiagramElementRef,
  DiagramInteractiveFeatures,
  DiagramPathHighlightMode,
  DiagramPoint,
  DiagramTone,
  DiagramViewport,
  DiagramViewportChangeReason,
} from "./diagram-core-types";
export type {
  DiagramEdgeInspectorContext,
  DiagramInteractiveProps,
  DiagramItemAction,
  DiagramSearchResult,
} from "./diagram-types";
