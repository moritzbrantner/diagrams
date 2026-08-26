import { readFileSync, writeFileSync } from "node:fs";

patchPackage();
patchTsconfig();
patchReadme();
patchExampleStyles();

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  writeFileSync(path, content);
}

function replaceOnce(content, before, after, path) {
  const index = content.indexOf(before);
  if (index < 0) {
    throw new Error(`Could not find expected text in ${path}: ${before.slice(0, 120)}`);
  }
  if (content.indexOf(before, index + before.length) >= 0) {
    throw new Error(`Expected text was not unique in ${path}: ${before.slice(0, 120)}`);
  }
  return content.slice(0, index) + after + content.slice(index + before.length);
}

function patchPackage() {
  const path = "package.json";
  const packageJson = JSON.parse(read(path));
  const packageExport = packageJson.exports["./package.json"];
  delete packageJson.exports["./package.json"];
  packageJson.exports["./core"] = {
    types: "./dist/core.d.ts",
    import: "./dist/core.js",
  };
  packageJson.exports["./react"] = {
    types: "./dist/react.d.ts",
    import: "./dist/react.js",
  };
  packageJson.exports["./package.json"] = packageExport;
  write(path, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function patchTsconfig() {
  const path = "tsconfig.json";
  const tsconfig = JSON.parse(read(path));
  tsconfig.compilerOptions.paths["@moritzbrantner/diagrams/core"] = ["./src/core.ts"];
  tsconfig.compilerOptions.paths["@moritzbrantner/diagrams/react"] = ["./src/react.ts"];
  write(path, `${JSON.stringify(tsconfig, null, 2)}\n`);
}

function patchReadme() {
  const path = "README.md";
  let content = read(path);
  content = content.replaceAll(
    'import "@moritzbrantner/ui/atlas/styles.css";',
    'import "@moritzbrantner/ui/atlas/styles.css";\nimport "@moritzbrantner/ui/component-sources.css";',
  );

  const anchor = "## API Stability\n";
  const section = `## Package Boundaries

The package separates server-safe diagram state from interactive React rendering:

- \`@moritzbrantner/diagrams/core\` exposes diagram geometry/state types and shareable view-state
  codecs without runtime React imports. It is safe for server-rendered code, workers, scripts, and
  non-React coordination.
- \`@moritzbrantner/diagrams/react\` exposes the React diagram components plus the core state
  helpers. In Next.js, keep this import behind the smallest client boundary that needs interaction.
- Specific diagram entrypoints such as \`@moritzbrantner/diagrams/dependency-graph\` remain
  available when a consumer wants one focused component.

The package does not own routing. Applications can synchronize durable view state with their URL
without coupling diagrams to Next.js or another router.

## Shareable And Accessible Diagram State

\`encodeDiagramViewState\` and \`decodeDiagramViewState\` serialize durable viewport, search,
highlight, and inspected-edge state to URL query parameters. Use them from the core entrypoint and
let the application decide when the URL should change.

Interactive diagrams should also have a structured representation when their content affects a
user decision. Hosts can render their source nodes/edges, entities, steps, or milestones as a list,
\`DescriptionList\`, or \`DataGrid\` alongside the graphical canvas. The diagram package keeps the
visualization controlled so the same source data can drive both representations.

`;
  content = replaceOnce(content, anchor, section + anchor, path);
  write(path, content);
}

function patchExampleStyles() {
  const path = "examples/src/styles.css";
  const content = read(path);
  write(
    path,
    replaceOnce(
      content,
      '@import "@moritzbrantner/ui/atlas/styles.css";\n',
      '@import "@moritzbrantner/ui/atlas/styles.css";\n@import "@moritzbrantner/ui/component-sources.css";\n',
      path,
    ),
  );
}
