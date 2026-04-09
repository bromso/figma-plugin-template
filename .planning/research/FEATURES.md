# Feature Research

**Domain:** Turborepo monorepo migration — Bun, Biome, Vitest, VS Code workspace config for a Figma plugin template
**Researched:** 2026-04-09
**Confidence:** HIGH (Turborepo, Bun, VS Code official docs verified) / MEDIUM (Biome 2.0 monorepo syntax, Vitest/Turborepo integration patterns)

## Feature Landscape

### Table Stakes (Users Expect These)

Features a developer expects when cloning a "modern monorepo Figma plugin template." Missing these makes the template feel half-done or not trustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `apps/` + `packages/` directory split | Standard Turborepo convention; every reference repo uses this layout | LOW | `apps/figma-plugin`, `packages/ui`, `packages/common` |
| Root `package.json` with `workspaces` field | Required for Bun to discover and link packages | LOW | Must include `"private": true`; glob `packages/*` and `apps/*` |
| `workspace:*` protocol for internal deps | Bun's required syntax for local package linking; `*` is the conventional version pin | LOW | Replaces `../` relative paths in package.json |
| Root `turbo.json` with task pipeline | Core Turborepo feature; without it there is no caching or topological ordering | MEDIUM | Needs `build`, `test`, `lint`, `test:watch` tasks with correct `dependsOn` |
| `^build` dependency in turbo pipeline | Ensures packages build before the apps that consume them | LOW | `"dependsOn": ["^build"]` in the build task |
| Internal packages with `package.json` `exports` field | Required for correct resolution and tree-shaking; Turborepo docs call this mandatory | MEDIUM | Each package needs explicit entry points, not barrel-file guessing |
| `@repo/` or `@figma-plugin/` internal namespace | Prevents npm registry conflicts; conventional for monorepos | LOW | Pick one namespace and apply consistently across all packages |
| Biome root `biome.json` | Single source of truth for lint+format rules; without it, Biome has no config to run from | LOW | Must sit at repo root |
| Biome `format` + `lint` both enabled | Users expect both capabilities from a "Biome" setup; disabling either defeats the purpose | LOW | `"formatter": { "enabled": true }`, `"linter": { "enabled": true }` |
| Vitest per-package `test` script | Turborepo caches per-package; a root-only test script loses that benefit | MEDIUM | Each package that has tests needs its own `vitest` invocation |
| Separate `test:watch` task in `turbo.json` | Watch mode never exits; must be declared `cache: false, persistent: true` or Turborepo hangs in CI | LOW | Critical correctness issue, not a differentiator |
| VS Code `extensions.json` recommendations | Developers expect extension suggestions when opening a template; Biome and Vite extensions are essential | LOW | `biomejs.biome`, `vitest.explorer` at minimum |
| VS Code `settings.json` formatter config | Without `"editor.defaultFormatter": "biomejs.biome"`, Biome does nothing on save | LOW | Also needs `"editor.formatOnSave": true` |
| Bun as the single install/run entrypoint | If any script still requires npm or pnpm, the migration is incomplete | LOW | Root `bun install`, `bun run <task>` must work end-to-end |

### Differentiators (Competitive Advantage)

Features that distinguish this template from a generic Turborepo starter and make it specifically excellent for Figma plugin development.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Biome nested per-package config with `"extends": "//"` | Allows `packages/ui` to relax React rules while `packages/common` stays strict — without duplicating root config | MEDIUM | Requires Biome 2.0+; `"root": false` + `"extends": ["//"]` in each package's `biome.json` |
| Vitest `projects` configuration (hybrid model) | Single `vitest.dev.ts` at root for local dev (fast, unified output) + per-package configs for CI caching | HIGH | Vitest deprecated `workspaces` in 3.2; use `projects` API; hybrid is the current SOTA per Turborepo docs |
| VS Code `launch.json` with Figma plugin debug compound | Lets developers attach to both the plugin sandbox and UI processes from a single launch config | MEDIUM | Plugin sandbox has no DOM; UI is a normal iframe — different debug targets |
| VS Code `.code-workspace` file checked into repo | Opens all packages as multi-root workspace with correct folder names and per-folder settings | LOW | Gives `${workspaceFolder:figma-plugin}` scoping in launch.json without path hacks |
| Turborepo remote caching config stub | CI gets cache hits across runs; saves 30-60s on repeat builds for contributors | LOW | Just the `turbo.json` `remoteCache` field; actual token is per-user |
| Biome `overrides` for test files | Allows `console.log` and `describe`/`it` globals in `**/*.test.ts` without disabling rules globally | LOW | Single `overrides` block in root `biome.json`; standard pattern |
| `packages/common` typed strictly, `packages/ui` relaxed | Common code is shared between plugin sandbox and UI — strict types prevent runtime crashes in the sandbox | MEDIUM | Separate `tsconfig.json` strictness levels per package; plugin sandbox has no DOM so `lib: []` must exclude DOM types |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Root-level Vitest with a single `vitest.workspace.ts` file | Simpler to configure initially | `workspaces` is deprecated since Vitest 3.2; any change anywhere triggers a full cache miss in Turborepo (no per-package caching) | Per-package vitest configs + optional root `projects` config for local dev only |
| Single root `biome.json` with no per-package overrides | Easiest config to maintain | Biome applies the same React/DOM rules to `packages/common` which runs in the Figma sandbox (no DOM) | Root config + per-package `biome.json` with `"extends": ["//"]` for targeted overrides |
| `turbo.json` `"dependsOn": []` (empty) for build task | Seems safe for a flat project | Breaks topological ordering — packages may build before their dependencies; cache invalidation becomes unreliable | Always use `"dependsOn": ["^build"]` for build tasks |
| Hoisting all deps to root `node_modules` | Simplifies resolution | Bun already hoists when safe; manual full-hoisting hides missing `package.json` `exports` declarations and can break in strict environments | Rely on Bun's default hoisting behavior; fix missing exports instead |
| `npm` or `pnpm` scripts alongside Bun | Covers users who haven't migrated | Contradicts the single-toolchain goal; creates confusion about which lockfile is authoritative | Delete `package-lock.json` and `pnpm-lock.yaml`; document Bun as the only supported package manager |
| `eslint.config.js` kept alongside Biome | "Belt and suspenders" linting | Double-linting the same rules creates conflicting auto-fixes; Biome's formatter and ESLint's rules fight on save | Full migration to Biome; use `biome migrate eslint` to port any custom rules |
| VS Code tasks.json with complex multi-step build sequences | Automates the full build in the editor | VS Code tasks are not composable across multi-root workspace packages without manual duplication; Turborepo already handles this better | Use VS Code tasks only for simple dev shortcuts (`bun run dev`); delegate orchestration to `turbo run` |

## Feature Dependencies

```
[Bun workspaces (root package.json)]
    └──requires──> [workspace:* in package deps]
                       └──requires──> [exports field in each package]

[Turborepo task pipeline (turbo.json)]
    └──requires──> [Bun workspaces]
    └──requires──> [per-package scripts in package.json]

[Vitest per-package test scripts]
    └──requires──> [Turborepo test task]
                       └──enables──> [per-package caching]

[Biome nested per-package config]
    └──requires──> [Root biome.json]
    └──requires──> [Biome 2.0+]

[VS Code .code-workspace]
    └──enhances──> [VS Code launch.json (enables workspaceFolder scoping)]
    └──enhances──> [VS Code extensions.json (workspace-level recommendations)]

[Figma single-file output constraint]
    └──conflicts──> [standard Vite code-splitting]
    └──requires──> [vite-plugin-singlefile stays in apps/figma-plugin]
    └──requires──> [packages/ui and packages/common are NOT separately bundled — consumed directly by Vite]
```

### Dependency Notes

- **Bun workspaces requires exports field:** Without explicit `exports` in each `package.json`, Bun resolves packages by guessing entry points, which breaks under strict module conditions and Turborepo's package graph.
- **Turborepo requires per-package scripts:** `turbo run build` only caches packages that have a `build` script declared in their own `package.json`. A single root script is not cacheable per-package.
- **Vitest per-package requires Turborepo test task:** The test task in `turbo.json` must exist and reference the correct output globs for coverage reports if merging is needed.
- **Biome nested config requires Biome 2.0+:** The `"extends": ["//"]` microsyntax is only available in Biome 2.0. On 1.x, relative path extends must be used (`"../../biome.json"`).
- **Figma single-file constraint conflicts with code splitting:** `packages/ui` and `packages/common` must be consumed as source (via TypeScript path aliases resolved at Vite build time), not pre-bundled. The monorepo split is a DX/organizational boundary, not a shipping boundary.

## MVP Definition

### Launch With (v1 — this milestone)

- [ ] Root `package.json` with Bun workspaces (`apps/*`, `packages/*`) and `"private": true` — required to get any of the monorepo working
- [ ] `apps/figma-plugin` containing both Vite configs and the existing plugin source — migrated from the flat project root
- [ ] `packages/ui` with React components and SCSS, exported via `package.json` `exports` field — consumed by `apps/figma-plugin`
- [ ] `packages/common` with shared types and message definitions — consumed by both sides
- [ ] Root `turbo.json` with `build`, `dev`, `lint`, `test`, `test:watch` tasks — enables caching and parallel execution
- [ ] Root `biome.json` with lint + format enabled, React domain recommended, test file overrides — replaces the absent ESLint/Prettier
- [ ] VS Code `settings.json` with Biome as default formatter and `formatOnSave` — Biome is useless without editor integration
- [ ] VS Code `extensions.json` with Biome, Vitest, and Vite extensions recommended — the template's developer experience signal
- [ ] Delete `package-lock.json` and `pnpm-lock.yaml` — Bun is the single package manager

### Add After Validation (v1.x)

- [ ] Biome per-package nested configs with `"extends": ["//"]` — add when packages diverge enough to need different rules (e.g., common needs `lib: []` DOM exclusion)
- [ ] Vitest hybrid projects config (root dev + per-package CI) — add when the test suite grows beyond a handful of unit tests
- [ ] VS Code `launch.json` compound debug config for plugin + UI — add when contributors need to debug both processes simultaneously
- [ ] Turborepo remote cache stub — add when CI is set up (deferred to next milestone)

### Future Consideration (v2+)

- [ ] `@repo/biome-config` shared npm-exportable Biome config — only valuable if this becomes a family of plugins sharing config
- [ ] `turbo.json` `generators` for new package scaffolding — complexity not justified for a two-three package monorepo
- [ ] Changesets for versioning packages — only relevant if packages are published to npm independently

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Monorepo directory structure (apps/, packages/) | HIGH | LOW | P1 |
| Bun workspaces root config | HIGH | LOW | P1 |
| `workspace:*` internal deps + exports field | HIGH | LOW | P1 |
| Turborepo `turbo.json` with task pipeline | HIGH | MEDIUM | P1 |
| Root Biome config (lint + format) | HIGH | LOW | P1 |
| VS Code `settings.json` + `extensions.json` | HIGH | LOW | P1 |
| Per-package Vitest test scripts + Turborepo test task | MEDIUM | MEDIUM | P1 |
| Separate `test:watch` turbo task | MEDIUM | LOW | P1 |
| Biome per-package nested configs | MEDIUM | LOW | P2 |
| Vitest hybrid projects config | MEDIUM | HIGH | P2 |
| VS Code `launch.json` debug compound | MEDIUM | MEDIUM | P2 |
| VS Code `.code-workspace` file | MEDIUM | LOW | P2 |
| Remote cache stub in turbo.json | LOW | LOW | P2 |
| Biome overrides for test files | LOW | LOW | P2 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when possible within milestone
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | figma-plugin-react-vite (current) | Generic Turborepo starter | This milestone |
|---------|----------------------------------|--------------------------|----------------|
| Package manager | npm/pnpm (lockfiles present for both) | pnpm or npm | Bun exclusively |
| Monorepo structure | Flat single package | apps/ + packages/ | apps/ + packages/ with Figma-specific layout |
| Linting | None | ESLint + Prettier | Biome (single tool) |
| Testing | None | Vitest or Jest | Vitest with Turborepo caching |
| VS Code config | None | Minimal or none | launch.json, settings.json, extensions.json, tasks.json |
| Build caching | None | Turborepo with npm/pnpm | Turborepo with Bun |
| Figma constraint handling | vite-plugin-singlefile in root | N/A | vite-plugin-singlefile isolated in apps/figma-plugin |

## Sources

- [Turborepo: Structuring a repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) — HIGH confidence, official docs
- [Turborepo: Vitest guide](https://turborepo.dev/docs/guides/tools/vitest) — HIGH confidence, official docs
- [Bun: Configuring workspaces](https://bun.com/docs/guides/install/workspaces) — HIGH confidence, official docs
- [Biome: Big projects guide](https://biomejs.dev/guides/big-projects/) — HIGH confidence, official docs
- [Biome: Linter reference](https://biomejs.dev/linter/) — HIGH confidence, official docs
- [VS Code: Multi-root workspaces](https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces) — HIGH confidence, official docs
- [Biome v2 announcement](https://biomejs.dev/blog/biome-v2/) — MEDIUM confidence (searched, not directly fetched; nested config syntax confirmed via big-projects guide)
- [Vitest: Test Projects guide](https://vitest.dev/guide/projects) — MEDIUM confidence (searched; projects API replaces workspaces since 3.2)
- [Getting Biome to behave in a monorepo (GitHub gist)](https://gist.github.com/shirakaba/83f456566231580d525169236a350e73) — LOW confidence (community source, cross-verified with official docs)

---
*Feature research for: Turborepo monorepo migration — Figma plugin template (apps/figma-plugin, packages/ui, packages/common)*
*Researched: 2026-04-09*
