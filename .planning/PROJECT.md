# Figma Plugin Template

## What This Is

A Figma plugin boilerplate using React + Vite, designed for building scalable Figma/FigJam plugins. Provides two-process architecture (plugin sandbox + UI iframe) with typed message passing via monorepo-networker.

## Core Value

A ready-to-use Figma plugin template with modern tooling and excellent developer experience that gets you from clone to working plugin in minutes.

## Current Milestone: v1.2 Dependency Upgrades & Bundle Optimization

**Goal:** Upgrade all outdated core dependencies to current versions and add bundle analysis tooling.

**Target features:**
- Upgrade Vite 6 → 8, TypeScript 5.3 → 6.0, React 18 → 19, Storybook 8.6 → 10.x
- Upgrade @figma/plugin-typings 1.83 → 1.123, align Sass versions
- Add bundle analysis tooling (rollup-plugin-visualizer)
- Address unmaintained react-figma-ui and figma-plugin-ds packages

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

### Active

<!-- Current scope. Building toward these. -->

- [ ] Vite 8 with Rolldown integration
- [ ] TypeScript 6.0
- [ ] React 19 with updated type definitions
- [ ] Storybook 10.x (ESM-only, React 19 compatible)
- [ ] @figma/plugin-typings 1.123
- [ ] Bundle analysis tooling
- [ ] Unmaintained dependency remediation (react-figma-ui, figma-plugin-ds)

### Out of Scope

- CI/CD pipeline — future milestone
- Documentation site — future milestone
- Additional plugin templates — future milestone

## Context

- Turborepo monorepo: `apps/figma-plugin`, `packages/common`, `packages/ui`
- Bun 1.3.11 as package manager (sole lockfile: `bun.lock`)
- Vite 6 with two configs in `apps/figma-plugin/` producing single-file output to `dist/`
- Biome 2.4.10 for linting + formatting (root `biome.json`)
- Vitest 3.x with 7 tests across 2 packages (node + happy-dom environments)
- VS Code multi-root workspace with format-on-save, debug configs, task shortcuts
- JIT source-only packages — `@repo/common` and `@repo/ui` export raw TypeScript
- Plugin side uses `@figma/plugin-typings` for Figma API access

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
*Last updated: 2026-04-09 after v1.2 milestone start*
