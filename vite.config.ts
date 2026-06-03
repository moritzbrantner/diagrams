import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(rootDir, "examples/index.html"),
      },
    },
  },
  plugins: [tailwindcss()],
  root: path.resolve(rootDir, "examples"),
  resolve: {
    alias: {
      "@moritzbrantner/diagrams": path.resolve(rootDir, "src/index.ts"),
      "@moritzbrantner/diagrams/charts": path.resolve(rootDir, "src/charts.ts"),
      "@moritzbrantner/diagrams/org-chart": path.resolve(rootDir, "src/org-chart.ts"),
      "@moritzbrantner/diagrams/process-map": path.resolve(rootDir, "src/process-map.ts"),
      "@moritzbrantner/diagrams/relationship-map": path.resolve(rootDir, "src/relationship-map.ts"),
      "@moritzbrantner/diagrams/uml-diagram": path.resolve(rootDir, "src/uml-diagram.ts"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
