# Phase 14: Storybook 10 Upgrade - Research

**Researched:** 2026-04-09
**Domain:** Storybook 10, React, Vite, shadcn/ui component documentation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — all implementation choices are at Claude's discretion (infrastructure phase).

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase (Storybook upgrade + component documentation). Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FW-02 | Storybook upgraded from 8.6 to 10.x (ESM-only) with all stories and configs migrated | Package upgrade path, ESM config changes, addon removal, and story rewrites documented below |
</phase_requirements>

---

## Summary

Storybook 10.3.5 (latest) is the upgrade target from 8.6.18. The jump is significant: `@storybook/addon-essentials` is removed and must be replaced with `@storybook/addon-docs`, essential addons (Controls, Viewport, Actions, Interactions) are now built into core, Node 20.19+ is required (Node 24.6.0 is present), and all config files must be pure ESM. The Bun lock file detection issue (Storybook expects `bun.lockb`, Bun 1.3+ produces `bun.lock`) has been fixed in Storybook 9+ — no workaround needed with v10.

The larger task in this phase is not the Storybook upgrade itself but rewriting all 15 existing stories to match the new shadcn/ui component APIs. The old stories were written for react-figma-ui, which had different prop APIs: `tint`, `destructive` on Button; `iconProps` on Input; `Disclosure`/`DisclosureItem` with render props; `Radio` as a standalone element; `OnboardingTip` with `iconProps`; `SelectMenuOption` wrapper. All of these are gone. The new exports are standard shadcn/ui primitives (Radix-based) plus four custom Figma components.

**Primary recommendation:** Upgrade packages first (wave 1), update config files to ESM format (wave 1), then rewrite all stories for the new shadcn/ui APIs (wave 2). The config changes are mechanical; the story rewrites require per-component API knowledge documented below.

---

## Project Constraints (from CLAUDE.md)

| Directive | Implication for this Phase |
|-----------|---------------------------|
| Package manager: Bun 1.3.11 | Use `bun install` not `npm install`; Storybook 10 supports `bun.lock` detection natively |
| Turborepo for all tasks | `storybook` and `build-storybook` tasks already in `turbo.json` — no changes needed |
| Biome 2.4.10 for lint/format | Story files must pass Biome lint; no ESLint config needed |
| `@repo/*` workspace imports | Stories import from `@repo/ui`, not relative paths |
| JIT source-only packages | `@repo/ui` exports raw TypeScript; tsconfig `paths` maps `@repo/ui` to `packages/ui/src` |
| Vite 6 in Storybook app | `@storybook/react-vite@10` supports Vite 5–8 |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| storybook | 10.3.5 | Core CLI and orchestration | Latest stable; `latest` tag on npm [VERIFIED: npm registry] |
| @storybook/react | 10.3.5 | React renderer | Framework package for React stories [VERIFIED: npm registry] |
| @storybook/react-vite | 10.3.5 | Vite builder integration | Already used; supports Vite 5–8 [VERIFIED: npm view peerDependencies] |
| @storybook/addon-docs | 10.3.5 | Autodocs and Controls | Replaces `addon-essentials`; required for docs pages [CITED: storybook.js.org/docs/addons/addon-migration-guide] |

### Removed (must be deleted from package.json)

| Package | Reason |
|---------|--------|
| @storybook/addon-essentials | Removed in Storybook 9+; not published at v10. Controls, Viewport, Actions now in core [CITED: storybook.js.org/docs/addons/addon-migration-guide] |

### Version verification

```bash
npm view storybook version           # 10.3.5
npm view @storybook/react version    # 10.3.5
npm view @storybook/react-vite version  # 10.3.5
npm view @storybook/addon-docs version  # verify at install time
```

### Installation

```bash
# From apps/storybook/ directory — or use --filter
bun remove @storybook/addon-essentials
bun add -d storybook@10.3.5 @storybook/react@10.3.5 @storybook/react-vite@10.3.5 @storybook/addon-docs@latest
```

---

## Architecture Patterns

### Recommended Project Structure (unchanged)

```
apps/storybook/
├── .storybook/
│   ├── main.ts          # StorybookConfig — ESM, @storybook/react-vite framework
│   └── preview.ts       # Preview — global tags, parameters, decorator for Tailwind
├── src/stories/
│   ├── Button.stories.tsx
│   ├── Checkbox.stories.tsx
│   └── ... (one file per exported component)
├── package.json
└── tsconfig.json
```

### Pattern 1: Updated main.ts (Storybook 10 format)

**What:** Replace `@storybook/addon-essentials` with `@storybook/addon-docs`. Config format stays TypeScript ESM (already the case — no `require()` used).

**Current main.ts is already ESM** — it uses `import` and `export default`. The only change needed is the addons array.

```typescript
// Source: storybook.js.org/docs/writing-docs/autodocs
import { mergeConfig } from 'vite';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  async viteFinal(config) {
    return mergeConfig(config, {});
  },
};

export default config;
```

**Key change:** `'@storybook/addon-essentials'` → `'@storybook/addon-docs'`.
Controls, Viewport, Actions are now built into core — they work automatically without being listed.

### Pattern 2: Updated preview.ts

**What:** The existing preview.ts is already valid. The `tags: ['autodocs']` global enables Autodocs for all stories without per-story opt-in. The import path `@storybook/react-vite` for `Preview` type is valid in Storybook 10.

The one thing to verify: does `@storybook/react-vite` still export `Preview` type, or should it come from `storybook`? In Storybook 10 you can use either — `@storybook/react-vite` re-exports framework types. [ASSUMED — should verify during implementation]

```typescript
// Existing preview.ts is already correct for Storybook 10
import type { Preview } from '@storybook/react-vite';
import '@repo/ui'; // side-effect: loads Tailwind CSS

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    viewport: { ... }, // viewport parameters work without addon-essentials in v10
  },
};

export default preview;
```

### Pattern 3: Storybook 10 Story format (CSF3, unchanged)

The existing CSF3 story format with `satisfies Meta<typeof Component>` and `StoryObj` is fully supported in Storybook 10 with no changes required for stories that have correct props.

```typescript
// Source: existing project stories, valid for Storybook 10
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@repo/ui';

const meta = {
  component: Button,
  title: 'Components/Button',
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;
```

`@storybook/react` continues to export `Meta` and `StoryObj` in v10. [VERIFIED: npm view @storybook/react@10.3.5]

### Pattern 4: Autodocs with Controls

With `tags: ['autodocs']` set globally in preview.ts, every story automatically gets a Docs page. Controls are inferred from TypeScript prop types when `@storybook/addon-docs` is in the addons array. No additional `argTypes` configuration is required for the shadcn/ui components — they are standard React components with TypeScript prop types.

### Anti-Patterns to Avoid

- **Keep `@storybook/addon-essentials` in addons array:** It does not exist at v10; Storybook will fail to start with an unresolvable addon error.
- **Using `render` prop with old react-figma-ui patterns:** The old `Disclosure`, `Select`, and `OnboardingTip` stories used custom render props that don't match shadcn APIs. Reuse `args`-based stories wherever possible to enable Controls.
- **Importing from `@storybook/react-vite` for story types:** For story-level imports (`Meta`, `StoryObj`), use `@storybook/react`. For preview-level types (`Preview`), `@storybook/react-vite` works fine.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Prop controls UI | Manual argTypes configuration | Let Storybook infer from TypeScript props | Storybook 10 auto-generates controls from TS types via `@storybook/addon-docs` |
| Docs page layout | Custom MDX docs pages | `tags: ['autodocs']` global in preview.ts | Built-in Autodocs generates complete docs with prop table and story examples |
| CSS loading in stories | Manual style injection per story | Single `import '@repo/ui'` in preview.ts | Side-effect import already present, loads all Tailwind styles for all stories |

---

## Story Migration Map

This is the critical knowledge for the phase. Each existing story and what must change:

### Stories with breaking API changes (require significant rewrite)

| Story File | Old API (react-figma-ui) | New API (shadcn/ui from `@repo/ui`) | Change Type |
|------------|--------------------------|--------------------------------------|-------------|
| `Button.stories.tsx` | `tint: 'primary'`, `tint: 'secondary'`, `destructive: true` | `variant: 'default'`, `variant: 'secondary'`, `variant: 'destructive'` | Prop rename |
| `Input.stories.tsx` | `iconProps: { iconName: 'search' }` (WithIcon story) | Prop does not exist on shadcn Input — remove the WithIcon story or wrap with a layout | Breaking removal |
| `Select.stories.tsx` | Custom render prop + `SelectMenuOption` sub-component | `SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem` composition | Full rewrite |
| `Disclosure.stories.tsx` | `Disclosure` + `DisclosureItem` with render prop | `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent` composition | Full rewrite |
| `DisclosureItem.stories.tsx` | `DisclosureItem` standalone | `AccordionItem` (only meaningful inside `Accordion`) | Replace or delete |
| `Radio.stories.tsx` | `Radio` standalone with `name` prop | `RadioGroup`/`RadioGroupItem` composition | Needs wrapper |
| `OnboardingTip.stories.tsx` | `OnboardingTip` with `iconProps` | `Alert`/`AlertTitle`/`AlertDescription` from shadcn | Full rewrite |

### Stories that need minor updates

| Story File | What to Check |
|------------|---------------|
| `Checkbox.stories.tsx` | `children` prop — shadcn Checkbox is `CheckboxPrimitive.Root` without a label; needs `Label` composition |
| `Switch.stories.tsx` | `children` prop — shadcn Switch is `SwitchPrimitive.Root` without a label; needs `Label` composition |
| `Label.stories.tsx` | Likely works as-is — Label is a standard HTML label wrapper |
| `SectionTitle.stories.tsx` | Custom Figma component, API unchanged |
| `Type.stories.tsx` | Custom Figma component; `inverse` prop removed — check if it still exists |
| `Icon.stories.tsx` | Custom Figma component; `iconName` still works but only `plus`, `info`, `star` are in iconMap — stories with `search`, `alert`, `spinner`, `star-on` will render nothing |
| `IconButton.stories.tsx` | Custom Figma component, `iconProps` still exists |

### New stories needed (shadcn/ui components with no prior stories)

The following are exported from `@repo/ui` with no existing stories:

| Export | Type | Suggested Story Title |
|--------|------|-----------------------|
| `SelectContent`, `SelectTrigger`, `SelectValue`, `SelectItem` | Sub-components (document as part of Select story) | Covered in Select rewrite |
| `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | Sub-components (document as part of Accordion story) | Covered in Disclosure→Accordion rewrite |
| `Alert`, `AlertTitle`, `AlertDescription` | Shadcn Alert (replaces OnboardingTip) | Covered in OnboardingTip→Alert rewrite |
| `RadioGroup`, `RadioGroupItem` | Radix RadioGroup | Covered in Radio rewrite |

### Concrete new component APIs

**Button (shadcn variants):**
```typescript
// variant options: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
// size options: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
<Button variant="default">Click me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
```

**Select (shadcn composition):**
```typescript
// Source: packages/ui/src/components/ui/select.tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@repo/ui';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**Accordion (replaces Disclosure):**
```typescript
// Source: packages/ui/src/components/ui/accordion.tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@repo/ui';

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content for section 1</AccordionContent>
  </AccordionItem>
</Accordion>
```

**Alert (replaces OnboardingTip):**
```typescript
// Source: packages/ui/src/components/ui/alert.tsx
// variant: 'default' | 'destructive'
import { Alert, AlertTitle, AlertDescription } from '@repo/ui';
import { InfoIcon } from 'lucide-react';

<Alert>
  <InfoIcon />
  <AlertTitle>Tip</AlertTitle>
  <AlertDescription>Select a layer to get started.</AlertDescription>
</Alert>
```

**RadioGroup (replaces Radio):**
```typescript
// Source: packages/ui/src/components/ui/radio-group.tsx
import { RadioGroup, RadioGroupItem } from '@repo/ui';
import { Label } from '@repo/ui';

<RadioGroup defaultValue="option-a">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option-a" id="option-a" />
    <Label htmlFor="option-a">Option A</Label>
  </div>
</RadioGroup>
```

**Checkbox (now requires Label):**
```typescript
// Source: packages/ui/src/components/ui/checkbox.tsx
// shadcn Checkbox has no children/label prop — must compose with Label
import { Checkbox } from '@repo/ui';
import { Label } from '@repo/ui';

<div className="flex items-center gap-2">
  <Checkbox id="checkbox-default" />
  <Label htmlFor="checkbox-default">Enable option</Label>
</div>
```

**Icon (limited iconMap):**
```typescript
// Source: packages/ui/src/components/figma/icon.tsx
// iconMap only contains: 'plus', 'info', 'star'
// Old story icons ('search', 'alert', 'spinner', 'star-on', 'smiley', 'warning') render null
// Stories must use only: 'plus', 'info', 'star'
<Icon iconName="info" />
<Icon iconName="plus" />
```

---

## Common Pitfalls

### Pitfall 1: `@storybook/addon-essentials` left in package.json or addons array

**What goes wrong:** Storybook 10 fails to start with a module resolution error because `@storybook/addon-essentials` max version is 8.x.
**Why it happens:** Forgetting to remove the old package when bumping versions.
**How to avoid:** Explicitly `bun remove @storybook/addon-essentials` and remove from `main.ts` addons array.
**Warning signs:** `Cannot find module '@storybook/addon-essentials'` error on startup.

### Pitfall 2: `bun.lockb` detection (RESOLVED in v10)

**What goes wrong:** In Storybook 8.x/9 early releases, Storybook looked for `bun.lockb` (binary) but Bun 1.2+ generates `bun.lock` (text). This caused Storybook to fall back to npm.
**Status:** Fixed in Storybook 10. Both `bun.lock` and `bun.lockb` are detected. The `bun.lock` in this repo is sufficient. [CITED: github.com/storybookjs/storybook/issues/30366]
**Warning signs:** Storybook trying to run `npm install` despite `bun` being the package manager.

### Pitfall 3: Stories rendering blank/null for Icon component

**What goes wrong:** Icon stories referencing `iconName: 'search'`, `iconName: 'alert'`, `iconName: 'spinner'` render nothing (the component returns `null` for unknown icon names).
**Why it happens:** The custom `Icon` component in `packages/ui/src/components/figma/icon.tsx` has a hardcoded `iconMap` with only `plus`, `info`, `star`.
**How to avoid:** Update Icon stories to use only mapped icon names. Consider noting in stories which names are available.

### Pitfall 4: Old react-figma-ui-specific props in stories cause TypeScript errors

**What goes wrong:** `tint`, `destructive`, `SelectMenuOption`, `DisclosureItem`, `iconProps` on Input — TypeScript will error at build time.
**Why it happens:** Phase 13 replaced the components but the stories were not updated.
**How to avoid:** All 15 story files must be reviewed and updated. The migration map above lists every broken API.

### Pitfall 5: `moduleResolution: bundler` and Storybook 10 subpath imports

**What goes wrong:** TypeScript may fail to resolve `storybook/actions` or similar deep subpath imports if `moduleResolution` is not set to `bundler` or `node16`+.
**Why it happens:** Storybook 10 uses package.json `exports` fields for subpath imports; older module resolution strategies don't understand them.
**How to avoid:** The Storybook tsconfig already uses `"moduleResolution": "bundler"` — no change needed. If issues arise, add a `.storybook/tsconfig.json` that extends the app tsconfig. [CITED: github.com/storybookjs/storybook/issues/32995]
**Warning signs:** `TS2307: Cannot find module 'storybook/actions'`.

### Pitfall 6: Viewport parameters break without addon-essentials

**What goes wrong:** The `parameters.viewport` in preview.ts might not be recognized.
**Why it happens:** Viewport addon moved to Storybook core — it should work without `addon-essentials` listing.
**How to avoid:** Viewport is built into core in Storybook 9+. The preview.ts viewport configuration is preserved as-is. [CITED: storybook.js.org/docs/addons/addon-migration-guide]
**Warning signs:** Viewport toolbar dropdown missing in Storybook UI.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@storybook/addon-essentials` bundle | Individual `@storybook/addon-docs` + core built-ins | Storybook 9 → 10 | Smaller install, explicit docs dependency |
| `@storybook/addon-viewport` separate | Built into Storybook core | Storybook 9 | Remove from addons array |
| `@storybook/addon-controls` separate | Built into Storybook core | Storybook 9 | No change needed |
| `@storybook/addon-actions` separate | Built into Storybook core | Storybook 9 | No change needed |
| CommonJS `module.exports` config | ESM `export default` | Storybook 9 | Already ESM in this project |
| `bun.lockb` (binary) detection | `bun.lock` (text) detection | Storybook 10 (fix in #30160) | No `bun.lockb` stub needed |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 20.19+ or 22.12+ | Storybook 10 minimum | ✓ | 24.6.0 | — |
| Bun | Package manager | ✓ | 1.3.11 | — |
| Vite 5–8 | @storybook/react-vite peer | ✓ | 6.x (in Storybook devDeps) | — |

**No missing dependencies or fallbacks needed.**

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (configured in packages, not in storybook app) |
| Config file | No Vitest config in `apps/storybook/` — stories are not unit tested |
| Quick run command | `bun run storybook` (manual smoke test) |
| Full suite command | `turbo run build-storybook` (build-time validation) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FW-02-A | Storybook 10.x starts without errors | smoke | `bun run --filter @repo/storybook storybook` (manual) | N/A |
| FW-02-B | All stories render with no console errors | smoke | `turbo run build-storybook` | N/A |
| FW-02-C | Config files are ESM (no `require()`) | static | `biome check apps/storybook/.storybook/` | N/A |
| FW-02-D | shadcn/ui stories have Autodocs + Controls | smoke | manual review in running Storybook | N/A |

### Sampling Rate

- **Per task commit:** `bun run --filter @repo/storybook build-storybook` (ensures stories compile)
- **Per wave merge:** Full build + manual smoke test of running Storybook
- **Phase gate:** `bun run storybook` runs clean; all story Docs pages render in browser

### Wave 0 Gaps

None — no new test files needed. Validation is build-time (TypeScript compilation of stories catches API errors) and runtime (manual browser check).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Preview` type can still be imported from `@storybook/react-vite` in v10 (not just from `storybook`) | Architecture Patterns — Pattern 2 | Would require changing preview.ts import to `from 'storybook'` or `from '@storybook/react'` |
| A2 | Viewport parameters in preview.ts continue to work in v10 core without addon listing | Common Pitfalls — Pitfall 6 | Would require adding viewport addon explicitly or removing custom viewports |
| A3 | `@storybook/addon-docs` is a separate package at v10 (not bundled into `storybook`) | Standard Stack | Would change install command |

---

## Open Questions

1. **Does `Type.stories.tsx` `inverse` prop still exist?**
   - What we know: `Type` is a custom Figma component. The current `type.tsx` has `size` and `weight` props but `inverse` is NOT in the component definition.
   - What's unclear: Whether the `inverse` prop was intentionally removed in Phase 13 or is still needed.
   - Recommendation: Remove the `Inverse` story variant from `Type.stories.tsx`; the prop does not exist.

2. **Should `DisclosureItem.stories.tsx` be deleted or renamed to `AccordionItem.stories.tsx`?**
   - What we know: `DisclosureItem` no longer exists. `AccordionItem` only makes sense as a child of `Accordion`.
   - What's unclear: Whether a standalone AccordionItem story provides value.
   - Recommendation: Delete `DisclosureItem.stories.tsx` and document `Accordion` composition entirely within `Accordion.stories.tsx` (renamed from `Disclosure.stories.tsx`).

3. **Should the story file names be updated to match new component names?**
   - `Disclosure.stories.tsx` → `Accordion.stories.tsx`
   - `OnboardingTip.stories.tsx` → `Alert.stories.tsx`
   - `Radio.stories.tsx` → `RadioGroup.stories.tsx`
   - Recommendation: Yes — rename to match exported component names for discoverability.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] — `storybook`, `@storybook/react`, `@storybook/react-vite` all at 10.3.5 (confirmed via `npm view`)
- [VERIFIED: npm view peerDependencies] — `@storybook/react-vite@10.3.5` supports Vite `^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0`; React 16.8–19
- [VERIFIED: codebase] — All component files in `packages/ui/src/` read directly to confirm APIs

### Secondary (MEDIUM confidence)
- [CITED: storybook.js.org/docs/addons/addon-migration-guide] — `@storybook/addon-essentials` removed in Storybook 10; replaced by `@storybook/addon-docs`
- [CITED: storybook.js.org/docs/writing-docs/autodocs] — `tags: ['autodocs']` global in preview.ts; `addons: ['@storybook/addon-docs']` in main.ts
- [CITED: storybook.js.org/docs/releases/migration-guide] — Node 20.19+/22.12+ required; ESM-only config files
- [CITED: github.com/storybookjs/storybook/issues/30366] — Bun lock detection issue fixed (PR #30160)
- [CITED: github.com/storybookjs/storybook/issues/32995] — TypeScript `moduleResolution: bundler` and subpath imports; `.storybook/tsconfig.json` workaround if needed

### Tertiary (LOW confidence)
- [ASSUMED] — `Preview` type importable from `@storybook/react-vite` in v10 (existing project pattern, not explicitly verified against v10 changelog)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed via npm registry
- Architecture: HIGH — config format confirmed via official Storybook docs; component APIs confirmed by reading source files
- Pitfalls: HIGH — Bun fix confirmed via GitHub issue; addon removal confirmed via official migration guide
- Story migration map: HIGH — derived from reading actual component source files in the repo

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (Storybook 10.x is stable; unlikely to break within 30 days)
