import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPublicEntrypoints } from "./public-entrypoints.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = mkdtempSync(path.join(tmpdir(), "diagrams-pack-check-"));
const typeOnlyEntrypoints = new Set(["diagram-core-types", "diagram-types"]);

try {
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", tempDir], {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  );
  const tarball = path.join(tempDir, path.basename(packed[0]?.filename ?? ""));
  const extractDir = path.join(tempDir, "extract");
  const packageDir = path.join(extractDir, "package");

  if (!existsSync(tarball)) {
    throw new Error("npm pack did not produce a tarball.");
  }

  mkdirSync(extractDir);
  execFileSync("tar", ["-xzf", tarball, "-C", extractDir], {
    stdio: "inherit",
  });
  assertFile(path.join(packageDir, "package.json"));

  const packageJson = JSON.parse(readFileSync(path.join(packageDir, "package.json"), "utf8"));
  const entrypoints = getPublicEntrypoints(packageJson);

  for (const entrypoint of entrypoints) {
    assertFile(path.join(packageDir, entrypoint.distJsPath));
    assertFile(path.join(packageDir, entrypoint.distTypesPath));

    if (entrypoint.exportValue?.import !== `./${entrypoint.distJsPath}`) {
      throw new Error(`Packed package ${entrypoint.exportKey} import export is incorrect.`);
    }

    if (entrypoint.exportValue?.types !== `./${entrypoint.distTypesPath}`) {
      throw new Error(`Packed package ${entrypoint.exportKey} types export is incorrect.`);
    }
  }

  assertPeerDependency(packageJson, "@moritzbrantner/ui", "^1.0.0");
  assertPeerDependency(packageJson, "react", "^19.0.0");
  assertPeerDependency(packageJson, "react-dom", "^19.0.0");

  const consumerDir = path.join(tempDir, "consumer");
  const consumerNodeModules = path.join(consumerDir, "node_modules");

  mkdirSync(consumerDir);
  linkInstalledModules(path.join(rootDir, "node_modules"), path.join(packageDir, "node_modules"));
  linkInstalledModules(path.join(rootDir, "node_modules"), consumerNodeModules);
  mkdirSync(path.join(consumerNodeModules, "@moritzbrantner"), {
    recursive: true,
  });
  symlinkSync(packageDir, path.join(consumerNodeModules, "@moritzbrantner", "diagrams"), "dir");

  writeFileSync(
    path.join(consumerDir, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        dependencies: {
          "@moritzbrantner/diagrams": "file:../extract/package",
          "@moritzbrantner/ui": packageJson.peerDependencies["@moritzbrantner/ui"],
          react: packageJson.peerDependencies.react,
          "react-dom": packageJson.peerDependencies["react-dom"],
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(consumerDir, "import-check.mjs"),
    [
      `const specifiers = ${JSON.stringify(
        entrypoints
          .filter((entrypoint) => !typeOnlyEntrypoints.has(entrypoint.name))
          .map((entrypoint) => entrypoint.packageSpecifier),
        null,
        2,
      )};`,
      "",
      "for (const specifier of specifiers) {",
      "  const module = await import(specifier);",
      "",
      "  if (Object.keys(module).length === 0) {",
      "    throw new Error(`${specifier} returned no runtime exports.`);",
      "  }",
      "}",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(consumerDir, "type-check.ts"),
    [
      ...entrypoints.map(
        (entrypoint) =>
          `import type * as ${toNamespaceName(entrypoint.name)} from "${entrypoint.packageSpecifier}";`,
      ),
      "",
      "type ExportChecks = [",
      ...entrypoints.map((entrypoint) => `  keyof typeof ${toNamespaceName(entrypoint.name)},`),
      "];",
      "",
      "const checks = null as unknown as ExportChecks;",
      "",
      "if (!checks) {",
      '  throw new Error("Packed package type imports returned unexpected data.");',
      "}",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(consumerDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: ["type-check.ts"],
      },
      null,
      2,
    ),
  );

  execFileSync(process.execPath, [path.join(consumerDir, "import-check.mjs")], {
    cwd: consumerDir,
    stdio: "inherit",
  });
  execFileSync(
    path.join(rootDir, "node_modules", ".bin", "tsc"),
    ["--noEmit", "-p", "tsconfig.json"],
    {
      cwd: consumerDir,
      stdio: "inherit",
    },
  );
  writeBundlerSmokeApp(consumerDir, packageJson);
  execFileSync(path.join(rootDir, "node_modules", ".bin", "vite"), ["build"], {
    cwd: consumerDir,
    stdio: "inherit",
  });

  console.log("@moritzbrantner/diagrams packed artifact import and type checks passed.");
} finally {
  rmSync(tempDir, { force: true, recursive: true });
}

function assertFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Expected packed file to exist: ${path.relative(rootDir, filePath)}`);
  }
}

function assertPeerDependency(packageJson, name, expectedRange) {
  const actualRange = packageJson.peerDependencies?.[name];

  if (actualRange !== expectedRange) {
    throw new Error(
      `Packed package peer dependency ${name} expected ${expectedRange}, received ${actualRange ?? "missing"}.`,
    );
  }
}

function linkInstalledModules(sourceNodeModules, targetNodeModules) {
  mkdirSync(targetNodeModules, { recursive: true });

  for (const entry of readdirSync(sourceNodeModules, { withFileTypes: true })) {
    if (entry.name === ".bin") {
      continue;
    }

    const sourcePath = path.join(sourceNodeModules, entry.name);
    const targetPath = path.join(targetNodeModules, entry.name);

    if (entry.name.startsWith("@")) {
      mkdirSync(targetPath, { recursive: true });

      for (const scopedEntry of readdirSync(sourcePath, {
        withFileTypes: true,
      })) {
        const scopedTargetPath = path.join(targetPath, scopedEntry.name);

        if (!existsSync(scopedTargetPath)) {
          symlinkSync(path.join(sourcePath, scopedEntry.name), scopedTargetPath, "dir");
        }
      }

      continue;
    }

    if (!existsSync(targetPath)) {
      symlinkSync(sourcePath, targetPath, entry.isDirectory() ? "dir" : "file");
    }
  }
}

function writeBundlerSmokeApp(consumerDir, packageJson) {
  const sourceDir = path.join(consumerDir, "src");

  mkdirSync(sourceDir, { recursive: true });
  writeFileSync(
    path.join(consumerDir, "package.json"),
    JSON.stringify(
      {
        private: true,
        scripts: {
          build: "vite build",
        },
        type: "module",
        dependencies: {
          "@moritzbrantner/diagrams": "file:../extract/package",
          "@moritzbrantner/ui": packageJson.peerDependencies["@moritzbrantner/ui"],
          react: packageJson.peerDependencies.react,
          "react-dom": packageJson.peerDependencies["react-dom"],
        },
        devDependencies: {
          "@vitejs/plugin-react": "^latest",
          vite: "^latest",
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(consumerDir, "index.html"),
    [
      "<!doctype html>",
      '<html lang="en">',
      "  <head>",
      '    <meta charset="UTF-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      "    <title>Diagrams packed artifact smoke</title>",
      "  </head>",
      "  <body>",
      '    <div id="root"></div>',
      '    <script type="module" src="/src/main.tsx"></script>',
      "  </body>",
      "</html>",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(sourceDir, "main.tsx"),
    [
      'import "@moritzbrantner/diagrams/styles.css";',
      "",
      'import { DependencyGraph, RelationshipMap } from "@moritzbrantner/diagrams";',
      'import { createRoot } from "react-dom/client";',
      "",
      "function App() {",
      "  return (",
      '    <main style={{ display: "grid", gap: 24, padding: 24 }}>',
      "      <RelationshipMap",
      '        ariaLabel="Packed static relationship map"',
      '        nodes={[{ id: "api", label: "API", x: 0, y: 0 }, { id: "db", label: "Database", x: 260, y: 0 }]}',
      '        edges={[{ id: "api-db", source: "api", target: "db", label: "reads" }]}',
      "      />",
      "      <DependencyGraph",
      '        ariaLabel="Packed interactive dependency graph"',
      "        interactiveFeatures",
      '        selectedNodeId="pkg"',
      "        onNodeSelect={() => undefined}",
      '        nodes={[{ id: "app", label: "App", x: 0, y: 0 }, { id: "pkg", label: "Package", x: 260, y: 0 }]}',
      '        edges={[{ id: "app-pkg", source: "app", target: "pkg", label: "uses" }]}',
      "      />",
      "    </main>",
      "  );",
      "}",
      "",
      'createRoot(document.getElementById("root")!).render(<App />);',
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(consumerDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          module: "ESNext",
          moduleResolution: "Bundler",
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: ["src/**/*.ts", "src/**/*.tsx"],
      },
      null,
      2,
    ),
  );
}

function toNamespaceName(name) {
  if (name === "index") {
    return "Root";
  }

  return name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join("");
}
