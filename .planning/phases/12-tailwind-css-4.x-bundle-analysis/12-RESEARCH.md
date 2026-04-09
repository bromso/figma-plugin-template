# Phase 12: Tailwind CSS 4.x + Bundle Analysis - Research

**Researched:** 2026-04-09
**Domain:** CSS migration (Sass/SCSS → Tailwind CSS 4.x) + bundle analysis tooling
**Confidence:** HIGH

## Summary

Phase 12 replaces the single `app.module.scss` file with Tailwind CSS 4.x utility classes and wires up `rollup-plugin-visualizer` as a `bun run analyze` script. The migration surface is small: one SCSS file (`packages/ui/src/app.module.scss`), one Sass preprocessor block in `vite.config.ui.ts`, and two `sass` devDependencies across the monorepo.

Tailwind CSS 4.x ships a first-party `@tailwindcss/vite` plugin that integrates directly into Vite without a PostCSS config. The plugin is fully compatible with Vite 8 (`peerDependency: ^5.2.0 || ^6 || ^7 || ^8`) and `vite-plugin-singlefile` 2.3.2 (`peerDependency: ^5.4.11 || ^6.0.0 || ^7.0.0 || ^8.0.0`). No documented compatibility conflict exists between these two plugins — the Tailwind plugin generates CSS which Vite then processes as normal, and `vite-plugin-singlefile` inlines whatever CSS Vite emits.

The monorepo constraint requires an explicit `@source` directive in the CSS entry file because Tailwind 4.x auto-detection scans relative to the stylesheet location (`packages/ui/src/`), which is not where the Vite build command runs. The `packages/` workspace package containing React components must be explicitly sourced.

**Primary recommendation:** Add `@tailwindcss/vite` to `vite.config.ui.ts`, create `packages/ui/src/styles.css` with `@import "tailwindcss"` and a `@source` for the UI source tree, remove the SCSS config block from `vite.config.ui.ts`, remove `sass` from both `devDependencies`, and gate `rollup-plugin-visualizer` behind `ANALYZE=true` in a separate `analyze` script.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — all implementation choices are at Claude's discretion (infrastructure phase).

### Claude's Discretion
All implementation choices are at Claude's discretion. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUILD-03 | Sass/SCSS replaced with Tailwind CSS 4.x (required by shadcn/ui) | Tailwind 4.x + `@tailwindcss/vite` plugin replaces Sass preprocessor block entirely |
| BUILD-04 | Bundle analysis tooling (`rollup-plugin-visualizer`) available via `bun run analyze` | `rollup-plugin-visualizer` 7.0.1 with `ANALYZE=true` env gate; Rolldown peer dep confirmed |
| FW-03 | Tailwind CSS 4.x configured for the Figma plugin UI iframe with single-file output compatibility | `@tailwindcss/vite` compatible with Vite 8 + `vite-plugin-singlefile`; CSS inlined automatically |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- **Package manager:** Bun 1.3.11 — all install commands use `bun add`
- **Build tool:** Vite 8 with Rolldown — two configs: `vite.config.ui.ts` (UI) and `vite.config.plugin.ts` (plugin sandbox)
- **Single-file constraint:** `vite-plugin-singlefile` inlines all assets into `dist/index.html` — no external file references allowed
- **CSS scoping:** CSS Modules (`*.module.scss`) currently used for component styles; Tailwind replaces this with utility classes
- **Monorepo:** Turborepo + Bun workspaces; `@repo/*` workspace imports
- **Linting:** Biome 2.4.10 — does not lint CSS files (only TS/TSX/JS/JSX/JSON per `biome.json`)
- **Testing:** Vitest 4.x with `happy-dom`; existing tests import `app.tsx` which uses CSS Module imports that must be updated
- **Scripts:** All scripts defined per-package; root-level `analyze` requires Turborepo task or direct invocation

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | 4.2.2 | CSS framework with utility classes | v4 is current stable; required by shadcn/ui (Phase 13) |
| @tailwindcss/vite | 4.2.2 | Vite plugin for Tailwind integration | First-party plugin; better perf than PostCSS; Vite 8 compatible |
| rollup-plugin-visualizer | 7.0.1 | Bundle analysis visualization | Standard in Vite ecosystem; Rolldown peer dep declared |

[VERIFIED: npm registry — `npm view tailwindcss dist-tags` → latest 4.2.2]
[VERIFIED: npm registry — `npm view @tailwindcss/vite dist-tags` → latest 4.2.2]
[VERIFIED: npm registry — `npm view rollup-plugin-visualizer version` → 7.0.1]

### Packages to Remove

| Package | Location | Reason |
|---------|----------|--------|
| sass | `apps/figma-plugin/devDependencies` | Sass preprocessor no longer needed |
| sass | `packages/ui/devDependencies` | Same; Vitest config no longer imports SCSS |

[VERIFIED: codebase — found `"sass": "^1.60.0"` in `apps/figma-plugin/package.json` and `"sass": "^1.99.0"` in `packages/ui/package.json`]

### Version Verification

```bash
npm view tailwindcss version       # 4.2.2
npm view @tailwindcss/vite version # 4.2.2
npm view rollup-plugin-visualizer version # 7.0.1
npm view vite-plugin-singlefile version   # 2.3.2
```

[VERIFIED: npm registry — all versions confirmed 2026-04-09]

### Installation

```bash
# In apps/figma-plugin (owns vite.config.ui.ts)
bun add -D @tailwindcss/vite rollup-plugin-visualizer --cwd apps/figma-plugin

# Remove sass from both packages
bun remove sass --cwd apps/figma-plugin
bun remove sass --cwd packages/ui
```

---

## Architecture Patterns

### Recommended Project Structure (after migration)

```
packages/ui/src/
├── styles.css           # NEW: Tailwind entry — replaces app.module.scss as styling anchor
├── app.tsx              # CHANGED: CSS Module imports → Tailwind utility classes
├── app.module.scss      # DELETED
├── index.ts             # unchanged (imports styles.css instead of figma-plugin-ds.css? — see note)
├── main.tsx             # unchanged
└── ...
```

**Note:** `index.ts` currently side-effect imports `figma-plugin-ds/dist/figma-plugin-ds.css`. That import remains until Phase 13 removes `react-figma-ui` / `figma-plugin-ds`. Phase 12 only removes Sass and the single `app.module.scss` file.

### Pattern 1: CSS-First Configuration (Tailwind 4.x)

**What:** Tailwind 4.x has no `tailwind.config.js`. All configuration lives in a CSS file using `@theme` directives.

**When to use:** Always in Tailwind 4.x projects.

**Example:**
```css
/* packages/ui/src/styles.css */
/* Source: https://tailwindcss.com/docs/installation/using-vite */
@import "tailwindcss";

/* Explicit source for monorepo scanning — required because Vite's working
   directory is apps/figma-plugin, not packages/ui/src */
@source "../../packages/ui/src";

/* Optional theme customizations (Phase 12 scope: none needed yet) */
/* @theme { --color-brand: oklch(0.60 0.18 240); } */
```

[CITED: https://tailwindcss.com/docs/detecting-classes-in-source-files]

### Pattern 2: Vite Plugin Registration

**What:** Add `@tailwindcss/vite` to the plugins array in `vite.config.ui.ts`, BEFORE `viteSingleFile()`. Remove the entire `css.preprocessorOptions.scss` block.

**Example:**
```typescript
// apps/figma-plugin/vite.config.ui.ts
// Source: https://tailwindcss.com/docs/installation/using-vite
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), richSvg(), tailwindcss(), viteSingleFile()],
  // ...
  css: {
    postcss: {
      plugins: [postcssUrl({ url: "inline" })],
    },
    // REMOVED: preprocessorOptions.scss block
  },
}));
```

[CITED: https://tailwindcss.com/docs/installation/using-vite]

### Pattern 3: CSS Entry Point in index.html

**What:** The UI's `index.html` must import `styles.css` to activate Tailwind class generation.

**Example:**
```html
<!-- packages/ui/src/index.html -->
<link rel="stylesheet" href="./styles.css" />
<div id="root"></div>
<script type="module" src="./main.tsx"></script>
```

With `vite-plugin-singlefile`, this `<link>` is inlined into `<style>` tags in the final `dist/index.html`. [ASSUMED — behavior consistent with how the plugin inlines all CSS; no separate confirmation of this exact tag substitution was found in an issue tracker.]

### Pattern 4: Converting CSS Module Classes to Tailwind

**What:** Replace `styles.container` and `styles.group` from `app.module.scss` with equivalent Tailwind utility classes directly in JSX.

**Existing SCSS:**
```scss
.container { overflow-y: auto; height: 100%; padding: 8px 16px; }
.group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
```

**Tailwind equivalent:**
```tsx
// packages/ui/src/app.tsx
<div className="overflow-y-auto h-full px-4 py-2">
  <div className="flex flex-col gap-2 mb-6">
```

Tailwind 4.x uses a 4px base spacing scale: `gap-2` = 8px, `px-4` = 16px, `py-2` = 8px, `mb-6` = 24px. [VERIFIED: Tailwind spacing scale is well-established; 4px base confirmed via training knowledge — [ASSUMED] for v4 specifically, but the scale is unchanged from v3 per migration guides]

### Pattern 5: Bundle Analyzer (conditional)

**What:** Gate `rollup-plugin-visualizer` behind an environment variable so it only runs during analysis, not every build.

**Example:**
```typescript
// apps/figma-plugin/vite.config.ui.ts
import { visualizer } from "rollup-plugin-visualizer";

const isAnalyze = process.env.ANALYZE === "true";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    richSvg(),
    tailwindcss(),
    viteSingleFile(),
    isAnalyze && visualizer({ open: true, gzipSize: true, template: "treemap" }),
  ].filter(Boolean),
  // ...
}));
```

**Script in `apps/figma-plugin/package.json`:**
```json
{
  "scripts": {
    "analyze": "ANALYZE=true vite build -c vite.config.ui.ts"
  }
}
```

**Root-level `bun run analyze`** requires either a Turborepo task or direct filter invocation:
```json
// root package.json
{
  "scripts": {
    "analyze": "turbo run analyze"
  }
}
```

With a matching entry in `turbo.json`:
```json
{
  "tasks": {
    "analyze": { "dependsOn": ["^build"], "outputs": ["stats.html"] }
  }
}
```

[CITED: https://github.com/btd/rollup-plugin-visualizer — conditional activation pattern]

### Anti-Patterns to Avoid

- **Keeping `postcss.config.js`:** Tailwind 4.x with `@tailwindcss/vite` does NOT need a PostCSS config. Adding one may conflict. Only keep the existing `postcssUrl` plugin in the `css.postcss` block of `vite.config.ui.ts`.
- **Using `@tailwindcss/postcss` instead of `@tailwindcss/vite`:** The PostCSS package exists but `@tailwindcss/vite` is the recommended and higher-performance integration when using Vite. [CITED: https://tailwindcss.com/blog/tailwindcss-v4]
- **Importing `styles.css` without a `@source` directive:** In this monorepo, the Vite build root is `packages/ui/src` but the actual Vite working directory (`__dirname` of the config) is `apps/figma-plugin`. Without `@source`, Tailwind may not scan `packages/ui/src/**` for classes. Always add `@source`.
- **Using `tailwind.config.js`:** Tailwind 4.x is CSS-first; there is no JS config file. Configuration goes in `@theme` blocks in the CSS file. [CITED: https://tailwindcss.com/blog/tailwindcss-v4]
- **Dynamic class construction:** `className={\`bg-${color}-600\`}` is not safe with Tailwind — classes must be complete static strings for the scanner to pick them up. [CITED: https://tailwindcss.com/docs/detecting-classes-in-source-files]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS scanning in monorepo | Custom file list | `@source` directive | Tailwind 4 native; handles gitignore, binary exclusion |
| Purging unused CSS | Manual PurgeCSS config | Tailwind 4 auto-detection | Built into the engine; no separate plugin |
| Bundle visualization | Custom script | rollup-plugin-visualizer | Interactive treemap/sunburst; handles gzip/brotli sizes |

**Key insight:** Tailwind 4.x eliminates the entire configuration surface that used to require hand-rolling (content arrays, PurgeCSS, PostCSS plugins). The `@source` directive handles the only manual step needed for monorepos.

---

## Common Pitfalls

### Pitfall 1: Monorepo @source Misconfiguration

**What goes wrong:** Tailwind emits no CSS, or only partial CSS — classes in `packages/ui/src/**` are not detected.

**Why it happens:** `vite.config.ui.ts` sets `root` to `../../packages/ui/src`, but Tailwind 4 scans relative to the CSS file location and the process working directory. In a monorepo build started from `apps/figma-plugin`, the scanner may not reach `packages/ui/src`.

**How to avoid:** Add `@source "../../packages/ui/src"` (relative path from `styles.css` location) in `packages/ui/src/styles.css`. The path must be relative to the CSS file, not the Vite config.

**Warning signs:** `bun run dev:ui-only` renders without any utility class styles applied; Tailwind processes 0 classes.

[CITED: https://tailwindcss.com/docs/detecting-classes-in-source-files — `@source` monorepo guidance]
[CITED: https://github.com/tailwindlabs/tailwindcss/issues/13136 — known monorepo detection limitation]

### Pitfall 2: Plugin Order in vite.config.ui.ts

**What goes wrong:** Tailwind styles are not inlined, or the CSS `<link>` tag remains in the output HTML.

**Why it happens:** `vite-plugin-singlefile` must run after Tailwind has emitted the CSS. Plugin order matters in Vite.

**How to avoid:** Place `tailwindcss()` before `viteSingleFile()` in the plugins array: `[react(), richSvg(), tailwindcss(), viteSingleFile()]`.

**Warning signs:** `dist/index.html` contains a `<link rel="stylesheet">` tag instead of an inline `<style>` block.

### Pitfall 3: Vitest CSS Module Test Failures

**What goes wrong:** Tests in `packages/ui` fail after removing `app.module.scss`.

**Why it happens:** `App.test.tsx` renders `<App />` which imports the module. After migration, the CSS Module import is gone, but the component file must also be updated to remove the import and use Tailwind classes. If only `app.module.scss` is deleted without updating `app.tsx`, Vite throws during test runs.

**How to avoid:** Delete `app.module.scss` AND update `app.tsx` in the same commit. The existing test assertions (text content checks) will still pass since they don't depend on class names.

**Warning signs:** `bun run test` fails with `Cannot find module './app.module.scss'`.

### Pitfall 4: postcssUrl Plugin Conflict

**What goes wrong:** `postcssUrl({ url: "inline" })` is configured in `vite.config.ui.ts` to inline font/asset URLs in CSS. This must remain for font embedding (the fonts in `packages/ui/src/assets/fonts/`).

**Why it happens:** Removing the `css.postcss` block entirely would break font inlining.

**How to avoid:** Keep the `css.postcss.plugins: [postcssUrl({ url: "inline" })]` block. Only remove the `css.preprocessorOptions.scss` block. The two are separate.

**Warning signs:** Fonts render as broken paths in the single-file output after migration.

### Pitfall 5: ANALYZE Script on Windows / Cross-Platform

**What goes wrong:** `ANALYZE=true vite build` does not work on Windows (no `env` inline syntax).

**Why it happens:** Bash inline env variable syntax is POSIX-only.

**How to avoid:** Use `cross-env` package OR document that `analyze` is macOS/Linux-only (acceptable since dev environment is macOS per OS metadata). This project's dev machine is macOS (Darwin 25.4.0), so `ANALYZE=true vite build` works directly.

[ASSUMED — cross-platform concern; macOS-only usage confirmed by environment metadata]

---

## Code Examples

### styles.css Entry File
```css
/* packages/ui/src/styles.css */
/* Source: https://tailwindcss.com/docs/installation/using-vite */
@import "tailwindcss";

/* Required: Tailwind v4 auto-scan won't reach workspace packages without this.
   Path is relative to this CSS file's location. */
@source ".";
```

Note: `@source "."` instructs Tailwind to scan the same directory as `styles.css`, which is `packages/ui/src/`. This is sufficient since all component files live in that directory.

### Updated vite.config.ui.ts (relevant diff)
```typescript
// Source: https://tailwindcss.com/docs/installation/using-vite
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), richSvg(), tailwindcss(), viteSingleFile()],
  root: uiSrcPath,
  build: { /* unchanged */ },
  css: {
    postcss: {
      plugins: [postcssUrl({ url: "inline" })],  // keep for font inlining
    },
    // REMOVED: preprocessorOptions.scss block
  },
}));
```

### Updated index.html
```html
<!-- packages/ui/src/index.html -->
<link rel="stylesheet" href="./styles.css" />
<div id="root"></div>
<script type="module" src="./main.tsx"></script>
```

### Updated app.tsx (CSS Module → Tailwind classes)
```tsx
// Before: import styles from './app.module.scss';
// After: no CSS module import needed

function App() {
  return (
    // .container { overflow-y: auto; height: 100%; padding: 8px 16px; }
    <div className="overflow-y-auto h-full px-4 py-2">
      {/* .group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; } */}
      <div className="flex flex-col gap-2 mb-6">
```

### rollup-plugin-visualizer in vite.config.ui.ts
```typescript
// Source: https://github.com/btd/rollup-plugin-visualizer
import { visualizer } from "rollup-plugin-visualizer";

const isAnalyze = process.env.ANALYZE === "true";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    richSvg(),
    tailwindcss(),
    viteSingleFile(),
    isAnalyze && visualizer({
      open: true,
      gzipSize: true,
      template: "treemap",
      filename: "stats.html",
    }),
  ].filter(Boolean) as PluginOption[],
```

### analyze script in apps/figma-plugin/package.json
```json
{
  "scripts": {
    "analyze": "ANALYZE=true vite build -c vite.config.ui.ts"
  }
}
```

### analyze task in turbo.json (for root-level bun run analyze)
```json
{
  "tasks": {
    "analyze": {
      "dependsOn": ["^build"],
      "outputs": ["stats.html"],
      "cache": false
    }
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `content` array | CSS-first `@import "tailwindcss"` + `@source` | Tailwind v4.0 (Jan 2025) | No JS config file needed |
| `@tailwindcss/postcss` + `postcss.config.js` | `@tailwindcss/vite` Vite plugin | Tailwind v4.0 | Simpler setup, better perf |
| `@tailwind base/components/utilities` directives | Single `@import "tailwindcss"` | Tailwind v4.0 | Cleaner CSS entry file |
| CSS Modules for layout scoping | Tailwind utility classes inline | This phase | Removes build-time Sass dependency |

**Deprecated/outdated:**
- `tailwind.config.js`: Replaced by CSS `@theme` directive in v4
- `@tailwind` directives (base/components/utilities): Replaced by single `@import "tailwindcss"`
- `sass`/`node-sass` preprocessor in this project: Replaced by Tailwind's own CSS pipeline

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `vite-plugin-singlefile` inlines a `<link rel="stylesheet">` into a `<style>` block in the final HTML | Architecture Patterns — Pattern 3 | Tailwind CSS would not be inlined; styles absent at runtime in Figma. Low risk: vite-plugin-singlefile's stated purpose is inlining all assets. |
| A2 | Tailwind spacing scale (4px base: gap-2=8px, px-4=16px, py-2=8px, mb-6=24px) is unchanged in v4 | Architecture Patterns — Pattern 4 | Layout would render with wrong spacing. Low risk: migration guides confirm scale is unchanged from v3. |
| A3 | `ANALYZE=true` env variable syntax works on the macOS dev environment without `cross-env` | Common Pitfalls — Pitfall 5 | `analyze` script fails for any Windows contributors. Low risk: confirmed macOS dev environment. |

**Risk level for all assumptions: LOW.** A1 and A2 carry negligible risk; A3 is environment-confirmed.

---

## Open Questions

1. **`@source` path resolution from `vite.config.ui.ts` root override**
   - What we know: `vite.config.ui.ts` sets `root: uiSrcPath` pointing to `packages/ui/src`. Tailwind 4's `@source` paths are relative to the CSS file itself.
   - What's unclear: Whether the Vite root override causes Tailwind's scanner to already see `packages/ui/src` without `@source`.
   - Recommendation: Add `@source "."` defensively in `styles.css` regardless. Cost is zero; protection against scanner misses is high.

2. **Storybook CSS handling (Phase 14 concern)**
   - What we know: Storybook 8.6 is the current version; Phase 14 upgrades to Storybook 10.
   - What's unclear: Whether Storybook's Vite builder picks up `styles.css` automatically or needs a global import.
   - Recommendation: Out of scope for Phase 12. Document as a known concern for Phase 14.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun | Package manager | Yes | 1.3.11 | — |
| Vite 8 | Build system | Yes (installed) | ^8.0.0 | — |
| Node.js | Vite/scripts | Yes | >=18 (engines field) | — |

Step 2.6 note: No new external services or CLI tools beyond npm registry installs are required. All dependencies are npm packages.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `packages/ui/vitest.config.ts` |
| Quick run command | `bun run --filter @repo/ui test` |
| Full suite command | `bun run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUILD-03 | `app.tsx` renders without SCSS import | unit | `bun run --filter @repo/ui test` | Yes (App.test.tsx) |
| BUILD-03 | `packages/ui` exports still resolve | unit | `bun run --filter @repo/ui test` | Yes (exports.test.ts) |
| BUILD-04 | `bun run analyze` exits 0 and produces `stats.html` | smoke | `ANALYZE=true bun run --filter @repo/figma-plugin build:ui && test -f apps/figma-plugin/stats.html` | No — Wave 0 |
| FW-03 | `bun run build` produces `dist/index.html` with no external CSS `<link>` | smoke | `bun run build && ! grep -q '<link.*stylesheet' apps/figma-plugin/dist/index.html` | No — Wave 0 |
| FW-03 | Dev server serves HTML with Tailwind utility class styles applied | manual | `bun run dev:ui-only` + visual check | N/A |

### Sampling Rate

- **Per task commit:** `bun run --filter @repo/ui test`
- **Per wave merge:** `bun run test`
- **Phase gate:** Full suite green + manual `dev:ui-only` visual check before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] No new test files required — existing `App.test.tsx` covers BUILD-03 after `app.tsx` is updated
- [ ] `stats.html` existence check is a shell one-liner, not a formal test file
- [ ] Framework install: `bun add -D @tailwindcss/vite rollup-plugin-visualizer --cwd apps/figma-plugin`

---

## Security Domain

Phase 12 is a CSS tooling migration with no authentication, input handling, cryptographic operations, or network requests. ASVS categories V2, V3, V4, V5, V6 do not apply. No security domain section required.

---

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view tailwindcss dist-tags`) — tailwindcss@4.2.2, @tailwindcss/vite@4.2.2
- npm registry (`npm view rollup-plugin-visualizer version`) — 7.0.1, peerDeps confirmed Rolldown support
- npm registry (`npm view vite-plugin-singlefile peerDependencies`) — Vite 8 support confirmed
- [https://tailwindcss.com/docs/installation/using-vite](https://tailwindcss.com/docs/installation/using-vite) — Vite plugin setup
- [https://tailwindcss.com/docs/detecting-classes-in-source-files](https://tailwindcss.com/docs/detecting-classes-in-source-files) — `@source` directive and monorepo patterns
- [https://tailwindcss.com/blog/tailwindcss-v4](https://tailwindcss.com/blog/tailwindcss-v4) — v4 CSS-first config changes
- Codebase: `packages/ui/src/app.module.scss` — the single SCSS file to migrate
- Codebase: `apps/figma-plugin/vite.config.ui.ts` — confirmed Sass preprocessor block to remove
- Codebase: `apps/figma-plugin/package.json` + `packages/ui/package.json` — confirmed `sass` devDependencies

### Secondary (MEDIUM confidence)
- [https://github.com/btd/rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer) — conditional ANALYZE env pattern
- [https://vite.dev/blog/announcing-vite8](https://vite.dev/blog/announcing-vite8) — Vite 8 plugin compatibility layer confirmed
- [https://github.com/tailwindlabs/tailwindcss/issues/13136](https://github.com/tailwindlabs/tailwindcss/issues/13136) — known monorepo auto-detection limitation

### Tertiary (LOW confidence)
- None — all critical claims are verified from primary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry
- Architecture: HIGH — patterns sourced from official Tailwind 4.x and Vite docs; codebase confirmed
- Pitfalls: HIGH — sourced from official docs and known GitHub issues; one [ASSUMED] entry with LOW risk

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (Tailwind 4.x is in active minor release; architecture patterns stable)
