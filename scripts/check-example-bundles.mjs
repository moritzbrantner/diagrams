import { gzipSync } from "node:zlib";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist-examples");
const assetsDir = path.join(distDir, "assets");
const maxAssetBytes = 300_000;
const maxPageJsBytes = 300_000;
const maxPageJsGzipBytes = 100_000;

const slugs = readDiagramSlugs();
const rootHtml = readHtml(path.join(distDir, "index.html"));

if (getModuleScriptSources(rootHtml).length > 0) {
  throw new Error("dist-examples/index.html must not reference module scripts.");
}

for (const slug of slugs) {
  const htmlPath = path.join(distDir, slug, "index.html");

  if (!existsSync(htmlPath)) {
    throw new Error(`Missing diagram page HTML: ${path.relative(rootDir, htmlPath)}`);
  }

  const scriptSources = getModuleScriptSources(readHtml(htmlPath));

  if (scriptSources.length === 0) {
    throw new Error(`${slug} does not reference any JavaScript assets.`);
  }

  const scriptPaths = scriptSources.map((source) => resolveDistReference(source));
  const rawBytes = sum(scriptPaths.map((scriptPath) => statSync(scriptPath).size));
  const gzipBytes = sum(
    scriptPaths.map((scriptPath) => gzipSync(readFileSync(scriptPath)).byteLength),
  );

  if (rawBytes > maxPageJsBytes) {
    throw new Error(`${slug} directly references ${rawBytes} JS bytes, over ${maxPageJsBytes}.`);
  }

  if (gzipBytes > maxPageJsGzipBytes) {
    throw new Error(
      `${slug} directly references ${gzipBytes} gzip JS bytes, over ${maxPageJsGzipBytes}.`,
    );
  }
}

for (const fileName of readdirSync(assetsDir)) {
  if (!fileName.endsWith(".js")) {
    continue;
  }

  const assetPath = path.join(assetsDir, fileName);
  const bytes = statSync(assetPath).size;

  if (bytes > maxAssetBytes) {
    throw new Error(
      `${path.relative(rootDir, assetPath)} is ${bytes} bytes, over ${maxAssetBytes}.`,
    );
  }
}

console.log(`Validated ${slugs.length} diagram pages and example JS bundle budgets.`);

function readDiagramSlugs() {
  const source = readFileSync(path.join(rootDir, "examples/src/diagram-pages.ts"), "utf8");

  return [...source.matchAll(/slug:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function readHtml(htmlPath) {
  if (!existsSync(htmlPath)) {
    throw new Error(`Missing HTML file: ${path.relative(rootDir, htmlPath)}`);
  }

  return readFileSync(htmlPath, "utf8");
}

function getModuleScriptSources(html) {
  return [
    ...html.matchAll(
      /<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["']([^"']+)["'])[^>]*>/g,
    ),
  ].map((match) => match[1]);
}

function resolveDistReference(source) {
  const pathname = source.split("?")[0].split("#")[0];
  const basePath =
    process.env.BASE_PATH && process.env.BASE_PATH !== "/" ? process.env.BASE_PATH : "/";
  const normalizedBasePath = basePath.endsWith("/") ? basePath : `${basePath}/`;
  let relativePath = pathname.startsWith("/") ? pathname.slice(1) : pathname;

  if (normalizedBasePath !== "/" && relativePath.startsWith(normalizedBasePath.slice(1))) {
    relativePath = relativePath.slice(normalizedBasePath.length - 1);
  }

  const assetPath = path.join(distDir, relativePath);

  if (!existsSync(assetPath)) {
    throw new Error(`Referenced asset does not exist: ${source}`);
  }

  return assetPath;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}
