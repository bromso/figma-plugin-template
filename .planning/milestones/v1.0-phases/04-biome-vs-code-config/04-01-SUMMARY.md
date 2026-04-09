---
phase: 04-biome-vs-code-config
plan: "01"
subsystem: tooling
tags: [biome, linting, formatting, turborepo]
dependency_graph:
  requires: []
  provides: [biome-lint-config, per-package-lint-scripts]
  affects: [all-workspace-packages]
tech_stack:
  added: ["@biomejs/biome@2.4.10"]
  patterns: [exact-version-pinning, biome-2x-includes-negation, turborepo-per-package-lint]
key_files:
  created:
    - biome.json
  modified:
    - package.json
    - apps/figma-plugin/package.json
    - packages/common/package.json
    - packages/ui/package.json
    - apps/figma-plugin/src/plugin/plugin.network.ts
    - apps/figma-plugin/src/plugin/plugin.ts
    - apps/figma-plugin/vite.config.ui.ts
    - packages/ui/src/app.tsx
    - packages/ui/src/components/Button.tsx
    - packages/ui/src/main.tsx
decisions:
  - "Used files.includes with negation patterns (!**/node_modules) instead of separate files.ignore — Biome 2.4.10 does not support the ignore key inside the files block"
  - "Applied --write --unsafe to convert string concatenation to template literals — semantically equivalent, purely style"
  - "noExplicitAny warning in classes.util.ts left as-is — warning only (exit 0), suppressing would require unknown[] + type narrowing which changes the function signature"
metrics:
  duration_minutes: 5
  completed_date: "2026-04-09"
  tasks_completed: 2
  files_changed: 10
---

# Phase 4 Plan 1: Biome 2.x Install and Lint Configuration Summary

**One-liner:** Biome 2.4.10 installed at monorepo root with exact pin, `biome.json` configures lint+format for TS/TSX/JS/JSX/JSON, per-package `biome check .` scripts wired into `bun run lint` via Turborepo.

## What Was Built

- Root `biome.json` with linter (recommended rules), formatter (2-space indent, 100 line width, double quotes), and `jsxRuntime: "transparent"` for React 17+
- `@biomejs/biome@2.4.10` added to root `devDependencies` with exact pin (no `^` or `~`)
- `"lint": "biome check ."` added to all three workspace packages (`apps/figma-plugin`, `packages/common`, `packages/ui`)
- Auto-fixed all existing style violations in the codebase (import sorting, formatting, template literals, rel="noopener" on anchor tags)

## Verification Results

```
$ bun run lint
turbo run lint — 3 packages in scope
@repo/common:lint:      Checked 4 files in 4ms. No fixes applied.
@repo/figma-plugin:lint: Checked 8 files in 4ms. No fixes applied.
@repo/ui:lint:          Checked 9 files in 5ms. Found 1 warning.
Tasks: 3 successful, 3 total — Time: 80ms
```

Exit code: 0. All three packages pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Biome 2.4.10 rejects `files.ignore` inside `files` block**
- **Found during:** Task 1 (first biome check run)
- **Issue:** The plan's `biome.json` template used `"files": { "includes": [...], "ignore": [...] }`. Biome 2.4.10 does not support an `ignore` key inside `files` — only `includes` (with negation) is valid. Error: `Found an unknown key 'ignore'`.
- **Fix:** Replaced `"ignore": [...]` with negation entries in `includes` array (`"!**/node_modules"`, `"!**/dist"`, `"!**/.turbo"`, `"!**/bun.lock"`)
- **Files modified:** `biome.json`
- **Commit:** 26ac7f4

**2. [Rule 2 - Auto-fix] Applied biome --write to existing codebase style violations**
- **Found during:** Task 1 (biome check on existing code)
- **Issue:** 11 errors + 2 warnings on existing code: import ordering, formatter violations, `useImportType`, `noBlankTarget` (security), template literal preference
- **Fix:** Ran `bunx biome check --write --unsafe .` — fixed 6 files (import sorting, formatting, template literals, `rel="noopener"` on external links). The `noExplicitAny` warning in `classes.util.ts` cannot be auto-fixed without changing the function signature.
- **Files modified:** `apps/figma-plugin/src/plugin/plugin.network.ts`, `apps/figma-plugin/src/plugin/plugin.ts`, `apps/figma-plugin/vite.config.ui.ts`, `packages/ui/src/app.tsx`, `packages/ui/src/components/Button.tsx`, `packages/ui/src/main.tsx`
- **Commit:** 26ac7f4

## Known Issues

**noExplicitAny warning in `packages/ui/src/utils/classes.util.ts:1`**

The `classes(...args: any[])` utility function uses `any[]`. Biome reports this as a warning (not an error) — exit code remains 0, `bun run lint` succeeds. Suppressing it would require changing the parameter type to `unknown[]` with explicit narrowing, which is a semantic change outside this plan's scope. Tracked for future cleanup.

## Threat Flags

None. This plan adds only dev-tooling configuration files and no new network, auth, or data-handling surface.

## Self-Check: PASSED

All key files exist. Both task commits verified in git log.
