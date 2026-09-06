"use client";

import * as React from "react";

import { ArchitectureDiagram as LegacyArchitectureDiagram } from "./architecture-diagram";
import { useDiagramComputeRuntime } from "./use-diagram-compute-runtime";

import type { DiagramComputeRuntime, DiagramLayout } from "../layout";
import type {
  ArchitectureDiagramConnection,
  ArchitectureDiagramNode,
  ArchitectureDiagramProps,
} from "./architecture-diagram";

const DEFAULT_NODE_WIDTH = 188;
const DEFAULT_NODE_HEIGHT = 104;

function ArchitectureDiagram(props: ArchitectureDiagramProps) {
  const runtime = useDiagramComputeRuntime();
  const layout = React.useMemo(
    () => (runtime ? createArchitectureLayout(runtime.layoutGraph, props) : null),
    [runtime, props.nodes, props.connections, props.boundaries],
  );

  if (!layout) {
    return <LegacyArchitectureDiagram {...props} />;
  }

  const nodesById = new Map(layout.nodes.map((node) => [node.id, node]));
  const groupsById = new Map(layout.groups.map((group) => [group.id, group]));
  const edgesById = new Map(layout.edges.map((edge) => [edge.id, edge]));
  const nodes = props.nodes.map((node) => {
    const positioned = nodesById.get(node.id);
    return positioned
      ? {
          ...node,
          x: positioned.x,
          y: positioned.y,
          width: positioned.width,
          height: positioned.height,
        }
      : node;
  });
  const boundaries = (props.boundaries ?? []).map((boundary) => {
    const positioned = groupsById.get(boundary.id);
    return positioned
      ? {
          ...boundary,
          x: positioned.x,
          y: positioned.y,
          width: positioned.width,
          height: positioned.height,
        }
      : boundary;
  });
  const connections = (props.connections ?? []).map((connection) => {
    if (connection.points?.length || connection.waypoints?.length) {
      return connection;
    }
    const routed = edgesById.get(connection.id);
    return routed ? { ...connection, points: routed.points } : connection;
  });

  return (
    <LegacyArchitectureDiagram
      {...props}
      nodes={nodes}
      boundaries={boundaries}
      connections={connections}
    />
  );
}

function createArchitectureLayout(
  layoutGraph: DiagramComputeRuntime["layoutGraph"],
  props: ArchitectureDiagramProps,
): DiagramLayout | null {
  if (!canUseRustAutoLayout(props)) {
    return null;
  }

  const nodeIds = new Set(props.nodes.map((node) => node.id));
  const connections = (props.connections ?? []).filter(
    (connection) => nodeIds.has(connection.source) && nodeIds.has(connection.target),
  );

  try {
    return layoutGraph({
      nodes: props.nodes.map(toLayoutNode),
      edges: connections.map(toLayoutEdge),
      groups: (props.boundaries ?? []).map((boundary) => ({ id: boundary.id })),
      options: {
        groupDirection: "leftToRight",
        nodeDirection: "topToBottom",
        padding: 0,
        groupGap: 184,
        groupPadding: 36,
        groupTitleHeight: 36,
        nodeGap: 32,
        rankGap: 72,
        edgeClearance: 18,
        maxNodesPerRank: 4,
      },
    });
  } catch {
    return null;
  }
}

function canUseRustAutoLayout(props: ArchitectureDiagramProps) {
  if (!props.nodes.length) {
    return false;
  }
  if (props.nodes.some((node) => node.x !== undefined || node.y !== undefined)) {
    return false;
  }

  const boundaries = props.boundaries ?? [];
  if (
    boundaries.some(
      (boundary) =>
        boundary.x !== undefined ||
        boundary.y !== undefined ||
        boundary.width !== undefined ||
        boundary.height !== undefined,
    )
  ) {
    return false;
  }

  const groupIds = new Set(boundaries.map((boundary) => boundary.id));
  if (props.nodes.some((node) => node.boundaryId && !groupIds.has(node.boundaryId))) {
    return false;
  }

  return boundaries.every((boundary) =>
    props.nodes.some((node) => node.boundaryId === boundary.id),
  );
}

function toLayoutNode(node: ArchitectureDiagramNode) {
  return {
    id: node.id,
    width: Math.max(128, finiteOr(node.width, DEFAULT_NODE_WIDTH)),
    height: Math.max(80, finiteOr(node.height, DEFAULT_NODE_HEIGHT)),
    groupId: node.boundaryId,
  };
}

function toLayoutEdge(connection: ArchitectureDiagramConnection) {
  return {
    id: connection.id,
    source: connection.source,
    target: connection.target,
  };
}

function finiteOr(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

export { ArchitectureDiagram };
export type * from "./architecture-diagram";
