import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";

import type { StorybookConfig } from "@storybook/react-vite";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const config: StorybookConfig = {
  addons: ["@storybook/addon-vitest"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: [
    "../src/**/*.stories.@(ts|tsx)",
    "../examples/**/*.stories.@(ts|tsx)",
  ],
  viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    config.resolve = {
      ...config.resolve,
      alias: {
        ...(Array.isArray(config.resolve?.alias) ? {} : config.resolve?.alias),
        "@moritzbrantner/diagrams": path.resolve(rootDir, "src/index.ts"),
      },
    };

    return config;
  },
};

export default config;
