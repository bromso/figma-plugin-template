---
phase: 16-bug-fixes-dark-mode
plan: 04
subsystem: packages/ui / apps/storybook — Icon component library migration
tags: [bug-fix, iconify, icon, type-narrowing, offline-bundle]
requires:
  - "@iconify/react offline bundle (v6)"
  - "@iconify-json/lucide icon data"
  - "Plan 03 (AlertAction barrel export) — Wave 1 — does NOT touch icon export line"
provides:
  - "StaticIconName string literal union (narrowed compile-time icon names)"
  - "Iconify-based <Icon name=\"...\"/> component with preloaded whitelist"
  - "Zero-network-code Icon bundle (no api.iconify.design references)"
affects:
  - "BUG-04 requirement satisfied"
  - "packages/ui public API surface: new StaticIconName export, IconProps.name replaces IconProps.iconName"
  - "apps/design-plugin dist bundle: no longer imports lucide-react through the public Icon API"
tech-stack:
  added:
    - "@iconify/react@6.0.2 (dependency, runtime import)"
    - "@iconify-json/lucide@1.2.102 (dependency, icon data source — body strings copied into icon.tsx, package itself tree-shaken to zero at bundle time)"
    - "@iconify/types@2.0.0 (transitive dep of @iconify/react — provides IconifyJSON type)"
  patterns:
    - "Offline-first iconify: addCollection() at module scope preloads a hand-curated subset at import time"
    - "Narrow string literal union for Icon.name prop — compile-time rejection of unknown names"
    - "vitest --typecheck to enforce @ts-expect-error assertions against the type narrowing"
key-files:
  created:
    - "packages/ui/src/components/figma/icon.test.tsx"
  modified:
    - "packages/ui/package.json"
    - "bun.lock"
    - "packages/ui/src/components/figma/icon.tsx"
    - "packages/ui/src/index.ts"
    - "packages/ui/src/app.tsx"
    - "apps/storybook/src/stories/Icon.stories.tsx"
    - "apps/storybook/src/stories/IconButton.stories.tsx"
    - ".planning/phases/16-bug-fixes-dark-mode/deferred-items.md (logged sibling-plan lint errors)"
  unchanged_verified:
    - "packages/ui/src/components/figma/icon-button.tsx (0 iconName refs — propagates via spread)"
decisions:
  - "Used @iconify/react/offline (not the default @iconify/react) to guarantee zero fetch/XMLHttpRequest/api.iconify.design references in the built bundle (per RESEARCH.md D-08/D-09)."
  - "Hand-coded the 3-icon lucideSubset as a literal constant rather than importing @iconify-json/lucide/icons.json directly — the per-icon approach keeps bundle impact minimal (the full icons.json is ~537KB)."
  - "Replaced the info and star body strings with the VERBATIM strings from node_modules/@iconify-json/lucide/icons.json (v1.2.102) because they differ slightly from the plan's interfaces block (newer Lucide paths). The plus body matches exactly."
  - "StaticIconName is a bare string literal union in Phase 16; Phase 17 TYPE-02 will restructure it into an interface StaticIconNameMap for module augmentation (TODO comment in icon.tsx)."
  - "IconProps now extends Omit<React.ComponentProps<\"svg\">, \"name\"> instead of LucideProps — the Omit prevents collision with SVG's native name attribute."
  - "lucide-react was NOT removed from packages/ui dependencies — it is still used internally by select/checkbox/accordion (Phase 18 scope)."
  - "Did NOT add test.typecheck config to vitest.config.ts — the --typecheck CLI flag works out-of-the-box in vitest 4.1.4 without config changes."
metrics:
  duration: "5m 26s"
  completed: "2026-04-10T13:52:30Z"
  tasks_total: 3
  tasks_completed: 3
---

# Phase 16 Plan 04: Iconify Migration Summary

Migrated the public `Icon` component from `lucide-react` + 3-entry `iconMap` to `@iconify/react/offline` with a hand-curated 3-icon lucide whitelist, renamed `iconName` → `name`, narrowed it to a `StaticIconName` union (proven by `vitest --typecheck`), and exported `StaticIconName` from `@repo/ui` — built bundle now contains zero references to `api.iconify.design`.

## Commits

| Task | Type     | Hash      | Message                                                              |
| ---- | -------- | --------- | -------------------------------------------------------------------- |
| 1    | test     | `02dd3e1` | test(16-04): add failing icon.test.tsx + install iconify deps        |
| 2    | feat     | `2f6ce52` | feat(16-04): rewrite Icon with @iconify/react/offline + StaticIconName |
| 3    | feat     | `831af17` | feat(16-04): rename iconName->name at call sites + biome import sort |

## Installed Dependencies (from bun.lock)

```
@iconify/react@6.0.2
@iconify-json/lucide@1.2.102
@iconify/types@2.0.0   # transitive, provides IconifyJSON type
```

`lucide-react@1.8.0` was preserved (still a direct dep of `@repo/ui` — used internally by `select.tsx`, `checkbox.tsx`, `accordion.tsx` shadcn primitives; Phase 18 scope).

## New `icon.tsx` (verbatim)

```tsx
import { addCollection, Icon as IconifyIcon } from "@iconify/react/offline";
import type { IconifyJSON } from "@iconify/types";
import type * as React from "react";
import { cn } from "@/lib/utils";

// BUG-04 — Curated lucide subset preloaded at module init.
// Using @iconify/react/offline means this bundle has ZERO network code:
// no references to api.iconify.design, no fetch, no XMLHttpRequest.
// To expand the whitelist, add more entries to `lucideSubset.icons` and
// append their names to `StaticIconName`.
//
// TODO(Phase 17): Phase 17 restructures StaticIconName into a
// `interface StaticIconNameMap` that consumers can augment via module
// augmentation, and ships a `registerIcons(iconifyData)` helper.
//
// Body strings are copied verbatim from
// node_modules/@iconify-json/lucide/icons.json (v1.2.102) keys plus/info/star.
const lucideSubset: IconifyJSON = {
  prefix: "lucide",
  icons: {
    plus: {
      body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7v14"/>',
    },
    info: {
      body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></g>',
    },
    star: {
      body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z"/>',
    },
  },
  width: 24,
  height: 24,
};

addCollection(lucideSubset);

export type StaticIconName = "lucide:plus" | "lucide:info" | "lucide:star";

export interface IconProps extends Omit<React.ComponentProps<"svg">, "name"> {
  name: StaticIconName;
  spin?: boolean;
}

export function Icon({ name, spin, className, ...props }: IconProps) {
  return (
    <IconifyIcon
      icon={name}
      className={cn("size-4", spin && "animate-spin", className)}
      {...props}
    />
  );
}
```

**Note on the `info` and `star` body strings:** The plan's `<interfaces>` block provided a zero-work-baseline snapshot of what those paths looked like historically; the installed `@iconify-json/lucide@1.2.102` ships slightly newer Lucide paths. Per the plan's explicit sanity-check instruction ("replace literals with exact strings from node_modules/@iconify-json/lucide/icons.json"), both bodies were substituted with the installed values. `plus` matched exactly and was kept as-is.

## Call-site Diff

### `packages/ui/src/index.ts`

```diff
-export { Icon, type IconProps } from "./components/figma/icon";
+export { Icon, type IconProps, type StaticIconName } from "./components/figma/icon";
```

### `packages/ui/src/app.tsx` (3 sites)

```diff
-        <IconButton iconProps={{ iconName: "plus" }} aria-label="Add item" />
+        <IconButton iconProps={{ name: "lucide:plus" }} aria-label="Add item" />
...
-        <Icon iconName="star" />
+        <Icon name="lucide:star" />
...
-          <Icon iconName="info" className="size-4" />
+          <Icon name="lucide:info" className="size-4" />
```

### `apps/storybook/src/stories/Icon.stories.tsx` (4 stories)

```diff
-  args: { iconName: "info" },
+  args: { name: "lucide:info" },
...
-  args: { iconName: "plus" },
+  args: { name: "lucide:plus" },
...
-  args: { iconName: "star" },
+  args: { name: "lucide:star" },
...
-  args: { iconName: "info", spin: true },
+  args: { name: "lucide:info", spin: true },
```

### `apps/storybook/src/stories/IconButton.stories.tsx` (3 stories)

```diff
-  args: { iconProps: { iconName: "plus" } },
+  args: { iconProps: { name: "lucide:plus" } },
...
-  args: { iconProps: { iconName: "star" }, selected: true },
+  args: { iconProps: { name: "lucide:star" }, selected: true },
...
-  args: { iconProps: { iconName: "info" } },
+  args: { iconProps: { name: "lucide:info" } },
```

### `packages/ui/src/components/figma/icon-button.tsx` — VERIFIED UNCHANGED

`rg -nF 'iconName' packages/ui/src/components/figma/icon-button.tsx` → 0 matches (confirmed the planning-time finding: the prop propagates via `<Icon {...iconProps} />` spread, so the `IconProps` interface update in Task 2 automatically flows through).

## Verification Results

### 1. `iconName` audit

```bash
$ rg -nF 'iconName' packages/ui apps/storybook apps/design-plugin
# 0 matches
```

### 2. Built bundle network audit (BUG-04 key success criterion)

```bash
$ bun run build
...
dist/index.html  382.38 kB │ gzip: 117.84 kB
✓ built in 271ms
Tasks: 1 successful, 1 total
Time: 2.352s

$ rg -nF 'api.iconify.design' apps/design-plugin/dist/
# 0 matches
```

### 3. vitest --typecheck (enforces @ts-expect-error narrowing)

```bash
$ cd packages/ui && bunx vitest run --typecheck src/components/figma/icon.test
Testing types with tsc and vue-tsc is an experimental feature.
 RUN  v4.1.4

 Test Files  1 passed (1)
      Tests  4 passed (4)
Type Errors  no errors
   Duration  430ms
```

`Type Errors: no errors` means the `@ts-expect-error` assertion on `<Icon name="lucide:unknown" />` genuinely caught a type error (if the unknown name had been valid, `@ts-expect-error` would itself have errored with "Unused '@ts-expect-error' directive"). BUG-04 narrowing requirement satisfied.

### 4. Full `@repo/ui` test suite

```bash
$ cd packages/ui && bunx vitest run
 Test Files  5 passed (5)
      Tests  13 passed (13)
```

### 5. `StaticIconName` public export

```bash
$ rg -nF 'type StaticIconName' packages/ui/src/index.ts
4:export { Icon, type IconProps, type StaticIconName } from "./components/figma/icon";
```

## BUG-04 Status

**SATISFIED.** All requirement facets:

| Requirement facet                                                          | Status |
| -------------------------------------------------------------------------- | ------ |
| Icon component uses iconify/react (not lucide-react) for public API        | ✅     |
| name prop narrowed — invalid names fail at compile time                    | ✅     |
| Invalid-name compile-time failure is proven (not just claimed)             | ✅ (vitest --typecheck green + @ts-expect-error satisfied) |
| Built bundle has 0 references to api.iconify.design                        | ✅     |
| iconName removed repo-wide (packages/ui, apps/storybook, apps/design-plugin) | ✅   |
| StaticIconName exported from @repo/ui                                      | ✅     |
| lucide-react preserved for internal shadcn primitives (select/checkbox/accordion) | ✅     |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Correctness] Body strings substituted from installed package**

- **Found during:** Task 2
- **Issue:** The plan's `<interfaces>` block documented historical `info` and `star` body strings which differ from the installed `@iconify-json/lucide@1.2.102` paths.
- **Fix:** Per the plan's explicit instruction ("replace literals with exact strings from node_modules/@iconify-json/lucide/icons.json"), used `node` + `require` to read the installed `icons.json`, extracted the three body strings, and substituted them verbatim into `icon.tsx`. The `plus` path matched exactly; `info` and `star` are the newer Lucide shapes.
- **Files modified:** `packages/ui/src/components/figma/icon.tsx`
- **Commit:** `2f6ce52`

**2. [Rule 3 — Blocking fix] Biome `organizeImports` auto-fix on `icon.tsx`**

- **Found during:** Task 3 (end-of-plan lint check)
- **Issue:** `bun run lint` reported `assist/source/organizeImports` on `icon.tsx` — imports were not in biome's alphabetized order.
- **Fix:** Ran `bunx biome check --write src/components/figma/icon.tsx` to auto-sort. Imports became `{ addCollection, Icon as IconifyIcon }` (alphabetical). No behavior change.
- **Files modified:** `packages/ui/src/components/figma/icon.tsx`
- **Commit:** `831af17`

### Adjustments to Plan Acceptance Criteria

**`bun run --filter @repo/ui build` does not exist.** The `@repo/ui` package is a JIT source-only package with no `build` script (scripts: only `lint`, `test`, `test:watch`). The build criterion was satisfied by running the root `bun run build`, which builds the `@repo/design-plugin` app that consumes `@repo/ui` via workspace symlink — this exercises the same code path (iconify imports, `StaticIconName` types, addCollection call) through the real Vite UI build.

### Deferred Out-of-Scope Issues

**Pre-existing lint errors owned by sibling Wave 2 plans** (logged in `deferred-items.md`):

1. `packages/ui/src/__tests__/button-props.test.ts` — `lint/style/useImportType` — belongs to Plan 02 (BUG-02).
2. `apps/design-plugin/` — Biome formatter diff — belongs to Plan 01 or 06 (unclear; whichever last touched those files).

Per executor scope rules, these are NOT fixed by Plan 04 (they were not caused by this plan's changes). They are documented for the orchestrator's final lint sweep.

## Note for Phase 17 Planner

**TYPE-02 should restructure `StaticIconName` into a module-augmentation-friendly interface.** Current Phase 16 state is a bare string literal union:

```typescript
export type StaticIconName = "lucide:plus" | "lucide:info" | "lucide:star";
```

Phase 17 TYPE-02 should:

1. Convert to `interface StaticIconNameMap { "lucide:plus": true; "lucide:info": true; "lucide:star": true; }` and derive `type StaticIconName = keyof StaticIconNameMap`.
2. Ship a `registerIcons(iconifyData: IconifyJSON)` helper that wraps `addCollection` and is importable from `@repo/ui`.
3. Document the interface-augmentation pattern so template consumers can extend the whitelist without forking the source.

See RESEARCH.md "Deferred Ideas" section and `icon.tsx`'s `TODO(Phase 17)` comment.

## Self-Check: PASSED

**Files created — verified exist:**

- ✅ `packages/ui/src/components/figma/icon.test.tsx`
- ✅ `.planning/phases/16-bug-fixes-dark-mode/16-04-SUMMARY.md` (this file)

**Files modified — verified committed:**

- ✅ `packages/ui/package.json` (commit `02dd3e1`)
- ✅ `bun.lock` (commit `02dd3e1`)
- ✅ `packages/ui/src/components/figma/icon.tsx` (commits `2f6ce52`, `831af17`)
- ✅ `packages/ui/src/index.ts` (commit `2f6ce52`)
- ✅ `packages/ui/src/app.tsx` (commit `831af17`)
- ✅ `apps/storybook/src/stories/Icon.stories.tsx` (commit `831af17`)
- ✅ `apps/storybook/src/stories/IconButton.stories.tsx` (commit `831af17`)

**Commits — verified in git log:**

- ✅ `02dd3e1` test(16-04): add failing icon.test.tsx + install iconify deps
- ✅ `2f6ce52` feat(16-04): rewrite Icon with @iconify/react/offline + StaticIconName
- ✅ `831af17` feat(16-04): rename iconName->name at call sites + biome import sort
