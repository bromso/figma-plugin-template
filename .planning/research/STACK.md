# Stack Research

**Domain:** Turborepo monorepo migration — Figma plugin template with Bun, Biome, and Vitest
**Researched:** 2026-04-09
**Confidence:** MEDIUM (versions verified via web search; some Bun/Turborepo edge cases LOW confidence)

---

## Context: What Already Exists (Do Not Re-research)

The following stack is validated and in production in this project:

| Technology | Version | Role |
|------------|---------|------|
| React | ^18.2.0 | UI framework |
| Vite | ^5.0.11 | Build tool (two configs: ui + plugin) |
| vite-plugin-singlefile | ^2.0.3 | Inlines all assets into single HTML/JS |
| vite-plugin-react-rich-svg | ^1.0.0 | SVG import as component/url/raw |
| @figma/plugin-typings | ^1.83.0 | Figma API types |
| monorepo-networker | ^2.1.0 | Typed plugin/UI message passing |
| TypeScript | ^5.3.0 | Type system |
| SCSS | via sass ^1.60.0 | Styling |

This research covers **only the new tooling additions** needed for the monorepo migration.

---

## Critical Version Constraint

**Vitest 4.x requires Vite >= 6.0.0.** The existing project uses Vite 5. This creates a decision point:

- **Path A:** Upgrade Vite to 6 or 7, use Vitest 4.x (latest). Requires verifying all existing Vite plugins still work.
- **Path B:** Use Vitest 3.x, which supports both Vite 5 and Vite 6. No Vite upgrade needed. Vitest 3 is actively maintained.

**Recommendation: Path A — upgrade Vite to ^6.0.0** alongside Vitest 4.x. Rationale:
- vite-plugin-singlefile v2.2.1+ explicitly supports Vite 6 and 7 (resolved peer dep conflict from v2.0.3)
- Vite 6 is stable and widely adopted; Vite 8 is current but Rolldown is a bigger change
- Vitest 4.x has the projects API that replaces the deprecated workspace file pattern
- Staying on Vite 5 creates a ceiling — every future upgrade becomes a bigger leap

**Vite upgrade target: ^6.0.0** (not 7 or 8, to minimize plugin compatibility risk in a migration milestone).

---

## Recommended Stack: New Additions

### Core Tooling (New)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| turbo | ^2.9.4 | Monorepo task orchestration, caching | Latest stable (released 2026-03-30); Bun is first-class supported; `tasks` format (not deprecated `pipeline`); 2.9 adds stable `turbo query` and better task graph handling |
| bun | 1.3.x | Package manager + script runner replacing npm | 1.3 is current stable; isolated workspace installs by default; `workspace:*` protocol; catalog support for shared dep versions; 4x-20x faster installs than npm |
| @biomejs/biome | ^2.4.10 | Lint + format (replaces ESLint + Prettier) | 2.x is the current major; 97% Prettier-compatible formatter; 450+ lint rules; TypeScript + JSX/TSX native support; single binary, no plugin wrangling |
| vitest | ^4.1.3 | Unit testing | 4.1 is current stable; `projects` array config for monorepos; requires Vite 6+; Browser Mode stable in 4.0 |

### Vite Upgrade (Required for Vitest 4)

| Technology | Current | Target | Why |
|------------|---------|--------|-----|
| vite | ^5.0.11 | ^6.0.0 | Vitest 4 requires Vite >=6.0.0; vite-plugin-singlefile 2.2.1+ supports Vite 6/7; stable migration path |
| vite-plugin-singlefile | ^2.0.3 | ^2.3.0 | 2.3.0 is current; adds Vite 7 support; fixes Vite 6 peer dep that broke 2.0.3 |

### Test Environment

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| happy-dom | ^latest | DOM simulation for Vitest | Preferred over jsdom in Bun projects — Bun supports happy-dom natively; faster; fewer compatibility issues with Vitest 4 (jsdom has known v4 compatibility issues) |
| @vitest/coverage-v8 | ^4.1.3 | Coverage reporting | Matches Vitest version; v8 provider uses AST-based remapping in Vitest 4 |

### VS Code Integration

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| biomejs.biome (VS Code ext) | ^3.4.1 | Editor lint + format integration | Official extension; latest 3.4.1 (Feb 2026); configure as default formatter in `.vscode/settings.json` |

---

## Installation

```bash
# Install Bun (replaces npm)
curl -fsSL https://bun.sh/install | bash

# Initialize monorepo root
bun add -d turbo @biomejs/biome

# Per-package test dependencies (in packages/common, etc.)
bun add -d vitest @vitest/coverage-v8 happy-dom

# Vite upgrade (in apps/figma-plugin)
bun add -d vite@^6.0.0 vite-plugin-singlefile@^2.3.0
```

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| ESLint | Replaced by Biome; running both creates conflicts and overhead | @biomejs/biome |
| Prettier | Replaced by Biome formatter; 97% output-compatible, no config needed | @biomejs/biome |
| Jest | Incompatible with Vite's ESM-first build; requires transform setup | vitest |
| jsdom (for Vitest) | Known compatibility issues with Vitest 4; jsdom update broke v4 in late 2025 | happy-dom |
| npm or pnpm | Being replaced by Bun across the board; mixing lockfiles causes issues | bun |
| @vitest/browser (separate pkg) | Removed in Vitest 4 — context now imported from `vitest/browser` directly | built-in via vitest |
| turbo pipeline key | Deprecated in Turborepo 2.x; removed in 3.0 | `tasks` key in turbo.json |
| Lerna | Outdated; no caching, no task orchestration | turbo |
| Nx | Heavier than Turborepo; worse fit for small template project | turbo |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| turbo | Nx | Nx is better for large enterprise monorepos needing module federation, code generation, and a full plugin ecosystem. Turborepo is lighter and better for template projects. |
| bun | pnpm | pnpm has more mature monorepo features (strict hoisting, `pnpm-workspace.yaml`, publishing support). Use pnpm if `turbo prune` is required for Docker deploys — Bun's `prune` support is still not implemented (open issue as of 2026). |
| @biomejs/biome | ESLint + Prettier | ESLint still wins for projects needing custom rules, specific plugins (e.g., `eslint-plugin-storybook`), or teams already invested in ESLint config. Biome's rule set is growing but not yet at ESLint parity. |
| vitest | jest | Jest if you have existing Jest suites and can't invest in migration. Otherwise Vitest is the clear choice for Vite-based projects. |
| happy-dom | jsdom | jsdom if you need higher browser API accuracy (more complete implementation). Accepts the performance tradeoff and the Vitest 4 compatibility risk. |
| Vite 6 | Vite 8 | Vite 8 is current stable with Rolldown bundler (10-30x faster builds). Consider Vite 8 in a future milestone. Skip Vite 8 for this milestone — Rolldown is a bigger surface for plugin compat issues. |

---

## Version Compatibility Matrix

| Package | Required By | Constraint | Status |
|---------|------------|------------|--------|
| vite ^6.0.0 | vitest ^4.1.3 | Vitest 4 requires Vite >= 6.0.0 (Node 20+) | Must upgrade |
| vite-plugin-singlefile ^2.2.1+ | vite ^6.0.0 | v2.0.3 has peer dep conflict with Vite 6; v2.2.1 fixed it | Must upgrade |
| vitest ^4.1.3 | vite ^6.0.0 | Bidirectional requirement | Upgrade pair |
| @biomejs/biome ^2.4.10 | standalone | No Vite or Bun peer deps | Independent |
| turbo ^2.9.4 | bun 1.3.x workspaces | Bun workspaces = same format as npm workspaces | Compatible |
| bun 1.3.x | turbo ^2.9.4 | turbo.json `packageManager: "bun@1.3.x"` required | Compatible |
| Node.js >= 20 | vitest 4, vite 6, turbo 2.9 | All three require Node 20+ | Verify CI environment |

---

## Key Configuration Patterns

### Root package.json (Bun + Turborepo)

```json
{
  "private": true,
  "packageManager": "bun@1.3.10",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "format": "biome format --write ."
  },
  "devDependencies": {
    "turbo": "^2.9.4",
    "@biomejs/biome": "^2.4.10"
  }
}
```

### turbo.json (use `tasks`, not deprecated `pipeline`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

### Vitest projects config (replaces deprecated vitest.workspace.ts)

```typescript
// vitest.config.ts at monorepo root
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*'],
  },
})
```

### biome.json (root config, monorepo-aware)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.10/schema.json",
  "files": {
    "ignore": ["dist/**", "node_modules/**", ".turbo/**"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "jsxRuntime": "transparent"
  }
}
```

---

## Known Limitations and Risk Flags

**Bun — `turbo prune` not supported** (MEDIUM risk): The `turbo prune` command for creating minimal Docker images does not work with Bun workspaces. This is an open issue as of 2026. Not a blocker for this milestone (no CI/Docker scope), but note for future.

**Vitest 4 + jsdom** (LOW risk, avoided): There are known compatibility failures when both jsdom and Vitest are at their latest versions. Mitigated by choosing happy-dom instead.

**Biome SCSS support** (LOW risk): Biome's SCSS support is in development (roadmap 2026 feature). Current version does not format/lint SCSS. The project uses SCSS — Biome will simply ignore `.scss` files. This is acceptable; the existing SCSS workflow is not broken, it just stays un-linted by Biome.

**Vite 6 plugin compatibility** (MEDIUM risk): vite-plugin-react-rich-svg and vite-plugin-generate-file have not been explicitly verified against Vite 6. Both should work (standard Vite plugin API), but must be confirmed during the migration phase. Check peer deps and test build output.

---

## Sources

- [Turborepo 2.9 release blog](https://turborepo.dev/blog/2-9) — confirmed 2.9.4 latest, released 2026-03-30, Bun support status
- [Turborepo structuring docs](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) — Bun workspace config examples, no Bun-specific caveats in official docs
- [Vitest migration guide](https://vitest.dev/guide/migration.html) — confirmed Vitest 4 requires Vite >=6.0.0 and Node >=20.0.0
- [Vitest 4.0 blog](https://vitest.dev/blog/vitest-4) — Browser Mode stable, breaking changes summary
- [Vitest projects docs](https://vitest.dev/guide/projects) — `projects` array replaces deprecated `vitest.workspace.ts`
- [Biome getting started](https://biomejs.dev/guides/getting-started/) — v2.x current, installation, TypeScript/JSX support
- [Biome roadmap 2026](https://biomejs.dev/blog/roadmap-2026/) — SCSS planned, workspace improvements, HTML stabilization
- [Bun workspaces docs](https://bun.com/docs/pm/workspaces) — workspace: protocol, glob support, hoisting behavior
- [vite-plugin-singlefile GitHub](https://github.com/richardtallent/vite-plugin-singlefile) — v2.3.0 latest, v2.2.1 fixed Vite 6/7 peer dep
- WebSearch: Turborepo + Bun compatibility (MEDIUM confidence) — basic support confirmed, `prune` not supported
- WebSearch: Vitest jsdom v4 compatibility issue — confirmed issue, switching to happy-dom mitigates
- WebSearch: @biomejs/biome 2.4.10 npm latest (MEDIUM confidence) — matches roadmap post dates

---

*Stack research for: Turborepo + Bun + Biome + Vitest monorepo migration*
*Researched: 2026-04-09*
