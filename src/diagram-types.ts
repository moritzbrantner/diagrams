import type * as React from "react";

/** A two-dimensional point in diagram coordinate space. */
export type DiagramPoint = {
  x: number;
  y: number;
};

/** Shared tone names supported by diagram nodes, edges, and structural regions. */
export type DiagramTone = "default" | "accent" | "success" | "warning" | "danger" | "muted";

/** Direction used by edge-like relationships when arrow markers are rendered. */
export type DiagramDirection = "forward" | "backward" | "both" | "none";

/** Rectangular bounds accepted by shared layout and interaction helpers. */
export type DiagramBoundsItem = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

/** Concrete rectangular bounds in diagram coordinate space. */
export type DiagramBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Public element families that shared interactive diagram features can address. */
export type DiagramElementKind = "node" | "edge";

/** Stable reference to a node or edge inside a diagram. */
export type DiagramElementRef = {
  kind: DiagramElementKind;
  id: string;
};

/** Visible viewport for an SVG-backed diagram canvas. */
export type DiagramViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Reason emitted when a controlled diagram viewport changes. */
export type DiagramViewportChangeReason =
  | "fit"
  | "reset"
  | "pan"
  | "zoom"
  | "search"
  | "programmatic";

/** Graph traversal mode used when path highlighting is enabled. */
export type DiagramPathHighlightMode = "neighbors" | "incoming" | "outgoing" | "connected";

/** Shared optional interaction feature flags for SVG-backed diagrams. */
export type DiagramInteractiveFeatures =
  | boolean
  | {
      viewport?: boolean;
      pathHighlight?: boolean | { mode?: DiagramPathHighlightMode };
      search?: boolean;
      edgeInspector?: boolean;
      controls?: "auto" | "always" | "none";
    };

/** A search hit returned through shared diagram search callbacks. */
export type DiagramSearchResult<TNode, TEdge> = {
  ref: DiagramElementRef;
  label: string;
  item: TNode | TEdge;
};

/** Context passed to custom edge inspector renderers. */
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

/** Normalized node metadata consumed by shared interaction helpers. */
export type DiagramNodeDescriptor<TNode> = {
  id: string;
  item: TNode;
  label?: React.ReactNode;
  bounds: DiagramBounds;
};

/** Normalized edge metadata consumed by shared interaction helpers. */
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

/** Shared controlled props for diagrams that opt into canvas interaction features. */
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

/** Shared action shape for selectable diagram items. */
export type DiagramItemAction<TItem> = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (item: TItem) => void;
};
