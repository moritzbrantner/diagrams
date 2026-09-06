export type DiagramLayoutDirection = "leftToRight" | "topToBottom";

export type DiagramLayoutPoint = {
  x: number;
  y: number;
};

export type DiagramLayoutBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DiagramLayoutNodeInput = {
  id: string;
  width: number;
  height: number;
  groupId?: string;
};

export type DiagramLayoutEdgeInput = {
  id: string;
  source: string;
  target: string;
};

export type DiagramLayoutGroupInput = {
  id: string;
};

export type DiagramLayoutOptions = {
  groupDirection?: DiagramLayoutDirection;
  nodeDirection?: DiagramLayoutDirection;
  padding?: number;
  groupGap?: number;
  groupPadding?: number;
  groupTitleHeight?: number;
  nodeGap?: number;
  rankGap?: number;
  edgeClearance?: number;
  maxNodesPerRank?: number;
};

export type DiagramLayoutInput = {
  nodes: readonly DiagramLayoutNodeInput[];
  edges?: readonly DiagramLayoutEdgeInput[];
  groups?: readonly DiagramLayoutGroupInput[];
  options?: DiagramLayoutOptions;
};

export type PositionedDiagramLayoutNode = DiagramLayoutNodeInput & {
  x: number;
  y: number;
};

export type PositionedDiagramLayoutGroup = DiagramLayoutGroupInput & {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RoutedDiagramLayoutEdge = DiagramLayoutEdgeInput & {
  points: readonly DiagramLayoutPoint[];
  labelPoint: DiagramLayoutPoint;
};

export type DiagramLayout = {
  nodes: readonly PositionedDiagramLayoutNode[];
  edges: readonly RoutedDiagramLayoutEdge[];
  groups: readonly PositionedDiagramLayoutGroup[];
  bounds: DiagramLayoutBounds;
};

export type DiagramVisibilityQuery = {
  viewport: DiagramLayoutBounds;
  overscan?: number;
};

export type DiagramVisibility = {
  nodeIds: readonly string[];
  edgeIds: readonly string[];
  groupIds: readonly string[];
};

export type DiagramComputeRuntime = {
  readonly kind: string;
  layoutGraph(input: DiagramLayoutInput): DiagramLayout;
  queryVisibility(layout: DiagramLayout, query: DiagramVisibilityQuery): DiagramVisibility;
};

type RuntimeListener = () => void;

let installedRuntime: DiagramComputeRuntime | null = null;
let runtimeVersion = 0;
const runtimeListeners = new Set<RuntimeListener>();

/** Installs the renderer-independent compute runtime used by interactive adapters. */
export function installDiagramComputeRuntime(runtime: DiagramComputeRuntime) {
  if (installedRuntime === runtime) {
    return;
  }

  installedRuntime = runtime;
  runtimeVersion += 1;
  for (const listener of runtimeListeners) {
    listener();
  }
}

/** Returns the installed compute runtime, or null before one has been initialized. */
export function getDiagramComputeRuntime() {
  return installedRuntime;
}

/** Internal subscription surface used by React adapters without putting React in /core. */
export function subscribeDiagramComputeRuntime(listener: RuntimeListener) {
  runtimeListeners.add(listener);
  return () => runtimeListeners.delete(listener);
}

/** Internal monotonically increasing version used by renderer adapters. */
export function getDiagramComputeRuntimeVersion() {
  return runtimeVersion;
}
