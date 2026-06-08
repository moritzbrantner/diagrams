import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  exports?: Record<string, unknown>;
  license?: string;
  name?: string;
  peerDependencies?: Record<string, string>;
  private?: boolean;
  scripts?: Record<string, string>;
};
const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf8")) as {
  compilerOptions?: {
    paths?: Record<string, string[]>;
  };
};
const publicExportPaths = Object.keys(packageJson.exports ?? {})
  .filter((exportKey) => exportKey !== "." && exportKey !== "./package.json")
  .map((exportKey) => `@moritzbrantner/diagrams/${exportKey.slice(2)}`);

describe("package contract", () => {
  test("is a public MIT package with expected peer contracts", () => {
    expect(packageJson.name).toBe("@moritzbrantner/diagrams");
    expect(packageJson.private).toBe(false);
    expect(packageJson.license).toBe("MIT");
    expect(packageJson.peerDependencies).toMatchObject({
      "@moritzbrantner/ui": "^1.0.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
    });
  });

  test("omits chart package surfaces and density engine scripts", () => {
    expect(packageJson.exports?.["./charts"]).toBeUndefined();
    expect(tsconfig.compilerOptions?.paths?.["@moritzbrantner/diagrams/charts"]).toBeUndefined();
    expect(packageJson.peerDependencies?.recharts).toBeUndefined();
    expect(packageJson.dependencies?.["@moritzbrantner/viz-engine"]).toBeUndefined();
    expect(packageJson.scripts?.["build:wasm"]).toBeUndefined();
    expect(packageJson.scripts?.["test:wasm"]).toBeUndefined();
  });

  test("exports root and all public subpaths", () => {
    expect(packageJson.exports).toMatchObject({
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
      },
      "./architecture-diagram": {
        types: "./dist/architecture-diagram.d.ts",
        import: "./dist/architecture-diagram.js",
      },
      "./decision-tree": {
        types: "./dist/decision-tree.d.ts",
        import: "./dist/decision-tree.js",
      },
      "./dependency-graph": {
        types: "./dist/dependency-graph.d.ts",
        import: "./dist/dependency-graph.js",
      },
      "./entity-relationship-diagram": {
        types: "./dist/entity-relationship-diagram.d.ts",
        import: "./dist/entity-relationship-diagram.js",
      },
      "./gantt-chart": {
        types: "./dist/gantt-chart.d.ts",
        import: "./dist/gantt-chart.js",
      },
      "./journey-map": {
        types: "./dist/journey-map.d.ts",
        import: "./dist/journey-map.js",
      },
      "./mind-map": {
        types: "./dist/mind-map.d.ts",
        import: "./dist/mind-map.js",
      },
      "./org-chart": {
        types: "./dist/org-chart.d.ts",
        import: "./dist/org-chart.js",
      },
      "./process-map": {
        types: "./dist/process-map.d.ts",
        import: "./dist/process-map.js",
      },
      "./relationship-map": {
        types: "./dist/relationship-map.d.ts",
        import: "./dist/relationship-map.js",
      },
      "./sequence-diagram": {
        types: "./dist/sequence-diagram.d.ts",
        import: "./dist/sequence-diagram.js",
      },
      "./state-machine-diagram": {
        types: "./dist/state-machine-diagram.d.ts",
        import: "./dist/state-machine-diagram.js",
      },
      "./swimlane-diagram": {
        types: "./dist/swimlane-diagram.d.ts",
        import: "./dist/swimlane-diagram.js",
      },
      "./timeline-diagram": {
        types: "./dist/timeline-diagram.d.ts",
        import: "./dist/timeline-diagram.js",
      },
      "./uml-diagram": {
        types: "./dist/uml-diagram.d.ts",
        import: "./dist/uml-diagram.js",
      },
      "./package.json": "./package.json",
    });
  });

  test("has TypeScript path coverage for every public export", () => {
    expect(tsconfig.compilerOptions?.paths?.["@moritzbrantner/diagrams"]).toEqual([
      "./src/index.ts",
    ]);
    expect(tsconfig.compilerOptions?.paths).toMatchObject(
      Object.fromEntries(
        publicExportPaths.map((specifier) => [
          specifier,
          [`./src/${specifier.replace("@moritzbrantner/diagrams/", "")}.ts`],
        ]),
      ),
    );
  });

  test("keeps example-only React Query out of runtime dependencies", () => {
    expect(packageJson.dependencies?.["@tanstack/react-query"]).toBeUndefined();
    expect(packageJson.devDependencies?.["@tanstack/react-query"]).toBeUndefined();
  });

  test("exposes maturity and release scripts", () => {
    expect(packageJson.scripts).toMatchObject({
      "api:check": "bun run build && node ./scripts/check-api-report.mjs",
      "audit:production": "bun audit --production",
      "bench:diagrams": "bun run build && node ./scripts/benchmark-diagrams.mjs",
      "quality:pages": "bun run test:unlighthouse",
      "test:unlighthouse": "node ./scripts/run-unlighthouse.mjs",
      "verify:release": "bun run verify && bun run bench:diagrams",
      "version-packages": "changeset version",
    });
  });
});
