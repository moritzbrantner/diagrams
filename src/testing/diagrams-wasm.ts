import type {
  DiagramLayout,
  DiagramLayoutInput,
  DiagramVisibility,
  DiagramVisibilityQuery,
} from "../layout";

export default async function initDiagramsWasm() {}

export function layoutDiagramGraph(_input: DiagramLayoutInput): DiagramLayout {
  throw new Error("The generated Diagrams WASM module is exercised by browser tests.");
}

export function queryDiagramVisibility(
  _layout: DiagramLayout,
  _query: DiagramVisibilityQuery,
): DiagramVisibility {
  throw new Error("The generated Diagrams WASM module is exercised by browser tests.");
}
