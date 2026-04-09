---
phase: 13-shadcn-ui-component-migration
plan: "03"
subsystem: ui
tags: [shadcn, migration, cleanup, exports, react-figma-ui-removal]
dependency_graph:
  requires: [shadcn-components, figma-custom-components, full-component-set]
  provides: [clean-public-api, shadcn-demo-app, zero-react-figma-ui]
  affects: [packages/ui, apps/storybook]
tech_stack:
  added: []
  patterns:
    - Composable shadcn/ui Select (SelectTrigger + SelectContent + SelectItem)
    - Composable Accordion (AccordionItem + AccordionTrigger + AccordionContent)
    - Alert + AlertDescription replacing OnboardingTip
    - RadioGroup + RadioGroupItem replacing Radio
key_files:
  created: []
  modified:
    - packages/ui/src/index.ts
    - packages/ui/src/app.tsx
    - packages/ui/src/__tests__/exports.test.ts
    - packages/ui/package.json
    - packages/ui/vitest.config.ts
    - packages/ui/src/test/setup.ts
    - apps/storybook/.storybook/main.ts
    - apps/storybook/.storybook/preview.ts
  deleted:
    - packages/ui/__mocks__/figma-plugin-ds.js
    - packages/ui/src/test/figma-plugin-ds-stub.ts
    - packages/ui/src/utils/classes.util.ts
    - packages/ui/src/__tests__/classes.util.test.ts
decisions:
  - "Button variant=default replaces tint=primary; variant=secondary replaces no-tint Button"
  - "cn() from @/lib/utils replaces classes() utility from classes.util.ts"
  - "SelectMenuOption removed from public API — SelectItem is the direct replacement"
  - "Storybook main.ts viteFinal emptied of figma-plugin-ds alias (mock file deleted)"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-09"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 12
---

# Phase 13 Plan 03: Export Rewiring & react-figma-ui Removal Summary

**One-liner:** Rewire packages/ui public API to export all 14 shadcn/ui + custom components, rewrite app.tsx demo with composable shadcn APIs, and fully remove react-figma-ui and figma-plugin-ds from the project — zero references remaining.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Rewire index.ts exports, rewrite app.tsx demo, update tests | a719c6c | packages/ui/src/index.ts, app.tsx, exports.test.ts |
| 2 | Remove react-figma-ui, figma-plugin-ds, postinstall script, test mocks | e0a1ce4 | packages/ui/package.json, vitest.config.ts, setup.ts, deleted 4 files |
| 3 | Visual verification (auto-approved) | — | — |

## What Was Built

### Task 1: Rewired exports and demo app

`packages/ui/src/index.ts` now exports exclusively from the new component locations:
- 10 shadcn/ui components from `./components/ui/` (Button, Checkbox, Input, Label, Select family, Switch, Textarea, RadioGroup family, Accordion family, Alert family)
- 4 custom Figma components from `./components/figma/` (Icon, IconButton, SectionTitle, Type)
- `cn` utility from `./lib/utils`
- Zero imports from react-figma-ui or figma-plugin-ds

`packages/ui/src/app.tsx` rewritten with shadcn/ui composable APIs:
- `Checkbox` + `Label` pair (replaces `<Checkbox>Option A</Checkbox>`)
- `RadioGroup` + `RadioGroupItem` + `Label` (replaces `<Radio>`)
- `Switch` + `Label` pair (replaces `<Switch>`)
- `Select` + `SelectTrigger` + `SelectContent` + `SelectItem` (replaces `<Select options={...} render={...}>`)
- `Accordion` + `AccordionItem` + `AccordionTrigger` + `AccordionContent` (replaces `Disclosure`)
- `Alert` + `AlertDescription` with `Icon` sibling (replaces `OnboardingTip`)
- All 4 section headings preserved: Inputs, Buttons, Display, Layout

`exports.test.ts` updated to test the new 24-export surface and `cn()` utility.

### Task 2: Full dependency cleanup

- `bun remove react-figma-ui figma-plugin-ds` — both removed from package.json dependencies
- Deleted `postinstall` script (ESM symlink workaround for figma-plugin-ds/dist/modules)
- Deleted 4 workaround files: `__mocks__/figma-plugin-ds.js`, `src/test/figma-plugin-ds-stub.ts`, `src/utils/classes.util.ts`, `src/__tests__/classes.util.test.ts`
- Simplified `vitest.config.ts`: removed figma-plugin-ds aliases and `server.deps.inline`; added `@` alias to match Vite config
- Cleaned `src/test/setup.ts`: removed `vi.mock("figma-plugin-ds", ...)` block
- Updated Storybook `main.ts`: removed figma-plugin-ds alias from viteFinal
- Updated Storybook `preview.ts`: corrected stale comment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing cleanup] Storybook references to deleted figma-plugin-ds mock**
- **Found during:** Task 2 (final zero-reference scan)
- **Issue:** `apps/storybook/.storybook/main.ts` had a `viteFinal` alias pointing to `packages/ui/__mocks__/figma-plugin-ds.js` which was deleted in the same task. Would have broken Storybook builds.
- **Fix:** Removed the alias block from viteFinal in main.ts; removed unused `path` import; corrected stale comment in preview.ts
- **Files modified:** apps/storybook/.storybook/main.ts, apps/storybook/.storybook/preview.ts
- **Commit:** e0a1ce4

**2. [Rule 3 - Blocking] tw-animate-css not found during build after bun remove**
- **Found during:** Task 2 build verification
- **Issue:** `bun remove` ran inside the worktree's packages/ui but the root `node_modules` was not refreshed, causing `tw-animate-css` resolution to fail during Vite build
- **Fix:** Ran `bun install` from repo root to sync lockfile and restore missing packages in root node_modules
- **Files modified:** bun.lock
- **Commit:** e0a1ce4

## Known Stubs

None — all exports are wired to real components, app.tsx renders real data, no placeholder text or empty values flow to UI rendering.

## Threat Flags

None — index.ts export surface is UI components only (T-13-05 accepted per threat model). No new network endpoints, auth paths, file access, or schema changes introduced.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| packages/ui/src/index.ts — zero react-figma-ui imports | PASS |
| packages/ui/src/index.ts — zero figma-plugin-ds imports | PASS |
| packages/ui/src/app.tsx — uses Accordion | PASS |
| packages/ui/src/app.tsx — uses Alert | PASS |
| packages/ui/src/app.tsx — uses RadioGroup | PASS |
| packages/ui/package.json — no react-figma-ui | PASS |
| packages/ui/package.json — no figma-plugin-ds | PASS |
| packages/ui/package.json — no postinstall | PASS |
| packages/ui/__mocks__/figma-plugin-ds.js deleted | PASS |
| packages/ui/src/utils/classes.util.ts deleted | PASS |
| bun run test (5 tests, 2 files in worktree) | PASS |
| bun run build (dist/index.html + dist/plugin.js) | PASS |
| commit a719c6c (task 1) | FOUND |
| commit e0a1ce4 (task 2) | FOUND |
