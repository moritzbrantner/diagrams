import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

import { diagramPages } from "./examples/src/diagram-pages";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

type PackageJson = {
  name: string;
  exports: Record<string, { import?: string; types?: string } | string>;
};

function getPackageAliases(rootDir: string): { find: RegExp; replacement: string }[] {
  const packageJson = JSON.parse(
    readFileSync(path.join(rootDir, "package.json"), "utf8"),
  ) as unknown as PackageJson;

  return Object.keys(packageJson.exports)
    .filter((exportKey) => exportKey !== "./package.json")
    .map((exportKey) => {
      const name = exportKey === "." ? "index" : exportKey.slice(2);
      const find = exportKey === "." ? packageJson.name : `${packageJson.name}/${name}`;

      return {
        find: new RegExp(`^${escapeRegExp(find)}$`),
        replacement: path.resolve(rootDir, `src/${name}.ts`),
      };
    });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getExampleInputs(rootDir: string): Record<string, string> {
  const inputs: Record<string, string> = {
    index: path.resolve(rootDir, "examples/index.html"),
  };

  for (const page of diagramPages) {
    inputs[page.slug] = path.resolve(rootDir, `examples/${page.slug}/index.html`);
  }

  return inputs;
}

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  build: {
    rollupOptions: {
      input: getExampleInputs(rootDir),
    },
  },
  plugins: [tailwindcss()],
  root: path.resolve(rootDir, "examples"),
  resolve: {
    alias: getPackageAliases(rootDir),
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
