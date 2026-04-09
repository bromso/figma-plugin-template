import path from "node:path";
import react from "@vitejs/plugin-react";
import postcssUrl from "postcss-url";
import { defineConfig } from "vite";
import richSvg from "vite-plugin-react-rich-svg";
import { viteSingleFile } from "vite-plugin-singlefile";

const uiSrcPath = path.resolve(__dirname, "../../packages/ui/src");

export default defineConfig(({ mode }) => ({
  plugins: [react(), richSvg(), viteSingleFile()],
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
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        importers: [
          {
            // Resolve @ui/* aliases in Sass @use/@forward rules
            // Sass importers do not go through Vite's resolve.alias
            findFileUrl(url: string) {
              if (!url.startsWith("@ui/")) return null;
              const resolved = path.resolve(uiSrcPath, url.replace(/^@ui\//, ""));
              return new URL(`file://${resolved}`);
            },
          },
        ],
      },
    },
  },
}));
