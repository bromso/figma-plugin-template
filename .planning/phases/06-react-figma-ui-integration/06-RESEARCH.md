# Phase 6: react-figma-ui Integration - Research

**Researched:** 2026-04-09
**Domain:** React component library integration (react-figma-ui v1.1.0 + figma-plugin-ds)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Component Re-export Strategy**
- Direct re-export from react-figma-ui (`export { Button } from 'react-figma-ui'`) — zero wrapper overhead, matches JIT source-only pattern
- One flat barrel `index.ts` re-exporting all 14 components — matches current packages/ui pattern
- Re-export component prop types alongside components — consumers use `@repo/ui` as sole import source
- react-figma-ui dependency lives in packages/ui — the UI package owns the component layer

**CSS Loading & Integration**
- Import figma-plugin-ds CSS in packages/ui `index.ts` as side-effect import (`import 'figma-plugin-ds/dist/figma-plugin-ds.css'`)
- Accept unscoped BEM classes as-is — figma-plugin-ds uses `.figma-*` prefixed classes, low collision risk with CSS Modules
- Remove demo SCSS partials from packages/ui — react-figma-ui brings its own styles; keep only app-level layout SCSS in the plugin app

**Demo App Design**
- Component sampler rendering all 14 components in a scrollable panel grouped by category (inputs, buttons, display, layout)
- Static showcase only — components render with representative props but no wired-up state/logic
- Full replacement of existing app.tsx — clean swap

### Claude's Discretion

None documented.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | packages/ui re-exports all 14 react-figma-ui components as typed named exports | VERIFIED: library exports confirmed via package inspection; exact names documented below |
| UI-02 | figma-plugin-ds CSS is imported once in the UI entrypoint and available to all components | VERIFIED: CSS path confirmed as `figma-plugin-ds/dist/figma-plugin-ds.css`; side-effect import pattern identified |
| UI-03 | The demo app (app.tsx) uses react-figma-ui components to showcase plugin UI capabilities | VERIFIED: all component prop APIs documented; UI-SPEC provides full layout contract |
| UI-04 | Custom Button.tsx, Button.module.scss, and unused SCSS demo partials are removed from packages/ui | VERIFIED: complete file inventory compiled; 9 files to delete identified |
</phase_requirements>

---

## Summary

Phase 6 replaces the custom Button component in `packages/ui` with all 14 react-figma-ui native Figma UI components, loads figma-plugin-ds CSS as a single side-effect import, rewrites the demo app as a static component sampler, and deletes the now-obsolete custom component and SCSS files.

The most important pre-planning discovery is a **naming discrepancy** between the requirements/CONTEXT.md and the library's actual export names. The library does NOT export `OnboardingTip`, `DisclosureItem`, or `Select`. It exports `Onboarding`, `DisclosureTip`, and `SelectMenu`/`SelectMenuOption` respectively. The re-export barrel in `index.ts` can alias these to match the requirement names (e.g. `export { Onboarding as OnboardingTip } from 'react-figma-ui'`), or the requirements can be treated as using the library's actual names. This decision must be resolved before writing `index.ts`.

A second finding: figma-plugin-ds CSS uses generic BEM class names (`.button`, `.icon`, `.checkbox`, etc.) — NOT `.figma-*` prefixed names as the CONTEXT.md states. Since all existing SCSS demo partials are being deleted anyway and the new demo uses CSS Modules (`app.module.scss`), there is no collision risk in practice. But the CONTEXT.md claim about prefix is inaccurate and should not be relied on as a safety guarantee.

**Primary recommendation:** Use aliased re-exports in `index.ts` to match requirement-specified names (`OnboardingTip`, `DisclosureItem`, `Select`) while sourcing from the library's actual names. This keeps the public API predictable while consuming the library correctly.

---

## Project Constraints (from CLAUDE.md)

- Package manager: `bun@1.3.11` — all install commands use `bun add`, not npm/yarn
- Build: two Vite configs run in parallel (`vite.config.ui.ts`, `vite.config.plugin.ts`); UI uses `vite-plugin-singlefile` — all assets inlined into one HTML file
- Path alias `@ui` → `packages/ui/src` — works in both Vite build and Sass SCSS imports (via custom `findFileUrl` importer)
- SCSS API: `modern-compiler` — use `@use`/`@forward` not `@import`
- No test framework for Figma plugin code (plugin side only) — `packages/ui` has Vitest with `happy-dom`
- JIT source-only packages: `@repo/ui` exports raw TypeScript, not compiled output

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-figma-ui | 1.1.0 | 14 Figma-native React components | Only maintained React wrapper for figma-plugin-ds |
| figma-plugin-ds | 1.0.1 | CSS styles + JS for Disclosure/SelectMenu | Peer dependency of react-figma-ui; provides all component CSS |

[VERIFIED: npm registry] — `npm view react-figma-ui@1.1.0` and `npm view figma-plugin-ds@1.0.1`

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | ^1.1.1 | className merge utility | Bundled inside react-figma-ui; no separate install needed |

[VERIFIED: npm registry] — listed in react-figma-ui dependencies, not a separate install requirement

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-figma-ui v1.1.0 | v2.0.0-alpha.1 | Alpha is unstable; locked decision is v1.1.0 |

**Installation (bun):**
```bash
bun add react-figma-ui --filter @repo/ui
```
figma-plugin-ds is a dependency of react-figma-ui and installs automatically.

**Version verification:** [VERIFIED: npm registry 2026-04-09]
- `react-figma-ui@1.1.0` — latest stable (published 2022-05-14)
- `figma-plugin-ds@1.0.1` — latest stable (published 2022-05-02)

---

## Critical Naming Discrepancy

**This is the most important finding in this research.**

The requirements and CONTEXT.md specify 14 component names. The library's actual export names differ in three cases:

| Requirement/CONTEXT Name | Actual Library Export | Notes |
|--------------------------|----------------------|-------|
| Button | `Button` | Match |
| Checkbox | `Checkbox` | Match |
| Disclosure | `Disclosure` | Match |
| **DisclosureItem** | **`DisclosureTip`** | MISMATCH |
| Icon | `Icon` | Match |
| IconButton | `IconButton` | Match |
| Input | `Input` | Match |
| Label | `Label` | Match |
| SectionTitle | `SectionTitle` | Match |
| **OnboardingTip** | **`Onboarding`** | MISMATCH |
| Radio | `Radio` | Match |
| **Select** | **`SelectMenu`** | MISMATCH (also `SelectMenuOption`) |
| Switch | `Switch` | Match |
| Textarea | `Textarea` | Match |
| Type | `Type` | Match |

[VERIFIED: npm registry] — inspected `package/lib/components/index.d.ts` and `package/lib/react-figma-ui.cjs.js` from the published 1.1.0 tarball.

**Additionally:** `SelectMenu` has a companion `SelectMenuOption` component that the requirements do not mention. Include it in the barrel since it is needed to render Select options.

**Recommended resolution:** Use aliased re-exports in `index.ts`:
```typescript
export { Onboarding as OnboardingTip } from 'react-figma-ui';
export { DisclosureTip as DisclosureItem } from 'react-figma-ui';
export { SelectMenu as Select, SelectMenuOption } from 'react-figma-ui';
```
This satisfies the requirement names consumers will import while sourcing from the real library symbols.

---

## Architecture Patterns

### Recommended File Changes

```
packages/ui/src/
├── index.ts                    REWRITE — new barrel, CSS import, all 14 re-exports
├── app.tsx                     REWRITE — static component sampler
├── app.module.scss             CREATE NEW — scoped layout styles only
├── main.tsx                    NO CHANGE — entrypoint preserved
├── app.network.tsx             NO CHANGE — message handlers preserved
├── utils/classes.util.ts       KEEP (may be useful for app.module.scss className merges)
├── components/
│   ├── Button.tsx              DELETE
│   └── Button.module.scss      DELETE
└── styles/                     DELETE ALL (9 files)
    ├── main.scss
    ├── abstracts/_variables.scss
    ├── base/_base.scss
    ├── base/_fonts.scss
    ├── base/_typography.scss
    ├── pages/_home.scss
    └── vendors/_normalize.scss
```

Assets directory (`src/assets/`): The old demo references `figma.png`, `react.svg`, `vite.svg`, and `assets/fonts/Alkatra.ttf`. Since app.tsx is fully replaced with a static sampler using only react-figma-ui components, these assets are no longer referenced. They can be deleted or left in place — they will not be included in the build if unreferenced by `vite-plugin-singlefile`. [ASSUMED] — deletion is safe but not required for the build.

### Pattern 1: Barrel with CSS side-effect

The new `index.ts` must import the CSS before any component re-exports so the CSS is included in the bundle regardless of which components are used:

```typescript
// Source: CONTEXT.md locked decision + verified CSS path from npm tarball inspection
import 'figma-plugin-ds/dist/figma-plugin-ds.css';

export { Button } from 'react-figma-ui';
export { Checkbox } from 'react-figma-ui';
export { Disclosure } from 'react-figma-ui';
export { DisclosureTip as DisclosureItem } from 'react-figma-ui';
export { Icon } from 'react-figma-ui';
export { IconButton } from 'react-figma-ui';
export { Input } from 'react-figma-ui';
export { Label } from 'react-figma-ui';
export { SectionTitle } from 'react-figma-ui';
export { Onboarding as OnboardingTip } from 'react-figma-ui';
export { Radio } from 'react-figma-ui';
export { SelectMenu as Select, SelectMenuOption } from 'react-figma-ui';
export { Switch } from 'react-figma-ui';
export { Textarea } from 'react-figma-ui';
export { Type } from 'react-figma-ui';

// Re-export prop types for consumers
export type { Props as IconProps } from 'react-figma-ui';
```

Note: `react-figma-ui` itself imports `figma-plugin-ds/dist/figma-plugin-ds.css` in its own index (visible in `lib/index.d.ts`). The explicit side-effect import in `index.ts` is still the right approach — it makes the dependency explicit and ensures CSS is loaded even when the JIT build resolves the source differently.

### Pattern 2: Static Component Sampler in app.tsx

The new `app.tsx` is a full replacement. It must:
- Remove the existing import of `"./components/Button"` and `"./styles/main.scss"`
- Import layout styles from a new `"./app.module.scss"`
- Preserve the `UI_CHANNEL` import and network event wiring (ping counter) OR remove it since the sampler is static — per the UI-SPEC, this is a "full replacement" with "static showcase only"
- Group components under `SectionTitle` headers per the UI-SPEC layout contract

Per CONTEXT.md: "Full replacement of existing app.tsx — clean swap". The UI-SPEC specifies "No wired-up state: all stateful props (checked, isActive, selected) are hardcoded static values in JSX." This means the `UI_CHANNEL` ping counter logic is removed.

**Critical:** `app.network.tsx` and `main.tsx` must NOT be modified. `main.tsx` calls `UI_CHANNEL.emit(PLUGIN, "hello", ["Hey there, Figma!"])` independently of app.tsx.

### Pattern 3: Scoped Layout Styles (app.module.scss)

Create `packages/ui/src/app.module.scss` for the demo container layout only:

```scss
// Source: UI-SPEC spacing tokens
.container {
  overflow-y: auto;
  height: 100%;
  padding: 8px 16px;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}
```

No global SCSS files. No `@use "@ui/styles/..."` references (those files are being deleted).

### Pattern 4: Disclosure Component JS Initialization

The `Disclosure` component calls `figma-plugin-ds`'s `disclosure.init()` in a `useEffect` — this is handled internally by the component itself (visible in the CJS bundle). No manual init call is needed from app.tsx.

Same applies to `SelectMenu` — it calls `selectMenu.init()` in its own `useEffect`.

[VERIFIED: npm registry] — confirmed in `react-figma-ui.cjs.js` bundle.

### Pattern 5: SelectMenu Usage

`SelectMenu` is a generic component requiring typed `options` and a `render` prop. The static sampler needs a minimal usage:

```tsx
// Source: lib/components/SelectMenu.d.ts from tarball
<Select
  options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
  render={(opt) => <SelectMenuOption key={opt.value} value={opt.value}>{opt.label}</SelectMenuOption>}
/>
```

The `options` type is generic `T extends object`, and `render` receives `(item: T, index: number, all: T[])`.

### Pattern 6: Disclosure/DisclosureItem Usage

`Disclosure` is also a generic render-prop component:

```tsx
// Source: lib/components/Disclosure.d.ts from tarball
<Disclosure
  tips={[{ heading: 'Section', content: 'Details here.' }]}
  render={(tip) => (
    <DisclosureItem
      key={tip.heading}
      heading={tip.heading}
      content={tip.content}
      expanded
    />
  )}
/>
```

### Anti-Patterns to Avoid

- **Importing CSS in app.tsx or main.tsx:** The locked decision is `index.ts`. CSS in app.tsx would only load when that component is used; CSS in main.tsx is fine but deviates from the locked strategy.
- **Wrapping react-figma-ui components:** The locked decision is direct re-export. No HOC wrappers, no prop remapping beyond the alias names.
- **Using `@use "@ui/styles/..."` in app.module.scss:** The styles directory is being deleted. Use only inline values or CSS custom properties from figma-plugin-ds.
- **Keeping the Sass `findFileUrl` importer dependent on styles/:** The Vite config's custom importer handles `@ui/*` aliases for SCSS. After deleting `src/styles/`, if `app.module.scss` uses `@use "@ui/..."` it will fail. Avoid `@use` of deleted paths.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| className merging | Custom concatenation string | `clsx` (bundled in react-figma-ui) | Handles falsy values, arrays, objects |
| Figma-styled UI elements | Custom SCSS components | react-figma-ui + figma-plugin-ds | Pixel-perfect Figma native UI; maintained by community |
| Disclosure toggle behavior | Custom click handler | `Disclosure` component's built-in useEffect | figma-plugin-ds JS module handles DOM event wiring |
| SelectMenu keyboard behavior | Custom select implementation | `SelectMenu` component's built-in useEffect | figma-plugin-ds handles init/destroy lifecycle |

**Key insight:** figma-plugin-ds JS modules (`disclosure.js`, `selectMenu.js`) handle interactive behavior including DOM event listeners with proper cleanup. react-figma-ui wraps these in React lifecycle hooks. Do not bypass by using plain HTML elements.

---

## Common Pitfalls

### Pitfall 1: Wrong Component Names

**What goes wrong:** Using `OnboardingTip`, `DisclosureItem`, or `Select` as import names from `react-figma-ui` directly — these do not exist in the library. Build fails with "does not provide an export named" or TypeScript errors.

**Why it happens:** Requirements use semantic names; the library uses different names (`Onboarding`, `DisclosureTip`, `SelectMenu`).

**How to avoid:** Use aliased re-exports in `index.ts` (see Pattern 1 above). Never import directly from `react-figma-ui` in consumer code — always import from `@repo/ui`.

**Warning signs:** TypeScript error "Module 'react-figma-ui' has no exported member 'OnboardingTip'".

### Pitfall 2: CSS Not Loading in Figma Plugin

**What goes wrong:** Components render without styles — plain unstyled HTML elements.

**Why it happens:** The CSS side-effect import is missing or placed in a file that gets tree-shaken. Vite with `vite-plugin-singlefile` inlines all imported CSS; if the import is absent, no CSS is bundled.

**How to avoid:** Place `import 'figma-plugin-ds/dist/figma-plugin-ds.css'` as the FIRST line of `packages/ui/src/index.ts`. Verify in the built `dist/index.html` that `.button`, `.icon` etc. styles appear inline.

**Warning signs:** Plugin loads but all components look like bare HTML (no border, no Figma-style padding).

### Pitfall 3: Remote Font URLs Not Inlined

**What goes wrong:** Plugin fails to load fonts from `rsms.me` CDN in Figma's sandbox, because Figma plugins run in a sandboxed iframe with restricted network access.

**Why it happens:** `figma-plugin-ds.css` contains `@font-face` declarations pointing to `https://rsms.me/inter/font-files/Inter-Regular.woff2`. The `postcss-url` plugin with `url: "inline"` option is configured in the Vite UI config, but its behavior with remote `https://` URLs is unverified — it may skip them rather than fetching and inlining. [ASSUMED]

**How to avoid:** Test the build: load the built plugin in Figma and verify Inter renders correctly. If fonts don't load, the fallback is `system-ui, sans-serif` (Inter is commonly system-installed). Figma itself uses Inter, so the OS font may cover it. No action required unless visual testing shows degraded typography. [ASSUMED]

**Warning signs:** Text in plugin renders in system default sans-serif instead of Inter.

### Pitfall 4: Modifying main.tsx or app.network.tsx

**What goes wrong:** Breaking the plugin messaging layer or React initialization.

**Why it happens:** These files contain the networking bootstrap that runs before App mounts. Accidentally removing `UI_CHANNEL` setup or the `hello` emit breaks cross-side communication.

**How to avoid:** Do not touch `main.tsx` or `app.network.tsx`. Only modify `index.ts`, `app.tsx`, and the `components/` + `styles/` directories.

### Pitfall 5: Stale Vitest Test for Deleted Button

**What goes wrong:** CI/test run fails after Button.tsx is deleted because `__tests__/Button.test.tsx` still imports `../components/Button`.

**Why it happens:** The existing test file imports the custom Button. When the file is deleted, the import breaks.

**How to avoid:** Delete `packages/ui/src/__tests__/Button.test.tsx` alongside `components/Button.tsx`. Replace with a smoke test for the new barrel exports (see Validation Architecture).

### Pitfall 6: figma-plugin-ds BEM Classes Are Generic (Not `.figma-*` Prefixed)

**What goes wrong:** Developer assumes classes are safely prefixed and doesn't check for collisions.

**Why it happens:** CONTEXT.md states "figma-plugin-ds uses `.figma-*` prefixed classes" — this is INCORRECT. The actual classes are `.button`, `.icon`, `.checkbox`, `.radio`, etc. — generic BEM names.

**Impact for this phase:** Since all demo SCSS partials are being deleted and new layout styles use CSS Modules (`.module.scss`), there is no actual collision risk. The CSS Modules compiler generates hashed class names. But developers must not write global CSS that uses `.button` or `.icon` expecting those to be unique.

[VERIFIED: npm registry] — inspected `figma-plugin-ds-1.0.1.tgz` CSS file directly.

---

## Code Examples

### Verified Barrel Pattern (index.ts)

```typescript
// Source: Inspected from react-figma-ui-1.1.0.tgz, lib/components/index.d.ts
// CSS must be first — side-effect import
import 'figma-plugin-ds/dist/figma-plugin-ds.css';

// Direct re-exports (names that match library)
export { Button } from 'react-figma-ui';
export { Checkbox } from 'react-figma-ui';
export { Disclosure } from 'react-figma-ui';
export { Icon } from 'react-figma-ui';
export { IconButton } from 'react-figma-ui';
export { Input } from 'react-figma-ui';
export { Label } from 'react-figma-ui';
export { SectionTitle } from 'react-figma-ui';
export { Radio } from 'react-figma-ui';
export { Switch } from 'react-figma-ui';
export { Textarea } from 'react-figma-ui';
export { Type } from 'react-figma-ui';

// Aliased re-exports (requirement names differ from library names)
export { DisclosureTip as DisclosureItem } from 'react-figma-ui';
export { Onboarding as OnboardingTip } from 'react-figma-ui';
export { SelectMenu as Select, SelectMenuOption } from 'react-figma-ui';

// Utility (keep for consumers)
export { classes } from './utils/classes.util';
```

### Verified Component Prop Signatures

```typescript
// Button — Source: lib/components/Button.d.ts
// Props extends ButtonHTMLAttributes + { tint?: Tint; destructive?: boolean }
<Button>Primary action</Button>
<Button tint="primary">Primary action</Button>

// Icon — Source: lib/components/Icon.d.ts
// Props: { iconName?: IconName; spin?: boolean; colorName?: ColorName }
<Icon iconName="star" />

// IconButton — Source: lib/components/IconButton.d.ts
// Props: { selected?: boolean; iconProps: IconProps }
<IconButton iconProps={{ iconName: 'plus' }} aria-label="Add item" />

// Input — Source: lib/components/Input.d.ts
// Props extends HTMLInputProps + { containerProps?; iconProps?: IconProps }
<Input placeholder="Type something" />

// Checkbox — Source: lib/components/Checkbox.d.ts
// Props extends HTMLInputProps (omit onChange) + { containerProps?; labelProps?; onChange? }
<Checkbox id="cb1" defaultChecked>Option A</Checkbox>

// Radio — Source: lib/components/Radio.d.ts (same shape as Checkbox)
<Radio id="r1" name="group">Option A</Radio>
<Radio id="r2" name="group">Option B</Radio>

// Switch — Source: lib/components/Switch.d.ts (same shape as Checkbox)
<Switch id="sw1" defaultChecked>Enable feature</Switch>

// Onboarding (alias: OnboardingTip) — Source: lib/components/Onboarding.d.ts
// Props: { iconProps: IconProps; containerProps? }
<OnboardingTip iconProps={{ iconName: 'info' }}>This is a tip for new users.</OnboardingTip>

// Type — Source: lib/components/Type.d.ts
// Props: { size?: Size; weight?: Weight; inverse?: boolean }
<Type size="large" weight="bold">Heading text</Type>

// SectionTitle — Source: lib/components/SectionTitle.d.ts (plain div wrapper)
<SectionTitle>Inputs</SectionTitle>

// Label — Source: lib/components/Label.d.ts (plain div wrapper)
<Label>Field label</Label>

// Textarea — Source: lib/components/Textarea.d.ts (plain textarea wrapper)
<Textarea placeholder="Longer text..." rows={3} />

// SelectMenu (alias: Select) — Source: lib/components/SelectMenu.d.ts
// Props: { options: T[]; render(...): ReactElement } + HTMLSelectProps
<Select
  options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
  render={(opt) => (
    <SelectMenuOption key={opt.value} value={opt.value}>
      {opt.label}
    </SelectMenuOption>
  )}
/>

// Disclosure — Source: lib/components/Disclosure.d.ts
// Props: { tips: T[]; render(...): ReactElement } + HTMLUListProps
<Disclosure
  tips={[{ heading: 'More info', content: 'Details here.' }]}
  render={(tip) => (
    <DisclosureItem
      key={tip.heading}
      heading={tip.heading}
      content={tip.content}
      expanded
    />
  )}
/>
```

---

## Files to Delete

Complete inventory of files to remove in this phase:

| File | Reason |
|------|--------|
| `packages/ui/src/components/Button.tsx` | Replaced by react-figma-ui Button |
| `packages/ui/src/components/Button.module.scss` | Belongs to deleted custom Button |
| `packages/ui/src/styles/main.scss` | Demo SCSS — replaced by figma-plugin-ds CSS |
| `packages/ui/src/styles/abstracts/_variables.scss` | Demo SCSS partial |
| `packages/ui/src/styles/base/_base.scss` | Demo SCSS partial |
| `packages/ui/src/styles/base/_fonts.scss` | Demo SCSS partial (custom fonts no longer needed) |
| `packages/ui/src/styles/base/_typography.scss` | Demo SCSS partial |
| `packages/ui/src/styles/pages/_home.scss` | Demo SCSS partial (.homepage styles) |
| `packages/ui/src/styles/vendors/_normalize.scss` | Demo SCSS partial |
| `packages/ui/src/__tests__/Button.test.tsx` | Tests the deleted custom Button |

[VERIFIED: codebase scan] — all files confirmed to exist via `find` command.

The `styles/` directory itself becomes empty after deletion and should be removed too.

**Note on assets:** `src/assets/figma.png`, `src/assets/react.svg`, `src/assets/vite.svg`, and `src/assets/fonts/Alkatra.ttf` are referenced only by the old `app.tsx`. They are safe to delete but not required — unreferenced assets are not inlined by `vite-plugin-singlefile`. [ASSUMED — not blocking]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Aliasing re-exports (`Onboarding as OnboardingTip`) fully satisfies UI-01 requirements | Standard Stack / Architecture | Low — requirements may intend the actual library names; confirm with planner |
| A2 | `postcss-url` with `url: "inline"` skips or fails on remote `https://` font URLs from figma-plugin-ds | Common Pitfalls | Low — Inter likely available as system font in Figma; plugin still functional |
| A3 | Existing `classes.util.ts` should be kept in barrel exports | Architecture | Low — it's used by consumers and harmless to keep |
| A4 | Unreferenced asset files (figma.png, react.svg etc.) do not need explicit deletion | Files to Delete | Low — vite-plugin-singlefile only inlines referenced assets |

---

## Open Questions

1. **OnboardingTip / DisclosureItem / Select — alias or use library names?**
   - What we know: Requirements say `OnboardingTip`, `DisclosureItem`, `Select`; library exports `Onboarding`, `DisclosureTip`, `SelectMenu`
   - What's unclear: Whether requirements intended to match library names exactly or specify the desired public API name
   - Recommendation: Use aliased re-exports as specified above (matches requirement names, does not break library contract)

2. **Should `SelectMenuOption` be included in the UI-01 export requirement?**
   - What we know: `SelectMenu` is unusable without `SelectMenuOption` for rendering items
   - What's unclear: UI-01 doesn't list it; requirements say "14 components" and list 14 names
   - Recommendation: Export `SelectMenuOption` from `index.ts` regardless — it's a necessary companion and its absence would make `Select` unusable from `@repo/ui`

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| bun | Package install | ✓ | 1.3.11 | — |
| react-figma-ui | UI-01, UI-02, UI-03 | Not yet installed | 1.1.0 (to install) | — |
| figma-plugin-ds | UI-02 (CSS) | Not yet installed (installs via react-figma-ui dep) | 1.0.1 | — |

[VERIFIED: codebase scan] — `react-figma-ui` is not yet in `packages/ui/node_modules` or root `node_modules`.

**Missing dependencies with no fallback:**
- `react-figma-ui` must be installed before any implementation task can proceed. Wave 0 task: `bun add react-figma-ui --filter @repo/ui`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.4 + @testing-library/react ^16.3.2 |
| Config file | `packages/ui/vitest.config.ts` |
| Quick run command | `bun run test --filter @repo/ui` |
| Full suite command | `bun run test --filter @repo/ui` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | All 14 components exported from @repo/ui | unit | `bun run test --filter @repo/ui` | ❌ Wave 0 — new test needed |
| UI-02 | figma-plugin-ds CSS classes apply to components | smoke/visual | manual — happy-dom does not apply external CSS | manual only |
| UI-03 | app.tsx renders without errors using react-figma-ui components | unit (smoke render) | `bun run test --filter @repo/ui` | ❌ Wave 0 — new test needed |
| UI-04 | Deleted files are gone | structural | `bun run types --filter @repo/figma-plugin` | n/a — verified by deletion + type-check pass |

### Sampling Rate
- **Per task commit:** `bun run test --filter @repo/ui`
- **Per wave merge:** `bun run types --filter @repo/figma-plugin && bun run test --filter @repo/ui`
- **Phase gate:** Full type-check + tests green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `packages/ui/src/__tests__/Button.test.tsx` — DELETE (tests deleted component)
- [ ] `packages/ui/src/__tests__/exports.test.ts` — CREATE: verify all 14 named exports exist from `index.ts`
- [ ] `packages/ui/src/__tests__/App.test.tsx` — CREATE: smoke-render `app.tsx` with react-figma-ui components, assert no crash

---

## Security Domain

This phase adds two npm dependencies (`react-figma-ui`, `figma-plugin-ds`). Standard supply chain hygiene applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | Static sampler, no user input processed |
| V6 Cryptography | no | — |
| Supply chain | yes | `bun audit` after install |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious npm package | Tampering | Both packages are stable, last published 2022; check `bun audit` output |
| Remote font load in Figma sandbox | Information Disclosure | Remote CDN fonts — Figma sandbox may block; fonts fall back gracefully |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom Button.tsx + Button.module.scss | Direct re-export from react-figma-ui | Phase 6 | Removes maintenance burden; native Figma styling |
| Multiple SCSS partials (7-1 architecture) | Single CSS import from figma-plugin-ds | Phase 6 | Eliminates custom design system; aligns with Figma native UI |
| Demo app with logo images and counters | Static component sampler | Phase 6 | Demonstrates real plugin UI patterns |

**Deprecated/outdated after this phase:**
- `packages/ui/src/utils/classes.util.ts`: `classes()` function may become redundant since `clsx` is now available transitively via react-figma-ui. Keep it in barrel for backward compatibility; do not delete.

---

## Sources

### Primary (HIGH confidence)
- npm registry: `react-figma-ui@1.1.0` — inspected tarball contents, `lib/index.d.ts`, `lib/components/index.d.ts`, all component `.d.ts` files, CJS bundle for actual export names
- npm registry: `figma-plugin-ds@1.0.1` — inspected tarball contents, `dist/figma-plugin-ds.css` CSS file (class names, font URLs, body reset)
- Codebase: `packages/ui/src/` — all source files read directly

### Secondary (MEDIUM confidence)
- CONTEXT.md — locked decisions from user discussion
- UI-SPEC.md — UI design contract from gsd-ui-researcher
- `apps/figma-plugin/vite.config.ui.ts` — verified `postcss-url` config

### Tertiary (LOW confidence / ASSUMED)
- `postcss-url` behavior with remote `https://` font URLs — not verified against official docs; LOW confidence

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions and exact exports verified via npm tarball inspection
- Architecture: HIGH — existing codebase fully read; patterns derived from verified library APIs
- Pitfalls: HIGH for naming (verified); MEDIUM for font inlining (unverified postcss-url behavior)

**Research date:** 2026-04-09
**Valid until:** 2026-06-09 (stable libraries, 60-day window)
