---
phase: 16-bug-fixes-dark-mode
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/ui/src/index.ts
autonomous: true
requirements: [BUG-03]
must_haves:
  truths:
    - "`AlertAction` is importable from `@repo/ui`"
  artifacts:
    - path: "packages/ui/src/index.ts"
      provides: "`AlertAction` barrel re-export"
      contains: "AlertAction"
  key_links:
    - from: "packages/ui/src/index.ts"
      to: "packages/ui/src/components/ui/alert.tsx"
      via: "named re-export of `AlertAction`"
      pattern: "export \\{ Alert, AlertAction"
---

<objective>
Add `AlertAction` to the `@repo/ui` barrel re-export. `packages/ui/src/components/ui/alert.tsx` already defines and locally exports `AlertAction` (verified in RESEARCH.md) — the gap is only in `packages/ui/src/index.ts`. Implements BUG-03 per D-07.

Purpose: Consumers cannot currently `import { AlertAction } from '@repo/ui'` because the barrel omits it, even though `alert.tsx` exports it.
Output: Updated `index.ts` with `AlertAction` in the Alert re-export.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md
@.planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md
@.planning/phases/16-bug-fixes-dark-mode/16-VALIDATION.md
@packages/ui/src/index.ts
@packages/ui/src/components/ui/alert.tsx

<interfaces>
Current `packages/ui/src/components/ui/alert.tsx` line 69 (already exports AlertAction — do NOT touch):
```typescript
export { Alert, AlertAction, AlertDescription, AlertTitle };
```

Current `packages/ui/src/index.ts` line 14 (missing AlertAction — THIS is the only file to change):
```typescript
export { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
```

Target line 14 in `packages/ui/src/index.ts`:
```typescript
export { Alert, AlertAction, AlertDescription, AlertTitle } from "./components/ui/alert";
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add `AlertAction` to the barrel re-export</name>
  <files>packages/ui/src/index.ts</files>
  <read_first>
    - packages/ui/src/index.ts (confirm line 14 currently reads `export { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";`)
    - packages/ui/src/components/ui/alert.tsx (confirm line 69 already has `AlertAction` in the local export list)
    - .planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md (D-07)
  </read_first>
  <action>
    Edit `packages/ui/src/index.ts`. Change line 14 from:

    ```typescript
    export { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
    ```

    to:

    ```typescript
    export { Alert, AlertAction, AlertDescription, AlertTitle } from "./components/ui/alert";
    ```

    Preserve alphabetical order within the named exports list (`Alert`, `AlertAction`, `AlertDescription`, `AlertTitle`). Do NOT modify any other line in `index.ts`. Do NOT modify `alert.tsx` — it already exports `AlertAction`.
  </action>
  <verify>
    <automated>bun run --filter @repo/ui build &amp;&amp; rg -nF 'AlertAction' packages/ui/src/index.ts</automated>
  </verify>
  <acceptance_criteria>
    - `rg -nF 'AlertAction' packages/ui/src/index.ts` returns exactly 1 match on line 14.
    - `rg -nF 'export { Alert, AlertAction, AlertDescription, AlertTitle }' packages/ui/src/index.ts` returns exactly 1 match.
    - `rg -nF 'AlertAction' packages/ui/src/components/ui/alert.tsx` still returns exactly 1 match on line 69 (unchanged).
    - `bun run --filter @repo/ui build` exits 0.
    - `bun run --filter @repo/ui test` exits 0.
    - Maps to 16-VALIDATION.md row 16-03-01.
  </acceptance_criteria>
  <done>`AlertAction` is in the barrel, and the build succeeds.</done>
</task>

</tasks>

<verification>
1. `rg 'AlertAction' packages/ui/src/index.ts` — 1 match.
2. `bun run --filter @repo/ui build` — exits 0.
</verification>

<success_criteria>
BUG-03 resolved: `AlertAction` is re-exported from `@repo/ui`, consumers can import it directly from the package root.
</success_criteria>

<output>
Create `.planning/phases/16-bug-fixes-dark-mode/16-03-SUMMARY.md` recording:
- The one-line change to `packages/ui/src/index.ts`
- Confirmation that `alert.tsx` was NOT touched
- BUG-03 status: satisfied
</output>
