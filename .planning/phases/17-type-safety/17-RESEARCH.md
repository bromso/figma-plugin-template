# Phase 17: Type Safety — Research

**Researched:** 2026-04-10
**Domain:** TypeScript pipeline wiring, @iconify/react offline API, module augmentation
**Confidence:** HIGH — all critical claims verified against installed packages or npm registry

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**TYPE-02 — Icon registration API**
- D-01: API shape is `registerIcons(iconifyData)` only — thin wrapper around iconify's `addCollection`. No `registerIcon(name, component)` escape hatch.
- D-02: `StaticIconName` extensibility via module augmentation — `@repo/ui` exports empty interface `StaticIconNameMap`, derives `StaticIconName = keyof StaticIconNameMap`.
- D-03: Phase 16 coordination — `StaticIconName` must become `keyof StaticIconNameMap`, not a bare string union. Phase 17's first task restructures it if Phase 16 landed with the union form.
- D-04: `ICONS` const export using `as const satisfies Record<string, StaticIconName>`.
- D-05: Unknown-icon runtime behavior — wrap iconify render with `iconLoaded(name)` check; warn + return null if missing.
- D-06: `registerIcons(data: IconifyJSON): boolean` — returns `addCollection`'s boolean. Side effect on iconify's registry; no React context.
- D-07: REQUIREMENTS.md TYPE-02 rewording ships as part of Phase 17.

**TYPE-01 — tsc pipeline wiring**
- D-08: Two-config pattern mirrors `apps/design-plugin` exactly. Both `packages/ui` and `packages/common` get `"types": "tsc --noEmit && tsc --noEmit -p tsconfig.node.json"` and a new `tsconfig.node.json`.
- D-09: Test files stay in the main tsconfig include — no split.
- D-10: `turbo.json` already has `types` task; Phase 17 does NOT modify it.
- D-11: Scope is `packages/*` only — `apps/storybook` deferred.
- D-12: Fix any errors surfaced when `bun run types` runs for the first time.

### Claude's Discretion
- Exact key shape of `ICONS` const (e.g., `plus` vs `lucidePlus`)
- Whether `registerIcons` accepts array or single collection
- Exact file for `StaticIconNameMap` interface (co-located in `icon.tsx` or split to `icon.types.ts`)
- Whether unknown-icon warning is dedup'd via `Set<string>` (default: yes) or fires every render
- Order and naming of new exports from `packages/ui/src/index.ts`
- Commit sequencing within the phase

### Deferred Ideas (OUT OF SCOPE)
- Expand preloaded icon whitelist beyond Phase 16's 3 icons
- Icon provider / React context API
- Runtime icon loader / lazy registration
- `apps/storybook` types script (Phase 20)
- Strict typing for `turbo.json` tasks
- Public `docs/ICONS.md`
- Migrating `select.tsx` / `accordion.tsx` / `checkbox.tsx` off `lucide-react` (Phase 18)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TYPE-01 | `packages/ui` has a `types` script running `tsc --noEmit`, wired into Turborepo pipeline | Two-config pattern verified against `apps/design-plugin`; `turbo.json` `types` task verified; `@types/node` gap identified |
| TYPE-02 | `Icon` component supports runtime extension via `registerIcons(iconifyData)` API, typed `ICONS` const, `StaticIconNameMap` interface, `StaticIconName = keyof StaticIconNameMap` | `@iconify/react` v6 API verified from extracted dist types; `addCollection`, `iconLoaded` signatures confirmed |
</phase_requirements>

---

## Summary

Phase 17 has two distinct work streams: (1) wiring `tsc --noEmit` into Turborepo via package-level `types` scripts and new `tsconfig.node.json` files, and (2) extending the `Icon` component with a typed runtime registration API layered on `@iconify/react`'s `addCollection`.

**Critical blocker:** Phase 16 has NOT yet landed. The current `icon.tsx` still uses `lucide-react` and the old `iconMap`/`iconName` API. Phase 17 cannot begin until Phase 16 is merged. The first plan task must verify Phase 16 is merged before any edits to `icon.tsx`.

**Key API fact:** `@iconify/react` v6.0.2 exports `iconLoaded(name: string): boolean` (not `iconExists` — that was removed). Both `addCollection` and `iconLoaded` import from `@iconify/react` directly. The offline sub-path (`@iconify/react/offline`) omits all API client code and is the correct import for the Figma singlefile bundle.

**Key infrastructure gap:** `packages/ui`'s `tsconfig.node.json` will reference `"types": ["node"]` (mirroring `apps/design-plugin`), but `@types/node` is not in `packages/ui`'s devDependencies. It must be added. `packages/common`'s vitest config has no node imports, but for pattern consistency `@types/node` should be added there too.

**Primary recommendation:** Implement as two sequential plans: Plan A (TYPE-01 — tsconfig wiring + latent error fixes), Plan B (TYPE-02 — `registerIcons` + `StaticIconNameMap` + `ICONS` + unknown-name guard). Plan A can run immediately after Phase 16 merges; Plan B extends the stabilized `icon.tsx`.

---

## @iconify/react API Verification

### Installed Version

`@iconify/react` is NOT yet installed in this repo (Phase 16 has not landed). The published latest version is **6.0.2** (`dist-tags.latest`). [VERIFIED: npm registry `npm view @iconify/react dist-tags`]

### Function Names — Critical Rename

`iconExists()` was removed. The current function name is `iconLoaded()`. [VERIFIED: extracted from `@iconify/react@6.0.2/dist/iconify.d.ts`]

```typescript
// CORRECT — v6.0.2
export declare function iconLoaded(name: string): boolean;

// WRONG — removed in v5+, do not use
// export declare function iconExists(name: string): boolean;
```

Context D-05 specifies "iconify's API for querying whether a name is registered (`iconExists(name)` or equivalent)". The equivalent in v6 is `iconLoaded(name)`.

### addCollection Signature — Main vs Offline

Two signatures exist depending on import path:

**Main module** (`@iconify/react`):
```typescript
export declare function addCollection(data: IconifyJSON, provider?: string): boolean;
```
Returns `boolean` (success flag). Has `provider` param for multi-provider setups.

**Offline module** (`@iconify/react/offline`):
```typescript
export declare function addCollection(data: IconifyJSON, prefix?: string | boolean): void;
```
Returns `void`. Has `prefix` param (different semantics). No API client code included.

[VERIFIED: extracted from `@iconify/react@6.0.2/dist/offline.d.ts` and `dist/iconify.d.ts`]

### Which Import Path to Use

Use `@iconify/react/offline` for all imports inside the Figma plugin build.

**Rationale:**
- The main `@iconify/react` bundle includes `api.iconify.design` hardcoded at line 650 of `dist/iconify.js`: `configStorage[""] = createAPIConfig({ resources: ["https://api.iconify.design"]... })`. That URL will never resolve inside Figma's singlefile sandbox.
- The offline bundle (`dist/offline.js`) is 832 lines vs the main bundle's 1931 lines. It contains zero references to `api.iconify.design`. [VERIFIED: `grep -c "api.iconify.design" dist/offline.js` → 0]
- The offline module exports: `Icon`, `InlineIcon`, `addIcon`, `addCollection`. It does NOT export `iconLoaded`.

**Implication for D-05:** `iconLoaded` is only in the main module. Two options:
1. Import `Icon` and `addCollection` from `@iconify/react/offline`; import `iconLoaded` from `@iconify/react`. The `iconLoaded` call is a pure registry lookup — it does NOT trigger a network fetch. [ASSUMED — based on function doc "checks component's storage", but not runtime-verified in offline mode context]
2. Guard without `iconLoaded`: use the `offline` module only and implement the unknown-name guard by wrapping `addCollection`'s registry with a local `Set<string>` at call time. This avoids mixing import paths.

**Recommendation (for planner decision):** Option 1 is cleaner and idiomatic. `iconLoaded` is a synchronous registry lookup with no I/O. The API endpoint URL is only initialized at module load from the main bundle — if the main bundle is tree-shaken by Vite (since `addAPIProvider`, `setFetch`, etc. are never called), the fetch code should be dead-eliminated. But this is a risk. Option 2 (local Set tracking) is safer for the singlefile constraint and should be the default. Flag for planner.

### IconifyJSON Type Location

```typescript
import type { IconifyJSON } from '@iconify/types';
```

`@iconify/types` version 2.0.0. [VERIFIED: `npm view @iconify/types version`; confirmed as the import in both `offline.d.ts` and `iconify.d.ts`]

### @iconify-json/lucide Package Shape

```
@iconify-json/lucide@1.2.102  (latest as of 2026-04-10)
exports:
  '.'         → index.js / index.d.ts
  './icons.json' → icons.json (full collection JSON)
  './info.json'  → info.json
```

Default import (`import lucideIcons from '@iconify-json/lucide'`) gives the full `IconifyJSON` object. [VERIFIED: `npm view @iconify-json/lucide@1.2.102 exports`]

### API Fetching in Figma Sandbox

The main `@iconify/react` bundle registers `https://api.iconify.design` as the default API resource. If the offline import path is used consistently, or if Vite tree-shakes the API provider setup (which it likely will since `setAPIModule` and `addAPIProvider` are never called), the fetch code is not reachable. Using `@iconify/react/offline` for `addCollection` and `Icon` entirely eliminates this risk. [VERIFIED: offline.js has 0 references to `api.iconify.design`]

### Idempotency of addCollection

The iconify docs state icons added via `addCollection` are "not stored in the icon data cache" — they go into an in-memory registry. Calling `addCollection` multiple times with the same data is safe (no error thrown). [ASSUMED based on library design pattern; not explicitly stated in the extracted types]

---

## Turborepo `types` Task

### Current Definition in turbo.json

```json
"types": {
  "dependsOn": ["^build"],
  "outputs": []
}
```

[VERIFIED: read from `/turbo.json` lines 28-31]

### What `dependsOn: ["^build"]` Does for a types Task

The `^` microsyntax tells Turborepo to run the named task in each direct dependency package before the current package's task. For `types` with `"dependsOn": ["^build"]`, this means:

- Before running `@repo/ui`'s `types` script, Turborepo first runs `@repo/common`'s `build` script.
- Before running `@repo/design-plugin`'s `types` script, Turborepo first runs `@repo/ui`'s `build` script and `@repo/common`'s `build` script.

**Problem:** `@repo/ui` and `@repo/common` are JIT/source-only packages with no `build` script. They have no `outputs` to produce. So `^build` resolves to a no-op for those packages — Turborepo simply skips the non-existent `build` task and proceeds. This means the current `dependsOn: ["^build"]` does NOT cause unwanted rebuilds for JIT packages. [CITED: https://turborepo.dev/docs/crafting-your-repository/configuring-tasks]

**For `apps/design-plugin`:** It has a `build` script. Running `bun run types` from the root would trigger `@repo/design-plugin`'s `build` before its own `types`. Whether this is desirable depends on whether `types` should be fast (skip build) or thorough (check against built outputs). Per D-10, Phase 17 does NOT modify `turbo.json` — the existing behavior is accepted as-is.

### Topological Order

With the three packages having `types` scripts after Phase 17:
1. `@repo/common` — no dependencies with `types` scripts → runs first (or in parallel with unrelated packages)
2. `@repo/ui` — depends on `@repo/common` via `^build` (no-op) → runs after common's non-existent build
3. `@repo/design-plugin` — depends on `@repo/ui` via `^build` (no-op, JIT) and `@repo/common` via `^build` → runs last

In practice: since JIT packages have no build outputs, Turborepo will run all three `types` tasks in topological order but likely in near-parallel. The Turborepo cache will handle subsequent runs — `types` tasks with `outputs: []` have no file outputs but ARE cached by Turborepo based on input hashes. [CITED: https://turborepo.dev/docs/crafting-your-repository/configuring-tasks]

### Caching Implications

`"outputs": []` means Turborepo caches the task exit code and console output but restores nothing to disk (no files to restore). A cache hit replays the cached output without re-running `tsc`. This is correct for a `--noEmit` check — it's purely a pass/fail signal.

### Alternative dependsOn Patterns (for planner awareness)

- `"dependsOn": ["^types"]` — Would require upstream packages to have `types` scripts before running the downstream one. Enforces topological type-checking. After Phase 17, this would work correctly.
- `"dependsOn": []` — No upstream dependency. All `types` tasks run fully in parallel. Risks cache incorrectness if a change in `@repo/common` is not reflected before `@repo/ui` type-checks it.
- Current `"dependsOn": ["^build"]` — Safe for JIT packages (effectively `[]`), but triggers real builds for `apps/design-plugin`. Accepted per D-10.

**Planner note:** No `turbo.json` edit required. The existing task definition works.

---

## Module Augmentation

### The Pattern

```typescript
// In @repo/ui — packages/ui/src/components/figma/icon.tsx
export interface StaticIconNameMap {
  "lucide:plus": true;
  "lucide:info": true;
  "lucide:star": true;
}
export type StaticIconName = keyof StaticIconNameMap;

// In a consuming app — apps/design-plugin/src/main.tsx (or a types file)
import type { } from "@repo/ui"; // REQUIRED: makes the file a module, not ambient

declare module "@repo/ui" {
  interface StaticIconNameMap {
    "mdi:home": true;
    "mdi:account": true;
  }
}
```

The `import type { } from "@repo/ui"` line at the top is not optional — without a top-level import or export, TypeScript treats `declare module` as an ambient module declaration (replacing exports) rather than an augmentation (merging with exports). [CITED: https://www.typescriptlang.org/docs/handbook/declaration-merging.html]

### OSS Precedents for the Same Pattern

- **`@tanstack/react-router`** — exports a `Register` interface that consumers augment to wire in their router instance types, enabling typed `Link` component, params, and search params.
- **`react-i18next`** — exports a `Resources` interface that consumers augment with their translation key map, enabling typed `t()` calls.
- **`next-auth`** — exports a `Session` interface that consumers augment to add custom session fields, enabling typed `useSession()` return values.

All three use the identical pattern: library exports an empty (or minimal) interface, consumer augments it via `declare module "library-name" { interface LibraryInterface { ... } }`. [ASSUMED — based on well-known library patterns; specific interface names unverified in this session]

### Monorepo JIT/Source-Only Package Gotcha

**Issue:** TypeScript module augmentation with symlinked packages has a known historical problem (Microsoft/TypeScript#17450). The augmentation may not be visible when the target module is resolved through a symlink rather than a real `node_modules` entry.

**This repo's situation:** Bun workspace packages resolve via `node_modules/@repo/ui → ../../packages/ui/src/index.ts` (symlinked). TypeScript may fail to match `declare module "@repo/ui"` in the consuming package with the same `@repo/ui` module it resolved for the import.

**Known working solutions:**
1. Modern Bun/npm workspaces typically handle this correctly because the package name (`@repo/ui`) resolves to the same canonical path from both the library and consumer side. The symlink issue was more prevalent with manually-linked packages pre-workspace-era.
2. If TypeScript fails to resolve the augmentation, adding `"preserveSymlinks": false` (the default) in the consumer's tsconfig is the fix. Do NOT set `preserveSymlinks: true` — that breaks augmentation for symlinked paths.
3. Vite's module resolution uses the workspace symlink directly; TypeScript's `moduleResolution: "bundler"` should also follow workspace symlinks correctly.

**Risk level:** MEDIUM. The augmentation works in the `@tanstack/react-router` and `react-i18next` monorepos (both use workspace symlinks). The pattern should work here. If it does not work for `apps/design-plugin`'s consumer augmentation, the fix is one tsconfig line. [CITED: https://github.com/microsoft/TypeScript/issues/17450]

**Planner note:** Include a verification step in the plan: after shipping `StaticIconNameMap`, have a test consumer augment it from `apps/design-plugin` and verify `tsc` accepts the narrowed type.

---

## Current File State

### packages/ui/src/components/figma/icon.tsx — PRE-PHASE-16 (lucide-react)

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
  iconName: string;  // <-- old prop name, Phase 16 renames to `name`
  spin?: boolean;
}

export function Icon({ iconName, spin, className, ...props }: IconProps) {
  const LucideIcon = iconMap[iconName];
  if (!LucideIcon) return null;
  return <LucideIcon className={cn("size-4", spin && "animate-spin", className)} {...props} />;
}
```

**State:** Phase 16 has NOT landed. The file is still on `lucide-react` with the old `iconName` prop. Phase 17 cannot edit this file until Phase 16 merges. [VERIFIED: read directly from repo]

### packages/ui/src/index.ts — Current Exports

Current exports do NOT include: `registerIcons`, `StaticIconName`, `StaticIconNameMap`, `ICONS`, `AlertAction`, `ButtonProps` (as a proper type). Phase 17 adds the first four; Phase 16 adds the latter two. [VERIFIED: read from `/packages/ui/src/index.ts`]

### packages/ui/package.json — No `types` Script

```json
"scripts": {
  "lint": "biome check .",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

No `types` script. No `@types/node` in devDependencies. `lucide-react` still in dependencies (Phase 16 will replace with `@iconify/react`). [VERIFIED: read from `/packages/ui/package.json`]

### packages/common/package.json — No `types` Script

```json
"scripts": {
  "lint": "biome check .",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

No `types` script. No TypeScript or `@types/node` in devDependencies. [VERIFIED: read from `/packages/common/package.json`]

### packages/ui/tsconfig.json — Already Strict

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.d.ts"]
}
```

Strict mode already enabled. Test files are under `src/` and picked up via `src/**/*.ts(x)`. No `types` array entry (relies on automatic node_modules/@types lookup). [VERIFIED: read directly]

### packages/common/tsconfig.json — Already Strict

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.ts"]
}
```

No `jsx`, no `paths`, no `types` entry. [VERIFIED: read directly]

### apps/design-plugin/tsconfig.node.json — Template to Mirror

```json
{
  "compilerOptions": {
    "noEmit": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "types": ["node"]
  },
  "include": ["*.ts", "vite.config.*.ts"]
}
```

[VERIFIED: read directly from `/apps/design-plugin/tsconfig.node.json`]

### turbo.json — Exact types Task Definition

```json
"types": {
  "dependsOn": ["^build"],
  "outputs": []
}
```

[VERIFIED: read directly from `/turbo.json`]

---

## @types/node Gap — Critical Finding

**packages/ui:** `vitest.config.ts` imports `path from "node:path"`. This requires `@types/node`. The planned `tsconfig.node.json` will specify `"types": ["node"]`. But `@types/node` is NOT in `packages/ui`'s devDependencies (only in `apps/design-plugin`'s devDependencies). [VERIFIED: checked `packages/ui/package.json`, `apps/design-plugin/package.json`, and confirmed `packages/ui/node_modules/@types/` contains only `react` and `react-dom`]

**packages/common:** `vitest.config.ts` has no `node:` imports and no need for node types in the config itself. However, for pattern consistency with D-08, `@types/node` should be added.

**Action required in Phase 17:**
- Add `"@types/node": "^24.0.0"` to `packages/ui` devDependencies
- Add `"@types/node": "^24.0.0"` to `packages/common` devDependencies (for consistency)
- Or scope `tsconfig.node.json` to use `"types": []` for `packages/common` since it has no node imports

The current `@types/node@24.12.2` is available in the Bun store. [VERIFIED: found at `/node_modules/.bun/@types+node@24.12.2/`]

---

## Latent Type Error Risk

All latent error risk is catalogued after reading every source file under `packages/ui/src/` and `packages/common/src/`. There are zero `@ts-ignore`, `@ts-expect-error`, `: any`, or `as unknown as` suppressions in either package. [VERIFIED: grep over both packages returned no matches]

### Risk Register

| File | Risk | Severity | Why |
|------|------|----------|-----|
| `packages/ui/src/main.tsx` | `as HTMLElement` unchecked cast on `document.getElementById("root")` | HIGH | Phase 16 (BUG-01) fixes this; if Phase 16 is not merged before Phase 17's `tsc --noEmit` runs, this will be a type error under `strictNullChecks` |
| `packages/ui/src/components/figma/icon.tsx` | `iconName: string` (not narrowed) + `iconMap: Record<string, ComponentType<LucideProps>>` | HIGH | Phase 16 (BUG-04) fixes this; if Phase 16 is not merged, `tsc` will pass (no error — just untyped access), but the ROADMAP criteria won't be met |
| `packages/ui/src/index.ts` | Missing `AlertAction` re-export (BUG-03), `ButtonProps` phantom (BUG-02) | MEDIUM | Phase 16 fixes these; if Phase 16 is not merged, consumers get runtime errors but `tsc` may not surface them |
| `packages/ui/src/__tests__/App.test.tsx` | Uses `toBeInTheDocument()` from `@testing-library/jest-dom` with `globals: true` in vitest config | LOW | Works at runtime; tsc must see `@testing-library/jest-dom` types; `setup.ts` imports it as side-effect; should be fine |
| `packages/ui/src/app.tsx` | Uses old `iconName` prop on `<Icon>` and `<IconButton>` — 3 call sites | HIGH | After Phase 16 renames prop to `name`, these are errors. Phase 16 fixes all call sites as part of BUG-04. |
| `packages/common/src/networkSides.ts` | No issues detected — fully typed via `Networker` generics | NONE | Clean |

**Summary:** All HIGH-risk items are pre-existing bugs that Phase 16 is responsible for fixing. After Phase 16 merges, the codebase should be clean. Phase 17's `tsc --noEmit` risk is LOW if Phase 16 lands first, which is the intended order.

**Recommendation:** If Phase 17's Plan A (TYPE-01 wiring) reveals any additional errors after Phase 16, fix them in the same plan before Plan B (TYPE-02 icon API). The planner should budget 1-2 tasks for "fix any `tsc` errors surfaced by the new types script."

---

## Vitest Config Type-Check Risks

### packages/ui/vitest.config.ts

```typescript
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
```

**Risks when type-checked by `tsconfig.node.json`:**

1. **`@types/node` missing** (HIGH): `import path from "node:path"` requires `@types/node`. Not in devDependencies. Will produce `TS2307: Cannot find module 'node:path'`. Fix: add `"@types/node": "^24.0.0"` to devDependencies.
2. **`@vitejs/plugin-react` version mismatch** (LOW): `packages/ui` has `@vitejs/plugin-react` `^4.0.0` while `apps/design-plugin` uses `^6.0.0`. The plugin's TypeScript interface should be compatible. `skipLibCheck: true` in tsconfig.node.json suppresses any `.d.ts` errors from the plugin itself.
3. **`path` alias in `resolve.alias`** (NONE): `path.resolve(__dirname, "src")` — `__dirname` is available under `"moduleResolution": "bundler"` with `"types": ["node"]`. Once `@types/node` is installed, this is fine.

### packages/common/vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
```

**Risks when type-checked by `tsconfig.node.json`:**

1. **No node imports** (NONE): No `node:path` or other node builtins — no `@types/node` strictly required for this file.
2. **`vitest` not in devDependencies** (NONE): Vitest is in `devDependencies` (`"vitest": "^4.1.4"`). `defineConfig` types come from vitest itself.
3. **`tsconfig.node.json` include pattern**: D-08 specifies `"include": ["*.ts", "vitest.config.ts"]`. The design-plugin uses `"include": ["*.ts", "vite.config.*.ts"]`. For packages/common the correct pattern is `"include": ["*.ts", "vitest.config.ts"]` — no Vite configs, only vitest. [VERIFIED: design-plugin tsconfig.node.json uses `vite.config.*.ts`; packages need `vitest.config.ts`]

**Planner note:** The `include` glob in the new `tsconfig.node.json` files should be `["*.ts", "vitest.config.ts"]` for both packages (not `vite.config.*.ts`).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `packages/ui/vitest.config.ts` (exists), `packages/common/vitest.config.ts` (exists) |
| Quick run command | `bun run --filter @repo/ui test` |
| Full suite command | `bun run test` (all packages via Turborepo) |

### Failure Modes and Verification Points

Phase 17 has four distinct failure surfaces:

**Surface 1 — Compile-time (TYPE-01)**

| Point | What to catch | Command |
|-------|--------------|---------|
| `packages/ui tsc` passes | Latent type errors in src/ and test files | `bun run --filter @repo/ui types` |
| `packages/common tsc` passes | Any type drift in networkSides.ts | `bun run --filter @repo/common types` |
| `packages/ui tsc -p tsconfig.node.json` passes | `@types/node` availability for vitest.config.ts | Same command (it runs both) |
| `packages/common tsc -p tsconfig.node.json` passes | vitest config well-typed | Same command |
| `bun run types` (root) exits 0 | Full pipeline across all 3 packages | `bun run types` |

**Surface 2 — Compile-time (TYPE-02)**

| Point | What to catch | Command |
|-------|--------------|---------|
| `StaticIconName` is `keyof StaticIconNameMap` | Interface-backed type compiles | `bun run --filter @repo/ui types` |
| `ICONS` const `satisfies` clause | All ICONS values are valid `StaticIconName` | Same |
| `registerIcons` accepts `IconifyJSON` | Import from `@iconify/types` resolves | Same |
| Consumer augmentation compiles | `declare module "@repo/ui" { interface StaticIconNameMap { ... } }` merges | Add test file to design-plugin, run `bun run --filter @repo/design-plugin types` |

**Surface 3 — Runtime (TYPE-02 behavior)**

| Point | What to catch | Verification |
|-------|--------------|-------------|
| `registerIcons(collection)` registers icons | Icons render after registration | Manual: call `registerIcons` then render `<Icon name="lucide:plus" />` |
| `iconLoaded("lucide:plus")` returns true after registration | Registry is populated | Unit test or console check |
| `<Icon name={"nonexistent" as StaticIconName} />` warns and returns null | Unknown-name guard fires | Unit test: spy on `console.warn`, assert return is null |
| Warning is dedup'd | Same unknown name only warns once | Unit test: render twice, assert warn called once |

**Surface 4 — Regression (no breakage)**

| Point | What to catch | Command |
|-------|--------------|---------|
| Build still works | Tree-shaking doesn't break | `bun run build` |
| Tests still pass | No API changes break existing tests | `bun run test` |
| Lint passes | No new Biome violations | `bun run lint` |
| Existing `<Icon name="lucide:plus" />` still renders | Phase 17 didn't break Phase 16 | Existing App.test.tsx render test |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TYPE-01 | `packages/ui types` script exits 0 | smoke | `bun run --filter @repo/ui types` | Script added in this phase |
| TYPE-01 | `packages/common types` script exits 0 | smoke | `bun run --filter @repo/common types` | Script added in this phase |
| TYPE-01 | Root `bun run types` exits 0 | integration | `bun run types` | Via Turborepo pipeline |
| TYPE-02 | `registerIcons` compiles with `IconifyJSON` | compile | Part of `bun run types` | No — Wave 0 |
| TYPE-02 | `ICONS.plus` typed as `"lucide:plus"` literal | compile | Part of `bun run types` | No — Wave 0 |
| TYPE-02 | Unknown-name guard warns and returns null | unit | `bun run --filter @repo/ui test` | No — Wave 0 |
| TYPE-02 | Module augmentation works end-to-end | compile+smoke | `bun run --filter @repo/design-plugin types` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `bun run --filter @repo/ui types` (quick compile check, ~5s)
- **Per wave merge:** `bun run types && bun run test && bun run build`
- **Phase gate:** Full suite green (`bun run types`, `bun run test`, `bun run build`, `bun run lint`) before marking Phase 17 done

### Wave 0 Gaps

- [ ] `packages/ui/src/__tests__/icon-registration.test.tsx` — covers TYPE-02 runtime behavior (unknown-name warn, null return, dedup)
- [ ] `packages/ui/tsconfig.node.json` — must exist before `tsc -p tsconfig.node.json` runs
- [ ] `packages/common/tsconfig.node.json` — must exist before `tsc -p tsconfig.node.json` runs
- [ ] `@types/node` in `packages/ui` devDependencies — required for tsconfig.node.json check to pass

---

## Open Questions

1. **`iconLoaded` from main vs offline module**
   - What we know: `iconLoaded` is not exported from `@iconify/react/offline`. It is exported from `@iconify/react` (main). The main module includes the API client with `api.iconify.design` hardcoded.
   - What's unclear: Whether Vite will tree-shake the API client code from the main bundle if only `iconLoaded` is imported from it (and `addAPIProvider`, `setFetch` are never called).
   - Recommendation: Use a local `Set<string>` approach (track registered icon names at `registerIcons` call time) instead of `iconLoaded`, so only `@iconify/react/offline` is imported. This fully eliminates the API client risk. The planner should pick one approach and lock it.

2. **Phase 16 landing before Phase 17 starts**
   - What we know: Phase 16 has NOT merged. `icon.tsx` is still on `lucide-react`.
   - What's unclear: Whether Phase 17 planning should block on Phase 16 completion, or produce plans that handle both the "Phase 16 done" and "Phase 16 pending" states.
   - Recommendation: Plans should assume Phase 16 is done (per the hard dependency stated in CONTEXT.md). The first plan task should verify the Phase 16 merge (check for `@iconify/react` in `packages/ui/package.json`) before proceeding.

3. **`tsconfig.node.json` include pattern for packages**
   - What we know: `apps/design-plugin/tsconfig.node.json` uses `"include": ["*.ts", "vite.config.*.ts"]`. The packages use `vitest.config.ts` not `vite.config.*.ts`.
   - What's unclear: D-08 says "mirror `apps/design-plugin` exactly" but that would use `vite.config.*.ts` which won't match the vitest configs.
   - Recommendation: Use `"include": ["*.ts", "vitest.config.ts"]` for both packages. This deviates minimally from D-08 (only the include glob changes) and correctly picks up the actual config files.

4. **`@types/node` version to pin**
   - What we know: `apps/design-plugin` uses `"@types/node": "^24.0.0"`. The Bun store has `@types+node@24.12.2`.
   - Recommendation: Add `"@types/node": "^24.0.0"` to both `packages/ui` and `packages/common` devDependencies, matching the existing convention in `apps/design-plugin`.

5. **TypeScript version in packages/ui**
   - What we know: `packages/ui/package.json` has `"typescript": "^5.3.0"` while `apps/design-plugin` has `"typescript": "^6.0.0"`. Phase 17 adds a `tsc --noEmit` script.
   - What's unclear: Whether TypeScript 5.x and 6.x have any diverging behavior on the patterns Phase 17 uses (`satisfies`, interface module augmentation, `keyof` on interface).
   - Recommendation: Upgrade `packages/ui` TypeScript to `^6.0.0` in the same plan as the types script addition, for consistency. But this is a planner call — verify no breaking changes for `packages/ui`'s specific usage.

---

## Sources

### Primary (HIGH confidence)
- `@iconify/react@6.0.2/dist/iconify.d.ts` — extracted via `npm pack` + `tar -xzf`; confirmed `iconLoaded`, `addCollection` signatures
- `@iconify/react@6.0.2/dist/offline.d.ts` — extracted via same method; confirmed offline module exports and `addCollection(data, prefix?)` signature
- `@iconify/react@6.0.2/dist/offline.js` + `dist/iconify.js` — line-count and `api.iconify.design` grep confirmed the offline bundle has zero API references
- `npm view @iconify/react dist-tags` — confirmed v6.0.2 is latest
- `npm view @iconify/types version` — confirmed `@iconify/types@2.0.0`
- `npm view @iconify-json/lucide@1.2.102 exports` — confirmed package shape
- Repository files (all read directly): `turbo.json`, `apps/design-plugin/tsconfig.node.json`, `packages/ui/package.json`, `packages/common/package.json`, `packages/ui/tsconfig.json`, `packages/common/tsconfig.json`, `packages/ui/src/components/figma/icon.tsx`, `packages/ui/src/index.ts`, `packages/ui/vitest.config.ts`, `packages/common/vitest.config.ts`

### Secondary (MEDIUM confidence)
- [Turborepo task configuration docs](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) — `dependsOn` semantics, caching with `outputs: []`
- [Iconify React migration guide](https://iconify.design/docs/articles/migration/icon-v3.html) — `iconExists` removal, `iconLoaded` replacement
- [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) — module augmentation pattern, `declare module` vs ambient declaration requirement

### Tertiary (LOW confidence / ASSUMED)
- `@tanstack/react-router`, `react-i18next`, `next-auth` register-interface pattern names — well-known from training data, specific interface names not verified in this session [ASSUMED]
- `addCollection` idempotency — not explicitly stated in extracted types; inferred from library design [ASSUMED]
- Vite tree-shaking the API client from `@iconify/react` main bundle — plausible but not verified with a build [ASSUMED]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `iconLoaded` is a sync registry lookup with no I/O, safe to import from main module alongside offline `addCollection` | @iconify/react API Verification | Could bring in API client code into the Figma bundle; mitigated by using local Set instead |
| A2 | `addCollection` is idempotent (calling twice with same data is safe) | @iconify/react API Verification | Could produce duplicate registry entries or throw; low risk — iconify is designed for this use case |
| A3 | Vite tree-shakes API client code from `@iconify/react` main if only `iconLoaded` is imported | @iconify/react API Verification | API endpoint URL could end up in bundle; mitigated by using local Set approach |
| A4 | `@tanstack/react-router` Register interface, `react-i18next` Resources interface, `next-auth` Session interface are the specific interface names used as precedents | Module Augmentation | Wrong names in JSDoc; cosmetic risk only |
| A5 | Bun workspace symlink resolution makes `declare module "@repo/ui"` augmentation work correctly from `apps/design-plugin` | Module Augmentation | Augmentation silently ignored; mitigated by explicit verification step in plan |

---

## RESEARCH COMPLETE
