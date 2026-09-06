import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

type PackageJson = {
  name: string;
  exports: Record<string, { import?: string; types?: string } | string>;
};

function getPackageAliases(rootDir: string) {
  const packageJson = JSON.parse(
    readFileSync(path.join(rootDir, "package.json"), "utf8"),
  ) as PackageJson;

  return Object.keys(packageJson.exports)
    .filter((exportKey) => exportKey !== "./package.json")
    .sort((left, right) => right.length - left.length)
    .map((exportKey) => {
      const name = exportKey === "." ? "index" : exportKey.slice(2);
      const find = exportKey === "." ? packageJson.name : `${packageJson.name}/${name}`;
      const replacement =
        name === "wasm"
          ? path.resolve(rootDir, "src/testing/diagrams-wasm.ts")
          : path.resolve(rootDir, `src/${name}.ts`);

      return {
        find,
        replacement,
      };
    });
}

export default defineConfig({
  resolve: {
    alias: getPackageAliases(rootDir),
  },
  test: {
    coverage: {
      exclude: [
        "src/**/*.stories.ts",
        "src/**/*.stories.tsx",
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/testing/**",
      ],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      provider: "istanbul",
      reporter: ["text", "lcov"],
      thresholds: {
        branches: 50,
        functions: 60,
        lines: 60,
        statements: 60,
      },
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
