# Pitfalls Research

**Domain:** Figma plugin monorepo migration — Turborepo + Bun + Biome + Vitest
**Researched:** 2026-04-09
**Confidence:** HIGH (critical pitfalls verified across multiple sources, GitHub issues, and official docs)

---

## Critical Pitfalls

### Pitfall 1: vite-plugin-singlefile Breaks When Workspace Packages Are Not Inlined

**What goes wrong:**
When `@common`, `@ui`, or `@plugin` are moved to separate workspace packages, Vite may treat them as external dependencies and not bundle them into the single output file. The result is a `plugin.js` or `index.html` that contains unresolved `import` statements — Figma refuses to load these because it only accepts fully self-contained files with no external references.

**Why it happens:**
Vite's monorepo detection logic automatically treats linked workspace packages (those resolved from `node_modules/` via workspace symlinks) as external source rather than bundled code. The assumption is that linked packages are shared libraries that should be excluded from the bundle. This is the right behavior for library packages, but catastrophic for Figma's single-file constraint.

**How to avoid:**
- Keep `@common` as a source-only package with no separate build step — import it via path alias directly from `src/`, not via the workspace package resolution mechanism.
- In each `vite.config.*.ts`, use `resolve.alias` with `path.resolve()` pointing to the package's `src/` directory, not the package name. This bypasses workspace resolution and forces Vite to bundle the source directly.
- Example: `"@common": path.resolve(__dirname, "../../packages/common/src")` — not `"@common": "packages/common"`.
- Set `build.rollupOptions.external` to an empty array (or omit it) to ensure nothing is excluded.
- Use `resolve.dedupe: ["react", "react-dom"]` to prevent duplicate React instances from appearing as separate chunks.

**Warning signs:**
- Output `plugin.js` contains `import` or `require` statements after build.
- `index.html` references external script `src=` attributes.
- Figma console error: "Cannot import" or "Plugin failed to load".
- Vite build log shows workspace packages listed under "external" in the Rollup summary.

**Phase to address:**
Monorepo restructuring phase — when packages are split into `packages/common`, `packages/ui`, and `apps/figma-plugin`.

---

### Pitfall 2: Path Aliases Break When Crossing Bun Workspace Package Boundaries

**What goes wrong:**
The existing `@common`, `@ui`, `@plugin` aliases (defined in the root `tsconfig.json`) stop resolving when code in `packages/common` tries to import another workspace package using an alias. Bun resolves `tsconfig.json` from the root during runtime, but does not correctly apply the `paths` mapping from a package's local `tsconfig.json` when that file is imported by another package.

This is a confirmed open issue: [Bun issue #14694](https://github.com/oven-sh/bun/issues/14694) and [issue #21056](https://github.com/oven-sh/bun/issues/21056).

**Why it happens:**
Bun's module resolver uses the tsconfig closest to the entry point, not the tsconfig local to the package being resolved. When package-A imports package-B, and package-B's `tsconfig.json` has path aliases, Bun may resolve those aliases using the root tsconfig instead of package-B's local one, causing "Unknown module" or "Cannot find module" errors at runtime (Vitest, Bun scripts) even though TypeScript type-checks pass cleanly.

**How to avoid:**
- Treat `@common`, `@ui`, `@plugin` as Vite build-time aliases only — configure them in each `vite.config.*.ts` via `resolve.alias`, not exclusively via `tsconfig.paths`.
- For runtime (Vitest, type-checking scripts), use workspace protocol package references (`"@figma-plugin/common": "workspace:*"`) and import via the package name — not via path alias.
- Do not rely on `tsconfig.paths` surviving across package boundaries in Bun's runtime. Keep paths declarations in each package's local tsconfig for editor support, but back them with `vite-tsconfig-paths` in Vite and explicit `resolve.alias` entries.
- Run a smoke test (`bun run vitest`) after every restructuring step to catch resolution failures early.

**Warning signs:**
- TypeScript reports no errors, but `bun test` or Vitest throws `Error: Cannot find module '@common/...'`.
- Imports work in the IDE but fail at test time.
- Error message: "Unknown module" from Bun's resolver.

**Phase to address:**
Monorepo restructuring phase — establish the alias strategy before migrating any code.

---

### Pitfall 3: Turborepo `packageManager` Field Format Rejects Bun

**What goes wrong:**
Turborepo 2.x requires a `packageManager` field in the root `package.json`. If this field includes a `v` prefix (e.g., `"bun@v1.2.0"`) instead of the plain semver format (`"bun@1.2.0"`), Turborepo fails with: `could not parse the packageManager field in package.json, expected to match regular expression`.

Separately, if the field is omitted entirely, Turborepo emits a warning and may fall back to incorrect package manager detection.

**Why it happens:**
Turborepo validates the `packageManager` field against the regex `(bun|npm|pnpm|yarn)@\d+\.\d+\.\d+`. Bun's own CLI sometimes outputs version strings with a `v` prefix in documentation, leading developers to copy that format into `package.json`.

**How to avoid:**
- Set `"packageManager": "bun@<version>"` without the `v` prefix (e.g., `"bun@1.2.10"`).
- Use `bun --version` to get the exact version string and paste it directly.
- Add this field as the very first step when setting up the monorepo — before running any `turbo` commands.

**Warning signs:**
- `turbo build` exits with `invalid_package_manager_field` error.
- Turborepo warns "Did not find packageManager in your package.json".

**Phase to address:**
Turborepo scaffolding phase — root `package.json` setup.

---

### Pitfall 4: Bun Lockfile Format Changes Break Turborepo Cache

**What goes wrong:**
Bun switched from a binary lockfile (`bun.lockb`) to a text-based lockfile (`bun.lock`) in late 2024, then changed the format version from v0 to v1 in early 2025. Each change breaks Turborepo's lockfile parser, causing cache misses or outright failures. Additionally, `turbo prune` generates a `bun.lock` that differs from what `bun install --frozen-lockfile` expects, making pruned Docker images fail to install.

**Why it happens:**
Turborepo parses the lockfile to detect which dependencies changed across runs (for cache invalidation). When Bun changes the lockfile format, Turborepo's parser becomes invalid. This is an ongoing upstream incompatibility — the Bun lockfile format is not a stable public API.

**How to avoid:**
- Pin both `turbo` and `bun` to specific versions in `package.json` and the project's Bun version file (`.bun-version`).
- Do not rely on `turbo prune` for Docker builds in this milestone (it is out of scope for v1.0).
- Track the Turborepo release notes for lockfile parser updates before upgrading Bun.
- Commit `bun.lock` (text format) to the repository so CI is deterministic.

**Warning signs:**
- Turborepo emits: "Warning when using text-based Bun lockfile".
- `bun install --frozen-lockfile` fails after a `turbo prune` step.
- Cache hits drop to zero after a Bun upgrade.

**Phase to address:**
Bun package manager migration phase — immediately after switching from npm.

---

### Pitfall 5: Biome Nested Config Without `"root": false` Causes Silent Misconfiguration

**What goes wrong:**
Each workspace package needs its own `biome.json` (or `biome.jsonc`) with `"root": false`. If this field is omitted, Biome treats the nested config as an independent root, breaking the inheritance chain from the repository root config. The result is inconsistent formatting rules across packages — some packages follow root rules, others silently do not.

A more severe variant: the LSP (VS Code extension) will apply the wrong config to files opened from a subdirectory, causing the editor to reformat code in ways that conflict with the CLI.

**Why it happens:**
Biome's config resolution traverses upward to find the nearest root config. A nested `biome.json` without `"root": false` stops that traversal, making it appear as a root to Biome. This is counterintuitive for developers coming from ESLint, which uses cascade inheritance by default.

**How to avoid:**
- Root `biome.json` at repository root with all shared rules.
- Each package has its own `biome.json` containing exactly:
  ```json
  {
    "root": false,
    "extends": "//"
  }
  ```
- The `"//"` microsyntax always refers to the root config regardless of nesting depth.
- Run `biome check .` from the repo root and from each package root to verify both resolve to the same rule set.

**Warning signs:**
- `biome check packages/common` applies different rules than `biome check .` from repo root.
- VS Code formats differently when a file from a package is opened first vs. opened after a root file.
- Child config `formatter` or `linter` overrides appear to do nothing.

**Phase to address:**
Biome setup phase — immediately after scaffolding workspace packages.

---

### Pitfall 6: Vitest Projects Feature Disables Turborepo Per-Package Caching

**What goes wrong:**
If Vitest is configured using the `projects` feature in a root `vitest.config.ts` that enumerates all packages, Turborepo loses the ability to cache test results per package. Every test run re-runs all packages even if only one changed, because Turborepo's caching unit is the package task, not the root Vitest project.

**Why it happens:**
Vitest's `projects` feature crosses package boundaries — it is designed for Jest workspace compatibility, not modern package manager workspaces. Turborepo cannot track which subset of packages changed when all tests are driven from a single root task.

**How to avoid:**
- Give each package (`packages/common`, `packages/ui`, `apps/figma-plugin`) its own `vitest.config.ts` and its own `"test"` script in `package.json`.
- Configure Turborepo with a `test` task that has `"cache": true` and `"outputs": ["coverage/**"]`.
- Create a separate `"test:watch"` task with `"cache": false` and `"persistent": true` for development.
- Use a shared `vitest.shared.ts` config file that each package's config imports and spreads, rather than root-level `projects`.

**Warning signs:**
- Changing one package's source causes all packages' tests to re-run.
- Turborepo never shows "cache hit" for the `test` task.
- `turbo run test --dry` shows all packages as affected on every run.

**Phase to address:**
Vitest setup phase — before writing any tests.

---

### Pitfall 7: Figma Manifest `main` and `ui` Paths Break Under Monorepo Dist Structure

**What goes wrong:**
The Figma manifest (`manifest.json`) references `"main": "plugin.js"` and `"ui": "index.html"` as relative paths. After moving to a monorepo, if the Vite `outDir` changes (e.g., from `dist/` to `apps/figma-plugin/dist/`) and the manifest is generated from a different location, these relative paths point to the wrong files. Figma loads the plugin but the sandbox or UI silently fails with no error in the console.

**Why it happens:**
The existing setup uses `vite-plugin-generate-file` to emit `manifest.json` into `dist/` alongside `plugin.js` and `index.html`. In a monorepo, it is easy to misalign the manifest output directory with the Vite outDir, or to use an absolute path in the manifest that Figma cannot follow.

**How to avoid:**
- Keep all three Figma plugin outputs (`plugin.js`, `index.html`, `manifest.json`) co-located in the same `dist/` directory.
- The `figma.manifest.ts` file and the manifest generation plugin must live in `apps/figma-plugin/` — not at the monorepo root.
- After every build, verify with: `ls apps/figma-plugin/dist/` should show exactly `plugin.js`, `index.html`, and `manifest.json`.
- Set `outDir` to an absolute path using `path.resolve(__dirname, "dist")` in both Vite configs to avoid CWD sensitivity.

**Warning signs:**
- Figma Desktop shows "Plugin failed to load" with no further detail.
- `dist/` directory is missing one of the three files after build.
- `manifest.json` contains absolute paths (`/Users/...`) instead of relative filenames.

**Phase to address:**
Monorepo restructuring phase — when moving Vite configs into `apps/figma-plugin/`.

---

### Pitfall 8: Two Parallel Watch Builds Race — Plugin Side Reads Stale Common Code

**What goes wrong:**
In development, `watch:ui` and `watch:plugin` run in parallel via `turbo dev`. If `packages/common` is being rebuilt and the plugin-side Vite watcher picks up the change before the common build completes, the plugin build may link against a partially-written or previous version of the common output. In Figma, this manifests as type mismatches or runtime errors that disappear on the next save.

**Why it happens:**
Turborepo's persistent dev tasks do not have ordering guarantees between each other. The confirmed GitHub issue [#8673](https://github.com/vercel/turborepo/issues/8673) documents that persistent tasks start in parallel and do not wait for dependency tasks to complete their first run.

**How to avoid:**
- For this project, `@common` should be source-only with no build step — both Vite configs import directly from the common package's `src/` via `resolve.alias`. This eliminates the race condition entirely because there is no intermediate build artifact.
- If a common package build step becomes necessary in the future, use `turbo watch` (available since v2.0.4) which re-runs tasks following the task graph, instead of relying on parallel persistent tasks.
- Do not use `"persistent": true` for the common package build in `turbo.json` — only the final Vite builds that run the dev servers should be persistent.

**Warning signs:**
- Intermittent runtime errors in Figma during development that disappear on file re-save.
- One Vite watcher rebuilds before the other, causing inconsistent state.
- Different behavior between first `turbo dev` run and subsequent saves.

**Phase to address:**
Turborepo task pipeline configuration phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Single root `tsconfig.json` with all paths | Avoids per-package tsconfig setup | Path aliases silently stop working in Bun runtime; Vitest can't find modules | Never — each package needs a local tsconfig |
| Using Vitest `projects` in root config | One config file to maintain | Loses Turborepo per-package caching; all tests re-run on every change | Never for CI; acceptable for local dev only |
| Omitting `"outputs"` from turbo.json build task | Less config to write | Turborepo never caches build outputs; every build re-runs from scratch | Never |
| Keeping `node_modules/` at root only (no per-package) | Simpler install | Vite may resolve wrong versions; `resolve.dedupe` required; harder to isolate packages | Only if React version is identical across all packages |
| Monorepo-wide single `biome.json` without nested configs | One config to maintain | Biome LSP applies wrong rules to package files; formatting inconsistencies in editor | Acceptable only if all packages have identical rule requirements |
| Flat `dist/` at repo root for both builds | Matches existing structure | Breaks when apps/figma-plugin moves; `outDir` references break | Never after monorepo restructure |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Bun + Turborepo | Using `"packageManager": "bun@v1.2.0"` with `v` prefix | Use `"bun@1.2.0"` — no `v` prefix; Turborepo regex rejects it |
| Biome + VS Code | Installing Biome extension without workspace-level `biome.json` | Ensure root `biome.json` exists; extension uses nearest root config |
| Vitest + Turborepo | Configuring `test:watch` with `"cache": true` | Watch mode never exits; set `"cache": false, "persistent": true` for watch tasks |
| vite-plugin-singlefile + workspace packages | Importing shared code as a workspace package via package name | Import via `resolve.alias` pointing to `src/` to force bundling into single output |
| `@figma/plugin-typings` + monorepo | Installing plugin typings in root only | Install in `apps/figma-plugin/` package only — these types pollute global scope and must be scoped to the plugin package |
| Bun + `bun.lock` | Using `bun.lockb` binary format | Bun 1.1+ generates text `bun.lock`; commit this file; do not gitignore it |
| Turborepo + two Vite builds | Setting both `watch:ui` and `watch:plugin` as dependent on `packages/common` build | Make common source-only (no build step) to avoid ordering race conditions |
| `figma.manifest.ts` + monorepo root | Keeping manifest config at repo root after restructure | Move to `apps/figma-plugin/` and update Vite plugin path accordingly |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Running `turbo run test` without per-package test scripts | All packages tested on every run regardless of changes | Give each package a `"test"` script; configure Turborepo per-package task | Immediately — every `turbo test` re-runs everything |
| Using `bun install` without `--frozen-lockfile` in scripts | Lockfile silently updated during dev, causing drift across machines | Add `--frozen-lockfile` to CI scripts; use `bun install` without flags only interactively | When lockfile drift causes different dependency trees on different machines |
| Large SCSS compiled into inlined `index.html` | Slow Vite rebuilds on CSS change; bloated single HTML file | Keep SCSS modular; avoid importing large third-party CSS libraries | Becomes noticeable above ~500KB unminified CSS |
| `emptyOutDir: false` on parallel builds with shared `dist/` | Race condition deletes the other build's output | Confirmed correct for this project — both builds write to same dir; keep `false` | N/A — this is the correct config for this setup |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Committing real Figma plugin ID in `figma.manifest.ts` | Plugin ID exposure (low risk for templates, high risk for private plugins) | Use a placeholder ID in the template; document that users must replace it |
| Storing Figma OAuth tokens in `.env` files committed to git | Token exposure | Use `.env.local` (gitignored); add `.env*` to `.gitignore` except `.env.example` |
| Including `@figma/plugin-typings` in runtime `dependencies` | Figma-specific globals leak into non-plugin packages | Keep `@figma/plugin-typings` in `devDependencies` of `apps/figma-plugin` only |

---

## "Looks Done But Isn't" Checklist

- [ ] **Single-file output:** Build completes without errors — verify `dist/plugin.js` and `dist/index.html` have NO external imports. Open each file and search for `import` or `src=`.
- [ ] **Path aliases:** `bun run vitest` passes in every package — not just `packages/common` but also `apps/figma-plugin`. Aliases that work in one may fail in another.
- [ ] **Turborepo caching:** `turbo run build` twice in a row — second run must show "cache hit" for all packages. If it re-runs, `outputs` config is wrong.
- [ ] **Biome consistency:** `biome check .` from repo root and `biome check .` from `packages/common/` produce the same rule violations — not different ones.
- [ ] **Figma loads plugin:** Drop `dist/` folder into Figma Desktop "Import plugin from manifest" — both UI and plugin sandbox must respond. Type-check passing is not sufficient.
- [ ] **Watch mode stability:** Start `turbo dev`, make a change in `packages/common`, wait 3 seconds — both `index.html` and `plugin.js` should rebuild. Only one rebuilding means alias routing is wrong.
- [ ] **Vitest isolation:** Tests in `packages/common` must not import from `@figma/plugin-typings` — those Figma globals (`figma.*`) do not exist in Vitest's jsdom environment.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| vite-plugin-singlefile not inlining workspace packages | MEDIUM | Switch `resolve.alias` to point at `src/` paths instead of package names; rebuild |
| Path alias resolution broken in Bun | LOW | Add explicit `resolve.alias` in Vite config; add `paths` to local package tsconfig; re-run tests |
| `packageManager` field rejected by Turborepo | LOW | Fix version string in `package.json`; remove the `v` prefix; re-run `turbo build` |
| Bun lockfile format incompatibility | MEDIUM | Pin Bun and Turbo versions; run `bun install` to regenerate lockfile; commit |
| Biome nested config not inheriting root | LOW | Add `"root": false` and `"extends": "//"` to each package `biome.json`; reformat |
| Vitest projects feature breaking Turborepo cache | MEDIUM | Refactor to per-package `vitest.config.ts` files; add `"test"` scripts to each `package.json` |
| Figma manifest paths pointing to wrong location | LOW | Move `figma.manifest.ts` to `apps/figma-plugin/`; update Vite plugin path; rebuild |
| Parallel watch builds reading stale common code | LOW | Make common package source-only (no build step); point Vite aliases to `src/` |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| vite-plugin-singlefile not inlining workspace packages | Monorepo restructuring (package split) | Open `dist/plugin.js` — no `import` statements; open `dist/index.html` — no external `<script src>` |
| Path aliases break across Bun package boundaries | Monorepo restructuring (alias strategy) | `bun run vitest` passes in all packages after restructure |
| `packageManager` field format rejection | Turborepo scaffolding | `turbo build` runs without errors; no packageManager warning |
| Bun lockfile format changes breaking cache | Bun migration | `turbo run build` shows "cache hit" on second run; `bun install --frozen-lockfile` succeeds |
| Biome nested config misconfiguration | Biome setup | `biome check .` from root and from each package produce consistent results |
| Vitest projects disabling Turborepo cache | Vitest setup | Second `turbo run test` shows "cache hit" for unchanged packages |
| Figma manifest paths misalignment | Monorepo restructuring (moving Vite configs) | Figma Desktop loads plugin after pointing at `apps/figma-plugin/dist/manifest.json` |
| Parallel watch builds racing | Turborepo task pipeline configuration | Make a common file change; observe both Vite builds complete without stale-read errors |

---

## Sources

- Bun path alias monorepo issue: https://github.com/oven-sh/bun/issues/14694
- Bun tsconfig paths in workspace packages: https://github.com/oven-sh/bun/issues/21056
- Turborepo packageManager field format: https://github.com/vercel/turborepo/issues/707
- Turborepo + Bun lockfile (text format warning): https://github.com/vercel/turborepo/issues/9628
- Turborepo + Bun `turbo prune` lockfile mismatch: https://github.com/vercel/turborepo/issues/11007
- Turborepo persistent tasks race condition: https://github.com/vercel/turborepo/issues/8673
- Biome monorepo nested config: https://biomejs.dev/guides/big-projects/
- Biome nested config `"root": false` issue: https://github.com/biomejs/biome/issues/6882
- Biome child config extends not working: https://github.com/biomejs/biome/issues/6483
- Vitest + Turborepo caching strategy: https://turborepo.dev/docs/guides/tools/vitest
- vite-plugin-singlefile + monorepo deduplication: https://github.com/richardtallent/vite-plugin-singlefile
- Figma plugin libraries and bundling (single-file constraint): https://developers.figma.com/docs/plugins/libraries-and-bundling/
- Bun always hoists workspace packages: https://github.com/oven-sh/bun/issues/7547
- Turborepo bun-turbo-hell blog: https://www.fgbyte.com/blog/02-bun-turborepo-hell/
- Turborepo Vite guide: https://turborepo.dev/docs/guides/frameworks/vite

---
*Pitfalls research for: Figma plugin monorepo migration (Turborepo + Bun + Biome + Vitest)*
*Researched: 2026-04-09*

---
---

# Milestone v1.1 Pitfalls — react-figma-ui + Storybook Integration

**Domain:** Adding react-figma-ui component library and Storybook to existing Turborepo monorepo
**Researched:** 2026-04-09
**Confidence:** MEDIUM (core pitfalls verified via GitHub issues and official docs; some library-specific behavior inferred from source structure and community patterns)

---

## Critical Pitfalls

### Pitfall 9: react-figma-ui's figma-plugin-ds CSS Uses Unscoped Global Class Names

**What goes wrong:**
`react-figma-ui` (JB1905/react-figma-ui) is a thin React wrapper over `figma-plugin-ds` by Thomas Lowry. The underlying `figma-plugin-ds` stylesheet uses plain, unscoped BEM-style class names such as `.checkbox`, `.input`, `.button`, `.label`, `.icon`. These are applied to the DOM directly and are not CSS Module hashed names. When you import the stylesheet alongside your existing SCSS modules, these global names can collide with your own utility classes or reset rules, overriding component styles silently.

**Why it happens:**
`figma-plugin-ds` was written as a vanilla CSS library for use without any build tooling. Its stylesheet is not a CSS Module — it is a global stylesheet. When imported via `import 'react-figma-ui/figma-plugin-ds.css'` (or the equivalent path), Vite injects all rules into the global style scope. Any element in your UI that has a class matching one of these unscoped names will be affected, even if that element is inside a CSS Module component.

Note: `react-figma-ui` (JB1905) is different from `react-figma-plugin-ds` (alexandrtovmach). Both wrap the same underlying `figma-plugin-ds` stylesheet but under different import paths. Confirm the correct package before installation.

**Consequences:**
- `.checkbox`, `.input`, `.icon`, `.button`, `.label` rules from figma-plugin-ds override your SCSS module styles on any matching elements.
- Storybook shows correct visual output but the actual plugin iframe shows different output because the global CSS load order differs.
- No build-time error — failures are purely visual and hard to bisect.

**Prevention:**
- Import `figma-plugin-ds.css` once at the top-level entry (`packages/ui/src/index.ts` or `apps/figma-plugin/src/ui/main.tsx`) so load order is explicit and deterministic.
- Audit your existing SCSS for any class names that match the unscoped names in figma-plugin-ds. Rename any collisions with a project-specific prefix (e.g., `.fpt-button` instead of `.button`).
- Do not import the figma-plugin-ds stylesheet inside a CSS Module file — CSS Modules only scope the file's own rules, not any `@import`ed global stylesheets.
- If you need to contain figma-plugin-ds styles, wrap all react-figma-ui usage inside a container div with a scoping class and use `:where(.figma-ui) .button { ... }` to re-scope the global rules without specificity increase.

**Detection:**
- Run `grep -r "class=\"button\|class=\"input\|class=\"label\|class=\"icon"` across your existing SCSS — any match is a collision candidate.
- After adding react-figma-ui, visually inspect every existing component in Storybook for unexpected styling changes.

**Phase to address:**
Phase 1 (react-figma-ui integration into `packages/ui`) — before writing any stories.

---

### Pitfall 10: vite-plugin-singlefile Is Incompatible with Storybook's Vite Builder

**What goes wrong:**
`vite-plugin-singlefile` modifies Vite's build pipeline to inline all JS and CSS into a single HTML file by overriding `build.rollupOptions.output` and injecting a post-processing transform. Storybook's Vite builder (`@storybook/builder-vite`) constructs its own Vite config via `viteFinal` and expects a multi-chunk output: separate JS chunks, asset files, and an `index.html` that references them. These two configurations directly conflict.

**Why it happens:**
Storybook dev mode (`storybook dev`) uses Vite's dev server — `vite-plugin-singlefile` does nothing in dev mode (it only operates during `build`). However, Storybook's production build (`storybook build`) uses Vite in build mode and `vite-plugin-singlefile` will attempt to inline everything, producing a single-file output that Storybook's own serving infrastructure cannot parse. The result is either a broken static Storybook build or a corrupted output where stories cannot load.

**Consequences:**
- `storybook build` fails silently or produces a single massive HTML file instead of the expected `storybook-static/` directory structure.
- Dev mode works, masking the issue until someone runs a static build.
- Storybook's `@storybook/test-runner` (if used later) breaks because it expects the multi-file build output.

**Prevention:**
- `packages/storybook` must have its own `vite.config.ts` that does NOT include `vite-plugin-singlefile`. Do not import or extend the `apps/figma-plugin` Vite configs.
- In `.storybook/main.ts` within `packages/storybook`, use the `viteFinal` hook to explicitly filter out any singlefile plugin if it somehow appears in the merged config:
  ```typescript
  viteFinal: async (config) => {
    config.plugins = (config.plugins ?? []).filter(
      (p) => p && (p as { name?: string }).name !== 'vite-plugin-singlefile'
    );
    return config;
  }
  ```
- Keep Storybook's Vite config completely isolated from the plugin app's Vite config — they serve different output requirements and must not share plugin arrays.

**Detection:**
- After `storybook build`, check for a `storybook-static/` directory with multiple files. A single file output means singlefile plugin was active.
- If Storybook dev works but `storybook build` produces an oversized `index.html`, the plugin is interfering with the build.

**Phase to address:**
Phase 2 (Storybook package scaffolding) — before configuring any stories.

---

### Pitfall 11: Bun v1.2+ Lockfile Change Breaks Storybook's Package Manager Detection

**What goes wrong:**
Storybook's CLI and internal tooling detect which package manager is in use by looking for a lockfile: `bun.lockb` for Bun, `package-lock.json` for npm, `yarn.lock` for Yarn, `pnpm-lock.yaml` for pnpm. Bun v1.2+ changed the default lockfile from the binary `bun.lockb` to the text-based `bun.lock`. Storybook does not recognize `bun.lock` as a Bun lockfile marker, falls back to npm detection, and runs `npm install` internally — which fails in a Bun-only workspace.

This is documented in Storybook issue [#30366](https://github.com/storybookjs/storybook/issues/30366).

**Why it happens:**
Storybook's lockfile detection logic was written before Bun's text-based lockfile existed. The detection string match `bun.lockb` is a hard-coded check; `bun.lock` is not recognized as of the time this was researched (early 2026). A fix PR (#29267) was merged to add npm fallback detection, but the core Bun detection using `bun.lock` may not be fully landed in stable releases.

**Consequences:**
- `bunx storybook dev` fails with npm-related errors even though Bun is installed.
- `bunx storybook build` may invoke `npm install` silently, creating a `package-lock.json` and a conflicting `node_modules` state.
- `bun install --frozen-lockfile` in CI fails after Storybook's npm fallback mutates the workspace.

**Prevention:**
- Workaround (confirmed effective): Create an empty `bun.lockb` file at the monorepo root alongside `bun.lock`. Bun does not object to both files coexisting, and Storybook's lockfile detection finds `bun.lockb` and correctly identifies Bun as the package manager.
  ```bash
  touch bun.lockb
  ```
- Add a note in the repo README or CONTRIBUTING docs explaining this file must not be deleted.
- Monitor Storybook releases for native `bun.lock` detection support and remove the workaround file once fixed upstream.
- Run Storybook scripts via `bunx` (not `npx`) to reduce the chance of npm being invoked: `"storybook": "bunx storybook dev -p 6006"`.

**Detection:**
- Storybook init or dev fails with `npm ERR!` or mentions `package-lock.json`.
- A `package-lock.json` appears in the repo root after running any Storybook command.
- `bun install --frozen-lockfile` fails after running `storybook dev`.

**Phase to address:**
Phase 2 (Storybook package scaffolding) — during initial Storybook installation.

---

## Moderate Pitfalls

### Pitfall 12: Storybook Cannot Resolve JIT Source-Only Packages Without viteFinal Configuration

**What goes wrong:**
`packages/ui` is a JIT source-only package — its `package.json` `exports` field points directly to `.ts` files, and it has no build step. Storybook's Vite builder resolves workspace packages through Node's module resolution, finds `.ts` files as the package entry, then attempts to process them. Without explicit configuration, Storybook may fail to transpile these TypeScript files or fail to resolve the package's path aliases (`@repo/common`, etc.) that are only defined in Vite `resolve.alias`, not in Node resolution.

**Why it happens:**
Storybook merges your Vite config, but TypeScript `paths` defined in `tsconfig.json` are not automatically applied unless `vite-tsconfig-paths` is loaded in the Storybook Vite config. If `packages/ui` imports from `@repo/common` using a TypeScript path alias and that alias is not configured in Storybook's Vite config, the import fails at Storybook build time even though it works in the app build.

**Prevention:**
- In `.storybook/main.ts` `viteFinal`, explicitly add the same `resolve.alias` entries that `packages/ui` relies on:
  ```typescript
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@repo/common': path.resolve(__dirname, '../../packages/common/src'),
    };
    return config;
  }
  ```
- Alternatively, install `vite-tsconfig-paths` as a devDependency in `packages/storybook` and add it to Storybook's Vite plugins array — it will automatically read your `tsconfig.json` paths and register them as Vite aliases.
- Ensure `packages/storybook` declares `@repo/ui` and `@repo/common` as `devDependencies` so Bun's workspace resolution makes them available.

**Detection:**
- Storybook build fails with `Error: Failed to resolve import "@repo/common/..."` from a file inside `packages/ui`.
- Stories render in Storybook dev but the component shows no styling (global CSS was not imported) or throws a module-not-found error.

**Phase to address:**
Phase 2 (Storybook configuration) — during viteFinal setup.

---

### Pitfall 13: SCSS Global Variables Not Available in Storybook

**What goes wrong:**
The project uses SCSS with a 7-1 architecture under `packages/ui/src/styles/`. Global SCSS variables (e.g., `$color-bg`, `$spacing-*`) defined in abstract files are available in the app because `vite.config.ui.ts` injects them via `css.preprocessorOptions.scss.additionalData`. Storybook has its own Vite config and does not automatically inherit this `additionalData` setting. Stories that use components relying on these variables will compile with `undefined` values or throw a Sass compiler error.

**Why it happens:**
Storybook's Vite builder reads your `vite.config.ts` and merges it, but the app-specific Vite config (in `apps/figma-plugin/`) is not in Storybook's config lookup path. Storybook looks for `vite.config.ts` at the package root where `.storybook/` lives. If `packages/storybook` does not have its own `vite.config.ts` with the `css.preprocessorOptions` setting, the SCSS global injection does not happen.

**Prevention:**
- In `packages/storybook`, create a `vite.config.ts` (or configure via `viteFinal`) with:
  ```typescript
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@repo/ui/src/styles/abstracts" as *;`,
      },
    },
  }
  ```
- Confirm the path resolves by checking that `packages/storybook/node_modules/@repo/ui` symlinks correctly after `bun install`.
- A missing `additionalData` entry causes silent visual breakage (components render with fallback or no values) rather than a hard build error — make it part of the Storybook smoke test.

**Detection:**
- Storybook compiles but components render without expected colors, spacing, or typography.
- Sass compiler warning: `Undefined variable` for any `$variable` defined in abstract files.
- Storybook stories look different from the same component rendered in the actual plugin UI.

**Phase to address:**
Phase 2 (Storybook configuration) — after initial setup, before writing component stories.

---

### Pitfall 14: react-figma-ui Package Is Effectively Unmaintained

**What goes wrong:**
`react-figma-ui` (JB1905/react-figma-ui, npm: `react-figma-ui`) has had no releases in over 5 years as of 2026. The underlying `figma-plugin-ds` library (thomas-lowry/figma-plugin-ds) is also effectively archived. This means: no React 18/19 compatibility fixes, no TypeScript 5.x typings updates, no Vite 6 ESM compatibility patches. Using it as a hard dependency means the project is coupled to abandoned code.

**Why it happens:**
The Figma plugin UI component ecosystem is fragmented. The most maintained alternatives are `@create-figma-plugin/ui` (Yuanqing/create-figma-plugin) which uses Preact, and `figma-ui-components` (react-figma/figma-ui-components) which also has sparse maintenance. There is no officially Figma-maintained React component library for plugins.

**Consequences:**
- React 18+ strict mode warnings from legacy lifecycle methods inside react-figma-ui components.
- TypeScript errors from outdated type definitions requiring manual `@ts-ignore` suppression.
- Bundle size may be larger than necessary due to no tree-shaking optimizations in old package format (likely CJS output, not ESM).
- Dependency on peer package `figma-plugin-ds` which may not resolve cleanly with Bun's strict peer dependency resolution.

**Prevention:**
- Treat react-figma-ui as a vendored dependency: pin the exact version, do not allow minor/patch upgrades to flow through automatically.
- If TypeScript errors occur, add a local type augmentation file (`packages/ui/src/types/react-figma-ui.d.ts`) to patch missing or incorrect types rather than modifying `node_modules`.
- Evaluate replacing react-figma-ui with hand-crafted components styled to match Figma's UI if maintenance issues block progress — the component surface is small (14 components).
- Do not use `react-figma-plugin-ds` (alexandrtovmach) as a drop-in replacement without testing — it is a different package with slightly different API and also unmaintained.

**Detection:**
- `bun install` warns about peer dependency mismatches for `figma-plugin-ds`.
- TypeScript reports errors on import of react-figma-ui component props.
- React DevTools (or Vite build) warns about deprecated lifecycle methods.

**Phase to address:**
Phase 1 (react-figma-ui integration) — evaluate before committing to the dependency; document the maintenance risk in the milestone notes.

---

### Pitfall 15: Storybook Stories Render in a Standard Browser Context, Not Figma's iframe

**What goes wrong:**
Figma's plugin UI runs inside a sandboxed `<iframe>` that applies Figma's own CSS reset and base styles to the document. Components styled with `figma-plugin-ds` CSS are designed to match Figma's visual environment, which includes Figma's base font stack, 0-margin/padding reset, and a specific `box-sizing` rule. Storybook renders stories in a normal browser `<iframe>` (or no iframe in Canvas mode) without Figma's base styles. Components will look visually different between Storybook and the actual plugin.

**Why it happens:**
This is not a bug — it is an inherent mismatch between the rendering context. Figma's iframe applies host-level styles that cannot be replicated exactly. The `figma-plugin-ds` CSS does include a minimal reset, but it does not match Figma's full host environment.

**Consequences:**
- Storybook screenshots cannot be used as definitive visual regression baselines for in-plugin appearance.
- Font rendering, line heights, and scroll behavior differ between Storybook and the actual plugin.
- Developers may iterate on Storybook appearance only to find the plugin looks different.

**Prevention:**
- In Storybook's `preview.ts` (or `preview.js`), apply a decorator that wraps all stories in a container mimicking Figma's base styles:
  ```typescript
  import type { Decorator } from '@storybook/react';
  export const decorators: Decorator[] = [
    (Story) => (
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', margin: 0, padding: '8px' }}>
        <Story />
      </div>
    ),
  ];
  ```
- Import the same `figma-plugin-ds.css` in Storybook's `preview.ts` via `import '../../../packages/ui/node_modules/react-figma-ui/figma-plugin-ds.css'` (or via the package path once installed).
- Document explicitly: "Storybook is for development and documentation, not pixel-perfect plugin preview. Use `turbo dev` + Figma Desktop for visual validation."

**Detection:**
- Components in Storybook render with different font sizes or spacing than in the actual plugin.
- `figma-plugin-ds` button components look unstyled or incorrectly sized in Storybook.

**Phase to address:**
Phase 2 (Storybook configuration) — Storybook preview setup.

---

## Minor Pitfalls

### Pitfall 16: Storybook `stories` Glob Pattern Must Cross Package Boundaries Explicitly

**What goes wrong:**
Storybook's default stories glob in a new installation (`['../src/**/*.stories.@(js|jsx|ts|tsx)']`) looks only within the package where `.storybook/` lives. If stories are co-located with components in `packages/ui/src/`, the Storybook package (`packages/storybook`) will not find them unless the glob explicitly reaches into the workspace package.

**Prevention:**
In `.storybook/main.ts`:
```typescript
stories: [
  '../../packages/ui/src/**/*.stories.@(js|jsx|ts|tsx)',
  '../../packages/ui/src/**/*.mdx',
],
```
Confirm that Turborepo's task inputs for the `storybook` task include `packages/ui/src/**` so a change to a story file in `packages/ui` triggers a Storybook rebuild.

**Phase to address:** Phase 2 (Storybook configuration).

---

### Pitfall 17: Turborepo Task Graph Must Include Storybook as a `packages/ui` Dependent

**What goes wrong:**
If `turbo.json` does not declare that the `storybook` task in `packages/storybook` depends on `^build` (or `^dev`) from `packages/ui`, Turborepo may start Storybook before `packages/ui`'s type resolution is ready. In practice, since `packages/ui` is source-only (no build step), this only matters for type-checking tasks — but it is still important for cache invalidation: a change in `packages/ui` components should invalidate the Storybook build cache.

**Prevention:**
In `turbo.json`:
```json
{
  "tasks": {
    "storybook": {
      "dependsOn": ["^build"],
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

**Phase to address:** Phase 2 (Turborepo task pipeline update for Storybook).

---

### Pitfall 18: `figma-plugin-ds.css` Gets Inlined into the Plugin `index.html` Twice

**What goes wrong:**
If `figma-plugin-ds.css` is imported in `packages/ui/src/index.ts` (for Storybook visibility) AND also imported in `apps/figma-plugin/src/ui/main.tsx` (for the plugin), `vite-plugin-singlefile` will inline the CSS twice into `index.html`. The double-injection does not break rendering (CSS rules are idempotent) but it inflates the output file size unnecessarily.

**Prevention:**
- Import `figma-plugin-ds.css` only once, in `apps/figma-plugin/src/ui/main.tsx` (the plugin entry point).
- For Storybook, configure the import via Storybook's `preview.ts` `parameters.backgrounds` or a global decorator, not via the package's `index.ts`.
- After build, check the size of `dist/index.html` — if it grows by more than ~20KB compared to before adding the CSS, a double-import is likely.

**Phase to address:** Phase 1 (react-figma-ui integration) — establish a single CSS import point.

---

## v1.1 Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|----------------|------------|
| Phase 1: react-figma-ui | CSS import strategy | figma-plugin-ds global class names collide with existing SCSS | Audit class names before import; establish single import point |
| Phase 1: react-figma-ui | Package version | Unmaintained package with peer dep warnings | Pin exact version; add type augmentation file if needed |
| Phase 1: react-figma-ui | CSS doubling | singlefile inlines CSS twice if imported in multiple entry points | Import CSS only in `main.tsx`, not in `packages/ui/index.ts` |
| Phase 2: Storybook setup | Lockfile detection | Bun v1.2 `bun.lock` not recognized by Storybook | Create empty `bun.lockb` workaround file immediately |
| Phase 2: Storybook setup | vite-plugin-singlefile | Storybook build corrupted by singlefile plugin | Isolate Storybook Vite config; filter singlefile in viteFinal |
| Phase 2: Storybook setup | SCSS globals | Storybook cannot find SCSS abstract variables | Configure `css.preprocessorOptions.scss.additionalData` in viteFinal |
| Phase 2: Storybook setup | JIT packages | `@repo/ui` TypeScript imports fail in Storybook | Add explicit resolve.alias or vite-tsconfig-paths in viteFinal |
| Phase 2: Storybook setup | Stories glob | Stories in `packages/ui` not found by Storybook | Update stories glob to cross workspace package boundary |
| Phase 2: Storybook setup | Visual mismatch | Components look different vs Figma plugin | Add Figma base styles decorator in preview.ts; document the difference |
| Phase 2: Turborepo | Task graph | Storybook build not invalidated on `packages/ui` change | Add `dependsOn: ["^build"]` to storybook tasks in turbo.json |

---

## v1.1 "Looks Done But Isn't" Checklist

- [ ] **No CSS collisions:** After importing `figma-plugin-ds.css`, open every existing component in Storybook — verify none have unexpectedly changed styling.
- [ ] **Single-file output still clean:** Run `turbo build` after adding react-figma-ui — verify `dist/index.html` has no external CSS `<link>` tags and the file is not significantly larger than expected from one CSS injection.
- [ ] **Storybook dev works:** `bun run storybook` (from `packages/storybook`) starts Storybook and loads at least one story without console errors.
- [ ] **Storybook build works:** `bun run build-storybook` produces a valid `storybook-static/` directory with multiple files (not a single inline HTML).
- [ ] **No npm fallback:** After running any Storybook command, verify no `package-lock.json` was created at the monorepo root.
- [ ] **SCSS variables resolve:** Stories that use components with SCSS variable-dependent styles render with correct colors and spacing (not `undefined` / fallback values).
- [ ] **Path aliases work in Storybook:** A story importing from `@repo/common` or `@repo/ui` resolves without "Cannot find module" errors.
- [ ] **Turborepo cache invalidation:** Change a component in `packages/ui`, run `turbo build-storybook` twice — second run should be a cache hit; third run after the change should be a miss.

---

## v1.1 Sources

- react-figma-ui (JB1905) GitHub: https://github.com/JB1905/react-figma-ui
- figma-plugin-ds (thomas-lowry) GitHub: https://github.com/thomas-lowry/figma-plugin-ds
- react-figma-plugin-ds (alexandrtovmach) with CSS import: https://github.com/alexandrtovmach/react-figma-plugin-ds
- Storybook Vite builder docs: https://storybook.js.org/docs/builders/vite
- Storybook viteFinal API: https://storybook.js.org/docs/api/main-config/main-config-vite-final
- Storybook Sass recipe: https://storybook.js.org/recipes/sass
- Storybook SCSS global variables issue (#18670): https://github.com/storybookjs/storybook/issues/18670
- Bun support broken after v1.2 (Storybook #30366): https://github.com/storybookjs/storybook/issues/30366
- Bun cannot build stories (#30654): https://github.com/storybookjs/storybook/issues/30654
- Storybook bun.lockb workaround (bun.lock not detected): https://github.com/storybookjs/storybook/issues/30366
- Storybook + Turborepo guide: https://turborepo.dev/docs/guides/tools/storybook
- Turborepo Storybook discussion (single vs multiple): https://github.com/vercel/turborepo/discussions/6879
- vite-plugin-singlefile npm/GitHub: https://github.com/richardtallent/vite-plugin-singlefile
- Bun + Storybook monorepo discussion: https://github.com/oven-sh/bun/discussions/12148

---
*Pitfalls research for: v1.1 react-figma-ui + Storybook integration*
*Researched: 2026-04-09*
