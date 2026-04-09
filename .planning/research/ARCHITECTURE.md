# Architecture Research

**Domain:** Figma plugin monorepo — react-figma-ui + Storybook integration
**Researched:** 2026-04-09
**Confidence:** HIGH (npm registry verified, Turborepo docs confirmed) / MEDIUM (Storybook 10 monorepo patterns, community-sourced)

---

## Context: Existing Architecture (Do Not Re-research)

The monorepo is operational. Current state verified from the filesystem:

```
figma-plugin-template/
├── turbo.json                        ← tasks: build, dev, lint, test, test:watch
├── biome.json                        ← root Biome 2.4.10 config
├── package.json                      ← bun@1.3.11 packageManager, workspaces: ["apps/*","packages/*"]
├── apps/
│   └── figma-plugin/
│       ├── vite.config.ui.ts         ← ACTIVE: root=packages/ui/src, plugins=[react,richSvg,singlefile]
│       ├── vite.config.plugin.ts     ← ACTIVE: plugin sandbox build
│       └── dist/                     ← OUTPUT: manifest.json, plugin.js, index.html
└── packages/
    ├── common/                       ← @repo/common, JIT, networkSides.ts
    ├── ui/                           ← @repo/ui, JIT, React components + SCSS
    │   └── src/
    │       ├── components/Button.tsx ← ACTIVE: custom Button with CSS Modules
    │       ├── styles/               ← ACTIVE: 7-1 SCSS (main.scss, _home.scss, etc.)
    │       └── app.tsx               ← ACTIVE: demo with logos + Button usage
    └── typescript-config/
```

This research covers **only the new additions** for v1.1: react-figma-ui and Storybook.

---

## Q1: Should react-figma-ui live in packages/ui or be consumed as external dep?

**Answer: External dependency consumed directly by packages/ui. Do not vendor it.**

### Verified facts (npm registry, 2026-04-09)

- `react-figma-ui` version **1.1.0**, last published ~5 years ago (mature, not actively maintained)
- Dependencies: `clsx ^1.1.1`, `figma-plugin-ds ^1.0.1` (the original Tom Lowry CSS library)
- Peer deps: `react >=16.8.0`, `react-dom >=16.8.0` — compatible with current React 18
- No `styled-components` dependency (confirmed LOW confidence rumor was wrong)
- Ships a pre-bundled CJS file: `lib/react-figma-ui.cjs.js`
- `figma-plugin-ds` (transitive dep) exposes its stylesheet at `dist/figma-plugin-ds.css` via the `style` field in its package.json

### How styles work

react-figma-ui does NOT bundle CSS. It relies on `figma-plugin-ds` CSS classes. The CSS must be imported manually in the entry point:

```typescript
// In packages/ui/src/main.tsx or a central import point
import "figma-plugin-ds/dist/figma-plugin-ds.css";
```

Vite's CSS pipeline in `apps/figma-plugin` handles this import and inlines it via `vite-plugin-singlefile`. This is identical to how the existing `main.scss` is handled today.

### Why external dep, not vendored

- The package is a leaf dependency with no monorepo-internal consumers other than `packages/ui`
- Vendoring would mean maintaining a fork of dormant upstream code
- The JIT pattern only applies to **internal** packages (`@repo/common`, `@repo/ui`). Third-party packages are always external deps installed to `node_modules`
- Adding `react-figma-ui` to `packages/ui/package.json` dependencies is the correct Turborepo pattern

```json
// packages/ui/package.json — add to dependencies
{
  "dependencies": {
    "react-figma-ui": "^1.1.0"
  }
}
```

---

## Q2: Where does packages/storybook fit in the Turborepo workspace?

**Answer: `apps/storybook` — not `packages/storybook`.**

### Why apps/, not packages/

Turborepo distinguishes between:
- `packages/*` — Library packages consumed by other packages/apps
- `apps/*` — End applications (build artifacts, not consumed by other workspaces)

Storybook is an **application** — it consumes `@repo/ui` and produces a static site (`storybook-static/`). It has no consumers upstream. It belongs in `apps/`.

The official Turborepo Storybook guide confirms this: place the Storybook app in `apps/storybook`, write stories colocated in `packages/ui/src/` alongside components.

### Recommended structure

```
apps/
└── storybook/
    ├── package.json              ← name: "@repo/storybook", deps: @repo/ui, storybook packages
    ├── tsconfig.json             ← extends ../../packages/typescript-config/react.json
    └── .storybook/
        ├── main.ts               ← framework: @storybook/react-vite, stories glob into packages/ui
        └── preview.ts            ← global decorators, CSS imports (figma-plugin-ds)
```

Stories live colocated in `packages/ui/src/`:

```
packages/ui/src/components/
├── Button.tsx
├── Button.stories.tsx            ← NEW: Storybook story for Button
├── Button.module.scss            ← unchanged
```

The Storybook app's `.storybook/main.ts` uses a glob to discover them:

```typescript
stories: ["../../../packages/ui/src/**/*.stories.@(ts|tsx)"]
```

### Turborepo task addition

```json
// turbo.json — new entries
{
  "tasks": {
    "storybook": {
      "cache": false,
      "persistent": true
    },
    "build-storybook": {
      "dependsOn": ["^build"],
      "outputs": ["storybook-static/**"]
    }
  }
}
```

Cache exclusion: stories in `packages/ui/src/` would otherwise invalidate the `packages/ui` build cache when stories change. Add `.storybook/` and `*.stories.*` to the `build` task's `inputs` exclusion in turbo.json to prevent story edits from busting production build cache:

```json
// turbo.json — updated build task
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "inputs": ["src/**", "!src/**/*.stories.*", "!**/.storybook/**"]
    }
  }
}
```

---

## Q3: How does Storybook's Vite builder work with the existing Vite 6 config?

**Answer: Storybook 10 runs its own Vite instance, separate from the plugin's two Vite configs. It does NOT share or reuse `vite.config.ui.ts`. You configure Storybook's Vite via `viteFinal` in `.storybook/main.ts`.**

### Verified facts

- `@storybook/react-vite` current version: **10.3.5** (confirmed npm registry)
- Peer deps: `vite: ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0` — compatible with existing Vite 6
- `storybook` core: **10.3.5** (same version family)

### Why two Vite instances is not a problem

`apps/figma-plugin`'s Vite configs are **build-only** (no dev server, `root` set to `packages/ui/src`). Storybook runs its own Vite dev server pointing at `apps/storybook/` with a different root. They do not conflict.

### Configuring Storybook's Vite to resolve workspace packages

`@repo/ui` is a JIT package. Storybook's Vite needs to resolve it from `packages/ui/src`. Two options:

**Option A — viteFinal alias (explicit)**

```typescript
// apps/storybook/.storybook/main.ts
import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";

const config: StorybookConfig = {
  stories: ["../../../packages/ui/src/**/*.stories.@(ts|tsx|mdx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@repo/ui": path.resolve("../../packages/ui/src"),
      "@repo/common": path.resolve("../../packages/common/src"),
    };
    return config;
  },
};

export default config;
```

**Option B — workspace resolution (preferred)**

Because packages are installed as `workspace:*` with `exports: "./src/index.ts"`, Bun's symlinks already make `@repo/ui` resolve to `packages/ui/src/index.ts`. Storybook's Vite (run in the monorepo context with the same `node_modules`) picks this up automatically via Node module resolution. No alias needed.

**Recommendation: rely on workspace resolution (Option B).** If SCSS modules or path aliases internal to `packages/ui` fail, add `viteFinal` as a targeted fix. Do not pre-emptively add aliases.

### SCSS support in Storybook

Storybook's Vite builder does not include a `sass` preset. Add it as a dev dependency in `apps/storybook` and it will be picked up via `css.preprocessorOptions` in `viteFinal`:

```typescript
// apps/storybook/.storybook/main.ts
viteFinal: async (config) => {
  config.css = {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        // Same @ui alias resolution as apps/figma-plugin uses
        importers: [
          {
            findFileUrl(url: string) {
              if (!url.startsWith("@ui/")) return null;
              const uiSrcPath = path.resolve("../../packages/ui/src");
              const resolved = path.resolve(uiSrcPath, url.replace(/^@ui\//, ""));
              return new URL(`file://${resolved}`);
            },
          },
        ],
      },
    },
  };
  return config;
},
```

This is mandatory — `packages/ui/src/styles/pages/_home.scss` currently uses `@use "@ui/styles/abstracts/variables"`. The Sass importer in `apps/figma-plugin/vite.config.ui.ts` handles this for the plugin build. Storybook needs the same importer to prevent build failures.

---

## Q4: What happens to the current SCSS/CSS modules when react-figma-ui brings its own styles?

**Answer: They coexist without conflict. react-figma-ui uses global BEM-style CSS classes from figma-plugin-ds. Existing SCSS modules use scoped generated class names. No collision.**

### How react-figma-ui styles work

`figma-plugin-ds` distributes a single flat CSS file (`dist/figma-plugin-ds.css`) using predictable BEM-like class names: `.button`, `.button--primary`, `.input`, `.checkbox`, etc. These are **global** classes, not CSS Modules.

### Coexistence strategy

The existing Button component in `packages/ui/src/components/Button.tsx` uses CSS Modules (`Button.module.scss`) which generates scoped class names like `.Button_button__abc12`. react-figma-ui's Button uses the global `.button` class. These never collide.

However, there is a **naming conflict at the export level**: the project already exports a `Button` component from `packages/ui/src/components/Button.tsx`. react-figma-ui also exports a `Button`.

**Resolution options:**

1. **Replace** the custom `Button` with re-exports of react-figma-ui's components (recommended for v1.1 goal of "replace demo components")
2. **Namespace** by re-exporting as `FigmaButton` from a barrel
3. **Keep both** with explicit imports (consumers choose which to import)

**Recommendation: Replace.** The milestone goal is explicitly to replace `packages/ui` demo components with react-figma-ui. Remove `Button.tsx` and `Button.module.scss` and re-export from react-figma-ui instead.

### CSS import location

Import `figma-plugin-ds` CSS once, at the app entry point:

```typescript
// packages/ui/src/main.tsx (or app.tsx)
import "figma-plugin-ds/dist/figma-plugin-ds.css";
import "./styles/main.scss";  // existing SCSS continues to work alongside
```

Order matters: import `figma-plugin-ds` CSS before the project's own SCSS so project styles can override Figma DS defaults if needed.

### The `_home.scss` page styles are demo-only

`packages/ui/src/styles/pages/_home.scss` styles the current demo (logos, `.homepage`, `.card`). These will be replaced when `app.tsx` is updated to use react-figma-ui components. The 7-1 SCSS architecture itself is preserved — only `_home.scss` content becomes obsolete.

---

## Q5: How should app.tsx be updated to use new components?

**Answer: Replace the demo content wholesale. Keep the message-passing wiring (UI_CHANNEL). Replace custom Button imports with react-figma-ui imports. Remove logo assets and demo SCSS page styles.**

### What stays

- `useEffect` + `UI_CHANNEL.subscribe("ping", ...)` — keeps the messaging demo alive
- `UI_CHANNEL.emit(PLUGIN, "createRect", ...)` call — demonstrates plugin communication
- `UI_CHANNEL.request(PLUGIN, "ping", [])` call — demonstrates request/response pattern
- The import of `PLUGIN` from `@repo/common/networkSides`

### What changes

| Item | Action |
|------|--------|
| `import { Button } from "./components/Button"` | Replace with `import { Button } from "react-figma-ui"` |
| Logo `import` statements (figma.png, react.svg, vite.svg) | Remove entirely |
| `import "./styles/main.scss"` | Keep but add `figma-plugin-ds` CSS import before it |
| `<div className="homepage">` wrapper | Replace with react-figma-ui layout structure |
| Custom `<Button>` usage | Replace with react-figma-ui `<Button>` |
| Logo `<img>` and `<a>` elements | Remove |
| `_home.scss` demo styles | Remove or empty out; keep 7-1 scaffold |

### Minimal updated app.tsx shape

```tsx
import { PLUGIN } from "@repo/common/networkSides";
import { Button, Text } from "react-figma-ui";
import { useEffect, useState } from "react";
import { UI_CHANNEL } from "./app.network";
import "figma-plugin-ds/dist/figma-plugin-ds.css";
import "./styles/main.scss";

function App() {
  const [pingCount, setPingCount] = useState(0);

  useEffect(() => {
    UI_CHANNEL.subscribe("ping", () => {
      setPingCount((cnt) => cnt + 1);
    });
  }, []);

  return (
    <div style={{ padding: "8px" }}>
      <Text size="large" weight="bold">Figma Plugin Template</Text>
      <Button onClick={() => UI_CHANNEL.emit(PLUGIN, "createRect", [100, 100])}>
        Create square
      </Button>
      <Text>
        {PLUGIN.name} pinged us {pingCount} time(s).
      </Text>
    </div>
  );
}

export default App;
```

The exact component names and props depend on the 14 react-figma-ui components available. The list (from npm metadata and figma-plugin-ds): Button, Checkbox, Disclosure, Icon, Icon button, Input, Labels/sections, Onboarding tip, Radio button, Select menu, Switch, Textarea, Type (text styling).

---

## Component Boundary Map (Updated for v1.1)

```
figma-plugin-template/
│
├── apps/
│   ├── figma-plugin/             ← unchanged structure, consumes @repo/ui via Vite
│   │   └── vite.config.ui.ts     ← unchanged (already handles SCSS + CSS imports via postcss-url inlining)
│   │
│   └── storybook/                ← NEW
│       ├── package.json          ← @repo/storybook, deps: @storybook/react-vite, storybook, @repo/ui
│       ├── tsconfig.json         ← extends @repo/typescript-config/react.json
│       └── .storybook/
│           ├── main.ts           ← framework: @storybook/react-vite; stories glob → packages/ui/src
│           └── preview.ts        ← import figma-plugin-ds CSS globally for all stories
│
└── packages/
    └── ui/                       ← MODIFIED
        └── src/
            ├── app.tsx           ← MODIFIED: replace demo with react-figma-ui components
            ├── components/
            │   ├── Button.tsx    ← DELETED (replaced by react-figma-ui)
            │   ├── Button.module.scss ← DELETED
            │   └── Button.stories.tsx ← NEW: Storybook story
            ├── styles/
            │   ├── main.scss     ← unchanged import list (vendors → base → components → pages)
            │   └── pages/
            │       └── _home.scss ← EMPTIED (demo styles removed)
            └── index.ts          ← MODIFIED: remove Button re-export, no longer needed
```

---

## Data Flow (Updated for v1.1)

### Build flow — unchanged

`apps/storybook` is an independent app. It does not affect `apps/figma-plugin`'s build.

```
turbo run build
  ├── apps/figma-plugin: vite build (reads packages/ui/src, outputs dist/)
  └── apps/storybook: storybook build (reads packages/ui/src stories, outputs storybook-static/)
      — these are independent; neither depends on the other
```

### Dev flow — one new persistent task

```
turbo run dev           ← existing: runs figma-plugin watch builds
turbo run storybook     ← NEW: runs storybook dev server (persistent, cache: false)
```

These can be run independently. A developer working only on Storybook runs `turbo run storybook`. A developer testing in Figma runs `turbo run dev`.

### CSS inlining in the plugin output — unchanged

`vite-plugin-singlefile` + `postcss-url` inline all CSS into `index.html`. Adding a `figma-plugin-ds` CSS import to `main.tsx` does not break this. Vite processes all CSS imports before singlefile inlining. The constraint (no external file refs) is preserved.

---

## Integration Points Summary

| Point | Status | Notes |
|-------|--------|-------|
| `react-figma-ui` → `packages/ui` | NEW dependency | Add to `packages/ui/package.json` dependencies |
| `figma-plugin-ds` CSS | NEW import | Import in `packages/ui/src/main.tsx` before project SCSS |
| `packages/ui/src/components/Button.tsx` | DELETED | Replaced by react-figma-ui Button |
| `packages/ui/src/components/Button.stories.tsx` | NEW | Storybook story for Button |
| `packages/ui/src/app.tsx` | MODIFIED | Replace demo with react-figma-ui components |
| `packages/ui/src/styles/pages/_home.scss` | MODIFIED (emptied) | Demo styles removed |
| `apps/storybook/` | NEW app | Separate Vite instance, reads packages/ui stories |
| `apps/storybook/.storybook/main.ts` | NEW | Storybook config, stories glob, viteFinal for SCSS |
| `apps/storybook/.storybook/preview.ts` | NEW | figma-plugin-ds CSS import for all stories |
| `turbo.json` | MODIFIED | Add storybook and build-storybook tasks |
| `apps/figma-plugin/vite.config.ui.ts` | UNCHANGED | CSS import handling already works via postcss-url |

---

## Build Order for This Milestone

Dependencies between new work items (what must exist before what):

```
Step 1: Install react-figma-ui in packages/ui
  — Required before any component replacements

Step 2: Update packages/ui/src/app.tsx
  — Replaces custom Button with react-figma-ui imports
  — Adds figma-plugin-ds CSS import
  — Remove logo assets

Step 3: Delete packages/ui/src/components/Button.tsx + Button.module.scss
  — After app.tsx is updated (no orphaned imports)
  — Update packages/ui/src/index.ts barrel if Button was re-exported

Step 4: Create apps/storybook/ scaffold
  — package.json, tsconfig.json, .storybook/main.ts, .storybook/preview.ts
  — Run: cd apps/storybook && bun add -d storybook @storybook/react-vite

Step 5: Add Button.stories.tsx (and other component stories)
  — Can be done after Step 4 creates the Storybook app

Step 6: Update turbo.json
  — Add storybook and build-storybook tasks
  — Add inputs exclusion to build task (exclude *.stories.*)

Step 7: Verify both apps build
  — turbo run build → apps/figma-plugin produces valid dist/
  — turbo run build-storybook → apps/storybook produces storybook-static/
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Putting Storybook in packages/storybook

**What:** Creating `packages/storybook/` instead of `apps/storybook/`

**Why bad:** Packages are consumed by other workspace members. Nothing consumes Storybook as a library. Placing it in `packages/` implies it has upstream consumers, confuses the dependency graph, and violates Turborepo's mental model.

**Do this instead:** `apps/storybook/` — it is an application, not a library.

### Anti-Pattern 2: Sharing the figma-plugin Vite config with Storybook

**What:** Importing and reusing `apps/figma-plugin/vite.config.ui.ts` inside `apps/storybook/.storybook/main.ts`

**Why bad:** That config uses `viteSingleFile()` which inlines all assets. In a Storybook context this would break Storybook's dev server (it expects standard asset references, not inlined base64). It also hard-codes `root` and `outDir` to figma-plugin paths.

**Do this instead:** Write a separate `viteFinal` function in `.storybook/main.ts`. Copy only the SCSS `preprocessorOptions` (the custom importer for `@ui/` aliases) — that part is genuinely shared logic.

### Anti-Pattern 3: Adding CSS Modules to react-figma-ui components

**What:** Wrapping react-figma-ui imports with local CSS Module classes to match the existing `Button.module.scss` pattern.

**Why bad:** react-figma-ui components accept `className` props, but their internal styles depend on global figma-plugin-ds class names. Adding CSS Modules on top creates specificity conflicts and maintenance overhead.

**Do this instead:** Import `figma-plugin-ds/dist/figma-plugin-ds.css` globally. Use react-figma-ui components as-is. Only add custom CSS if you genuinely need to override specific Figma DS styles, and do so with plain CSS or SCSS, not CSS Modules.

### Anti-Pattern 4: Running Storybook in watch mode during Figma plugin development

**What:** Running both `turbo run dev` and `turbo run storybook` simultaneously as a default workflow.

**Why bad:** They are independent. `turbo run dev` watches `dist/` for Figma. `turbo run storybook` starts a browser dev server for documentation. Running both uses unnecessary memory and CPU. Most developers do one or the other.

**Do this instead:** Keep them as separate tasks. Document that developers run `turbo run dev` for Figma testing and `turbo run storybook` for component development.

### Anti-Pattern 5: Importing react-figma-ui before figma-plugin-ds CSS

**What:** Importing component logic from `react-figma-ui` without first importing `figma-plugin-ds/dist/figma-plugin-ds.css`.

**Why bad:** react-figma-ui components render with correct class names but no visual styles — they appear completely unstyled. This is a silent runtime issue with no build error.

**Do this instead:** Import CSS before component logic. In `apps/storybook/.storybook/preview.ts`, import the CSS at the top so it applies globally to all stories.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| react-figma-ui version and deps | HIGH | Confirmed from npm registry (1.1.0, clsx + figma-plugin-ds) |
| figma-plugin-ds CSS path | HIGH | Confirmed from npm registry (`style: dist/figma-plugin-ds.css`) |
| @storybook/react-vite version | HIGH | Confirmed from npm registry (10.3.5) |
| Vite peer dep compatibility | HIGH | @storybook/react-vite peer deps include Vite 5/6/7/8 |
| Storybook in apps/ vs packages/ | HIGH | Turborepo official docs confirm apps/ placement |
| viteFinal SCSS importer approach | MEDIUM | Pattern confirmed via Storybook docs + community, exact syntax needs testing |
| Story colocated pattern | MEDIUM | Confirmed by Turborepo Storybook guide; caching config needs testing |
| react-figma-ui component API | MEDIUM | Package is 5 years old; component list from npm page but exact props need verification at install time |

---

## Gaps to Address During Implementation

- **react-figma-ui component list and props**: The package README on GitHub has full documentation. Verify component names and prop signatures at install time — they may differ slightly from figma-plugin-ds JavaScript API.
- **Bun + Storybook CLI**: The `bunx storybook@latest init` command behavior in a Turborepo workspace has not been verified. Manual setup of `apps/storybook/` may be safer than running `init` (it may modify root `package.json` unexpectedly).
- **SCSS custom importer in viteFinal**: The `findFileUrl` importer for `@ui/` aliases is copied from `apps/figma-plugin/vite.config.ui.ts`. Verify it works in the Storybook Vite context — the working directory may differ.
- **CSS load order in Storybook preview**: Verify that importing `figma-plugin-ds/dist/figma-plugin-ds.css` in `.storybook/preview.ts` applies globally before component styles render.

---

## Sources

- npm registry: `react-figma-ui@1.1.0` — version, dependencies, peerDependencies (HIGH confidence, 2026-04-09)
- npm registry: `figma-plugin-ds@1.0.1` — `style: dist/figma-plugin-ds.css` field (HIGH confidence, 2026-04-09)
- npm registry: `@storybook/react-vite@10.3.5` — version and Vite peer dep range (HIGH confidence, 2026-04-09)
- npm registry: `storybook@10.3.5` — current stable version (HIGH confidence, 2026-04-09)
- [Turborepo: Storybook guide](https://turborepo.dev/docs/guides/tools/storybook) — apps/ placement, colocated stories, cache inputs exclusion (HIGH confidence)
- [Storybook: viteFinal API](https://storybook.js.org/docs/api/main-config/main-config-vite-final) — how to extend Vite config (MEDIUM confidence, community-verified)
- [Storybook: React-Vite framework](https://storybook.js.org/docs/get-started/frameworks/react-vite) — setup guidance (MEDIUM confidence)
- [GitHub: JB1905/react-figma-ui](https://github.com/JB1905/react-figma-ui) — package source and README (MEDIUM confidence, last verified indirectly via search)
- WebSearch: react-figma-ui component list and CSS import pattern (MEDIUM confidence, cross-referenced with npm metadata)
- Filesystem inspection: `apps/figma-plugin/vite.config.ui.ts`, `packages/ui/src/styles/`, `packages/ui/src/app.tsx` — current state verified directly (HIGH confidence)

---

*Architecture research for: react-figma-ui + Storybook integration into existing Turborepo monorepo*
*Researched: 2026-04-09*
