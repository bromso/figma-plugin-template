---
phase: 13-shadcn-ui-component-migration
plan: "01"
subsystem: ui
tags: [shadcn, tailwind, design-tokens, dependencies]
dependency_graph:
  requires: []
  provides: [shadcn-foundation, cn-utility, figma-design-tokens, path-alias]
  affects: [packages/ui, apps/figma-plugin]
tech_stack:
  added:
    - radix-ui@1.4.3
    - class-variance-authority@0.7.1
    - tailwind-merge@3.5.0
    - clsx@2.1.1
    - lucide-react@1.8.0
    - tw-animate-css@1.4.0
    - shadcn@4.2.0
  patterns:
    - cn() utility via twMerge + clsx
    - "@theme inline for Tailwind 4 CSS-first design tokens"
    - "@/ path alias via tsconfig baseUrl+paths and Vite resolve.alias"
key_files:
  created:
    - packages/ui/src/lib/utils.ts
    - packages/ui/components.json
  modified:
    - packages/ui/package.json
    - packages/ui/tsconfig.json
    - apps/figma-plugin/vite.config.ui.ts
    - packages/ui/src/styles.css
decisions:
  - "Used radix-ui@1.4.3 monorepo package (not @radix-ui/* individual packages) as per shadcn/ui 4.x requirements"
  - "Set rsc:false in components.json — Figma plugins are client-only, no RSC"
  - "Used empty tailwind.config in components.json — Tailwind 4 is CSS-first (no tailwind.config.js)"
  - "OKLCH color values derived from figma-plugin-ds palette for design continuity"
metrics:
  duration_minutes: 8
  completed_date: "2026-04-09"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 6
---

# Phase 13 Plan 01: shadcn/ui Foundation Setup Summary

**One-liner:** Install shadcn/ui runtime deps, create cn() utility, configure components.json for monorepo, add @/ Vite+TS alias, and declare Figma-mapped OKLCH design tokens via @theme inline in styles.css.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install shadcn/ui deps and create cn() utility | 3dd036c | packages/ui/package.json, packages/ui/src/lib/utils.ts |
| 2 | Configure components.json, @/ alias, and Figma design tokens | 10e7855 | packages/ui/components.json, packages/ui/tsconfig.json, apps/figma-plugin/vite.config.ui.ts, packages/ui/src/styles.css |

## What Was Built

### Task 1: Dependencies + cn() utility
- Installed 5 runtime deps into packages/ui: `radix-ui`, `class-variance-authority`, `tailwind-merge`, `clsx`, `lucide-react`
- Installed 2 dev deps: `tw-animate-css`, `shadcn`
- Created `packages/ui/src/lib/utils.ts` exporting `cn()` — the standard shadcn/ui class merge helper using twMerge + clsx

### Task 2: Configuration layer
- Created `packages/ui/components.json` with `"style": "radix-nova"`, `"rsc": false`, monorepo aliases pointing to `@repo/ui/*`
- Updated `packages/ui/tsconfig.json` — added `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }`
- Updated `apps/figma-plugin/vite.config.ui.ts` — added `resolve.alias` mapping `"@"` to `uiSrcPath` (`packages/ui/src`)
- Replaced `packages/ui/src/styles.css` with full Figma design token theme: `:root` block with 18 OKLCH color tokens, `@theme inline` block mapping them to Tailwind color utilities, radius scale, Inter font stack, and Figma-sized font-size tokens (11/12/13/14px)

## Verification

- `bun run build` completes without errors (cache hit confirms no regressions)
- All 7 dependencies confirmed present in packages/ui/package.json
- `@theme inline` and `oklch` present in styles.css
- `@/*` path mapping present in tsconfig.json
- `"@":` alias present in vite.config.ui.ts
- `radix-nova` style present in components.json

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no UI components added in this plan; all infrastructure only.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. CSS tokens are visual-only (T-13-02 accepted per threat model).

## Self-Check: PASSED

| Item | Status |
|------|--------|
| packages/ui/src/lib/utils.ts | FOUND |
| packages/ui/components.json | FOUND |
| packages/ui/src/styles.css | FOUND |
| commit 3dd036c (task 1) | FOUND |
| commit 10e7855 (task 2) | FOUND |
