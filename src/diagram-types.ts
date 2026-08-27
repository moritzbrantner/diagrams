import type * as React from "react";

import type {
  DiagramBounds,
  DiagramDirection,
  DiagramElementKind,
  DiagramElementRef,
  DiagramInteractiveFeatures,
  DiagramPathHighlightMode,
  DiagramPoint,
  DiagramViewport,
  DiagramViewportChangeReason,
} from "./diagram-core-types";

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
