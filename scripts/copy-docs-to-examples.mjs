import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(rootDir, "docs");
const outputDir = path.join(rootDir, "dist-examples", "api");

if (!existsSync(docsDir)) {
  throw new Error("TypeDoc output not found. Run `bun run docs` before copying docs.");
}

rmSync(outputDir, { force: true, recursive: true });
mkdirSync(path.dirname(outputDir), { recursive: true });
cpSync(docsDir, outputDir, { recursive: true });

console.log("Copied TypeDoc output to dist-examples/api.");
