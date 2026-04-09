---
phase: 02-package-extraction
plan: "02"
subsystem: infra
tags: [monorepo, vite, typescript, workspace, imports]

# Dependency graph
requires:
  - phase: 02-package-extraction
    plan: "01"
    provides: workspace packages with @repo/ names, JIT exports, bun workspace symlinks
provides:
  - All UI source files physically in packages/ui/src/ with relative imports
  - All plugin source files in apps/figma-plugin/src/plugin/ with @repo/common imports
  - Vite configs in apps/figma-plugin/ with __dirname-based paths pointing to packages/ui/src
  - Zero @common/ or @ui/ path alias imports remaining anywhere
  - TypeScript type-check passing across all packages
affects: [03-vite-migration, 04-tooling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Within-package imports use relative paths (no alias needed inside a package)
    - Cross-package imports use @repo/common/networkSides (workspace import via symlink)
    - Vite root/input/outDir use path.resolve(__dirname, ...) for stability when run from any CWD
    - Explicit named exports in package.json exports field required for TypeScript moduleResolution Bundler

key-files:
  created: []
  modified:
    - packages/ui/src/main.tsx
    - packages/ui/src/app.tsx
    - packages/ui/src/app.network.tsx
    - packages/ui/src/components/Button.tsx
    - apps/figma-plugin/src/plugin/plugin.ts
    - apps/figma-plugin/src/plugin/plugin.network.ts
    - apps/figma-plugin/vite.config.ui.ts
    - apps/figma-plugin/vite.config.plugin.ts
    - apps/figma-plugin/tsconfig.json
    - apps/figma-plugin/package.json
    - packages/common/package.json
  deleted:
    - src/ (entire directory — moved to packages/ui/src/ and apps/figma-plugin/src/plugin/)
    - tsconfig.json (root — replaced by per-package tsconfigs)
    - tsconfig.node.json (root — replaced by apps/figma-plugin/tsconfig.node.json)

key-decisions:
  - "Added explicit ./networkSides export to packages/common/package.json — TypeScript moduleResolution Bundler requires named subpath exports, ./* wildcard alone is not sufficient"
  - "Added monorepo-networker as direct dep of apps/figma-plugin — plugin.ts imports Networker directly, not transitively"
  - "Added paths mapping for monorepo-networker in apps/figma-plugin/tsconfig.json — monorepo-networker package.json exports block lacks types condition, causing TS7016"
  - "Fixed typeRoots in apps/figma-plugin/tsconfig.json to ./node_modules/@figma — @figma/plugin-typings is in app-local node_modules, not root"

# Metrics
duration: 15min
completed: 2026-04-09
---

# Phase 02 Plan 02: Package Extraction — Source File Migration Summary

**All source files moved to workspace packages with @repo/common workspace imports; TypeScript type-check passes with zero errors**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-09T09:10:00Z
- **Completed:** 2026-04-09T09:25:00Z
- **Tasks:** 2
- **Files modified:** 11 modified, 3 deleted (27 renamed via git mv)

## Accomplishments

- Moved all UI source files from root src/ui/ to packages/ui/src/ using git mv (history preserved)
- Moved all plugin source files from root src/plugin/ to apps/figma-plugin/src/plugin/
- Moved vite.config.ui.ts, vite.config.plugin.ts, figma.manifest.ts to apps/figma-plugin/
- Deleted root src/ directory (src/common/ was already in packages/common from Plan 01)
- Deleted root tsconfig.json and tsconfig.node.json (replaced by per-package configs)
- Updated all @common/ imports to @repo/common/networkSides workspace imports
- Updated all @ui/ imports within packages/ui/ to relative paths (./app.network, ./components/Button, etc.)
- Updated @plugin/ import in plugin.ts to relative ./plugin.network
- Updated vite.config.ui.ts root/input/outDir to use path.resolve(__dirname, "../../packages/ui/src")
- Updated vite.config.plugin.ts to use __dirname-based paths, removed @common alias, kept @plugin
- TypeScript type-check passes: `bun run types` exits 0 in apps/figma-plugin

## Task Commits

Each task was committed atomically:

1. **Task 1: Move UI and plugin source files to package directories** - `117dc32` (feat)
2. **Task 2: Update import paths and Vite configs for workspace resolution** - `424e1a6` (feat)

## Files Created/Modified

### Moved (git mv — history preserved)
- `src/ui/*` → `packages/ui/src/` (main.tsx, app.tsx, app.network.tsx, index.html, vite-env.d.ts)
- `src/ui/components/` → `packages/ui/src/components/` (Button.tsx, Button.module.scss)
- `src/ui/utils/` → `packages/ui/src/utils/` (classes.util.ts)
- `src/ui/styles/` → `packages/ui/src/styles/` (main.scss + 7-1 SCSS structure)
- `src/ui/assets/` → `packages/ui/src/assets/` (figma.png, react.svg, vite.svg, fonts/Alkatra.ttf)
- `src/plugin/plugin.ts` → `apps/figma-plugin/src/plugin/plugin.ts`
- `src/plugin/plugin.network.ts` → `apps/figma-plugin/src/plugin/plugin.network.ts`
- `vite.config.ui.ts` → `apps/figma-plugin/vite.config.ui.ts`
- `vite.config.plugin.ts` → `apps/figma-plugin/vite.config.plugin.ts`
- `figma.manifest.ts` → `apps/figma-plugin/figma.manifest.ts`

### Deleted
- `src/` (entire directory including src/common/networkSides.ts)
- `tsconfig.json` (root)
- `tsconfig.node.json` (root)

### Modified
- `packages/ui/src/main.tsx` — @common/ → @repo/common/, @ui/app.network → ./app.network
- `packages/ui/src/app.tsx` — all @common/ and @ui/ aliases replaced with relative imports
- `packages/ui/src/app.network.tsx` — @common/ → @repo/common/
- `packages/ui/src/components/Button.tsx` — @ui/utils/classes.util → ../utils/classes.util
- `apps/figma-plugin/src/plugin/plugin.ts` — @common/ → @repo/common/, @plugin/ → ./
- `apps/figma-plugin/src/plugin/plugin.network.ts` — @common/ → @repo/common/
- `apps/figma-plugin/vite.config.ui.ts` — root/input/outDir use __dirname paths, resolve.alias removed
- `apps/figma-plugin/vite.config.plugin.ts` — paths use __dirname, @common alias removed
- `apps/figma-plugin/tsconfig.json` — fixed typeRoots for @figma types, added monorepo-networker paths
- `apps/figma-plugin/package.json` — added monorepo-networker as direct dependency
- `packages/common/package.json` — added explicit ./networkSides subpath export

## Decisions Made

1. **Explicit ./networkSides export required** — TypeScript `moduleResolution: Bundler` processes `exports` strictly. The wildcard `./*` → `./src/*` pattern alone failed resolution of `@repo/common/networkSides`. Added `"./networkSides": "./src/networkSides.ts"` explicitly to packages/common/package.json exports.

2. **monorepo-networker as direct dep of apps/figma-plugin** — plugin.ts directly imports `Networker` from monorepo-networker, making it a real direct dependency, not just transitive via @repo/common.

3. **paths workaround for monorepo-networker types** — monorepo-networker's package.json exports block only has `import` and `require` conditions, no `types`. TypeScript with moduleResolution Bundler follows exports strictly and fails with TS7016. Added a `paths` mapping to point directly to `dist/index.d.ts`. This is a known issue with the library.

4. **typeRoots pointing to ./node_modules/@figma** — Bun installs @figma/plugin-typings in the consuming app's local node_modules, not the root. The previous `../../node_modules/@figma` path was wrong.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed typeRoots path in apps/figma-plugin/tsconfig.json**
- **Found during:** Task 2 verification (tsc --noEmit)
- **Issue:** `typeRoots` pointed to `../../node_modules/@figma` (root level) but @figma/plugin-typings is in `apps/figma-plugin/node_modules/@figma/` (app-local). Caused `figma` global not found errors.
- **Fix:** Changed to `./node_modules/@figma` (local app node_modules)
- **Files modified:** `apps/figma-plugin/tsconfig.json`
- **Commit:** `424e1a6`

**2. [Rule 2 - Missing critical functionality] Added explicit networkSides export to packages/common/package.json**
- **Found during:** Task 2 verification (tsc --noEmit)
- **Issue:** TypeScript moduleResolution Bundler requires explicit named subpath exports. The wildcard `./*` pattern resolved `./networkSides` to `./src/networkSides` but TypeScript reported "Export specifier './networkSides' does not exist".
- **Fix:** Added `"./networkSides": "./src/networkSides.ts"` to exports field
- **Files modified:** `packages/common/package.json`
- **Commit:** `424e1a6`

**3. [Rule 1 - Bug] Added monorepo-networker direct dep + paths workaround for broken exports**
- **Found during:** Task 2 verification (tsc --noEmit)
- **Issue:** monorepo-networker's package.json exports block lacks a `types` condition. TypeScript with moduleResolution Bundler strictly follows exports and couldn't find declarations (TS7016). The library is known to have this issue.
- **Fix:** Added monorepo-networker as direct dep of apps/figma-plugin; added `paths` mapping to `dist/index.d.ts` in tsconfig.json
- **Files modified:** `apps/figma-plugin/package.json`, `apps/figma-plugin/tsconfig.json`
- **Commit:** `424e1a6`

## Known Stubs

None — all files are fully wired. The packages/ui/src/index.ts barrel from Plan 01 now points to real files (Button.tsx and classes.util.ts exist in packages/ui/src/).

## Threat Flags

None — pure file migration with no new network endpoints, auth paths, or external surface changes.

## Self-Check: PASSED

All verified below.
