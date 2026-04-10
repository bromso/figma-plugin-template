# Requirements: v1.3 Code Audit Resolution

## Bug Fixes (from v1.2 code audit)

- [ ] **BUG-01**: `main.tsx` null-guards `getElementById("root")` instead of unchecked `as HTMLElement` cast
- [ ] **BUG-02**: `ButtonProps` defined in `button.tsx` and importable from `@repo/ui` (no phantom re-export)
- [ ] **BUG-03**: `AlertAction` exported from `@repo/ui` index
- [ ] **BUG-04**: `Icon` component `name` prop narrowed to `keyof typeof iconMap` — invalid names fail at compile time
- [ ] **BUG-05**: `index.html` is a conformant document with `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`
- [ ] **BUG-06**: `postcssUrl` uses `pathToFileURL()` from `node:url` — build works on paths containing spaces

## Theme

- [ ] **THEME-01**: Dark mode is either fully supported (tokens defined under `.dark`) or all `dark:` variants are removed with documented decision

## Type Safety

- [ ] **TYPE-01**: `packages/ui` has a `types` script running `tsc --noEmit`, wired into Turborepo pipeline
- [ ] **TYPE-02**: `Icon` component supports runtime extension via `registerIcon(name, component)` API, with typed `ICONS` const and `StaticIconName` type for static consumers

## Performance

- [ ] **PERF-01**: Bundle analysis report exists documenting total size, top 5 modules, Radix strategy, and Lucide import strategy
- [ ] **PERF-02**: Radix primitives use the unified `radix-ui` package, not individual `@radix-ui/react-*` packages
- [ ] **PERF-03**: Lucide icons are imported by name only — no wildcard or namespace imports
- [ ] **PERF-04**: React 19 Compiler (`babel-plugin-react-compiler`) is active in the Vite build
- [ ] **PERF-05**: Redundant `useMemo`/`useCallback` removed where React Compiler handles memoization; retained ones have `// react-compiler: skip — reason` comments

## Testing

- [ ] **TEST-01**: `@testing-library/react` interaction tests exist for Button, Select, and Accordion (≥2 tests each covering user-event flows)
- [ ] **TEST-02**: Storybook 10 `play()` interaction tests exist for Accordion (expand) and Select (open + select option)

## Developer Experience

- [ ] **DX-01**: `styles.css` has a comment explaining `@source "."` (or uses explicit globs)
- [ ] **DX-02**: `vite.config.ui.ts` has `// MUST be last` comment above `viteSingleFile()`
- [ ] **DX-03**: `docs/WORKTREE-FLOW.md` documents the GSD worktree merge edge case

## Dependency Hygiene

- [ ] **DEP-01**: `vite-plugin-react-rich-svg` migrated to `vite-plugin-svgr`, OR risk documented in package.json with the Vite version it was last verified on
- [ ] **DEP-02**: `bun run build-storybook` produces no chunk size warnings (manualChunks configured in `.storybook/main.ts`)

## UI Component Polish

- [ ] **UI-05**: `Type` component accepts polymorphic `as` prop (`<Type as="h2">` renders `<h2>`)

## Out of Scope

- CI/CD pipeline — future milestone
- Visual regression testing — future milestone
- Documentation site — future milestone
- Additional shadcn/ui components beyond the 14 already migrated
- Figma Code Connect integration — future milestone

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 16 | Pending |
| BUG-02 | Phase 16 | Pending |
| BUG-03 | Phase 16 | Pending |
| BUG-04 | Phase 16 | Pending |
| BUG-05 | Phase 16 | Pending |
| BUG-06 | Phase 16 | Pending |
| THEME-01 | Phase 16 | Pending |
| TYPE-01 | Phase 17 | Pending |
| TYPE-02 | Phase 17 | Pending |
| PERF-01 | Phase 18 | Pending |
| PERF-02 | Phase 18 | Pending |
| PERF-03 | Phase 18 | Pending |
| PERF-04 | Phase 19 | Pending |
| PERF-05 | Phase 19 | Pending |
| TEST-01 | Phase 20 | Pending |
| TEST-02 | Phase 20 | Pending |
| DX-01 | Phase 20 | Pending |
| DX-02 | Phase 20 | Pending |
| DX-03 | Phase 20 | Pending |
| DEP-01 | Phase 20 | Pending |
| DEP-02 | Phase 20 | Pending |
| UI-05 | Phase 20 | Pending |
