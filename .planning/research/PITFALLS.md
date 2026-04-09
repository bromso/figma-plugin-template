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
