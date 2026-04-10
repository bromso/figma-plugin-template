# Phase 16: Bug Fixes + Dark Mode — Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 16 opens v1.3 Code Audit Resolution. It resolves the six concrete bugs flagged by the v1.2 milestone audit (BUG-01..06) and makes a definitive call on dark mode (THEME-01). Phase 16 must ship stable code so Phases 17-20 (type safety, bundle optimization, React Compiler, tests) can build on top.

**In scope:**
- BUG-01..06 code fixes
- THEME-01 dark mode tokens + Figma theme detection wiring
- Icon component library swap (lucide-react → @iconify/react) — required to satisfy BUG-04 per the user's call
- Update of existing Icon/IconButton call sites in `@repo/ui` app shell and Storybook stories

**Out of scope (belongs in other phases):**
- Type-check pipeline / `tsc --noEmit` on packages/ui → Phase 17
- Any bundle analysis or Radix/Lucide import strategy → Phase 18
- React Compiler opt-in → Phase 19
- Interaction tests → Phase 20
- Replacing lucide-react imports inside shadcn/ui primitives (`select.tsx`, `checkbox.tsx`, `accordion.tsx`) — those are internal decoration, not the public Icon API

</domain>

<decisions>
## Implementation Decisions

### THEME-01 — Dark mode

- **D-01:** Dark mode is **kept and fully wired**. Define the full OKLCH token set under `.dark { ... }` in `packages/ui/src/styles.css`, mirroring the `:root` tokens.
- **D-02:** **Detection is pure CSS** — rely on Figma's injected `figma-dark` class on `<html>`. Tie the `.dark` rule to `:where(html.figma-dark) { ... }` (or equivalent selector) so no runtime messaging is needed between plugin and UI. Researcher must verify the current class name Figma injects (`figma-dark` vs `figma-dark-mode` vs a CSS variable) and pin it with a citation.
- **D-03:** All 7 components (`button`, `input`, `checkbox`, `radio-group`, `switch`, `textarea`, `select`) keep their existing `dark:` variants — no stripping.
- **D-04:** Tailwind v4 `dark` variant must be configured to use the `class` strategy (not `media`) so it matches Figma's class-based theme signal. Verify `@custom-variant dark` or equivalent in `styles.css`.

### BUG-01 — main.tsx null guard

- **D-05:** Replace the unchecked `as HTMLElement` cast with an explicit null check that **throws a descriptive `Error`**: `throw new Error('Root element #root not found in index.html')`. Fails loud during template consumption, standard React pattern.

### BUG-02 — ButtonProps phantom

- **D-06:** Define and export `type ButtonProps` from `packages/ui/src/components/ui/button.tsx`. Use `React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }` (the same inline type used today). `index.ts` already re-exports it — the re-export becomes real.

### BUG-03 — AlertAction export

- **D-07:** Add `AlertAction` to the `packages/ui/src/index.ts` barrel: `export { Alert, AlertAction, AlertDescription, AlertTitle } from "./components/ui/alert";`. `alert.tsx` already defines and exports it locally.

### BUG-04 — Icon component → iconify/react migration

- **D-08:** **Replace `lucide-react` + `iconMap`** in the public `Icon` component with `@iconify/react`. Install `@iconify/react` and `@iconify/json` (or a smaller per-set package — researcher picks the smallest that still satisfies the whitelist).
- **D-09:** **Strategy: curated bundled icons.** Preload a small whitelist that preserves today's behavior — at minimum `lucide:plus`, `lucide:info`, `lucide:star` — via `addCollection` / `addIcon` calls at module init. **No runtime fetches to `api.iconify.design`** (incompatible with Figma's singlefile sandbox). Explicitly disable the default remote behavior.
- **D-10:** Rename prop `iconName` → `name` per ROADMAP success criterion #4. **Update all call sites** in the same phase:
  - `packages/ui/src/app.tsx` (2 uses)
  - `packages/ui/src/components/figma/icon-button.tsx` (`iconProps.iconName` → `iconProps.name`)
  - `apps/storybook/src/stories/Icon.stories.tsx` (4 stories)
  - `apps/storybook/src/stories/IconButton.stories.tsx` (3 stories)
- **D-11:** Export a typed `StaticIconName` string union from `@repo/ui` covering the preloaded whitelist (e.g. `'lucide:plus' | 'lucide:info' | 'lucide:star'`). Type `Icon`'s `name` prop as `StaticIconName`. Satisfies BUG-04's "narrowed to known names" requirement.
- **D-12:** Keep the `spin` prop. Implement it via a className (`animate-spin`) wrapping the iconify component — preserve today's behavior.
- **D-13:** The graceful "return null" fallback in today's `Icon` is dropped — with a narrowed type, invalid names can't compile. Iconify's own missing-icon handling (console warning + empty render) covers the unlikely runtime miss.

### BUG-05 — index.html conformance

- **D-14:** Rewrite `packages/ui/src/index.html` as a conformant document with `<!DOCTYPE html>`, `<html lang="en">`, `<head>` containing `<meta charset>`, `<meta viewport>`, `<title>`, and stylesheet link, and `<body>` containing `#root` div and the main.tsx script tag. Researcher must confirm `vite-plugin-singlefile` still inlines everything correctly with the full structure.

### BUG-06 — postcssUrl path encoding

- **D-15:** **Researcher decides.** The constraint: `apps/design-plugin/vite.config.ui.ts` must use `pathToFileURL()` from `node:url` so CSS asset paths containing spaces round-trip correctly through `postcss-url`'s inline pipeline. Researcher evaluates (in order of preference): (a) pass a custom `url` callback to `postcssUrl({ url: (asset) => … })` that applies `pathToFileURL(asset.absolutePath).href` before inlining; (b) pre-process url() references in a small Vite plugin before postcssUrl sees them; (c) upstream patch via patch-package. Choose the lowest-risk option with a citation.
- **D-16:** Verification: place a test font or asset under a path that contains a space (or create a temporary symlink for the build) and confirm `bun run build` succeeds end-to-end.

### Claude's Discretion

- Exact `StaticIconName` literal list (minimum must be `lucide:plus`, `lucide:info`, `lucide:star`; researcher/planner may add a few common names if trivial)
- Exact helper name for the preload function (e.g. `loadStaticIcons()` vs `registerStaticIcons()`)
- Whether the null-guard in main.tsx is inline or extracted to a tiny `invariant()` helper (inline is fine for one site)
- Commit sequencing inside Phase 16 (the planner splits into per-requirement plans)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & audit
- `.planning/REQUIREMENTS.md` §Bug Fixes (BUG-01..06), §Theme (THEME-01) — pending reqs satisfied by Phase 16
- `.planning/ROADMAP.md` — Phase 16 success criteria (lines 69-82)
- `.planning/milestones/v1.2-MILESTONE-AUDIT.md` §tech_debt (lines 36-49) — original audit findings, including the postcssUrl space-encoding note

### Code to be modified
- `apps/design-plugin/vite.config.ui.ts` — postcssUrl config (BUG-06)
- `packages/ui/src/main.tsx` — null guard (BUG-01)
- `packages/ui/src/index.html` — conformant HTML (BUG-05)
- `packages/ui/src/styles.css` — add `.dark` tokens + Tailwind v4 class variant (THEME-01)
- `packages/ui/src/components/ui/button.tsx` — `ButtonProps` export (BUG-02)
- `packages/ui/src/components/ui/alert.tsx` — already exports `AlertAction`; no edits
- `packages/ui/src/index.ts` — add `AlertAction` re-export (BUG-03) + `StaticIconName` export (BUG-04)
- `packages/ui/src/components/figma/icon.tsx` — full rewrite to iconify/react (BUG-04)
- `packages/ui/src/components/figma/icon-button.tsx` — `iconProps.iconName` → `iconProps.name` + type update
- `packages/ui/src/app.tsx` — update 2 `<Icon iconName=...>` usages
- `apps/storybook/src/stories/Icon.stories.tsx` — update 4 stories
- `apps/storybook/src/stories/IconButton.stories.tsx` — update 3 stories
- `apps/design-plugin/package.json` — may need `postcss-url` touch (BUG-06)
- `packages/ui/package.json` — add `@iconify/react` + `@iconify/json` (or per-set package)

### External docs (researcher should fetch via Context7)
- `@iconify/react` — offline/preload API, `addCollection` / `addIcon`, disabling default API fetching
- Tailwind CSS v4 — `@custom-variant dark (...)` syntax for class-based dark mode in CSS-first config
- Figma plugin runtime — confirm the actual theme class Figma injects on the iframe `<html>` (as of 2026)
- `postcss-url` v10.1.3 — custom `url` callback signature
- Node `node:url` — `pathToFileURL` behavior with spaces

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/ui/src/components/ui/button.tsx` — `buttonVariants` already well-typed; only the exported type needs naming
- `packages/ui/src/components/ui/alert.tsx` — `AlertAction` already implemented and locally exported
- `packages/ui/src/styles.css` — `@theme inline` block with `--color-*` CSS variables; adding `.dark { --background: ...; ... }` tokens fits the existing pattern
- `packages/ui/src/lib/utils.ts` — `cn()` helper is already there for the new Icon wrapper
- `lucide-react` stays in the dep tree — used internally by `select.tsx`, `checkbox.tsx`, `accordion.tsx` for primitive chevrons/checks; **do not migrate those to iconify**

### Established Patterns
- Components define `*Variants` via `class-variance-authority` and export a pure function component — iconify wrapper should follow the same structure
- Side-effect CSS imports happen via `packages/ui/styles.css` entrypoint (consumed by Storybook preview and the plugin's main.tsx)
- Icons today are 3-name hard-coded — preload whitelist should mirror that exactly for a zero-behavior-change baseline

### Integration Points
- `apps/design-plugin/vite.config.ui.ts` — Vite UI build; postcssUrl config lives here
- `packages/ui/src/main.tsx` — bootstrap entry; reacts to `#root` lookup
- `packages/ui/src/app.tsx` — demonstrates the public Icon API; doubles as the template's "smoke test" surface
- `apps/storybook/.storybook/preview.ts` — already loads `@repo/ui/styles.css` (per recent commit e22ca8e), so dark mode + new tokens will flow into Storybook automatically

</code_context>

<specifics>
## Specific Ideas

- **Dark mode selector wiring:** Prefer Tailwind v4 custom variant syntax — e.g. `@custom-variant dark (&:where(html.figma-dark *, html.figma-dark))` — so existing `dark:` utilities in component classNames "just work" when Figma's class is present.
- **Preload ergonomics:** Expose `StaticIconName` + the preload helper from the `@repo/ui` barrel so consumers can extend the whitelist without importing deep paths.
- **Storybook note:** Storybook's `<html>` won't have `figma-dark` by default, so dark mode won't render there. That's fine for Phase 16 — dark mode Storybook coverage is Phase 20 / future work (see Deferred Ideas).

</specifics>

<deferred>
## Deferred Ideas

- **Phase 17 re-framing (IMPORTANT):** TYPE-02 originally planned `registerIcon(name, component)` for arbitrary React components. With iconify in place, Phase 17 should instead expose `registerIcons(iconifyData)` — a thin wrapper around iconify's `addCollection` — and broaden `StaticIconName` via module augmentation. Phase 17 CONTEXT.md must reference this decision and possibly renegotiate TYPE-02's wording in `.planning/REQUIREMENTS.md`.
- **Storybook dark mode toggle:** Add a Storybook `globalTypes` theme toggle that flips `figma-dark` on `<html>` so stories can be previewed in both modes. Defer to Phase 20 (Tests + DX) or a future DX pass.
- **Full Lucide icon coverage:** Expanding the preloaded whitelist beyond 3 icons. Template consumers can add their own; we ship the minimum. Backlog if a consumer asks.
- **Internal lucide-react imports:** `select.tsx`, `checkbox.tsx`, `accordion.tsx` will be reviewed in Phase 18 for tree-shaking (PERF-03). Phase 16 leaves them alone.
- **Theme sync when Figma changes mode live:** If Figma toggles theme while the plugin is open, the CSS class flip should be automatic (it's a direct class observer on `<html>`). Verify during manual QA; no extra code required if Figma's behavior matches the assumption.

</deferred>

## Verification

After all Phase 16 plans are executed, these must pass:

1. **BUG-01:** `rg 'as HTMLElement' packages/ui/src/main.tsx` returns nothing; `document.getElementById('root')` is null-checked with a thrown Error.
2. **BUG-02:** `bun run build` succeeds; `import { type ButtonProps } from '@repo/ui'` resolves to a real type (not a phantom).
3. **BUG-03:** `import { AlertAction } from '@repo/ui'` resolves; `rg 'AlertAction' packages/ui/src/index.ts` shows the re-export.
4. **BUG-04:** `<Icon name="lucide:plus" />` compiles; `<Icon name="unknown" />` fails type check; `rg 'iconName' packages/ui apps/storybook apps/design-plugin` returns nothing; built bundle has no reference to `api.iconify.design`.
5. **BUG-05:** `packages/ui/src/index.html` has DOCTYPE, html, head, body; `bun run build` still emits a working single-file `dist/index.html`.
6. **BUG-06:** `bun run build` succeeds when the build runs from a path containing a space.
7. **THEME-01:** `.dark` token block exists in `packages/ui/src/styles.css`; manually toggling `<html class="figma-dark">` in devtools with the plugin UI loaded flips backgrounds/foregrounds.
8. **Turborepo health:** `bun run build`, `bun run lint`, `bun run test` all exit 0.
9. **Roadmap traceability:** `.planning/REQUIREMENTS.md` entries BUG-01..06 + THEME-01 can be moved to satisfied after phase verification.

---

*Phase: 16-bug-fixes-dark-mode*
*Context gathered: 2026-04-10*
