# Phase 16 Deferred Items

Out-of-scope issues discovered during plan execution. These are NOT fixed because they are unrelated to the current task's changes. Phase 17 (type-safety) is the intended resolution venue.

## Pre-existing TypeScript errors (discovered during 16-02)

Discovered while running `bunx tsc --noEmit` in `packages/ui/` to verify BUG-02 fix. These errors exist on the current branch BEFORE any BUG-02 changes and are unrelated to `ButtonProps`.

### Error 1: `monorepo-networker` declaration file resolution

- **Files:** `packages/common/src/networkSides.ts:1`, `packages/ui/src/main.tsx:2`
- **Error:** `TS7016: Could not find a declaration file for module 'monorepo-networker'.`
- **Cause:** The `monorepo-networker` package's `package.json` `exports` field does not expose the `.d.ts` file correctly under `"exports"`. TypeScript reports "There are types at .../index.d.ts, but this result could not be resolved when respecting package.json 'exports'".
- **Scope:** Package-level dependency issue, not caused by BUG-02.
- **Resolution venue:** Phase 17 TYPE-01 (ui package tsc enablement) will need to resolve this — either via patch-package, a local `*.d.ts` declaration shim, or upstream fix.

### Error 2: Implicit `any` in `packages/ui/src/app.network.tsx`

- **Files:** `packages/ui/src/app.network.tsx:4, 7, 24`
- **Errors:**
  - `TS7006: Parameter 'message' implicitly has an 'any' type.`
  - `TS7006: Parameter 'next' implicitly has an 'any' type.`
  - `TS7006: Parameter 'text' implicitly has an 'any' type.`
- **Cause:** Transitive effect of Error 1 — because `monorepo-networker` types cannot resolve, handler callback parameters fall back to implicit `any` under `"strict": true`.
- **Scope:** Will resolve automatically once Error 1 is fixed.
- **Resolution venue:** Phase 17 TYPE-01.

## Pre-existing lint errors (discovered during 16-04)

Discovered while running `bun run lint` at the end of plan 04 (iconify migration). These errors exist outside Plan 04's `files_modified` scope and belong to other Wave 2 plans that may still be in flight or have completed independently.

### Error 3: `packages/ui/src/__tests__/button-props.test.ts` — useImportType

- **File:** `packages/ui/src/__tests__/button-props.test.ts:2`
- **Error:** `lint/style/useImportType` — test imports a type-only symbol without `import type`.
- **Scope:** Belongs to Plan 02 (BUG-02 ButtonProps export). Plan 04 did not create or modify this file.
- **Resolution venue:** Plan 02 cleanup or a subsequent lint sweep.

### Error 4: `apps/design-plugin` formatter

- **Scope:** Biome formatter reported a diff in the design-plugin workspace. Plan 04 did not modify any file under `apps/design-plugin/`.
- **Resolution venue:** The owning plan (likely 06 postcss-url or 01 main null-guard, whichever touches the files) or a global format sweep.

## Pre-existing Biome format errors (discovered during 16-07 wave 2 build)

Discovered while running `bun run lint` in the wave-2 dark-mode worktree. These errors exist on the phase base `aab8ea8` BEFORE any THEME-01 changes and are unrelated to `packages/ui/src/styles.css` (Biome ignores CSS files anyway).

### Error 5: `button-props.test.ts` import formatting

- **File:** `packages/ui/src/__tests__/button-props.test.ts:2`
- **Error:** `import { type ButtonProps }` should be `import type { ButtonProps }` (Biome `useImportType` / formatter).
- **Scope:** File was added by plan 16-02 (BUG-02). Not caused by THEME-01 (plan 07).
- **Resolution venue:** Fix in a follow-up commit on master after wave 2 merge, or amend 16-02.

### Error 6: `main.test.ts` multi-line expect formatting

- **File:** `packages/ui/src/main.test.ts:24-26`
- **Error:** `expect(() => resolveRoot()).toThrow("...")` split across 3 lines; Biome formatter wants it on 1 line.
- **Scope:** File was added by plan 16-01 (BUG-01). Not caused by THEME-01 (plan 07).
- **Resolution venue:** Fix in a follow-up commit on master after wave 2 merge, or amend 16-01.

## Scope boundary

Per the executor scope rules: "Only auto-fix issues DIRECTLY caused by the current task's changes." Plans 02, 04, and 07 each fixed only their own-owned lint/format errors; remaining errors belong to sibling plans or pre-existing declaration issues and are documented above for downstream resolution.
