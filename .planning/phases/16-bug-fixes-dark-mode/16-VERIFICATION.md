---
phase: 16-bug-fixes-dark-mode
verified: 2026-04-11T14:10:00Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 7/8
  gaps_closed:
    - "Turborepo health — `bun run lint` exits 0"
  gaps_remaining: []
  regressions: []
---

# Phase 16: Bug Fixes + Dark Mode Verification Report

**Phase Goal:** All runtime bugs from the v1.2 code audit are fixed, and dark mode is either fully supported or explicitly removed
**Verified:** 2026-04-11T14:10:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (commit `36ead20`)

## Re-verification Summary

The previous verification (2026-04-10) reported a single gap: `bun run lint` exited 1 due to three biome format/lint errors in Phase-16-introduced files. Commit `36ead20` ("style(16): apply biome format fixes to phase-16 files") ran `bunx biome check --write` on all three files:

1. `packages/ui/src/__tests__/button-props.test.ts` — `import { type ButtonProps }` → `import type { ButtonProps }` (useImportType safe-fix)
2. `packages/ui/src/main.test.ts` — multi-line `expect(() => resolveRoot()).toThrow(...)` collapsed to single-line
3. `apps/design-plugin/vite.config.ui.ts` — `inlineAssetAsDataUri` function signature inlined to single-line form + `console.warn` template literal reshaped

All three are pure auto-fixes with zero semantic impact. Tests still green (5 files / 13 tests). All 7 ROADMAP Success Criteria remain verified and unchanged (the fixes touched only formatting / import-type, not functional code).

**Gap closed.** Phase 16 is now fully verified.

## Goal Achievement

### Observable Truths

Must-haves are derived from ROADMAP.md Success Criteria (7 items) plus the CONTEXT.md verification section (Turborepo health as item #8). Per the verification process, ROADMAP Success Criteria are the non-negotiable contract.

| # | Truth | Status | Evidence |
| - | ----- | ------ | -------- |
| 1 | `main.tsx` uses a null-guard instead of unchecked `as HTMLElement` cast (BUG-01) | VERIFIED | `packages/ui/src/main.tsx` lines 14-18 contain `if (!rootElement) { throw new Error("Root element #root not found in index.html"); }`. Grep for `as HTMLElement` → 0 matches. Unit test `main.test.ts` green (2 passes). Regression check after 36ead20: still green. |
| 2 | `ButtonProps` is defined in `button.tsx` and importable from `@repo/ui` (BUG-02) | VERIFIED | `packages/ui/src/components/ui/button.tsx` line 44 has `export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }`. Function signature on line 55 uses `: ButtonProps`. Barrel re-export in `index.ts` line 15 resolves cleanly. `button-props.test.ts` still green after `import type` refactor. |
| 3 | `AlertAction` is exported from `@repo/ui` index (BUG-03) | VERIFIED | `packages/ui/src/index.ts` line 14: `export { Alert, AlertAction, AlertDescription, AlertTitle } from "./components/ui/alert";`. `alert.tsx` line 69 defines and locally exports it. |
| 4 | `Icon` component `name` prop is narrowed (BUG-04) | VERIFIED | `icon.tsx` uses `@iconify/react/offline`, declares `export type StaticIconName = "lucide:plus" \| "lucide:info" \| "lucide:star"`, `IconProps.name` is typed `StaticIconName`. Grep for `iconName` across packages/ui, apps/design-plugin, apps/storybook → 0 matches. Grep for `api.iconify.design` in built `apps/design-plugin/dist/index.html` → 0 matches. `vitest run --typecheck icon.test` reports `Type Errors: no errors` proving the `@ts-expect-error` on unknown name is satisfied. |
| 5 | `index.html` has conformant DOCTYPE + html/head/body (BUG-05) | VERIFIED | `packages/ui/src/index.html` is a 13-line conformant document with DOCTYPE, `<html lang="en">`, head (charset, viewport, title, stylesheet link), body (#root div, module script). Stylesheet link was restored by commit `5c56240` after it was dropped during the worktree cherry-pick. `bun run build` produces a single-file `apps/design-plugin/dist/index.html` (384 kB) with DOCTYPE preserved. |
| 6 | `postcssUrl` uses `pathToFileURL` for path encoding (BUG-06) | VERIFIED | `apps/design-plugin/vite.config.ui.ts` imports `pathToFileURL` from `node:url`, defines `inlineAssetAsDataUri` callback that exercises it, and wires it into `postcssUrl({ url: inlineAssetAsDataUri })`. Post-36ead20 the function signature is single-line and the `console.warn` template literal is reshaped — both purely cosmetic biome fixes, semantics preserved. `16-06-SMOKE.md` records PASS for the `/tmp/bug-06 smoke` symlink recipe. |
| 7 | Dark mode tokens defined under `.dark` with documented decision (THEME-01) | VERIFIED | `packages/ui/src/styles.css` line 9 has `@custom-variant dark (&:where(.dark, .dark *, html.figma-dark, html.figma-dark *))`. Compound `.dark, html.figma-dark { ... }` block (lines 38-58) mirrors every OKLCH token from `:root` with dark-theme values. Contrast was revised in commit `b44584e` after human-verify feedback (borders bumped from 0.30 to 0.42 lightness). Human-verify checkpoint recorded as approved in 07-THEME-01-SUMMARY.md. |
| 8 | Turborepo health — `bun run lint` exits 0 (CONTEXT.md verification #8) | VERIFIED | `bun run lint` now exits 0. Turbo reports `Tasks: 3 successful, 3 total` with all three biome check runs reporting "No fixes applied". Commit `36ead20` applied biome auto-fixes to the three Phase-16 files; no new errors introduced. |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `packages/ui/src/main.tsx` | Null-guarded bootstrap | VERIFIED | Contains `if (!rootElement) throw new Error(...)`, no cast |
| `packages/ui/src/main.test.ts` | Unit test for null-guard | VERIFIED | 2 test cases, pinned error literal; `expect().toThrow()` now single-line (36ead20) |
| `packages/ui/src/components/ui/button.tsx` | Named `ButtonProps` export | VERIFIED | `export type ButtonProps` on line 44 |
| `packages/ui/src/__tests__/button-props.test.ts` | Type-level smoke test for barrel export | VERIFIED | `import type { ButtonProps }` (36ead20), expectTypeOf assertions intact |
| `packages/ui/src/index.ts` | `AlertAction` + `StaticIconName` re-exports | VERIFIED | Both present on lines 14 and 4 |
| `packages/ui/src/components/figma/icon.tsx` | Iconify offline Icon + StaticIconName union | VERIFIED | `addCollection(lucideSubset)`, narrowed type union |
| `packages/ui/src/components/figma/icon.test.tsx` | Offline preload + type narrowing test | VERIFIED | 4 tests, `@ts-expect-error` enforced by `vitest --typecheck` |
| `packages/ui/package.json` | `@iconify/react` + `@iconify-json/lucide` | VERIFIED | Both present under `dependencies`; `lucide-react` preserved for shadcn internals |
| `packages/ui/src/index.html` | Conformant HTML document | VERIFIED | DOCTYPE + html + head (with stylesheet link) + body |
| `apps/design-plugin/vite.config.ui.ts` | `pathToFileURL` custom callback | VERIFIED | `inlineAssetAsDataUri` function defined and wired into `css.postcss.plugins`; signature reshaped by biome auto-fix (36ead20) |
| `packages/ui/src/styles.css` | `@custom-variant dark` + `.dark, html.figma-dark` block | VERIFIED | Both insertions present, contrast-fixed values |
| `.planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md` | Smoke-test recipe + PASS result | VERIFIED | PASS recorded 2026-04-10 |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `main.tsx` | `document.getElementById` | null-check + explicit Error throw | VERIFIED | `if (!rootElement)` guard present |
| `index.ts` | `button.tsx` | `type ButtonProps` re-export | VERIFIED | Named type export is real |
| `index.ts` | `alert.tsx` | `AlertAction` named re-export | VERIFIED | Barrel includes `AlertAction` |
| `icon.tsx` | `@iconify/react/offline` | `Icon` + `addCollection` import | VERIFIED | Both symbols imported, `addCollection` called at module scope |
| `index.ts` | `icon.tsx` | `StaticIconName` re-export | VERIFIED | Exported from barrel line 4 |
| `Icon.stories.tsx` | `icon.tsx` | stories pass `name` prop (not `iconName`) | VERIFIED | All 4 stories use `name: "lucide:…"` |
| `IconButton.stories.tsx` | `icon.tsx` | stories pass `iconProps: { name: … }` | VERIFIED | All 3 stories use new prop shape |
| `index.html` | `./main.tsx` | `<script type="module">` | VERIFIED | Module script preserved |
| `index.html` | `./styles.css` | `<link rel="stylesheet">` | VERIFIED | Link present (restored via commit `5c56240` after a cherry-pick drop) |
| `vite.config.ui.ts` | `postcss-url` | custom `url` callback using `node:url` + `node:fs` | VERIFIED | `postcssUrl({ url: inlineAssetAsDataUri })` wired in; post-36ead20 formatting unchanged semantically |
| `styles.css` | `html.figma-dark` + `.dark` classes | `@custom-variant dark (&:where(...))` | VERIFIED | Compound selector present on line 9 |
| `styles.css` .dark, html.figma-dark | `:root` tokens | mirrored OKLCH variables | VERIFIED | All non-`--radius` tokens mirrored with contrast-adjusted values |

### Data-Flow Trace (Level 4)

Phase 16 artifacts are mostly bootstrap / config / type definitions. The one runtime-rendering artifact is `Icon`, which was spot-checked via unit tests.

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `icon.tsx` `IconifyIcon` | `name` prop → iconify storage | `addCollection(lucideSubset)` at module init | Yes — SVG bodies verbatim from `@iconify-json/lucide@1.2.102` | FLOWING |
| `styles.css` `.dark, html.figma-dark` | CSS custom properties | OKLCH literal values (contrast-verified by human) | Yes — real color values | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| `@repo/ui` tests pass | `bun run --filter @repo/ui test` | 5 files / 13 tests passed, exit 0 | PASS |
| Full test suite passes | `bun run test` (prior verification, not re-run as no functional change) | All packages green, exit 0 | PASS |
| Full production build succeeds | `bun run build` (prior verification) | `apps/design-plugin/dist/index.html` 384.21 kB, exit 0 | PASS |
| Built bundle has zero `api.iconify.design` references | `grep -c 'api.iconify.design' apps/design-plugin/dist/index.html` | 0 matches | PASS |
| Built bundle has DOCTYPE | `grep -c 'DOCTYPE html' apps/design-plugin/dist/index.html` | 1 match | PASS |
| Vitest typecheck enforces `@ts-expect-error` on invalid icon name | `bunx vitest run --typecheck src/components/figma/icon.test` (in `packages/ui`) | 4 tests passed, `Type Errors: no errors` | PASS |
| Turborepo health — lint | `bun run lint` | **exit 0** — all 3 packages clean, Tasks: 3 successful | **PASS** |
| BUG-06 smoke test (path with spaces) | `/tmp/bug-06 smoke` symlink + `bun run build --force` | PASS recorded in 16-06-SMOKE.md | PASS |

### Requirements Coverage

All 7 requirement IDs from the Phase 16 plans are cross-referenced against `.planning/REQUIREMENTS.md`. No orphaned requirements: REQUIREMENTS.md traceability table maps exactly BUG-01..06 + THEME-01 to Phase 16 and all are claimed by plans.

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| BUG-01 | 01-BUG-01-main-null-guard | `main.tsx` null-guards `getElementById("root")` instead of unchecked cast | SATISFIED | Truth #1 verified |
| BUG-02 | 02-BUG-02-button-props-export | `ButtonProps` defined in `button.tsx` and importable from `@repo/ui` | SATISFIED | Truth #2 verified |
| BUG-03 | 03-BUG-03-alert-action-barrel | `AlertAction` exported from `@repo/ui` index | SATISFIED | Truth #3 verified |
| BUG-04 | 04-BUG-04-iconify-migration | `Icon` component `name` prop narrowed to known names, no network refs in bundle | SATISFIED | Truth #4 verified, typecheck + bundle audit green |
| BUG-05 | 05-BUG-05-index-html-conformance | `index.html` is a conformant document | SATISFIED | Truth #5 verified |
| BUG-06 | 06-BUG-06-postcss-url-encoding | `postcssUrl` uses `pathToFileURL` from `node:url`; build works on paths containing spaces | SATISFIED | Truth #6 verified; smoke test PASS |
| THEME-01 | 07-THEME-01-dark-mode-tokens | Dark mode fully supported with tokens under `.dark` | SATISFIED | Truth #7 verified; human-verify approved after contrast fix (b44584e) |

### Anti-Patterns Found

Scanned files modified by Phase 16 (including 36ead20) for TODO/FIXME/stub/empty-handler patterns.

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `packages/ui/src/components/figma/icon.tsx` | 12-14 | `TODO(Phase 17)` comment noting StaticIconName will be restructured into `StaticIconNameMap` | Info | Documented hand-off to Phase 17; not a stub — the current union is fully functional |

No blocker or warning-level anti-patterns. No empty handlers, no `return null` placeholders, no hardcoded empty arrays, no `as HTMLElement` casts, no dead stub routes. The Phase 17 TODO comment is intentional scope handoff, not a stub.

### Human Verification Status

THEME-01 required a human-verify checkpoint (`autonomous: false` in plan 07). Round 1 failed because the original dark border tokens at lightness 0.30 were indistinguishable from the 0.22 card surface (checkbox/input borders invisible). Commit `b44584e` revised the contrast (borders bumped to 0.42, card lifted to 0.25) and Round 2 was approved by the user. This is recorded in `07-THEME-01-dark-mode-tokens-SUMMARY.md` Task 2 section. No further human verification is required for Phase 16.

### Gap Closure Audit (Re-verification)

**Previous gap:** `bun run lint` exits 1 due to three biome errors in Phase-16-introduced files.

**Closure action:** Commit `36ead20` applied `bunx biome check --write` to the three files:

| File | Fix Applied | Evidence |
| ---- | ----------- | -------- |
| `packages/ui/src/__tests__/button-props.test.ts` | `import { type ButtonProps }` → `import type { ButtonProps }` (useImportType) | Line 2 now reads `import type { ButtonProps } from "../index";` |
| `packages/ui/src/main.test.ts` | Multi-line `expect(() => resolveRoot()).toThrow(...)` collapsed | Line 24 now a single-line call |
| `apps/design-plugin/vite.config.ui.ts` | Function signature single-line + `console.warn` template reshape | Line 26 `function inlineAssetAsDataUri(asset: {...}): string \| undefined {` on one line; lines 41-46 reshape |

**Regression check:**
- `bun run lint` → exit 0, Tasks: 3 successful (cache hit, replayed logs confirm "No fixes applied")
- `bun run --filter @repo/ui test` → 5 files / 13 tests passed, exit 0
- All 7 ROADMAP Success Criteria re-spot-checked: files still contain the expected semantic content (null guard, named type export, barrel exports, narrowed `name` prop, DOCTYPE, `pathToFileURL` wiring, `.dark` token block)

**Regressions introduced:** None. The fixes were pure formatting / import-type refinement with zero runtime or type-system impact.

### Summary

All 8 must-haves verified. All 7 ROADMAP Success Criteria satisfied. All 7 requirement IDs (BUG-01..06 + THEME-01) satisfied. The Turborepo health gate (`bun run lint`, `bun run test`, `bun run build` all exit 0) is green. Phase 16 is complete and ready for Phase 17 to build on top.

---

*Verified: 2026-04-11T14:10:00Z*
*Verifier: Claude (gsd-verifier)*
*Re-verification after commit `36ead20` closed the single outstanding gap.*
