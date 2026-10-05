#!/usr/bin/env bun

// The `prepare` script. It only acts when the package sits below node_modules, which is where
// bun places a consumer's commit-pinned git dependency (listed in `trustedDependencies`).
// bun does not install a git dependency's devDependencies, and below node_modules esbuild
// ignores tsconfig.json and TypeScript emits no declarations. So the build runs in a copy
// outside node_modules with its own frozen install, and only the build output is copied back.
// The dependency's own node_modules, which bun resolved for the consumer, is left untouched.
// The optional `./wasm` runtime is built only when cargo and wasm-bindgen are on PATH and the
// build succeeds; otherwise the diagram components fall back to their TypeScript layouts.
// In a normal checkout it does nothing: `bun install` and `npm pack` must stay side-effect free.

import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const buildOutputs = ["dist"];
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(args: string[], cwd: string) {
  execFileSync("bun", args, { cwd, stdio: "inherit" });
}

function hasCommand(command: string) {
  return spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0;
}

if (packageRoot.split(path.sep).includes("node_modules")) {
  const buildRoot = mkdtempSync(path.join(tmpdir(), "git-install-build-"));
  const skipped = new Set(
    ["node_modules", ".git", "target", ...buildOutputs].map((entry) =>
      path.join(packageRoot, entry),
    ),
  );

  try {
    cpSync(packageRoot, buildRoot, {
      recursive: true,
      filter: (source) => !skipped.has(source),
    });
    run(["install", "--frozen-lockfile", "--ignore-scripts", "--linker", "hoisted"], buildRoot);
    run(["run", "build"], buildRoot);
    if (!hasCommand("cargo") || !hasCommand("wasm-bindgen")) {
      console.warn(
        "@moritzbrantner/diagrams: cargo or wasm-bindgen not found; building without the optional ./wasm runtime.",
      );
    } else {
      try {
        run(["run", "build:wasm"], buildRoot);
      } catch {
        // An incompatible toolchain must not block the TypeScript package; drop partial output.
        rmSync(path.join(buildRoot, "dist", "wasm"), { recursive: true, force: true });
        console.warn(
          "@moritzbrantner/diagrams: the WASM build failed; building without the optional ./wasm runtime.",
        );
      }
    }

    for (const output of buildOutputs) {
      rmSync(path.join(packageRoot, output), { recursive: true, force: true });
      cpSync(path.join(buildRoot, output), path.join(packageRoot, output), { recursive: true });
    }
  } finally {
    rmSync(buildRoot, { recursive: true, force: true });
  }
}
