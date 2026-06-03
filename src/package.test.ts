import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  dependencies?: Record<string, string>;
  exports?: Record<string, unknown>;
  license?: string;
  name?: string;
  peerDependencies?: Record<string, string>;
  private?: boolean;
  scripts?: Record<string, string>;
};

describe("package contract", () => {
  test("is a public MIT package with expected peer contracts", () => {
    expect(packageJson.name).toBe("@moritzbrantner/diagrams");
    expect(packageJson.private).toBe(false);
    expect(packageJson.license).toBe("MIT");
    expect(packageJson.peerDependencies).toMatchObject({
      "@moritzbrantner/ui": "^0.9.1",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      recharts: "^3.0.0",
    });
  });

  test("omits charts density engine and wasm scripts", () => {
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
      "./charts": {
        types: "./dist/charts.d.ts",
        import: "./dist/charts.js",
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
      "./uml-diagram": {
        types: "./dist/uml-diagram.d.ts",
        import: "./dist/uml-diagram.js",
      },
      "./package.json": "./package.json",
    });
  });
});
