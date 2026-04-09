---
phase: 13-shadcn-ui-component-migration
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - packages/ui/src/index.ts
  - packages/ui/src/app.tsx
  - packages/ui/src/components/figma/icon.tsx
  - packages/ui/src/components/figma/icon-button.tsx
  - packages/ui/src/components/figma/section-title.tsx
  - packages/ui/src/components/figma/type.tsx
  - packages/ui/src/styles.css
  - packages/ui/src/lib/utils.ts
  - packages/ui/src/__tests__/exports.test.ts
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-04-09
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This phase migrated the `@repo/ui` package from react-figma-ui to shadcn/ui components, adding four custom Figma-styled wrappers (Icon, IconButton, SectionTitle, Type), a Tailwind v4 design-token stylesheet, and a `cn` utility. The code is well-structured and the migration is largely complete. Three warnings and four informational items were identified.

Key concerns: `AlertAction` is exported from its source file but omitted from `index.ts`, so callers cannot use it; the `Icon` component silently returns `null` for unknown icon names with no developer warning; and the test suite imports `AlertTitle` (correctly re-exported) but does not test `buttonVariants` even though it is explicitly re-exported from `index.ts`.

## Warnings

### WR-01: `AlertAction` missing from public index

**File:** `packages/ui/src/index.ts:22`
**Issue:** `alert.tsx` exports four symbols — `Alert`, `AlertTitle`, `AlertDescription`, and `AlertAction`. `index.ts` re-exports only the first three. Any consumer that needs to place a dismiss button or action inside an Alert cannot import `AlertAction` from `@repo/ui`.
**Fix:** Add `AlertAction` to the alert re-export line in `index.ts`:
```ts
export { Alert, AlertDescription, AlertTitle, AlertAction } from './components/ui/alert';
```

### WR-02: `Icon` silently returns `null` for unknown icon names

**File:** `packages/ui/src/components/figma/icon.tsx:18`
**Issue:** When `iconName` is not found in `iconMap`, the component returns `null` with no console warning or TypeScript narrowing. Callers passing a misspelled or dynamically-constructed icon name will see blank space with no indication of failure. Because `iconName` is typed as `string` rather than `keyof typeof iconMap`, the compiler will not catch invalid names either.
**Fix (preferred — narrow the type):**
```ts
export interface IconProps extends LucideProps {
  iconName: keyof typeof iconMap;
  spin?: boolean;
}
```
If a broad `string` type is required for dynamic use, add a dev-mode warning:
```ts
if (!LucideIcon) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[Icon] Unknown iconName: "${iconName}"`);
  }
  return null;
}
```

### WR-03: `buttonVariants` is re-exported from `index.ts` but not tested

**File:** `packages/ui/src/__tests__/exports.test.ts:31`
**Issue:** `index.ts` line 2 explicitly re-exports `buttonVariants` as part of the public API (`export { Button, type ButtonProps, buttonVariants }`). The exports test imports every other named export and asserts it is defined, but never imports or asserts `buttonVariants`. If the export is accidentally removed or renamed in a future refactor, no test will catch the regression.
**Fix:** Add `buttonVariants` to the import and assertion block:
```ts
import {
  // ...existing imports...
  buttonVariants,
} from '../index';

// inside the test:
expect(buttonVariants).toBeDefined();
```

## Info

### IN-01: `cn(className)` wrapper in `IconButton` is redundant

**File:** `packages/ui/src/components/figma/icon-button.tsx:28`
**Issue:** `cn(className)` with a single argument adds no value — it is equivalent to `className ?? undefined`. The `cn` utility exists to merge multiple class lists; wrapping a single value just adds an unnecessary function call.
**Fix:**
```tsx
<Button
  size={size ?? "icon"}
  variant={selected ? "default" : (variant ?? "ghost")}
  className={className}
  {...props}
>
```

### IN-02: `dark:` variants in `styles.css` have no dark-mode token definitions

**File:** `packages/ui/src/styles.css:1-63`
**Issue:** Several shadcn/ui components (button, alert, select) apply `dark:` Tailwind variants (e.g., `dark:border-input`, `dark:bg-destructive/20`). The stylesheet only defines `:root` tokens; there is no `@media (prefers-color-scheme: dark)` or `.dark` selector with overriding token values. Dark-mode styling will fall back to light-mode token values.
**Fix:** Add a dark-mode token block if dark mode is intended to be supported:
```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.14 0 0);
    --foreground: oklch(0.95 0 0);
    /* … remaining dark-mode overrides */
  }
}
```
If dark mode is intentionally out of scope for this plugin, remove `dark:` variants from the shadcn/ui component files to keep the CSS surface honest.

### IN-03: `Type` component always renders a `<p>` element regardless of semantic intent

**File:** `packages/ui/src/components/figma/type.tsx:30`
**Issue:** The component is used for both headings (`size="large" weight="bold"`) and body copy. Hardcoding `<p>` means heading-level text is not a heading element, which hurts accessibility and screen-reader navigation. The original react-figma-ui `Type` component accepted an `as` prop for this reason.
**Fix:** Add a polymorphic `as` prop defaulting to `"p"`:
```tsx
interface TypeProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  size?: keyof typeof sizeMap;
  weight?: keyof typeof weightMap;
  children: React.ReactNode;
}

export function Type({ as: Tag = "p", children, size = "small", weight = "normal", className, ...props }: TypeProps) {
  return <Tag className={cn(sizeMap[size], weightMap[weight], "font-sans", className)} {...props}>{children}</Tag>;
}
```

### IN-04: `iconMap` in `icon.tsx` contains only three icons; no registry pattern for extension

**File:** `packages/ui/src/components/figma/icon.tsx:5-9`
**Issue:** The icon registry is a module-level constant object. Adding new icons requires editing the component file directly. This is a low-friction maintenance concern now, but will scale poorly as the plugin grows. Consider exporting `iconMap` or providing a registration mechanism so consuming code can extend the set without patching the library.
**Fix (minimal):** Export the map so consuming code can type-check against its keys:
```ts
export const iconMap: Record<string, ComponentType<LucideProps>> = { … };
```
This at minimum enables `keyof typeof iconMap` narrowing at call sites without changing the internal structure.

---

_Reviewed: 2026-04-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
