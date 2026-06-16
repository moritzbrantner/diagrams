import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
const changelog = readFileSync(path.join(rootDir, "CHANGELOG.md"), "utf8");
const versionHeading = `## ${packageJson.version}`;
const changesetDir = path.join(rootDir, ".changeset");
const pendingChangesets = existsSync(changesetDir)
  ? readdirSync(changesetDir).filter((fileName) => fileName.endsWith(".md"))
  : [];

if (!changelog.includes(versionHeading)) {
  throw new Error(`CHANGELOG.md must include ${versionHeading} before release verification.`);
}

if (pendingChangesets.length > 0) {
  throw new Error(
    `Release verification requires versioned changesets. Pending changesets: ${pendingChangesets.join(", ")}`,
  );
}

console.log(`Release state matches package version ${packageJson.version}.`);
