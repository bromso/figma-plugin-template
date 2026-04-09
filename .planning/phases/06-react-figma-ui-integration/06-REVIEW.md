---
phase: 06-react-figma-ui-integration
reviewed: 2026-04-09T19:00:53Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - packages/ui/__mocks__/figma-plugin-ds.js
  - packages/ui/package.json
  - packages/ui/src/__tests__/App.test.tsx
  - packages/ui/src/__tests__/exports.test.ts
  - packages/ui/src/app.module.scss
  - packages/ui/src/app.tsx
  - packages/ui/src/index.ts
  - packages/ui/src/test/figma-plugin-ds-stub.ts
  - packages/ui/src/test/setup.ts
  - packages/ui/vitest.config.ts
  - package.json
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-04-09T19:00:53Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

This phase introduces the `@repo/ui` package: a thin re-export layer over `react-figma-ui`, a sampler `App` component, a `classes` utility, and a Vitest test suite. The code is well-structured overall. No critical security or data-loss issues were found.

Two warnings stand out: the `classes` utility accepts `any[]`, silently allowing non-string values to slip into class name strings; and the test infrastructure uses two overlapping mechanisms to mock `figma-plugin-ds` — a `resolve.alias` in `vitest.config.ts` and a separate `vi.mock()` in `setup.ts` — creating a redundancy that could silently break if they drift out of sync. Three lower-priority items cover a dead-code stub file, a misleading test description count, and a loose `any` type in the utility function.

## Warnings

### WR-01: `classes` utility accepts `any[]` — non-string values silently coerced

**File:** `packages/ui/src/utils/classes.util.ts:1`

**Issue:** The signature `...args: any[]` allows callers to pass numbers, objects, or arrays. These will pass the truthiness filter and `.join(" ")` will call `.toString()` on them, producing class strings like `"[object Object]"` or `"1,2,3"` without any compile-time or runtime error. The `exports.test.ts` test only checks `classes('a', null, 'b')` — the happy path — so the type hole is not exercised.

**Fix:**
```typescript
// Restrict to known-safe falsy/string types
export function classes(...args: (string | null | undefined | false | 0)[]) {
  return args.filter(Boolean).join(' ');
}
```
Or, if zero (`0`) is not needed as a falsy guard, simply:
```typescript
export function classes(...args: (string | null | undefined | false)[]) {
  return args.filter((a): a is string => typeof a === 'string' && a.length > 0).join(' ');
}
```

---

### WR-02: Dual mock registration for `figma-plugin-ds` — alias and `vi.mock()` conflict

**Files:** `packages/ui/vitest.config.ts:20-22`, `packages/ui/src/test/setup.ts:7-10`

**Issue:** `vitest.config.ts` registers a `resolve.alias` that redirects `figma-plugin-ds` imports to `__mocks__/figma-plugin-ds.js` at Vite resolution time. `setup.ts` additionally calls `vi.mock("figma-plugin-ds", ...)` which hoists above all imports and installs a second mock factory. Both stubs expose the same `{ disclosure, selectMenu }` shape today, so tests pass. However:

- `vi.mock()` factories bypass the `resolve.alias` — they intercept at the Vitest module registry level, not the Vite resolver. If someone updates only one of the two stubs (e.g. adds a new export to `__mocks__/figma-plugin-ds.js` but not to `setup.ts`), tests may silently use the wrong stub depending on load order.
- The effective stub at test runtime is whichever mechanism wins — currently `vi.mock()` wins because it hoists. The alias in `vitest.config.ts` only matters for the CSS subpath alias on line 13-17, not the JS root.

**Fix:** Remove the redundant `vi.mock()` call from `setup.ts` and rely solely on the `resolve.alias` in `vitest.config.ts`, which is the idiomatic Vitest approach for package-level stubbing:

```typescript
// src/test/setup.ts — remove the vi.mock block entirely
import "@testing-library/jest-dom";
// figma-plugin-ds is stubbed via resolve.alias in vitest.config.ts
```

If `vi.mock()` is preferred (e.g. to use `vi.fn()` for spy-ability), remove the JS alias from `vitest.config.ts` and keep only `setup.ts`. Whichever approach is chosen, only one mechanism should be active.

---

## Info

### IN-01: Dead code — `figma-plugin-ds-stub.ts` is never referenced

**File:** `packages/ui/src/test/figma-plugin-ds-stub.ts:1-6`

**Issue:** This stub file exists at `src/test/figma-plugin-ds-stub.ts` but is not imported anywhere. The active stubs are `__mocks__/figma-plugin-ds.js` (via `resolve.alias`) and the inline factory in `setup.ts` (via `vi.mock()`). The TS stub is a leftover from an earlier iteration.

**Fix:** Delete `packages/ui/src/test/figma-plugin-ds-stub.ts`.

---

### IN-02: Inaccurate test description — "14 components" but 15 are asserted

**File:** `packages/ui/src/__tests__/exports.test.ts:23`

**Issue:** The `it` description reads `'exports all 14 react-figma-ui components'` but the assertion body checks 15 component names: `Button`, `Checkbox`, `Disclosure`, `DisclosureItem`, `Icon`, `IconButton`, `Input`, `Label`, `SectionTitle`, `OnboardingTip`, `Radio`, `Select`, `Switch`, `Textarea`, `Type`. The mismatch is cosmetic but misleading when reading test output.

**Fix:**
```typescript
it('exports all 15 react-figma-ui components', () => {
```

---

### IN-03: CSS side-effect import in package entry point couples consumers to Vite

**File:** `packages/ui/src/index.ts:1`

**Issue:** `import 'figma-plugin-ds/dist/figma-plugin-ds.css'` is a side-effect import at the top of the public entry point. This works because all current consumers are Vite-based. However, any future consumer that processes this package without Vite (e.g. a plain Node utility script, a storybook with a non-CSS transform, or a server-side render) will throw on the CSS import unless they configure their own CSS handler.

This is a low-risk issue for the current monorepo structure (all consumers use Vite), but worth documenting.

**Fix (optional):** Move the CSS import to the application entry point (`main.tsx` or similar) where it is consumed, rather than embedding it in the library index. This keeps the `@repo/ui` package side-effect-free:

```typescript
// app/plugin/src/main.tsx (or wherever the UI is bootstrapped)
import 'figma-plugin-ds/dist/figma-plugin-ds.css';
import { App } from '@repo/ui';
```

If moving it is not desirable, mark the side effect explicitly in `package.json` to aid bundler tree-shaking:
```json
"sideEffects": ["./src/index.ts"]
```

---

_Reviewed: 2026-04-09T19:00:53Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
