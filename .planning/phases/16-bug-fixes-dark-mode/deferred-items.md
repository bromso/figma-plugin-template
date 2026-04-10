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

## Scope boundary

Per the executor scope rules: "Only auto-fix issues DIRECTLY caused by the current task's changes." BUG-02 added a named `ButtonProps` type export — it did not touch `monorepo-networker`, `networkSides.ts`, or `app.network.tsx`. These errors exist independently of the BUG-02 fix.
