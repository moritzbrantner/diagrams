import { cn } from "../../internal/cn";

import { defaultToneClasses } from "../diagram-utils";

import { statusTone } from "./constants";

import type { RenderDependencyGraphNode } from "./types";

export function DependencyGraphNodeShape({ node }: { node: RenderDependencyGraphNode }) {
  const tone = node.tone ?? (node.status ? statusTone[node.status] : "default");

  return (
    <foreignObject
      data-slot={node.summary ? "dependency-graph-summary-node" : "dependency-graph-node"}
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
    >
      <div
        data-node-id={node.id}
        data-status={node.status}
        data-tone={tone}
        className={cn(
          "grid size-full content-start gap-1 rounded-md border p-3 text-sm shadow-sm",
          defaultToneClasses[tone],
        )}
      >
        {node.group ? <div className="text-xs text-muted-foreground">{node.group}</div> : null}
        <div className="font-medium leading-5">{node.label}</div>
        {node.description ? (
          <div className="line-clamp-2 text-xs leading-4 text-muted-foreground">
            {node.description}
          </div>
        ) : null}
        {node.version || node.status ? (
          <div className="mt-auto text-xs text-muted-foreground">
            {node.version}
            {node.version && node.status ? " · " : null}
            {node.status}
          </div>
        ) : null}
      </div>
    </foreignObject>
  );
}
