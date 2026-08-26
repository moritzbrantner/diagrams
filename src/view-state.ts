import type { DiagramElementRef, DiagramViewport } from "./diagram-types";

export type DiagramViewState = {
  highlightedElement?: DiagramElementRef | null;
  inspectedEdgeId?: string | null;
  searchQuery?: string;
  viewport?: DiagramViewport;
};

const HIGHLIGHT_KEY = "diagram.highlight";
const INSPECTED_EDGE_KEY = "diagram.edge";
const SEARCH_KEY = "diagram.search";
const VIEWPORT_KEY = "diagram.viewport";

export function encodeDiagramViewState(state: DiagramViewState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.viewport && isViewport(state.viewport)) {
    params.set(
      VIEWPORT_KEY,
      [state.viewport.x, state.viewport.y, state.viewport.width, state.viewport.height].join(","),
    );
  }

  if (state.highlightedElement) {
    params.set(HIGHLIGHT_KEY, JSON.stringify(state.highlightedElement));
  }

  if (state.inspectedEdgeId) {
    params.set(INSPECTED_EDGE_KEY, state.inspectedEdgeId);
  }

  if (state.searchQuery?.trim()) {
    params.set(SEARCH_KEY, state.searchQuery.trim());
  }

  return params;
}

export function decodeDiagramViewState(input: URLSearchParams | string): DiagramViewState {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const viewport = readViewport(params.get(VIEWPORT_KEY));
  const highlightedElement = readElementRef(params.get(HIGHLIGHT_KEY));
  const inspectedEdgeId = params.get(INSPECTED_EDGE_KEY);
  const searchQuery = params.get(SEARCH_KEY)?.trim() ?? "";

  return {
    ...(viewport ? { viewport } : {}),
    ...(highlightedElement ? { highlightedElement } : {}),
    ...(inspectedEdgeId ? { inspectedEdgeId } : {}),
    ...(searchQuery ? { searchQuery } : {}),
  };
}

function readViewport(value: string | null): DiagramViewport | null {
  if (!value) {
    return null;
  }

  const parts = value.split(",").map(Number);

  if (parts.length !== 4) {
    return null;
  }

  const [x, y, width, height] = parts;
  const viewport = { x, y, width, height };

  return isViewport(viewport) ? viewport : null;
}

function readElementRef(value: string | null): DiagramElementRef | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<DiagramElementRef>;

    if (
      (parsed.kind === "node" || parsed.kind === "edge") &&
      typeof parsed.id === "string" &&
      parsed.id.length > 0
    ) {
      return { kind: parsed.kind, id: parsed.id };
    }
  } catch {
    return null;
  }

  return null;
}

function isViewport(viewport: DiagramViewport): boolean {
  return (
    Number.isFinite(viewport.x) &&
    Number.isFinite(viewport.y) &&
    Number.isFinite(viewport.width) &&
    Number.isFinite(viewport.height) &&
    viewport.width > 0 &&
    viewport.height > 0
  );
}
