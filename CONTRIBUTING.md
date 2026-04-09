# Contributing

Thank you for your interest in contributing to figma-plugin-template! We welcome all contributions — bug fixes, improvements, and new features.

## Prerequisites

- Node.js >= 18
- [Bun](https://bun.sh) >= 1.0
- Figma desktop app (for plugin testing)

## Getting Started

```bash
git clone https://github.com/jonasbroms/figma-plugin-template.git
cd figma-plugin-template
bun install
bun run build
```

## Development Workflow

| Command | Description |
|---------|-------------|
| `bun run dev` | Watch mode (plugin + UI via Turborepo) |
| `bun run build` | Production build to `apps/figma-plugin/dist/` |
| `bun run test` | Run all tests (Vitest) |
| `bun run test:watch` | Watch mode for tests |
| `bun run lint` | Lint with Biome |
| `bun run storybook` | Start Storybook dev server |

## Project Structure

This is a Turborepo monorepo:

```
apps/
  figma-plugin/   — The Figma plugin application
  storybook/      — Storybook for component documentation
packages/
  common/         — Shared types and network events (@repo/common)
  ui/             — UI components and styles (@repo/ui)
```

Packages are **JIT source-only** — they export raw TypeScript with no build step. Use `@repo/*` workspace imports for cross-package references (e.g., `import { Button } from '@repo/ui'`).

## Testing in Figma

1. Run `bun run build` (or `bun run dev` for watch mode)
2. Open the Figma desktop app
3. Go to **Plugins > Development > Import plugin from manifest**
4. Select `apps/figma-plugin/dist/manifest.json`

## Submitting a Pull Request

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and ensure all checks pass:
   ```bash
   bun run build
   bun run test
   bun run lint
   ```
4. Commit with a descriptive message
5. Push and open a PR against `master`
6. Describe what changed and why in the PR description

## Code Style

- **Biome** handles linting and formatting — run `bun run lint` before committing
- Use **TypeScript strict mode**
- Use `@repo/*` imports for cross-package references (not relative paths)
