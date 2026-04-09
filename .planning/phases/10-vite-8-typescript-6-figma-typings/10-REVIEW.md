---
phase: 10-vite-8-typescript-6-figma-typings
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - apps/figma-plugin/postcss-url.d.ts
  - apps/figma-plugin/package.json
  - apps/figma-plugin/vite.config.plugin.ts
  - apps/figma-plugin/vite.config.ui.ts
  - apps/figma-plugin/tsconfig.json
  - apps/figma-plugin/tsconfig.node.json
  - turbo.json
  - package.json
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Phase 10 upgrades the `apps/figma-plugin` build toolchain to Vite 8 (with Rolldown), TypeScript 6, `@figma/plugin-typings` 1.124, and `@types/node` 24. The core changes — `rolldownOptions` in both Vite configs, explicit `types` array in `tsconfig.json`, per-workspace `typeRoots`, and the `postcss-url` ambient shim — are all structurally sound and correctly scoped.

Two warnings were found: a peer dependency mismatch (`vite-plugin-react-rich-svg` declares support only up to Vite 7) and a manual `file://` URL construction in `vite.config.ui.ts` that breaks on paths with spaces. Both are functional risks rather than type or config errors. No critical issues were found.

## Warnings

### WR-01: `vite-plugin-react-rich-svg` peer dependency does not cover Vite 8

**File:** `apps/figma-plugin/package.json:29`
**Issue:** `vite-plugin-react-rich-svg` (installed as 1.3.0) declares `peerDependencies: { "vite": "^5 || ^6 || ^7" }`. Vite 8 is outside the declared range. The build currently works because Bun/npm do not error on peer mismatches by default, but this is an unsupported configuration. A future patch to `vite-plugin-react-rich-svg` could introduce a breaking change against Vite 8's Rolldown internals with no semver warning.
**Fix:** Pin `vite-plugin-react-rich-svg` to a version that explicitly supports Vite 8 once the maintainer publishes one, or add a comment in `package.json` acknowledging the known peer mismatch so it is not silently forgotten:
```jsonc
// vite-plugin-react-rich-svg 1.3.0 declares peerDeps up to vite ^7.
// Verified working on Vite 8.0.8; watch for upstream Vite-8 release.
"vite-plugin-react-rich-svg": "^1.0.0"
```
Alternatively, open or track the upstream issue so the constraint is revisited when 1.4+ is released.

---

### WR-02: Manual `file://` URL construction breaks paths containing spaces

**File:** `apps/figma-plugin/vite.config.ui.ts:37`
**Issue:** The Sass importer constructs a `URL` using template-string interpolation:
```ts
return new URL(`file://${resolved}`);
```
`path.resolve()` returns a native OS path (e.g. `/Users/jonas broms/Sites/...`). The `URL` constructor does not percent-encode the path component, so any space or special character in the resolved path produces a malformed URL and a silent resolution failure in the Sass compiler. Standard Figma plugin development paths rarely contain spaces, but this is a latent bug for any developer whose home directory does.
**Fix:** Use Node's `pathToFileURL` utility, which correctly encodes the path:
```ts
import { pathToFileURL } from "node:url";

findFileUrl(url: string) {
  if (!url.startsWith("@ui/")) return null;
  const resolved = path.resolve(uiSrcPath, url.replace(/^@ui\//, ""));
  return pathToFileURL(resolved);
},
```
`pathToFileURL` is available in all Node 18+ environments and returns a properly encoded `URL` object directly.

---

## Info

### IN-01: `paths` override for `monorepo-networker` in `tsconfig.json` is redundant

**File:** `apps/figma-plugin/tsconfig.json:17`
**Issue:** The `paths` entry hard-codes the internal dist path of `monorepo-networker`:
```json
"paths": {
  "monorepo-networker": ["./node_modules/monorepo-networker/dist/index.d.ts"]
}
```
With `"moduleResolution": "Bundler"`, TypeScript already resolves the package's `"types": "./dist/index.d.ts"` field from `package.json` correctly. The override is a no-op in practice but creates a maintenance burden: if `monorepo-networker` reorganises its output (e.g., moves to `dist/main.d.ts`), this stale path entry would silently take precedence and cause type errors that are hard to diagnose.
**Fix:** Remove the `paths` block. TypeScript's Bundler resolution handles this correctly without it. Verify by running `bun run --filter @repo/figma-plugin types` after removal.

---

### IN-02: `postcss-url.d.ts` ambient shim types all exports as implicit `any`

**File:** `apps/figma-plugin/postcss-url.d.ts:1`
**Issue:** `declare module "postcss-url"` with no body types every import from the module as `any`. This suppresses type errors but also prevents type-checking of the plugin's options object passed in `vite.config.ui.ts:25`:
```ts
postcssUrl({ url: "inline" })
```
If the option key or value is misspelled, TypeScript will not catch it.
**Fix:** Add a minimal typed declaration that covers the API surface actually used:
```ts
declare module "postcss-url" {
  import type { Plugin } from "postcss";

  type UrlInlineOption = { url: "inline" | "copy" | "rebase" | string };

  export default function postcssUrl(options?: UrlInlineOption): Plugin;
}
```
This is a low-priority improvement — the module has no `@types` package and the risk of an undetected misconfiguration here is minor.

---

_Reviewed: 2026-04-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
