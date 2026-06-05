import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const declarationPath = path.join(rootDir, "dist", "index.d.ts");
const reportPath = path.join(rootDir, "etc", "diagrams.api.md");

if (!existsSync(declarationPath)) {
  throw new Error("API report check requires dist/index.d.ts. Run `bun run build` first.");
}

const declaration = readFileSync(declarationPath, "utf8").trimEnd();
const report = formatReport(
  [
    "# API Report: @moritzbrantner/diagrams",
    "",
    "This file is generated from `dist/index.d.ts`. Update it intentionally when the public API changes.",
    "",
    "```ts",
    declaration,
    "```",
    "",
  ].join("\n"),
);

if (!existsSync(reportPath)) {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report);
  throw new Error(
    `Created ${path.relative(rootDir, reportPath)}. Review and commit it, then rerun api:check.`,
  );
}

const current = readFileSync(reportPath, "utf8");

if (current !== report) {
  const tempPath = path.join(rootDir, "temp", "diagrams.api.md");

  mkdirSync(path.dirname(tempPath), { recursive: true });
  writeFileSync(tempPath, report);
  throw new Error(
    `Public API report is out of date. Compare ${path.relative(rootDir, reportPath)} with ${path.relative(
      rootDir,
      tempPath,
    )}, then update the committed report if the API change is intentional.`,
  );
}

console.log("@moritzbrantner/diagrams public API report is up to date.");

function formatReport(report) {
  const formatterPath = path.join(rootDir, "node_modules", ".bin", "oxfmt");

  if (!existsSync(formatterPath)) {
    return report;
  }

  return execFileSync(formatterPath, ["--stdin-filepath", "diagrams.api.md"], {
    cwd: rootDir,
    encoding: "utf8",
    input: report,
    stdio: ["pipe", "pipe", "inherit"],
  });
}
