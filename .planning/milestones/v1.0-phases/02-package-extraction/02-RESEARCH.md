# Phase 2: Package Extraction - Research

**Researched:** 2026-04-09
**Domain:** Turborepo JIT internal packages — Bun workspace:* dependencies, TypeScript exports, monorepo file migration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — this is a pure infrastructure phase. All implementation choices are at Claude's discretion.

### Claude's Discretion
All implementation choices. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None for this phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MONO-01 | Project uses `apps/figma-plugin` + `packages/ui` + `packages/common` directory layout | File migration strategy and new directory structure documented in Architecture Patterns section |
| MONO-03 | Internal packages use `workspace:*` protocol for dependencies | Bun workspace:* pattern documented in Standard Stack; verified in Bun docs |
| MONO-04 | Each package has `package.json` with explicit `exports` field | JIT package exports pattern documented with exact JSON shape in Code Examples |
| MONO-05 | Internal packages use `@repo/` namespace (`@repo/ui`, `@repo/common`) | Naming convention confirmed from project architecture research; package name patterns in Code Examples |
</phase_requirements>

---

## Summary

Phase 2 migrates the flat `src/` directory structure into three discrete workspace packages: `packages/common` (shared network types), `packages/ui` (React UI source), and `apps/figma-plugin` (build orchestration + plugin sandbox code). This is a file-move and package.json authoring phase — no code logic changes, no new libraries.

The defining architectural decision is **JIT (Just-in-Time) internal packages**: `packages/common` and `packages/ui` export their raw TypeScript source via the `exports` field in `package.json`. No compilation step exists in those packages. The consuming `apps/figma-plugin` Vite builds compile everything. This eliminates build ordering problems and keeps Turborepo's task graph flat — only `apps/figma-plugin` has a `build` task.

The one non-trivial change is import path migration: all `@common/*` imports become `@repo/common` (or sub-path imports like `@repo/common/networkSides`), and `@ui/*` imports become `@repo/ui`. This is mechanical but must be done consistently across ~6 source files. The old tsconfig `paths` aliases and Vite `resolve.alias` entries are removed once workspace resolution takes over.

**Primary recommendation:** Create the three package directories with correct `package.json` files, run `bun install` to create workspace symlinks, then move source files and update import paths. Verify with `bun run build` in `apps/figma-plugin` at the end.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on This Phase |
|-----------|----------------------|
| Two Vite configs (`vite.config.ui.ts`, `vite.config.plugin.ts`) must stay | Both configs move to `apps/figma-plugin/` but are otherwise unchanged in this phase |
| `vite-plugin-singlefile` inlines all assets — no external file references | JIT package pattern is the correct approach; compiled dist packages would break inlining |
| Path aliases `@common`, `@ui`, `@plugin` used throughout | Must be replaced by workspace package imports after extraction |
| `src/plugin/` runs in Figma sandbox — no DOM access | Plugin code stays in `apps/figma-plugin/src/plugin/`; never extracted to a shared package |
| No test framework configured | No test files to move; no test configuration needed in this phase |

---

## Standard Stack

### Core (No New Libraries)

This phase adds no new npm dependencies. It restructures existing code into Bun workspace packages. The only package management operation is `bun install` after writing new `package.json` files — Bun creates workspace symlinks automatically.

| Package | Version | Purpose | Already In Project |
|---------|---------|---------|-------------------|
| bun workspaces | built-in (1.3.11) | `workspace:*` dependency resolution | Yes — root package.json already declares workspaces |
| monorepo-networker | ^2.1.0 | Typed plugin/UI message passing | Yes — used in src/common/ and both network files |
| react + react-dom | ^18.2.0 | UI framework | Yes — currently in the flat src/ui/ |
| @figma/plugin-typings | ^1.83.0 | Figma API type globals | Yes — needed in apps/figma-plugin for plugin.ts |

**Version verification:** No version changes in this phase. All packages are being moved, not upgraded. [VERIFIED: bun.lock shows only turbo in current workspace; all other deps are not yet in any package.json — Phase 1 deliberately removed them from root. They must be re-declared in the correct package.json files in this phase.]

### Packages Required Per Package

**packages/common/package.json** must declare:
```
dependencies: monorepo-networker
```

**packages/ui/package.json** must declare:
```
dependencies: react, react-dom, monorepo-networker, @repo/common (workspace:*)
devDependencies: typescript, @types/react, @types/react-dom
```

**apps/figma-plugin/package.json** must declare:
```
dependencies: @repo/common (workspace:*), @repo/ui (workspace:*)
devDependencies: vite, @vitejs/plugin-react, vite-plugin-singlefile, vite-plugin-react-rich-svg,
                 vite-plugin-generate-file, postcss-url, sass, typescript,
                 @figma/plugin-typings, @types/node
scripts: build, build:ui, build:plugin, dev, dev:ui-only, types
```

[VERIFIED via bun.lock: these packages were previously in the flat project. bun.lock currently only contains turbo because Phase 1 removed all deps from root. They need to move to app/package packages.]

---

## Architecture Patterns

### Recommended Project Structure

```
figma-plugin-template/
├── package.json              (root — workspaces: ["apps/*", "packages/*"])
├── turbo.json                (already exists — unchanged)
├── bun.lock                  (already exists — updated by bun install)
│
├── apps/
│   └── figma-plugin/
│       ├── package.json      (name: "@repo/figma-plugin", deps: @repo/common, @repo/ui)
│       ├── figma.manifest.ts (moved from root)
│       ├── vite.config.ui.ts (moved from root, resolve.alias paths updated)
│       ├── vite.config.plugin.ts (moved from root, resolve.alias paths updated)
│       ├── tsconfig.json     (covers src/plugin/ and root *.ts files)
│       ├── tsconfig.node.json (covers vite.config.*.ts and figma.manifest.ts)
│       └── src/
│           └── plugin/
│               ├── plugin.ts         (moved from src/plugin/)
│               └── plugin.network.ts (moved from src/plugin/)
│
└── packages/
    ├── common/
    │   ├── package.json      (name: "@repo/common", exports: ./src/index.ts)
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts      (new barrel: export * from "./networkSides")
    │       └── networkSides.ts (moved from src/common/networkSides.ts)
    │
    └── ui/
        ├── package.json      (name: "@repo/ui", deps: @repo/common)
        ├── tsconfig.json
        └── src/
            ├── index.ts      (new barrel export)
            ├── main.tsx      (moved from src/ui/main.tsx)
            ├── app.tsx       (moved from src/ui/app.tsx)
            ├── app.network.tsx (moved from src/ui/app.network.tsx)
            ├── index.html    (moved from src/ui/index.html)
            ├── vite-env.d.ts (moved from src/ui/vite-env.d.ts)
            ├── components/   (moved from src/ui/components/)
            ├── styles/       (moved from src/ui/styles/)
            ├── assets/       (moved from src/ui/assets/)
            └── utils/        (moved from src/ui/utils/)
```

After Phase 2, the root `src/` directory and `tsconfig.json` / `tsconfig.node.json` at root are removed (replaced by per-package equivalents). The root `vite.config.ui.ts`, `vite.config.plugin.ts`, and `figma.manifest.ts` files are moved to `apps/figma-plugin/`.

### Pattern 1: JIT Internal Package exports

**What:** `packages/common` and `packages/ui` declare `exports` pointing at TypeScript source files. No `tsc` or Vite in those packages — zero build step.

**When to use:** Any internal package consumed by a Vite/esbuild bundler in the same monorepo. The bundler does all compilation.

**Example:**
```json
// packages/common/package.json
{
  "name": "@repo/common",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  },
  "dependencies": {
    "monorepo-networker": "^2.1.0"
  }
}
```

```json
// packages/ui/package.json
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
    "monorepo-networker": "^2.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```
[CITED: turborepo.dev/docs/core-concepts/internal-packages — JIT pattern]

### Pattern 2: workspace:* Dependency Protocol

**What:** In `apps/figma-plugin/package.json` and `packages/ui/package.json`, internal packages are declared as `"@repo/common": "workspace:*"`. Bun resolves this to the local package via a symlink in `node_modules/@repo/common`.

**When to use:** Any time one workspace package depends on another within the same monorepo.

**Example:**
```json
// apps/figma-plugin/package.json
{
  "name": "@repo/figma-plugin",
  "private": true,
  "dependencies": {
    "@repo/common": "workspace:*",
    "@repo/ui": "workspace:*"
  }
}
```

After `bun install`, Bun creates:
```
node_modules/@repo/common  →  ../../packages/common  (symlink)
node_modules/@repo/ui      →  ../../packages/ui      (symlink)
```

[CITED: bun.com/docs/pm/workspaces]

### Pattern 3: Import Path Migration

All source files currently use path aliases (`@common/*`, `@ui/*`). After extraction, these must become workspace package imports.

**Complete import map for Phase 2:**

| Old import | New import | File affected |
|-----------|-----------|--------------|
| `@common/networkSides` | `@repo/common/networkSides` | app.network.tsx, plugin.network.ts, main.tsx, app.tsx |
| `@ui/app.network` | `./app.network` (relative, same package) | main.tsx, app.tsx |
| `@ui/components/Button` | `./components/Button` (relative) | app.tsx |
| `@ui/assets/figma.png` | `./assets/figma.png` (relative) | app.tsx |
| `@ui/assets/react.svg?component` | `./assets/react.svg?component` (relative) | app.tsx |
| `@ui/assets/vite.svg?url` | `./assets/vite.svg?url` (relative) | app.tsx |
| `@ui/styles/main.scss` | `./styles/main.scss` (relative) | main.tsx or app.tsx |
| `@ui/utils/classes.util` | `./utils/classes.util` (relative) | Button.tsx |

Key insight: within `packages/ui/src/`, all `@ui/*` imports become relative imports because the files live in the same package. The only cross-package imports are `@common/*` → `@repo/common/*`.

### Pattern 4: Vite resolve.alias Update

The Vite configs currently resolve `@common` and `@ui` via `resolve.alias`. After workspace extraction, these aliases must be removed — Bun's workspace symlinks handle resolution instead. Vite follows Node.js module resolution, which follows symlinks.

**Before (vite.config.ui.ts):**
```typescript
resolve: {
  alias: {
    "@common": path.resolve("src/common"),
    "@ui": path.resolve("src/ui"),
  },
},
```

**After (apps/figma-plugin/vite.config.ui.ts):**
```typescript
// No resolve.alias needed for @repo/* packages
// Vite follows Bun's workspace symlinks automatically
// The root option still needs updating:
root: path.resolve("../../packages/ui/src"),
```

**Before (vite.config.plugin.ts):**
```typescript
resolve: {
  alias: {
    "@common": path.resolve("src/common"),
    "@plugin": path.resolve("src/plugin"),
  },
},
```

**After (apps/figma-plugin/vite.config.plugin.ts):**
```typescript
// @repo/common resolved via workspace symlink
// @plugin alias can be kept for src/plugin/ within apps/figma-plugin
resolve: {
  alias: {
    "@plugin": path.resolve("src/plugin"),
  },
},
```

[CITED: .planning/research/ARCHITECTURE.md — Option B workspace imports]

### Pattern 5: tsconfig.json Per Package

Root `tsconfig.json` is removed. Each package needs its own `tsconfig.json`. For this phase (before Phase 3 adds `@repo/typescript-config`), each tsconfig is self-contained.

**packages/common/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

**packages/ui/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.d.ts"]
}
```

**apps/figma-plugin/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "typeRoots": ["../../node_modules/@figma"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

Note on `moduleResolution`: The original tsconfig uses `"Node"`. Switching to `"Bundler"` is the correct setting for Vite projects — it supports package.json `exports` field resolution which is required for the JIT packages pattern. [CITED: .planning/research/ARCHITECTURE.md — anti-pattern 2 on tsconfig paths]

**Important:** The Vite config files (`vite.config.*.ts`, `figma.manifest.ts`) are Node.js scripts, not bundled by Vite. They need their own `tsconfig.node.json` targeting Node resolution:

**apps/figma-plugin/tsconfig.node.json:**
```json
{
  "compilerOptions": {
    "noEmit": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "esModuleInterop": true
  },
  "include": ["*.ts", "vite.config.*.ts"]
}
```

### Anti-Patterns to Avoid

- **Compiling internal packages:** Do not add a `build` script with `tsc` or Vite in `packages/common` or `packages/ui`. JIT — the consuming Vite build compiles everything. Only `apps/figma-plugin` has a `build` task.
- **Keeping path aliases in tsconfig paths:** Remove `paths` entries from tsconfigs. They are redundant once workspace resolution works and create maintenance burden across three systems (tsconfig, vite.config, vitest.config).
- **Extracting plugin sandbox code:** `src/plugin/plugin.ts` and `plugin.network.ts` must stay inside `apps/figma-plugin`. They reference `figma.*` globals that are only valid in the Figma runtime sandbox.
- **Adding a Vite dev server to packages/ui:** The UI package has no standalone dev server. Development happens via watch builds in `apps/figma-plugin`. The `dev:ui-only` script (browser preview) runs from `apps/figma-plugin` with the UI package as source.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-package TypeScript resolution | Custom tsconfig paths or webpack aliases | Bun `workspace:*` + package.json `exports` | workspace:* creates real symlinks; TypeScript, Vite, and Vitest all follow them without additional config |
| Package namespace | Custom prefix like `figma-plugin-*` | `@repo/` scoped packages | `@repo/` is the Turborepo convention; signals internal-only; never accidentally published to npm |
| Per-package install scripts | Custom shell scripts | `bun install` at workspace root | Bun installs all workspaces in a single pass; hoists shared deps to root node_modules |

---

## Runtime State Inventory

> Step 2.5 check: Does Phase 2 involve a rename, refactor, or migration?

**Yes** — source files move from `src/` to `packages/*/src/` and `apps/figma-plugin/src/`. This is a structural migration, not a string rename. Runtime state categories:

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — this is a static template project, no databases or stores | None |
| Live service config | None — no external services configured | None |
| OS-registered state | None — no task scheduler, launchd, or systemd entries | None |
| Secrets/env vars | None — no `.env` files in this project | None |
| Build artifacts | `dist/` directory at root — stale after files move to `apps/figma-plugin/` | Delete or ignore; `apps/figma-plugin/` will have its own `dist/` after Phase 3 |

**Root-level stubs that become dead after Phase 2:**
- `src/` directory — moved to packages; should be deleted
- Root `tsconfig.json` — replaced by per-package tsconfigs; should be deleted
- Root `tsconfig.node.json` — replaced by `apps/figma-plugin/tsconfig.node.json`; should be deleted
- Root `vite.config.ui.ts` — moved to `apps/figma-plugin/`; should be deleted
- Root `vite.config.plugin.ts` — moved to `apps/figma-plugin/`; should be deleted
- Root `figma.manifest.ts` — moved to `apps/figma-plugin/`; should be deleted

---

## Common Pitfalls

### Pitfall 1: Vite `root` Path After Moving Config Files

**What goes wrong:** `vite.config.ui.ts` uses `path.resolve("src/ui")` as the Vite root. After moving the config to `apps/figma-plugin/`, this relative path resolves to `apps/figma-plugin/src/ui` — which doesn't exist (UI is now in `packages/ui/src`).

**Why it happens:** `path.resolve()` without a base is relative to `process.cwd()`, not the config file location. When Vite is run from `apps/figma-plugin/`, CWD changes.

**How to avoid:** Update all `path.resolve()` calls in Vite configs to use `__dirname` (or `import.meta.dirname` in ESM) as the base:
```typescript
import { fileURLToPath } from "node:url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Then:
root: path.resolve(__dirname, "../../packages/ui/src"),
build: { outDir: path.resolve(__dirname, "dist") }
```
Or use paths relative to `apps/figma-plugin/` as the CWD: `path.resolve("../../packages/ui/src")`.

**Warning signs:** Vite error "Could not resolve entry module" or "root does not exist".

### Pitfall 2: bun install Not Re-Run After Adding workspace:* Dependencies

**What goes wrong:** `package.json` files are written with `"@repo/common": "workspace:*"` but `bun install` is not run. TypeScript and Vite cannot resolve `@repo/common` because the symlink in `node_modules/@repo/` does not exist yet.

**Why it happens:** The workspace symlinks are created by `bun install`, not by writing `package.json`.

**How to avoid:** Always run `bun install` from the repo root after adding or modifying `package.json` files. Bun installs all workspaces in one pass.

**Warning signs:** `Cannot find module '@repo/common'` in TypeScript or Vite.

### Pitfall 3: Circular Exports Pattern in JIT packages

**What goes wrong:** `packages/ui/package.json` exports `./*` as `./src/*`. An import of `@repo/ui/app.network` resolves to `packages/ui/src/app.network` — without a file extension. TypeScript may fail to resolve this without the `.tsx` extension.

**Why it happens:** The `./*` export pattern is a glob, but Node module resolution and TypeScript need the bundler to resolve extensions. With `moduleResolution: "Bundler"`, TypeScript handles this correctly (it tries `.ts`, `.tsx`, etc.). With `"Node"`, it may not.

**How to avoid:** Use `moduleResolution: "Bundler"` in all per-package tsconfigs (not `"Node"`). The existing root tsconfig uses `"Node"` — this is the correct time to switch.

**Warning signs:** TypeScript error `Module '@repo/ui/app.network' has no exported member` or `Cannot find module`.

### Pitfall 4: @figma/plugin-typings typeRoots Path After Move

**What goes wrong:** Root `tsconfig.json` has `"typeRoots": ["./node_modules/@figma"]`. After moving to `apps/figma-plugin/tsconfig.json`, this path becomes `apps/figma-plugin/node_modules/@figma` — which doesn't exist. The package is hoisted to the root `node_modules`.

**Why it happens:** Bun hoists packages to the workspace root `node_modules`. The relative path from the app package points to the wrong location.

**How to avoid:** Use a root-relative path: `"typeRoots": ["../../node_modules/@figma"]` in `apps/figma-plugin/tsconfig.json`. This correctly points to the hoisted location.

**Warning signs:** TypeScript error `figma is not defined` or `Property 'createRectangle' does not exist on type 'PluginAPI'`.

### Pitfall 5: vite.config.plugin.ts imports figma.manifest.ts

**What goes wrong:** `vite.config.plugin.ts` currently has `import figmaManifest from "./figma.manifest"`. After both files move to `apps/figma-plugin/`, this relative import is correct — but only if both files are in the same directory. If they end up at different levels, the import breaks silently (config loads but manifest data is undefined).

**Why it happens:** The move must keep both files co-located.

**How to avoid:** Confirm both `vite.config.plugin.ts` and `figma.manifest.ts` land in `apps/figma-plugin/` at the same directory level.

**Warning signs:** `dist/manifest.json` is empty or missing fields after build.

---

## Code Examples

Verified patterns for this phase:

### packages/common/package.json
```json
{
  "name": "@repo/common",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  },
  "dependencies": {
    "monorepo-networker": "^2.1.0"
  }
}
```
[CITED: .planning/research/ARCHITECTURE.md]

### packages/common/src/index.ts (new barrel file)
```typescript
export * from "./networkSides";
```

### packages/ui/package.json
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
    "monorepo-networker": "^2.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

### packages/ui/src/index.ts (new barrel file)
```typescript
// Barrel export for potential future external consumption
// Components, utilities, etc. can be added here as the package grows
export { Button } from "./components/Button";
export { classes } from "./utils/classes.util";
```

### apps/figma-plugin/package.json
```json
{
  "name": "@repo/figma-plugin",
  "private": true,
  "scripts": {
    "build": "bun run build:ui && bun run build:plugin",
    "build:ui": "vite build -c vite.config.ui.ts",
    "build:plugin": "vite build -c vite.config.plugin.ts",
    "dev": "bun run --parallel dev:ui-watch dev:plugin-watch",
    "dev:ui-watch": "vite build --watch -c vite.config.ui.ts",
    "dev:plugin-watch": "vite build --watch -c vite.config.plugin.ts",
    "dev:ui-only": "vite serve -c vite.config.ui.ts",
    "types": "tsc --noEmit && tsc --noEmit -p tsconfig.node.json"
  },
  "dependencies": {
    "@repo/common": "workspace:*",
    "@repo/ui": "workspace:*"
  },
  "devDependencies": {
    "@figma/plugin-typings": "^1.83.0",
    "@types/node": "^20.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "postcss-url": "^10.1.3",
    "sass": "^1.60.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.11",
    "vite-plugin-generate-file": "^0.2.0",
    "vite-plugin-react-rich-svg": "^1.0.0",
    "vite-plugin-singlefile": "^2.0.3"
  }
}
```

Note: Vite version stays at ^5.0.11 in this phase. The Vite 6 upgrade is Phase 3's responsibility. [VERIFIED: ROADMAP.md assigns BUILD-03 to Phase 3]

### Updated import in packages/ui/src/app.network.tsx
```typescript
// Before: import { PLUGIN, UI } from "@common/networkSides";
import { PLUGIN, UI } from "@repo/common/networkSides";
```

### Updated import in apps/figma-plugin/src/plugin/plugin.network.ts
```typescript
// Before: import { PLUGIN, UI } from "@common/networkSides";
import { PLUGIN, UI } from "@repo/common/networkSides";
```

### Updated vite.config.ui.ts (apps/figma-plugin/)
```typescript
import { defineConfig } from "vite";
import path from "node:path";
import { viteSingleFile } from "vite-plugin-singlefile";
import react from "@vitejs/plugin-react";
import richSvg from "vite-plugin-react-rich-svg";
import postcssUrl from "postcss-url";

export default defineConfig(({ mode }) => ({
  plugins: [react(), richSvg(), viteSingleFile()],
  // Root points to packages/ui/src — the Vite UI entry point
  root: path.resolve(__dirname, "../../packages/ui/src"),
  build: {
    minify: mode === "production",
    cssMinify: mode === "production",
    sourcemap: mode !== "production" ? "inline" : false,
    emptyOutDir: false,
    outDir: path.resolve(__dirname, "dist"),
    rollupOptions: {
      input: path.resolve(__dirname, "../../packages/ui/src/index.html"),
    },
  },
  css: {
    postcss: {
      plugins: [postcssUrl({ url: "inline" })],
    },
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
  // No resolve.alias needed — workspace symlinks handle @repo/* resolution
}));
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| bun | workspace:* resolution, package installs | Yes | 1.3.11 | — |
| node | tsconfig verification, turbo | Yes | v24.6.0 | — |
| turbo | task verification | Yes | 2.9.5 (via bun.lock) | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

---

## Validation Architecture

> No test framework is configured (from CLAUDE.md). No per-phase Vitest setup is in scope for Phase 2 (Vitest is Phase 5). Validation is manual verification of build outputs.

### Phase Gate Verification

Phase 2 is complete when all of these pass:

```bash
# 1. Workspace structure
ls apps/figma-plugin/package.json packages/common/package.json packages/ui/package.json

# 2. Bun resolves all workspace packages
bun install && echo "PASS"

# 3. Workspace symlinks created
ls node_modules/@repo/common node_modules/@repo/ui

# 4. TypeScript resolves cross-package imports (no errors)
cd apps/figma-plugin && bun run types

# 5. Build produces dist/ output
cd apps/figma-plugin && bun run build
ls dist/index.html dist/plugin.js dist/manifest.json
```

### Req-to-Verification Map

| Req ID | Success Criterion | Verification Command |
|--------|-------------------|---------------------|
| MONO-01 | Directory layout exists | `ls apps/figma-plugin packages/common packages/ui` |
| MONO-03 | workspace:* in package.json deps | `grep "workspace:\*" apps/figma-plugin/package.json packages/ui/package.json` |
| MONO-04 | exports field present | `cat packages/common/package.json \| grep exports`, same for ui |
| MONO-05 | @repo/ namespace | `grep '"name": "@repo/' apps/figma-plugin/package.json packages/common/package.json packages/ui/package.json` |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tsconfig paths` for cross-package aliases | `package.json exports` + workspace symlinks | Turborepo-era (2022+) | TypeScript, Vite, Vitest all resolve the same way — no per-tool alias config |
| `moduleResolution: "Node"` | `moduleResolution: "Bundler"` | TypeScript 5.0 (2023) | Required for `exports` field resolution in package.json; existing tsconfig uses old Node mode |
| Compiled internal packages (tsc in each package) | JIT source-only packages | Turborepo 1.x onwards | No build steps in internal packages; Vite compiles everything from source |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vite follows workspace symlinks for `@repo/*` resolution without additional `resolve.alias` config | Architecture Patterns (Pattern 2) | Vite might need explicit aliases for workspace packages; mitigation: add `resolve.alias` entries as fallback |
| A2 | `vite-plugin-react-rich-svg` SVG imports (`?component`, `?url`, `?raw`) continue to work after the `root` path changes to `packages/ui/src` | Code Examples (vite.config.ui.ts) | SVG imports could break if plugin uses root-relative paths internally; verify by checking assets resolve in build output |
| A3 | `packages/ui/src/index.html` as Vite's rollupOptions `input` works correctly when Vite `root` is set to the same directory | Code Examples | Vite may expect a different input path format when root and input are in the same dir; fallback: use a relative path `./index.html` |

---

## Open Questions

1. **scripts format in apps/figma-plugin: run-p vs bun --parallel**
   - What we know: The original project used `npm-run-all` (`run-p`) for parallel builds. Phase 1 removed all deps from root.
   - What's unclear: Should `npm-run-all` be added back, or use Bun's native `bun run --parallel`?
   - Recommendation: Use `bun run --parallel` — it is built-in to Bun 1.1+ and removes a dependency. Syntax: `"dev": "bun run --parallel dev:ui-watch dev:plugin-watch"`.

2. **Should `@repo/typescript-config` package be created in Phase 2 or Phase 3?**
   - What we know: The architecture research documents a `packages/typescript-config` package as part of the full monorepo structure. Phase 2 success criteria does not mention it.
   - What's unclear: Creating per-package self-contained tsconfigs in Phase 2 that later get refactored to extend `@repo/typescript-config` creates churn.
   - Recommendation: Skip `@repo/typescript-config` in Phase 2. Write self-contained tsconfigs per package. The architecture research shows `@repo/typescript-config` as an optimization, not a Phase 2 requirement.

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/ARCHITECTURE.md` — JIT packages, workspace resolution, Vite alias strategy, anti-patterns, build order
- `.planning/research/STACK.md` — Version compatibility matrix, Bun workspace:* behavior
- Current codebase inspection (`src/`, `tsconfig.json`, both vite configs, all source files) — verified exact file locations and import paths

### Secondary (MEDIUM confidence)
- [turborepo.dev/docs/core-concepts/internal-packages](https://turborepo.dev/docs/core-concepts/internal-packages) — JIT vs compiled package distinction
- [bun.com/docs/pm/workspaces](https://bun.com/docs/pm/workspaces) — workspace:* protocol behavior

### Tertiary (LOW confidence)
- A1-A3 in Assumptions Log — untested edge cases in Vite root + workspace combination

---

## Metadata

**Confidence breakdown:**
- Package structure (MONO-01, MONO-05): HIGH — exact files and directories known from codebase inspection
- workspace:* protocol (MONO-03): HIGH — Bun docs confirm behavior; Phase 1 already uses Bun workspaces
- JIT exports pattern (MONO-04): HIGH — Turborepo official docs; confirmed in project architecture research
- Vite path resolution after file move: MEDIUM — core behavior is understood but A1-A3 are untested in this exact config combination

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable tooling — package.json exports, Bun workspaces)
