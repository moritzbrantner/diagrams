import type { DiagramTone } from "../diagram-utils";
import type { DependencyGraphEdgeKind, DependencyGraphStatus } from "./types";

export const DEFAULT_NODE_WIDTH = 188;
export const DEFAULT_NODE_HEIGHT = 104;
export const PART_HULL_PADDING = 28;
export const SUMMARY_NODE_WIDTH = 168;
export const SUMMARY_NODE_HEIGHT = 84;
export const PART_SUMMARY_PREFIX = "__dependency-graph-part-summary-";
export const NODE_SUMMARY_PREFIX = "__dependency-graph-node-summary-";

export const edgeToneByKind: Record<DependencyGraphEdgeKind, DiagramTone> = {
  runtime: "accent",
  build: "default",
  peer: "success",
  optional: "muted",
  blocking: "danger",
};

export const statusTone: Record<DependencyGraphStatus, DiagramTone> = {
  stable: "success",
  active: "accent",
  deprecated: "muted",
  blocked: "danger",
  "at-risk": "warning",
};
