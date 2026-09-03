import type { DiagramElementRef, DiagramViewport } from "./diagram-core-types";

export type DiagramViewState = {
  collapsedIds?: string[];
  highlightedElement?: DiagramElementRef | null;
  inspectedEdgeId?: string | null;
  searchQuery?: string;
  viewport?: DiagramViewport;
};

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
    params.set("collapsed", [...new Set(state.collapsedIds)].sort().join(","));
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
    state.collapsedIds = [...new Set(collapsed)].sort();
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
