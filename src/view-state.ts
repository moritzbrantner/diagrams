import type {
  DiagramElementRef,
  DiagramViewport,
  DiagramViewportChangeReason,
} from "./diagram-core-types";

export type DiagramViewState = {
  collapsedIds?: string[];
  highlightedElement?: DiagramElementRef | null;
  inspectedEdgeId?: string | null;
  searchQuery?: string;
  viewport?: DiagramViewport;
};

/** A small durable state change emitted by diagram interactions. */
export type DiagramViewDelta =
  | {
      type: "viewport";
      viewport: DiagramViewport;
      reason: DiagramViewportChangeReason;
    }
  | {
      type: "highlighted-element";
      element: DiagramElementRef | null;
    }
  | {
      type: "inspected-edge";
      edgeId: string | null;
    }
  | {
      type: "search-query";
      query: string;
    }
  | {
      type: "collapsed-ids";
      ids: readonly string[];
    };

/**
 * Applies one durable interaction change without copying state when the semantic value is already
 * satisfied. Empty values are canonicalized away so equivalent states have one representation.
 */
export function applyDiagramViewDelta(
  state: DiagramViewState,
  delta: DiagramViewDelta,
): DiagramViewState {
  switch (delta.type) {
    case "viewport": {
      if (!isFiniteViewport(delta.viewport) || viewportEquals(state.viewport, delta.viewport)) {
        return state;
      }

      return { ...state, viewport: delta.viewport };
    }
    case "highlighted-element": {
      const current = state.highlightedElement ?? null;
      if (elementRefEquals(current, delta.element)) {
        return state;
      }

      if (!delta.element) {
        return omitKey(state, "highlightedElement");
      }

      return { ...state, highlightedElement: delta.element };
    }
    case "inspected-edge": {
      const edgeId = delta.edgeId?.trim() || null;
      const current = state.inspectedEdgeId?.trim() || null;
      if (current === edgeId) {
        return state;
      }

      if (!edgeId) {
        return omitKey(state, "inspectedEdgeId");
      }

      return { ...state, inspectedEdgeId: edgeId };
    }
    case "search-query": {
      const query = delta.query.trim();
      const current = state.searchQuery?.trim() ?? "";
      if (current === query) {
        return state;
      }

      if (!query) {
        return omitKey(state, "searchQuery");
      }

      return { ...state, searchQuery: query };
    }
    case "collapsed-ids": {
      const ids = canonicalizeIds(delta.ids);
      const current = canonicalizeIds(state.collapsedIds ?? []);
      if (stringArraysEqual(current, ids)) {
        return state;
      }

      if (!ids.length) {
        return omitKey(state, "collapsedIds");
      }

      return { ...state, collapsedIds: ids };
    }
  }
}

export function encodeDiagramViewState(state: DiagramViewState): string {
  const params = new URLSearchParams();

  if (state.viewport && isFiniteViewport(state.viewport)) {
    params.set(
      "viewport",
      [state.viewport.x, state.viewport.y, state.viewport.width, state.viewport.height].join(","),
    );
  }
  if (state.highlightedElement) {
    params.set("highlight", `${state.highlightedElement.kind}:${state.highlightedElement.id}`);
  }
  if (state.inspectedEdgeId) {
    params.set("edge", state.inspectedEdgeId);
  }
  if (state.searchQuery?.trim()) {
    params.set("search", state.searchQuery.trim());
  }
  if (state.collapsedIds?.length) {
    params.set("collapsed", canonicalizeIds(state.collapsedIds).join(","));
  }

  return params.toString();
}

export function decodeDiagramViewState(input: string | URLSearchParams): DiagramViewState {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const state: DiagramViewState = {};
  const viewport = parseViewport(params.get("viewport"));
  const highlightedElement = parseElementRef(params.get("highlight"));
  const edge = params.get("edge")?.trim();
  const search = params.get("search")?.trim();
  const collapsed = params
    .get("collapsed")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (viewport) {
    state.viewport = viewport;
  }
  if (highlightedElement) {
    state.highlightedElement = highlightedElement;
  }
  if (edge) {
    state.inspectedEdgeId = edge;
  }
  if (search) {
    state.searchQuery = search;
  }
  if (collapsed?.length) {
    state.collapsedIds = canonicalizeIds(collapsed);
  }

  return state;
}

function parseViewport(value: string | null): DiagramViewport | null {
  if (!value) {
    return null;
  }
  const parts = value.split(",").map(Number);
  if (parts.length !== 4) {
    return null;
  }
  const viewport: DiagramViewport = {
    x: parts[0],
    y: parts[1],
    width: parts[2],
    height: parts[3],
  };
  return isFiniteViewport(viewport) ? viewport : null;
}

function parseElementRef(value: string | null): DiagramElementRef | null {
  if (!value) {
    return null;
  }
  const separator = value.indexOf(":");
  if (separator <= 0 || separator === value.length - 1) {
    return null;
  }
  const kind = value.slice(0, separator);
  if (kind !== "node" && kind !== "edge") {
    return null;
  }
  return { kind, id: value.slice(separator + 1) };
}

function canonicalizeIds(ids: readonly string[]) {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))].sort();
}

function viewportEquals(first: DiagramViewport | undefined, second: DiagramViewport) {
  return (
    first?.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
}

function elementRefEquals(
  first: DiagramElementRef | null,
  second: DiagramElementRef | null,
) {
  return first?.kind === second?.kind && first?.id === second?.id;
}

function stringArraysEqual(first: readonly string[], second: readonly string[]) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function omitKey<TKey extends keyof DiagramViewState>(state: DiagramViewState, key: TKey) {
  if (!(key in state)) {
    return state;
  }

  const next = { ...state };
  delete next[key];
  return next;
}

function isFiniteViewport(viewport: DiagramViewport) {
  return (
    Number.isFinite(viewport.x) &&
    Number.isFinite(viewport.y) &&
    Number.isFinite(viewport.width) &&
    Number.isFinite(viewport.height) &&
    viewport.width > 0 &&
    viewport.height > 0
  );
}
