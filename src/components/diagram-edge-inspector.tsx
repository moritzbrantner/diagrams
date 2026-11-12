import * as React from "react";

import { getBoundsCenter } from "./diagram-geometry";

import type {
  DiagramEdgeDescriptor,
  DiagramEdgeInspectorContext,
  DiagramNodeDescriptor,
  DiagramPoint,
  DiagramViewport,
} from "../diagram-types";

export function getDiagramEdgeInspectorContext<TNode, TEdge>(
  edge: DiagramEdgeDescriptor<TEdge>,
  nodes: readonly DiagramNodeDescriptor<TNode>[],
): DiagramEdgeInspectorContext<TNode, TEdge> {
  return {
    edge: edge.item,
    source: nodes.find((node) => node.id === edge.sourceId)?.item,
    target: nodes.find((node) => node.id === edge.targetId)?.item,
    edgeId: edge.id,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    label: edge.label,
    kind: edge.kind,
    direction: edge.direction,
  };
}

export function renderDefaultDiagramEdgeInspector<TNode, TEdge>(
  context: DiagramEdgeInspectorContext<TNode, TEdge>,
) {
  const edge = context.edge as Record<string, unknown>;
  const sourceLabel = getRecordLabel(context.source, context.sourceId);
  const targetLabel = getRecordLabel(context.target, context.targetId);
  const metadata = [
    ["Kind", getRenderableMetadataValue(context.kind ?? edge.kind)],
    ["Status", getRenderableMetadataValue(edge.status)],
    ["Direction", getRenderableMetadataValue(context.direction)],
    ["Protocol", getRenderableMetadataValue(edge.protocol)],
    ["Source cardinality", getRenderableMetadataValue(edge.sourceCardinality)],
    ["Target cardinality", getRenderableMetadataValue(edge.targetCardinality)],
    [
      "Identifying",
      typeof edge.identifying === "boolean" ? (edge.identifying ? "Yes" : "No") : undefined,
    ],
    ["Event", getRenderableMetadataValue(edge.event)],
    ["Guard", getRenderableMetadataValue(edge.guard)],
    ["Action", getRenderableMetadataValue(edge.action)],
    ["Message kind", getRenderableMetadataValue(edge.kind)],
    ["Description", getRenderableMetadataValue(edge.description)],
    ["Source label", getRenderableMetadataValue(edge.sourceLabel)],
    ["Target label", getRenderableMetadataValue(edge.targetLabel)],
  ].filter((item): item is [string, React.ReactNode] => item[1] != null && item[1] !== "");
  const title =
    getRenderableMetadataValue(context.label) ??
    getRenderableMetadataValue(edge.label) ??
    getRenderableMetadataValue(edge.event) ??
    getRenderableMetadataValue(edge.id) ??
    context.edgeId;

  return (
    <div className="grid gap-2 pr-4">
      <div className="font-medium leading-5">{title}</div>
      <dl className="grid gap-1 text-xs">
        <div className="grid grid-cols-[auto_1fr] gap-x-2">
          <dt className="text-muted-foreground">From</dt>
          <dd className="min-w-0 truncate">{sourceLabel}</dd>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-2">
          <dt className="text-muted-foreground">To</dt>
          <dd className="min-w-0 truncate">{targetLabel}</dd>
        </div>
        {metadata.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[auto_1fr] gap-x-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 truncate">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function getRecordLabel(item: unknown, fallback: string | undefined) {
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const label = record.label ?? record.name ?? record.title;

    if (typeof label === "string" || typeof label === "number") {
      return String(label);
    }
  }

  return fallback ?? "";
}

function getRenderableMetadataValue(value: unknown): React.ReactNode | undefined {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    React.isValidElement(value)
  ) {
    return value;
  }

  return undefined;
}

export function getDiagramEdgeFallbackPoint<TNode, TEdge>(
  edge: DiagramEdgeDescriptor<TEdge>,
  nodes: readonly DiagramNodeDescriptor<TNode>[],
) {
  const source = getBoundsCenter(nodes.find((node) => node.id === edge.sourceId)?.bounds);
  const target = getBoundsCenter(nodes.find((node) => node.id === edge.targetId)?.bounds);

  if (source && target) {
    return { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 };
  }

  return source ?? target ?? { x: 0, y: 0 };
}

export function getInspectorOverlayStyle(
  point: DiagramPoint,
  viewport: DiagramViewport,
  scrollArea: HTMLDivElement | null,
): React.CSSProperties {
  if (!scrollArea) {
    return { right: 8, top: 48 };
  }

  const width = scrollArea.clientWidth || 320;
  const height = scrollArea.clientHeight || 240;
  const x = ((point.x - viewport.x) / Math.max(viewport.width, 1)) * width + scrollArea.scrollLeft;
  const y = ((point.y - viewport.y) / Math.max(viewport.height, 1)) * height + scrollArea.scrollTop;

  return {
    left: Math.min(
      scrollArea.scrollLeft + width - 272,
      Math.max(scrollArea.scrollLeft + 8, x + 12),
    ),
    top: Math.min(scrollArea.scrollTop + height - 140, Math.max(scrollArea.scrollTop + 8, y + 12)),
  };
}
