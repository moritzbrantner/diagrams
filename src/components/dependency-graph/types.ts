import type {
  DiagramDirection,
  DiagramInteractiveProps,
  DiagramPoint,
  DiagramTone,
} from "../diagram-utils";
import type * as React from "react";

export type DependencyGraphStatus = "stable" | "active" | "deprecated" | "blocked" | "at-risk";
export type DependencyGraphEdgeKind = "runtime" | "build" | "peer" | "optional" | "blocking";
export type DependencyGraphKeyboardMode = "nodes" | "none";
export type DependencyGraphNodeActionPlacement = "inside-bottom-end" | "outside-top-end";
export type DependencyGraphMinimizeControls = "auto" | "always" | "none";

export type DependencyGraphNode = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  group?: React.ReactNode;
  partId?: string;
  version?: React.ReactNode;
  status?: DependencyGraphStatus;
  minimizable?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  tone?: DiagramTone;
};

export type DependencyGraphPart = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  nodeIds?: readonly string[];
  tone?: DiagramTone;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type PositionedDependencyGraphNode = DependencyGraphNode &
  Required<Pick<DependencyGraphNode, "x" | "y">> & {
    width: number;
    height: number;
  };

export type DependencyGraphNodeAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (node: PositionedDependencyGraphNode) => void;
};

export type DependencyGraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: React.ReactNode;
  kind?: DependencyGraphEdgeKind;
  direction?: DiagramDirection;
  points?: readonly DiagramPoint[];
  waypoints?: readonly DiagramPoint[];
};

export type DependencyGraphProps = Omit<React.ComponentProps<"figure">, "children"> & {
  nodes: readonly DependencyGraphNode[];
  edges?: readonly DependencyGraphEdge[];
  showLegend?: boolean;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
  autoLayoutColumns?: number;
  parts?: readonly DependencyGraphPart[];
  minimizedPartIds?: readonly string[];
  defaultMinimizedPartIds?: readonly string[];
  onMinimizedPartIdsChange?: (
    partIds: string[],
    part: DependencyGraphPart,
    minimized: boolean,
  ) => void;
  enableNodeMinimize?: boolean;
  minimizedNodeIds?: readonly string[];
  defaultMinimizedNodeIds?: readonly string[];
  onMinimizedNodeIdsChange?: (
    nodeIds: string[],
    node: PositionedDependencyGraphNode,
    minimized: boolean,
  ) => void;
  minimizeControls?: DependencyGraphMinimizeControls;
  getMinimizedNodeLabel?: (
    node: PositionedDependencyGraphNode,
    hiddenNodes: readonly PositionedDependencyGraphNode[],
  ) => React.ReactNode;
  getMinimizedPartLabel?: (
    part: DependencyGraphPart,
    hiddenNodes: readonly PositionedDependencyGraphNode[],
  ) => React.ReactNode;
  selectedNodeId?: string | null;
  keyboardMode?: DependencyGraphKeyboardMode;
  focusedNodeId?: string | null;
  defaultFocusedNodeId?: string | null;
  onFocusedNodeIdChange?: (node: PositionedDependencyGraphNode | null) => void;
  nodeActionPlacement?: DependencyGraphNodeActionPlacement;
  getNodeDisabled?: (node: PositionedDependencyGraphNode) => boolean;
  renderNodeSelection?: (node: PositionedDependencyGraphNode) => React.ReactNode;
  nodeActions?:
    | readonly DependencyGraphNodeAction[]
    | ((node: PositionedDependencyGraphNode) => readonly DependencyGraphNodeAction[]);
  onNodeSelect?: (node: PositionedDependencyGraphNode) => void;
  onNodeDeselect?: () => void;
  onNodeActionSelect?: (
    action: DependencyGraphNodeAction,
    node: PositionedDependencyGraphNode,
  ) => void;
} & DiagramInteractiveProps<PositionedDependencyGraphNode, DependencyGraphEdge>;

export type DependencyGraphSummaryKind = "part" | "node";

export type DependencyGraphSummary = {
  kind: DependencyGraphSummaryKind;
  sourceId: string;
  hiddenNodes: readonly PositionedDependencyGraphNode[];
  part?: DependencyGraphPart;
  rootNode?: PositionedDependencyGraphNode;
};

export type RenderDependencyGraphNode = PositionedDependencyGraphNode & {
  summary?: DependencyGraphSummary;
};

export type PositionedDependencyGraphPart = {
  part: DependencyGraphPart;
  nodeIds: Set<string>;
  nodes: readonly PositionedDependencyGraphNode[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type DependencyGraphEdgeRoute = {
  points: readonly DiagramPoint[];
  labelPoint?: DiagramPoint;
};

export type RenderDependencyGraphEdge = DependencyGraphEdge & {
  source: string;
  target: string;
};

export type DependencyGraphNodeMinimizeControl = {
  ariaLabel: string;
  expanded: boolean;
  onToggle: () => void;
};

export type { DiagramDirection, DiagramPoint, DiagramTone };
