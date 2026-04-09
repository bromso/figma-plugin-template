# Phase 7: Storybook Setup and Stories - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a dedicated Storybook app that documents all 14 react-figma-ui components with interactive controls, Figma plugin viewport presets, and Turborepo task integration.

</domain>

<decisions>
## Implementation Decisions

### Storybook Architecture
- Storybook app lives in `apps/storybook` — follows monorepo convention of apps/ for runnable apps
- Use `@storybook/react-vite` framework — matches project's Vite toolchain, no webpack
- Stories live in `apps/storybook/src/stories/` — keeps packages/ui clean, Storybook owns its stories
- Use Storybook 8.x (latest stable) — mature React-Vite support, Autodocs built-in

### Story Configuration
- CSF3 with autodocs — auto-generates docs from component props, less maintenance
- Controls auto-detected from TypeScript types — react-figma-ui has typed props, Storybook infers Controls
- No custom Storybook theme — use default Storybook UI, focus on component documentation

### Viewport & Turborepo Integration
- 3 Figma plugin viewport presets: Small (300x200), Medium (320x500), Large (400x600)
- `storybook` task in turbo.json: persistent, no cache (dev server runs continuously)
- `build-storybook` task in turbo.json: cached (second run shows cache hit)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/ui/src/index.ts` — barrel exporting all 14 react-figma-ui components + SelectMenuOption
- `figma-plugin-ds/dist/figma-plugin-ds.css` — CSS loaded via side-effect import in packages/ui
- `packages/ui/__mocks__/figma-plugin-ds.js` — mock for figma-plugin-ds ESM issue

### Established Patterns
- Turborepo monorepo with `apps/` and `packages/` workspaces
- Bun as package manager with `bun.lock`
- JIT source-only packages — `@repo/ui` exports raw TypeScript
- Biome for linting/formatting

### Integration Points
- `apps/storybook` imports from `@repo/ui` (workspace dependency)
- `turbo.json` needs new `storybook` and `build-storybook` tasks
- Root `package.json` workspaces already include `apps/*`

</code_context>

<specifics>
## Specific Ideas

- STATE.md notes: "Storybook 10 Bun detection requires `bun.lockb` stub at repo root" — verify at install time
- STATE.md notes: "Storybook must NOT include vite-plugin-singlefile — independent Vite instance required"
- Components to document: Button, Checkbox, Disclosure, DisclosureItem, Icon, IconButton, Input, Label, SectionTitle, OnboardingTip, Radio, Select (SelectMenu), Switch, Textarea, Type
- SelectMenuOption also exported but is a sub-component of Select — include in Select story

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
