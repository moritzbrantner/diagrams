import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = "41736";
const site = `http://${host}:${port}`;

await run("bun", ["run", "build:examples"]);

const preview = spawn(
  "bun",
  [
    "x",
    "vite",
    "preview",
    "--host",
    host,
    "--port",
    port,
    "--strictPort",
    "--outDir",
    "../dist-examples",
  ],
  {
    stdio: ["ignore", "pipe", "pipe"],
  },
);

preview.stdout.on("data", (chunk) => process.stdout.write(`[preview] ${chunk}`));
preview.stderr.on("data", (chunk) => process.stderr.write(`[preview] ${chunk}`));

try {
  await waitForServer(site);
  await run("bunx", [
    "unlighthouse-ci",
    "--site",
    site,
    "--config-file",
    "unlighthouse.config.ts",
    "--desktop",
    "--budget",
    "40",
    "--reporter",
    "jsonExpanded",
  ]);
} finally {
  preview.kill("SIGTERM");
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

async function waitForServer(url) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Wait until Vite preview starts accepting connections.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}
