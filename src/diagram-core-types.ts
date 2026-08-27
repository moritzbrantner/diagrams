/** A two-dimensional point in diagram coordinate space. */
export type DiagramPoint = {
  x: number;
  y: number;
};

/** Shared tone names supported by diagram nodes, edges, and structural regions. */
export type DiagramTone = "default" | "accent" | "success" | "warning" | "danger" | "muted";

/** Direction used by edge-like relationships when arrow markers are rendered. */
export type DiagramDirection = "forward" | "backward" | "both" | "none";

/** Rectangular bounds accepted by shared layout and interaction helpers. */
export type DiagramBoundsItem = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

/** Concrete rectangular bounds in diagram coordinate space. */
export type DiagramBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Public element families that shared interactive diagram features can address. */
export type DiagramElementKind = "node" | "edge";

/** Stable reference to a node or edge inside a diagram. */
export type DiagramElementRef = {
  kind: DiagramElementKind;
  id: string;
};

/** Visible viewport for an SVG-backed diagram canvas. */
export type DiagramViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Reason emitted when a controlled diagram viewport changes. */
export type DiagramViewportChangeReason =
  | "fit"
  | "reset"
  | "pan"
  | "zoom"
  | "search"
  | "programmatic";

/** Graph traversal mode used when path highlighting is enabled. */
export type DiagramPathHighlightMode = "neighbors" | "incoming" | "outgoing" | "connected";

/** Shared optional interaction feature flags for SVG-backed diagrams. */
export type DiagramInteractiveFeatures =
  | boolean
  | {
      viewport?: boolean;
      pathHighlight?: boolean | { mode?: DiagramPathHighlightMode };
      search?: boolean;
      edgeInspector?: boolean;
      controls?: "auto" | "always" | "none";
    };
