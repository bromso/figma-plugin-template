# figma-plugin-template

Figma/FigJam plugin boilerplate with React, Vite, TypeScript, and Turborepo monorepo.

## Features

- **Turborepo monorepo** with Bun package manager — fast installs, cached builds
- **React + TypeScript + Vite** build pipeline
- **Single-file HTML output** — required by the Figma plugin API (all assets inlined)
- **14 native Figma UI components** via react-figma-ui (Button, Checkbox, Input, Select, and more)
- **Storybook** for interactive component documentation
- **Vitest** for testing (happy-dom for UI, node for common packages)
- **Biome** for linting and formatting
- **Type-safe message passing** between plugin and UI via monorepo-networker

## Quick Start

```bash
# Clone the template
git clone https://github.com/jonasbroms/figma-plugin-template.git
cd figma-plugin-template

# Install dependencies
bun install

# Start development
bun run dev
```

## Project Structure

```
apps/
  figma-plugin/   — Figma plugin app (Vite builds to dist/)
  storybook/      — Storybook component documentation
packages/
  common/         — Shared types and network events (@repo/common)
  ui/             — UI components, styles, and app shell (@repo/ui)
```

Packages are **JIT source-only** — they export raw TypeScript with no build step. Use `@repo/*` workspace imports for cross-package references.

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Watch mode (plugin + UI via Turborepo) |
| `bun run build` | Production build |
| `bun run test` | Run all tests |
| `bun run test:watch` | Watch mode for tests |
| `bun run lint` | Lint with Biome |
| `bun run storybook` | Start Storybook dev server |
| `turbo run build-storybook` | Build static Storybook (cached) |

## Architecture

The plugin runs as **two separate processes** that communicate via message passing:

- **Plugin side** (`apps/figma-plugin/src/plugin/`) — Runs in Figma's sandbox with access to the Figma API (`figma.*`). No DOM access. Entry: `plugin.ts`.
- **UI side** (`packages/ui/src/`) — Runs in an iframe. React app with react-figma-ui components. Entry: `main.tsx` → `app.tsx`.
- **Common** (`packages/common/src/`) — Shared between both sides. Contains network event type definitions.

### Messaging

Communication uses [monorepo-networker](https://github.com/CoconutGoodie/monorepo-networker):

1. **Define events** in `packages/common/src/networkSides.ts` — each side declares the events it listens to with typed signatures.
2. **Build channels** in `*.network.ts` files — set up postMessage transport and register handlers.
3. **Use channels** — `PLUGIN_CHANNEL.emit(UI, "event", [args])` for fire-and-forget, `.request(...)` for request/response (returns a Promise).

## UI Components

`packages/ui` re-exports all 14 [react-figma-ui](https://github.com/CoconutGoodie/react-figma-ui) components:

`Button`, `Checkbox`, `Disclosure`, `DisclosureItem`, `Icon`, `IconButton`, `Input`, `Label`, `SectionTitle`, `OnboardingTip`, `Radio`, `Select`, `Switch`, `Textarea`, `Type`

Run `bun run storybook` to browse all components interactively with live examples.

## Plugin Configuration

Edit `apps/figma-plugin/figma.manifest.ts` to set your plugin name, ID, and permissions:

```ts
export default {
  name: "My Plugin",
  id: "your-plugin-id-from-figma",
  // ...
};
```

Get your plugin ID from Figma: **Plugins > Manage plugins > Create new plugin**.

## Testing in Figma

1. Run `bun run build`
2. Open the Figma desktop app
3. Go to **Plugins > Development > Import plugin from manifest**
4. Select `apps/figma-plugin/dist/manifest.json`

For active development, use `bun run dev` to keep the build updated automatically.

## Tech Stack

| Tool | Version |
|------|---------|
| [Bun](https://bun.sh) | 1.3.11 |
| [Turborepo](https://turbo.build) | ^2.9.5 |
| [Vite](https://vitejs.dev) | 6.x |
| React | Latest |
| TypeScript | Latest |
| [Biome](https://biomejs.dev) | 2.4.10 |
| [Vitest](https://vitest.dev) | 4.x |
| [Storybook](https://storybook.js.org) | 8.6.18 |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and development workflow.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
