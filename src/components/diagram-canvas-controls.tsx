"use client";

import { RotateCcwIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import * as React from "react";

const diagramCanvasOverlayButtonClass =
  "inline-flex size-8 items-center justify-center rounded-sm border bg-background/90 text-foreground shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4";

export function useDiagramZoomControls({
  defaultZoom = 1,
  maxZoom = 3,
  minZoom = 0.5,
  step = 1.15,
}: {
  defaultZoom?: number;
  maxZoom?: number;
  minZoom?: number;
  step?: number;
} = {}) {
  const [zoom, setZoom] = React.useState(defaultZoom);
  const zoomStyle = React.useMemo(() => ({ zoom }), [zoom]);
  const controls = (
    <div
      data-slot="diagram-zoom-controls"
      className="absolute right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] items-center gap-1"
    >
      <button
        type="button"
        aria-label="Zoom in"
        className={diagramCanvasOverlayButtonClass}
        disabled={zoom >= maxZoom}
        onClick={() => setZoom((current) => Math.min(maxZoom, current * step))}
      >
        <ZoomInIcon aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        className={diagramCanvasOverlayButtonClass}
        disabled={zoom <= minZoom}
        onClick={() => setZoom((current) => Math.max(minZoom, current / step))}
      >
        <ZoomOutIcon aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Reset view"
        className={diagramCanvasOverlayButtonClass}
        disabled={zoom === defaultZoom}
        onClick={() => setZoom(defaultZoom)}
      >
        <RotateCcwIcon aria-hidden="true" />
      </button>
    </div>
  );

  return { controls, zoom, zoomStyle } as const;
}
