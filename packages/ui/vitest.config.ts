import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // figma-plugin-ds/index.js uses ESM bare imports without .js extension —
      // broken under Node 24 strict ESM. Alias both the CSS subpath and the JS
      // root to local stubs so tests never touch the broken package entry.
      {
        find: "figma-plugin-ds/dist/figma-plugin-ds.css",
        replacement: path.resolve(
          __dirname,
          "node_modules/figma-plugin-ds/dist/figma-plugin-ds.css",
        ),
      },
      {
        find: /^figma-plugin-ds$/,
        replacement: path.resolve(__dirname, "__mocks__/figma-plugin-ds.js"),
      },
    ],
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: true,
    server: {
      deps: {
        // Inline react-figma-ui so Vite transforms its CJS bundle and the
        // resolve.alias above intercepts its require("figma-plugin-ds") call.
        inline: ["react-figma-ui", "figma-plugin-ds"],
      },
    },
  },
});
