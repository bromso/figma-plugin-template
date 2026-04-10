---
phase: 14-storybook-10-upgrade
plan: 02
subsystem: storybook
tags: [storybook, stories, shadcn-ui, csf3, autodocs]
dependency_graph:
  requires: [storybook-10-runtime]
  provides: [storybook-stories-shadcn]
  affects: [apps/storybook/src/stories]
tech_stack:
  added: []
  patterns: [csf3-satisfies, autodocs-tags, shadcn-composition-pattern, label-composition]
key_files:
  created:
    - apps/storybook/src/stories/Accordion.stories.tsx
    - apps/storybook/src/stories/Alert.stories.tsx
    - apps/storybook/src/stories/RadioGroup.stories.tsx
  modified:
    - apps/storybook/src/stories/Button.stories.tsx
    - apps/storybook/src/stories/Input.stories.tsx
    - apps/storybook/src/stories/Select.stories.tsx
    - apps/storybook/src/stories/Checkbox.stories.tsx
    - apps/storybook/src/stories/Switch.stories.tsx
    - apps/storybook/src/stories/Icon.stories.tsx
    - apps/storybook/src/stories/IconButton.stories.tsx
    - apps/storybook/src/stories/Type.stories.tsx
    - apps/storybook/src/stories/Label.stories.tsx
    - apps/storybook/src/stories/SectionTitle.stories.tsx
    - apps/storybook/src/stories/Textarea.stories.tsx
  deleted:
    - apps/storybook/src/stories/Disclosure.stories.tsx
    - apps/storybook/src/stories/DisclosureItem.stories.tsx
    - apps/storybook/src/stories/OnboardingTip.stories.tsx
    - apps/storybook/src/stories/Radio.stories.tsx
decisions:
  - Use Label composition pattern for Checkbox and Switch (shadcn components have no children prop)
  - Delete Disclosure/DisclosureItem/OnboardingTip/Radio stories and replace with Accordion/Alert/RadioGroup
  - Icon stories use only valid iconMap names (plus/info/star); invalid names render null
metrics:
  duration_minutes: 15
  completed_date: "2026-04-10"
  tasks_completed: 2
  files_modified: 14
---

# Phase 14 Plan 02: Story Rewrites for shadcn/ui APIs Summary

**One-liner:** All 14 Storybook stories rewritten for shadcn/ui component APIs — Accordion/Alert/RadioGroup replace Disclosure/OnboardingTip/Radio, composition patterns replace prop-based APIs, build-storybook exits 0.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite stories with breaking API changes | 7ae7a82 | Button, Input, Select (rewritten); Accordion, Alert, RadioGroup (created); Disclosure, DisclosureItem, OnboardingTip, Radio (deleted) |
| 2 | Update minor stories and verify full build | cf3d262 | Checkbox, Switch, Icon, IconButton, Type, Label, SectionTitle, Textarea |

## Verification

- `turbo run build-storybook` exits 0
- `biome check src/stories/` reports 0 errors across 14 files
- 14 story files exist: Accordion, Alert, Button, Checkbox, Icon, IconButton, Input, Label, RadioGroup, SectionTitle, Select, Switch, Textarea, Type
- No references to removed APIs: `tint`, `SelectMenuOption`, `DisclosureItem`, `Disclosure`, `OnboardingTip`, `Radio` (standalone), `inverse` on Type, `iconProps` on Input
- All story files use CSF3 format with `satisfies Meta<typeof Component>` and `tags: ['autodocs']`
- All imports from `@repo/ui`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ran bun install to activate Storybook 10 binaries**
- **Found during:** Task 2 build verification
- **Issue:** `turbo run build-storybook` was running Storybook 8.6.18 binary despite package.json specifying 10.3.5. The `bun install` after plan 14-01's package.json update had not been executed in this worktree.
- **Fix:** Ran `bun install` at repo root — 62 packages installed in 51ms, activating the Storybook 10.3.5 binary
- **Files modified:** bun.lock (already tracked)
- **Commit:** cf3d262 (part of Task 2)

**2. [Rule 1 - Bug] Fixed Biome lint violations across all 14 story files**
- **Found during:** Task 2 lint check
- **Issue:** All story files used single quotes instead of double quotes (Biome format rule) and had incorrect import order (type imports should come after value imports per Biome organizeImports)
- **Fix:** Ran `bunx biome check --write src/stories/` — auto-fixed all 14 files
- **Files modified:** All 14 story files
- **Commit:** cf3d262

## Known Stubs

None — all stories render actual component content using real @repo/ui exports.

## Threat Flags

None — story files are dev-only tooling, not shipped in the plugin build.

## Self-Check: PASSED
