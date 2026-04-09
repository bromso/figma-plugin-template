---
phase: 07-storybook-setup-and-stories
plan: 02
subsystem: apps/storybook
tags: [storybook, stories, csf3, turborepo, react-figma-ui]
dependency-graph:
  requires:
    - 07-01 (Storybook scaffold with main.ts, preview.ts, turbo tasks)
  provides:
    - CSF3 story files for all 14 react-figma-ui components
    - Turborepo cache for build-storybook task
  affects:
    - apps/storybook/src/stories/
    - .gitignore (storybook-static excluded)
tech-stack:
  added:
    - CSF3 story format with satisfies Meta pattern
  patterns:
    - render-prop pattern for composite components (Disclosure, Select)
    - @repo/ui workspace import for all stories
key-files:
  created:
    - apps/storybook/src/stories/Button.stories.tsx
    - apps/storybook/src/stories/Checkbox.stories.tsx
    - apps/storybook/src/stories/Disclosure.stories.tsx
    - apps/storybook/src/stories/DisclosureItem.stories.tsx
    - apps/storybook/src/stories/Icon.stories.tsx
    - apps/storybook/src/stories/IconButton.stories.tsx
    - apps/storybook/src/stories/Input.stories.tsx
    - apps/storybook/src/stories/Label.stories.tsx
    - apps/storybook/src/stories/SectionTitle.stories.tsx
    - apps/storybook/src/stories/OnboardingTip.stories.tsx
    - apps/storybook/src/stories/Radio.stories.tsx
    - apps/storybook/src/stories/Select.stories.tsx
    - apps/storybook/src/stories/Switch.stories.tsx
    - apps/storybook/src/stories/Textarea.stories.tsx
    - apps/storybook/src/stories/Type.stories.tsx
  modified:
    - .gitignore (added storybook-static entry)
decisions:
  - "Disclosure and Select use render-prop pattern from library API (not children JSX), matching the actual react-figma-ui generic component signatures"
  - "storybook-static added to .gitignore to prevent Turbo from including build outputs in task hash inputs (fixes cache miss on every run)"
metrics:
  duration_minutes: 25
  tasks_completed: 2
  tasks_total: 2
  files_created: 15
  files_modified: 1
  completed_date: "2026-04-09"
---

# Phase 7 Plan 02: Component Stories Summary

## What Was Built

15 CSF3 story files covering all 14 react-figma-ui components (with DisclosureItem as a standalone story in addition to Disclosure). All stories import from `@repo/ui` workspace package, use `satisfies Meta<typeof Component>` for type-safe Controls/Autodocs, and export at least one `Default` story. Composite components (Disclosure, Select) use render-prop composition matching the actual library generics API. Turborepo caching for `build-storybook` verified working with "FULL TURBO" on second run.

## Commits

| # | Hash | Description |
|---|------|-------------|
| 1 | 3fd528f | feat(07-02): create CSF3 story files for all 15 react-figma-ui components |
| 2 | b35c175 | fix(07-02): add storybook-static to .gitignore to fix Turborepo cache |

## Verification Results

| Check | Result |
|-------|--------|
| 15 .stories.tsx files in apps/storybook/src/stories/ | PASS |
| All 15 files import from @repo/ui | PASS |
| All 15 files use satisfies Meta pattern | PASS |
| Select.stories.tsx contains SelectMenuOption | PASS |
| Disclosure.stories.tsx contains DisclosureItem | PASS |
| storybook-static/ directory exists | PASS |
| Second turbo run shows FULL TURBO cache hit | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Turborepo cache never hitting on repeated builds**
- **Found during:** Task 2
- **Issue:** Turbo was hashing 67 untracked files (all files in `storybook-static/`) as task inputs for `@repo/storybook#build-storybook`. Since each Storybook build produces files with content hashes in their names (e.g., `Button.stories-Bs-uGgTl.js`), the untracked file set differed every run, producing a unique task hash each time and guaranteeing a cache miss.
- **Root cause:** `storybook-static/` was not in `.gitignore`. Turbo uses `git ls-tree` for tracked files but also hashes untracked files as inputs. The trace showed `to_hash_count=67` for the storybook package.
- **Fix:** Added `storybook-static` to root `.gitignore`. After fix, `to_hash_count=0` and second turbo run shows "FULL TURBO" (1 cached, 1 total).
- **Files modified:** `.gitignore`
- **Commit:** b35c175

**2. [Rule 3 - Blocking] Disclosure and Select APIs differ from plan's JSX pattern**
- **Found during:** Task 1
- **Issue:** The plan showed Disclosure and Select using JSX children pattern. The actual react-figma-ui library uses render-prop generics: `Disclosure<T>` takes `tips: T[]` and `render(tip, index, all): ReactElement`. Similarly `SelectMenu<T>` takes `options: T[]` and `render(option): ReactElement`.
- **Fix:** Used the correct render-prop composition pattern matching the actual TypeScript type definitions, which was already anticipated in the plan's "Verify actual prop names" note.
- **Files modified:** `Disclosure.stories.tsx`, `Select.stories.tsx`
- **Commit:** 3fd528f

## Known Stubs

None — all stories render actual react-figma-ui components with real props from the type definitions.

## Self-Check: PASSED

- All 15 story files exist at `apps/storybook/src/stories/*.stories.tsx`
- Commits 3fd528f and b35c175 verified in git log
- `apps/storybook/storybook-static/` directory exists with built output
- Second `turbo run build-storybook` shows `Cached: 1 cached, 1 total` and `FULL TURBO`
