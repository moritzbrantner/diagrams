import { readFileSync } from "node:fs";
import path from "node:path";

export function readPackageJson(rootDir) {
  return JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
}

export function getPublicEntrypoints(packageJson) {
  return Object.entries(packageJson.exports)
    .filter(([exportKey]) => exportKey !== "./package.json")
    .map(([exportKey, exportValue]) => {
      const name = exportKey === "." ? "index" : exportKey.slice(2);

      return {
        exportKey,
        name,
        packageSpecifier: exportKey === "." ? packageJson.name : `${packageJson.name}/${name}`,
        sourcePath: `src/${name}.ts`,
        distJsPath: `dist/${name}.js`,
        distTypesPath: `dist/${name}.d.ts`,
        exportValue,
      };
    });
}
