---
phase: 16-bug-fixes-dark-mode
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/ui/src/components/ui/button.tsx
autonomous: true
requirements: [BUG-02]
must_haves:
  truths:
    - "`ButtonProps` is a real exported type from `@repo/ui`, not a phantom"
    - "Consumers can write `import { type ButtonProps } from '@repo/ui'` and get a resolved type"
  artifacts:
    - path: "packages/ui/src/components/ui/button.tsx"
      provides: "Named `ButtonProps` type export"
      contains: "export type ButtonProps"
  key_links:
    - from: "packages/ui/src/index.ts"
      to: "packages/ui/src/components/ui/button.tsx"
      via: "re-export `type ButtonProps`"
      pattern: "type ButtonProps"
---

<objective>
Define and export `type ButtonProps` from `packages/ui/src/components/ui/button.tsx`, and use the named type in the `Button` function signature. The existing `packages/ui/src/index.ts` barrel already re-exports `type ButtonProps` — this task makes that re-export real. Implements BUG-02 per D-06.

Purpose: The barrel re-export is currently a phantom — TypeScript silently erases it because no such type exists in `button.tsx`. Defining the named type makes the export a real API surface and unblocks future TYPE-01 (Phase 17) type-check work.
Output: Named `ButtonProps` type export in `button.tsx`; `Button` function signature uses the type.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md
@.planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md
@.planning/phases/16-bug-fixes-dark-mode/16-VALIDATION.md
@packages/ui/src/components/ui/button.tsx
@packages/ui/src/index.ts

<interfaces>
Current `packages/ui/src/components/ui/button.tsx` (key lines):

```typescript
// Line 1-5 (imports):
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

// Line 44-53 (current signature uses inline intersection type):
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {

// Line 67 (current export — no ButtonProps):
export { Button, buttonVariants };
```

Current `packages/ui/src/index.ts` line 15 (phantom re-export — unchanged in this plan):
```typescript
export { Button, type ButtonProps, buttonVariants } from "./components/ui/button";
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Define and export `ButtonProps` named type in button.tsx</name>
  <files>packages/ui/src/components/ui/button.tsx</files>
  <read_first>
    - packages/ui/src/components/ui/button.tsx (see current inline intersection on lines 50-53)
    - packages/ui/src/index.ts (line 15 already re-exports `type ButtonProps` — do NOT modify this file)
    - .planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md (section "BUG-02 — ButtonProps (confirmed phantom)")
    - .planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md (D-06)
  </read_first>
  <behavior>
    - `packages/ui/src/components/ui/button.tsx` exports a named `type ButtonProps`.
    - The `Button` function signature uses `ButtonProps` (no inline intersection).
    - The new type is structurally identical to the current inline intersection: `React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }`.
    - `bun run --filter @repo/ui build` still succeeds (no regression).
    - `bun run --filter @repo/ui test` still passes.
  </behavior>
  <action>
    Edit `packages/ui/src/components/ui/button.tsx` in two places:

    1. Immediately AFTER the `buttonVariants` cva block (after line 42 `);`) and BEFORE the `function Button` declaration, add the named type export:

    ```typescript
    export type ButtonProps = React.ComponentProps<"button"> &
      VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
      };
    ```

    2. Change the `Button` function signature from the inline intersection (current lines 44-53):

    ```typescript
    function Button({
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    }: React.ComponentProps<"button"> &
      VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
      }) {
    ```

    to use the named type:

    ```typescript
    function Button({
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    }: ButtonProps) {
    ```

    Do NOT modify the final `export { Button, buttonVariants };` line — the `ButtonProps` export is a separate `export type` statement above the function. Do NOT modify `packages/ui/src/index.ts` — its `type ButtonProps` re-export becomes real automatically once the type exists in `button.tsx`. Do NOT change `buttonVariants`, the `cva` call, or any variant keys.

    Why the `export type` form: a named type export keeps the emitted JS free of runtime markers (type-only erase) while letting `packages/ui/src/index.ts`'s existing `type ButtonProps` re-export bind to a real definition.
  </action>
  <verify>
    <automated>bun run --filter @repo/ui build &amp;&amp; bun run --filter @repo/ui test</automated>
  </verify>
  <acceptance_criteria>
    - `rg -n 'export type ButtonProps' packages/ui/src/components/ui/button.tsx` returns exactly 1 match.
    - `rg -nF 'React.ComponentProps<"button">' packages/ui/src/components/ui/button.tsx` returns exactly 1 match (the new type — the inline intersection is gone).
    - `rg -nF ': ButtonProps' packages/ui/src/components/ui/button.tsx` returns exactly 1 match (the function signature uses the named type).
    - `rg -nF 'asChild?: boolean' packages/ui/src/components/ui/button.tsx` returns exactly 1 match (the optional field is in the type, not the signature).
    - `bun run --filter @repo/ui build` exits 0.
    - `bun run --filter @repo/ui test` exits 0.
    - `packages/ui/src/index.ts` is unchanged (git diff shows 0 lines modified in that file).
    - Maps to 16-VALIDATION.md rows 16-02-01 and 16-02-02.
  </acceptance_criteria>
  <done>ButtonProps is a real named export in button.tsx, the Button signature uses it, barrel re-export is now real, build and tests are green.</done>
</task>

</tasks>

<verification>
1. `bun run --filter @repo/ui build` — exits 0.
2. `bun run --filter @repo/ui test` — exits 0.
3. `rg 'export type ButtonProps' packages/ui/src/components/ui/button.tsx` — 1 match.
4. Confirm `packages/ui/src/index.ts` line 15 is unchanged.
</verification>

<success_criteria>
BUG-02 resolved: `ButtonProps` is a real, named type exported from `button.tsx`, the `Button` function signature binds to it, the barrel re-export is no longer phantom, and all tests/builds pass.
</success_criteria>

<output>
Create `.planning/phases/16-bug-fixes-dark-mode/16-02-SUMMARY.md` recording:
- The new `export type ButtonProps` block (verbatim)
- The change to the Button function signature
- Confirmation that index.ts was NOT touched
- BUG-02 status: satisfied
</output>
