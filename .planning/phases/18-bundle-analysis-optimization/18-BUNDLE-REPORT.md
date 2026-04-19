# Phase 18: Bundle Analysis Report

**Generated:** 2026-04-19
**Build command:** `bun run --filter @repo/design-plugin build`
**Output:** `apps/design-plugin/dist/index.html` (singlefile)

## Total Bundle Size

| Metric | Size |
|--------|------|
| Total (uncompressed) | 375.4 kB |
| JS (inlined) | 338.6 kB |
| CSS (inlined) | 36.5 kB |
| HTML overhead | 0.3 kB |
| Gzip estimate | ~118.1 kB |

## Top 5 Modules (by contribution)

| # | Module | Notes |
|---|--------|-------|
| 1 | `react-dom` (production) | React 19.2.5 — largest single module, expected |
| 2 | `@radix-ui/*` (51 references) | Accordion, Select, Checkbox, Switch, RadioGroup, Label, Button (Slot) — 7 primitives |
| 3 | `tailwind-merge` | CSS class merging utility (~12 kB unminified) |
| 4 | `@iconify/react/offline` | SVG icon renderer, zero API client code |
| 5 | `class-variance-authority` | Variant props utility for shadcn/ui components |

## Radix Strategy

**Status: OPTIMIZED**

All Radix imports use the unified `radix-ui` package (v1.4.3). No individual `@radix-ui/react-*` packages in `packages/ui/package.json`. The bundler resolves internal `@radix-ui/react-*` modules from the unified package's `node_modules`.

Import pattern verified across all 7 components:
- `import { Slot } from "radix-ui"` (button.tsx)
- `import { Select as SelectPrimitive } from "radix-ui"` (select.tsx)
- `import { Accordion as AccordionPrimitive } from "radix-ui"` (accordion.tsx)
- `import { Checkbox as CheckboxPrimitive } from "radix-ui"` (checkbox.tsx)
- `import { Switch as SwitchPrimitive } from "radix-ui"` (switch.tsx)
- `import { RadioGroup as RadioGroupPrimitive } from "radix-ui"` (radio-group.tsx)
- `import { Label as LabelPrimitive } from "radix-ui"` (label.tsx)

## Lucide Import Strategy

**Status: OPTIMIZED**

All lucide-react imports are named (no wildcard/namespace imports):
- `import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"` (select.tsx)
- `import { CheckIcon } from "lucide-react"` (checkbox.tsx)
- `import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"` (accordion.tsx)

The main `Icon` component uses `@iconify/react/offline` (Phase 16 migration). The `lucide-react` imports above are internal to shadcn/ui primitives and are tree-shaken to only the 3 icons used (CheckIcon, ChevronDownIcon, ChevronUpIcon).

**Bundle verification:**
- `lucide-react` code (e.g., `createLucideIcon`): NOT in bundle (tree-shaken to individual icons)
- `api.iconify.design`: NOT in bundle (offline-only import path)
- Wildcard/namespace lucide imports: NONE

## Actions Taken

1. Verified unified `radix-ui` package already in use (PERF-02 pre-satisfied from Phase 13)
2. Verified all Lucide imports are named (PERF-03 pre-satisfied from Phase 13)
3. Confirmed `@iconify/react/offline` has zero API client code in bundle
4. Generated this report documenting current state (PERF-01)

## Recommendations for Future Optimization

- **lucide-react → iconify migration for shadcn internals:** The 3 remaining `lucide-react` imports in accordion/checkbox/select could be migrated to `@iconify/react/offline` to fully eliminate `lucide-react` from the dependency tree. Deferred per Phase 16 CONTEXT to a future milestone.
- **Tailwind CSS v4 `@source` directive:** Currently uses `@source "."` which scans all files. Could be narrowed to specific component directories to reduce CSS scanning time (DX improvement, not bundle size).
- **React Compiler (Phase 19):** May reduce JS size by eliminating redundant memoization wrapper code.

---

*Report: 18-BUNDLE-REPORT.md*
*Phase: 18-bundle-analysis-optimization*
