import type {
  DiagramLayout,
  DiagramLayoutInput,
  DiagramVisibility,
  DiagramVisibilityQuery,
} from "./layout";

declare function initDiagramsWasm(moduleOrPath?: unknown): Promise<unknown>;

export default initDiagramsWasm;
export function layoutDiagramGraph(input: DiagramLayoutInput): DiagramLayout;
export function queryDiagramVisibility(
  layout: DiagramLayout,
  query: DiagramVisibilityQuery,
): DiagramVisibility;
