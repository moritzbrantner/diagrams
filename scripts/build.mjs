import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPublicEntrypoints, readPackageJson } from "./public-entrypoints.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = readPackageJson(rootDir);
const entrypoints = getPublicEntrypoints(packageJson);

for (const entrypoint of entrypoints) {
  if (!existsSync(path.join(rootDir, entrypoint.sourcePath))) {
    throw new Error(`Missing source file for ${entrypoint.exportKey}: ${entrypoint.sourcePath}`);
  }

  if (entrypoint.exportValue?.import !== `./${entrypoint.distJsPath}`) {
    throw new Error(`${entrypoint.exportKey} import export expected ./${entrypoint.distJsPath}.`);
  }

  if (entrypoint.exportValue?.types !== `./${entrypoint.distTypesPath}`) {
    throw new Error(`${entrypoint.exportKey} types export expected ./${entrypoint.distTypesPath}.`);
  }
}

execFileSync(
  path.join(rootDir, "node_modules", ".bin", "tsup"),
  [
    ...entrypoints.map((entrypoint) => entrypoint.sourcePath),
    "--format",
    "esm",
    "--dts",
    "--clean",
    "--out-dir",
    "dist",
  ],
  {
    cwd: rootDir,
    stdio: "inherit",
  },
);
