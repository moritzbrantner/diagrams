import type { DiagramInteractiveFeatures, DiagramPathHighlightMode } from "../diagram-types";

export type ResolvedDiagramInteractiveFeatures = {
  enabled: boolean;
  viewport: boolean;
  pathHighlight: boolean;
  pathHighlightMode: DiagramPathHighlightMode;
  search: boolean;
  edgeInspector: boolean;
  controls: "auto" | "always" | "none";
};

export function resolveDiagramInteractiveFeatures(
  features: DiagramInteractiveFeatures | undefined,
): ResolvedDiagramInteractiveFeatures {
  if (features === true) {
    return {
      enabled: true,
      viewport: true,
      pathHighlight: true,
      pathHighlightMode: "neighbors",
      search: true,
      edgeInspector: true,
      controls: "auto",
    };
  }

  if (!features) {
    return {
      enabled: features === undefined,
      viewport: features === undefined,
      pathHighlight: false,
      pathHighlightMode: "neighbors",
      search: false,
      edgeInspector: false,
      controls: "auto",
    };
  }

  const pathHighlight = Boolean(features.pathHighlight);

  return {
    enabled: true,
    viewport: features.viewport ?? true,
    pathHighlight,
    pathHighlightMode:
      typeof features.pathHighlight === "object"
        ? (features.pathHighlight.mode ?? "neighbors")
        : "neighbors",
    search: Boolean(features.search),
    edgeInspector: Boolean(features.edgeInspector),
    controls: features.controls ?? "auto",
  };
}
