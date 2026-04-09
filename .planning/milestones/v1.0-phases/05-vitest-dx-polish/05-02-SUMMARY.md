---
phase: 05-vitest-dx-polish
plan: "02"
subsystem: dx
tags: [vscode, launch-json, vitest, debugging, chrome-debugger]

# Dependency graph
requires:
  - phase: 05-vitest-dx-polish
    provides: [vitest-common, vitest-ui, per-package-vitest-binaries]
provides:
  - vscode-launch-json with three debug configurations (Vitest, Chrome UI, Figma attach)
affects: [developers, onboarding, debugging-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - VS Code launch.json with per-package vitest binary path (not hoisted root)
    - Chrome launch config for Vite dev server UI debugging
    - Chrome attach config for Figma Developer VM debugging on port 9222

key-files:
  created:
    - .vscode/launch.json
  modified:
    - .gitignore

key-decisions:
  - "Vitest program path uses packages/ui/node_modules/.bin/vitest — Bun does not hoist per-package vitest to workspace root"
  - ".gitignore updated to whitelist .vscode/launch.json alongside existing settings.json and tasks.json whitelists"

patterns-established:
  - "Pattern 1: launch.json Vitest config references per-package binary when Bun does not hoist"

requirements-completed: [VSDX-03]

# Metrics
duration: 5min
completed: "2026-04-09"
---

# Phase 5 Plan 2: VS Code launch.json Summary

**VS Code launch.json with Vitest node debugger (per-package binary), Chrome UI debug at localhost:5173, and Figma plugin Chrome attach on port 9222.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-09T11:20:00Z
- **Completed:** 2026-04-09T11:25:02Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Created `.vscode/launch.json` with three debug configurations matching VSDX-03 requirements
- Updated `.gitignore` to whitelist `launch.json` so it is tracked by git alongside existing `.vscode/` whitelist entries
- Confirmed Vitest binary location is per-package (`packages/ui/node_modules/.bin/vitest`), not hoisted to root by Bun — `program` path updated accordingly

## Task Commits

1. **Task 1: Create .vscode/launch.json with three debug configurations** - `e6b174e` (feat)

## Files Created/Modified

- `.vscode/launch.json` — Three VS Code debug configurations: Vitest node debugger, Chrome UI launch, Figma plugin attach
- `.gitignore` — Added `!.vscode/launch.json` whitelist entry after existing `.vscode/tasks.json` line

## Decisions Made

- **Vitest binary path:** Used `${workspaceFolder}/packages/ui/node_modules/.bin/vitest` instead of the plan's suggested `${workspaceFolder}/node_modules/.bin/vitest` (which does not exist — Bun does not hoist Vitest to workspace root). This matches the finding from Plan 01 and the important_context note in the task prompt.
- **gitignore:** The `.vscode/*` glob was already negating the `.vscode/` directory with specific `!` exceptions. Added `!.vscode/launch.json` in the same block — no other changes required.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected Vitest binary path from root to per-package**
- **Found during:** Task 1 (binary location check)
- **Issue:** Plan template shows `${workspaceFolder}/node_modules/.bin/vitest` but that path does not exist — Bun places Vitest only at `packages/common/node_modules/.bin/vitest` and `packages/ui/node_modules/.bin/vitest`
- **Fix:** Used `${workspaceFolder}/packages/ui/node_modules/.bin/vitest` as the `program` field value. This is correct per Plan 01 findings and the important_context note.
- **Files modified:** `.vscode/launch.json`
- **Verification:** File created with correct path, JSON validates, `git check-ignore` confirms tracked
- **Committed in:** e6b174e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — wrong path in plan template)
**Impact on plan:** Essential correction. The launch.json would have silently pointed at a non-existent binary without this fix.

## Issues Encountered

None — single-task plan executed without complications.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 5 is now complete. All planned deliverables shipped:
- Per-package Vitest configs with 7 passing smoke tests (Plan 01)
- VS Code launch.json with 3 debug configurations (Plan 02)

Ready for milestone v1.0 completion or next milestone planning.

---
*Phase: 05-vitest-dx-polish*
*Completed: 2026-04-09*

## Self-Check: PASSED

- FOUND: .vscode/launch.json
- FOUND: 05-02-SUMMARY.md
- FOUND: commit e6b174e
