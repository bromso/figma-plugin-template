# Project Research Summary

**Project:** figma-plugin-template — Turborepo monorepo migration
**Domain:** Figma plugin toolchain migration (Bun + Biome + Vitest + Turborepo)
**Researched:** 2026-04-09
**Confidence:** MEDIUM-HIGH

## Executive Summary

This project is a migration of an existing flat Figma plugin template into a Turborepo monorepo with Bun as the package manager, Biome as a unified linter/formatter, and Vitest as the test runner. The existing codebase is functional and in production — the work is purely structural and tooling, not feature development. Experts structure this as an `apps/` + `packages/` split where internal packages (`packages/common`, `packages/ui`) are JIT (Just-in-Time) — they export raw TypeScript source files compiled by the consuming application's Vite bundler — which preserves the existing single-file output constraint required by Figma.

The recommended approach is a sequential, dependency-ordered migration: scaffold the monorepo root first, then extract shared packages, then migrate the app, then layer in tooling (Biome, Vitest, VS Code config). The version decisions are constrained by Vitest 4.x requiring Vite 6+, which means upgrading from the current Vite 5. This upgrade is safe — `vite-plugin-singlefile` 2.3.0 explicitly supports Vite 6/7, and Vite 6 is stable. Staying on Vite 5 would create a ceiling for all future upgrades.

The most critical risk is `vite-plugin-singlefile` not inlining workspace packages into the single output files Figma requires. This is avoided by using Vite `resolve.alias` pointing directly to `packages/*/src/` rather than workspace package name imports for the Vite build step. Secondary risks are Bun's known tsconfig path alias resolution issues across package boundaries (use workspace imports, not `@alias` paths for runtime resolution) and Biome nested config misconfiguration (always set `"root": false` in per-package `biome.json`). These risks are well-documented with clear mitigations.

## Key Findings

### Recommended Stack

The existing React 18 + Vite + TypeScript + SCSS + `monorepo-networker` stack stays untouched inside the packages — only the orchestration layer changes. Vite must be upgraded from 5 to 6 to unlock Vitest 4.x. The new tooling layer is: Turborepo 2.9.4 (task orchestration and caching), Bun 1.3.x (package manager replacing npm), Biome 2.4.10 (lint + format replacing the absent ESLint/Prettier), and Vitest 4.1.3 (tests, replacing nothing — tests are new). All four tools are at current stable versions with well-defined integration paths.

**Core technologies:**
- **Turborepo 2.9.4:** Task pipeline and remote caching — use `tasks` key (not deprecated `pipeline`); Bun first-class supported
- **Bun 1.3.x:** Package manager replacing npm — faster installs, `workspace:*` protocol, `.bun.lock` text format (commit it)
- **Biome 2.4.10:** Unified lint + format — replaces absent ESLint + Prettier; 97% Prettier-compatible; no SCSS support (acceptable, SCSS stays un-linted)
- **Vitest 4.1.3:** Unit testing — requires Vite 6+; per-package configs for Turborepo cache; use `happy-dom` over `jsdom` (known Vitest 4 jsdom compat issues)
- **Vite ^6.0.0:** Upgrade from 5 — required by Vitest 4; `vite-plugin-singlefile` 2.3.0 supports it; skip Vite 7/8 for now to minimize plugin compat risk
- **vite-plugin-singlefile ^2.3.0:** Upgrade from 2.0.3 — Vite 6 peer dep fixed in 2.2.1+; current 2.3.0

**What NOT to use:** jsdom (use happy-dom), `turbo pipeline` key (use `tasks`), ESLint alongside Biome, npm or pnpm lockfiles, `@vitest/browser` as separate package (removed in Vitest 4), Nx or Lerna.

### Expected Features

The migration has a clear P1 / P2 / v2+ split. Everything in P1 is required to have a working monorepo; P2 items enhance the developer experience but do not block the working state.

**Must have (table stakes — P1):**
- `apps/figma-plugin` + `packages/ui` + `packages/common` + `packages/typescript-config` directory structure
- Root `package.json` with Bun workspaces (`apps/*`, `packages/*`) and `"private": true`
- `workspace:*` protocol for internal deps + `exports` field in each package
- Root `turbo.json` with `build`, `dev`, `lint`, `test`, and `test:watch` tasks
- Root `biome.json` with lint + format enabled; test file overrides
- VS Code `settings.json` (Biome as default formatter, `formatOnSave`) + `extensions.json`
- Per-package Vitest configs and `test` scripts for Turborepo caching
- Delete `package-lock.json` and `pnpm-lock.yaml`

**Should have (differentiators — P2):**
- Biome per-package nested configs with `"root": false` + `"extends": ["//"]` (Biome 2.0+ syntax)
- VS Code `.code-workspace` file for multi-root workspace with `workspaceFolder` scoping
- VS Code `launch.json` compound debug config (plugin sandbox + UI iframe)
- Turborepo remote cache stub in `turbo.json`
- `packages/typescript-config` with `base.json`, `react.json`, `node.json` variants

**Defer (v2+):**
- `@repo/biome-config` as a publishable npm package (only if family of plugins)
- `turbo.json` generators for package scaffolding
- Changesets for independent package versioning
- Vite 7 or 8 upgrade (Rolldown bundler — bigger change, future milestone)

### Architecture Approach

The architecture uses JIT internal packages — `packages/common` and `packages/ui` export raw TypeScript source with no separate compilation step. `apps/figma-plugin` remains the only package with a build output (`dist/`), and its two existing Vite configs (`vite.config.ui.ts`, `vite.config.plugin.ts`) do all bundling. Plugin sandbox code (`src/plugin/`) stays inside `apps/figma-plugin`, not extracted to a package, because it references Figma globals (`figma.*`, `__html__`) that are unavailable outside the Figma runtime. Package imports use workspace protocol (`@repo/common`, `@repo/ui`) for TypeScript and Vitest resolution, but Vite configs use `resolve.alias` pointing to `packages/*/src/` to ensure `vite-plugin-singlefile` inlines everything.

**Major components:**
1. `apps/figma-plugin` — owns both Vite configs, `figma.manifest.ts`, and plugin sandbox source; sole producer of `dist/`
2. `packages/common` — shared types and `monorepo-networker` side definitions; no DOM types; used by both Vite builds
3. `packages/ui` — all React components, styles, assets; depends on `@repo/common`; consumed by the UI Vite build
4. `packages/typescript-config` — shared `tsconfig` base files (`base.json`, `react.json`, `node.json`); no code, no build

### Critical Pitfalls

1. **vite-plugin-singlefile not inlining workspace packages** — Use `resolve.alias` in each Vite config pointing to `packages/*/src/` (not package name imports). Verify `dist/plugin.js` and `dist/index.html` contain no `import` statements after every restructuring step.

2. **Path aliases breaking across Bun workspace boundaries** — Bun has confirmed open issues with `tsconfig.paths` not applying correctly across package boundaries (issues #14694, #21056). Use `workspace:*` + package name imports for runtime/Vitest resolution; keep `resolve.alias` for Vite only. Do not rely on `@alias` syntax surviving cross-package at runtime.

3. **Biome nested config missing `"root": false`** — Without this field, each per-package `biome.json` becomes an independent root and breaks inheritance from the repo root config. Always set `"root": false` and `"extends": ["//"]` in every per-package `biome.json`.

4. **Vitest `projects` root config disabling Turborepo per-package caching** — A single root `vitest.config.ts` with `projects: [...]` means Turborepo cannot cache test results per package. Give each package its own `vitest.config.ts` and `"test"` script. Use a shared `vitest.shared.ts` for deduplication.

5. **`packageManager` field `v` prefix rejected by Turborepo** — Turborepo regex requires `"bun@1.2.10"` format; using `"bun@v1.2.10"` causes immediate failure. Set this field before running any `turbo` commands.

6. **Figma manifest paths misaligned after monorepo move** — `figma.manifest.ts` and `vite-plugin-generate-file` must live in `apps/figma-plugin/`. The three outputs (`manifest.json`, `plugin.js`, `index.html`) must always be co-located in `apps/figma-plugin/dist/`. Verify with `ls apps/figma-plugin/dist/` after every build.

7. **Parallel watch builds racing on common source** — Mitigated by making `packages/common` source-only with no build step. Both Vite watch configs import directly from `packages/common/src/` via alias, so there is no intermediate artifact to race over.

## Implications for Roadmap

Based on the dependency ordering in ARCHITECTURE.md and the pitfall-to-phase mapping in PITFALLS.md, a clear 8-step sequential structure emerges. These steps map naturally into 4-5 roadmap phases.

### Phase 1: Monorepo Scaffolding

**Rationale:** Everything depends on Bun workspaces and Turborepo existing. No code can move until the root structure is established. `packageManager` field must be correct before any `turbo` command runs.
**Delivers:** Working `bun install` across the repo; `turbo` recognizes the workspace; no tasks yet
**Addresses:** Bun workspaces (table stakes), `workspace:*` protocol setup, Turborepo `turbo.json` with `tasks` key
**Avoids:** Pitfall 3 (`packageManager` `v` prefix), Pitfall 4 (lockfile format — commit `bun.lock` now)

### Phase 2: Package Extraction

**Rationale:** `packages/typescript-config` must come first (unblocks tsconfig setup for all other packages), then `packages/common` (required by `packages/ui` and both Vite builds), then `packages/ui` (required by the UI Vite build). Order is strictly dependency-driven.
**Delivers:** `packages/typescript-config`, `packages/common`, `packages/ui` with correct `exports` fields, `workspace:*` imports, and per-package tsconfigs
**Implements:** JIT package architecture — no `dist/` in packages, source-only exports
**Avoids:** Pitfall 1 (vite-plugin-singlefile inlining — alias strategy decided here), Pitfall 2 (Bun path alias resolution — workspace imports used from the start)

### Phase 3: App Migration

**Rationale:** Once packages exist, `apps/figma-plugin` can be wired to consume them. Both Vite configs need alias updates. `figma.manifest.ts` moves here. This is the first phase where a working build can be verified end-to-end.
**Delivers:** `apps/figma-plugin` with updated `vite.config.*.ts`, working `turbo run build`, and verified `dist/` output loadable in Figma Desktop
**Addresses:** Monorepo directory structure complete; Figma single-file constraint verified
**Avoids:** Pitfall 6 (manifest path misalignment), Pitfall 7 (parallel watch race — common is source-only), Pitfall 1 (verified by opening `dist/plugin.js` and checking for `import` statements)

### Phase 4: Tooling — Biome + VS Code

**Rationale:** Biome setup after the code is in final locations — formatting the final source, not intermediate states. VS Code config belongs here because it references the settled package structure (workspace folder names, extension IDs).
**Delivers:** Root `biome.json`, per-package `biome.json` with `"root": false`, VS Code `settings.json` + `extensions.json`, `formatOnSave` working
**Addresses:** All P1 Biome features, VS Code table stakes
**Avoids:** Pitfall 5 (Biome nested config `"root": false` — set correctly from the start)

### Phase 5: Testing + Developer Experience Polish

**Rationale:** Tests are additive — they do not block the working build. Adding them after the app is confirmed working means tests validate real behavior, not migration artifacts. VS Code P2 features (`.code-workspace`, `launch.json`) come last because they depend on knowing the final folder layout.
**Delivers:** Per-package `vitest.config.ts` files, `test` and `test:watch` Turborepo tasks, initial test coverage, VS Code `.code-workspace`, `launch.json` compound debug config, Turborepo remote cache stub
**Addresses:** All P1 Vitest features; P2 VS Code and Turborepo features
**Avoids:** Pitfall 6 (Vitest `projects` root config — per-package configs used instead)

### Phase Ordering Rationale

- The 5-phase structure mirrors the dependency graph: infrastructure before packages before app before tooling before tests. Each phase produces a state that can be independently verified.
- JIT package architecture (no compilation in packages) keeps the dependency graph flat — Phase 2 packages do not need their own build task, which simplifies Phase 1's `turbo.json` and prevents the Turborepo task sequencing complexity.
- Biome and VS Code are decoupled from the build pipeline — they can be added after a working build is confirmed without risk of breaking it.
- Vitest is separated into its own final phase because it is purely additive and the most likely to grow in scope beyond the initial milestone.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Package Extraction):** The alias strategy decision (Option A: Vite aliases vs. Option B: workspace imports) has trade-offs and the PITFALLS research recommends a hybrid (workspace imports for TypeScript/Vitest, `resolve.alias` for Vite). Implementation details of the hybrid need careful specification.
- **Phase 3 (App Migration):** Vite 6 plugin compatibility for `vite-plugin-react-rich-svg` and `vite-plugin-generate-file` is unverified. These should be checked against Vite 6 peer deps before committing to the upgrade.

Phases with standard patterns (skip deeper research):
- **Phase 1 (Scaffolding):** Bun + Turborepo root setup is fully documented in official docs with no ambiguity.
- **Phase 4 (Biome + VS Code):** Biome monorepo config is well-documented; the `"root": false` pattern is the only gotcha and is already captured.
- **Phase 5 (Vitest):** Per-package Vitest + Turborepo integration is covered by the official Turborepo Vitest guide.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Versions verified via official docs and release notes; Bun/Turborepo edge cases (prune, lockfile format) have MEDIUM confidence based on GitHub issues |
| Features | HIGH | Feature table derived from official Turborepo, Bun, Biome, and VS Code docs; P1 vs P2 split is well-grounded |
| Architecture | HIGH | JIT package pattern is official Turborepo recommendation; dual-Vite-build pattern is specific to this project but well-reasoned; no direct Figma+Turborepo precedent found |
| Pitfalls | HIGH | 7 of 8 pitfalls verified against official docs or confirmed GitHub issues with issue numbers |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Vite 6 plugin compatibility:** `vite-plugin-react-rich-svg` and `vite-plugin-generate-file` were not explicitly verified against Vite 6. Check peer deps during Phase 3 before confirming the Vite upgrade. Fallback: use Vitest 3.x with Vite 5 (Path B from STACK.md).
- **Bun `turbo prune` not supported:** Not a blocker for v1 (no CI/Docker scope), but should be documented as a known limitation in the template README for future contributors.
- **Biome SCSS lint gap:** Biome does not lint `.scss` files (roadmap 2026 feature). The existing SCSS workflow is unaffected, but developers expecting lint coverage on SCSS may be surprised. Document this explicitly.
- **`packages/ui` vitest.config.ts environment:** ARCHITECTURE.md specifies `jsdom` but STACK.md recommends `happy-dom` over `jsdom` for Vitest 4 compatibility. Use `happy-dom` — resolve this inconsistency in Phase 5 planning.

## Sources

### Primary (HIGH confidence)
- [Turborepo docs — structuring a repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
- [Turborepo docs — internal packages](https://turborepo.dev/docs/core-concepts/internal-packages)
- [Turborepo docs — Vitest guide](https://turborepo.dev/docs/guides/tools/vitest)
- [Turborepo docs — configuring tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks)
- [Vitest 4.0 migration guide](https://vitest.dev/guide/migration.html)
- [Vitest projects guide](https://vitest.dev/guide/projects)
- [Bun workspaces docs](https://bun.com/docs/guides/install/workspaces)
- [Biome getting started](https://biomejs.dev/guides/getting-started/)
- [Biome monorepo guide](https://biomejs.dev/guides/big-projects/)
- [Figma plugin bundling constraint](https://developers.figma.com/docs/plugins/libraries-and-bundling/)

### Secondary (MEDIUM confidence)
- [Turborepo 2.9 release blog](https://turborepo.dev/blog/2-9) — Bun support, 2.9.4 version confirmation
- [Vitest 4.0 blog](https://vitest.dev/blog/vitest-4) — breaking changes, Browser Mode stable
- [Biome roadmap 2026](https://biomejs.dev/blog/roadmap-2026/) — SCSS planned, current gaps
- [vite-plugin-singlefile GitHub](https://github.com/richardtallent/vite-plugin-singlefile) — v2.3.0 Vite 6 support
- [TypeScript monorepo best practice 2026](https://hsb.horse/en/blog/typescript-monorepo-best-practice-2026/) — cross-references official docs

### Tertiary (LOW confidence)
- [Biome monorepo nested config (community gist)](https://gist.github.com/shirakaba/83f456566231580d525169236a350e73) — cross-verified with official Biome v2 docs
- [Bun + Turborepo compatibility (bun-turborepo-hell blog)](https://www.fgbyte.com/blog/02-bun-turborepo-hell/) — confirmed via GitHub issues
- Bun path alias issues: GitHub #14694, #21056 (open issues, behavior confirmed)
- Turborepo `packageManager` format: GitHub issue #707
- Turborepo + Bun lockfile: GitHub issues #9628, #11007
- Turborepo persistent tasks race: GitHub issue #8673

---
*Research completed: 2026-04-09*
*Ready for roadmap: yes*
