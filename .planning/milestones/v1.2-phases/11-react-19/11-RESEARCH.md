# Phase 11: React 19 - Research

**Researched:** 2026-04-09
**Domain:** React 19 upgrade in a Bun + Vite 8 + Turborepo monorepo
**Confidence:** HIGH

## Summary

Phase 11 upgrades React from 18.2 to 19.x in `packages/ui` and `apps/storybook`. The `apps/figma-plugin` package has no direct React dependency — it consumes the UI via `@repo/ui` workspace import. The upgrade is contained to two `package.json` files plus confirmation that `@vitejs/plugin-react` and `@testing-library/react` are already compatible.

React 19.2.5 is the current stable release. [VERIFIED: npm registry] The corresponding type packages `@types/react@19.2.14` and `@types/react-dom@19.2.3` are the latest 19.x versions. [VERIFIED: npm registry] Critically, `@testing-library/react@16.3.2` (already installed) already declares `react: '^18.0.0 || ^19.0.0'` as a peer dependency — no upgrade needed. [VERIFIED: npm registry]

The codebase has zero React 18-only API usage that was removed in React 19. There are no `defaultProps` on function components, no `propTypes`, no `ReactChild`/`ReactChildren` types, and no legacy `createRoot` patterns — `main.tsx` already uses `ReactDOM.createRoot`. The upgrade is a pure version bump with no code changes required in the project's own source files.

**Primary recommendation:** Bump `react`, `react-dom`, `@types/react`, `@types/react-dom` to `^19.2.5` / `^19.2.14` / `^19.2.3` in `packages/ui/package.json` and `apps/storybook/package.json`, then run `bun install` and verify with `bun run types` and `bun run test`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Claude's Discretion
All implementation choices.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FW-01 | React upgraded from 18.2 to 19.x with updated @types/react and @types/react-dom | React 19.2.5 is the current stable. @types/react 19.2.14 and @types/react-dom 19.2.3 are the matching type definitions. All dependent packages are already compatible. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.5 | UI runtime | The upgrade target |
| react-dom | 19.2.5 | DOM renderer | Matches react version |
| @types/react | 19.2.14 | TypeScript definitions | Required to resolve React 19 types |
| @types/react-dom | 19.2.3 | TypeScript definitions | Required to resolve ReactDOM 19 types |

[VERIFIED: npm registry — versions confirmed 2026-04-09]

### Supporting (already correct, no change)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @vitejs/plugin-react | ^4.0.0 (packages/ui vitest) / ^6.0.0 (apps/figma-plugin) | JSX transform | v4.7.0 supports Vite 4–7; v6.0.1 is Vite 8 only. Both support React 19. No change needed. |
| @testing-library/react | ^16.3.2 | Test utilities | Already declares `react: '^18 \|\| ^19'` peer dep. No change. |

[VERIFIED: npm registry peerDependencies]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `^19.2.5` range | exact `19.2.5` | Range is better — receives patch fixes without manual bumps. Use `^19.x`. |

**Installation (packages/ui):**
```bash
bun add react@^19.2.5 react-dom@^19.2.5
bun add -d @types/react@^19.2.14 @types/react-dom@^19.2.3
```

**Installation (apps/storybook):**
```bash
bun add -d react@^19.2.5 react-dom@^19.2.5
```

Note: Storybook does not need `@types/react` or `@types/react-dom` listed separately — it inherits them from `@repo/ui`'s devDependencies via workspace resolution.

## Architecture Patterns

### Where React Lives in This Monorepo

```
packages/ui/package.json      ← react, react-dom (runtime deps)
                                 @types/react, @types/react-dom (devDeps)
apps/storybook/package.json   ← react, react-dom (devDeps — Storybook renderer)
apps/figma-plugin/            ← NO direct React dep; consumes @repo/ui source
packages/common/              ← NO React dep (pure event type definitions)
```

The `apps/figma-plugin` app imports React code at build time via the `@repo/ui` workspace symlink (JIT source-only). React itself is resolved from `packages/ui/node_modules` or the workspace root — no separate React entry needed in the plugin's `package.json`.

### Pattern: Version Alignment

All packages that declare React must use the same major.minor target. Mismatched `react` versions in a Bun workspace cause Bun to hoist both versions, which leads to "two copies of React" runtime errors (a well-known React pitfall).

**Correct:**
```json
// packages/ui/package.json
"dependencies": {
  "react": "^19.2.5",
  "react-dom": "^19.2.5"
}

// apps/storybook/package.json
"devDependencies": {
  "react": "^19.2.5",
  "react-dom": "^19.2.5"
}
```

### Pattern: `@types/react` Lives Only in `packages/ui`

The `@types/react` and `@types/react-dom` definitions only need to be in the package that contains `.tsx` source files (`packages/ui`). Storybook's `tsconfig.json` uses `moduleResolution: "bundler"` with a `paths` alias pointing to `packages/ui/src`, so it picks up the types transitively.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSX transform config | Don't manually configure Babel JSX | `@vitejs/plugin-react` already configured | Plugin handles both Babel fast-refresh and automatic JSX runtime |
| React 19 concurrent rendering | Don't use legacy ReactDOM.render | Already using `ReactDOM.createRoot` | `createRoot` was introduced in React 18 and is unchanged in React 19 |
| Type compatibility shims | Don't add `@ts-ignore` for React 19 type changes | Upgrade `@types/react` to `^19` | The 19.x type package is the official fix |

## Common Pitfalls

### Pitfall 1: Stale Bun lockfile after version bump

**What goes wrong:** `bun.lock` retains the resolved `18.2.x` entries. TypeScript and Vite may silently use the old installed versions if `bun install` is not re-run.

**Why it happens:** Bun resolves packages lazily; the lockfile is the source of truth for actual installed versions.

**How to avoid:** Always run `bun install` from the workspace root after editing `package.json` version ranges.

**Warning signs:** `bun pm ls | grep react` shows `18.x` after bumping `package.json`.

---

### Pitfall 2: `@types/react` version mismatch with react runtime

**What goes wrong:** Type errors like `JSX element type 'X' does not have any construct or call signatures` or `Property 'children' does not exist on type 'IntrinsicAttributes'`.

**Why it happens:** In React 19, `children` is no longer implicitly typed on `FC` props — components must explicitly declare `children: React.ReactNode` if they accept children. However, in this codebase, there are NO custom `FC`-typed components in project source — all component usage is through `react-figma-ui`. The risk is in `react-figma-ui` itself.

**How to avoid:** `react-figma-ui@1.1.0` declares `peerDependencies: react >= 16.8.0` and ships compiled JS + bundled types. [VERIFIED: npm registry] Since `skipLibCheck: true` is set in all `tsconfig.json` files, type errors inside `react-figma-ui` node_modules are suppressed. This is a low-risk path.

**Warning signs:** `bun run types` reporting errors inside `react-figma-ui` type declarations — suppressed by `skipLibCheck: true`.

---

### Pitfall 3: `@vitejs/plugin-react` version mismatch

**What goes wrong:** The `packages/ui` vitest config uses `@vitejs/plugin-react@^4.0.0` (pinned in `devDependencies`). Vite 8 requires `@vitejs/plugin-react@^6`. However, the vitest config in `packages/ui` runs under Vitest's own Vite resolution — it does NOT go through the plugin app's Vite 8 setup.

**Why it happens:** Two separate Vite instances: one for the figma-plugin build (Vite 8, plugin-react v6), one for the ui package's vitest runs (Vitest 4.x, plugin-react v4). These are independent.

**How to avoid:** Do NOT change `@vitejs/plugin-react` in `packages/ui`. The v4 plugin is correct for the vitest environment. This is already the correct state post-Phase-10.

**Warning signs:** Would only manifest if someone tried to use `@vitejs/plugin-react@^6` in `packages/ui/vitest.config.ts` — the peerDep requires Vite 8 which vitest's embedded Vite does not match.

---

### Pitfall 4: "Two copies of React" in the browser

**What goes wrong:** React hook errors like `Invalid hook call` at runtime in the Figma plugin iframe.

**Why it happens:** If both `packages/ui` and `apps/figma-plugin` independently resolve `react`, Vite may bundle two separate instances. This is only a risk if `apps/figma-plugin/package.json` were to gain a direct `react` dependency.

**How to avoid:** Keep `react`/`react-dom` only in `packages/ui`. The plugin app imports React transitively through `@repo/ui`. Vite deduplicates via the workspace symlink.

**Warning signs:** `bun pm ls | grep react` showing two entries at different version paths.

## Code Examples

### Upgrading packages/ui (the correct diff)

```json
// packages/ui/package.json — before
"dependencies": {
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
},
"devDependencies": {
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0"
}

// packages/ui/package.json — after
"dependencies": {
  "react": "^19.2.5",
  "react-dom": "^19.2.5"
},
"devDependencies": {
  "@types/react": "^19.2.14",
  "@types/react-dom": "^19.2.3"
}
```

### Upgrading apps/storybook (the correct diff)

```json
// apps/storybook/package.json — before
"devDependencies": {
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}

// apps/storybook/package.json — after
"devDependencies": {
  "react": "^19.2.5",
  "react-dom": "^19.2.5"
}
```

### `main.tsx` — no change needed

```tsx
// Source: current packages/ui/src/main.tsx
// ReactDOM.createRoot is unchanged in React 19 — this code is correct as-is
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

[VERIFIED: codebase grep — existing code already uses createRoot API]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ReactDOM.render(...)` (React 17) | `ReactDOM.createRoot(...).render(...)` | React 18 | Already using correct API — no change |
| `@types/react` children implicit on FC | Must declare `children?: React.ReactNode` explicitly | React 18 types, reinforced in 19 | Not relevant — no custom `FC` components in project source |
| `defaultProps` on function components | Remove `defaultProps`, use default params | React 19 removes FC defaultProps | Not used in project source |

**Deprecated/outdated:**
- `ReactDOM.render`: Removed in React 19. Not used — already using `createRoot`.
- `react-test-renderer`: Removed in React 19. Not used — tests use `@testing-library/react`.
- `defaultProps` on function components: Deprecated since React 18, warning in React 19. Not used in project source.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `react-figma-ui@1.1.0` renders correctly under React 19 (no hook compatibility issues in its internals) | Pitfall 2 | Tests would fail; root cause traceable via `bun run test` output |

**Note:** A1 is low risk because: (a) `react-figma-ui` peerDep is `>=16.8.0`, (b) `skipLibCheck: true` suppresses type errors in node_modules, (c) the library renders simple class-name-driven components without advanced React internals. The existing test suite (`App.test.tsx`) will surface any runtime failure immediately.

## Open Questions

1. **Phase 10 completion status**
   - What we know: Phase 11 depends on Phase 10 (Vite 8 + TypeScript 6). The `apps/figma-plugin/package.json` already shows `vite: ^8.0.0` and `typescript: ^6.0.0`, suggesting Phase 10 changes are already committed.
   - What's unclear: Whether `bun install` has been run and the lockfile reflects these versions.
   - Recommendation: Run `bun install` unconditionally at the start of Phase 11 to ensure a clean state before bumping React.

## Environment Availability

Step 2.6: SKIPPED (phase is a dependency version bump — no new external tools required; Bun and npm registry are available as confirmed by `npm view` commands above).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `packages/ui/vitest.config.ts` |
| Quick run command | `bun run --filter @repo/ui test` |
| Full suite command | `bun run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FW-01 | React 19 renders App without error | smoke | `bun run --filter @repo/ui test` | ✅ `packages/ui/src/__tests__/App.test.tsx` |
| FW-01 | TypeScript compiles with React 19 types | type check | `bun run types` | ✅ (turbo task in root `package.json`) |
| FW-01 | Dev server starts without console errors | smoke (manual) | `bun run dev:ui-only` | manual — no automated equivalent |

### Sampling Rate

- **Per task commit:** `bun run --filter @repo/ui test`
- **Per wave merge:** `bun run test && bun run types`
- **Phase gate:** `bun run test && bun run types` both green before `/gsd-verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements.

## Security Domain

Not applicable — this phase makes no changes to authentication, session management, input handling, network communication, or cryptographic functions. It is a pure dependency version upgrade.

## Sources

### Primary (HIGH confidence)
- npm registry — `npm view react version` → 19.2.5
- npm registry — `npm view @types/react dist-tags.latest` → 19.2.14
- npm registry — `npm view @types/react-dom dist-tags.latest` → 19.2.3
- npm registry — `npm view @testing-library/react@16.3.2 peerDependencies` → confirms React 19 support
- npm registry — `npm view @vitejs/plugin-react@6 peerDependencies` → confirms Vite 8 only (no impact on packages/ui vitest)
- npm registry — `npm view react-figma-ui peerDependencies` → `react: '>=16.8.0'`

### Secondary (MEDIUM confidence)
- Codebase grep: no deprecated React 18 APIs (`defaultProps`, `ReactDOM.render`, `react-test-renderer`) in project source files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry
- Architecture: HIGH — package.json files read directly from codebase
- Pitfalls: HIGH — based on direct inspection of codebase patterns and verified peer dependency declarations

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable ecosystem — React patch releases only)
