---
phase: 12-tailwind-css-4.x-bundle-analysis
plan: "02"
subsystem: build-tooling
tags: [bundle-analysis, rollup-plugin-visualizer, tailwind, vite, turbo]
dependency_graph:
  requires: [tailwind-css-4x-configured]
  provides: [bundle-analysis-tooling, analyze-script]
  affects: [apps/figma-plugin, turbo.json, package.json]
tech_stack:
  added:
    - "rollup-plugin-visualizer@7.0.1 (apps/figma-plugin devDependencies)"
  patterns:
    - "Dynamic import() for ESM-only plugin within Vite config to avoid CJS/ESM conflict"
    - "ANALYZE=true env var gate for conditional visualizer plugin activation"
    - "Turborepo analyze task with cache:false to always regenerate stats.html"
key_files:
  created: []
  modified:
    - apps/figma-plugin/vite.config.ui.ts
    - apps/figma-plugin/package.json
    - turbo.json
    - package.json
    - .gitignore
decisions:
  - "Use dynamic import() for rollup-plugin-visualizer in vite.config.ui.ts — the package is ESM-only and Vite 8 (rolldown) cannot require() it during config bundling"
  - "Add stats.html to .gitignore — it is a dev-only artifact that should not be committed"
metrics:
  duration_minutes: 2
  completed_date: "2026-04-09T22:59:33Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 5
requirements: [BUILD-04]
---

# Phase 12 Plan 02: Bundle Analysis Tooling Summary

**One-liner:** Added rollup-plugin-visualizer behind an ANALYZE=true env gate, wired through Turborepo and root scripts, with a dynamic import workaround for Vite 8 ESM-only constraint.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add rollup-plugin-visualizer with ANALYZE gate and turbo/root scripts | 85c423a | apps/figma-plugin/vite.config.ui.ts, apps/figma-plugin/package.json, turbo.json, package.json, .gitignore, bun.lock |
| 2 | Visual verification of Tailwind CSS migration (checkpoint:human-verify) | — | (auto-approved) |

## Verification Results

- `bun run analyze`: exits 0, produces `apps/figma-plugin/stats.html` treemap report
- Normal `bun run build`: does NOT produce stats.html (confirmed with `test ! -f` check)
- `vite.config.ui.ts` contains `process.env.ANALYZE === "true"` guard and dynamic import
- `turbo.json` analyze task has `"cache": false` — always regenerates on demand
- Root `package.json` contains `"analyze": "turbo run analyze"`

## Decisions Made

1. **Dynamic import for rollup-plugin-visualizer:** rollup-plugin-visualizer@7.0.1 is ESM-only (`"type": "module"`). Vite 8 uses rolldown to bundle config files, and its `externalize-deps` plugin fails when trying to `require()` an ESM-only package. Switching from a static `import { visualizer }` to `const { visualizer } = await import("rollup-plugin-visualizer")` inside an async defineConfig callback resolves this. The defineConfig callback becomes async, which Vite supports natively.

2. **stats.html added to .gitignore:** Bundle analysis output is a dev-only artifact (T-12-03 disposition: accept). It should not be tracked in git — added `stats.html` pattern to root `.gitignore`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ESM-only package conflict with static import in Vite 8 config**

- **Found during:** Task 1 verification (`bun run analyze`)
- **Issue:** `rollup-plugin-visualizer` is ESM-only. Vite 8 bundles vite config files via rolldown, which uses CJS require() for externalized deps. Static `import { visualizer } from "rollup-plugin-visualizer"` caused: `Error: Failed to resolve "rollup-plugin-visualizer". This package is ESM only but it was tried to load by require.`
- **Fix:** Converted `defineConfig(({ mode }) => ...)` to `defineConfig(async ({ mode }) => ...)`, replaced static import with `const { visualizer } = await import("rollup-plugin-visualizer")` inside the conditional `if (isAnalyze)` block.
- **Files modified:** `apps/figma-plugin/vite.config.ui.ts`
- **Commit:** 85c423a

## Known Stubs

None — analyze command is fully wired end-to-end.

## Threat Flags

No new trust boundaries. stats.html is a local dev-only artifact (T-12-03 already registered in plan threat model, disposition: accept).

## Self-Check: PASSED

- apps/figma-plugin/vite.config.ui.ts: EXISTS, contains `isAnalyze`, `await import("rollup-plugin-visualizer")`
- apps/figma-plugin/package.json: EXISTS, contains `"analyze": "ANALYZE=true vite build -c vite.config.ui.ts"`
- turbo.json: EXISTS, contains `"analyze"` task with `"cache": false`
- package.json: EXISTS, contains `"analyze": "turbo run analyze"`
- .gitignore: EXISTS, contains `stats.html`
- Commit 85c423a: EXISTS (git log confirmed)
