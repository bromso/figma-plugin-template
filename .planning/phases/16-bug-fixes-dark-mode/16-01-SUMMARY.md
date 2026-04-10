---
phase: 16-bug-fixes-dark-mode
plan: 01
subsystem: ui
tags: [react, vite, vitest, typescript, bootstrap, error-handling]

# Dependency graph
requires:
  - phase: 11-react-19
    provides: React 19 + ReactDOM.createRoot bootstrap pattern
  - phase: 13-shadcn-ui-component-migration
    provides: packages/ui app shell wired through main.tsx
provides:
  - Null-guarded #root element lookup in packages/ui/src/main.tsx
  - Vitest unit test pinning the error-message contract
  - Template consumers get an actionable Error instead of a silent null deref
affects: [16-type-safety, 17-type-safety, any future packages/ui bootstrap refactor]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline null-guard + descriptive throw before ReactDOM.createRoot (per RESEARCH D-05)"
    - "Self-contained Vitest for bootstrap guard (test replicates shape; does NOT import main.tsx to avoid eager React bootstrap)"

key-files:
  created:
    - packages/ui/src/main.test.ts
  modified:
    - packages/ui/src/main.tsx

key-decisions:
  - "Use inline null-guard instead of an invariant helper — single call site, CONTEXT.md D-05 endorses inline for one site"
  - "Test uses a local resolveRoot() replica instead of importing main.tsx to prevent eager ReactDOM.createRoot side effects during vitest runs"
  - "Pin the error literal 'Root element #root not found in index.html' in both test and implementation; 16-VALIDATION.md row 16-01-02 enforces the grep check"

patterns-established:
  - "Bootstrap guard pattern: check getElementById result, throw descriptive Error before createRoot — reusable for any Figma plugin UI entry"
  - "Bootstrap test pattern: replicate guard locally rather than importing entry modules that have top-level side effects"

requirements-completed: [BUG-01]

# Metrics
duration: 2min
completed: 2026-04-10
---

# Phase 16 Plan 01: BUG-01 main.tsx Null Guard Summary

**Replaced the unchecked `as HTMLElement` cast on `document.getElementById("root")` with an inline null-guard that throws `Error("Root element #root not found in index.html")`, and pinned the contract with a 2-case Vitest unit test.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-10T13:16:46Z
- **Completed:** 2026-04-10T13:18:28Z
- **Tasks:** 2 (both TDD-flagged)
- **Files modified:** 2 (1 created, 1 edited)

## Accomplishments

- Template consumers who ship `index.html` without `<div id="root">` now get a descriptive, actionable Error instead of a null deref inside `ReactDOM.createRoot`
- Zero unchecked `as HTMLElement` casts remain in `packages/ui/src/main.tsx`
- Vitest unit test locks the error-message literal, so future refactors cannot silently drift from the contract
- `bun run --filter @repo/figma-plugin build` passes — TypeScript correctly narrows after the `if (!rootElement) throw` branch
- 16-VALIDATION.md rows 16-01-01 (unit) and 16-01-02 (static grep) are now green

## Task Commits

Each task was committed atomically:

1. **Task 1: Create failing null-guard test (Wave 0)** — `a87308a` (test)
2. **Task 2: Apply null guard to main.tsx** — `df421ae` (fix)

_Note: Task 1 is the TDD RED step. Because the test file is intentionally self-contained (replicates the guard shape rather than importing `main.tsx`), both cases pass immediately — this is the approved design per the plan, since 16-VALIDATION.md row 16-01-02 enforces the literal match between test and implementation via static grep._

## Files Created/Modified

- `packages/ui/src/main.test.ts` (created) — 2 Vitest cases covering the #root guard: (a) throws descriptive Error when missing, (b) returns element when present. Uses `replaceChildren` / `createElement` / `appendChild` (no `innerHTML`).
- `packages/ui/src/main.tsx` (modified) — Replaced lines 14-15. **Before:**
  ```typescript
  const rootElement = document.getElementById("root") as HTMLElement;
  const root = ReactDOM.createRoot(rootElement);
  ```
  **After:**
  ```typescript
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element #root not found in index.html");
  }
  const root = ReactDOM.createRoot(rootElement);
  ```

## Test Results

- `bun run --filter @repo/ui test main.test` — **2 passed / 2 total** (337 ms)
  - ✓ `BUG-01: main.tsx root element null guard > throws a descriptive Error when #root is missing`
  - ✓ `BUG-01: main.tsx root element null guard > returns the element when #root exists`
- `bun run --filter @repo/figma-plugin build` — **exits 0**, both `vite.config.ui.ts` and `vite.config.plugin.ts` succeed (373.55 kB UI bundle, 5.33 kB plugin bundle). TypeScript narrowing after the throw branch works with `ReactDOM.createRoot`'s non-nullable `Element | DocumentFragment` signature.

## Decisions Made

- **Inline guard, no helper** — CONTEXT.md D-05 endorses inline for a single call site. Introducing an `invariant` helper would pull in new imports for zero gain.
- **Test replicates rather than imports `main.tsx`** — Importing `main.tsx` would eagerly run `Networker.initialize` and the `ReactDOM.createRoot` bootstrap at module-eval time, which is incompatible with a pure unit test. The plan approves this approach; contract enforcement is delegated to 16-VALIDATION.md row 16-01-02 (static grep).
- **Error message literal is load-bearing** — `"Root element #root not found in index.html"` is asserted in the test, enforced by grep in validation, and referenced verbatim in 16-RESEARCH.md D-05. Do not modify without updating all three.

## Deviations from Plan

None — plan executed exactly as written.

**Note on verification command:** The plan's acceptance criteria for Task 2 lists `bun run --filter @repo/ui build`, but `@repo/ui` has no `build` script (the package is JIT source-only per monorepo convention). Ran `bun run --filter @repo/figma-plugin build` instead — this is the correct substitution because `@repo/figma-plugin`'s UI build consumes `packages/ui/src/main.tsx` via workspace symlink, so it exercises the same TypeScript narrowing check. This is a minor plan-text issue (the plan author intended "ensure TypeScript still compiles"), not a deviation from plan intent.

## Issues Encountered

- Worktree started with a stale working tree pointing at a pre-phase-16 snapshot (`74eda89`). Ran `git reset --soft 1ee75fb` followed by `git stash push -u` to realign to the orchestrator's expected base. No content changes lost — the stashed state is unrelated to this plan and will be handled by other worktrees in the wave.
- `bun install` needed on first run because the worktree's `node_modules` had no `vitest` binary.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- BUG-01 is satisfied. Wave 0 row 16-01-01 can flip to ✅ once the orchestrator's post-wave validation runs.
- No blockers for parallel plans 02–07 in Wave 1 — `main.tsx` and `main.test.ts` are not touched by any of the other BUG plans.
- The inline-guard + literal-error pattern is available for reuse if later plans add more bootstrap entry points (e.g., Storybook preview, plugin sandbox entry).

## Self-Check: PASSED

- `packages/ui/src/main.tsx` contains `if (!rootElement)` and `throw new Error("Root element #root not found in index.html")` — verified via Grep.
- `packages/ui/src/main.tsx` contains 0 instances of `as HTMLElement` — verified via Grep.
- `packages/ui/src/main.test.ts` exists with `describe("BUG-01: main.tsx root element null guard"` — verified via Grep.
- Commit `a87308a` exists on `worktree-agent-a7e516af` (Task 1 test file).
- Commit `df421ae` exists on `worktree-agent-a7e516af` (Task 2 main.tsx fix).
- `bun run --filter @repo/ui test main.test` exits 0 with 2 passing tests.
- `bun run --filter @repo/figma-plugin build` exits 0.

---
*Phase: 16-bug-fixes-dark-mode*
*Plan: 01-BUG-01-main-null-guard*
*Completed: 2026-04-10*
