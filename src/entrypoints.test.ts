import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import { decodeDiagramViewState } from "./core";

import { ArchitectureDiagram } from "./react";

import * as compatibilityApi from "./index";

type PackageJson = {
  exports?: Record<string, { import?: string; types?: string } | string>;
};

describe("package entrypoint boundaries", () => {
  test("publishes explicit server-safe and client entrypoints", () => {
    const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as PackageJson;

    expect(packageJson.exports?.["./core"]).toEqual({
      import: "./dist/core.js",
      types: "./dist/core.d.ts",
    });
    expect(packageJson.exports?.["./react"]).toEqual({
      import: "./dist/react.js",
      types: "./dist/react.d.ts",
    });
  });

  test("keeps source entrypoints aligned with the compatibility surface", () => {
    expect(compatibilityApi.decodeDiagramViewState).toBe(decodeDiagramViewState);
    expect(compatibilityApi.ArchitectureDiagram).toBe(ArchitectureDiagram);
  });

  test("keeps core source free of React and component imports", () => {
    const core = readFileSync(resolve("src/core.ts"), "utf8");
    const coreTypes = readFileSync(resolve("src/diagram-core-types.ts"), "utf8");

    expect(core).not.toContain("./architecture-diagram");
    expect(core).not.toContain("./components");
    expect(coreTypes).not.toMatch(/from ["']react["']/);
  });

  test("does not introduce visualization meta-engine dependencies", () => {
    const packageJson = readFileSync(resolve("package.json"), "utf8");

    expect(packageJson).not.toContain("@moritzbrantner/viz-engine");
    expect(packageJson).not.toContain("@moritzbrantner/charts");
  });
});
