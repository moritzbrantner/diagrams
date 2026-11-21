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

import {
  getDiagramEdgeFallbackPoint,
  getDiagramEdgeInspectorContext,
  getInspectorOverlayStyle,
  renderDefaultDiagramEdgeInspector,
} from "./diagram-edge-inspector";

import type {
  DiagramEdgeDescriptor,
  DiagramInteractiveProps,
  DiagramNodeDescriptor,
  DiagramPoint,
  DiagramViewport,
} from "../diagram-types";
import type { ResolvedDiagramInteractiveFeatures } from "./diagram-interactive-features";

const diagramCanvasOverlayButtonClass =
  "inline-flex size-8 items-center justify-center rounded-sm border bg-background/90 text-foreground shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4";

export function DiagramCanvasInteractionOverlay<TNode, TEdge>({
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
