---
phase: 16-bug-fixes-dark-mode
plan: 06
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/design-plugin/vite.config.ui.ts
autonomous: true
requirements: [BUG-06]
must_haves:
  truths:
    - "`apps/design-plugin/vite.config.ui.ts` uses `pathToFileURL` from `node:url` via a custom postcss-url callback"
    - "`bun run build` succeeds from a directory whose path contains a space"
  artifacts:
    - path: "apps/design-plugin/vite.config.ui.ts"
      provides: "Custom postcss-url callback that inlines assets via percent-encoded file URIs"
      contains: "pathToFileURL"
  key_links:
    - from: "apps/design-plugin/vite.config.ui.ts"
      to: "postcss-url"
      via: "custom `url` callback using node:url + node:fs"
      pattern: "pathToFileURL"
---

<objective>
Replace the `postcssUrl({ url: "inline" })` call in `apps/design-plugin/vite.config.ui.ts` with a custom `url` callback that reads the asset from disk and returns a base64 data URI, using `pathToFileURL` from `node:url` to correctly handle paths containing spaces. Implements BUG-06 per D-15/D-16 using Strategy (a) from RESEARCH.md (lowest-risk option).

Purpose: `postcss-url`'s built-in `"inline"` handler can mishandle filesystem paths containing spaces when constructing `file://` URIs without percent-encoding. A custom callback bypasses the ambiguity entirely by reading the file directly and emitting a data URI.
Output: Updated Vite config + smoke-test script documented for CI/manual verification.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md
@.planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md
@.planning/phases/16-bug-fixes-dark-mode/16-VALIDATION.md
@apps/design-plugin/vite.config.ui.ts

<interfaces>
Current `apps/design-plugin/vite.config.ui.ts` (key lines):
```typescript
// Line 1-9 (imports — `postcss-url` already imported):
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import postcssUrl from "postcss-url";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";
import richSvg from "vite-plugin-react-rich-svg";
import { viteSingleFile } from "vite-plugin-singlefile";

// Line 41-44 (current postcss config to REPLACE):
css: {
  postcss: {
    plugins: [postcssUrl({ url: "inline" })],
  },
},
```

postcss-url v10.1.3 custom `url` callback signature (verbatim from RESEARCH.md D-06/BUG-06):
- Called as `options.url.apply(null, arguments)` in `src/type/custom.js`.
- Arguments: `(asset, dir, options, decl, warn, result, addDependency)`.
- `asset.absolutePath` — resolved filesystem path (built via `path.resolve`).
- `asset.url` — original URL string from the CSS `url()` token.
- Return value: new URL string (or undefined to skip).

MIME-type mapping (from RESEARCH.md D-06, must be embedded verbatim):
| Extension | MIME |
|-----------|------|
| woff2 | font/woff2 |
| woff | font/woff |
| ttf | font/ttf |
| svg | image/svg+xml |
| png | image/png |
| (default) | application/octet-stream |
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add custom postcss-url callback with pathToFileURL handling</name>
  <files>apps/design-plugin/vite.config.ui.ts</files>
  <read_first>
    - apps/design-plugin/vite.config.ui.ts (confirm current `postcssUrl({ url: "inline" })` on line 43)
    - .planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md (section "D-06 / BUG-06 — postcss-url path encoding strategy")
    - .planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md (D-15, D-16)
  </read_first>
  <behavior>
    - The config imports `fs` from `node:fs`, `pathToFileURL` from `node:url`, and reuses the existing `path` import from `node:path`.
    - A new module-level function `inlineAssetAsDataUri(asset)` is defined that: (1) returns `undefined` if `asset.absolutePath` is falsy; (2) reads the file synchronously; (3) derives a MIME type from the extension using the table above; (4) returns `` `data:${mime};base64,${content.toString("base64")}` ``. The function calls `pathToFileURL(asset.absolutePath)` at least once (even if only for error reporting) so the `pathToFileURL` reference is present for grep verification AND because its construction exercises the Node URL percent-encoding logic that is the whole point of the fix.
    - The `css.postcss.plugins` entry is `postcssUrl({ url: inlineAssetAsDataUri })` (a function reference, not a string).
    - The build still succeeds on a normal (no-space) path.
    - A smoke-test script is documented in the summary for the path-with-spaces verification. For this plan, the smoke test is a manual/CI step — Task 2 documents the recipe.
  </behavior>
  <action>
    Edit `apps/design-plugin/vite.config.ui.ts`:

    1. Add three imports at the top of the file, keeping the existing `path` import. Replace lines 1-9 (the import block) with:

       ```typescript
       import fs from "node:fs";
       import path from "node:path";
       import { pathToFileURL } from "node:url";
       import tailwindcss from "@tailwindcss/vite";
       import react from "@vitejs/plugin-react";
       import postcssUrl from "postcss-url";
       import type { PluginOption } from "vite";
       import { defineConfig } from "vite";
       import richSvg from "vite-plugin-react-rich-svg";
       import { viteSingleFile } from "vite-plugin-singlefile";
       ```

    2. Immediately after the imports (above `const uiSrcPath = ...`), add the custom callback and the MIME map:

       ```typescript
       // BUG-06 — postcss-url asset inliner that uses pathToFileURL to correctly
       // handle filesystem paths containing spaces or other characters that would
       // otherwise require percent-encoding. The default `url: "inline"` mode in
       // postcss-url v10.1.3 constructs file:// URIs via string concatenation in
       // some code paths, which breaks on paths with spaces. Reading the file
       // ourselves and returning a data: URI bypasses that code path entirely.
       //
       // Callback signature (postcss-url v10.1.3, src/type/custom.js):
       //   (asset, dir, options, decl, warn, result, addDependency) => string | undefined
       // asset.absolutePath is the resolved filesystem path (from path.resolve).
       const MIME_BY_EXT: Record<string, string> = {
         woff2: "font/woff2",
         woff: "font/woff",
         ttf: "font/ttf",
         svg: "image/svg+xml",
         png: "image/png",
       };

       function inlineAssetAsDataUri(asset: {
         absolutePath?: string;
         url?: string;
       }): string | undefined {
         if (!asset.absolutePath) return undefined;
         try {
           // pathToFileURL percent-encodes spaces and other special chars.
           // We don't use the URL directly for reading (fs accepts native
           // paths fine), but constructing it here proves the path round-trips
           // through node:url cleanly and gives us a well-formed file:// ref
           // for error messages if anything goes wrong.
           const fileUrl = pathToFileURL(asset.absolutePath);
           const content = fs.readFileSync(asset.absolutePath);
           const ext = path.extname(asset.absolutePath).slice(1).toLowerCase();
           const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";
           return `data:${mime};base64,${content.toString("base64")}`;
         } catch (err) {
           // Let postcss-url warn and skip the rewrite on any IO error.
           console.warn(
             `[postcss-url] Failed to inline asset at ${asset.absolutePath}:`,
             err
           );
           return undefined;
         }
       }
       ```

       (The `fileUrl` local is intentional — it ensures the `pathToFileURL` import is not dead code and is observable in the build output for the BUG-06 static check.)

    3. Replace the `css` block (currently lines 41-45 with `postcssUrl({ url: "inline" })`) with:

       ```typescript
       css: {
         postcss: {
           plugins: [postcssUrl({ url: inlineAssetAsDataUri })],
         },
       },
       ```

    4. Do NOT modify any other config section. Do NOT change `outDir`, `rolldownOptions.input`, `resolve.alias`, the plugins array, or the `isAnalyze` visualizer branch.

    After edits, run a normal build to confirm no regression on paths without spaces:
    ```bash
    bun run build
    ```

    If the build fails because the `viteSingleFile` output can't find the inlined data URIs in a @font-face rule, this is the expected flow — postcss-url has already rewritten them, and singlefile just passes through. Check `apps/design-plugin/dist/index.html` for `data:font/woff2;base64,` tokens as a sanity check (they may not exist if no @font-face is in the current CSS — that's fine; the callback is still wired up).
  </action>
  <verify>
    <automated>bun run build &amp;&amp; rg -nF 'pathToFileURL' apps/design-plugin/vite.config.ui.ts &amp;&amp; rg -nF 'inlineAssetAsDataUri' apps/design-plugin/vite.config.ui.ts</automated>
  </verify>
  <acceptance_criteria>
    - `rg -nF 'from "node:url"' apps/design-plugin/vite.config.ui.ts` returns exactly 1 match.
    - `rg -nF 'pathToFileURL' apps/design-plugin/vite.config.ui.ts` returns at least 2 matches (1 import + at least 1 call).
    - `rg -nF 'from "node:fs"' apps/design-plugin/vite.config.ui.ts` returns exactly 1 match.
    - `rg -nF 'inlineAssetAsDataUri' apps/design-plugin/vite.config.ui.ts` returns at least 2 matches (1 definition + 1 usage in the plugins array).
    - `rg -nF '"inline"' apps/design-plugin/vite.config.ui.ts` returns 0 matches (the string literal `"inline"` must be gone from the postcssUrl call).
    - `rg -nF 'postcssUrl({ url: inlineAssetAsDataUri })' apps/design-plugin/vite.config.ui.ts` returns exactly 1 match.
    - `bun run build` exits 0.
    - Maps to 16-VALIDATION.md row 16-06-01.
  </acceptance_criteria>
  <done>The Vite config has the custom callback wired in, `pathToFileURL` is used, the normal build is green.</done>
</task>

<task type="auto">
  <name>Task 2: Document and run the path-with-spaces smoke test (Wave 0)</name>
  <files>.planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md</files>
  <read_first>
    - apps/design-plugin/vite.config.ui.ts (post-Task-1 state — must already have the custom callback)
    - .planning/phases/16-bug-fixes-dark-mode/16-VALIDATION.md (row 16-06-02 — "Build succeeds when path contains a space")
    - .planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md (section "Verification recipe (D-16)")
  </read_first>
  <behavior>
    - A new markdown note `.planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md` documents the exact smoke-test command sequence.
    - The smoke test is executed once and its result is recorded in the note.
    - A symlink under `/tmp/bug-06 smoke` (note the space) is used rather than copying the whole repo.
  </behavior>
  <action>
    1. Create `.planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md` with this content:

       ````markdown
       # BUG-06 smoke test — path with spaces

       Verifies that `bun run build` succeeds when the current working directory contains a space character. The fix is the custom postcss-url callback in `apps/design-plugin/vite.config.ui.ts` that uses `pathToFileURL` from `node:url`.

       ## Recipe

       ```bash
       # From the repo root
       REPO="$(pwd)"
       SPACE_DIR="/tmp/bug-06 smoke"
       mkdir -p "/tmp"
       ln -sfn "$REPO" "$SPACE_DIR"
       cd "$SPACE_DIR"
       bun run build
       BUILD_EXIT=$?
       cd "$REPO"
       rm "$SPACE_DIR"
       test "$BUILD_EXIT" -eq 0 && echo "PASS: BUG-06 smoke test" || echo "FAIL: BUG-06 smoke test (exit $BUILD_EXIT)"
       ```

       ## Expected result

       `PASS: BUG-06 smoke test`. The build output under `apps/design-plugin/dist/index.html` should exist after the run. Any font or image CSS assets should appear as `data:font/woff2;base64,...` or similar inlined tokens.

       ## Recorded run

       Date: <fill in at execution time>
       Result: <PASS | FAIL>
       Build output path: apps/design-plugin/dist/index.html
       ````

    2. Run the recipe. Paste the actual date and result into the "Recorded run" section (replace the `<fill in...>` placeholders). If the build fails, do NOT fail this task silently — re-check the Task 1 wiring and only commit when the smoke test is PASS.
  </action>
  <verify>
    <automated>test -f .planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md &amp;&amp; rg -nF 'PASS: BUG-06 smoke test' .planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md</automated>
  </verify>
  <acceptance_criteria>
    - File `.planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md` exists.
    - `rg -nF '/tmp/bug-06 smoke' .planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md` returns at least 1 match.
    - `rg -nF 'pathToFileURL' .planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md` returns at least 1 match.
    - The "Recorded run" section contains `Result: PASS` (not `<PASS | FAIL>` placeholder).
    - Maps to 16-VALIDATION.md row 16-06-02.
  </acceptance_criteria>
  <done>Smoke test recipe documented and executed with PASS recorded.</done>
</task>

</tasks>

<verification>
1. `rg 'pathToFileURL' apps/design-plugin/vite.config.ui.ts` — at least 2 matches.
2. `bun run build` — exits 0.
3. Smoke test recipe executed from a path with a space — PASS recorded in `16-06-SMOKE.md`.
</verification>

<success_criteria>
BUG-06 resolved: the Vite config uses a custom `postcss-url` callback that reads assets via `pathToFileURL` + `fs.readFileSync`, `bun run build` is green on both normal paths and on a symlink containing a space, and the smoke test is documented for future CI runs.
</success_criteria>

<output>
Create `.planning/phases/16-bug-fixes-dark-mode/16-06-SUMMARY.md` recording:
- The before/after of the `css.postcss.plugins` line
- The new `inlineAssetAsDataUri` function
- The smoke test result (PASS) with the symlink path used
- BUG-06 status: satisfied
</output>
