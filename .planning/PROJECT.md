# Figma Plugin Template

## What This Is

A Figma plugin boilerplate using React + Vite, designed for building scalable Figma/FigJam plugins. Provides two-process architecture (plugin sandbox + UI iframe) with typed message passing via monorepo-networker.

## Core Value

A ready-to-use Figma plugin template with modern tooling and excellent developer experience that gets you from clone to working plugin in minutes.

## Current Milestone: v1.0 Monorepo & DX Overhaul

**Goal:** Migrate from a flat Vite project to a Turborepo monorepo with modern tooling (Bun, Biome, Vitest) and polished VS Code developer experience.

**Target features:**
- Turborepo monorepo with `apps/figma-plugin`, `packages/ui`, `packages/common`
- Bun as package manager and script runner (replacing npm/pnpm)
- Biome for linting and formatting
- Vitest for testing with Turborepo integration
- VS Code workspace config (launch.json, settings.json, tasks.json, extensions.json)

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- Dual-process plugin architecture (plugin sandbox + UI iframe)
- Typed message passing between sides via monorepo-networker
- React + Vite build pipeline with single-file output
- SCSS/CSS Modules styling with 7-1 architecture
- SVG import as component/url/raw via vite-plugin-react-rich-svg
- Figma manifest generation from TypeScript config

### Active

<!-- Current scope. Building toward these. -->

- [ ] Turborepo monorepo structure
- [ ] Bun package manager
- [ ] Biome linting and formatting
- [ ] Vitest testing framework
- [ ] VS Code workspace configuration

### Out of Scope

- CI/CD pipeline — future milestone
- Documentation site — future milestone
- Additional plugin templates — future milestone

## Context

- Existing codebase is a working Figma plugin template from CoconutGoodie/figma-plugin-react-vite
- Two Vite configs (`vite.config.ui.ts`, `vite.config.plugin.ts`) build in parallel to `dist/`
- Plugin side uses `@figma/plugin-typings` for Figma API access
- `vite-plugin-singlefile` inlines all assets into single HTML/JS outputs (Figma requirement)
- Path aliases: `@common`, `@ui`, `@plugin` used throughout
- No existing linter, formatter, or test framework

## Constraints

- **Figma plugin format**: Output must be single `plugin.js` and single `index.html` — no external file references
- **Plugin sandbox**: Plugin code runs in Figma's sandbox with no DOM access
- **Package manager**: Migrating to Bun — all scripts and CI must work with Bun

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Turborepo over Nx | Lighter weight, better fit for template project | — Pending |
| Bun over pnpm | Faster installs and script execution, simpler toolchain | — Pending |
| Biome over ESLint+Prettier | Single tool for lint+format, faster, zero config | — Pending |
| Three-package split (common, ui, plugin-app) | Clean separation of concerns, reusable packages | — Pending |

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
*Last updated: 2026-04-09 after milestone v1.0 initialization*
