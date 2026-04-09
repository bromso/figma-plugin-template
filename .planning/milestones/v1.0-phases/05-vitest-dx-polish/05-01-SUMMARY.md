---
phase: 05-vitest-dx-polish
plan: "01"
subsystem: testing
tags: [vitest, testing-library, happy-dom, turborepo, tdd]
dependency_graph:
  requires: []
  provides: [test-infrastructure, vitest-common, vitest-ui, smoke-tests]
  affects: [packages/common, packages/ui, bun.lock]
tech_stack:
  added:
    - vitest@4.1.4
    - happy-dom@20.8.9
    - "@testing-library/react@16.3.2"
    - "@testing-library/jest-dom@6.9.1"
    - "@vitejs/plugin-react@4.7.0"
    - sass@1.99.0
  patterns:
    - per-package vitest.config.ts (no root-level config)
    - TDD red-green for smoke tests
    - Turborepo test task with per-package caching
key_files:
  created:
    - packages/common/vitest.config.ts
    - packages/ui/vitest.config.ts
    - packages/ui/src/test/setup.ts
    - packages/common/src/__tests__/networkSides.test.ts
    - packages/ui/src/__tests__/classes.util.test.ts
    - packages/ui/src/__tests__/Button.test.tsx
  modified:
    - packages/common/package.json
    - packages/ui/package.json
    - bun.lock
decisions:
  - "@vitejs/plugin-react pinned to ^4.0.0 (resolved to 4.7.0) — v6.x requires Vite 8; workspace uses Vite 6"
  - "Vitest binary hoisted per-package (packages/common/node_modules/.bin/vitest, packages/ui/node_modules/.bin/vitest) — not hoisted to workspace root by Bun"
  - "SCSS module imports handled by Vitest default CSS identity transform + sass devDep — no explicit css config needed"
metrics:
  duration_seconds: 123
  completed_date: "2026-04-09"
  tasks_completed: 2
  files_created: 6
  files_modified: 3
---

# Phase 5 Plan 1: Vitest Per-Package Setup Summary

**One-liner:** Vitest 4.1.4 with per-package configs (node env for common, happy-dom + RTL for ui) and 7 passing smoke tests via `turbo run test`.

## What Was Built

Two configured test suites:

- `packages/common`: node environment, 2 tests confirming `networkSides.ts` module loads without Figma global errors
- `packages/ui`: happy-dom environment with React Testing Library and jest-dom matchers, 5 tests covering `classes` utility (3) and `Button` component (2)

Both packages have `test` and `test:watch` scripts wired into Turborepo. `turbo run test` exits 0 with all 7 tests passing.

## Vitest Binary Location

Bun does **not** hoist Vitest binaries to workspace root. The binaries are per-package:

- `packages/common/node_modules/.bin/vitest`
- `packages/ui/node_modules/.bin/vitest`

**Impact for Plan 02 (launch.json):** The VS Code `launch.json` `program` path must point to a per-package binary or use `${workspaceFolder}/packages/ui/node_modules/.bin/vitest`. Consider whether to also install vitest at root for the launch.json configuration.

## SCSS Module Handling

No special Vitest config was needed. Vitest's default CSS module identity transform handled `Button.module.scss` imports correctly once `sass` was installed as a devDependency in `packages/ui`. The `Button.test.tsx` renders without crashing.

## Exact Versions Installed

| Package | Version |
|---------|---------|
| vitest | 4.1.4 |
| happy-dom | 20.8.9 |
| @testing-library/react | 16.3.2 |
| @testing-library/jest-dom | 6.9.1 |
| @vitejs/plugin-react | 4.7.0 |
| sass | 1.99.0 |

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Install dependencies and create Vitest configs with test scripts | 7ade73d |
| 2 (RED) | Write smoke tests (failing) | 4150d93 |
| 2 (GREEN) | All 7 smoke tests pass via turbo run test | 4150d93 (same — implementations pre-existed) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Downgraded @vitejs/plugin-react from 6.0.1 to 4.7.0**
- **Found during:** Task 1 verification (bun run test --filter @repo/ui)
- **Issue:** `@vitejs/plugin-react@6.0.1` imports `vite/internal` which is not exported by Vite 6.x (`ERR_PACKAGE_PATH_NOT_EXPORTED`). The research doc recommended 6.0.1 but the workspace uses Vite `^6.0.0`.
- **Fix:** Replaced with `^4.0.0` (resolved to 4.7.0) which is the same version used in `apps/figma-plugin` and supports Vite 6.
- **Files modified:** `packages/ui/package.json`, `bun.lock`
- **Commit:** 7ade73d

## Known Stubs

None — all test implementations exercise real source code. No placeholder data or hardcoded empty values.

## Threat Flags

None — this plan adds test infrastructure only (dev dependencies and test files). No production code, network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED
