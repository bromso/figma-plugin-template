---
phase: 01-monorepo-scaffolding
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - turbo.json
  - package.json
  - .gitignore
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-09
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the three monorepo scaffolding files: `turbo.json`, `package.json`, and `.gitignore`. No critical security or crash-level issues found. There are three warnings covering a Turbo cache correctness gap, a missing lockfile gitignore entry, and a missing `.env` gitignore entry. Two info items cover minor housekeeping. Overall the scaffolding is structurally sound for a Turborepo + Bun workspace.

## Warnings

### WR-01: `lint` task has no `dependsOn` — may run before workspace dependencies are built

**File:** `turbo.json:13`
**Issue:** The `lint` task defines no `dependsOn`. In a multi-package workspace where packages import from sibling packages, linting (especially TypeScript-aware lint via `eslint` with type-checked rules) requires that upstream packages be built first. Without `dependsOn: ["^build"]`, Turbo may run `lint` in a package before its dependencies have produced their `dist/` outputs, leading to false-positive type errors or missed real errors silently skipped by the linter.
**Fix:**
```json
"lint": {
  "dependsOn": ["^build"],
  "outputs": []
}
```
If lint is intentionally source-only (no cross-package type resolution), document this with a comment or use `dependsOn: []` explicitly to make the intent clear.

---

### WR-02: `bun.lockb` / `bun.lock` not gitignored and not committed — lockfile is floating

**File:** `.gitignore:1-26`
**Issue:** The project declares `"packageManager": "bun@1.3.11"` in `package.json`, but `.gitignore` contains no entry for `bun.lockb` (binary lockfile) or `bun.lock` (text lockfile, Bun >=1.2). When any developer runs `bun install`, the lockfile will be created but left as an untracked file — neither committed for reproducible installs nor explicitly excluded. This creates inconsistency across environments and CI.
**Fix:** Either commit the lockfile (recommended for reproducibility) by ensuring it is not ignored, or explicitly ignore it:
```
# If intentionally not committing the lockfile:
bun.lockb
bun.lock
```
The preferred approach is to commit `bun.lock` (Bun >=1.2 generates a human-readable text lockfile by default).

---

### WR-03: No `.env` pattern in `.gitignore` — secrets could be accidentally committed

**File:** `.gitignore:1-26`
**Issue:** There is no entry ignoring `.env`, `.env.local`, `.env.*.local`, or similar files. Vite (used by the UI side of this plugin) automatically loads `.env.local` and `.env.[mode].local` files. If a developer adds API keys or tokens to these files, nothing prevents them from being staged and committed.
**Fix:** Add environment file patterns:
```
# Environment variables
.env
.env.local
.env.*.local
.env.development.local
.env.production.local
```

---

## Info

### IN-01: No `globalDependencies` in `turbo.json` — root config changes will not invalidate caches

**File:** `turbo.json:1-24`
**Issue:** Turbo's `globalDependencies` field lists files whose changes should bust all task caches. Root-level config files like `tsconfig.json`, `vite.config.*.ts`, and `.eslintrc` are not listed. If these change, Turbo will use stale cached outputs without re-running affected tasks. This is not a bug today (no packages exist yet), but should be added before CI caching is enabled.
**Fix:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["tsconfig.json", "tsconfig.node.json"],
  "tasks": { ... }
}
```

---

### IN-02: No `engines` field in `package.json` — Bun version requirement is implicit

**File:** `package.json:1-19`
**Issue:** The `packageManager` field pins `bun@1.3.11`, but only enforces the version when `corepack` is active. There is no `engines` field to declare the required Bun or Node version, so developers without corepack will silently use whatever Bun version is installed locally. This can cause subtle differences in resolution behavior.
**Fix:**
```json
"engines": {
  "bun": ">=1.3.11"
}
```

---

_Reviewed: 2026-04-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
