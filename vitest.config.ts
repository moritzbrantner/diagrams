import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@moritzbrantner/diagrams": path.resolve(rootDir, "src/index.ts"),
      "@moritzbrantner/diagrams/org-chart": path.resolve(rootDir, "src/org-chart.ts"),
      "@moritzbrantner/diagrams/process-map": path.resolve(rootDir, "src/process-map.ts"),
      "@moritzbrantner/diagrams/relationship-map": path.resolve(rootDir, "src/relationship-map.ts"),
    },
  },
  test: {
    coverage: {
      exclude: [
        "src/**/*.stories.ts",
        "src/**/*.stories.tsx",
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/testing/**",
      ],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      provider: "istanbul",
      reporter: ["text", "lcov"],
      thresholds: {
        branches: 50,
        functions: 60,
        lines: 60,
        statements: 60,
      },
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
