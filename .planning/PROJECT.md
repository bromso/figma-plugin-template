# Figma Plugin Template

## What This Is

A Figma plugin boilerplate using React + Vite, designed for building scalable Figma/FigJam plugins. Provides two-process architecture (plugin sandbox + UI iframe) with typed message passing via monorepo-networker.

## Core Value

A ready-to-use Figma plugin template with modern tooling and excellent developer experience that gets you from clone to working plugin in minutes.

## Current State

**Latest milestone:** v1.2 Dependency Upgrades & Bundle Optimization (shipped 2026-04-10)

All core dependencies upgraded. Sass replaced with Tailwind CSS 4.x. react-figma-ui replaced with shadcn/ui + Radix primitives. Storybook upgraded to v10. Bundle analysis tooling added.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- Dual-process plugin architecture (plugin sandbox + UI iframe)
- Typed message passing between sides via monorepo-networker
- React + Vite build pipeline with single-file output
- SCSS/CSS Modules styling with 7-1 architecture
- SVG import as component/url/raw via vite-plugin-react-rich-svg
- Figma manifest generation from TypeScript config
- ✓ Turborepo monorepo structure — v1.0
- ✓ Bun package manager — v1.0
- ✓ Biome linting and formatting — v1.0
- ✓ Vitest testing framework — v1.0
- ✓ VS Code workspace configuration — v1.0
- ✓ react-figma-ui native component library — v1.1
- ✓ Storybook component documentation — v1.1
- ✓ Claude skills optimization — v1.1
- ✓ License, security, contributing docs — v1.1
- ✓ Vite 8 with Rolldown — v1.2
- ✓ TypeScript 6.0 — v1.2
- ✓ React 19 — v1.2
- ✓ @figma/plugin-typings 1.124 — v1.2
- ✓ Tailwind CSS 4.x (replaced Sass) — v1.2
- ✓ shadcn/ui + Radix (replaced react-figma-ui) — v1.2
- ✓ Storybook 10.x ESM-only — v1.2
- ✓ Bundle analysis tooling — v1.2

### Active

<!-- Current scope. Building toward these. -->

(None — next milestone not yet defined)

### Out of Scope

- CI/CD pipeline — future milestone
- Documentation site — future milestone
- Additional plugin templates — future milestone

## Context

- Turborepo monorepo: `apps/figma-plugin`, `apps/storybook`, `packages/common`, `packages/ui`
- Bun 1.3.11 as package manager (sole lockfile: `bun.lock`)
- Vite 8 with Rolldown, two configs in `apps/figma-plugin/` producing single-file output to `dist/`
- TypeScript 6.0, React 19.2, Storybook 10.3
- Tailwind CSS 4.x with @tailwindcss/vite plugin (replaced Sass)
- shadcn/ui + Radix primitives with Figma OKLCH design tokens (replaced react-figma-ui)
- Biome 2.4.10 for linting + formatting (root `biome.json`)
- Vitest 4.x with 7 tests across 2 packages (node + happy-dom environments)
- VS Code multi-root workspace with format-on-save, debug configs, task shortcuts
- JIT source-only packages — `@repo/common` and `@repo/ui` export raw TypeScript
- Plugin side uses `@figma/plugin-typings` 1.124 for Figma API access
- Bundle analysis via `bun run analyze` (rollup-plugin-visualizer)

## Constraints

- **Figma plugin format**: Output must be single `plugin.js` and single `index.html` — no external file references
- **Plugin sandbox**: Plugin code runs in Figma's sandbox with no DOM access
- **Package manager**: Migrating to Bun — all scripts and CI must work with Bun

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Turborepo over Nx | Lighter weight, better fit for template project | ✓ Good — clean task graph, fast builds |
| Bun over pnpm | Faster installs and script execution, simpler toolchain | ✓ Good — sub-second installs, workspace symlinks work |
| Biome over ESLint+Prettier | Single tool for lint+format, faster, zero config | ✓ Good — Biome 2.x, instant linting |
| Three-package split (common, ui, plugin-app) | Clean separation of concerns, reusable packages | ✓ Good — JIT source-only pattern eliminates build steps |
| Vite 6 upgrade | Required for ESM plugin compatibility | ✓ Good — fixed vite-plugin-react-rich-svg ESM loading |
| happy-dom over jsdom | 2-4x faster for UI component tests | ✓ Good — 5 UI tests run in milliseconds |
| Vite 8 + Rolldown | Performance + future-proofing | ✓ Good — rolldownOptions, no deprecation warnings |
| Tailwind CSS 4.x over Sass | Modern utility-first CSS, simpler config | ✓ Good — CSS-first config, @theme inline for tokens |
| shadcn/ui over react-figma-ui | Active maintenance, Radix primitives, composable | ✓ Good — 14 components, OKLCH Figma tokens |
| Storybook 10 | ESM-only, React 19 support | ✓ Good — all 14 stories with Autodocs + Controls |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after v1.2 milestone completion*
