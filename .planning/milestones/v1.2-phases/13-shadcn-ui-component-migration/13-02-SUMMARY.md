---
phase: 13-shadcn-ui-component-migration
plan: "02"
subsystem: ui
tags: [shadcn, components, radix-ui, lucide-react, tailwind]
dependency_graph:
  requires: [shadcn-foundation, cn-utility, path-alias]
  provides: [shadcn-components, figma-custom-components, full-component-set]
  affects: [packages/ui]
tech_stack:
  added: []
  patterns:
    - shadcn/ui component pattern (cva + Radix primitives + cn)
    - Lucide icon wrapping with name-map lookup
    - Composing shadcn Button for IconButton
key_files:
  created:
    - packages/ui/src/components/ui/button.tsx
    - packages/ui/src/components/ui/checkbox.tsx
    - packages/ui/src/components/ui/input.tsx
    - packages/ui/src/components/ui/label.tsx
    - packages/ui/src/components/ui/select.tsx
    - packages/ui/src/components/ui/switch.tsx
    - packages/ui/src/components/ui/textarea.tsx
    - packages/ui/src/components/ui/radio-group.tsx
    - packages/ui/src/components/ui/accordion.tsx
    - packages/ui/src/components/ui/alert.tsx
    - packages/ui/src/components/figma/icon.tsx
    - packages/ui/src/components/figma/icon-button.tsx
    - packages/ui/src/components/figma/section-title.tsx
    - packages/ui/src/components/figma/type.tsx
  modified: []
decisions:
  - "shadcn CLI placed files at literal @repo/ui/components/ui/ path — moved to src/components/ui/ and fixed imports from @repo/ui/lib/utils to @/lib/utils"
  - "IconButton uses VariantProps<typeof buttonVariants> to preserve type safety without a named ButtonProps type (shadcn Button uses React.ComponentProps)"
  - "Icon component uses explicit name-map for 3 demo icons (plus/info/star) — extensible by adding entries to iconMap"
metrics:
  duration_minutes: 12
  completed_date: "2026-04-09"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 14
---

# Phase 13 Plan 02: shadcn/ui Component Creation Summary

**One-liner:** Add all 14 component equivalents — 10 shadcn/ui components via CLI (Button, Checkbox, Input, Label, Select, Switch, Textarea, RadioGroup, Accordion, Alert) and 4 custom Figma-specific components (Icon, IconButton, SectionTitle, Type) — replacing react-figma-ui's full API surface.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add 10 shadcn/ui components via CLI | 07943b5 | packages/ui/src/components/ui/*.tsx (10 files) |
| 2 | Create 4 custom Figma-specific components | bb85aea | packages/ui/src/components/figma/*.tsx (4 files) |

## What Was Built

### Task 1: 10 shadcn/ui components

Used `bunx shadcn@latest add` to scaffold 10 components. Each component uses:
- `class-variance-authority` (cva) for variant-based styling
- `radix-ui` primitives for accessible behavior
- `cn()` from `@/lib/utils` for class merging

| Component | Exports |
|-----------|---------|
| button.tsx | Button, buttonVariants |
| checkbox.tsx | Checkbox |
| input.tsx | Input |
| label.tsx | Label |
| select.tsx | Select, SelectContent, SelectItem, SelectTrigger, SelectValue, etc. |
| switch.tsx | Switch |
| textarea.tsx | Textarea |
| radio-group.tsx | RadioGroup, RadioGroupItem |
| accordion.tsx | Accordion, AccordionItem, AccordionTrigger, AccordionContent |
| alert.tsx | Alert, AlertTitle, AlertDescription, AlertAction |

### Task 2: 4 custom Figma-specific components

Hand-authored components matching the react-figma-ui API surface:

- **Icon** — Wraps lucide-react icons via a name-map; supports `iconName` (string) and `spin` (boolean) props; currently maps: plus, info, star
- **IconButton** — Composes `Button` (size=icon) with an `Icon` child; supports `iconProps` and `selected` prop (selected=true → default variant, else ghost)
- **SectionTitle** — Panel section heading styled with `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`
- **Type** — Typography component with `size` (xsmall/small/large/xlarge → 11/12/13/14px) and `weight` (normal/medium/bold) props

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn CLI created files in wrong directory**
- **Found during:** Task 1
- **Issue:** The shadcn CLI interpreted `"@repo/ui/components"` alias literally and created files at `packages/ui/@repo/ui/components/ui/` instead of `packages/ui/src/components/ui/`
- **Fix:** Moved all 10 files to `packages/ui/src/components/ui/`; fixed import paths from `@repo/ui/lib/utils` to `@/lib/utils` using sed across all 10 files
- **Files modified:** All 10 shadcn components
- **Commit:** 07943b5

**2. [Rule 1 - Bug] ButtonProps named type does not exist in new shadcn Button**
- **Found during:** Task 2
- **Issue:** Plan's icon-button.tsx template used `import { Button, type ButtonProps }` but shadcn's Button component does not export a `ButtonProps` type — it uses `React.ComponentProps<"button">` inline
- **Fix:** Replaced `ButtonProps` with `VariantProps<typeof buttonVariants>` composed with `React.ComponentProps<"button">` for full type safety
- **Files modified:** packages/ui/src/components/figma/icon-button.tsx
- **Commit:** bb85aea

## Known Stubs

None — all components are fully functional with no placeholder data or hardcoded stubs. Icon's name-map covers the 3 icons used in the demo app (plus, info, star); the map is easily extensible.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. All files are UI-only React components in the sandboxed iframe (T-13-03 and T-13-04 accepted per threat model).

## Self-Check: PASSED

| Item | Status |
|------|--------|
| packages/ui/src/components/ui/button.tsx | FOUND |
| packages/ui/src/components/ui/checkbox.tsx | FOUND |
| packages/ui/src/components/ui/input.tsx | FOUND |
| packages/ui/src/components/ui/label.tsx | FOUND |
| packages/ui/src/components/ui/select.tsx | FOUND |
| packages/ui/src/components/ui/switch.tsx | FOUND |
| packages/ui/src/components/ui/textarea.tsx | FOUND |
| packages/ui/src/components/ui/radio-group.tsx | FOUND |
| packages/ui/src/components/ui/accordion.tsx | FOUND |
| packages/ui/src/components/ui/alert.tsx | FOUND |
| packages/ui/src/components/figma/icon.tsx | FOUND |
| packages/ui/src/components/figma/icon-button.tsx | FOUND |
| packages/ui/src/components/figma/section-title.tsx | FOUND |
| packages/ui/src/components/figma/type.tsx | FOUND |
| commit 07943b5 (task 1) | FOUND |
| commit bb85aea (task 2) | FOUND |
