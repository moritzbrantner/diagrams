import {
  installDiagramComputeRuntime,
  type DiagramComputeRuntime,
  type DiagramLayout,
  type DiagramLayoutInput,
  type DiagramVisibility,
  type DiagramVisibilityQuery,
} from "./layout";

type DiagramsWasmModule = {
  default?: (moduleOrPath?: unknown) => Promise<unknown>;
  layoutDiagramGraph(input: DiagramLayoutInput): DiagramLayout;
  queryDiagramVisibility(layout: DiagramLayout, query: DiagramVisibilityQuery): DiagramVisibility;
};

let installPromise: Promise<DiagramComputeRuntime> | undefined;

export function createDiagramsWasmRuntime(wasmModule: DiagramsWasmModule): DiagramComputeRuntime {
  return {
    kind: "wasm",
    layoutGraph(input) {
      return wasmModule.layoutDiagramGraph(input);
    },
    queryVisibility(layout, query) {
      return wasmModule.queryDiagramVisibility(layout, query);
    },
  };
}

export async function loadDiagramsWasmRuntime(): Promise<DiagramComputeRuntime> {
  const wasmModule = (await import("@moritzbrantner/diagrams/wasm")) as DiagramsWasmModule;
  await wasmModule.default?.();
  return createDiagramsWasmRuntime(wasmModule);
}

/** Loads the package-owned WASM core once and installs it for all diagram adapters. */
export function loadAndInstallDiagramsWasmRuntime(): Promise<DiagramComputeRuntime> {
  installPromise ??= loadDiagramsWasmRuntime()
    .then((runtime) => {
      installDiagramComputeRuntime(runtime);
      return runtime;
    })
    .catch((error: unknown) => {
      installPromise = undefined;
      throw error;
    });

  return installPromise;
}
