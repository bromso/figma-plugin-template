# Roadmap: Figma Plugin Template

## Milestones

- ✅ **v1.0 Monorepo & DX Overhaul** — Phases 1-5 (shipped 2026-04-09)
- ✅ **v1.1 UI Components & Skill Optimization** — Phases 6-9 (shipped 2026-04-09)
- ✅ **v1.2 Dependency Upgrades & Bundle Optimization** — Phases 10-15 (shipped 2026-04-10)
- 🚧 **v1.3 Code Audit Resolution** — Phases 16-20 (in progress)

## Phases

<details>
<summary>✅ v1.0 Monorepo & DX Overhaul (Phases 1-5) — SHIPPED 2026-04-09</summary>

- [x] Phase 1: Monorepo Scaffolding (1/1 plans) — completed 2026-04-09
- [x] Phase 2: Package Extraction (2/2 plans) — completed 2026-04-09
- [x] Phase 3: Build Pipeline Verification (1/1 plans) — completed 2026-04-09
- [x] Phase 4: Biome & VS Code Config (2/2 plans) — completed 2026-04-09
- [x] Phase 5: Vitest & DX Polish (2/2 plans) — completed 2026-04-09

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.1 UI Components & Skill Optimization (Phases 6-9) — SHIPPED 2026-04-09</summary>

- [x] Phase 6: react-figma-ui Integration (2/2 plans) — completed 2026-04-09
- [x] Phase 7: Storybook Setup and Stories (2/2 plans) — completed 2026-04-09
- [x] Phase 8: Claude Skills Optimization (2/2 plans) — completed 2026-04-09
- [x] Phase 9: License, Security, Contributing & README Update (2/2 plans) — completed 2026-04-09

Full details: [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)

</details>

<details>
<summary>✅ v1.2 Dependency Upgrades & Bundle Optimization (Phases 10-15) — SHIPPED 2026-04-10</summary>

- [x] Phase 10: Vite 8 + TypeScript 6 + Figma Typings (2/2 plans) — completed 2026-04-09
- [x] Phase 11: React 19 (1/1 plans) — completed 2026-04-09
- [x] Phase 12: Tailwind CSS 4.x + Bundle Analysis (2/2 plans) — completed 2026-04-09
- [x] Phase 13: shadcn/ui Component Migration (3/3 plans) — completed 2026-04-09
- [x] Phase 14: Storybook 10 Upgrade (2/2 plans) — completed 2026-04-10
- [x] Phase 15: Full-Stack Verification (2/2 plans) — completed 2026-04-10

Full details: [milestones/v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md)

</details>

### 🚧 v1.3 Code Audit Resolution (In Progress)

**Milestone Goal:** Resolve all findings from the post-v1.2 code audit: eliminate runtime bugs, close type safety gaps, reduce bundle size, enable React Compiler, and establish meaningful test coverage.

**Ordering constraints:**
- Bug fixes and dark mode (Phase 16) before type safety (Phase 17) so TS checks run on stable code
- Type safety (Phase 17) before bundle analysis (Phase 18) so `bun run types` can validate optimizations
- Bundle analysis (Phase 18) before React Compiler (Phase 19) to measure baseline and compiler impact
- React Compiler (Phase 19) before test coverage (Phase 20) so tests validate compiled output

- [x] **Phase 16: Bug Fixes + Dark Mode** — Resolve all code review findings and dark mode token gap (completed 2026-04-11)
- [x] **Phase 17: Type Safety** — tsc pipeline wiring + registerIcons API + StaticIconNameMap (completed 2026-04-19)
- [x] **Phase 18: Bundle Analysis + Optimization** — Bundle documented, Radix unified, Lucide named (completed 2026-04-19)
- [x] **Phase 19: React 19 Compiler** — React Compiler active, no memoization to remove (completed 2026-04-19)
- [ ] **Phase 20: Tests + DX + Dependency Hygiene** — Interaction tests, Storybook play tests, polymorphic Type, docs, dep cleanup

## Phase Details

### Phase 16: Bug Fixes + Dark Mode
**Goal**: All runtime bugs from the v1.2 code audit are fixed, and dark mode is either fully supported or explicitly removed
**Depends on**: Phase 15 (previous milestone complete)
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, THEME-01
**Success Criteria** (what must be TRUE):
  1. `main.tsx` uses a null-guard instead of unchecked `as HTMLElement` cast
  2. `ButtonProps` is defined in `button.tsx` and importable from `@repo/ui`
  3. `AlertAction` is exported from `@repo/ui` index
  4. `Icon` component `name` prop is narrowed to `keyof typeof iconMap`
  5. `index.html` has conformant `<!DOCTYPE html>` + `<html>/<head>/<body>` structure
  6. `postcssUrl` uses `pathToFileURL` for path encoding
  7. Dark mode tokens either defined under `.dark` or all `dark:` variants removed with documented decision
**Plans**: 7 plans
- [x] 16-01 — BUG-01 main.tsx null guard + test
- [x] 16-02 — BUG-02 ButtonProps named export
- [x] 16-03 — BUG-03 AlertAction barrel re-export
- [x] 16-04 — BUG-04 Iconify migration (offline preload, StaticIconName, call-site rename)
- [ ] 16-05 — BUG-05 Conformant index.html + singlefile verification
- [ ] 16-06 — BUG-06 postcss-url pathToFileURL callback + spaces smoke test
- [ ] 16-07 — THEME-01 html.figma-dark OKLCH tokens + Tailwind @custom-variant

### Phase 17: Type Safety
**Goal**: TypeScript is actively type-checked in `packages/ui`, and `Icon` supports runtime registration with a typed extensibility API
**Depends on**: Phase 16
**Requirements**: TYPE-01, TYPE-02
**Success Criteria** (what must be TRUE):
  1. `packages/ui/package.json` has a `types` script running `tsc --noEmit`
  2. Turborepo `types` pipeline task runs across all packages including `packages/ui`
  3. `bun run types` from repo root passes with no TypeScript errors
  4. `Icon` component supports `registerIcon(name, component)` runtime registration
  5. A typed `ICONS` const and `StaticIconName` type are exported for static consumers
  6. `<Icon name="unknown" />` warns and returns null without throwing
**Plans**: 2 plans
- [x] 17-01 — TYPE-01 tsc pipeline wiring (tsconfig.node.json, types scripts, @types/node, latent error fixes)
- [x] 17-02 — TYPE-02 registerIcons API + StaticIconNameMap + ICONS + unknown-name guard + tests

### Phase 18: Bundle Analysis + Optimization
**Goal**: Bundle size is documented and optimized by fixing Radix import strategy and ensuring tree-shakeable Lucide imports
**Depends on**: Phase 17
**Requirements**: PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. `.planning/phases/18-*/18-BUNDLE-REPORT.md` exists with total bundle size, top 5 modules, Radix strategy, Lucide strategy, and actions taken
  2. `packages/ui/package.json` uses unified `radix-ui` package (no individual `@radix-ui/react-*` packages)
  3. All Lucide imports are named (`import { Plus }`) — no wildcard or namespace imports
  4. `bun run build` succeeds with the new import strategy
**Plans**: 1 plan
- [x] 18-01 — Bundle analysis report + verification of Radix/Lucide strategies (all pre-satisfied from Phase 13)

### Phase 19: React 19 Compiler
**Goal**: React 19 Compiler is active in the build pipeline and redundant manual memoization is removed
**Depends on**: Phase 18
**Requirements**: PERF-04, PERF-05
**Success Criteria** (what must be TRUE):
  1. `babel-plugin-react-compiler` is installed and configured in `vite.config.ui.ts` via `@vitejs/plugin-react` babel options
  2. `bun run build` completes with React Compiler active
  3. Redundant `useMemo`/`useCallback` calls removed where the compiler handles memoization
  4. Any retained manual memoization has `// react-compiler: skip — reason` comments
  5. Existing tests still pass after compiler opt-in
**Plans**: 1 plan
- [x] 19-01 — Install babel-plugin-react-compiler + @rolldown/plugin-babel, configure reactCompilerPreset in vite.config.ui.ts. No useMemo/useCallback existed to remove.

### Phase 20: Tests + DX + Dependency Hygiene
**Goal**: Meaningful interaction test coverage exists for UI components, DX gaps are documented, and unmaintained deps are resolved
**Depends on**: Phase 19
**Requirements**: TEST-01, TEST-02, DX-01, DX-02, DX-03, DEP-01, DEP-02, UI-05
**Success Criteria** (what must be TRUE):
  1. `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` installed
  2. At least 2 interaction tests each for Button, Select, and Accordion
  3. `bun run test` exits 0 with meaningfully more than 7 tests
  4. Storybook 10 `play()` functions exist for Accordion and Select stateful stories
  5. `Type` component accepts a polymorphic `as` prop and renders correct DOM elements
  6. `styles.css` has a comment explaining `@source "."` or uses explicit globs
  7. `vite.config.ui.ts` has a `// MUST be last` comment above `viteSingleFile()`
  8. `docs/WORKTREE-FLOW.md` exists documenting the known worktree merge edge case
  9. `vite-plugin-react-rich-svg` migrated to `vite-plugin-svgr` OR risk documented in package.json with last-verified Vite version
  10. `bun run build-storybook` produces no chunk size warnings (manualChunks configured)
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Monorepo Scaffolding | v1.0 | 1/1 | Complete | 2026-04-09 |
| 2. Package Extraction | v1.0 | 2/2 | Complete | 2026-04-09 |
| 3. Build Pipeline Verification | v1.0 | 1/1 | Complete | 2026-04-09 |
| 4. Biome & VS Code Config | v1.0 | 2/2 | Complete | 2026-04-09 |
| 5. Vitest & DX Polish | v1.0 | 2/2 | Complete | 2026-04-09 |
| 6. react-figma-ui Integration | v1.1 | 2/2 | Complete | 2026-04-09 |
| 7. Storybook Setup and Stories | v1.1 | 2/2 | Complete | 2026-04-09 |
| 8. Claude Skills Optimization | v1.1 | 2/2 | Complete | 2026-04-09 |
| 9. License, Security, Contributing & README | v1.1 | 2/2 | Complete | 2026-04-09 |
| 10. Vite 8 + TypeScript 6 + Figma Typings | v1.2 | 2/2 | Complete | 2026-04-09 |
| 11. React 19 | v1.2 | 1/1 | Complete | 2026-04-09 |
| 12. Tailwind CSS 4.x + Bundle Analysis | v1.2 | 2/2 | Complete | 2026-04-09 |
| 13. shadcn/ui Component Migration | v1.2 | 3/3 | Complete | 2026-04-09 |
| 14. Storybook 10 Upgrade | v1.2 | 2/2 | Complete | 2026-04-10 |
| 15. Full-Stack Verification | v1.2 | 2/2 | Complete | 2026-04-10 |
| 16. Bug Fixes + Dark Mode | v1.3 | 7/7 | Complete    | 2026-04-11 |
| 17. Type Safety | v1.3 | 2/2 | Complete | 2026-04-19 |
| 18. Bundle Analysis + Optimization | v1.3 | 1/1 | Complete | 2026-04-19 |
| 19. React 19 Compiler | v1.3 | 1/1 | Complete | 2026-04-19 |
| 20. Tests + DX + Dependency Hygiene | v1.3 | 0/? | Not started | - |
