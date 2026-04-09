# Architecture Research

**Domain:** Figma plugin monorepo with Turborepo + Bun + dual Vite builds
**Researched:** 2026-04-09
**Confidence:** HIGH (Turborepo/Bun/Vitest docs verified) / MEDIUM (Figma+monorepo combo, no direct precedent found)

---

## Standard Architecture

### System Overview

```
figma-plugin-template/ (monorepo root)
├── turbo.json                    ← task pipeline
├── biome.json                    ← root lint/format config
├── package.json                  ← workspaces: ["apps/*", "packages/*"]
│
├── apps/
│   └── figma-plugin/             ← build app (no runtime, pure build coordination)
│       ├── package.json          ← name: "@repo/figma-plugin"
│       ├── figma.manifest.ts     ← manifest config (moved from root)
│       ├── vite.config.ui.ts     ← unchanged from flat project
│       ├── vite.config.plugin.ts ← unchanged from flat project
│       ├── tsconfig.json         ← extends @repo/typescript-config
│       └── dist/                 ← OUTPUT: manifest.json, plugin.js, index.html
│
└── packages/
    ├── common/                   ← shared types & network contract
    │   ├── package.json          ← name: "@repo/common", exports: ./src/index.ts (JIT)
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts          ← re-exports everything
    │       └── networkSides.ts   ← moved from src/common/networkSides.ts
    │
    ├── ui/                       ← React UI source (moved from src/ui/)
    │   ├── package.json          ← name: "@repo/ui", exports: ./src/index.ts (JIT)
    │   ├── tsconfig.json
    │   ├── vitest.config.ts      ← UI-specific test config (jsdom environment)
    │   └── src/
    │       ├── index.ts
    │       ├── main.tsx
    │       ├── app.tsx
    │       ├── app.network.tsx
    │       ├── components/
    │       ├── styles/
    │       ├── assets/
    │       └── utils/
    │
    └── typescript-config/        ← shared TS base configs
        ├── package.json          ← name: "@repo/typescript-config"
        ├── base.json
        ├── react.json
        └── node.json
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `apps/figma-plugin` | Owns Vite build configs, dist output, manifest.ts | Depends on `@repo/ui`, `@repo/common` |
| `packages/common` | Network side definitions, shared types | Used by `@repo/ui` and `apps/figma-plugin` (plugin side) |
| `packages/ui` | All React UI source code, components, styles | Depends on `@repo/common`; consumed by `apps/figma-plugin` via Vite |
| `packages/typescript-config` | Shared tsconfig base files | Extended by all other packages |

---

## How the Existing Dual-Vite Architecture Integrates

### The Core Insight: JIT Packages, Not Compiled

The two Vite configs in `apps/figma-plugin` continue to do all bundling. `packages/ui` and `packages/common` are **Just-in-Time (JIT) packages** — they export raw TypeScript source files. Vite in `apps/figma-plugin` compiles them as part of its build, exactly as it compiled `src/ui/` and `src/common/` before migration.

This means:
- No separate build step for `packages/ui` or `packages/common`
- No `tsc` compilation, no `dist/` in those packages
- `vite-plugin-singlefile` constraint is unaffected — Vite still inlines everything
- Path aliases (`@common`, `@ui`) become package imports (`@repo/common`, `@repo/ui`) OR remain as Vite `resolve.alias` pointing into `packages/*/src`

### Path Alias Strategy: Two Valid Options

**Option A — Keep Vite aliases (minimal change)**
The Vite configs in `apps/figma-plugin` continue to use `resolve.alias`. Update the paths to point into `packages/*/src`:

```typescript
// vite.config.ui.ts
resolve: {
  alias: {
    "@common": path.resolve("../../packages/common/src"),
    "@ui": path.resolve("../../packages/ui/src"),
  },
},
```

Pros: Minimal code change. Works immediately.
Cons: Aliases aren't visible to TypeScript outside the Vite build context. Vitest needs the same aliases.

**Option B — Workspace imports (recommended Turborepo pattern)**
Install packages as workspace dependencies and import them as package names. Each JIT package declares `exports` in its `package.json` pointing to source files.

```json
// packages/common/package.json
{
  "name": "@repo/common",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  }
}
```

```json
// apps/figma-plugin/package.json
{
  "dependencies": {
    "@repo/common": "workspace:*",
    "@repo/ui": "workspace:*"
  }
}
```

Source files then import `from "@repo/common/networkSides"` instead of `from "@common/networkSides"`. The Vite `resolve.alias` entries for `@common` and `@ui` are removed, replaced by Bun's workspace symlink resolution.

Pros: TypeScript resolution works natively, no tsconfig paths needed, Vitest works without extra config.
Cons: All `@common/*` → `@repo/common/*` and `@ui/*` → `@repo/ui/*` imports must be updated.

**Recommendation:** Use Option B. The import rename is mechanical and done once. The result is a cleaner architecture where TypeScript, Vite, and Vitest all resolve packages the same way.

---

## Recommended Project Structure (File-Level)

### packages/common

```
packages/common/
├── package.json          ← name: "@repo/common", no deps (only monorepo-networker)
├── tsconfig.json         ← extends ../../packages/typescript-config/base.json
└── src/
    ├── index.ts          ← export * from "./networkSides"
    └── networkSides.ts   ← unchanged from src/common/networkSides.ts
```

**package.json snippet:**
```json
{
  "name": "@repo/common",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  },
  "dependencies": {
    "monorepo-networker": "^2.1.0"
  }
}
```

### packages/ui

```
packages/ui/
├── package.json          ← name: "@repo/ui", depends on @repo/common
├── tsconfig.json         ← extends typescript-config/react.json
├── vitest.config.ts      ← environment: "jsdom"
└── src/
    ├── index.ts          ← barrel export for external consumption
    ├── main.tsx
    ├── app.tsx
    ├── app.network.tsx
    ├── components/
    ├── styles/
    ├── assets/
    └── utils/
```

**package.json snippet:**
```json
{
  "name": "@repo/ui",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  },
  "dependencies": {
    "@repo/common": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "monorepo-networker": "^2.1.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### apps/figma-plugin

```
apps/figma-plugin/
├── package.json
├── figma.manifest.ts     ← moved from root
├── vite.config.ui.ts     ← updated alias paths
├── vite.config.plugin.ts ← updated alias paths
├── tsconfig.json
├── tsconfig.node.json
└── src/
    └── plugin/           ← stays here, not extracted to a package
        ├── plugin.ts
        └── plugin.network.ts
```

The plugin side (`src/plugin/`) stays inside `apps/figma-plugin` rather than being extracted to `packages/`. Rationale: plugin code directly depends on Figma globals (`figma.*`, `__html__`) that cannot be tested or used outside the Figma runtime. There is no value in making it a separate package. It is app code, not library code.

---

## Architectural Patterns

### Pattern 1: JIT Internal Packages

**What:** Internal packages (`packages/common`, `packages/ui`) export TypeScript source files directly. No compilation step in those packages. The consuming application's Vite bundler compiles them.

**When to use:** When the consumer uses a bundler (Vite) that natively understands TypeScript. This is the recommended Turborepo approach for frontend-only packages.

**Trade-offs:**
- Pro: Zero build latency for internal packages. No stale dist/ to worry about.
- Pro: Source maps just work — Vite sees original `.ts` / `.tsx` files.
- Con: Turborepo cannot cache the "build" of these packages independently (nothing to cache). Caching only happens at the `apps/figma-plugin` level.
- Con: Cannot publish `packages/ui` to npm without adding a compile step.

**Example:**
```json
// packages/common/package.json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

### Pattern 2: Turborepo Task Graph for Dual Vite Builds

**What:** `apps/figma-plugin` has two build scripts (`build:ui` and `build:plugin`) that Turborepo treats as a single `build` task. Both Vite builds run in parallel.

**When to use:** When an app has multiple independent entry points that produce separate outputs (Figma's plugin.js + index.html requirement).

**Trade-offs:**
- Pro: Turborepo caches the full `build` output (the entire `dist/` folder).
- Pro: Parallel execution via `npm-run-all` or Bun's built-in `bun run --parallel` is preserved.
- Con: Turborepo sees one task (`build`) for the app, not two — if only one of the two Vite outputs changes, the whole build cache is invalidated.

**Example turbo.json:**
```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

### Pattern 3: Biome Root + Nested Config

**What:** A single `biome.json` at monorepo root handles all packages. Nested `biome.json` files in individual packages extend root with `"extends": ["//"]` (Biome v2 syntax).

**When to use:** Monorepos where most Biome rules are uniform but one or two packages need overrides (e.g., `apps/figma-plugin` needs to ignore `figma.*` globals).

**Trade-offs:**
- Pro: Single source of truth for formatting rules.
- Con: VS Code Biome extension uses only the root config (known limitation). Format-on-save always uses root rules.
- Con: Ignore patterns for `dist/` must be declared at root level.

**Example:**
```json
// biome.json (root)
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "ignore": ["**/dist/**", "**/node_modules/**", "**/*.lock"]
  },
  "formatter": { "indentStyle": "space", "indentWidth": 2 },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  }
}
```

---

## Data Flow

### Build Flow (CI / Production)

```
bun install (root)
    ↓
turbo run build
    ↓
[no package builds — JIT packages have no build script]
    ↓
apps/figma-plugin: run-p build:ui build:plugin
    ├── vite build -c vite.config.ui.ts
    │       reads packages/ui/src/* (via workspace resolution)
    │       reads packages/common/src/* (via workspace resolution)
    │       outputs dist/index.html  ← inlined by vite-plugin-singlefile
    │
    └── vite build -c vite.config.plugin.ts
            reads apps/figma-plugin/src/plugin/*
            reads packages/common/src/* (via workspace resolution)
            outputs dist/plugin.js   ← inlined by vite-plugin-singlefile
            outputs dist/manifest.json ← via vite-plugin-generate-file
```

### Dev Flow (Watch Mode)

```
turbo run dev --filter=figma-plugin
    ↓
apps/figma-plugin: run-p watch:ui watch:plugin
    ├── vite build --watch -c vite.config.ui.ts   (persistent, cache: false)
    └── vite build --watch -c vite.config.plugin.ts (persistent, cache: false)
```

Turborepo marks `dev` as `persistent: true, cache: false`. Both watch processes run until killed. There is no Vite dev server — Figma loads from `dist/` directly, so watch mode rebuilds to disk.

### Test Flow

```
turbo run test
    ↓
packages/ui: vitest run       ← tests React components with jsdom
packages/common: vitest run   ← tests network type contracts (node environment)
[apps/figma-plugin: no tests] ← plugin sandbox code is untestable outside Figma
```

### Plugin ↔ UI Message Flow (Runtime, unchanged)

```
Figma Sandbox (plugin.js)          |   UI iframe (index.html)
                                   |
PLUGIN_CHANNEL                     |   UI_CHANNEL
  .emitsTo(UI, figma.ui.postMessage) →  window.addEventListener("message")
  .receivesFrom(UI, figma.ui.on)  ←   parent.postMessage({ pluginMessage })
                                   |
Both sides share type definitions from @repo/common/networkSides
```

---

## Integration Points

### New Components vs Modified Components

| Component | Status | Change Description |
|-----------|--------|--------------------|
| `packages/common/` | **NEW** | Extracted from `src/common/`. Same code, new location and package.json. |
| `packages/ui/` | **NEW** | Extracted from `src/ui/`. Same code, new location and package.json. |
| `packages/typescript-config/` | **NEW** | Shared tsconfig base — replaces root tsconfig.json. |
| `apps/figma-plugin/vite.config.ui.ts` | **MODIFIED** | Update `resolve.alias` to point into `packages/*` or drop in favour of workspace resolution. |
| `apps/figma-plugin/vite.config.plugin.ts` | **MODIFIED** | Same alias update. Import of `figma.manifest.ts` path unchanged (co-located). |
| `apps/figma-plugin/figma.manifest.ts` | **MOVED** | From root → `apps/figma-plugin/figma.manifest.ts`. |
| `apps/figma-plugin/src/plugin/` | **MOVED** | From `src/plugin/` → `apps/figma-plugin/src/plugin/`. No code changes. |
| Root `package.json` | **REPLACED** | New root with `workspaces: ["apps/*", "packages/*"]`, no dependencies. |
| Root `tsconfig.json` | **REMOVED** | Each package gets its own, extending `@repo/typescript-config`. |
| `turbo.json` | **NEW** | Task pipeline config. |
| `biome.json` | **NEW** | Replaces absent linter/formatter. |
| `bun.lockb` / `bun.lock` | **NEW** | Replaces `package-lock.json` and `pnpm-lock.yaml`. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `packages/common` → `packages/ui` | TypeScript import via workspace resolution | `@repo/common` must be in `packages/ui/package.json` dependencies |
| `packages/common` → `apps/figma-plugin` (plugin side) | TypeScript import via workspace resolution | `@repo/common` must be in `apps/figma-plugin/package.json` dependencies |
| `packages/ui` → `apps/figma-plugin` (ui build) | Vite resolves source files via workspace symlink | `@repo/ui` in dependencies; Vite sees TypeScript source directly |
| `apps/figma-plugin` → Figma runtime | `dist/manifest.json`, `dist/plugin.js`, `dist/index.html` | The three-file output is the Figma contract. Must not change. |
| Plugin sandbox ↔ UI iframe | `postMessage` / `figma.ui.on("message")` | Typed by `monorepo-networker` + `@repo/common` side definitions |

### Vitest Integration Points

| Package | Test Environment | What Gets Tested |
|---------|-----------------|------------------|
| `packages/common` | `node` | Type-level contracts, networkSides shape, pure logic |
| `packages/ui` | `jsdom` + `@testing-library/react` | React components, hooks, UI_CHANNEL handlers |
| `apps/figma-plugin` | N/A | Plugin sandbox code (`figma.*` globals) cannot be tested without Figma runtime |

Vitest configs live inside each package. The root `turbo.json` task `"test"` picks them up via `dependsOn: ["^build"]` — though since packages are JIT there is no build prerequisite, so the dependency graph is flat.

---

## Anti-Patterns

### Anti-Pattern 1: Compiling Internal Packages

**What people do:** Add a `build` script to `packages/ui` and `packages/common` that runs `tsc` or Vite, producing a `dist/` in each package.

**Why it's wrong:** Adds a required build step before `apps/figma-plugin` can build. Now Turborepo must sequence `packages/ui#build → apps/figma-plugin#build`. Breaks watch mode (compiled packages don't auto-recompile on edit without their own watch). Adds `dist/` directories that Vite's source map chain has to traverse. Unnecessary for a single-app monorepo.

**Do this instead:** Use JIT packages. Let `apps/figma-plugin`'s Vite handle all compilation. The only `dist/` that should exist is in `apps/figma-plugin/`.

### Anti-Pattern 2: Keeping Path Aliases in tsconfig `paths`

**What people do:** Keep `"paths": { "@common/*": [...], "@ui/*": [...] }` in a root tsconfig and extend it from all packages.

**Why it's wrong:** TypeScript `paths` are a compiler-only hint. They do not affect Vite's module resolution unless you also configure `resolve.alias`. They do not affect Vitest unless you also add a Vite plugin (`vite-tsconfig-paths`). You end up maintaining the same alias in three places: tsconfig, vite.config, and vitest.config.

**Do this instead:** Use workspace package resolution (`@repo/common`, `@repo/ui`). One definition in `package.json` exports, resolved consistently by Bun, Vite, and Vitest.

### Anti-Pattern 3: Putting Plugin Sandbox Code in a Shared Package

**What people do:** Create `packages/plugin/` for `plugin.ts` and `plugin.network.ts` to match the `packages/ui/` symmetry.

**Why it's wrong:** Plugin code references `figma`, `__html__`, and `MessageEventHandler` — types from `@figma/plugin-typings` that are global in the Figma sandbox but undefined everywhere else. This code cannot be imported by any other package, cannot be tested with Vitest, and has no consumers outside `apps/figma-plugin`. It is app code by definition.

**Do this instead:** Keep plugin sandbox code in `apps/figma-plugin/src/plugin/`. Only extract to a package if there is a genuine second consumer.

### Anti-Pattern 4: Running Vite Dev Server for the UI Package

**What people do:** Add a `dev` script to `packages/ui` that starts `vite serve`, treating the UI as a standalone app during development.

**Why it's wrong:** Figma UI code uses `parent.postMessage` to communicate with the plugin sandbox. Without `plugin.ts` running in the Figma sandbox, the UI is a broken React app. `vite-plugin-singlefile` also does not work in dev server mode (it is a build-only plugin).

**Do this instead:** Develop against Figma directly. Use `turbo run dev --filter=figma-plugin` to run both watch builds. Load the plugin in Figma desktop pointing at `dist/`.

---

## Build Order Considerations for Migration

The migration must respect this dependency ordering to avoid breakage at each step:

```
Step 1: Set up monorepo scaffolding (root package.json, turbo.json, bun install)
    — No code moves yet. Verify Bun workspaces resolve correctly.

Step 2: Create packages/typescript-config
    — Unblocks all other packages' tsconfig setup.

Step 3: Create packages/common (extract src/common/)
    — Required by packages/ui and apps/figma-plugin plugin side.

Step 4: Create packages/ui (extract src/ui/)
    — Depends on @repo/common. Required by apps/figma-plugin UI build.

Step 5: Migrate apps/figma-plugin
    — Update vite.config.* aliases. Update figma.manifest.ts location.
    — Move src/plugin/ into apps/figma-plugin/src/plugin/.
    — Verify both Vite builds produce working dist/.

Step 6: Add Biome (root biome.json)
    — No code changes. Verify format + lint pass on migrated code.

Step 7: Add Vitest to packages/ui and packages/common
    — Write initial tests. Verify turbo run test works.

Step 8: Add VS Code workspace config (.vscode/ directory)
    — extensions.json, settings.json, launch.json, tasks.json.
```

---

## Scaling Considerations

This is a template project — scaling is not a user-count concern. Relevant scaling here means "as the plugin grows in feature count."

| Growth Scenario | Architecture Adjustment |
|----------------|------------------------|
| More shared utilities | Add exports to `packages/common/src/index.ts`. No structural change. |
| Multiple Figma plugins sharing UI | Promote `packages/ui` to a component library. Add a `build` step with `tsc`. Add storybook. |
| Plugin-agnostic networking logic | Extract a `packages/networking` package from `packages/common`. |
| Second app (e.g., web dashboard) | Add `apps/dashboard/`. Consumes `@repo/ui` and `@repo/common` directly. |

---

## Sources

- [Turborepo: Structuring a Repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) — HIGH confidence
- [Turborepo: Internal Packages (JIT vs Compiled)](https://turborepo.dev/docs/core-concepts/internal-packages) — HIGH confidence
- [Turborepo: TypeScript configuration](https://turborepo.dev/docs/guides/tools/typescript) — HIGH confidence
- [Turborepo: Configuring Tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) — HIGH confidence
- [Turborepo: Vitest integration](https://turborepo.dev/docs/guides/tools/vitest) — HIGH confidence
- [Turborepo: Vite guide](https://turborepo.dev/docs/guides/frameworks/vite) — MEDIUM confidence (thin docs, relies on defaults)
- [Bun Workspaces](https://bun.com/docs/guides/install/workspaces) — HIGH confidence
- [Biome: Monorepo nested config (Gist)](https://gist.github.com/shirakaba/83f456566231580d525169236a350e73) — MEDIUM confidence (community source, but matches official Biome v2 docs)
- [TypeScript Monorepo Best Practice 2026](https://hsb.horse/en/blog/typescript-monorepo-best-practice-2026/) — MEDIUM confidence (blog, cross-references official docs)

---

*Architecture research for: Turborepo + Bun monorepo migration of Figma plugin template*
*Researched: 2026-04-09*
