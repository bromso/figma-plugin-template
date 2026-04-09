import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import postcssUrl from "postcss-url";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";
import richSvg from "vite-plugin-react-rich-svg";
import { viteSingleFile } from "vite-plugin-singlefile";

const uiSrcPath = path.resolve(__dirname, "../../packages/ui/src");
const isAnalyze = process.env.ANALYZE === "true";

export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [react(), richSvg(), tailwindcss(), viteSingleFile()];

  if (isAnalyze) {
    const { visualizer } = await import("rollup-plugin-visualizer");
    plugins.push(
      visualizer({
        open: true,
        gzipSize: true,
        template: "treemap",
        filename: "stats.html",
      }),
    );
  }

  return {
    plugins,
    root: uiSrcPath,
    build: {
      minify: mode === "production",
      cssMinify: mode === "production",
      sourcemap: mode !== "production" ? "inline" : false,
      emptyOutDir: false,
      outDir: path.resolve(__dirname, "dist"),
      rolldownOptions: {
        input: path.resolve(uiSrcPath, "index.html"),
      },
    },
    css: {
      postcss: {
        plugins: [postcssUrl({ url: "inline" })],
      },
    },
    resolve: {
      alias: {
        "@": uiSrcPath,
      },
    },
  };
});
