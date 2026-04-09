# Feature Research: react-figma-ui Components and Storybook

**Domain:** Figma plugin UI component library (react-figma-ui) + Storybook documentation for a Turborepo monorepo
**Researched:** 2026-04-09
**Confidence:** MEDIUM (react-figma-ui API via npm/README; Storybook via official docs and Turborepo guide; plugin dimensions via Figma official docs)

---

## Context: Existing State (Do Not Re-Implement)

The `packages/ui` package already contains:
- One demo component: `Button.tsx` + `Button.module.scss` (to be replaced)
- React 18, SCSS via `sass`, Vitest with happy-dom, `@testing-library/react`
- `@repo/common` workspace dependency, `monorepo-networker`
- JIT source-only exports — no pre-build step, consumed directly by Vite in `apps/figma-plugin`

This research covers **only new additions**: react-figma-ui components and Storybook.

---

## Table Stakes

Features required for this milestone to be usable. Missing any makes the template feel incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| All 14 react-figma-ui components exported from `@repo/ui` | Template should expose every native Figma UI component; using a subset creates confusion | LOW | Import and re-export from `packages/ui/src/index.ts`; no custom implementation needed |
| `figma-plugin-ds` CSS imported globally | Without the stylesheet, all components render unstyled; it is a hard peer requirement | LOW | One `import 'figma-plugin-ds/dist/figma-plugin-ds.css'` in the UI entrypoint |
| TypeScript prop types visible in IDE | Developers expect autocomplete and type safety; react-figma-ui ships its own types | LOW | Peer types ship with the package; no `@types/*` needed |
| `packages/storybook` as a dedicated Turborepo app | Standard Turborepo pattern: Storybook is its own app, not bolted onto `packages/ui` | MEDIUM | `apps/storybook` or `packages/storybook` — both work; `packages/storybook` aligns with "shared tooling" convention |
| Storybook stories for all 14 components | One story file per component is the minimum; Controls tab requires it for useful prop exploration | MEDIUM | One `.stories.tsx` per component in `packages/storybook/src/stories/` |
| Storybook Controls (prop exploration) | Developers expect to toggle props live; this is the primary DX value of Storybook for a component library | LOW | Built into Storybook core since v8; no separate addon install needed |
| Storybook Autodocs (generated docs page) | One-click documentation for each component without writing MDX; standard for component libraries | LOW | Set `tags: ['autodocs']` in each story or globally in `preview.ts` |
| Custom Figma plugin viewport presets | Plugin UIs have fixed small dimensions; default "Desktop" (1200px) preset is misleading and useless | LOW | Define presets in `.storybook/preview.ts`: 240x500, 320x500, 400x600 as common plugin sizes |
| Storybook integrated into Turborepo task graph | `turbo run storybook` and `turbo run build-storybook` should cache correctly | LOW | Add `storybook` (persistent, cache:false) and `build-storybook` (outputs: `storybook-static/**`) to `turbo.json` |
| figma-plugin-ds CSS loaded inside Storybook | Components need the stylesheet to render in Storybook stories just as they do in the plugin | LOW | Import in `.storybook/preview.ts` |

---

## The 14 Component APIs

### Component: Button

**Props:** `tint` ("primary" | "secondary" | "tertiary"), `destructive?: boolean`, `disabled?: boolean`, `children: ReactNode`, plus all native `<button>` HTML attributes.

**Behavior:**
- `primary`: filled/solid appearance — main action
- `secondary`: outlined appearance — secondary action
- `tertiary`: hyperlink-styled — low-emphasis action
- `destructive` can be combined with any tint
- Extends `<button>` so `onClick`, `type`, etc. all work

**Figma plugin usage:** Confirm/apply actions (`tint="primary"`), cancel/back actions (`tint="secondary"`), links to docs or settings (`tint="tertiary"`).

---

### Component: Checkbox

**Props:** `id: string` (required, for label association), `checked?: boolean`, `disabled?: boolean`, `onChange?: ChangeEventHandler`, `children: ReactNode`.

**Behavior:** Controlled or uncontrolled. `id` links the visible label (rendered as `children`) to the input via `htmlFor`. Without `id` the click area breaks.

**Figma plugin usage:** Toggle flags, multi-select options in settings panels.

---

### Component: Disclosure

**Props:** `tips: Array<{ id: string, heading: string, content: string }>`, `render?: (tip: DisclosureTip) => ReactNode`.

**Behavior:** Renders an accordion-style list of expandable sections. Each tip has a heading shown as the collapsed title and content shown when expanded. The optional `render` function lets you customize the DisclosureTip rendering if needed.

**Figma plugin usage:** Help sections, advanced settings that are hidden by default, FAQ-style onboarding content.

---

### Component: Icon

**Props:** `iconName?: string`, `colorName?: string`, `spin?: boolean`, `children?: ReactNode` (text character fallback when `iconName` is omitted).

**Behavior:** Renders one of the Figma native icon set glyphs bundled in `figma-plugin-ds`. If `iconName` is omitted and `children` is provided, renders the child as a text-based icon character. `colorName` maps to the Figma color token names (`blue`, `purple`, `teal`, `red`, `orange`, `yellow`, `green`, `white`, `black`, `black8`, `black3`). `spin` applies a CSS rotation animation.

**Key icon names (not exhaustive):** `adjust`, `alert`, `angle`, `arrow-left-right`, `blend`, `blend-empty`, `close`, `component`, `copy`, `corner-radius`, `distribute-horiz`, `distribute-vert`, `draft`, `effects`, `ellipses`, `expand`, `export`, `eye-open`, `eye-closed`, `forward`, `frame`, `grid`, `group`, `hidden`, `hyperlink`, `image`, `info`, `key`, `layer`, `layout`, `library`, `link`, `lock`, `mask`, `minus`, `move-horiz`, `move-vert`, `minus`, `node-connect`, `play`, `plus`, `recent`, `resize-to-fit`, `resolve`, `search`, `settings`, `share`, `slice`, `sort-alpha-asc`, `sort-alpha-dsc`, `sort-by-date`, `spinner`, `star-off`, `star-on`, `stroke`, `styles`, `theme`, `tidy-up-grid`, `tidy-up-list`, `timer`, `trash`, `type`, `unlock`, `vector`, `warning`, `world`.

**Figma plugin usage:** Inside IconButton, as decorative icons in UI sections, as status indicators with `colorName`.

---

### Component: IconButton

**Props:** `iconProps: { iconName?: string, colorName?: string, spin?: boolean }`, `selected?: boolean`, `disabled?: boolean`, `onClick?: MouseEventHandler`.

**Behavior:** Wraps the Icon component in a small clickable button. `selected` shows an active/pressed state. Essentially a convenience wrapper combining Icon + button semantics — no children needed.

**Figma plugin usage:** Toolbar controls (align left/right/center), toggle states (grid on/off, show/hide guides), view mode switchers.

---

### Component: Input

**Props:** `value?: string`, `defaultValue?: string`, `placeholder?: string`, `disabled?: boolean`, `iconProps?: { iconName: string }`, `onChange?: ChangeEventHandler`, plus native `<input>` attributes.

**Behavior:** A single-line text input styled to match Figma's native inputs. `iconProps` renders an Icon inside the input on the left. Supports controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) modes.

**Figma plugin usage:** Layer name fields, hex color inputs, numeric value fields, search boxes.

---

### Component: Label

**Props:** `children: ReactNode`, plus standard `<label>` HTML attributes.

**Behavior:** Styled label element matching Figma's panel label typography. Used standalone or paired with form controls. The `htmlFor` prop works as expected since it passes through to the native `<label>`.

**Figma plugin usage:** Section labels above groups of controls, form field labels.

---

### Component: SectionTitle

**Props:** `children: ReactNode`, `weight?: "bold"`.

**Behavior:** Renders a styled section heading. `weight="bold"` applies heavier typography. Used to separate logical groups of controls within a plugin panel.

**Figma plugin usage:** Panel section separators ("Fill", "Stroke", "Export options").

---

### Component: OnboardingTip

**Props:** `iconProps: { iconName: string }`, `children: ReactNode`.

**Behavior:** Renders a tip/hint box with an icon and descriptive text. Styled with a subtle background to distinguish it from regular content. Intended for first-run guidance or contextual help shown inline.

**Figma plugin usage:** Empty-state messages ("Select a frame to get started"), first-use hints, contextual help.

---

### Component: Radio

**Props:** `id: string` (required), `name: string` (required, groups radios), `value: string`, `checked?: boolean`, `disabled?: boolean`, `onChange?: ChangeEventHandler`, `children: ReactNode`.

**Behavior:** Individual radio button with associated label (via `children`). Groups are formed by shared `name`. Must be used as multiple `<Radio>` instances — no wrapper "group" component; grouping is via the `name` prop as in native HTML.

**Figma plugin usage:** Mutually exclusive mode selectors (export format: PNG/JPG/SVG, alignment: left/center/right).

---

### Component: Select

**Props:** `options: Array<{ value: string, label: string, disabled?: boolean }>`, `value?: string`, `defaultValue?: string`, `placeholder?: string`, `disabled?: boolean`, `onChange?: (value: string) => void`.

**Behavior:** A custom-rendered dropdown that positions its menu relative to the selected option and adjusts to fit within the iframe. Scrolls vertically when there are more options than visible space. More complex than a native `<select>` — uses JavaScript to manage open/close state and positioning.

**Figma plugin usage:** Font family selectors, stroke type selectors, blend mode choosers. Any choice with 3+ options where a `Radio` group would take too much vertical space.

---

### Component: Switch

**Props:** `id: string` (required), `checked?: boolean`, `disabled?: boolean`, `onChange?: ChangeEventHandler`, `children: ReactNode`.

**Behavior:** A toggle switch (on/off). Label rendered via `children`, linked by `id`. Visually distinct from Checkbox — Switch is for binary enable/disable states, Checkbox for inclusion in a set.

**Figma plugin usage:** Feature toggles (enable dark mode, auto-resize on/off), on/off settings.

---

### Component: Textarea

**Props:** `value?: string`, `defaultValue?: string`, `placeholder?: string`, `rows?: number`, `disabled?: boolean`, `onChange?: ChangeEventHandler`, plus native `<textarea>` attributes.

**Behavior:** Multi-line text input. `rows` controls visible height. Supports controlled and uncontrolled modes. Styled to match Figma's native textarea.

**Figma plugin usage:** CSS export fields, multi-line note inputs, description fields, code output display (read-only with `disabled`).

---

### Component: Type

**Props:** `size?: "large" | "small" | "xsmall"`, `weight?: "bold"`, `italic?: boolean`, `inverse?: boolean`, `children: ReactNode`.

**Behavior:** A typography component using Figma's native font sizes and weights. `inverse` flips to white text for use on dark backgrounds. Not a heading — more like a `<span>` or `<p>` with Figma-aligned typography presets.

**Figma plugin usage:** Body text in plugin UIs, value displays, status messages.

---

## CSS and Theme: figma-plugin-ds Stylesheet

**Package:** `figma-plugin-ds` — the underlying CSS-only design system that `react-figma-ui` depends on.

**What the stylesheet provides:**
- CSS custom properties (design tokens) for Figma's exact color palette, typography scale, border radius, spacing, and icon glyphs
- Base reset and body styles matching Figma's plugin container
- Component-level class names that react-figma-ui's JSX maps onto
- Icon font/glyph definitions used by the Icon component
- No JavaScript — pure CSS

**Import method:** The CSS must be imported once globally. In a Vite project:

```typescript
// In packages/ui/src/main.tsx (or wherever the React app mounts)
import 'figma-plugin-ds/dist/figma-plugin-ds.css'
```

In Storybook, the same import goes in `.storybook/preview.ts`:

```typescript
import 'figma-plugin-ds/dist/figma-plugin-ds.css'
```

**Single-file output constraint:** Because `apps/figma-plugin` uses `vite-plugin-singlefile`, the CSS gets inlined into `dist/index.html` automatically. No extra configuration is needed — Vite sees the CSS import and inlines it like any other stylesheet.

**What it does NOT provide:**
- Dark mode toggle (Figma plugin UIs always inherit the Figma app's system theme; the CSS has no `prefers-color-scheme` support out of the box)
- Responsive/fluid layout utilities
- Animation utilities beyond the spinner on Icon

---

## How Figma Plugin UIs Typically Use These Components

### Layout Pattern

Figma plugin UIs are small, fixed-width iframes. Typical dimensions:
- Default: 300px wide, 200px tall (Figma default)
- Common in the wild: 240–400px wide, 300–600px tall
- Minimum: 70px wide
- Dynamically resizable: `figma.ui.resize(width, height)` can be called from `plugin.ts` in response to UI events

Plugin UIs are almost always **single-panel layouts** — not multi-page, not tabbed in most cases. The component set matches this: controls are stacked vertically in sections separated by `SectionTitle` and `Label`.

### Typical Usage Patterns

**Settings panel (most common):**
```
SectionTitle ("Options")
  Label + Switch (toggle setting)
  Label + Input (text/number value)
  Label + Select (choice)
SectionTitle ("Advanced")
  Disclosure (collapsed advanced options)
Button (tint="primary") — "Apply"
Button (tint="secondary") — "Cancel"
```

**Selection-aware panel:**
```
OnboardingTip — shown when nothing is selected
[Panel content] — shown when selection exists
```

**Toolbar-style panel:**
```
Row of IconButton components — mode switches
Input with iconProps — search field
```

### Controlled vs Uncontrolled State

Most react-figma-ui components work in both modes. For plugin UIs, controlled mode (using React state + `onChange`) is standard because plugins often need to:
- Persist settings to `figma.clientStorage`
- Relay values to the plugin sandbox via `PLUGIN_CHANNEL.emit(...)`
- Derive other UI state from form values

### Message Passing Integration

The UI side communicates with the plugin sandbox via `monorepo-networker`. Components integrate naturally:

```typescript
// In a plugin UI component
const [exportScale, setExportScale] = useState('1x')

const handleApply = () => {
  PLUGIN_CHANNEL.emit(PLUGIN_SIDE, 'exportSelected', [exportScale])
}

return (
  <>
    <Select
      options={[{ value: '1x', label: '1x' }, { value: '2x', label: '2x' }]}
      value={exportScale}
      onChange={setExportScale}
    />
    <Button tint="primary" onClick={handleApply}>Export</Button>
  </>
)
```

---

## Differentiators (What Makes This Template Stand Out)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Custom Storybook viewport presets for plugin dimensions | No existing Figma plugin template includes this; developers waste time testing in wrong viewport | LOW | 3–4 named presets matching real plugin window sizes (240x400, 320x500, 400x600, 400x300) |
| Stories co-located with component exports in `packages/storybook` | Keeps docs close to implementation; single Turborepo app dedicated to Storybook | MEDIUM | `packages/storybook` imports from `@repo/ui` and renders stories for each component |
| `figma-plugin-ds` CSS imported in both UI entrypoint AND Storybook preview | Ensures pixel-perfect parity between plugin and Storybook renders | LOW | Two import sites; must stay in sync |
| Autodocs with props table | Eliminates manual documentation; CSF3 `satisfies Meta<typeof Comp>` pattern gives accurate type inference in props table | LOW | Set `tags: ['autodocs']` globally in preview.ts |
| Interactive Controls for all 14 components | Developers can explore every prop combination without writing code | LOW | Storybook infers argTypes from TypeScript; react-figma-ui ships types |
| Storybook as `turbo run storybook` (persistent) + `turbo run build-storybook` (cached) | Storybook participates in the Turborepo cache graph correctly | LOW | `cache: false, persistent: true` for dev; `outputs: ['storybook-static/**']` for build |

---

## Anti-Features (Commonly Requested, Often Problematic)

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Wrapping react-figma-ui components in custom wrappers | Seems like "clean API" | Adds indirection with no benefit; react-figma-ui components are already thin wrappers; double-wrapping breaks TypeScript prop passthrough | Re-export directly: `export { Button } from 'react-figma-ui'` in `packages/ui/src/index.ts` |
| Building a custom Figma-style component from scratch | "react-figma-ui is stale" | react-figma-ui's last release is 1.1.0, published over a year ago (MEDIUM risk flag), but the underlying figma-plugin-ds CSS is the real dependency; rebuilding is high cost for zero visual gain | Use react-figma-ui as-is; if maintenance is a concern, fork rather than rebuild |
| Using `@storybook/addon-viewport` as a separate install | Seems required for viewport presets | `@storybook/addon-viewport` was merged into Storybook core in v8; installing it separately causes duplicate registration errors | Configure viewports directly in `.storybook/preview.ts` via `parameters.viewport` — no install needed |
| Storybook installed at monorepo root | Simpler setup | Root-level Storybook cannot easily reference stories from `packages/ui` by workspace path without complex glob configuration; Turborepo cannot cache it per-package | Dedicated `packages/storybook` or `apps/storybook` app that depends on `@repo/ui` |
| `storybook-addon-designs` (Figma design viewer addon) | Useful for design-code link | Out of scope for this milestone; adds non-trivial Figma API token management complexity | Defer to a future "design system" milestone |
| MDX story files for every component | Manual MDX gives more control | Hand-written MDX quickly becomes stale; Autodocs from CSF3 stories is lower maintenance and higher accuracy | Use Autodocs (tags: ['autodocs']) for generated docs; only write MDX for narrative/overview pages |
| Upgrading react-figma-ui to the alpha v2 (`2.0.0-alpha.1`) | Newer version available | Alpha tag; `2.0.0-alpha.1` uses `patch-package` and `postinstall-postinstall` as runtime dependencies (significant red flag — implies patching node_modules at install time); last published over a year ago | Stay on `1.1.0` (latest stable); watch GitHub for official v2 release |

---

## Feature Dependencies

```
[figma-plugin-ds CSS]
    └──required-by──> [react-figma-ui components render correctly]
    └──must-import-in──> [packages/ui/src/main.tsx (plugin entrypoint)]
    └──must-import-in──> [packages/storybook/.storybook/preview.ts]

[react-figma-ui@1.1.0]
    └──peer-deps──> [react >=16.8.0, react-dom >=16.8.0] (satisfied by react@18.2.0 in packages/ui)
    └──deps──> [figma-plugin-ds@^1.0.1, clsx@^1.1.1]
    └──installed-in──> [packages/ui]
    └──re-exported-from──> [packages/ui/src/index.ts]

[packages/storybook]
    └──depends-on──> [@repo/ui (workspace:*)]
    └──depends-on──> [@storybook/react-vite (framework)]
    └──imports-stories-from──> [packages/ui/src/components/**]
    └──requires-vite──> [vite 6.x (already in apps/figma-plugin; storybook needs its own vite dev dep)]

[Storybook viewport presets]
    └──configured-in──> [packages/storybook/.storybook/preview.ts]
    └──no-extra-install──> [merged into Storybook core since v8]

[Storybook Autodocs]
    └──enabled-by──> [tags: ['autodocs'] in preview.ts or per-story]
    └──no-extra-install──> [part of @storybook/addon-docs, bundled in core]

[Turborepo task graph for Storybook]
    └──requires──> [storybook script in packages/storybook/package.json]
    └──configured-in──> [root turbo.json: storybook task (persistent) + build-storybook task (cached)]
    └──exclude-stories-from-ui-build──> [turbo.json inputs exclusion: !**/*.stories.tsx]

[Figma single-file constraint]
    └──not-affected-by──> [Storybook — Storybook is a dev tool, not bundled into dist/]
    └──satisfied-by──> [figma-plugin-ds CSS inlined by vite-plugin-singlefile in apps/figma-plugin]
```

---

## MVP Definition for This Milestone

### Must Ship (v1.1 launch)

- [ ] `react-figma-ui@1.1.0` installed in `packages/ui`
- [ ] `figma-plugin-ds` CSS imported in `packages/ui/src/main.tsx`
- [ ] All 14 components re-exported from `packages/ui/src/index.ts` (replacing current single Button export)
- [ ] Demo Button in `packages/ui/src/components/` replaced or extended using react-figma-ui's Button
- [ ] `packages/storybook` created as a dedicated Storybook app using `@storybook/react-vite`
- [ ] `.storybook/preview.ts` importing `figma-plugin-ds` CSS and defining plugin viewport presets
- [ ] One story file per component (14 total), each with at least: default story, key variants, autodocs enabled
- [ ] Storybook `storybook` + `build-storybook` tasks in `turbo.json`
- [ ] Stories glob in `packages/storybook` configured to find stories from its own `src/stories/`

### Nice-to-Have (add within milestone if time allows)

- [ ] `parameters.backgrounds` preset with `#ffffff` (light) and `#2c2c2c` (dark) — matches Figma's light/dark UI
- [ ] Vitest story snapshot tests (optional — Storybook 9/10 has `@storybook/test` integration with Vitest)
- [ ] `a11y` accessibility addon for Storybook (`@storybook/addon-a11y`) — useful for plugin accessibility audit

### Defer to Future Milestone

- [ ] Storybook published to GitHub Pages or Chromatic for shareable docs
- [ ] Figma Storybook addon (`storybook-addon-designs`) for design-code link
- [ ] Visual regression testing via Chromatic
- [ ] Automatic `figma.ui.resize()` based on story viewport selection

---

## Storybook Version Decision

As of April 2026, `@storybook/react-vite` is at version 10.x (Storybook 9 released July 2025, v10 followed). Key facts:

- Storybook 8+: viewport, controls, actions, interactions all merged into core (no separate addon installs)
- Storybook 9+: `docs.autodocs` config removed; tags-based autodocs only
- Storybook 9+: CSF3 with `satisfies Meta<typeof Component>` for best TypeScript inference
- Turborepo official guide covers Storybook; use `packages/storybook` or `apps/storybook` pattern

**Recommendation:** Use `@storybook/react-vite@latest` (v10.x at time of writing). The feature set needed here (controls, docs, viewport, basic stories) is stable across v8/v9/v10. The Turborepo guide is valid for all three.

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| react-figma-ui component list | HIGH | npm package info + multiple sources agree on exact 14 components |
| Component prop APIs | MEDIUM | Aggregated from README fragments and npm docs; not verified by reading full source |
| figma-plugin-ds CSS requirement | HIGH | Official package README, multiple tutorials confirm mandatory import |
| Storybook viewport/core addons | HIGH | Storybook official docs confirm viewport merged into core in v8 |
| Storybook Turborepo integration | HIGH | Official Turborepo guide at turborepo.dev/docs/guides/tools/storybook |
| Figma plugin UI dimensions | HIGH | Figma official Plugin API docs (figma.com/plugin-docs) |
| react-figma-ui maintenance status | MEDIUM-LOW | Package marked "inactive" by Snyk; last publish over a year ago; v2 alpha uses patch-package (red flag) |
| Storybook current version (v10.x) | MEDIUM | Web search confirms Storybook 9 released July 2025 and v10 followed; exact version unverified via official source |

---

## Gaps and Open Questions

1. **react-figma-ui maintenance risk**: The package has not been updated in over a year. The v2 alpha is concerning (`patch-package` dependency). If react-figma-ui becomes unmaintained and breaks with React 19+, the fallback options are: (a) fork and patch, (b) switch to `@thinkbuff/figma-react` (seen in npm search results, appears more recently maintained), or (c) use `create-figma-plugin` UI components. This should be monitored but is not a blocker for React 18.

2. **Storybook stories glob for cross-package**: If stories are co-located in `packages/ui/src/components/` instead of `packages/storybook/src/stories/`, there is a known Storybook issue (#31837) with glob resolution across workspace packages. The safer pattern is keeping stories in `packages/storybook` and importing components from `@repo/ui`. This should be validated during implementation.

3. **figma-plugin-ds icon name completeness**: The icon name list documented above is representative, not exhaustive. The full list is in the `figma-plugin-ds` source CSS. Stories for the Icon component should display a gallery of all available icons — verify the full list from the installed package.

4. **SCSS Module compatibility with react-figma-ui**: react-figma-ui uses its own CSS class names from `figma-plugin-ds`. If the existing `packages/ui` SCSS Modules apply conflicting class names, specificity issues may arise. The current demo `Button.module.scss` will be removed as part of this migration, resolving any conflicts.

---

## Sources

- [react-figma-ui npm package](https://www.npmjs.com/package/react-figma-ui) — component list, version, peer deps (HIGH confidence)
- [GitHub - JB1905/react-figma-ui](https://github.com/JB1905/react-figma-ui) — README with component APIs (MEDIUM confidence — aggregated from search result excerpts)
- [figma-plugin-ds GitHub - thomas-lowry](https://github.com/thomas-lowry/figma-plugin-ds) — CSS stylesheet basis (HIGH confidence)
- [Turborepo: Storybook guide](https://turborepo.dev/docs/guides/tools/storybook) — Turborepo integration patterns (HIGH confidence, official docs)
- [Storybook: React with Vite](https://storybook.js.org/docs/get-started/frameworks/react-vite) — framework setup (HIGH confidence, official docs)
- [Storybook: Viewport docs](https://storybook.js.org/docs/essentials/viewport) — viewport configuration (HIGH confidence, official docs)
- [Storybook: Autodocs](https://storybook.js.org/docs/writing-docs/autodocs) — autodocs setup (HIGH confidence, official docs)
- [Figma Plugin API: figma.ui](https://www.figma.com/plugin-docs/api/figma-ui/) — plugin window dimensions (HIGH confidence, official docs)
- [Figma Plugin API: showUI](https://www.figma.com/plugin-docs/api/properties/figma-showui/) — width/height defaults (HIGH confidence, official docs)
- [InfoQ: Storybook v9 released July 2025](https://www.infoq.com/news/2025/07/storybook-v9-released/) — version timeline (MEDIUM confidence)
- [Snyk: react-figma-ui health](https://snyk.io/advisor/npm-package/react-figma-ui) — maintenance status flag (MEDIUM confidence)

---

*Feature research for: react-figma-ui component library + Storybook — v1.1 UI Components milestone*
*Researched: 2026-04-09*
