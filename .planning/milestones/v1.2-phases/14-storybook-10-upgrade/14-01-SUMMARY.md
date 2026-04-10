---
phase: 14-storybook-10-upgrade
plan: 01
subsystem: storybook
tags: [storybook, upgrade, esm, addon-docs]
dependency_graph:
  requires: []
  provides: [storybook-10-runtime]
  affects: [apps/storybook]
tech_stack:
  added: [storybook@10.3.5, "@storybook/react@10.3.5", "@storybook/react-vite@10.3.5", "@storybook/addon-docs@10.3.5"]
  patterns: [esm-config, import.meta.url, path-alias-vite]
key_files:
  created: []
  modified:
    - apps/storybook/package.json
    - apps/storybook/.storybook/main.ts
    - apps/storybook/.storybook/preview.ts
decisions:
  - Use import.meta.url + fileURLToPath for ESM-compatible __dirname in main.ts
  - Add @/ alias in viteFinal pointing to packages/ui/src (required for shadcn/ui components)
  - Change Preview type import from @storybook/react-vite to storybook (v10 no longer re-exports it)
metrics:
  duration_minutes: 4
  completed_date: "2026-04-10"
  tasks_completed: 2
  files_modified: 3
---

# Phase 14 Plan 01: Storybook 10 Upgrade — Package Install & Config Summary

**One-liner:** Storybook 8.6.18 upgraded to 10.3.5 with ESM-only config, addon-docs replacing addon-essentials, and @/ path alias wired for packages/ui/src.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Upgrade Storybook packages to 10.3.5 | 2ba627f | apps/storybook/package.json, bun.lock |
| 2 | Update Storybook config files for v10 | 0c53060 | apps/storybook/.storybook/main.ts, apps/storybook/.storybook/preview.ts |

## Verification

- `storybook`: `10.3.5` in package.json
- `@storybook/react`: `10.3.5` in package.json
- `@storybook/react-vite`: `10.3.5` in package.json
- `@storybook/addon-docs`: `10.3.5` in package.json
- `@storybook/addon-essentials`: not present in package.json
- `addon-docs` in main.ts addons array
- No `require()` in either config file (pure ESM)
- `build-storybook` errors are story-level (Disclosure not exported) — config initializes correctly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @/ path alias for packages/ui/src in viteFinal**
- **Found during:** Task 2 build verification
- **Issue:** `Rollup failed to resolve import "@/lib/utils"` from `packages/ui/src/components/figma/type.tsx`. The shadcn/ui components use `@/` internal imports but Storybook's Vite config had no alias for it.
- **Fix:** Added `resolve.alias` in `viteFinal` mapping `@` to `path.resolve(__dirname, '../../../packages/ui/src')`
- **Files modified:** apps/storybook/.storybook/main.ts
- **Commit:** 0c53060

**2. [Rule 3 - Blocking] Used ESM-compatible __dirname via fileURLToPath(import.meta.url)**
- **Found during:** Task 2 build verification (second run)
- **Issue:** `ReferenceError: __dirname is not defined` — Storybook 10 config files run as pure ESM where `__dirname` is unavailable.
- **Fix:** Added `import { fileURLToPath } from 'node:url'` and declared `const __dirname = path.dirname(fileURLToPath(import.meta.url))`
- **Files modified:** apps/storybook/.storybook/main.ts
- **Commit:** 0c53060

**3. [Rule 1 - Bug] Changed Preview type import source**
- **Found during:** Task 2 (proactive check of v10 API)
- **Issue:** `@storybook/react-vite` v10 no longer exports the `Preview` type — its `dist/index.d.ts` only exports `definePreview`.
- **Fix:** Changed `import type { Preview } from '@storybook/react-vite'` to `import type { Preview } from 'storybook'`
- **Files modified:** apps/storybook/.storybook/preview.ts
- **Commit:** 0c53060

## Known Stubs

None — this plan only upgrades packages and config, no UI rendering involved.

## Threat Flags

None — dev dependency upgrade only, no new network endpoints or auth paths introduced.

## Self-Check: PASSED
