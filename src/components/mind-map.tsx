"use client";

import * as React from "react";

import { cn } from "../lib/cn";

import {
  clampFiniteNumber,
  defaultEdgeToneClasses,
  defaultToneClasses,
  getSpatialBounds,
  type DiagramTone,
} from "./diagram-utils";

export type MindMapNode = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  tone?: DiagramTone;
  children?: readonly MindMapNode[];
};

export type MindMapFlatNode = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  parentId?: string;
  x?: number;
  y?: number;
  tone?: DiagramTone;
};

export type MindMapLayout = "radial" | "tree";

export type MindMapProps = Omit<React.ComponentProps<"figure">, "children"> & {
  root?: MindMapNode;
  nodes?: readonly MindMapFlatNode[];
  layout?: MindMapLayout;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
};

type PositionedMindMapNode = MindMapFlatNode & {
  x: number;
  y: number;
  width: number;
  height: number;
};

const NODE_WIDTH = 176;
const NODE_HEIGHT = 76;

function MindMap({
  root,
  nodes = [],
  layout = "radial",
  ariaLabel = "Mind map",
  caption,
  emptyMessage = "No mind map nodes.",
  padding = 32,
  className,
  ...props
}: MindMapProps) {
  const flatNodes = React.useMemo(() => (root ? flattenRoot(root) : [...nodes]), [nodes, root]);
  const positionedNodes = React.useMemo(
    () => positionNodes(flatNodes, layout),
    [flatNodes, layout],
  );
  const nodeMap = React.useMemo(
    () => new Map(positionedNodes.map((node) => [node.id, node])),
    [positionedNodes],
  );
  const edges = positionedNodes
    .filter((node) => node.parentId && nodeMap.has(node.parentId))
    .map((node) => ({ source: nodeMap.get(node.parentId!)!, target: node }));
  const bounds = getSpatialBounds(positionedNodes);
  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${
    bounds.height + padding * 2
  }`;

  return (
    <figure
      data-slot="mind-map"
      data-layout={layout}
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="mind-map-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus mind map scroll area
        </button>
        <svg
          data-slot="mind-map-svg"
          role="img"
          aria-label={ariaLabel}
          viewBox={viewBox}
          className="block min-h-80 w-full min-w-160 text-foreground"
        >
          {positionedNodes.length ? (
            <>
              <g data-slot="mind-map-edges">
                {edges.map((edge) => (
                  <path
                    key={`${edge.source.id}-${edge.target.id}`}
                    data-slot="mind-map-edge"
                    d={`M ${edge.source.x + NODE_WIDTH / 2} ${edge.source.y + NODE_HEIGHT / 2} C ${(edge.source.x + edge.target.x) / 2} ${edge.source.y + NODE_HEIGHT / 2}, ${(edge.source.x + edge.target.x) / 2} ${edge.target.y + NODE_HEIGHT / 2}, ${edge.target.x + NODE_WIDTH / 2} ${edge.target.y + NODE_HEIGHT / 2}`}
                    fill="none"
                    strokeWidth={2}
                    className={defaultEdgeToneClasses.muted}
                  />
                ))}
              </g>
              <g data-slot="mind-map-nodes">
                {positionedNodes.map((node) => (
                  <MindMapNodeShape key={node.id} node={node} />
                ))}
              </g>
            </>
          ) : (
            <text
              x={bounds.x + bounds.width / 2}
              y={bounds.y + bounds.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-sm"
            >
              {emptyMessage}
            </text>
          )}
        </svg>
      </div>
      {caption ? (
        <figcaption className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function MindMapNodeShape({ node }: { node: PositionedMindMapNode }) {
  return (
    <foreignObject
      data-slot="mind-map-node"
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
    >
      <div
        data-node-id={node.id}
        data-tone={node.tone ?? "default"}
        className={cn(
          "grid size-full content-center gap-1 rounded-md border p-3 text-center text-sm shadow-sm",
          defaultToneClasses[node.tone ?? "default"],
        )}
      >
        <div className="font-medium leading-5">{node.label}</div>
        {node.description ? (
          <div className="line-clamp-2 text-xs leading-4 text-muted-foreground">
            {node.description}
          </div>
        ) : null}
      </div>
    </foreignObject>
  );
}

function flattenRoot(root: MindMapNode) {
  const flatNodes: MindMapFlatNode[] = [];

  function visit(node: MindMapNode, parentId?: string) {
    flatNodes.push({
      id: node.id,
      label: node.label,
      description: node.description,
      parentId,
      tone: node.tone,
    });

    for (const child of node.children ?? []) {
      visit(child, node.id);
    }
  }

  visit(root);
  return flatNodes;
}

function positionNodes(
  nodes: readonly MindMapFlatNode[],
  layout: MindMapLayout,
): PositionedMindMapNode[] {
  if (layout === "tree") {
    const levelCounts = new Map<number, number>();
    const levels = new Map<string, number>();

    for (const node of nodes) {
      levels.set(node.id, node.parentId ? (levels.get(node.parentId) ?? 0) + 1 : 0);
    }

    return nodes.map((node) => {
      const level = levels.get(node.id) ?? 0;
      const slot = levelCounts.get(level) ?? 0;
      levelCounts.set(level, slot + 1);

      return {
        ...node,
        x: clampFiniteNumber(node.x, level * 248),
        y: clampFiniteNumber(node.y, slot * 116),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      };
    });
  }

  const center = { x: 320, y: 220 };
  const rootNode = nodes.find((node) => !node.parentId) ?? nodes[0];
  const children = nodes.filter((node) => node.id !== rootNode?.id);

  return nodes.map((node, index) => {
    if (node.id === rootNode?.id) {
      return {
        ...node,
        x: clampFiniteNumber(node.x, center.x - NODE_WIDTH / 2),
        y: clampFiniteNumber(node.y, center.y - NODE_HEIGHT / 2),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      };
    }

    const childIndex = Math.max(
      0,
      children.findIndex((child) => child.id === node.id),
    );
    const angle = (childIndex / Math.max(1, children.length)) * Math.PI * 2 - Math.PI / 2;
    const radius = 220 + Math.floor(index / 8) * 72;

    return {
      ...node,
      x: clampFiniteNumber(node.x, center.x + Math.cos(angle) * radius - NODE_WIDTH / 2),
      y: clampFiniteNumber(node.y, center.y + Math.sin(angle) * radius - NODE_HEIGHT / 2),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
  });
}

export { MindMap };
export type { DiagramTone as MindMapTone, PositionedMindMapNode };
