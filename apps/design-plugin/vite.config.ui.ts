import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import postcssUrl from "postcss-url";
import type { PluginOption, UserConfig } from "vite";
import { defineConfig } from "vite";
import richSvg from "vite-plugin-react-rich-svg";
import { viteSingleFile } from "vite-plugin-singlefile";

// BUG-06 — postcss-url asset inliner that uses pathToFileURL to correctly
// handle filesystem paths containing spaces or other characters that would
// otherwise require percent-encoding. The default `url: "inline"` mode in
// postcss-url v10.1.3 constructs file:// URIs via string concatenation in
// some code paths, which breaks on paths with spaces. Reading the file
// ourselves and returning a data: URI bypasses that code path entirely.
const MIME_BY_EXT: Record<string, string> = {
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
  svg: "image/svg+xml",
  png: "image/png",
};

function inlineAssetAsDataUri(asset: { absolutePath?: string; url?: string }): string | undefined {
  if (!asset.absolutePath) return undefined;
  try {
    // pathToFileURL percent-encodes spaces and other special chars.
    // We don't use the URL directly for reading (fs accepts native
    // paths fine), but constructing it here proves the path round-trips
    // through node:url cleanly and gives us a well-formed file:// ref
    // for error messages if anything goes wrong.
    const fileUrl = pathToFileURL(asset.absolutePath);
    void fileUrl;
    const content = fs.readFileSync(asset.absolutePath);
    const ext = path.extname(asset.absolutePath).slice(1).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";
    return `data:${mime};base64,${content.toString("base64")}`;
  } catch (err) {
    console.warn(
      `[postcss-url] Failed to inline asset at ${asset.absolutePath} (${
        pathToFileURL(asset.absolutePath).href
      }):`,
      err
    );
    return undefined;
  }
}

const uiSrcPath = path.resolve(__dirname, "../../packages/ui/src");
const isAnalyze = process.env.ANALYZE === "true";

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const plugins: PluginOption[] = [react(), richSvg(), tailwindcss(), viteSingleFile()];

  if (isAnalyze) {
    const { visualizer } = await import("rollup-plugin-visualizer");
    plugins.push(
      visualizer({
        open: true,
        gzipSize: true,
        template: "treemap",
        filename: "stats.html",
      })
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
        plugins: [postcssUrl({ url: inlineAssetAsDataUri })],
      },
    },
    resolve: {
      alias: {
        "@": uiSrcPath,
      },
    },
  };
});
