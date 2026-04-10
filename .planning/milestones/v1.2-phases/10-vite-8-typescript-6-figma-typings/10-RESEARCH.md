# Phase 10: Vite 8 + TypeScript 6 + Figma Typings - Research

**Researched:** 2026-04-09
**Domain:** Build toolchain upgrades — Vite 8 (Rolldown), TypeScript 6.0, @figma/plugin-typings
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — all implementation choices are at Claude's discretion.

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUILD-01 | Vite upgraded from 6.x to 8.x with Rolldown integration across all workspace configs | Vite 8.0.8 is latest stable; `apps/figma-plugin` Vite config uses `rollupOptions` which auto-converts via compat layer; `apps/storybook` must stay on Vite 6 because Storybook 8.6 only supports up to `^6.0.0` — this is a scope constraint |
| BUILD-02 | TypeScript upgraded from 5.3 to 6.0 with tsconfig targets updated | TS 6.0.2 is latest stable; key breaking changes affect `types` default, `strict` default, `baseUrl` deprecation, and `moduleResolution node` deprecation; most already-correct in this codebase |
| FIG-01 | @figma/plugin-typings upgraded from 1.83 to 1.123 for current Figma API coverage | 1.124.0 is the current latest (was 1.123 at time requirements were written); already installed at 1.124.0 in node_modules but `package.json` still pins `^1.83.0` — needs `package.json` update |
</phase_requirements>

---

## Summary

Phase 10 upgrades three things in `apps/figma-plugin`: Vite 6 → 8, TypeScript 5.3 → 6.0, and @figma/plugin-typings 1.83 → 1.124. The scope is **`apps/figma-plugin` only** — the `apps/storybook` package must remain on Vite 6 because Storybook 8.6 only supports Vite up to `^6.0.0`. Each workspace has its own Vite installation (confirmed: `apps/figma-plugin/node_modules/vite` and `apps/storybook/node_modules/vite` are separate), so upgrading Vite in `apps/figma-plugin/package.json` does not affect Storybook.

Vite 8 ships with Rolldown (Rust bundler replacing Rollup + esbuild). The existing `vite.config.ui.ts` and `vite.config.plugin.ts` use `build.rollupOptions` — Vite 8 provides an auto-conversion compatibility layer so these configs will continue to work, but renaming to `build.rolldownOptions` is the forward-compatible approach. The `@vitejs/plugin-react` must also be upgraded from v4 to v6 because v6 is required by Vite 8 (`peerDependencies: { vite: "^8.0.0" }`), though v5 also works with Vite 8.

TypeScript 6.0 introduces several new defaults that require tsconfig updates: `types` now defaults to `[]` (was auto-discovered), `strict` now defaults to `true` (already set explicitly in all tsconfigs here), `moduleResolution: node` is deprecated in favor of `bundler` (all tsconfigs already use `bundler`). The main required change is adding explicit `"types": ["node"]` in the figma-plugin tsconfigs to preserve Node.js globals.

**Primary recommendation:** Upgrade `apps/figma-plugin/package.json` — bump Vite to `^8.0.0`, TypeScript to `^6.0.0`, @vitejs/plugin-react to `^6.0.0`, @figma/plugin-typings to `^1.124.0`, @types/node to `^24.0.0`. Update the two Vite configs to use `rolldownOptions`, update tsconfigs to add explicit `types` arrays, run `bun install` and verify `bun run build` and `bun run types`.

---

## Standard Stack

### Core (apps/figma-plugin scope)
| Library | Current | Target | Purpose | Source |
|---------|---------|--------|---------|--------|
| vite | 6.4.2 (installed) | 8.0.8 | Build tool with Rolldown bundler | [VERIFIED: npm registry] |
| typescript | 5.9.3 (installed) | 6.0.2 | Type checker | [VERIFIED: npm registry] |
| @figma/plugin-typings | 1.124.0 (installed) | 1.124.0 | Figma Plugin API types | [VERIFIED: npm registry] |
| @vitejs/plugin-react | 4.x (package.json) | 6.0.1 | React Refresh + JSX transform | [VERIFIED: npm registry] |
| @types/node | 20.x | 24.0.0+ | Node.js type definitions | [VERIFIED: npm registry] |

### Supporting (already compatible, no change needed)
| Library | Version | Purpose | Vite 8 Compatible | Source |
|---------|---------|---------|-------------------|--------|
| vite-plugin-singlefile | 2.3.2 | Inline all assets to HTML | Yes (`^8.0.0` in peerDeps) | [VERIFIED: npm registry] |
| vite-plugin-react-rich-svg | 1.3.0 | Multi-mode SVG import | No (`^5 || ^6 || ^7` only) — see Pitfalls | [VERIFIED: npm registry] |
| vite-plugin-generate-file | 0.3.1 | Generate manifest.json | No official Vite 8 peerDep — see Pitfalls | [VERIFIED: npm registry] |
| vitest | 4.1.4 | Test runner | Yes (`^6.0.0 || ^7.0.0 || ^8.0.0` in peerDeps) | [VERIFIED: npm registry] |
| postcss-url | 10.1.3 | Inline CSS assets | No change needed | [VERIFIED: npm registry] |

**NOTE on Storybook:** `apps/storybook` has `"vite": "^6.0.0"` in its own package.json. Storybook 8.6.18 declares `peerDependencies: { vite: "^4.0.0 || ^5.0.0 || ^6.0.0" }` — Vite 8 is NOT supported until Storybook 10. Each app has its own `node_modules/vite` install, so upgrading `apps/figma-plugin` does not affect `apps/storybook`. Do NOT touch `apps/storybook/package.json` in this phase. [VERIFIED: npm registry]

**Installation (apps/figma-plugin only):**
```bash
cd apps/figma-plugin
bun add --dev vite@^8.0.0 typescript@^6.0.0 @vitejs/plugin-react@^6.0.0 @figma/plugin-typings@^1.124.0 "@types/node@^24.0.0"
```

Or edit `apps/figma-plugin/package.json` devDependencies and run `bun install` from repo root.

**Version verification (confirmed against npm registry 2026-04-09):**
- vite: `8.0.8` (latest stable, released March 2026) [VERIFIED: npm registry]
- typescript: `6.0.2` (latest stable, released March 2026) [VERIFIED: npm registry]
- @figma/plugin-typings: `1.124.0` (latest) [VERIFIED: npm registry]
- @vitejs/plugin-react: `6.0.1` (latest, requires Vite `^8.0.0`) [VERIFIED: npm registry]
- @types/node: `25.5.2` is latest but `^24.0.0` is sufficient [VERIFIED: npm registry]

---

## Architecture Patterns

### Recommended Project Structure (no change)
Phase 10 is a dependency upgrade — no structural changes to `src/`. Configuration files change, not source layout.

```
apps/figma-plugin/
├── package.json          # bump versions
├── vite.config.ui.ts     # rollupOptions → rolldownOptions
├── vite.config.plugin.ts # rollupOptions → rolldownOptions, target stays es2017
├── tsconfig.json         # add explicit "types" array
└── tsconfig.node.json    # add explicit "types" array, fix moduleResolution
```

### Pattern 1: Vite 8 Config — rolldownOptions

**What:** Rename `build.rollupOptions` to `build.rolldownOptions` in both Vite configs.

**When to use:** Always when writing Vite 8 configs — the compat layer auto-converts `rollupOptions` but emits deprecation warnings.

**Example (`vite.config.plugin.ts` after upgrade):**
```typescript
// Source: https://vite.dev/guide/migration (Vite 8 migration guide)
export default defineConfig(({ mode }) => ({
  build: {
    rolldownOptions: {        // was: rollupOptions
      input: path.resolve(__dirname, "src/plugin/plugin.ts"),
      output: {
        entryFileNames: "plugin.js",
      },
    },
  },
}));
```

**Example (`vite.config.ui.ts` after upgrade):**
```typescript
// Source: https://vite.dev/guide/migration
export default defineConfig(({ mode }) => ({
  build: {
    rolldownOptions: {        // was: rollupOptions
      input: path.resolve(uiSrcPath, "index.html"),
    },
  },
}));
```

### Pattern 2: TypeScript 6 tsconfig — explicit types array

**What:** Add `"types"` explicitly to prevent TypeScript 6's new default of `[]` from dropping ambient type packages.

**When to use:** Required in every tsconfig when upgrading to TypeScript 6.0.

**Example (`tsconfig.json` in apps/figma-plugin):**
```json
// Source: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
{
  "compilerOptions": {
    "types": ["node"],
    "typeRoots": ["./node_modules/@figma", "../../node_modules/@types"]
  }
}
```

**Note on existing `typeRoots`:** The figma-plugin `tsconfig.json` already uses `typeRoots` to include `@figma` typings (for the Figma API globals). Adding `"types": ["node"]` makes the Node.js types explicit under the new default. The `@figma/plugin-typings` package does not use the `types` array — it is loaded via `typeRoots`.

**Example (`tsconfig.node.json` in apps/figma-plugin):**
```json
// Source: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",   // was: Node (deprecated in TS 6)
    "types": ["node"],
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["*.ts", "vite.config.*.ts"]
}
```

`tsconfig.node.json` currently uses `"moduleResolution": "Node"` — this is deprecated in TypeScript 6.0. It should be changed to `"bundler"` since this config is used to type-check Vite config files (bundler context).

### Pattern 3: @vitejs/plugin-react v6 — no Babel options

**What:** `@vitejs/plugin-react` v6 removes the `babel` option and uses Oxc for React Refresh. The existing config uses `react()` with no options, so no changes are needed in `vite.config.ui.ts`.

**When to use:** The existing call `react()` works unchanged. Only breaks if you used `babel: { plugins: [...] }` option.

```typescript
// Source: https://github.com/vitejs/vite-plugin-react/releases/tag/plugin-react@6.0.0
// No change needed — react() with no options works identically in v5 and v6
plugins: [react(), richSvg(), viteSingleFile()],
```

### Anti-Patterns to Avoid

- **Keep `rollupOptions` without migrating:** The compat layer auto-converts it but emits deprecation warnings. Success criterion requires "no deprecation errors."
- **Removing `typeRoots` from figma-plugin tsconfig:** The Figma API globals (like `figma.*`) are loaded via `typeRoots: ["./node_modules/@figma"]`. This must be preserved when adding `types: ["node"]`.
- **Upgrading `apps/storybook` Vite in this phase:** Storybook 8.6 doesn't support Vite 8. Storybook upgrade is Phase 14 scope.
- **Forgetting `tsconfig.node.json`:** The `bun run types` command runs BOTH `tsc --noEmit` (uses main tsconfig) AND `tsc --noEmit -p tsconfig.node.json`. Both must pass.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| rollupOptions migration | Manual option-by-option translation | Vite 8 compat layer + rename to `rolldownOptions` | 95%+ of options auto-convert correctly |
| TypeScript types migration | Manual audit of all globals | `"types": ["node"]` explicit array | TS 6 tooling (`npx @andrewbranch/ts5to6`) handles mechanical parts |
| Plugin compatibility testing | Custom test harness | `bun run build` smoke test | Rolldown is designed as a drop-in replacement |

**Key insight:** Vite 8 was engineered for maximum backwards compatibility. The primary risk is plugins with restrictive `peerDependencies` (vite-plugin-react-rich-svg, vite-plugin-generate-file) — but peer dependency warnings in Bun are non-fatal and both plugins use standard Vite plugin APIs expected to work.

---

## Common Pitfalls

### Pitfall 1: vite-plugin-react-rich-svg peerDependencies mismatch
**What goes wrong:** `vite-plugin-react-rich-svg@1.3.0` declares `peerDependencies: { vite: "^5 || ^6 || ^7" }` — does not include `^8.0.0`. Bun will warn but NOT fail install. The plugin may still work since it uses standard Vite plugin APIs and Vite 8 maintains plugin API compatibility.
**Why it happens:** Plugin has not been updated for Vite 8 yet (published 7 months ago, no Vite 8 release available as of 2026-04-09).
**How to avoid:** Run `bun run build` after upgrade to verify SVG imports still work. If they fail, the fallback is `vite-plugin-svgr` (which has active Vite 8 support) — but test first since the existing plugin likely works.
**Warning signs:** Build errors in `*.svg?component`, `*.svg?url`, or `*.svg?raw` imports. [VERIFIED: npm registry peerDependencies]

### Pitfall 2: vite-plugin-generate-file peerDependencies mismatch
**What goes wrong:** `vite-plugin-generate-file@0.3.1` does not declare `^8.0.0` in peerDependencies. Same situation as above — peer dep warning only, likely works in practice since it uses simple Vite `generateBundle` hook.
**Why it happens:** Plugin is at version 0.3.1 with no updates for Vite 8.
**How to avoid:** Verify `dist/manifest.json` is generated correctly after `bun run build`. [VERIFIED: npm registry]

### Pitfall 3: TypeScript 6 `types` default drops @types/node
**What goes wrong:** TypeScript 6.0 changed `types` default from auto-discover to `[]`. Without explicit `"types": ["node"]`, tsc will no longer find `process`, `Buffer`, Node.js `setTimeout` overloads, etc. The `tsconfig.node.json` covers Vite config files which use `node:path` — this WILL break.
**Why it happens:** TypeScript 6.0 default change for build performance and explicitness.
**How to avoid:** Add `"types": ["node"]` to `apps/figma-plugin/tsconfig.json` AND `tsconfig.node.json`.
**Warning signs:** `Cannot find name 'process'`, `Cannot find module 'node:path'` type errors. [CITED: devblogs.microsoft.com/typescript/announcing-typescript-6-0/]

### Pitfall 4: TypeScript 6 deprecates `moduleResolution: Node` in tsconfig.node.json
**What goes wrong:** `apps/figma-plugin/tsconfig.node.json` uses `"moduleResolution": "Node"` (the old Node10 resolution). TypeScript 6.0 deprecated this — it will emit deprecation warnings and may fail strict type checks.
**Why it happens:** TypeScript 6.0 explicitly deprecated `node` (node10) resolution in favor of `nodenext` or `bundler`.
**How to avoid:** Change `tsconfig.node.json` to use `"moduleResolution": "bundler"` (correct for Vite config files) and add `"module": "ESNext"` if not already present.
**Warning signs:** TS6385 deprecation warning for `--moduleResolution node`. [CITED: devblogs.microsoft.com/typescript/announcing-typescript-6-0/]

### Pitfall 5: Storybook breaks if its Vite gets upgraded
**What goes wrong:** If Bun deduplicates Vite and uses the workspace root's `node_modules`, `apps/storybook` might end up using Vite 8. Storybook 8.6 will fail with Vite 8.
**Why it happens:** Bun workspaces sometimes hoist shared dependencies.
**How to avoid:** Upgrade only `apps/figma-plugin/package.json`. Verify after `bun install` that `apps/storybook/node_modules/vite` still resolves to 6.x by checking installed version, OR ensure `apps/storybook/package.json` pins `"vite": "^6.0.0"` (it currently does).
**Warning signs:** Storybook fails to start after running `bun run storybook`. [VERIFIED: Storybook 8.6.18 peerDeps from npm registry]

### Pitfall 6: @figma/plugin-typings FIG-01 success criterion (1.123) already exceeded
**What goes wrong:** The success criterion says "1.123" but 1.124.0 is already installed. The `package.json` still pins `^1.83.0` so it will resolve to 1.83.x on a clean install.
**Why it happens:** The lockfile installed 1.124.0 but the version range in `package.json` is `^1.83.0` which covers 1.83.x only (semver patch range).
**How to avoid:** Update `package.json` to `^1.124.0` (or `^1.123.0` to match the requirement). After `bun install`, the lockfile will resolve to the latest compatible version.
**Warning signs:** CI or clean-install gets 1.83.x instead of 1.124.x. [VERIFIED: npm registry + local node_modules check]

### Pitfall 7: `bun run types` script not available at repo root
**What goes wrong:** The success criterion says `bun run types` type-checks cleanly under TypeScript 6.0. This script exists in `apps/figma-plugin/package.json` but NOT in the root `package.json` or `turbo.json`.
**Why it happens:** The `types` task was never added to the Turborepo task graph.
**How to avoid:** Either (1) add `"types": "turbo run types"` to the root `package.json` scripts and add a `"types"` task to `turbo.json`, OR (2) accept that the success criterion is verified by running `bun run --filter @repo/figma-plugin types`. The plan should clarify which approach to use.
**Warning signs:** `bun run types` at repo root returns "No package found" or "script not found". [VERIFIED: root package.json + turbo.json inspection]

---

## Code Examples

Verified patterns from official sources:

### Final apps/figma-plugin/package.json devDependencies (target state)
```json
// Source: npm registry version verification 2026-04-09
"devDependencies": {
  "@figma/plugin-typings": "^1.124.0",
  "@types/node": "^24.0.0",
  "@vitejs/plugin-react": "^6.0.0",
  "postcss-url": "^10.1.3",
  "sass": "^1.60.0",
  "typescript": "^6.0.0",
  "vite": "^8.0.0",
  "vite-plugin-generate-file": "^0.3.1",
  "vite-plugin-react-rich-svg": "^1.3.0",
  "vite-plugin-singlefile": "^2.3.2"
}
```

### Final apps/figma-plugin/tsconfig.json (relevant changes)
```json
// Source: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
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
    "isolatedModules": true,
    "jsx": "react-jsx",
    "types": ["node"],
    "typeRoots": ["./node_modules/@figma", "../../node_modules/@types"],
    "paths": {
      "monorepo-networker": ["./node_modules/monorepo-networker/dist/index.d.ts"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

### Final apps/figma-plugin/tsconfig.node.json (relevant changes)
```json
// Source: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
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

### vite.config.plugin.ts rolldownOptions migration
```typescript
// Source: https://vite.dev/guide/migration (Vite 8 migration)
build: {
  rolldownOptions: {          // renamed from rollupOptions
    input: path.resolve(__dirname, "src/plugin/plugin.ts"),
    output: {
      entryFileNames: "plugin.js",
    },
  },
},
```

### vite.config.ui.ts rolldownOptions migration
```typescript
// Source: https://vite.dev/guide/migration
build: {
  rolldownOptions: {          // renamed from rollupOptions
    input: path.resolve(uiSrcPath, "index.html"),
  },
},
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Rollup + esbuild dual bundler | Rolldown (Rust, unified) | Vite 8 (March 2026) | 10-30x faster builds |
| `build.rollupOptions` | `build.rolldownOptions` | Vite 8 | Config rename; compat layer bridges old syntax |
| esbuild transforms | Oxc transforms | Vite 8 / plugin-react 6 | Same semantics, faster |
| TypeScript `types: []` auto-discover | `types: []` explicit empty | TypeScript 6.0 (March 2026) | Must add `"types": ["node"]` explicitly |
| `moduleResolution: node` | Deprecated — use `bundler` or `nodenext` | TypeScript 6.0 | tsconfig.node.json needs update |
| Lightning CSS default off | Lightning CSS default ON | Vite 8 | CSS minification changes; `build.cssMinify: 'esbuild'` reverts |

**Deprecated/outdated in this codebase after upgrade:**
- `build.rollupOptions`: Replaced by `build.rolldownOptions` in Vite 8 config (auto-converted but deprecated)
- `"moduleResolution": "Node"` in tsconfig.node.json: Deprecated in TypeScript 6.0
- `@types/node@^20.0.0`: No longer compatible with latest `@types/node@25.x` but `^24.0.0` is sufficient

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | vite-plugin-react-rich-svg@1.3.0 works with Vite 8 despite peerDep mismatch | Standard Stack / Pitfalls | SVG imports break at build time; would need alternative SVG plugin |
| A2 | vite-plugin-generate-file@0.3.1 works with Vite 8 despite peerDep mismatch | Standard Stack / Pitfalls | manifest.json not generated; would need alternative |
| A3 | Adding `"types": ["node"]` is sufficient to restore Node.js globals under TS 6 | Code Examples | Additional @types packages might be needed; tsc output reveals specifics |
| A4 | Bun workspace deduplication does not force storybook to use Vite 8 | Pitfalls | Storybook build breaks; needs explicit pin in apps/storybook/package.json |

---

## Open Questions (RESOLVED)

1. **Should `bun run types` be promoted to root-level turbo task?**
   - RESOLVED: Yes — Plan 10-02 adds root-level turbo `types` task and root `package.json` script, delegating to the figma-plugin package. Matches existing patterns (build, lint, test).

2. **Should vite-plugin-react-rich-svg be tested or preemptively swapped for vite-plugin-svgr?**
   - RESOLVED: Keep rich-svg, verify with smoke test in Plan 10-02. Swap to vite-plugin-svgr only if build fails. Phase 12+ restructures UI anyway.

3. **@figma/plugin-typings version: 1.123 vs 1.124?**
   - RESOLVED: Target `^1.124.0` (latest stable). Plan 10-01 updates package.json accordingly.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun | Package manager | Yes | 1.3.11 | — |
| Node.js | Vite 8 requirement (>=20.19 or >=22.12) | Yes | v24.6.0 | — |
| tsc (TypeScript 5.9.3) | types script (current) | Yes | 5.9.3 | — |
| npm registry | Version lookup | Yes | — | — |

**Missing dependencies with no fallback:** None.

**Node.js version note:** Vite 8 requires Node.js >=20.19+ or >=22.12+. Current environment has Node v24.6.0 — satisfies requirement. [VERIFIED: local environment]

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `packages/ui/vitest.config.ts`, `packages/common/vitest.config.ts` |
| Quick run command | `bun run --filter @repo/ui test` |
| Full suite command | `bun run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUILD-01 | `bun run build` completes without errors using Vite 8 | smoke | `bun run --filter @repo/figma-plugin build` | N/A (build smoke) |
| BUILD-01 | Both Vite configs run without deprecation errors | smoke | `bun run --filter @repo/figma-plugin build 2>&1 \| grep -i deprecat` | N/A (output check) |
| BUILD-02 | Type-checks cleanly under TypeScript 6.0 | types | `bun run --filter @repo/figma-plugin types` | ✅ (script exists) |
| FIG-01 | @figma/plugin-typings 1.123+ resolves Figma API symbols | types | `bun run --filter @repo/figma-plugin types` (same check) | ✅ |
| BUILD-01 | Existing unit tests pass after upgrade | unit | `bun run test` | ✅ existing tests |

### Sampling Rate
- **Per task commit:** `bun run --filter @repo/figma-plugin types`
- **Per wave merge:** `bun run build && bun run test`
- **Phase gate:** Full suite green + build smoke before `/gsd-verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers verification. No new test files needed for a dependency upgrade phase. The primary verification is `bun run build` (BUILD-01) and `bun run --filter @repo/figma-plugin types` (BUILD-02, FIG-01).

---

## Security Domain

> `security_enforcement` not configured — treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | No | Build toolchain upgrade — no input paths change |
| V6 Cryptography | No | — |

**Security assessment:** Phase 10 is a pure dependency version upgrade with no changes to application logic, authentication, or data handling. The primary security consideration is supply chain integrity — ensure packages are installed from npm registry (not compromised mirrors). Bun's lockfile (`bun.lock`) will be updated and should be committed to git to pin exact resolved versions. [ASSUMED — standard practice for dependency upgrades]

---

## Sources

### Primary (HIGH confidence)
- npm registry (via `npm view`) — verified versions: vite@8.0.8, typescript@6.0.2, @figma/plugin-typings@1.124.0, @vitejs/plugin-react@6.0.1, vite-plugin-singlefile@2.3.2, vitest@4.1.4
- [Vite 8 Migration Guide](https://vite.dev/guide/migration) — rolldownOptions rename, CJS interop, compat layer behavior
- [Vite 8 Announcement](https://vite.dev/blog/announcing-vite8) — Rolldown integration, plugin-react v6 details, Node.js minimum versions
- [TypeScript 6.0 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) — breaking changes, new defaults, deprecated options

### Secondary (MEDIUM confidence)
- Local codebase inspection — confirmed current installed versions, tsconfig contents, vite config structure, package.json scripts, separate per-workspace Vite installations
- [vite-plugin-singlefile GitHub package.json](https://github.com/richardtallent/vite-plugin-singlefile/blob/main/package.json) — confirmed Vite 8 in peerDependencies
- npm peerDependencies checks — Storybook 8.6.18 confirmed NOT supporting Vite 8

### Tertiary (LOW confidence)
- WebSearch summaries for TypeScript 6.0 `types` default changes — corroborated by official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified from npm registry
- Architecture: HIGH — based on official Vite 8 and TypeScript 6.0 docs
- Pitfalls: HIGH for TS6 and Storybook isolation; MEDIUM for vite-plugin-react-rich-svg (peerDep mismatch risk is real but runtime behavior is unknown without testing)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable releases; Vite 8 and TS 6 are recent stable releases unlikely to have major breaking patch updates)
