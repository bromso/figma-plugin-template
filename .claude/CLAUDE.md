# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Figma/FigJam plugin boilerplate using React, Vite, TypeScript, and Turborepo monorepo. Based on [CoconutGoodie/figma-plugin-react-vite](https://github.com/CoconutGoodie/figma-plugin-react-vite). Uses react-figma-ui for native Figma UI components and Storybook for component documentation.

## Commands

All commands use **Bun** as the package manager. Run from the repo root.

- `bun run dev` — Watch mode for both plugin and UI (parallel Turborepo builds)
- `bun run build` — Production build (UI + plugin to `apps/figma-plugin/dist/`)
- `bun run test` — Run all tests across all packages (Vitest)
- `bun run test:watch` — Watch mode for tests
- `bun run lint` — Lint all packages (Biome)
- `bun run storybook` — Start Storybook dev server (apps/storybook)
- `turbo run build-storybook` — Build static Storybook (cached by Turborepo)

### Package-scoped commands

- `bun run --filter @repo/ui test` — Run UI package tests only
- `bun run --filter @repo/common test` — Run common package tests only
- `bun run --filter @repo/figma-plugin build` — Build plugin only

## Monorepo Structure

```
apps/
  figma-plugin/     — Figma plugin app (Vite builds to dist/)
  storybook/        — Storybook component documentation
packages/
  common/           — Shared types and network event definitions (@repo/common)
  ui/               — UI components, styles, and app shell (@repo/ui)
```

### Workspace Imports

Use `@repo/*` workspace imports (not relative paths across packages):
- `import { Button } from '@repo/ui'`
- `import { NetworkSide } from '@repo/common'`

Packages are **JIT source-only** — they export raw TypeScript (no build step). Vite resolves via workspace symlinks.

## Architecture

The plugin runs as **two separate processes** that communicate via message passing:

- **Plugin side** (`apps/figma-plugin/src/plugin/`) — Runs in Figma's sandbox with access to the Figma API (`figma.*`). No DOM access. Entry: `plugin.ts`.
- **UI side** (`packages/ui/src/`) — Runs in an iframe. React app with react-figma-ui components. Entry: `main.tsx` → `app.tsx`.
- **Common** (`packages/common/src/`) — Shared between both sides. Contains network event type definitions.

### UI Components (react-figma-ui)

`packages/ui` re-exports all 14 react-figma-ui components as named exports: Button, Checkbox, Disclosure, DisclosureItem, Icon, IconButton, Input, Label, SectionTitle, OnboardingTip, Radio, Select, Switch, Textarea, Type.

The figma-plugin-ds CSS is loaded as a side-effect import in `packages/ui/src/index.ts`.

### Messaging (monorepo-networker)

Communication between sides uses [monorepo-networker](https://github.com/CoconutGoodie/monorepo-networker):

1. **Define events** in `packages/common/src/networkSides.ts` — each side declares the events it *listens* to, with typed signatures.
2. **Build channels** in `*.network.ts` files — `plugin.network.ts` and `app.network.tsx` set up transport (postMessage) and register handlers.
3. **Use channels** — `PLUGIN_CHANNEL.emit(UI, "event", [args])` for fire-and-forget, `.request(...)` for request/response (returns a Promise).

### Build System

Turborepo orchestrates parallel builds. Two Vite configs in `apps/figma-plugin/`:
- `vite.config.ui.ts` — Builds UI; uses `vite-plugin-singlefile` to inline everything into one HTML file.
- `vite.config.plugin.ts` — Builds plugin code; generates `dist/manifest.json` from `figma.manifest.ts`.

Both outputs land in `apps/figma-plugin/dist/`. The singlefile constraint means all assets are inlined — no external file references.

### SVG Imports

SVGs support three import modes via `vite-plugin-react-rich-svg`:
- `*.svg?component` — React component
- `*.svg?url` — data URI string
- `*.svg?raw` — raw SVG markup string

### Styling

CSS Modules (`*.module.scss`) for component-scoped styles. react-figma-ui provides native Figma styling via figma-plugin-ds CSS.

## Tooling

- **Bun 1.3.11** — Package manager (sole lockfile: `bun.lock`)
- **Turborepo** — Monorepo task orchestration with caching
- **Biome 2.4.10** — Linting and formatting (root `biome.json`)
- **Vitest 4.x** — Testing framework (happy-dom for UI, node for common)
- **Storybook 8.6.18** — Component documentation with react-figma-ui stories
- **Vite 6** — Build tool with single-file output for Figma plugins

## Plugin Configuration

`apps/figma-plugin/figma.manifest.ts` exports the Figma plugin manifest. Update `id` with your plugin's ID from Figma. This generates `dist/manifest.json` at build time.

## Available Figma Skills

The following Claude Code skills are available for Figma workflows:
- `figma-use` — Required before any `use_figma` tool call
- `figma-implement-design` — Translate Figma designs to code
- `figma-generate-design` — Push code layouts to Figma
- `figma-generate-library` — Build design system in Figma from code
- `figma-api` — Figma REST API reference
- `figma-code-connect` — Map Figma components to code snippets
