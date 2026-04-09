# Phase 6: react-figma-ui Integration - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the custom Button component in packages/ui with all 14 react-figma-ui native Figma components, load figma-plugin-ds CSS, update the demo app to showcase all components, and remove unused custom code.

</domain>

<decisions>
## Implementation Decisions

### Component Re-export Strategy
- Direct re-export from react-figma-ui (`export { Button } from 'react-figma-ui'`) — zero wrapper overhead, matches JIT source-only pattern
- One flat barrel `index.ts` re-exporting all 14 components — matches current packages/ui pattern
- Re-export component prop types alongside components — consumers use `@repo/ui` as sole import source
- react-figma-ui dependency lives in packages/ui — the UI package owns the component layer

### CSS Loading & Integration
- Import figma-plugin-ds CSS in packages/ui `index.ts` as side-effect import (`import 'figma-plugin-ds/dist/figma-plugin-ds.css'`)
- Accept unscoped BEM classes as-is — figma-plugin-ds uses `.figma-*` prefixed classes, low collision risk with CSS Modules
- Remove demo SCSS partials from packages/ui — react-figma-ui brings its own styles; keep only app-level layout SCSS in the plugin app

### Demo App Design
- Component sampler rendering all 14 components in a scrollable panel grouped by category (inputs, buttons, display, layout)
- Static showcase only — components render with representative props but no wired-up state/logic
- Full replacement of existing app.tsx — clean swap

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/ui/src/utils/classes.util.ts` — className merge utility (may be replaceable by clsx from react-figma-ui)
- `packages/ui/src/app.network.tsx` — network channel setup, must be preserved
- `packages/ui/src/main.tsx` — entrypoint, CSS import target

### Established Patterns
- JIT source-only packages — `@repo/ui` exports raw TypeScript, Vite resolves via workspace
- Single flat barrel export in `packages/ui/src/index.ts`
- CSS Modules for scoped styles (`*.module.scss`)
- `vite-plugin-singlefile` inlines all assets into single HTML

### Integration Points
- `apps/figma-plugin/src/ui/app.tsx` (deleted in v1.0 restructure) — needs to import from `@repo/ui`
- `packages/ui/src/main.tsx` — entrypoint that renders the app
- `packages/ui/src/app.tsx` — current demo app component

</code_context>

<specifics>
## Specific Ideas

- react-figma-ui v1.1.0 on npm — exports 14 components, depends on figma-plugin-ds ^1.0.1 and clsx ^1.1.1
- STATE.md notes: "react-figma-ui CSS uses unscoped BEM names — audit for collisions before import"
- STATE.md notes: "react-figma-ui prop API (Select name, OnboardingTip name) — verify at install time"
- Components to export: Button, Checkbox, Disclosure, DisclosureItem, Icon, IconButton, Input, Label, SectionTitle, OnboardingTip, Radio, Select, Switch, Textarea, Type

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
