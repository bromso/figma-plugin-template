---
phase: 12-tailwind-css-4.x-bundle-analysis
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - apps/figma-plugin/vite.config.ui.ts
  - packages/ui/src/app.tsx
  - packages/ui/src/styles.css
  - packages/ui/src/index.html
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-04-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files were reviewed as part of the Tailwind CSS 4.x integration and bundle analysis work. The files introduce `@tailwindcss/vite`, `postcss-url` inlining, and the `rollup-plugin-visualizer` analyzer. The implementation is broadly sound, but there are three warnings relating to correctness and build reliability, and three informational items worth noting.

No security vulnerabilities were found.

---

## Warnings

### WR-01: `rolldownOptions` is not a valid Vite build option — silently ignored

**File:** `apps/figma-plugin/vite.config.ui.ts:37-39`

**Issue:** The build configuration uses `rolldownOptions` to set the HTML entry point, but the correct Vite option is `rollupOptions`. Vite's `build` config has no `rolldownOptions` key (Rolldown is the Rust-based future bundler, not yet the default in Vite 6). This key will be silently ignored by Vite, meaning the `input` override has no effect. Vite will fall back to auto-detecting the entry from `root`, which happens to be `uiSrcPath`, so `index.html` is still found — but only by coincidence. Any future change to `root` would silently break the build without an obvious error.

**Fix:**
```typescript
build: {
  // ...
  rollupOptions: {
    input: path.resolve(uiSrcPath, "index.html"),
  },
},
```

### WR-02: `index.html` missing `<!DOCTYPE html>` and `<html>`/`<head>`/`<body>` shell

**File:** `packages/ui/src/index.html:1-4`

**Issue:** The file is a bare fragment (3 lines, no document structure). Vite's HTML plugin works with full HTML documents; it injects scripts and resolves assets by walking the document tree. A fragment without `<html>/<head>/<body>` is technically valid for Vite's dev-server mode, but `vite-plugin-singlefile` inlines all assets by replacing script/link tags it finds in the parsed document. The absence of proper structure is a known source of edge-case failures with singlefile when the HTML is serialised back, and it makes the resulting `dist/ui.html` non-conformant, which Figma's webview may handle inconsistently across platforms.

**Fix:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

### WR-03: `document.getElementById("root")` cast to `HTMLElement` without null guard in `main.tsx` (referenced by `index.html`)

**File:** `packages/ui/src/index.html:2` (runtime partner: `packages/ui/src/main.tsx:14`)

**Issue:** `main.tsx` line 14 casts the result of `getElementById("root")` directly to `HTMLElement` with `as HTMLElement`, suppressing the `null` type. Because `index.html` defines `<div id="root"></div>` as a bare fragment, any whitespace-only change or accidental removal of that element would produce a runtime crash (`Cannot read properties of null`) with no TypeScript protection. This is a fragile coupling between the HTML fragment and the bootstrap function.

**Fix:**
```typescript
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found. Check packages/ui/src/index.html.");
}
const root = ReactDOM.createRoot(rootElement);
```

---

## Info

### IN-01: `@source "."` directive in `styles.css` is redundant when `@tailwindcss/vite` is used

**File:** `packages/ui/src/styles.css:6`

**Issue:** The `@source "."` directive tells Tailwind v4's CSS scanner to scan the current directory. When using `@tailwindcss/vite`, the Vite plugin handles content scanning via Vite's module graph, making `@source` directives typically unnecessary. The comment acknowledges this is a workaround for the mismatched `root`/CWD setup. This is not wrong, but it creates a maintenance obligation: if the directory layout changes, the source path must be updated in two places (the Vite config and this CSS file). It is worth revisiting once the build root setup stabilises.

**Suggestion:** Document precisely why `@source "."` is required (the comment is good but brief). Consider instead aligning the Vite `root` with the actual working directory to eliminate the need for the workaround.

### IN-02: `viteSingleFile` and `rollup-plugin-visualizer` are order-sensitive but placement is implicit

**File:** `apps/figma-plugin/vite.config.ui.ts:14,18-25`

**Issue:** `viteSingleFile` must run after all asset-emitting plugins have finished so it can inline the final set of generated assets. `rollup-plugin-visualizer` must run after bundling is complete. Currently `viteSingleFile` is at index 3 in the static array and `visualizer` is pushed last (correct). However, the ordering is implicit and undocumented — a future contributor adding a plugin to the static array after `viteSingleFile` could break inlining silently.

**Suggestion:** Add a short comment marking the required order:

```typescript
const plugins: PluginOption[] = [
  react(),
  richSvg(),
  tailwindcss(),
  viteSingleFile(), // must be last in static plugins — inlines all prior asset output
];
// ...
// visualizer pushed after viteSingleFile (dynamically, always last)
plugins.push(visualizer(...));
```

### IN-03: `stats.html` visualizer output written to CWD, not `dist/`

**File:** `apps/figma-plugin/vite.config.ui.ts:22`

**Issue:** The visualizer `filename` is `"stats.html"` (a relative path), which resolves to the process CWD at build time — typically the repo root or `apps/figma-plugin/`. This means `stats.html` is written to a source directory and may be accidentally committed. `build.emptyOutDir` is `false`, so it will not be cleaned up by Vite.

**Suggestion:** Write it into the dist directory and add it to `.gitignore`:

```typescript
visualizer({
  open: true,
  gzipSize: true,
  template: "treemap",
  filename: path.resolve(__dirname, "dist/stats.html"),
}),
```

---

_Reviewed: 2026-04-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
