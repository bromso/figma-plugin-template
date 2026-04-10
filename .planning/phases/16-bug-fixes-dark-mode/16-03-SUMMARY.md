---
phase: 16-bug-fixes-dark-mode
plan: 03
subsystem: packages/ui
tags: [bug-fix, barrel-export, alert, shadcn]
requirements: [BUG-03]
dependency_graph:
  requires: []
  provides:
    - "`AlertAction` is importable from `@repo/ui`"
  affects:
    - "Any consumer of `@repo/ui` that needs the Alert action slot"
tech_stack:
  added: []
  patterns:
    - "JIT source-only package barrel re-export"
key_files:
  created: []
  modified:
    - "packages/ui/src/index.ts"
decisions:
  - "Verification substituted: @repo/ui has no build script (JIT source-only per CLAUDE.md). Ran `bun run build` at repo root, which builds `@repo/figma-plugin` against `@repo/ui` sources — proves barrel resolves correctly. Also ran `bun run --filter @repo/ui test` (8/8 passed)."
metrics:
  duration: "~3 minutes"
  completed: 2026-04-10
  tasks: 1
  files: 1
commits:
  - hash: "94a53a1"
    message: "fix(16-03): add AlertAction to @repo/ui barrel re-export"
---

# Phase 16 Plan 03: Alert Action Barrel Re-export Summary

One-liner: Added `AlertAction` to the `@repo/ui` barrel export in `packages/ui/src/index.ts` so consumers can `import { AlertAction } from '@repo/ui'`.

## Objective Recap

`packages/ui/src/components/ui/alert.tsx` already defined and locally exported `AlertAction` (line 69). The only gap was the barrel in `packages/ui/src/index.ts` (line 14) which listed `Alert, AlertDescription, AlertTitle` but omitted `AlertAction`. Plan fixed exactly that gap and nothing else.

## Change

Single edit to `packages/ui/src/index.ts`, line 14:

Before:
```typescript
export { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
```

After:
```typescript
export { Alert, AlertAction, AlertDescription, AlertTitle } from "./components/ui/alert";
```

Alphabetical order preserved: `Alert`, `AlertAction`, `AlertDescription`, `AlertTitle`.

## Files NOT Touched

- `packages/ui/src/components/ui/alert.tsx` — already exports `AlertAction` on line 69; plan explicitly forbade modification. Verified unchanged post-edit.

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| Barrel contains AlertAction | `rg -nF 'AlertAction' packages/ui/src/index.ts` | 1 match on line 14 |
| Exact export list | `rg -nF 'export { Alert, AlertAction, AlertDescription, AlertTitle }' packages/ui/src/index.ts` | 1 match |
| alert.tsx unchanged | `rg -nF 'AlertAction' packages/ui/src/components/ui/alert.tsx` | 2 matches (function def L63 + export list L69) — unchanged from baseline |
| UI package tests | `bun run --filter @repo/ui test` | 8/8 passed, exit 0 |
| Full production build | `bun run build` | 1/1 tasks successful, exit 0, 321ms UI + 15ms plugin |

Maps to 16-VALIDATION.md row 16-03-01.

## Deviations from Plan

### [Rule 3 - Blocking] Substituted verification command for JIT source-only package

- **Found during:** Task 1 verification
- **Issue:** The plan's automated verification `bun run --filter @repo/ui build` fails with `error: No packages matched the filter`. Root cause: `@repo/ui` has no `build` script in `packages/ui/package.json` (it is a JIT source-only package per `.claude/CLAUDE.md`: "Packages are JIT source-only — they export raw TypeScript (no build step)"). The filter returns no matches because no package in scope defines a `build` script named for `@repo/ui` the way turbo expects.
- **Fix:** Ran the repo-wide `bun run build`, which builds `@repo/figma-plugin` against the `@repo/ui` source barrel. A successful build transitively proves the barrel re-export is valid and consumable. Additionally ran `bun run --filter @repo/ui test` to exercise the package-scoped test harness.
- **Files modified:** None (verification only)
- **Commit:** N/A

### [Rule 3 - Blocking] Worktree dependency install

- **Found during:** Task 1 verification
- **Issue:** Worktree had no `node_modules/` directory; `vitest` binary not found.
- **Fix:** Ran `bun install` in the worktree before running tests and build.
- **Files modified:** None
- **Commit:** N/A

### [Rule 3 - Blocking] Worktree was out of sync with HEAD

- **Found during:** Pre-execution worktree base check
- **Issue:** Initial `git log` showed working directory at an old commit state (missing `.planning/phases/16-bug-fixes-dark-mode/`, missing `packages/ui/src/components/ui/alert.tsx`, etc.). HEAD was actually at `1ee75fb` but the working directory had not been checked out to match.
- **Fix:** `git reset --hard HEAD` to synchronize the working directory with the correct base commit `1ee75fbfb0374592683c6afebf1847cecea4f159`. No source edits lost — worktree was freshly created and untouched.
- **Files modified:** None (sync only)
- **Commit:** N/A

## Authentication Gates

None.

## Known Stubs

None. The change wires a real, already-defined component into the public barrel.

## BUG-03 Status

Satisfied. Consumers can now `import { AlertAction } from '@repo/ui'`.

## Must-Haves Verification

- [x] **Truth:** `AlertAction` is importable from `@repo/ui` — barrel contains it on line 14.
- [x] **Artifact:** `packages/ui/src/index.ts` provides `AlertAction` barrel re-export, contains the literal `AlertAction`.
- [x] **Key link:** `packages/ui/src/index.ts` → `packages/ui/src/components/ui/alert.tsx` via named re-export of `AlertAction`, matching pattern `export \{ Alert, AlertAction`.

## Self-Check: PASSED

- FOUND: `.planning/phases/16-bug-fixes-dark-mode/16-03-SUMMARY.md`
- FOUND: `packages/ui/src/index.ts` (modified)
- FOUND: commit `94a53a1`
