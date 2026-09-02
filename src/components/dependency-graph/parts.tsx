import { cn } from "../../internal/cn";
import { Minimize2Icon } from "lucide-react";

import { defaultSvgToneClasses } from "../diagram-utils";

import { getDependencyGraphPartAccessibleName } from "./labels";

import type { DependencyGraphMinimizeControls, PositionedDependencyGraphPart } from "./types";

export function DependencyGraphPartHull({
  positionedPart,
  minimizeControls,
  onMinimize,
}: {
  positionedPart: PositionedDependencyGraphPart;
  minimizeControls: DependencyGraphMinimizeControls;
  onMinimize: () => void;
}) {
  if (minimizeControls === "none") {
    return (
      <g data-slot="dependency-graph-part" data-part-id={positionedPart.part.id}>
        <DependencyGraphPartHullShape positionedPart={positionedPart} />
      </g>
    );
  }

  const label = getDependencyGraphPartAccessibleName(positionedPart.part);

  return (
    <g data-slot="dependency-graph-part" data-part-id={positionedPart.part.id}>
      <DependencyGraphPartHullShape positionedPart={positionedPart} />
      <foreignObject
        x={positionedPart.bounds.x + positionedPart.bounds.width - 36}
        y={positionedPart.bounds.y + 8}
        width={28}
        height={28}
      >
        <button
          type="button"
          data-slot="dependency-graph-part-control"
          aria-label={`Minimize ${label}`}
          aria-expanded="true"
          className="inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-muted-foreground shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={(event) => {
            event.stopPropagation();
            onMinimize();
          }}
        >
          <Minimize2Icon aria-hidden="true" className="size-3.5" />
        </button>
      </foreignObject>
    </g>
  );
}

function DependencyGraphPartHullShape({
  positionedPart,
}: {
  positionedPart: PositionedDependencyGraphPart;
}) {
  const tone = positionedPart.part.tone ?? "muted";

  return (
    <>
      <rect
        data-slot="dependency-graph-part-hull"
        x={positionedPart.bounds.x}
        y={positionedPart.bounds.y}
        width={positionedPart.bounds.width}
        height={positionedPart.bounds.height}
        rx={16}
        strokeDasharray="6 6"
        className={cn("opacity-70", defaultSvgToneClasses[tone])}
      />
      <foreignObject
        x={positionedPart.bounds.x + 12}
        y={positionedPart.bounds.y + 8}
        width={Math.max(96, positionedPart.bounds.width - 56)}
        height={36}
      >
        <div className="grid gap-0.5 overflow-hidden text-xs leading-4 text-muted-foreground">
          <div className="truncate font-medium text-foreground">{positionedPart.part.label}</div>
          {positionedPart.part.description ? (
            <div className="truncate">{positionedPart.part.description}</div>
          ) : null}
        </div>
      </foreignObject>
    </>
  );
}
