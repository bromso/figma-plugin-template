# Roadmap: Figma Plugin Template

## Overview

Migrate the existing flat Figma plugin template into a Turborepo monorepo with Bun workspaces, then extract shared packages in dependency order, verify the build pipeline with Vite 6, layer in Biome linting/formatting with VS Code integration, and finally add Vitest testing with developer experience polish. Each phase builds on the previous and produces an independently verifiable state.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Monorepo Scaffolding** - Root workspace config, Bun workspaces, turbo.json with task pipeline
- [ ] **Phase 2: Package Extraction** - Extract common and ui packages in dependency order with correct exports
- [ ] **Phase 3: Build Pipeline Verification** - Vite 6 upgrade and verified dual single-file build output
- [ ] **Phase 4: Biome & VS Code Config** - Biome linting/formatting and VS Code workspace integration
- [ ] **Phase 5: Vitest & DX Polish** - Per-package test setup and remaining VS Code developer experience

## Phase Details

### Phase 1: Monorepo Scaffolding
**Goal**: A working Turborepo + Bun workspace where `bun install` succeeds and `turbo` recognizes all packages
**Depends on**: Nothing (first phase)
**Requirements**: MONO-02, MONO-05, BUILD-01, BUILD-02, BUILD-06, BUILD-07
**Success Criteria** (what must be TRUE):
  1. `bun install` succeeds at the repo root and resolves all workspace packages
  2. `turbo run build` recognizes the workspace and executes tasks in topological order
  3. No `package-lock.json` or `pnpm-lock.yaml` exists; `bun.lock` is the sole lockfile
  4. Root `package.json` has correct `packageManager` field (no `v` prefix) and `"private": true`
**Plans**: TBD

Plans:
- [ ] 01-01: TBD

### Phase 2: Package Extraction
**Goal**: Shared code lives in `packages/common` and `packages/ui` as JIT source-only packages with proper workspace imports
**Depends on**: Phase 1
**Requirements**: MONO-01, MONO-03, MONO-04
**Success Criteria** (what must be TRUE):
  1. `apps/figma-plugin`, `packages/common`, and `packages/ui` directories exist with correct `package.json` files
  2. Each package has an `exports` field pointing to source TypeScript entry points
  3. `packages/ui` depends on `@repo/common` via `workspace:*` and TypeScript resolves cross-package imports
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Build Pipeline Verification
**Goal**: Both Vite builds produce valid single-file output loadable in Figma Desktop after Vite 6 upgrade
**Depends on**: Phase 2
**Requirements**: BUILD-03, BUILD-04, BUILD-05
**Success Criteria** (what must be TRUE):
  1. Vite 6 and all plugins (`vite-plugin-singlefile`, `vite-plugin-react-rich-svg`, `vite-plugin-generate-file`) install without peer dependency errors
  2. `turbo run build` produces `dist/plugin.js` and `dist/index.html` with zero external imports (fully inlined)
  3. `bun run dev` starts parallel watch mode for both plugin and UI builds
  4. Built plugin loads and functions correctly in Figma Desktop
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Biome & VS Code Config
**Goal**: Developers get automatic formatting on save and lint feedback in VS Code immediately after cloning
**Depends on**: Phase 3
**Requirements**: LINT-01, LINT-02, LINT-03, MONO-06, VSDX-01, VSDX-02, VSDX-04
**Success Criteria** (what must be TRUE):
  1. `bun run lint` checks all packages and reports TypeScript + JSX lint issues
  2. Opening a `.ts` or `.tsx` file in VS Code and saving auto-formats with Biome
  3. VS Code prompts to install recommended extensions (Biome, Vitest, Vite) on first open
  4. VS Code tasks panel shows dev and build shortcuts that execute correctly
  5. `.code-workspace` file opens all workspace folders in VS Code multi-root mode
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: TBD

### Phase 5: Vitest & DX Polish
**Goal**: Every testable package has a working test suite with watch mode, and VS Code debug configurations work end-to-end
**Depends on**: Phase 4
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, VSDX-03
**Success Criteria** (what must be TRUE):
  1. `turbo run test` executes per-package test suites and caches results
  2. `turbo run test:watch` starts persistent watch mode without caching
  3. `packages/common` tests run in node environment; `packages/ui` tests run in happy-dom environment
  4. VS Code launch configurations can debug both plugin sandbox and UI processes
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Monorepo Scaffolding | 0/0 | Not started | - |
| 2. Package Extraction | 0/0 | Not started | - |
| 3. Build Pipeline Verification | 0/0 | Not started | - |
| 4. Biome & VS Code Config | 0/0 | Not started | - |
| 5. Vitest & DX Polish | 0/0 | Not started | - |
