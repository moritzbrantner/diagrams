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

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = mkdtempSync(path.join(tmpdir(), "diagrams-pack-check-"));
const expectedEntrypoints = [
  "index",
  "org-chart",
  "process-map",
  "relationship-map",
  "uml-diagram",
];

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

  for (const entrypoint of expectedEntrypoints) {
    assertFile(path.join(packageDir, "dist", `${entrypoint}.js`));
    assertFile(path.join(packageDir, "dist", `${entrypoint}.d.ts`));
  }

  const packageJson = JSON.parse(readFileSync(path.join(packageDir, "package.json"), "utf8"));

  for (const entrypoint of expectedEntrypoints) {
    const exportKey = entrypoint === "index" ? "." : `./${entrypoint}`;
    const distName = entrypoint === "index" ? "index" : entrypoint;

    if (packageJson.exports?.[exportKey]?.import !== `./dist/${distName}.js`) {
      throw new Error(`Packed package ${exportKey} import export is incorrect.`);
    }

    if (packageJson.exports?.[exportKey]?.types !== `./dist/${distName}.d.ts`) {
      throw new Error(`Packed package ${exportKey} types export is incorrect.`);
    }
  }

  assertPeerDependency(packageJson, "@moritzbrantner/ui", "^0.9.1");
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
      'import { OrgChart, ProcessMap, RelationshipMap, UmlDiagram } from "@moritzbrantner/diagrams";',
      'import { OrgChart as OrgChartSubpath } from "@moritzbrantner/diagrams/org-chart";',
      'import { ProcessMap as ProcessMapSubpath } from "@moritzbrantner/diagrams/process-map";',
      'import { RelationshipMap as RelationshipMapSubpath } from "@moritzbrantner/diagrams/relationship-map";',
      'import { UmlDiagram as UmlDiagramSubpath } from "@moritzbrantner/diagrams/uml-diagram";',
      "",
      "for (const value of [OrgChart, OrgChartSubpath, ProcessMap, ProcessMapSubpath, RelationshipMap, RelationshipMapSubpath, UmlDiagram, UmlDiagramSubpath]) {",
      "  if (typeof value !== 'function' && typeof value !== 'object') {",
      "    throw new Error('Packed package runtime import returned an unexpected export.');",
      "  }",
      "}",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(consumerDir, "type-check.ts"),
    [
      'import { type OrgChartNodeData } from "@moritzbrantner/diagrams";',
      'import { type ProcessMapStepData } from "@moritzbrantner/diagrams/process-map";',
      'import { type RelationshipMapNode } from "@moritzbrantner/diagrams/relationship-map";',
      'import { type UmlDiagramNode } from "@moritzbrantner/diagrams/uml-diagram";',
      "",
      'const node: OrgChartNodeData = { id: "owner", label: "Owner" };',
      'const step: ProcessMapStepData = { id: "plan", label: "Plan", status: "active" };',
      'const relationship: RelationshipMapNode = { id: "product", label: "Product" };',
      'const umlNode: UmlDiagramNode = { id: "draft", label: "Draft" };',
      "",
      "if (!node.id || !step.id || !relationship.id || !umlNode.id) {",
      "  throw new Error('Packed package type import returned unexpected data.');",
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
