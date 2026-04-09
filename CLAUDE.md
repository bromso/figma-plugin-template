# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Figma plugin boilerplate using React + Vite. Based on [CoconutGoodie/figma-plugin-react-vite](https://github.com/CoconutGoodie/figma-plugin-react-vite).

## Commands

- `npm run dev` — Watch mode for both plugin and UI (parallel builds)
- `npm run dev:ui-only` — Run UI in browser without Figma context (standard Vite dev server)
- `npm run build` — Production build (runs type-check, clean, then builds UI + plugin to `dist/`)
- `npm run types` — Type-check only (both `tsconfig.json` and `tsconfig.node.json`)

No test framework is configured.

## Architecture

The plugin runs as **two separate processes** that communicate via message passing:

- **Plugin side** (`src/plugin/`) — Runs in Figma's sandbox with access to the Figma API (`figma.*`). No DOM access. Entry: `plugin.ts`.
- **UI side** (`src/ui/`) — Runs in an iframe. Standard React app. Entry: `main.tsx` → `app.tsx`.
- **Common** (`src/common/`) — Shared between both sides. Contains network event type definitions.

### Messaging (monorepo-networker)

Communication between sides uses [monorepo-networker](https://github.com/CoconutGoodie/monorepo-networker):

1. **Define events** in `src/common/networkSides.ts` — each side declares the events it *listens* to, with typed signatures.
2. **Build channels** in `*.network.ts` files — `plugin.network.ts` and `app.network.tsx` set up transport (postMessage) and register handlers.
3. **Use channels** — `PLUGIN_CHANNEL.emit(UI, "event", [args])` for fire-and-forget, `.request(...)` for request/response (returns a Promise).

When adding a new cross-side event: add the type to `networkSides.ts`, then register its handler in the appropriate `*.network.ts` file.

### Build System

Two Vite configs run in parallel during dev/build:
- `vite.config.ui.ts` — Builds UI; uses `vite-plugin-singlefile` to inline everything into one HTML file.
- `vite.config.plugin.ts` — Builds plugin code; also generates `dist/manifest.json` from `figma.manifest.ts`.

Both outputs land in `dist/`. The singlefile constraint means all assets (images, fonts, CSS) are inlined — no external file references.

### Path Aliases

- `@common` → `src/common`
- `@ui` → `src/ui`
- `@plugin` → `src/plugin`

Defined in both `tsconfig.json` (for IDE/type-checking) and both Vite configs (for bundling).

### SVG Imports

SVGs support three import modes via `vite-plugin-react-rich-svg`:
- `*.svg?component` — React component
- `*.svg?url` — data URI string
- `*.svg?raw` — raw SVG markup string

### Styling

SCSS with CSS Modules support. Uses 7-1 Sass architecture under `src/ui/styles/`. Component-scoped styles use `*.module.scss`.

## Plugin Configuration

`figma.manifest.ts` exports the Figma plugin manifest. Update `id` with your plugin's ID from Figma. This generates `dist/manifest.json` at build time.
