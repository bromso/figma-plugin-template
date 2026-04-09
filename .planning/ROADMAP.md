# Roadmap: Figma Plugin Template

## Milestones

- ✅ **v1.0 Monorepo & DX Overhaul** — Phases 1-5 (shipped 2026-04-09)
- ✅ **v1.1 UI Components & Skill Optimization** — Phases 6-9 (shipped 2026-04-09)
- 🚧 **v1.2 Dependency Upgrades & Bundle Optimization** — Phases 10-15 (in progress)

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

### 🚧 v1.2 Dependency Upgrades & Bundle Optimization (In Progress)

**Milestone Goal:** Upgrade all core dependencies to current versions, replace Sass with Tailwind CSS + shadcn/ui, and add bundle analysis tooling.

**Ordering constraints:**
- Vite 8 + TypeScript 6 before React 19 (React 19 types require TS 6)
- React 19 before Storybook 10 (Storybook 10 requires React 19)
- Tailwind CSS + shadcn/ui before component migration
- Component migration before Storybook story updates
- All upgrades before verification phase

- [x] **Phase 10: Vite 8 + TypeScript 6 + Figma Typings** - Upgrade build toolchain foundation (completed 2026-04-09)
- [x] **Phase 11: React 19** - Upgrade React and type definitions (completed 2026-04-09)
- [ ] **Phase 12: Tailwind CSS 4.x + Bundle Analysis** - Replace Sass, configure design system, add analyze script
- [ ] **Phase 13: shadcn/ui Component Migration** - Install shadcn/ui, apply Figma tokens, replace react-figma-ui
- [ ] **Phase 14: Storybook 10 Upgrade** - Migrate Storybook to ESM-only v10 with new components
- [ ] **Phase 15: Full-Stack Verification** - Confirm tests, build, Storybook, and Figma runtime all pass

## Phase Details

### Phase 10: Vite 8 + TypeScript 6 + Figma Typings
**Goal**: The build toolchain runs on current versions — Vite 8 with Rolldown, TypeScript 6.0, and up-to-date Figma API types
**Depends on**: Phase 9 (previous milestone complete)
**Requirements**: BUILD-01, BUILD-02, FIG-01
**Success Criteria** (what must be TRUE):
  1. `bun run build` completes without errors using Vite 8 and Rolldown
  2. `bun run types` type-checks cleanly under TypeScript 6.0
  3. `@figma/plugin-typings` is at 1.123 and new Figma API symbols resolve in the plugin sandbox code
  4. Both Vite configs (`vite.config.ui.ts` and `vite.config.plugin.ts`) run without deprecation errors
**Plans**: 2 plans
Plans:
- [x] 10-01-PLAN.md — Upgrade Vite 8, TypeScript 6, Figma typings, and update configs
- [x] 10-02-PLAN.md — Add root types script and full verification

### Phase 11: React 19
**Goal**: React is upgraded to version 19 with correct type definitions, and existing UI code compiles and renders correctly
**Depends on**: Phase 10
**Requirements**: FW-01
**Success Criteria** (what must be TRUE):
  1. `react` and `react-dom` are at version 19.x in all workspace packages
  2. `@types/react` and `@types/react-dom` are at the React 19-compatible versions
  3. `bun run types` passes with no new TypeScript errors after the React upgrade
  4. The plugin UI renders in the browser (`bun run dev:ui-only`) without console errors
**Plans**: 1 plan
Plans:
- [x] 11-01-PLAN.md — Bump React to 19.x and verify types, tests, and build

### Phase 12: Tailwind CSS 4.x + Bundle Analysis
**Goal**: Sass is replaced with Tailwind CSS 4.x configured for the single-file iframe constraint, and a bundle analysis script is available
**Depends on**: Phase 11
**Requirements**: BUILD-03, BUILD-04, FW-03
**Success Criteria** (what must be TRUE):
  1. Sass and all `*.scss` files are removed from the project; Tailwind CSS 4.x is the sole styling mechanism
  2. `bun run dev:ui-only` serves the UI with Tailwind styles applied correctly in the browser
  3. `bun run build` produces a single `index.html` with all Tailwind styles inlined (no external CSS references)
  4. `bun run analyze` generates a visual bundle report for the UI output
**Plans**: 2 plans
Plans:
- [ ] 12-01-PLAN.md — Install Tailwind CSS 4.x, replace Sass/SCSS with Tailwind utilities, verify single-file build
- [ ] 12-02-PLAN.md — Add bundle analysis tooling and visual verification checkpoint

### Phase 13: shadcn/ui Component Migration
**Goal**: shadcn/ui with Radix primitives replaces react-figma-ui, Figma design tokens are applied, all 14 component equivalents exist, and unmaintained packages are removed
**Depends on**: Phase 12
**Requirements**: UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. shadcn/ui and Radix UI primitives are installed; react-figma-ui and figma-plugin-ds are absent from all `package.json` files
  2. Figma design tokens (colors, typography, spacing, radii) are declared in the Tailwind config and reflected in the shadcn/ui theme
  3. All 14 component equivalents are present and usable: Button, Checkbox, Input, Label, Select, Switch, Textarea, Radio, Icon, IconButton, Disclosure/Accordion, SectionTitle, OnboardingTip/Alert, Type/Text
  4. The postinstall ESM workaround script is removed; `bun install` runs without errors
  5. The plugin UI rendered via `bun run dev:ui-only` shows visually correct Figma-native-looking components
**Plans**: TBD
**UI hint**: yes

### Phase 14: Storybook 10 Upgrade
**Goal**: Storybook is upgraded to the ESM-only v10, all existing stories are migrated, and the new shadcn/ui components are documented with Controls and Autodocs
**Depends on**: Phase 13
**Requirements**: FW-02
**Success Criteria** (what must be TRUE):
  1. Storybook 10.x launches without errors via `bun run storybook`
  2. All previously existing component stories render correctly with no console errors
  3. Each shadcn/ui component replacement has at least one story with Autodocs and interactive Controls
  4. Storybook configuration files are migrated to ESM format; no CommonJS `require()` in config
**Plans**: TBD
**UI hint**: yes

### Phase 15: Full-Stack Verification
**Goal**: Every layer of the project — tests, production build, Storybook, and live Figma runtime — is confirmed working after all upgrades
**Depends on**: Phase 14
**Requirements**: VER-01, VER-02, VER-03, VER-04
**Success Criteria** (what must be TRUE):
  1. `bun run test` passes all existing tests (7 tests across 2 packages) with no failures or skips
  2. `bun run build` produces `dist/plugin.js` and `dist/index.html` as valid single-file outputs with no external references
  3. All Storybook stories render with the new shadcn/ui components, Controls work, and Autodocs pages load
  4. The plugin loaded in Figma renders a UI that is visually consistent with native Figma plugin appearance
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
| 10. Vite 8 + TypeScript 6 + Figma Typings | v1.2 | 2/2 | Complete    | 2026-04-09 |
| 11. React 19 | v1.2 | 1/1 | Complete    | 2026-04-09 |
| 12. Tailwind CSS 4.x + Bundle Analysis | v1.2 | 0/2 | Not started | - |
| 13. shadcn/ui Component Migration | v1.2 | 0/? | Not started | - |
| 14. Storybook 10 Upgrade | v1.2 | 0/? | Not started | - |
| 15. Full-Stack Verification | v1.2 | 0/? | Not started | - |
