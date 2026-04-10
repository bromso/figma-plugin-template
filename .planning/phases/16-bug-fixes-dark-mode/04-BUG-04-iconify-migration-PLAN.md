---
phase: 16-bug-fixes-dark-mode
plan: 04
type: execute
wave: 2
depends_on: ["03"]
files_modified:
  - packages/ui/package.json
  - bun.lock
  - packages/ui/src/components/figma/icon.tsx
  - packages/ui/src/components/figma/icon.test.tsx
  - packages/ui/src/index.ts
  - packages/ui/src/app.tsx
  - apps/storybook/src/stories/Icon.stories.tsx
  - apps/storybook/src/stories/IconButton.stories.tsx
autonomous: true
requirements: [BUG-04]
must_haves:
  truths:
    - "`<Icon name=\"lucide:plus\" />` compiles with a narrowed StaticIconName type"
    - "`<Icon name=\"lucide:unknown\" />` fails type-check (proven by vitest --typecheck against icon.test.tsx)"
    - "Built bundle contains zero references to `api.iconify.design`"
    - "No `iconName` prop remains anywhere in packages/ui, apps/design-plugin, or apps/storybook"
    - "`StaticIconName` type is exported from `@repo/ui`"
    - "`lucide-react` is NOT removed from `packages/ui/package.json` — it is still used internally by select/checkbox/accordion primitives"
  artifacts:
    - path: "packages/ui/src/components/figma/icon.tsx"
      provides: "Iconify-based Icon component with offline whitelist preload"
      contains: "@iconify/react/offline"
    - path: "packages/ui/src/components/figma/icon.test.tsx"
      provides: "Unit test covering offline preload + StaticIconName type narrowing (with vitest --typecheck)"
      contains: "@ts-expect-error"
    - path: "packages/ui/src/index.ts"
      provides: "Public export of StaticIconName"
      contains: "StaticIconName"
    - path: "packages/ui/package.json"
      provides: "Dependency declarations for @iconify/react and @iconify-json/lucide"
      contains: "@iconify/react"
  key_links:
    - from: "packages/ui/src/components/figma/icon.tsx"
      to: "@iconify/react/offline"
      via: "import of Icon + addCollection"
      pattern: "@iconify/react/offline"
    - from: "packages/ui/src/index.ts"
      to: "packages/ui/src/components/figma/icon.tsx"
      via: "StaticIconName named re-export"
      pattern: "StaticIconName"
    - from: "apps/storybook/src/stories/Icon.stories.tsx"
      to: "packages/ui/src/components/figma/icon.tsx"
      via: "stories pass `name` (not `iconName`)"
      pattern: "name: \"lucide:"
---

<objective>
Migrate the public `Icon` component from `lucide-react` + a 3-entry `iconMap` to `@iconify/react/offline` with a hand-curated whitelist (minimum: `lucide:plus`, `lucide:info`, `lucide:star`). Rename the prop `iconName` → `name`, narrow it to a `StaticIconName` union, export `StaticIconName` from `@repo/ui`, and update every call site (app shell + 2 Storybook stories files). Implements BUG-04 per decisions D-08 through D-13.

Purpose: (1) The current `iconMap: Record<string, ComponentType<LucideProps>>` allows any string at compile time, silently returning `null` on miss. (2) The default `@iconify/react` bundle contains network fetch code incompatible with Figma's iframe sandbox. (3) The `name` rename aligns with ROADMAP success criterion #4.
Output: New `Icon` component, curated whitelist, narrowed type (proven via `vitest --typecheck`), updated call sites, public `StaticIconName` export, unit test.

NOTE on wave/dependency: This plan is Wave 2 with `depends_on: ["03"]` because Task 2 modifies `packages/ui/src/index.ts` and Plan 03 also modifies the same file (AlertAction barrel re-export). Serializing prevents a parallel-write race on `packages/ui/src/index.ts`.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md
@.planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md
@.planning/phases/16-bug-fixes-dark-mode/16-VALIDATION.md
@packages/ui/src/components/figma/icon.tsx
@packages/ui/src/components/figma/icon-button.tsx
@packages/ui/src/app.tsx
@packages/ui/src/index.ts
@apps/storybook/src/stories/Icon.stories.tsx
@apps/storybook/src/stories/IconButton.stories.tsx
@packages/ui/package.json

<interfaces>
Current `packages/ui/src/components/figma/icon.tsx` (full file, lines 1-20):
```typescript
import { Info, type LucideProps, Plus, Star } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, ComponentType<LucideProps>> = {
  plus: Plus,
  info: Info,
  star: Star,
};

export interface IconProps extends LucideProps {
  iconName: string;
  spin?: boolean;
}

export function Icon({ iconName, spin, className, ...props }: IconProps) {
  const LucideIcon = iconMap[iconName];
  if (!LucideIcon) return null;
  return <LucideIcon className={cn("size-4", spin && "animate-spin", className)} {...props} />;
}
```

`@iconify/react/offline` API (verbatim from RESEARCH.md D-08/D-09):
```typescript
import { Icon as IconifyIcon, addCollection } from "@iconify/react/offline";
import type { IconifyJSON } from "@iconify/types";

// addCollection(data: IconifyJSON, prefix?: string | boolean): void
// data.prefix is used as the storage prefix so icons become `${prefix}:${name}`.
// The offline bundle has ZERO references to api.iconify.design, fetch, or XMLHttpRequest.
```

Icon body strings (verbatim from RESEARCH.md "Preload pattern" section — use these exact strings):
```typescript
const lucideSubset: IconifyJSON = {
  prefix: "lucide",
  icons: {
    plus: {
      body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7v14"/>',
    },
    info: {
      body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></g>',
    },
    star: {
      body: '<polygon fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    },
  },
  width: 24,
  height: 24,
};
```

NOTE on the info and star bodies: the `info` and `star` strings are the canonical Lucide path shapes pulled from `@iconify-json/lucide/icons.json` (same paths Lucide ships today). If Task 1 finds slightly different body text in the installed `@iconify-json/lucide/icons.json` after `bun add` completes, the executor MUST replace the literals with the exact strings from `node_modules/@iconify-json/lucide/icons.json` for keys `plus`, `info`, `star`. The guidance here is a zero-work-baseline starting point.

Current call sites inventory (from RESEARCH.md "D-10 — Call-site inventory"):
| File | Occurrences |
|------|------|
| `packages/ui/src/components/figma/icon.tsx` | 2 (prop def + destructure — full rewrite) |
| `packages/ui/src/components/figma/icon-button.tsx` | 0 direct references (passes via spread); `IconProps` import updates automatically — this file is NOT in `files_modified` because no edits are required. Task 3 verifies this with a grep. |
| `packages/ui/src/app.tsx` | 3: `iconName="star"` (line 72), `iconName="info"` (line 78), `iconProps={{ iconName: "plus" }}` (line 67). Values must become `name="lucide:star"`, `name="lucide:info"`, `iconProps={{ name: "lucide:plus" }}`. |
| `apps/storybook/src/stories/Icon.stories.tsx` | 4 stories: `iconName: "info"`, `"plus"`, `"star"`, `"info"` → `name: "lucide:info"`, `"lucide:plus"`, `"lucide:star"`, `"lucide:info"` |
| `apps/storybook/src/stories/IconButton.stories.tsx` | 3 stories: `iconName: "plus"`, `"star"`, `"info"` → `name: "lucide:plus"`, `"lucide:star"`, `"lucide:info"` |
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Install iconify deps and scaffold Icon unit test (Wave 0)</name>
  <files>
    packages/ui/package.json
    bun.lock
    packages/ui/src/components/figma/icon.test.tsx
  </files>
  <read_first>
    - packages/ui/package.json (current deps — confirm lucide-react 1.8.0 stays)
    - .planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md ("D-08 / D-09 — @iconify/react offline preload strategy" — exact package names and versions)
    - .planning/phases/16-bug-fixes-dark-mode/16-VALIDATION.md (row 16-04-01 and Wave 0 item #2)
  </read_first>
  <behavior>
    - After this task, `packages/ui/package.json` declares `@iconify/react@^6.0.2` and `@iconify-json/lucide@^1.2.102` under `dependencies` (NOT devDependencies — they're runtime imports).
    - `bun.lock` is updated to pin the new transitive deps.
    - `lucide-react` dep is KEPT — internal use in select.tsx/checkbox.tsx/accordion.tsx depends on it.
    - `@iconify/json` (the full 100MB catalog) is NOT installed.
    - A new test file `packages/ui/src/components/figma/icon.test.tsx` exists that smoke-tests the new component and includes a `@ts-expect-error` line for an unknown icon name. The test is expected to FAIL initially (RED step) because icon.tsx still imports from lucide-react. The `@ts-expect-error` assertion is enforced by `vitest --typecheck` in Task 2 (not skipped by esbuild).
  </behavior>
  <action>
    1. Install the two new deps (from repo root) — `lucide-react` is NOT removed:
       ```bash
       bun add --filter @repo/ui @iconify/react@^6.0.2 @iconify-json/lucide@^1.2.102
       ```
       Verify `packages/ui/package.json` now contains:
       ```json
       "@iconify/react": "^6.0.2",
       "@iconify-json/lucide": "^1.2.102",
       ```
       under `"dependencies"`. The `lucide-react` line must remain untouched. Verify `bun.lock` has been updated via `git status` (it MUST show `bun.lock` as modified).

    2. Create `packages/ui/src/components/figma/icon.test.tsx` with the following content (NO `innerHTML` anywhere — use Testing Library's `render` which handles DOM safely):

       ```tsx
       import { render } from "@testing-library/react";
       import { describe, expect, it } from "vitest";
       import { Icon } from "./icon";

       describe("BUG-04: Icon component (iconify offline)", () => {
         it("renders a preloaded lucide:plus icon as an inline svg", () => {
           const { container } = render(<Icon name="lucide:plus" />);
           const svg = container.querySelector("svg");
           expect(svg).not.toBeNull();
           // Iconify adds the `iconify` class on the root svg; the offline
           // bundle also merges caller className, so our `size-4` must land.
           expect(svg?.getAttribute("class") ?? "").toMatch(/size-4/);
         });

         it("renders lucide:info and lucide:star without throwing", () => {
           const infoResult = render(<Icon name="lucide:info" />);
           expect(infoResult.container.querySelector("svg")).not.toBeNull();
           const starResult = render(<Icon name="lucide:star" />);
           expect(starResult.container.querySelector("svg")).not.toBeNull();
         });

         it("applies animate-spin when spin is true", () => {
           const { container } = render(<Icon name="lucide:plus" spin />);
           const svg = container.querySelector("svg");
           expect(svg?.getAttribute("class") ?? "").toMatch(/animate-spin/);
         });

         it("rejects unknown names at compile time (type narrowing)", () => {
           // @ts-expect-error — 'lucide:unknown' is not in StaticIconName
           const el = <Icon name="lucide:unknown" />;
           expect(el).toBeTruthy();
         });
       });
       ```

       This test will FAIL until Task 2 rewrites `icon.tsx`. That's the intended RED state.
  </action>
  <verify>
    <automated>rg -nF '"@iconify/react"' packages/ui/package.json &amp;&amp; rg -nF '"@iconify-json/lucide"' packages/ui/package.json &amp;&amp; test -f packages/ui/src/components/figma/icon.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - `rg -nF '"@iconify/react"' packages/ui/package.json` returns exactly 1 match inside `"dependencies"`.
    - `rg -nF '"@iconify-json/lucide"' packages/ui/package.json` returns exactly 1 match.
    - `rg -nF '"lucide-react"' packages/ui/package.json` still returns exactly 1 match (the dep is preserved).
    - `rg -nF '"@iconify/json"' packages/ui/package.json` returns 0 matches (the full catalog must NOT be installed).
    - `packages/ui/src/components/figma/icon.test.tsx` exists.
    - `rg -nF '@ts-expect-error' packages/ui/src/components/figma/icon.test.tsx` returns at least 1 match.
    - `rg -nF 'innerHTML' packages/ui/src/components/figma/icon.test.tsx` returns 0 matches.
    - `bun.lock` has been updated (`git status` shows modification of `bun.lock`).
  </acceptance_criteria>
  <done>Deps installed without removing lucide-react, `bun.lock` updated, test file scaffolded with the `@ts-expect-error` narrowing assertion, ready for Task 2.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Rewrite icon.tsx with iconify offline + narrowed StaticIconName (typecheck-verified)</name>
  <files>
    packages/ui/src/components/figma/icon.tsx
    packages/ui/src/index.ts
  </files>
  <read_first>
    - packages/ui/src/components/figma/icon.tsx (current lucide-react implementation)
    - packages/ui/src/components/figma/icon.test.tsx (test file from Task 1 — drives the API shape)
    - packages/ui/src/index.ts (line 4 currently re-exports `Icon, type IconProps` — needs `StaticIconName` added)
    - node_modules/@iconify-json/lucide/icons.json (ONLY if the body strings in this plan's `<interfaces>` block differ from what's installed — then use the installed file as source of truth for the `plus`, `info`, `star` bodies)
    - .planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md ("D-08 / D-09" sections — addCollection signature, offline import path, disableCache removed in v6)
    - .planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md (D-11, D-12, D-13)
    - packages/ui/vitest.config.ts (check if `test.typecheck` config exists — Task 2 may need to add it if the default `vitest run --typecheck` flag does not work out of the box)
  </read_first>
  <behavior>
    - `packages/ui/src/components/figma/icon.tsx` is a full rewrite:
      - Imports `Icon as IconifyIcon` and `addCollection` from `@iconify/react/offline` (NOT `@iconify/react`).
      - Imports `IconifyJSON` type from `@iconify/types` OR inlines a minimal type (prefer the `@iconify/types` import since it's a transitive dep of `@iconify/react`).
      - Declares a `lucideSubset: IconifyJSON` containing at minimum `plus`, `info`, `star` with the verbatim body strings from the `<interfaces>` block.
      - Calls `addCollection(lucideSubset)` at module scope (runs once at import time).
      - Exports `StaticIconName` as a union `"lucide:plus" | "lucide:info" | "lucide:star"` (add a `// TODO(Phase 17): Phase 17 restructures this into `interface StaticIconNameMap` via module augmentation per RESEARCH.md deferred ideas.` comment).
      - Exports `IconProps` with `name: StaticIconName` (NOT `iconName: string`) and `spin?: boolean`. Extends from `React.ComponentProps<'svg'>` (since iconify renders an `<svg>`). Do NOT extend from `LucideProps`.
      - Exports `Icon` function that accepts `{ name, spin, className, ...props }: IconProps` and renders `<IconifyIcon icon={name} className={cn("size-4", spin && "animate-spin", className)} {...props} />`.
      - Drops the `return null` fallback — with narrowed types, invalid names can't reach this code.
    - `packages/ui/src/index.ts` line 4 is updated to also export `StaticIconName`: `export { Icon, type IconProps, type StaticIconName } from "./components/figma/icon";`
    - `vitest --typecheck` on `icon.test.tsx` is green: the `@ts-expect-error` on the `lucide:unknown` line passes (meaning an unknown name genuinely fails type-check).
  </behavior>
  <action>
    1. Replace the ENTIRE contents of `packages/ui/src/components/figma/icon.tsx` with the following (verbatim — body strings from the `<interfaces>` block):

       ```tsx
       import { Icon as IconifyIcon, addCollection } from "@iconify/react/offline";
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
       const lucideSubset: IconifyJSON = {
         prefix: "lucide",
         icons: {
           plus: {
             body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7v14"/>',
           },
           info: {
             body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></g>',
           },
           star: {
             body: '<polygon fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
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

       Rationale notes (DO NOT add as comments unless the executor feels it helps): `Omit<React.ComponentProps<"svg">, "name">` prevents collision with SVG's native `name` attribute. The file no longer imports from `lucide-react`.

       IMPORTANT sanity-check on the body strings: after writing the file, run `bun run --filter @repo/ui test icon.test` and render the icons. If the visual shapes look wrong (e.g., info circle missing, star malformed), open `node_modules/@iconify-json/lucide/icons.json`, find keys `plus`, `info`, `star`, and substitute the `body` strings verbatim. Keep `width: 24, height: 24`. Do not invent paths.

    2. Edit `packages/ui/src/index.ts` line 4. Current:
       ```typescript
       export { Icon, type IconProps } from "./components/figma/icon";
       ```
       Change to:
       ```typescript
       export { Icon, type IconProps, type StaticIconName } from "./components/figma/icon";
       ```
       Do NOT modify any other line in `index.ts` in this task. Plan 03 (dependency — Wave 1) already modified the `alert` re-export line adding `AlertAction`; leave that line alone.

    3. Prove the `@ts-expect-error` narrowing assertion with `vitest --typecheck`. Vitest 4.x supports `--typecheck` natively; no pipeline changes required. If the `vitest` CLI reports "typecheck disabled in config", add the minimal enablement to `packages/ui/vitest.config.ts` under `test.typecheck`:
       ```typescript
       // packages/ui/vitest.config.ts (only add if needed — check first)
       test: {
         // ...existing config
         typecheck: {
           enabled: true,
           include: ["src/**/*.test.{ts,tsx}"],
         },
       }
       ```
       (This config touch is scoped to Plan 04 and does NOT encroach on Phase 17 TYPE-01's repo-wide `tsc --noEmit` pipeline work.)

       Then run:
       ```bash
       bun run --filter @repo/ui vitest run --typecheck icon.test
       ```
       This must exit 0. A failure means the `StaticIconName` union is wrong or the `Omit<React.ComponentProps<"svg">, "name">` shape is broken.
  </action>
  <verify>
    <automated>bun run --filter @repo/ui vitest run --typecheck icon.test &amp;&amp; bun run --filter @repo/ui build</automated>
  </verify>
  <acceptance_criteria>
    - `rg -nF '@iconify/react/offline' packages/ui/src/components/figma/icon.tsx` returns at least 1 match.
    - `rg -nF 'lucide-react' packages/ui/src/components/figma/icon.tsx` returns 0 matches.
    - `rg -nF 'addCollection(lucideSubset)' packages/ui/src/components/figma/icon.tsx` returns exactly 1 match.
    - `rg -nF 'export type StaticIconName' packages/ui/src/components/figma/icon.tsx` returns exactly 1 match.
    - `rg -nF 'lucide:plus' packages/ui/src/components/figma/icon.tsx` returns at least 1 match (in the StaticIconName union).
    - `rg -nF 'iconName' packages/ui/src/components/figma/icon.tsx` returns 0 matches.
    - `rg -nF 'type StaticIconName' packages/ui/src/index.ts` returns exactly 1 match.
    - `bun run --filter @repo/ui vitest run --typecheck icon.test` exits 0 (all 4 tests green AND the `@ts-expect-error` on `lucide:unknown` is satisfied — proving unknown names genuinely fail type-check).
    - `bun run --filter @repo/ui build` exits 0.
    - Maps to 16-VALIDATION.md rows 16-04-01 and 16-04-04 (with row 16-04-04's verification extended to include the typecheck command).
  </acceptance_criteria>
  <done>icon.tsx is fully rewritten, StaticIconName is exported from the barrel, icon.test.tsx passes all 4 tests AND its `@ts-expect-error` type narrowing assertion is enforced by `vitest --typecheck`.</done>
</task>

<task type="auto">
  <name>Task 3: Rename `iconName` → `name` at every call site + verify icon-button.tsx has no references + build bundle audit</name>
  <files>
    packages/ui/src/app.tsx
    apps/storybook/src/stories/Icon.stories.tsx
    apps/storybook/src/stories/IconButton.stories.tsx
  </files>
  <read_first>
    - packages/ui/src/components/figma/icon-button.tsx (confirms it spreads iconProps — no explicit iconName reference; verified during planning: 0 matches for `iconName`. Task 3 re-verifies with a grep.)
    - packages/ui/src/app.tsx (lines 67, 72, 78 — 3 call sites)
    - apps/storybook/src/stories/Icon.stories.tsx (lines 15, 21, 27, 33 — 4 call sites)
    - apps/storybook/src/stories/IconButton.stories.tsx (lines 16, 24, 32 — 3 call sites)
    - .planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md ("D-10 — Call-site inventory")
  </read_first>
  <action>
    Apply the following edits. Every literal value must be prefixed with `lucide:` to match the new `StaticIconName` union.

    1. `packages/ui/src/components/figma/icon-button.tsx` — VERIFICATION STEP, NO EDIT.

       Planning confirmed (verbatim inspection of the file during revision):
       ```
       import { Icon, type IconProps } from "./icon";
       ...
       interface IconButtonProps extends ... { iconProps: IconProps; selected?: boolean; }
       ...
       <Icon {...iconProps} />
       ```
       There are ZERO explicit `iconName` references in `icon-button.tsx` — the prop is passed through via spread, and the `IconProps` type import auto-updates once Task 2 lands. Confirmed finding (from planning): `rg -nF 'iconName' packages/ui/src/components/figma/icon-button.tsx` returns 0 matches.

       Because of this, `packages/ui/src/components/figma/icon-button.tsx` is NOT in this plan's `files_modified` frontmatter. Task 3 MUST re-run the grep at execution time to confirm the finding is still valid:
       ```bash
       rg -nF 'iconName' packages/ui/src/components/figma/icon-button.tsx
       ```
       - If the output is empty (exit code 1): the planning finding holds, no edit is required, proceed to step 2.
       - If the output has any matches (even in comments): STOP. Add `packages/ui/src/components/figma/icon-button.tsx` to `files_modified` and update the references to `name` before continuing. This should not happen given the planning-time confirmation, but the guard is mandatory.

    2. `packages/ui/src/app.tsx`:
       - Line 67: `<IconButton iconProps={{ iconName: "plus" }} aria-label="Add item" />` → `<IconButton iconProps={{ name: "lucide:plus" }} aria-label="Add item" />`
       - Line 72: `<Icon iconName="star" />` → `<Icon name="lucide:star" />`
       - Line 78: `<Icon iconName="info" className="size-4" />` → `<Icon name="lucide:info" className="size-4" />`

    3. `apps/storybook/src/stories/Icon.stories.tsx` (4 stories — replace `iconName:` with `name:` and prefix with `lucide:`):
       - `Default.args`: `{ iconName: "info" }` → `{ name: "lucide:info" }`
       - `Plus.args`: `{ iconName: "plus" }` → `{ name: "lucide:plus" }`
       - `Star.args`: `{ iconName: "star" }` → `{ name: "lucide:star" }`
       - `Spinning.args`: `{ iconName: "info", spin: true }` → `{ name: "lucide:info", spin: true }`

    4. `apps/storybook/src/stories/IconButton.stories.tsx` (3 stories):
       - `Default.args`: `iconProps: { iconName: "plus" }` → `iconProps: { name: "lucide:plus" }`
       - `Selected.args`: `iconProps: { iconName: "star" }` → `iconProps: { name: "lucide:star" }`
       - `Info.args`: `iconProps: { iconName: "info" }` → `iconProps: { name: "lucide:info" }`

    After edits, run a full build and assert zero network references in the output:
    ```bash
    bun run build
    rg -nF 'api.iconify.design' apps/design-plugin/dist/ || echo "OK: no iconify.design refs"
    ```

    The `rg` must return 0 matches (exit code 1) — this satisfies 16-VALIDATION.md row 16-04-02.

    Do NOT edit `select.tsx`, `checkbox.tsx`, `accordion.tsx`, or `button.tsx` — their internal `lucide-react` imports (chevrons/checks) are scoped to Phase 18 per CONTEXT.md out-of-scope list.
  </action>
  <verify>
    <automated>bun run build &amp;&amp; bun run --filter @repo/ui test &amp;&amp; bun run lint</automated>
  </verify>
  <acceptance_criteria>
    - `rg -nF 'iconName' packages/ui/src/components/figma/icon-button.tsx` returns 0 matches (confirms planning finding that no edit was required).
    - `rg -nF 'iconName' packages/ui apps/storybook apps/design-plugin` returns 0 matches (exit code 1).
    - `rg -nF 'name="lucide:star"' packages/ui/src/app.tsx` returns exactly 1 match.
    - `rg -nF 'name="lucide:info"' packages/ui/src/app.tsx` returns exactly 1 match.
    - `rg -nF 'name: "lucide:plus"' packages/ui/src/app.tsx` returns exactly 1 match (inside iconProps).
    - `rg -nF 'name: "lucide:' apps/storybook/src/stories/Icon.stories.tsx` returns exactly 4 matches (one per story).
    - `rg -nF 'name: "lucide:' apps/storybook/src/stories/IconButton.stories.tsx` returns exactly 3 matches (one per story).
    - `rg -nF 'api.iconify.design' apps/design-plugin/dist/` returns 0 matches.
    - `bun run build` exits 0.
    - `bun run --filter @repo/ui test` exits 0 (all icon.test tests green).
    - `bun run lint` exits 0.
    - Maps to 16-VALIDATION.md rows 16-04-02 and 16-04-03.
  </acceptance_criteria>
  <done>All call sites use the new `name` prop with `lucide:` prefixes, `icon-button.tsx` required no edit (grep confirmed 0 matches at execution time), the built bundle contains zero network references, and build/lint/test are green.</done>
</task>

</tasks>

<verification>
1. `rg 'iconName' packages/ui apps/storybook apps/design-plugin` — 0 matches.
2. `bun run build && rg 'api.iconify.design' apps/design-plugin/dist/` — 0 matches.
3. `bun run --filter @repo/ui vitest run --typecheck icon.test` — all 4 tests green, `@ts-expect-error` satisfied.
4. `bun run lint` — exits 0.
5. `rg 'StaticIconName' packages/ui/src/index.ts` — 1 match.
</verification>

<success_criteria>
BUG-04 resolved: `Icon` uses `@iconify/react/offline`, the `name` prop is narrowed to `StaticIconName`, invalid names fail at compile time (proven by the `@ts-expect-error` assertion running under `vitest --typecheck`), the built bundle has zero references to `api.iconify.design`, `iconName` is gone from the entire repo, and `StaticIconName` is publicly exported from `@repo/ui`.
</success_criteria>

<output>
Create `.planning/phases/16-bug-fixes-dark-mode/16-04-SUMMARY.md` recording:
- The verbatim new `icon.tsx` content
- The installed dep versions (from `bun.lock`)
- The full call-site diff (5 files touched in this plan: `package.json`, `bun.lock`, `icon.tsx`, `icon.test.tsx`, `index.ts`, `app.tsx`, both storybook stories files; `icon-button.tsx` verified unchanged)
- The built-bundle grep result for `api.iconify.design`
- The `vitest --typecheck` output for `icon.test.tsx`
- BUG-04 status: satisfied
- A NOTE for Phase 17 planner: "TYPE-02 should restructure StaticIconName into `interface StaticIconNameMap` for module augmentation, and ship `registerIcons(iconifyData)` — see RESEARCH.md deferred ideas."
</output>
</content>
</invoke>