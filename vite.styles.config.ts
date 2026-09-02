import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    emptyOutDir: false,
    lib: {
      cssFileName: "styles",
      entry: "src/styles-entry.ts",
      fileName: "styles-entry",
      formats: ["es"],
    },
    outDir: "dist",
  },
});
