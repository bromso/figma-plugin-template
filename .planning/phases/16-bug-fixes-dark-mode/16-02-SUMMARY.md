---
phase: 16-bug-fixes-dark-mode
plan: 02
subsystem: ui
tags: [typescript, types, shadcn, button, type-exports, barrel-export]

requires:
  - phase: 13-shadcn-ui-component-migration
    provides: packages/ui/src/components/ui/button.tsx (shadcn Button component with inline prop type)
provides:
  - Named `ButtonProps` type export from `packages/ui/src/components/ui/button.tsx`
  - Real (non-phantom) `type ButtonProps` re-export through `packages/ui/src/index.ts`
  - `Button` function signature bound to the named type
  - TDD type-level test (`button-props.test.ts`) that guards the export against future regression
affects:
  - 17-type-safety (TYPE-01 — when tsc is enabled on packages/ui, ButtonProps will resolve cleanly instead of emitting TS2305)
  - any downstream plugin code or docs that want to import `type ButtonProps` from `@repo/ui`

tech-stack:
  added: []
  patterns:
    - "Named TypeScript type exports via `export type` for public component APIs"
    - "TDD type-level testing via Vitest + `expectTypeOf` to guard barrel re-exports against phantom drift"

key-files:
  created:
    - packages/ui/src/__tests__/button-props.test.ts
  modified:
    - packages/ui/src/components/ui/button.tsx

key-decisions:
  - "Used `export type ButtonProps = ...` (not `interface`) to preserve the structural intersection form exactly and stay type-only (no runtime marker)."
  - "Placed the `ButtonProps` declaration between `buttonVariants` and `function Button` so the intersection can reference `typeof buttonVariants`."
  - "Did NOT modify `packages/ui/src/index.ts` — its existing `type ButtonProps` re-export becomes real automatically once the type exists in `button.tsx`."
  - "Used `bunx tsc --noEmit` inside `packages/ui` as the authoritative build verification because `@repo/ui` is JIT source-only and has no `build` script."

patterns-established:
  - "Pattern: Type-level TDD — write a vitest test with `expectTypeOf<T>().not.toBeAny()` and structural `.toHaveProperty(...)` assertions to prove a type export is real; run `tsc --noEmit` to confirm compilation fails before the fix and passes after."
  - "Pattern: Named `export type` for component prop types — keeps emitted JS free of runtime markers and lets barrel re-exports bind to real definitions."

requirements-completed: [BUG-02]

duration: 10min
completed: 2026-04-10
---

# Phase 16 Plan 02: ButtonProps Named Type Export Summary

**Turned `@repo/ui`'s phantom `type ButtonProps` barrel re-export into a real, named `export type ButtonProps` in `button.tsx`, bound the `Button` function signature to it, and guarded the export with a type-level vitest test — unblocking Phase 17 TYPE-01 type-check work.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-10T13:16:00Z
- **Completed:** 2026-04-10T13:20:30Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 1 (`packages/ui/src/components/ui/button.tsx`)
- **Files created:** 1 (`packages/ui/src/__tests__/button-props.test.ts`)

## Accomplishments

- `ButtonProps` is now a real, named type export from `packages/ui/src/components/ui/button.tsx` — structurally identical to the previous inline intersection.
- `Button` function signature uses `: ButtonProps` instead of the inline intersection — no type duplication.
- The existing `export { ..., type ButtonProps, ... }` barrel re-export in `packages/ui/src/index.ts` is no longer phantom and no longer triggers `TS2305: Module has no exported member 'ButtonProps'`.
- Type-level regression guard added: `button-props.test.ts` will fail at compilation if `ButtonProps` ever reverts to phantom (`expectTypeOf<ButtonProps>().not.toBeAny()` + structural property assertions).
- All 10 `@repo/ui` vitest tests pass (was 8 before RED, +2 from new test file).

## Task Commits

Each task was committed atomically with `--no-verify` (parallel executor mode):

1. **Task 1 (RED): add failing type test for ButtonProps export** — `2c619b2` (test)
2. **Task 1 (GREEN): export named ButtonProps type from button.tsx** — `962ee94` (feat)

_No REFACTOR commit — GREEN implementation was already in final form (direct `export type` + signature swap, no cleanup needed)._

## Files Created/Modified

### Modified

- **`packages/ui/src/components/ui/button.tsx`** — Added `export type ButtonProps` block between `buttonVariants` and `function Button`; swapped the inline intersection in the function signature for `: ButtonProps`.

### Created

- **`packages/ui/src/__tests__/button-props.test.ts`** — Type-level TDD guard using `expectTypeOf<ButtonProps>().not.toBeAny()` and structural property assertions; also includes a structural runtime assignment test covering the common prop shape.

## Verbatim Change Records

### New `ButtonProps` type export (inserted between `buttonVariants` and `Button`)

```typescript
export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };
```

### `Button` function signature change

Before:

```typescript
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
```

After:

```typescript
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
```

### `packages/ui/src/index.ts` — NOT modified

`git diff packages/ui/src/index.ts` is empty. Line 15 still reads:

```typescript
export { Button, type ButtonProps, buttonVariants } from "./components/ui/button";
```

It is no longer phantom because `ButtonProps` is now a real export from `./components/ui/button`.

## Verification Evidence

### RED phase (before GREEN)

Running `bunx tsc --noEmit` in `packages/ui/` produced the expected failures:

```
src/__tests__/button-props.test.ts(12,37): error TS2349: This expression is not callable.
  Type 'Inverted<ExpectAny<ButtonProps>>' has no call signatures.
src/index.ts(15,23): error TS2305: Module '"./components/ui/button"' has no exported member 'ButtonProps'.
```

The `TS2305` on `index.ts` line 15 is the smoking gun — it proves the original re-export was phantom.

### GREEN phase (after fix)

```
bunx tsc --noEmit       → 0 errors in button.tsx, button-props.test.ts, or index.ts
bun run --filter @repo/ui test
  Test Files  4 passed (4)
       Tests  10 passed (10)
```

### Acceptance-criteria ripgrep checks (all match expected counts from PLAN)

- `rg -n 'export type ButtonProps' packages/ui/src/components/ui/button.tsx` → 1 match (line 44) ✓
- `rg -n 'ComponentProps' packages/ui/src/components/ui/button.tsx` → 1 match (line 44, the new type; the inline intersection is gone) ✓
- `rg -nF ': ButtonProps' packages/ui/src/components/ui/button.tsx` → 1 match (line 55, the function signature) ✓
- `rg -nF 'asChild?: boolean' packages/ui/src/components/ui/button.tsx` → 1 match (line 46, in the type, not in the signature) ✓
- `git diff packages/ui/src/index.ts` → empty (unchanged) ✓

Maps to 16-VALIDATION.md rows 16-02-01 and 16-02-02.

## Decisions Made

- **Named `export type` over `interface`**: Preserves the structural intersection form (`React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }`) exactly — an `interface` would not be able to represent the intersection without a wrapper and would differ structurally from the original inline type. Also stays type-only so there is zero runtime emit.
- **TDD via `expectTypeOf` + `tsc`**: `@repo/ui` does not have vitest typecheck enabled, so runtime assertions on `expectTypeOf` are no-ops. I used `bunx tsc --noEmit` as the authoritative verification that ButtonProps resolves to a real type. The runtime test also contains a structural runtime assignment that sanity-checks the shape without relying on type-test mode.
- **`bunx tsc --noEmit` instead of `bun run --filter @repo/ui build`**: `@repo/ui` is JIT source-only and has no `build` script — the plan's verification command does not exist. Applied Rule 3 (fix blocking issue) and substituted `tsc --noEmit`, which is the semantic equivalent (the ui package's tsconfig already sets `"noEmit": true`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Substituted `bunx tsc --noEmit` for nonexistent `bun run --filter @repo/ui build`**

- **Found during:** Verification step for Task 1
- **Issue:** The plan's `<verify>` block specifies `bun run --filter @repo/ui build`, but `@repo/ui` has no `build` script (JIT source-only package — see `packages/ui/package.json`). The command fails with `error: No packages matched the filter`.
- **Fix:** Ran `bunx tsc --noEmit` inside `packages/ui/` instead. The ui tsconfig already has `"noEmit": true`, so `tsc` is the semantic equivalent of "build" for this package — it type-checks the entire source tree without emitting artifacts. This is exactly what the plan's intent was: prove the type export compiles cleanly.
- **Files modified:** None (verification method only)
- **Verification:** `bunx tsc --noEmit` reports 0 errors in `button.tsx`, `button-props.test.ts`, and `index.ts` (see evidence above).
- **Committed in:** n/a (verification change, not a code change)

**2. [Rule 3 - Blocking] Reset stale worktree files to reconcile with correct base commit**

- **Found during:** Worktree branch check (first action)
- **Issue:** The worktree was originally created at commit `74eda89` (pre-shadcn, v1.0 state) but the plan targets commit `1ee75fb` (post-shadcn, v1.2 state with `packages/ui/src/components/ui/button.tsx`). Running `git reset --soft 1ee75fbfb...` left a soft-reset index and working tree full of v1.0 files that no longer exist in HEAD.
- **Fix:** Ran `git checkout HEAD -- .` to sync tracked files to the 1ee75fb tree, then `git reset HEAD -- .` to unstage the stale additions (leaving them as untracked — they do not belong in this branch and are not part of any commit). Only targeted files (`button.tsx`, `button-props.test.ts`, and planning docs) were staged into my commits via explicit `git add <path>`.
- **Files modified:** None of the stale files were committed — they remain untracked in the worktree.
- **Verification:** `git status --short` shows only untracked stale files; `git log --oneline -3` shows `962ee94 feat(16-02)... 2c619b2 test(16-02)... 1ee75fb plan(16)...` with the correct base.
- **Committed in:** n/a (no stale files committed)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — Blocking).
**Impact on plan:** Both were environment reconciliations, not code changes. Neither deviation altered the semantics of BUG-02 or changed any files beyond what the plan specified. No scope creep.

## Issues Encountered

- **Pre-existing TypeScript errors in `packages/ui`** — Running `tsc --noEmit` surfaced 4 additional errors unrelated to BUG-02: `monorepo-networker` declaration resolution failure (TS7016) in `packages/common/src/networkSides.ts:1` and `packages/ui/src/main.tsx:2`, plus 3 implicit-any errors in `packages/ui/src/app.network.tsx` (transitive effects of the first error). Per scope boundary ("only auto-fix issues DIRECTLY caused by the current task's changes"), these are **out of scope** for BUG-02. Logged to `.planning/phases/16-bug-fixes-dark-mode/deferred-items.md` for Phase 17 TYPE-01 to resolve.

## Next Phase Readiness

- **BUG-02 resolved.** `ButtonProps` is a real, named, exported type. `@repo/ui` consumers can now write `import { type ButtonProps } from '@repo/ui'` and get a resolved type.
- **Phase 17 TYPE-01 unblocked.** When TYPE-01 enables `tsc` on `packages/ui`, the `index.ts:15` TS2305 error on `ButtonProps` will be gone. Only the pre-existing `monorepo-networker` resolution error (and its implicit-any downstream effects in `app.network.tsx`) remain — those are documented in `deferred-items.md`.
- **Regression guarded.** The new `button-props.test.ts` will catch any future regression that removes the named export (e.g., a refactor that tries to inline the type again — the test's `expectTypeOf<ButtonProps>()` import would break at tsc compilation).

## Known Stubs

None — no placeholders, mock data, or TODOs introduced. All code is production-ready.

## Self-Check: PASSED

**Files verified:**
- `packages/ui/src/components/ui/button.tsx` — modified (contains `export type ButtonProps`): FOUND
- `packages/ui/src/__tests__/button-props.test.ts` — created: FOUND
- `.planning/phases/16-bug-fixes-dark-mode/deferred-items.md` — created: FOUND
- `.planning/phases/16-bug-fixes-dark-mode/16-02-SUMMARY.md` — created: FOUND (this file)

**Commits verified:**
- `2c619b2` (test: add failing type test for ButtonProps export): FOUND in `git log`
- `962ee94` (feat: export named ButtonProps type from button.tsx): FOUND in `git log`

**Verification commands passed:**
- `bun run --filter @repo/ui test` → 4 files / 10 tests passed
- `bunx tsc --noEmit` (in `packages/ui`) → 0 errors in `button.tsx`, `button-props.test.ts`, `index.ts` (only pre-existing unrelated errors remain, logged in `deferred-items.md`)

---
*Phase: 16-bug-fixes-dark-mode*
*Plan: 02 (BUG-02 button-props-export)*
*Completed: 2026-04-10*
