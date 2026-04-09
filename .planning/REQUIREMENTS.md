# Requirements: v1.2 Dependency Upgrades & Bundle Optimization

## Build Tooling

- [ ] **BUILD-01**: Vite upgraded from 6.x to 8.x with Rolldown integration across all workspace configs
- [ ] **BUILD-02**: TypeScript upgraded from 5.3 to 6.0 with tsconfig targets updated
- [ ] **BUILD-03**: Sass/SCSS replaced with Tailwind CSS 4.x (required by shadcn/ui)
- [ ] **BUILD-04**: Bundle analysis tooling (rollup-plugin-visualizer) available via `bun run analyze`

## Framework

- [ ] **FW-01**: React upgraded from 18.2 to 19.x with updated @types/react and @types/react-dom
- [ ] **FW-02**: Storybook upgraded from 8.6 to 10.x (ESM-only) with all stories and configs migrated
- [ ] **FW-03**: Tailwind CSS 4.x configured for the Figma plugin UI iframe with single-file output compatibility

## UI Components

- [ ] **UI-01**: shadcn/ui installed with Radix primitives replacing react-figma-ui
- [ ] **UI-02**: Figma design tokens (colors, typography, spacing, radii) configured to match native Figma plugin appearance
- [ ] **UI-03**: All 14 component equivalents available: Button, Checkbox, Input, Label, Select, Switch, Textarea, Radio, Icon, IconButton, Disclosure/Accordion, SectionTitle, OnboardingTip/Alert, Type/Text
- [ ] **UI-04**: react-figma-ui and figma-plugin-ds fully removed — no postinstall ESM workaround needed

## Figma

- [ ] **FIG-01**: @figma/plugin-typings upgraded from 1.83 to 1.123 for current Figma API coverage

## Verification

- [ ] **VER-01**: All existing tests pass after all upgrades and migration
- [ ] **VER-02**: Production build produces valid single-file plugin output (plugin.js + index.html)
- [ ] **VER-03**: All Storybook stories render with new shadcn/ui components, Controls, and Autodocs
- [ ] **VER-04**: Plugin renders in Figma with native-looking UI appearance (visual parity with figma-plugin-ds)

## Future Requirements

- CI/CD pipeline for automated builds and Storybook deployment
- Documentation site
- Visual regression testing for Storybook

## Out of Scope

- Custom component development beyond shadcn/ui Figma theming — use library primitives as-is
- Dark mode support — Figma plugins use a single theme
- Server-side rendering — Figma plugins are client-only iframes

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUILD-01 | Phase 10 | Pending |
| BUILD-02 | Phase 10 | Pending |
| FIG-01 | Phase 10 | Pending |
| FW-01 | Phase 11 | Pending |
| BUILD-03 | Phase 12 | Pending |
| BUILD-04 | Phase 12 | Pending |
| FW-03 | Phase 12 | Pending |
| UI-01 | Phase 13 | Pending |
| UI-02 | Phase 13 | Pending |
| UI-03 | Phase 13 | Pending |
| UI-04 | Phase 13 | Pending |
| FW-02 | Phase 14 | Pending |
| VER-01 | Phase 15 | Pending |
| VER-02 | Phase 15 | Pending |
| VER-03 | Phase 15 | Pending |
| VER-04 | Phase 15 | Pending |
