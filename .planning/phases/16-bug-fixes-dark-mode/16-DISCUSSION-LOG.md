# Phase 16: Bug Fixes + Dark Mode — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 16-bug-fixes-dark-mode
**Areas discussed:** Dark mode strategy, Icon rename impact, main.tsx null-guard behavior, postcssUrl fix approach, Iconify loading strategy, Icon type narrowing with iconify, Phase 17 interaction, Figma theme detection

---

## Dark mode (THEME-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep + add .dark tokens | Define full OKLCH token set under `.dark { ... }`, auto-apply via Figma's injected theme class. All 7 components keep their `dark:` variants. | ✓ |
| Keep tokens, manual only | Define `.dark` tokens but don't auto-wire Figma theme detection. | |
| Strip dark mode | Remove every `dark:` variant from the 7 components and document removal. | |

**User's choice:** Keep + add .dark tokens
**Notes:** Dark mode stays as a first-class feature of the template.

---

## Icon component rename / BUG-04

| Option | Description | Selected |
|--------|-------------|----------|
| Rename + narrow only | Rename `iconName` → `name`, narrow type to `keyof typeof iconMap`. Phase 17 later extends via `registerIcon`. | |
| Rename + update all callers | Rename prop and sweep all `<Icon iconName=...>` usages in the same phase. | |
| Keep `iconName`, just narrow | Leave prop name, only narrow the type. | |

**User's choice:** "Other" — **Implement iconify/react instead of whatever we're using right now**
**Notes:** User explicitly escalated the scope: replace the lucide-react + iconMap approach in the public `Icon` component with `@iconify/react`. This redefines BUG-04 as a library swap, not a type narrow, and has downstream impact on Phase 17's `registerIcon` plans (see Iconify scope / Phase 17 sections below).

---

## main.tsx null-guard behavior (BUG-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Throw descriptive Error | `throw new Error('Root element #root not found in index.html')` — fails loud, standard React pattern. | ✓ |
| Console.error + return | Log and silently exit bootstrap. | |
| Throw TypeError (invariant) | Use an `invariant()` helper with TypeError. | |

**User's choice:** Throw descriptive Error
**Notes:** Loud failure preferred over silent for a template project.

---

## postcssUrl fix (BUG-06)

| Option | Description | Selected |
|--------|-------------|----------|
| Custom url callback | Replace `postcssUrl({ url: 'inline' })` with a callback that applies `pathToFileURL()` before inlining. | |
| Researcher decides | Defer implementation choice; researcher evaluates custom callback vs patch-package vs replacing the plugin. | ✓ |
| Wrap at Vite layer | Pre-rewrite url() references via a small Vite plugin before postcssUrl sees them. | |

**User's choice:** "Other" — **you decide, use best practises**
**Notes:** Delegated to researcher. Constraint is that `pathToFileURL()` from `node:url` must be applied somewhere in the pipeline; researcher picks the lowest-risk implementation.

---

## Iconify loading strategy

| Option | Description | Selected |
|--------|-------------|----------|
| On-demand @iconify/react | Minimal install, relies on runtime API fetches — incompatible with Figma singlefile. | |
| Curated bundled icons | Install `@iconify/react` + `@iconify/json`, preload a whitelist via `addCollection`. Fully offline, small bundle. | ✓ |
| Full iconify sets | Bundle complete icon sets (~100-300KB added). Overkill. | |

**User's choice:** Curated bundled icons
**Notes:** Minimum whitelist mirrors today's 3 icons (`lucide:plus`, `lucide:info`, `lucide:star`). Must explicitly disable iconify's default remote fetching.

---

## Icon type replacement with iconify

| Option | Description | Selected |
|--------|-------------|----------|
| Local StaticIconName union | Export a `StaticIconName` string union from `@repo/ui` covering the preloaded whitelist; type `Icon`'s `name` prop with it. | ✓ |
| Use iconify generic string | Accept any string, rely on runtime warnings. Would fail success criterion #4. | |

**User's choice:** Local StaticIconName union
**Notes:** Satisfies BUG-04 "narrowed to known names" via the preload whitelist. Phase 17 can later broaden via module augmentation.

---

## Phase 17 interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Iconify replaces registerIcon | Phase 17's TYPE-02 is reframed: `registerIcons(iconifyData)` wraps `addCollection`, `StaticIconName` comes from Phase 16's whitelist. | ✓ |
| Iconify + registerIcon coexist | Keep Phase 17's plan for a React-component-based `registerIcon(name, component)` alongside iconify. | |

**User's choice:** Iconify replaces registerIcon
**Notes:** Phase 17 CONTEXT.md must note this reframing and possibly renegotiate REQUIREMENTS.md TYPE-02 wording. Captured in CONTEXT.md Deferred Ideas.

---

## Figma theme detection

| Option | Description | Selected |
|--------|-------------|----------|
| Listen for figma-dark class | Use Figma's injected class on `<html>`; tie `.dark` rule to `:where(html.figma-dark)`. Pure CSS, zero runtime messaging. | ✓ |
| Plugin side posts theme | Plugin reads theme via Figma API, posts to UI which toggles `.dark` class. | |
| Defer to researcher | Let the researcher verify the current Figma plugin theme API. | |

**User's choice:** Listen for figma-dark class
**Notes:** Researcher should still verify the exact class name Figma injects in 2026 and cite it. Tailwind v4 `@custom-variant dark` should point at `html.figma-dark`.

---

## Claude's Discretion

- Exact `StaticIconName` literal list beyond the minimum 3 icons
- Preload helper name (`loadStaticIcons` vs `registerStaticIcons`)
- Inline vs extracted invariant for the main.tsx null guard
- Per-requirement plan sequencing inside Phase 16

## Deferred Ideas

- Phase 17 TYPE-02 reframing to wrap iconify's `addCollection` instead of a React-component `registerIcon`
- Storybook dark mode toggle (Phase 20 or later)
- Expanding preloaded icon whitelist beyond the minimum 3
- Internal lucide-react usage in shadcn/ui primitives — reviewed in Phase 18 (PERF-03), not Phase 16
- Manual QA of Figma live theme toggling while plugin is open
