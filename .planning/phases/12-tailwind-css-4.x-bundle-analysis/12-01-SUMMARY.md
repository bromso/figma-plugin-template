---
phase: 12-tailwind-css-4.x-bundle-analysis
plan: "01"
subsystem: ui-styling
tags: [tailwind, css, migration, sass-removal, vite-plugin]
dependency_graph:
  requires: []
  provides: [tailwind-css-4x-configured, sass-removed, styles-css-entry]
  affects: [packages/ui, apps/figma-plugin]
tech_stack:
  added:
    - "@tailwindcss/vite@4.2.2 (apps/figma-plugin devDependencies)"
    - "tailwindcss@4.2.2 (packages/ui devDependencies — for CSS @import resolution)"
  patterns:
    - "CSS-first Tailwind 4.x configuration via @import tailwindcss in styles.css"
    - "@source directive for monorepo class scanning"
    - "Tailwind utility classes replacing CSS Module classes inline in JSX"
key_files:
  created:
    - packages/ui/src/styles.css
  modified:
    - apps/figma-plugin/vite.config.ui.ts
    - apps/figma-plugin/package.json
    - packages/ui/src/index.html
    - packages/ui/src/app.tsx
    - packages/ui/package.json
  deleted:
    - packages/ui/src/app.module.scss
decisions:
  - "Install tailwindcss in packages/ui (not just apps/figma-plugin) to allow @import tailwindcss resolution from packages/ui/src/styles.css"
  - "Keep css.postcss.plugins with postcssUrl in vite.config.ui.ts for font inlining — only removed preprocessorOptions.scss block"
metrics:
  duration_minutes: 3
  completed_date: "2026-04-09T22:56:33Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 7
requirements: [BUILD-03, FW-03]
---

# Phase 12 Plan 01: Tailwind CSS 4.x Migration Summary

**One-liner:** Replaced Sass/SCSS with Tailwind CSS 4.x via @tailwindcss/vite plugin, inlining all utility class styles into the single-file Figma plugin output.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Tailwind CSS 4.x, create styles.css, configure Vite plugin and index.html | 6e65473 | apps/figma-plugin/vite.config.ui.ts, packages/ui/src/styles.css, packages/ui/src/index.html, apps/figma-plugin/package.json |
| 2 | Migrate app.tsx to Tailwind classes, delete SCSS, remove sass dependencies | 039efe5 | packages/ui/src/app.tsx, packages/ui/src/app.module.scss (deleted), packages/ui/package.json, apps/figma-plugin/package.json |

## Verification Results

- `bun run test`: 9 tests passed (2 packages: @repo/ui 9 tests, @repo/common 2 tests via cache)
- `bun run build`: succeeded, dist/index.html has CSS inlined (`Inlining: style-dDTqGSnz.css`)
- `grep '<link.*stylesheet' dist/index.html`: 0 matches — no external stylesheet links
- `grep 'overflow-y-auto' packages/ui/src/app.tsx`: confirmed Tailwind classes present
- No `sass` in either package.json
- No `.scss` files remain in packages/ui/src/

## Decisions Made

1. **tailwindcss in packages/ui:** The `@import "tailwindcss"` directive in `packages/ui/src/styles.css` requires `tailwindcss` to be resolvable from that directory. `@tailwindcss/vite` is installed in `apps/figma-plugin` (owns the Vite config) but the resolver walks the filesystem from the CSS file's location. Installing `tailwindcss` directly in `packages/ui` fixes the resolution without any path workarounds.

2. **postcssUrl retained:** The `css.postcss.plugins: [postcssUrl({ url: "inline" })]` block was preserved in `vite.config.ui.ts` to continue inlining font assets. Only the `preprocessorOptions.scss` block was removed.

3. **@source "." directive:** Used `@source "."` (current directory, i.e. `packages/ui/src`) in `styles.css` to ensure Tailwind scans component files for utility classes. Matches the guidance in 12-RESEARCH.md for monorepo setups where the Vite root is `packages/ui/src` but the build runs from `apps/figma-plugin`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added tailwindcss to packages/ui devDependencies**

- **Found during:** Task 2 (bun run build)
- **Issue:** `@import "tailwindcss"` in `packages/ui/src/styles.css` failed with `Can't resolve 'tailwindcss' in packages/ui/src`. The `@tailwindcss/vite` package installed in `apps/figma-plugin` provides the Vite plugin but the CSS resolver still needs `tailwindcss` itself reachable from the CSS file's directory.
- **Fix:** `bun add -D tailwindcss --cwd packages/ui` — installs tailwindcss@4.2.2 alongside the existing `@tailwindcss/vite` peer in `apps/figma-plugin`.
- **Files modified:** `packages/ui/package.json`, `bun.lock`
- **Commit:** 039efe5

## Known Stubs

None — all Tailwind utility classes are fully wired, no placeholder values.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or trust boundaries introduced. Phase 12 is a CSS build-time migration only.

## Self-Check: PASSED

- packages/ui/src/styles.css: EXISTS
- apps/figma-plugin/vite.config.ui.ts: EXISTS, contains tailwindcss(), no preprocessorOptions
- packages/ui/src/index.html: EXISTS, contains styles.css link
- packages/ui/src/app.tsx: EXISTS, contains overflow-y-auto, no app.module.scss import
- packages/ui/src/app.module.scss: DELETED (confirmed)
- Commit 6e65473: EXISTS (git log confirmed)
- Commit 039efe5: EXISTS (git log confirmed)
