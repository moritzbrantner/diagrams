"use client";

import * as React from "react";

import { DiagramCanvasInteractionOverlay } from "./diagram-canvas-overlay";
import { resolveDiagramInteractiveFeatures } from "./diagram-interactive-features";
import {
  buildDiagramSearchIndex,
  getConnectedElementIds,
  isSameDiagramElementRef,
} from "./diagram-search";
import {
  clampDiagramViewport,
  diagramViewportEquals,
  focusViewportOnElement,
  getDiagramPointFromClientPoint,
  getFittedViewport,
  getWheelDeltaPixels,
  panViewport,
  scrollElementByWheelDelta,
  zoomViewportAtPoint,
} from "./diagram-viewport";

import type {
  DiagramBounds,
  DiagramEdgeDescriptor,
  DiagramElementRef,
  DiagramInteractiveProps,
  DiagramNodeDescriptor,
  DiagramPoint,
  DiagramViewport,
  DiagramViewportChangeReason,
} from "../diagram-types";

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
  // When a consumer releases control (e.g. a URL-owned clear that drops the parameter), discard the
  // ephemeral fallback so a stale preview, pan or default does not resurface over the durable clear.
  const isHighlightControlled = highlightedElement !== undefined;
  const isInspectorControlled = inspectedEdgeId !== undefined;
  const [wasHighlightControlled, setWasHighlightControlled] = React.useState(isHighlightControlled);
  const [wasInspectorControlled, setWasInspectorControlled] = React.useState(isInspectorControlled);
  const isViewportControlled = viewport !== undefined;
  const [wasViewportControlled, setWasViewportControlled] = React.useState(isViewportControlled);
  if (wasViewportControlled !== isViewportControlled) {
    setWasViewportControlled(isViewportControlled);
    if (!isViewportControlled) {
      setInternalViewport(initialViewport);
    }
  }
  if (wasHighlightControlled !== isHighlightControlled) {
    setWasHighlightControlled(isHighlightControlled);
    if (!isHighlightControlled) {
      setInternalHighlightedElement(null);
    }
  }
  if (wasInspectorControlled !== isInspectorControlled) {
    setWasInspectorControlled(isInspectorControlled);
    if (!isInspectorControlled) {
      setInternalInspectedEdgeId(null);
    }
  }
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
  const visualViewport = features.viewport ? currentViewport : fittedViewport;
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
  const shouldResolveConnectedElements = features.pathHighlight || Boolean(hoveredElement);
  const connectedElements = React.useMemo(
    () =>
      shouldResolveConnectedElements
        ? getConnectedElementIds(edges, activeElement ?? null, features.pathHighlightMode)
        : { nodeIds: new Set<string>(), edgeIds: new Set<string>() },
    [activeElement, edges, features.pathHighlightMode, shouldResolveConnectedElements],
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
      if (!features.viewport) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
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
        return;
      }

      const scrollArea = scrollAreaRef.current;

      if (!scrollArea) {
        return;
      }

      const delta = getWheelDeltaPixels(event, scrollArea);
      const consumed = event.shiftKey
        ? scrollElementByWheelDelta(scrollArea, "x", delta.x || delta.y)
        : scrollElementByWheelDelta(scrollArea, "y", delta.y);

      if (consumed) {
        event.preventDefault();
      }
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
    viewport: visualViewport,
    viewBox: `${visualViewport.x} ${visualViewport.y} ${visualViewport.width} ${visualViewport.height}`,
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
