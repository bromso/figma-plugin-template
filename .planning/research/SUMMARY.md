# Project Research Summary

**Project:** figma-plugin-template
**Domain:** Figma plugin boilerplate — Turborepo monorepo (v1.0) + react-figma-ui component library and Storybook (v1.1)
**Researched:** 2026-04-09
**Confidence:** MEDIUM

## Executive Summary

This project is a Figma plugin boilerplate that undergoes two sequential milestones: a monorepo infrastructure overhaul (v1.0) followed by a UI component library integration with Storybook documentation (v1.1). The existing codebase is already a functional single-repo Figma plugin built with React 18, Vite, TypeScript, SCSS/CSS Modules, and monorepo-networker for typed plugin/UI messaging. The v1.0 milestone formally migrates this to a Turborepo workspace with Bun as the package manager, Biome for lint/format, and Vitest for unit testing. The v1.1 milestone adds react-figma-ui (a React wrapper around the figma-plugin-ds design system) and Storybook 10 for component documentation, landing in a dedicated `apps/storybook/` Turborepo application.

The recommended approach is staged and dependency-ordered. The monorepo tooling must be stable before any component library work begins, because Storybook and testing infrastructure depend on correct workspace resolution. The two most consequential technical decisions are: (1) Vite must be upgraded from v5 to v6 to satisfy Vitest 4.x's peer dependency — all existing Vite plugins must be verified compatible before proceeding; and (2) the single-file output constraint from vite-plugin-singlefile — which Figma requires — must be preserved through the monorepo restructure by ensuring all workspace packages are imported via `resolve.alias` pointing to `src/` directories, never via package-name resolution that Rollup may treat as external.

The primary risks are concentrated in the v1.0 monorepo restructuring phase: workspace package boundaries breaking Vite's bundling behavior, path aliases silently failing in Bun's runtime, and Turborepo caching only working correctly if per-package Vitest configs are used instead of the root-level `projects` feature. The v1.1 risks are more isolated: react-figma-ui uses globally-scoped CSS class names from figma-plugin-ds that can collide with existing SCSS, and Storybook needs its own Vite configuration that deliberately excludes vite-plugin-singlefile. Both v1.1 risks have clear, low-cost mitigations documented in research.

## Key Findings

### Recommended Stack

The v1.0 tooling additions keep the existing React 18 + TypeScript + SCSS + monorepo-networker stack untouched inside packages — only the orchestration layer changes. Vite must be upgraded from 5 to 6 to unlock Vitest 4.x. Turborepo 2.9.x is the current stable release with first-class Bun support and uses the `tasks` format (the deprecated `pipeline` format must not be used). Bun 1.3.x replaces npm as the package manager with workspace protocol support. Biome 2.4.10 replaces ESLint and Prettier as a single-binary linter/formatter. Vitest 4.1.x requires Vite 6+, creating a forced upgrade. The upgrade target is Vite 6.0.0 (not 7 or 8), minimizing plugin compatibility risk while satisfying Vitest's peer dependency. vite-plugin-singlefile must be updated from 2.0.3 to 2.3.0, which explicitly resolves the Vite 6 peer dependency conflict.

For v1.1, react-figma-ui@1.1.0 is the correct stable version. The alpha v2.0.0-alpha.1 uses `patch-package` as a runtime dependency (a significant red flag) and must not be used. Storybook 10.3.5 with `@storybook/react-vite` is the recommended setup. Storybook 10 bundles all previously separate addons (viewport, controls, docs, actions) into the core package — `@storybook/addon-essentials` is deprecated and must not be installed.

**Core technologies (v1.0):**
- **Turborepo 2.9.x:** Task pipeline and caching — use `tasks` key (not deprecated `pipeline`); Bun first-class supported
- **Bun 1.3.x:** Package manager replacing npm — faster installs, `workspace:*` protocol, text `bun.lock` format (commit it)
- **Biome 2.4.10:** Unified lint + format — replaces absent ESLint + Prettier; no SCSS support (acceptable)
- **Vitest 4.1.x:** Unit testing — requires Vite 6+; per-package configs required for Turborepo caching; use `happy-dom` over `jsdom`
- **Vite 6.0.0:** Upgrade from v5 — required by Vitest 4; all existing plugins verified compatible
- **vite-plugin-singlefile 2.3.0:** Upgrade from 2.0.3 — Vite 6 peer dep resolved in 2.2.1+

**Core technologies (v1.1):**
- **react-figma-ui@1.1.0:** 14 native Figma UI components as React wrappers over figma-plugin-ds
- **Storybook 10.3.5 + @storybook/react-vite:** Component documentation — all addons bundled in core; dedicated `apps/storybook/` app

### Expected Features

**Must have (v1.0 — table stakes):**
- `apps/figma-plugin` + `packages/ui` + `packages/common` + `packages/typescript-config` workspace structure
- Root `package.json` with Bun workspaces and `"packageManager": "bun@1.3.x"` (no `v` prefix)
- `workspace:*` protocol for internal deps; `exports` field in each package pointing to `src/`
- Root `turbo.json` with `build`, `dev`, `lint`, `test`, and `test:watch` tasks (using `tasks` key)
- Root `biome.json` with lint + format; per-package `biome.json` with `"root": false`
- VS Code `settings.json` (Biome as default formatter) + `extensions.json`
- Per-package `vitest.config.ts` files and `test` scripts for Turborepo caching
- `bun.lock` committed to repository

**Must have (v1.1 — table stakes):**
- react-figma-ui@1.1.0 installed in `packages/ui` dependencies
- `figma-plugin-ds` CSS imported globally before project SCSS in both plugin entry and Storybook preview
- All 14 react-figma-ui components re-exported from `packages/ui/src/index.ts`
- `apps/storybook/` as a dedicated Turborepo app (not `packages/storybook/`)
- Stories for all 14 components with Controls and Autodocs enabled
- Custom Storybook viewport presets matching Figma plugin dimensions (240x400, 320x500, 400x600)
- `storybook` (persistent, cache:false) and `build-storybook` (cached) tasks in `turbo.json`
- Empty `bun.lockb` file at repo root (Storybook's Bun detection workaround)
- `*.stories.*` excluded from `packages/ui` build task `inputs` to preserve Turborepo cache

**Should have (differentiators):**
- Storybook background color presets: white + Figma dark `#2c2c2c`
- SCSS `additionalData` configured in Storybook `viteFinal` for global variable availability
- VS Code `.code-workspace` and `launch.json` compound debug config

**Defer to future milestones:**
- Storybook published to GitHub Pages or Chromatic
- `storybook-addon-designs` for Figma design links
- Visual regression testing via Chromatic
- Vite 7 or 8 upgrade (Rolldown bundler — bigger change)
- Changesets for independent package versioning

### Architecture Approach

The monorepo uses JIT (Just-in-Time) internal packages — `packages/common` and `packages/ui` export raw TypeScript source with no separate build step. `apps/figma-plugin` remains the only package with a build output (`dist/`), and its two Vite configs (`vite.config.ui.ts`, `vite.config.plugin.ts`) do all bundling. Plugin sandbox code stays inside `apps/figma-plugin` because it references Figma globals unavailable outside the Figma runtime. Package imports use workspace protocol for TypeScript and Vitest resolution, but Vite configs use `resolve.alias` pointing to `packages/*/src/` to ensure vite-plugin-singlefile inlines everything into a self-contained output.

For v1.1, Storybook lives in `apps/storybook/` — not `packages/storybook/` — because it is a consumer application that produces a static site, not a library consumed by other workspace members. Storybook's Vite instance is completely independent of `apps/figma-plugin`'s Vite configs. The two instances must never share plugin arrays, especially vite-plugin-singlefile which is incompatible with Storybook's multi-chunk build output.

**Major components:**
1. `apps/figma-plugin/` — owns both Vite configs, `figma.manifest.ts`, and plugin sandbox source; sole producer of `dist/`; single-file output constraint applies here only
2. `apps/storybook/` — Storybook documentation app; own Vite instance via `viteFinal`; reads stories from `packages/ui/src/**/*.stories.tsx`; must NOT include vite-plugin-singlefile
3. `packages/ui/` — JIT React component package; hosts react-figma-ui re-exports and stories; figma-plugin-ds CSS imported here
4. `packages/common/` — JIT shared types and monorepo-networker side definitions; source-only, no build step, no Figma globals
5. `packages/typescript-config/` — shared tsconfig bases (`base.json`, `react.json`, `node.json`); no code, no build

### Critical Pitfalls

1. **vite-plugin-singlefile stops bundling workspace packages** — Use `resolve.alias` in each Vite config pointing to `packages/*/src/` directories, not package names. Never allow Vite to treat internal packages as external. Verify `dist/plugin.js` and `dist/index.html` contain no `import` statements after every restructuring step.

2. **Path aliases silently fail in Bun runtime** — Bun has confirmed open issues where `tsconfig.paths` from a nested package are not applied when code crosses package boundaries (issues #14694, #21056). Use `workspace:*` package name imports for runtime and Vitest resolution; keep `resolve.alias` for Vite builds only.

3. **Vitest `projects` root config disables Turborepo per-package caching** — A root-level `vitest.config.ts` with `projects: [...]` makes Turborepo unable to cache test results per package. Each package must have its own `vitest.config.ts` and `"test"` script. Use a shared `vitest.shared.ts` for deduplication.

4. **Biome nested config without `"root": false`** — Without this field, nested `biome.json` stops the config inheritance chain. Always set `"root": false` and `"extends": "//"` in every per-package `biome.json`. The `"//"` microsyntax always references the repository root config.

5. **vite-plugin-singlefile conflicts with Storybook build** — Storybook expects a multi-chunk output; singlefile produces one file. The `apps/storybook/` app must have a completely independent Vite configuration. Use the `viteFinal` filter to strip out any singlefile plugin if it appears in the merged config.

6. **Bun v1.2+ lockfile breaks Storybook's package manager detection** — Storybook detects Bun by the presence of `bun.lockb` (binary), not `bun.lock` (text, default since Bun 1.2). Storybook falls back to npm and may invoke `npm install`, mutating the workspace. Fix: `touch bun.lockb` at the repo root alongside `bun.lock`. Commit and document this file.

7. **react-figma-ui global CSS class names collide with existing SCSS** — figma-plugin-ds uses unscoped BEM names (`.button`, `.input`, `.checkbox`, `.label`). Audit existing SCSS for collisions before adding the stylesheet. Import `figma-plugin-ds/dist/figma-plugin-ds.css` before project SCSS so project styles can override Figma DS defaults.

## Implications for Roadmap

The research reveals a natural 6-phase sequential structure across both milestones.

### Phase 1: Monorepo Scaffolding (v1.0)
**Rationale:** Everything depends on Bun workspaces and Turborepo existing. The `packageManager` field must be correct before any `turbo` command runs.
**Delivers:** Working `bun install` across the repo; `turbo` recognizes the workspace; `bun.lock` committed; `turbo.json` with task stubs
**Avoids:** Pitfall — `packageManager` `v` prefix rejected by Turborepo; lockfile format committed from the start

### Phase 2: Package Extraction and Vite Migration (v1.0)
**Rationale:** The highest-risk phase. Must be isolated so failures are easy to bisect. `resolve.alias`-to-`src/` strategy must be established before any package code moves. Order within phase: `typescript-config` → `common` → `ui` → `apps/figma-plugin` Vite config migration.
**Delivers:** `packages/typescript-config`, `packages/common`, `packages/ui` with correct `exports` fields; `apps/figma-plugin` with updated Vite configs; verified `dist/` output loadable in Figma Desktop
**Avoids:** Pitfall 1 (vite-plugin-singlefile bundling), Pitfall 2 (Bun path aliases), Pitfall 7 (manifest path misalignment), Pitfall 8 (parallel watch race — common is source-only)

### Phase 3: Biome + Vitest Setup (v1.0)
**Rationale:** Biome and Vitest are additive and independent of the build pipeline. Adding them after a working build is confirmed means they validate real behavior. Biome and Vitest can be done in either order.
**Delivers:** Root `biome.json`; per-package nested configs with `"root": false`; per-package `vitest.config.ts`; `test` and `test:watch` Turborepo tasks; VS Code `settings.json` + `extensions.json`; second `turbo run test` shows cache hits
**Avoids:** Pitfall 3 (Biome nested config), Pitfall 4 (Vitest `projects` disabling caching)

### Phase 4: react-figma-ui Integration (v1.1)
**Rationale:** The component library integration is a contained change to `packages/ui`. Must follow a stable monorepo foundation. Completing this before Storybook means component behavior is verified in the real Figma plugin before stories are written.
**Delivers:** react-figma-ui installed in `packages/ui`; all 14 components re-exported; figma-plugin-ds CSS at app entry; demo `Button.tsx` and `Button.module.scss` removed; `app.tsx` updated; plugin builds and renders in Figma
**Avoids:** CSS class name collision pitfall — audit existing SCSS for conflicts with figma-plugin-ds unscoped names before import

### Phase 5: Storybook Setup and Stories (v1.1)
**Rationale:** Storybook is the most externally-dependent addition. It must be added last to a stable foundation. The Bun lockfile detection workaround, independent Vite instance, and SCSS global resolution all need careful sequencing.
**Delivers:** `apps/storybook/` with `@storybook/react-vite`; stories for all 14 components; plugin-dimension viewport presets; Autodocs; `storybook` and `build-storybook` Turborepo tasks; `bun.lockb` workaround committed
**Avoids:** Pitfall — vite-plugin-singlefile incompatibility with Storybook; Bun lockfile detection failure; JIT package resolution in Storybook viteFinal; SCSS global variables missing in Storybook

### Phase Ordering Rationale

- Infrastructure before packages before app: the dependency graph is strictly one-directional.
- JIT package architecture keeps the dependency graph flat — packages have no build tasks, which simplifies task sequencing and eliminates race conditions in dev mode.
- Biome and Vitest are decoupled from the build pipeline and can be added after a working build without risk of breaking it.
- react-figma-ui before Storybook: stories are consumers of the component exports; components must exist and be verified working first.
- Storybook last: it has the most external dependencies (Bun detection quirk, separate Vite instance, SCSS resolution) and benefits from everything else being stable.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Package Extraction and Vite Migration):** Vite 6 plugin compatibility for `vite-plugin-react-rich-svg` and `vite-plugin-generate-file` is not yet verified. Check peer deps before committing to the upgrade. Fallback option: Vitest 3.x with Vite 5 is available if any plugin breaks.
- **Phase 5 (Storybook):** Storybook 10 is recently released. The SCSS `additionalData` via `viteFinal` and the `@ui/` custom SCSS importer patterns are community-confirmed but not from official documentation. Validate during implementation.

Phases with standard patterns (skip deeper research):
- **Phase 1 (Monorepo Scaffolding):** Bun + Turborepo root setup is fully documented in official docs with no ambiguity.
- **Phase 3 (Biome + Vitest):** Both have official Turborepo integration guides that cover the exact patterns needed.
- **Phase 4 (react-figma-ui):** Adding an npm dependency with re-exports is mechanical; the CSS import order is the only gotcha and is well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Versions verified via npm registry and official release notes; Vite 6 plugin compatibility for existing plugins is inferred from changelogs, not fully validated |
| Features | MEDIUM | v1.0 feature table is HIGH (official docs); react-figma-ui component props are MEDIUM (aggregated from README, not verified from source); Storybook 10 version timeline from news sources not official release notes |
| Architecture | HIGH | Turborepo official docs confirm `apps/` placement; npm registry confirmed all package versions and peer deps; filesystem inspection confirmed current project state |
| Pitfalls | HIGH | Most critical pitfalls traced to specific GitHub issues with issue numbers; Biome nested config from official docs; Figma single-file constraint from official Figma docs |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Vite 6 plugin compatibility:** `vite-plugin-react-rich-svg` and `vite-plugin-generate-file` were not explicitly verified against Vite 6. Check peer deps during Phase 2 before confirming the Vite upgrade. Fallback: use Vitest 3.x with Vite 5.
- **react-figma-ui component prop APIs:** The documented props are aggregated from README excerpts and npm metadata, not verified from source. Verify exact prop names at install time, especially `Select` (may be named `SelectMenu`) and `OnboardingTip` (component name may differ).
- **Storybook stories glob for cross-package:** Known Storybook issue (#31837) with glob resolution across workspace packages. The safer pattern is keeping stories in `apps/storybook/src/stories/` importing from `@repo/ui`, rather than co-locating stories in `packages/ui/src/`. Evaluate during Phase 5.
- **react-figma-ui maintenance trajectory:** Package not updated in over a year; v2 alpha uses `patch-package`. Not a blocker for React 18, but monitor for React 19 compatibility. Fallback options: fork-and-patch, or switch to `@thinkbuff/figma-react`.
- **`happy-dom` vs `jsdom` in `packages/ui`:** STACK.md recommends `happy-dom` for Vitest 4 compatibility. Use `happy-dom` across all packages — this is the correct choice.

## Sources

### Primary (HIGH confidence)
- npm registry — react-figma-ui@1.1.0, storybook@10.3.5, @storybook/react-vite@10.3.5, figma-plugin-ds@1.0.1, turbo@2.9.x — versions and peer deps (verified 2026-04-09)
- https://turborepo.dev/docs/guides/tools/storybook — Storybook `apps/` placement, colocated stories, cache inputs exclusion
- https://turborepo.dev/docs/guides/tools/vitest — per-package Vitest config strategy
- https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository — `apps/` vs `packages/` distinction
- https://biomejs.dev/guides/big-projects/ — Biome nested config with `"root": false`
- https://www.figma.com/plugin-docs/api/figma-ui/ — plugin window dimensions and single-file constraint
- https://storybook.js.org/docs/essentials/viewport — viewport merged into Storybook core in v8+
- https://storybook.js.org/docs/api/main-config/main-config-vite-final — viteFinal API
- Filesystem inspection of `apps/figma-plugin/vite.config.ui.ts`, `packages/ui/`, `turbo.json`, `biome.json` — current project state (direct read)

### Secondary (MEDIUM confidence)
- https://github.com/JB1905/react-figma-ui — component list and prop APIs from README
- https://storybook.js.org/docs/get-started/frameworks/react-vite — Storybook React + Vite framework setup
- https://storybook.js.org/docs/addons/addon-migration-guide — Storybook 10 addon deprecations
- Storybook issue #30366 — Bun v1.2+ lockfile detection failure and `bun.lockb` workaround
- https://github.com/oven-sh/bun/issues/14694 and #21056 — Bun tsconfig paths cross-package resolution bug
- https://github.com/vercel/turborepo/issues/8673 — persistent tasks race condition
- https://github.com/biomejs/biome/issues/6882 — Biome nested config `"root": false`
- InfoQ: Storybook v9 released July 2025 — version timeline context

### Tertiary (LOW confidence)
- Community sources for Storybook SCSS + CSS Modules native Vite support (multiple sources agree, no single authoritative doc)
- https://www.fgbyte.com/blog/02-bun-turborepo-hell/ — Bun + Turborepo integration edge cases
- https://github.com/vercel/turborepo/issues/707 — `packageManager` field format
- https://github.com/vercel/turborepo/issues/9628 and #11007 — Turborepo + Bun lockfile format issues

---
*Research completed: 2026-04-09*
*Ready for roadmap: yes*
