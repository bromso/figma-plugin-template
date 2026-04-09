# Stack Research

**Domain:** Turborepo monorepo migration — Figma plugin template with Bun, Biome, and Vitest
**Researched:** 2026-04-09
**Confidence:** MEDIUM (versions verified via web search; some Bun/Turborepo edge cases LOW confidence)

---

## Context: What Already Exists (Do Not Re-research)

The following stack is validated and in production in this project:

| Technology | Version | Role |
|------------|---------|------|
| React | ^18.2.0 | UI framework |
| Vite | ^6.0.0 | Build tool (two configs: ui + plugin) |
| vite-plugin-singlefile | ^2.0.3 | Inlines all assets into single HTML/JS |
| vite-plugin-react-rich-svg | ^1.0.0 | SVG import as component/url/raw |
| @figma/plugin-typings | ^1.83.0 | Figma API types |
| monorepo-networker | ^2.1.0 | Typed plugin/UI message passing |
| TypeScript | ^5.3.0 | Type system |
| SCSS + CSS Modules | via sass ^1.99.0 | Styling (7-1 architecture) |
| postcss-url | ^10.1.3 | Inlines CSS url() references (required for singlefile) |
| Turborepo | ^2.9.5 | Monorepo task orchestration |
| Bun | 1.3.11 | Package manager + runtime |
| Biome | 2.4.10 | Lint + format |
| Vitest | ^4.1.4 | Unit testing |

This research covers **only the new tooling additions** needed for the monorepo migration.

---

## Critical Version Constraint

**Vitest 4.x requires Vite >= 6.0.0.** The existing project uses Vite 5. This creates a decision point:

- **Path A:** Upgrade Vite to 6 or 7, use Vitest 4.x (latest). Requires verifying all existing Vite plugins still work.
- **Path B:** Use Vitest 3.x, which supports both Vite 5 and Vite 6. No Vite upgrade needed. Vitest 3 is actively maintained.

**Recommendation: Path A — upgrade Vite to ^6.0.0** alongside Vitest 4.x. Rationale:
- vite-plugin-singlefile v2.2.1+ explicitly supports Vite 6 and 7 (resolved peer dep conflict from v2.0.3)
- Vite 6 is stable and widely adopted; Vite 8 is current but Rolldown is a bigger change
- Vitest 4.x has the projects API that replaces the deprecated workspace file pattern
- Staying on Vite 5 creates a ceiling — every future upgrade becomes a bigger leap

**Vite upgrade target: ^6.0.0** (not 7 or 8, to minimize plugin compatibility risk in a migration milestone).

---

## Recommended Stack: New Additions (v1.0 Monorepo Milestone)

### Core Tooling (New)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| turbo | ^2.9.4 | Monorepo task orchestration, caching | Latest stable (released 2026-03-30); Bun is first-class supported; `tasks` format (not deprecated `pipeline`); 2.9 adds stable `turbo query` and better task graph handling |
| bun | 1.3.x | Package manager + script runner replacing npm | 1.3 is current stable; isolated workspace installs by default; `workspace:*` protocol; catalog support for shared dep versions; 4x-20x faster installs than npm |
| @biomejs/biome | ^2.4.10 | Lint + format (replaces ESLint + Prettier) | 2.x is the current major; 97% Prettier-compatible formatter; 450+ lint rules; TypeScript + JSX/TSX native support; single binary, no plugin wrangling |
| vitest | ^4.1.3 | Unit testing | 4.1 is current stable; `projects` array config for monorepos; requires Vite 6+; Browser Mode stable in 4.0 |

### Vite Upgrade (Required for Vitest 4)

| Technology | Current | Target | Why |
|------------|---------|--------|-----|
| vite | ^5.0.11 | ^6.0.0 | Vitest 4 requires Vite >=6.0.0 (Node 20+) |
| vite-plugin-singlefile | ^2.0.3 | ^2.3.0 | 2.3.0 is current; adds Vite 7 support; fixes Vite 6 peer dep that broke 2.0.3 |

### Test Environment

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| happy-dom | ^latest | DOM simulation for Vitest | Preferred over jsdom in Bun projects — faster; fewer compatibility issues with Vitest 4 (jsdom has known v4 compatibility issues) |
| @vitest/coverage-v8 | ^4.1.3 | Coverage reporting | Matches Vitest version; v8 provider uses AST-based remapping in Vitest 4 |

---

## New Additions: v1.1 UI Components and Storybook

This section documents the packages needed for the v1.1 milestone only.

---

### 1. react-figma-ui (Component Library)

**Package:** `react-figma-ui@1.1.0`
**Confidence:** HIGH — verified via npm registry

**Why:** Implements figma-plugin-ds as React components. Provides 14 native Figma UI components: Button, Checkbox, Disclosure, Icon, IconButton, Input, Label, Onboarding, Radio, SectionTitle, SelectMenu, Switch, Textarea, Type.

**Compatibility with React 18 and Vite 6:** Peer deps declare `react >=16.8.0` and `react-dom >=16.8.0`. React 18 is within range. The package has no Vite peer dependency — it is a runtime library, not a build plugin. Fully compatible.

**CSS import mechanism:** The package entry point (both ESM and CJS) begins with:
```
import 'figma-plugin-ds/dist/figma-plugin-ds.css'
```
This CSS file (~70KB) contains `@font-face` declarations that load Inter font weights from `https://rsms.me/inter/font-files/...` — external HTTP URLs.

**Singlefile constraint — already handled:** The project's `vite.config.ui.ts` already configures `postcss-url({ url: "inline" })`. This plugin processes all `url()` references in CSS (including `@font-face src:`) and converts them to base64 data URIs. No additional configuration is needed for the `apps/figma-plugin` build. The external font URLs are inlined at build time.

**Storybook — requires explicit postcss-url configuration:** Storybook's Vite builder runs a separate Vite instance. It does NOT inherit `vite.config.ui.ts`. Without postcss-url in the Storybook Vite config, Storybook will serve the CSS with live external font references. This works if online (rsms.me CDN), but creates an external dependency. The `packages/storybook/.storybook/main.ts` must include `postcssUrl({ url: "inline" })` in its `viteFinal` configuration (see Storybook section below).

**clsx dependency:** react-figma-ui depends on `clsx ^1.1.1`. Bun will install clsx 1.2.1 (latest in the 1.x range). This is an isolated transitive dependency — no conflict with project code using clsx 2.x, since they resolve independently.

**figma-plugin-ds JavaScript:** The SelectMenu and Disclosure components use `figma-plugin-ds` JavaScript for initialization (imperative DOM-based JS). This is imported as a side effect. It should work fine in the Figma iframe context, but will require care in Storybook stories (the `useEffect` cleanup pattern already handles init/destroy).

**Install location:** `packages/ui` — the package that provides UI components to the app.

```json
// packages/ui/package.json — add to dependencies
"react-figma-ui": "1.1.0"
```

---

### 2. Storybook (Component Documentation)

**Version:** `storybook@10.3.5` and `@storybook/react-vite@10.3.5`
**Confidence:** HIGH — verified via npm registry `latest` dist-tag

**Storybook 10 architecture change (critical):** Storybook 10 completely restructured the package split. Previously (v8 and earlier), you needed `@storybook/addon-essentials` plus multiple addon packages. Since Storybook 9, addon-essentials became an empty/deprecated stub and all essential functionality (backgrounds, controls, docs, viewport, actions, interactions) was bundled into the `storybook` core package itself. Storybook 10 completes this: `@storybook/addon-essentials` is not published for v10 and should not be installed.

**Exact packages needed for `packages/storybook`:**

| Package | Version | Purpose |
|---------|---------|---------|
| `storybook` | `^10.3.5` | Core framework (includes all essentials) |
| `@storybook/react-vite` | `^10.3.5` | React renderer + Vite builder |

That is the complete list. `@storybook/react` and `@storybook/builder-vite` are both transitive deps pulled in by `@storybook/react-vite` automatically.

**Do NOT install:**
- `@storybook/addon-essentials` — deprecated, not published for v10
- `@storybook/addon-interactions` — deprecated, not published for v10
- `@storybook/addon-links` — deprecated, not published for v10
- `@storybook/blocks` — deprecated, not published for v10
- `@storybook/test` — latest on npm is `8.6.15` with peer dependency `storybook ^8`; incompatible with Storybook 10

**Peer dependencies satisfied by existing project stack:**
- `vite: ^5.0.0 || ^6.0.0 || ...` — project has Vite ^6.0.0 ✓
- `react: ^16.8.0 || ... ^18.0.0 || ...` — project has React ^18.2.0 ✓
- `react-dom: ...` — present ✓
- `storybook: ^10.3.5` — installed as the core package ✓

**Vite compatibility:** `@storybook/react-vite@10.3.5` peer dep accepts `vite: ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0`. The project's Vite 6 is within range.

**Monorepo structure — dedicated `packages/storybook`:** Storybook lives as a separate package, not inside `packages/ui`. Stories are co-located with components in `packages/ui/src/**/*.stories.tsx` and referenced via the `stories` path in `.storybook/main.ts`. This is the Turborepo-recommended pattern — Storybook as a consumer of workspace packages.

```json
// packages/storybook/package.json
{
  "name": "@repo/storybook",
  "private": true,
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "storybook build --output-dir dist"
  },
  "dependencies": {
    "@repo/ui": "workspace:*"
  },
  "devDependencies": {
    "storybook": "^10.3.5",
    "@storybook/react-vite": "^10.3.5",
    "postcss-url": "^10.1.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "sass": "^1.99.0",
    "vite": "^6.0.0"
  }
}
```

**SCSS and CSS Modules in Storybook:** Since `@storybook/react-vite` uses Vite internally, SCSS and CSS Modules work natively — Vite has built-in support for both. Sass must be installed as a devDependency in `packages/storybook`. No webpack loaders, no extra Storybook addons, no `@storybook/preset-scss` needed.

**viteFinal for font inlining:** The `.storybook/main.ts` must use `viteFinal` to add postcss-url, matching what `vite.config.ui.ts` does for the plugin build:

```typescript
// packages/storybook/.storybook/main.ts
import { mergeConfig } from "vite";
import postcssUrl from "postcss-url";

export default {
  framework: "@storybook/react-vite",
  stories: [
    "../../../packages/ui/src/**/*.stories.@(ts|tsx)",
  ],
  viteFinal(config) {
    return mergeConfig(config, {
      css: {
        postcss: {
          plugins: [postcssUrl({ url: "inline" })],
        },
      },
    });
  },
};
```

**Turborepo task for Storybook:** Add `"storybook"` task to `turbo.json` (or reuse `"dev"` with a filter). Storybook dev is a persistent server — mark `cache: false, persistent: true`.

---

### 3. SCSS and CSS Modules — Keep or Remove?

**Decision: Keep SCSS/CSS Modules. No changes to existing infrastructure.**

**Why keep:**
- react-figma-ui uses global BEM class names from figma-plugin-ds (`.button`, `.checkbox`, etc.). It does NOT use CSS Modules internally. The two systems do not conflict.
- The 7-1 SCSS architecture in `packages/ui/src/styles/` handles application-level concerns: CSS custom properties, base resets, layout, and any custom components that supplement react-figma-ui.
- Storybook with `@storybook/react-vite` handles `.module.scss` imports natively through Vite — no extra setup required.

**What changes in `packages/ui`:**
- The demo `Button.tsx` component and `Button.module.scss` are replaced by re-exports of react-figma-ui components.
- `packages/ui/src/index.ts` exports from react-figma-ui (e.g., `export * from 'react-figma-ui'`) rather than the local Button.
- The SCSS infrastructure (`styles/`, `sass` devDep) is retained unchanged.

**What does NOT change:**
- `vite.config.ui.ts` — no modifications needed
- `vite.config.plugin.ts` — unaffected
- `sass` devDependency in `packages/ui`
- CSS Modules support (`.module.scss` pattern)

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Component library | react-figma-ui@1.1.0 | react-figma-plugin-ds | Different package (alexandrtovmach); fewer components; project requirement specifies react-figma-ui |
| Component library | react-figma-ui@1.1.0 | create-figma-plugin/ui | Different ecosystem; requires their build tooling and conventions |
| Storybook version | 10.3.5 (latest) | 8.6.18 (v8 tag) | v8 is in maintenance mode; v10 is the `latest` tag; v10 has simpler install (no addon-essentials) |
| Font handling | postcss-url inline (already configured) | @fontsource/inter | Adding @fontsource/inter would duplicate font loading; postcss-url already in project and handles it at build time |
| Storybook placement | packages/storybook | apps/storybook | Storybook is a dev tool, not a deployable app; `packages/` is semantically correct |
| Storybook placement | packages/storybook | stories inside packages/ui | Co-located stories with a separate storybook runner is the cleanest separation; storybook config belongs in its own package |

---

## Version Compatibility Matrix (Full Project)

| Package | Constraint | Status |
|---------|------------|--------|
| vite ^6.0.0 | vitest ^4.1.3 requires Vite >= 6.0.0 | Satisfied (upgraded in v1.0) |
| react-figma-ui@1.1.0 | requires react >=16.8.0 | Satisfied by React 18 |
| @storybook/react-vite@10.3.5 | requires vite ^5-8, react ^16-19 | Satisfied |
| storybook@10.3.5 | peer: prettier ^2 or ^3 (optional) | No prettier in project; optional peer only |
| postcss-url@10.1.3 | no relevant constraints | Already installed |
| sass@1.99.0 | Vite built-in SCSS support | Already installed |

---

## Installation Commands

```bash
# packages/ui — add react-figma-ui
bun add react-figma-ui@1.1.0 --cwd packages/ui

# Create packages/storybook (manual — create package.json, then install)
mkdir -p packages/storybook
# ... write package.json ...
bun install  # from repo root

# Run Storybook
bun --cwd packages/storybook run dev
# or via Turborepo:
turbo run dev --filter=@repo/storybook
```

---

## What NOT to Add (v1.1 Scope)

| Avoid | Why |
|-------|-----|
| @storybook/addon-essentials | Empty/deprecated in Storybook 10; functionality is in storybook core |
| @storybook/addon-interactions | Same — deprecated in v10 |
| @storybook/test | Peer requires storybook ^8; incompatible with v10 |
| @storybook/preset-scss | Not needed; Vite builder handles SCSS natively |
| storybook-addon-sass-postcss | Same — Vite builder handles SCSS |
| @fontsource/inter | postcss-url already handles font inlining |

---

## Known Limitations and Risk Flags

**Biome SCSS support** (LOW risk): Biome does not format/lint `.scss` files (planned for 2026 roadmap). The SCSS infrastructure stays un-linted by Biome. Not a blocker.

**Storybook 10 is newly released** (MEDIUM risk, verify): Storybook 10 was released late 2025 (confirmed by release page). Some community resources and examples still reference Storybook 8.x. Ensure any third-party Storybook addons used later target v10 — check `peerDependencies` before adding any addon.

**figma-plugin-ds SelectMenu/Disclosure in Storybook** (LOW risk): These two components use imperative JavaScript initialization via `useEffect`. In Storybook, the `init()`/`destroy()` pattern in useEffect should work correctly with Storybook's component lifecycle. No special handling expected, but verify during implementation.

**Bun `turbo prune` not supported** (LOW risk for this milestone): Docker/CI deployment is out of scope. No blocker here.

---

## Sources

- npm registry: react-figma-ui@1.1.0 — peer deps, dependencies, package structure (verified directly)
- npm registry: storybook dist-tags — `latest: 10.3.5` confirmed
- npm registry: @storybook/react-vite@10.3.5 — peer deps, transitive deps (verified directly)
- npm registry: figma-plugin-ds@1.0.1 — CSS file location, no peer deps
- Storybook 10 addon migration guide: https://storybook.js.org/docs/addons/addon-migration-guide
- Turborepo + Storybook guide: https://turborepo.dev/docs/guides/tools/storybook
- Storybook Vite builder CSS docs: https://storybook.js.org/docs/builders/vite
- Storybook 10.0 release: https://storybook.js.org/releases/10.0
- WebSearch: Storybook SCSS/CSS Modules with Vite builder (MEDIUM confidence — multiple community sources confirm native Vite SCSS support, no extra addons needed)

---

*Stack research for: Turborepo + Bun + Biome + Vitest monorepo migration (v1.0) + react-figma-ui + Storybook (v1.1)*
*Researched: 2026-04-09*
