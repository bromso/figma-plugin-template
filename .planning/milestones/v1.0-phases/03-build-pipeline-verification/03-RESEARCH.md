# Phase 3: Build Pipeline Verification - Research

**Researched:** 2026-04-09
**Domain:** Vite 6 upgrade, ESM plugin compatibility, Turborepo build pipeline
**Confidence:** HIGH

## Summary

The build pipeline is currently broken. Running `turbo run build` fails immediately because Vite 5 uses a CommonJS config loader that cannot `require()` ESM-only plugins at config-load time. Specifically, `vite-plugin-react-rich-svg@1.3.0` ships as `"type": "module"` with no CJS entry — Vite 5's esbuild-based config loading chokes on it. Upgrading to Vite 6 resolves this because Vite 6 switched to native ESM config loading.

All three Vite plugins used in this project (`vite-plugin-singlefile@2.3.2`, `vite-plugin-react-rich-svg@1.3.0`, `vite-plugin-generate-file@0.3.1`) already declare Vite 6 in their `peerDependencies`. The installed `@vitejs/plugin-react@4.7.0` also supports Vite 4 through 7. The Sass config already uses `api: "modern-compiler"` which is the Vite 6 default. In other words, the only change required at the package level is bumping `"vite": "^5.0.11"` to `"vite": "^6.0.0"` in `apps/figma-plugin/package.json` and re-running `bun install`.

The `bun run dev` path (`turbo run dev` → `@repo/figma-plugin:dev` → `bun run --parallel dev:ui-watch dev:plugin-watch`) is architecturally correct and will work once the Vite version is resolved.

**Primary recommendation:** Upgrade `vite` to `^6.0.0` in `apps/figma-plugin/package.json`, run `bun install` to refresh `bun.lock`, then verify both builds produce `dist/plugin.js` and `dist/index.html`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — auto-generated infrastructure phase, discuss skipped.

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUILD-03 | Vite upgraded from v5 to v6 with all plugins compatible | All plugins confirmed Vite 6 compatible via npm registry peerDependencies; only version bump needed |
| BUILD-04 | Both Vite builds (plugin + UI) produce valid single-file output in `dist/` | Both configs already use `viteSingleFile()` and `outDir: dist/`; Vite 6 upgrade unblocks build |
| BUILD-05 | `bun run dev` starts parallel watch mode for plugin and UI builds | Root `bun run dev` → `turbo run dev` → app `dev` script already wired for parallel `--watch` |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Package manager:** Bun only — no npm/pnpm commands
- **Build command:** `bun run build` at root (runs `turbo run build`)
- **Dev command:** `bun run dev` (runs `turbo run dev`)
- **Type check:** `bun run types` from `apps/figma-plugin/` (tsc --noEmit on both tsconfigs)
- **Two separate Vite configs:** `vite.config.ui.ts` (UI → singlefile HTML) and `vite.config.plugin.ts` (plugin → plugin.js)
- **Output target:** `apps/figma-plugin/dist/` — all build artifacts land here
- **No test framework configured** — no test tasks for this phase
- **SCSS with CSS Modules** — preprocessor options must remain intact in vite.config.ui.ts

## Standard Stack

### Core (installed in `apps/figma-plugin/`)

| Library | Installed | Target | Purpose | Notes |
|---------|-----------|--------|---------|-------|
| vite | 5.4.21 | ^6.4.2 | Bundler | Must upgrade — root cause of build failure |
| @vitejs/plugin-react | 4.7.0 | 4.7.0 (no change) | React/JSX transform | Already supports Vite 6 [VERIFIED: npm registry] |
| vite-plugin-singlefile | 2.3.2 | 2.3.2 (no change) | Inline all assets into single HTML | Peer: `^5.4.11 \|\| ^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0` [VERIFIED: npm registry] |
| vite-plugin-react-rich-svg | 1.3.0 | 1.3.0 (no change) | SVG multi-mode imports | Peer: `^5 \|\| ^6 \|\| ^7`; ESM-only (causes Vite 5 failure) [VERIFIED: npm registry] |
| vite-plugin-generate-file | 0.3.1 | 0.3.1 (no change) | Generate manifest.json at build | No peerDeps declared; ships CJS+ESM [VERIFIED: npm registry] |
| sass | 1.99.0 | no change | SCSS compilation | Already using modern-compiler API |
| postcss-url | 10.1.3 | no change | Inline fonts/assets via PostCSS | Used in UI build only |

### Version Verification

Verified via `npm view [package] version` on 2026-04-09:

| Package | Latest | Action |
|---------|--------|--------|
| vite | 6.4.2 | Bump to `^6.0.0` (latest 6.x = 6.4.2) [VERIFIED: npm registry] |
| @vitejs/plugin-react | 6.0.1 (v6 requires Vite 8) | Keep at `^4.0.0`; v4.7.0 already installed and supports Vite 6 [VERIFIED: npm registry] |
| vite-plugin-singlefile | 2.3.2 | No change needed [VERIFIED: npm registry] |
| vite-plugin-react-rich-svg | 1.3.0 | No change needed [VERIFIED: npm registry] |
| vite-plugin-generate-file | 0.3.1 | No change needed [VERIFIED: npm registry] |

**Installation command (only change needed):**
```bash
# In apps/figma-plugin/ — after editing package.json
bun install
```

## Architecture Patterns

### Build Pipeline Flow

```
bun run build (root)
  └── turbo run build
        └── @repo/figma-plugin:build (only package with build script)
              ├── build:ui   → vite build -c vite.config.ui.ts
              │     ├── root: packages/ui/src/
              │     ├── input: packages/ui/src/index.html
              │     └── output: apps/figma-plugin/dist/index.html (fully inlined)
              └── build:plugin → vite build -c vite.config.plugin.ts
                    ├── input: apps/figma-plugin/src/plugin/plugin.ts
                    └── output: apps/figma-plugin/dist/plugin.js
```

```
bun run dev (root)
  └── turbo run dev
        └── @repo/figma-plugin:dev
              └── bun run --parallel dev:ui-watch dev:plugin-watch
                    ├── vite build --watch -c vite.config.ui.ts
                    └── vite build --watch -c vite.config.plugin.ts
```

### Vite Config Structure

Two separate configs in `apps/figma-plugin/`:

**vite.config.ui.ts** — builds the iframe UI:
- `root` and `input` resolve to `../../packages/ui/src/` using `path.resolve(__dirname, ...)`
- `outDir` resolves to `./dist` (the app's local dist/)
- Plugins: `react()`, `richSvg()`, `viteSingleFile()`
- PostCSS: `postcss-url` inlines fonts and image assets
- SCSS: `api: "modern-compiler"` (already set, aligns with Vite 6 default)

**vite.config.plugin.ts** — builds the sandboxed plugin code:
- `input`: `src/plugin/plugin.ts`
- `output`: `plugin.js` (single file, es2017 target for Figma compat)
- Plugins: `viteSingleFile()`, `generateFile()` (emits `manifest.json`)
- Has `@plugin` alias pointing to `src/plugin/`

### Singlefile Constraint

`viteSingleFile()` inlines ALL assets (CSS, fonts, images, scripts) into the HTML. This is Figma's requirement — the UI runs in an iframe that only receives a single HTML string. The PostCSS `postcss-url` plugin handles font inlining within CSS before `viteSingleFile` processes it.

### JIT Packages (no build step required)

`@repo/common` and `@repo/ui` export TypeScript source directly (`"./src/index.ts"`). Vite resolves these at bundle time in the app — no pre-build step. Turborepo's `"dependsOn": ["^build"]` will find no build script in those packages and skip them correctly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Inline all assets into HTML | Custom inline script | `vite-plugin-singlefile` | Handles CSS extraction, base64 encoding, script inlining, edge cases |
| Multi-mode SVG imports | Custom Vite plugin | `vite-plugin-react-rich-svg` | Handles SVGR transform, data URI, raw modes via query suffix |
| Figma manifest generation | Write manifest.json manually | `vite-plugin-generate-file` | Generates from TypeScript at build time, stays in sync |

## Common Pitfalls

### Pitfall 1: ESM-Only Plugin Fails on Vite 5

**What goes wrong:** `vite-plugin-react-rich-svg@1.3.0` ships as `"type": "module"` with only a `.mjs` entry. Vite 5's config loader (based on esbuild's Node.js CJS bundler) tries to `require()` it and throws: `"ESM file cannot be loaded by require"`. This is the current failure state.

**Why it happens:** Vite 5 config files are processed via an esbuild-based loader that outputs CJS. That loader's `externalize-deps` plugin fails when it encounters a package with no CJS entry.

**How to avoid:** Upgrade to Vite 6. Vite 6 processes config files as native ESM. [VERIFIED: confirmed from live build failure and Vite 6 migration docs]

**Warning signs:** Error message contains `"ESM file cannot be loaded by require"` and `"externalize-deps"` in the stack.

### Pitfall 2: Wrong `@vitejs/plugin-react` Version for Vite 6

**What goes wrong:** The latest `@vitejs/plugin-react` is v6.x, which requires Vite 8. Installing it with Vite 6 produces peer dependency warnings and may fail.

**Why it happens:** Major versions of `@vitejs/plugin-react` track major Vite versions — but only starting with v6/Vite 8.

**How to avoid:** Keep `@vitejs/plugin-react` at `^4.0.0`. The currently installed v4.7.0 explicitly supports `vite: '^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0'`. [VERIFIED: npm registry peerDependencies]

### Pitfall 3: Sass `modern-compiler` API Alignment

**What goes wrong:** Vite 6 uses the Sass modern-compiler API by default. If the config had been set to `api: "legacy"`, it would generate deprecation warnings that could fail CI.

**Why it's not a risk here:** `vite.config.ui.ts` already explicitly sets `css.preprocessorOptions.scss.api: "modern-compiler"` — aligned with the Vite 6 default. No change needed. [VERIFIED: codebase grep]

### Pitfall 4: `emptyOutDir: false` on Both Configs

**What goes wrong:** If `emptyOutDir` is not `false`, the second build (plugin) would wipe the output from the first build (UI).

**Why it's not a risk here:** Both Vite configs already set `emptyOutDir: false`. The two builds share the same `outDir` (`dist/`) but each writes different files (`index.html` vs `plugin.js` + `manifest.json`). [VERIFIED: codebase]

### Pitfall 5: Turbo `dev` Task Not Marked `persistent: true`

**What goes wrong:** Turborepo terminates `--watch` processes that don't produce output, treating them as hung tasks.

**Why it's not a risk here:** `turbo.json` already marks `dev` with `"cache": false, "persistent": true`. [VERIFIED: codebase — turbo.json]

### Pitfall 6: Cross-Package Imports Failing at Build Time

**What goes wrong:** `vite.config.ui.ts` sets `root` to `../../packages/ui/src`, so Vite resolves modules relative to that directory. Workspace imports like `@repo/common/networkSides` must resolve via Bun symlinks in the consuming app's `node_modules`.

**Why it's not a risk here:** Phase 2 established that Bun places workspace symlinks in the consuming package's local `node_modules/@repo/`. The app's `node_modules/@repo/common` and `@repo/ui` symlinks already exist. [VERIFIED: Phase 2 SUMMARY — confirmed in bun.lock]

## Code Examples

### Vite 6 upgrade — single line change in package.json

```json
// apps/figma-plugin/package.json — only this line changes
{
  "devDependencies": {
    "vite": "^6.0.0"
  }
}
```
[VERIFIED: current installed = 5.4.21, target = 6.4.2]

### Verifying build output (singlefile constraint)

```bash
# After bun run build, verify no external imports in index.html
grep -c 'src=' apps/figma-plugin/dist/index.html
# Expected: 0 (all scripts inlined)
grep -c 'href=' apps/figma-plugin/dist/index.html
# Expected: 0 (all styles inlined)

# Verify plugin.js exists
ls -lh apps/figma-plugin/dist/plugin.js

# Verify manifest.json was generated
cat apps/figma-plugin/dist/manifest.json
```

### Dev mode check

```bash
# Starts both watchers via turbo -> app dev script -> bun --parallel
bun run dev
# Should see two vite build --watch processes starting
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vite 5 CJS config loader | Vite 6 native ESM config | Vite 6.0.0 (Dec 2024) | ESM-only plugins now load without errors |
| Sass legacy API | Sass modern-compiler API (default in Vite 6) | Vite 6.0.0 | Already set in config — no action |
| `json.stringify` disables namedExports | `json.stringify: 'auto'` independent of namedExports | Vite 6.0.0 | Not used in this project — no impact |

**Deprecated/outdated:**
- `vite@^5.0.11` in `apps/figma-plugin/package.json`: Causes ESM plugin load failure; must upgrade to `^6.0.0`

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vite 6 native ESM config loader resolves the `require()` ESM failure | Common Pitfalls #1 | If wrong, plugin code changes or workarounds needed; but this is the documented root cause in Vite 6 release notes |
| A2 | `bun run --parallel` within a turbo `persistent: true` task keeps both watch processes alive indefinitely | Architecture Patterns | If wrong, dev watchers may exit early; mitigation: test during verification |

## Open Questions

1. **Does `vite-plugin-generate-file` handle `emptyOutDir: false` correctly when running after the UI build in the same `dist/` directory?**
   - What we know: The plugin generates `manifest.json` into `./manifest.json` (relative to outDir). Both builds target the same outDir.
   - What's unclear: Whether the plugin has any cleanup behavior that could conflict.
   - Recommendation: Verify `dist/manifest.json` exists after build and is not overwritten. Low risk — the plugin only writes, does not delete.

2. **Will `vite-plugin-singlefile` fully inline the Alkatra.ttf font?**
   - What we know: `postcss-url({ url: "inline" })` handles CSS `url()` references before singlefile runs. The font is referenced from SCSS.
   - What's unclear: Whether the current PostCSS + singlefile combo has changed behavior in Vite 6.
   - Recommendation: Verify the output `index.html` has no external `src=` or `href=` attributes after build.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| bun | Package manager, script runner | ✓ | 1.3.11 | — |
| node | Vite runtime (Vite 6 requires >=18) | ✓ | v24.6.0 | — |
| turbo | Root build/dev orchestration | ✓ | 2.9.5 (in root node_modules) | — |
| vite (current) | Build tool | ✓ | 5.4.21 (installed) | — |

**Node.js requirement for Vite 6:** Node >=18.0.0 required. Node v24.6.0 installed — satisfied. [VERIFIED: npm view vite@6.0.0 engines]

**Missing dependencies with no fallback:** None — all dependencies present.

## Validation Architecture

No test framework is configured in this project (confirmed in CLAUDE.md: "No test framework is configured"). The validation for this phase is manual/build verification:

### Build Verification Commands

| Req ID | Behavior | Verification Command | Pass Condition |
|--------|----------|----------------------|----------------|
| BUILD-03 | Vite 6 installs without peer dep errors | `bun install 2>&1` | Exit 0, no ERR_PEER_DEPS |
| BUILD-04 | Both builds produce valid singlefile output | `turbo run build && ls apps/figma-plugin/dist/` | `dist/index.html` and `dist/plugin.js` present |
| BUILD-04 | UI output has no external imports | `grep -E 'src=|href=' apps/figma-plugin/dist/index.html` | Zero matches (all inlined) |
| BUILD-04 | Manifest generated | `cat apps/figma-plugin/dist/manifest.json` | Valid JSON with correct plugin name |
| BUILD-05 | Dev mode starts | `bun run dev` (Ctrl+C after 10s) | Both `dev:ui-watch` and `dev:plugin-watch` start without error |

### Wave 0 Gaps

None — no test files needed. This phase uses build-output verification, not unit tests.

## Security Domain

This phase makes no security-relevant changes. It is a build tooling upgrade with no new network endpoints, authentication paths, or external surface changes.

ASVS categories: Not applicable — pure build infrastructure.

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] — `npm view vite version`, `npm view vite-plugin-singlefile --json`, `npm view vite-plugin-react-rich-svg --json`, `npm view @vitejs/plugin-react@4.7.0 --json`, `npm view @vitejs/plugin-react@5.2.0 --json`
- [CITED: v6.vite.dev/guide/migration] — Vite 5 to 6 migration guide: Sass modern-compiler default, ESM config loader change, JSON handling changes
- [VERIFIED: codebase] — `apps/figma-plugin/package.json`, both Vite configs, `turbo.json`, `packages/*/package.json` — inspected directly

### Secondary (MEDIUM confidence)
- [CITED: Phase 2 SUMMARY files] — Workspace package structure, import resolution, bun symlink placement

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified against npm registry on 2026-04-09
- Root cause diagnosis: HIGH — confirmed by live build failure output showing exact error
- Architecture: HIGH — verified from actual config files in codebase
- Pitfalls: HIGH — most confirmed from live state; A2 (dev persistence) is MEDIUM

**Research date:** 2026-04-09
**Valid until:** 2026-07-09 (stable tooling, 90-day estimate)
