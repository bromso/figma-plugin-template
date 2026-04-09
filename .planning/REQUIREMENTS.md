# Requirements: Figma Plugin Template

**Defined:** 2026-04-09
**Core Value:** A ready-to-use Figma plugin template with modern tooling and excellent developer experience

## v1.0 Requirements

Requirements for monorepo & DX overhaul. Each maps to roadmap phases.

### Monorepo Structure

- [ ] **MONO-01**: Project uses `apps/figma-plugin` + `packages/ui` + `packages/common` directory layout
- [ ] **MONO-02**: Root `package.json` declares Bun workspaces (`apps/*`, `packages/*`) with `"private": true`
- [ ] **MONO-03**: Internal packages use `workspace:*` protocol for dependencies
- [ ] **MONO-04**: Each package has `package.json` with explicit `exports` field
- [ ] **MONO-05**: Internal packages use `@repo/` namespace (`@repo/ui`, `@repo/common`)
- [ ] **MONO-06**: VS Code `.code-workspace` file with multi-root workspace configuration

### Build Pipeline

- [ ] **BUILD-01**: Root `turbo.json` with `build`, `dev`, `lint`, `test`, `test:watch` tasks
- [ ] **BUILD-02**: Build tasks use `"dependsOn": ["^build"]` for topological ordering
- [ ] **BUILD-03**: Vite upgraded from v5 to v6 with all plugins compatible
- [ ] **BUILD-04**: Both Vite builds (plugin + UI) produce valid single-file output in `dist/`
- [ ] **BUILD-05**: `bun run dev` starts parallel watch mode for plugin and UI builds
- [ ] **BUILD-06**: Old lockfiles (`package-lock.json`, `pnpm-lock.yaml`) removed; Bun is sole package manager
- [ ] **BUILD-07**: `packageManager` field set correctly in root `package.json`

### Code Quality

- [ ] **LINT-01**: Root `biome.json` with both linting and formatting enabled
- [ ] **LINT-02**: Biome configured for TypeScript + React/JSX
- [ ] **LINT-03**: `bun run lint` checks all packages via Turborepo

### Testing

- [ ] **TEST-01**: Vitest configured with per-package `vitest.config.ts` files
- [ ] **TEST-02**: Each testable package has its own `test` script
- [ ] **TEST-03**: `test:watch` task declared with `cache: false, persistent: true` in turbo.json
- [ ] **TEST-04**: `packages/common` tests run in node environment
- [ ] **TEST-05**: `packages/ui` tests run with DOM environment (happy-dom)

### VS Code DX

- [ ] **VSDX-01**: `.vscode/settings.json` with Biome as default formatter and formatOnSave
- [ ] **VSDX-02**: `.vscode/extensions.json` recommending Biome, Vitest, and Vite extensions
- [ ] **VSDX-03**: `.vscode/launch.json` with debug configurations for plugin and UI
- [ ] **VSDX-04**: `.vscode/tasks.json` with dev shortcuts (`bun run dev`, `bun run build`)

## Future Requirements

### v1.x

- **LINT-F01**: Per-package nested Biome configs with `"extends": ["//"]`
- **TEST-F01**: Vitest hybrid projects config (root dev + per-package CI)
- **BUILD-F01**: Turborepo remote cache configuration

### v2+

- **INFRA-01**: CI/CD pipeline
- **DOCS-01**: Documentation site
- **TMPL-01**: Additional plugin templates

## Out of Scope

| Feature | Reason |
|---------|--------|
| ESLint / Prettier | Fully replaced by Biome — no dual-linting |
| npm / pnpm support | Bun is the sole package manager; old lockfiles deleted |
| Root-level Vitest workspace config | Breaks Turborepo per-package caching |
| Changesets / package publishing | Packages are internal only, not published to npm |
| CI/CD pipeline | Deferred to future milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MONO-01 | — | Pending |
| MONO-02 | — | Pending |
| MONO-03 | — | Pending |
| MONO-04 | — | Pending |
| MONO-05 | — | Pending |
| MONO-06 | — | Pending |
| BUILD-01 | — | Pending |
| BUILD-02 | — | Pending |
| BUILD-03 | — | Pending |
| BUILD-04 | — | Pending |
| BUILD-05 | — | Pending |
| BUILD-06 | — | Pending |
| BUILD-07 | — | Pending |
| LINT-01 | — | Pending |
| LINT-02 | — | Pending |
| LINT-03 | — | Pending |
| TEST-01 | — | Pending |
| TEST-02 | — | Pending |
| TEST-03 | — | Pending |
| TEST-04 | — | Pending |
| TEST-05 | — | Pending |
| VSDX-01 | — | Pending |
| VSDX-02 | — | Pending |
| VSDX-03 | — | Pending |
| VSDX-04 | — | Pending |

**Coverage:**
- v1.0 requirements: 25 total
- Mapped to phases: 0
- Unmapped: 25

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initial definition*
