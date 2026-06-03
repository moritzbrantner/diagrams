import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const rootDir = fileURLToPath(new URL("./", import.meta.url));
const tsFiles = [
  "src/**/*.{ts,tsx}",
  "examples/**/*.{ts,tsx}",
  ".storybook/**/*.{ts,tsx}",
  "*.{ts,tsx}",
];

export default tseslint.config(
  {
    ignores: [
      "coverage/",
      "dist/",
      "dist-examples/",
      "docs/",
      "node_modules/",
      "playwright-report/",
      ".unlighthouse/",
      "test-results/",
      "storybook-static/",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.node,
      sourceType: "module",
    },
    rules: {
      "import/no-unresolved": "off",
    },
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: tsFiles,
  })),
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  jsxA11y.flatConfigs.recommended,
  {
    files: tsFiles,
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: rootDir,
      },
      sourceType: "module",
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "import/order": [
        "error",
        {
          alphabetize: {
            caseInsensitive: true,
            order: "asc",
          },
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          "newlines-between": "always",
        },
      ],
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
  {
    files: [
      "src/components/chart/*.tsx",
      "src/components/org-chart.tsx",
      "src/components/process-map.tsx",
      "src/components/relationship-map.tsx",
    ],
    rules: {
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "import/order": "off",
      "jsx-a11y/no-noninteractive-tabindex": "off",
      "prefer-const": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.node,
      sourceType: "module",
    },
    rules: {
      "import/no-unresolved": "off",
    },
  },
);
