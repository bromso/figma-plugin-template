# Phase 5: Vitest & DX Polish - Research

**Researched:** 2026-04-09
**Domain:** Vitest per-package configuration, React Testing Library, VS Code debug launch.json
**Confidence:** HIGH

## Summary

Phase 5 adds two distinct capabilities to the monorepo: (1) per-package Vitest test suites with correct runtime environments, and (2) VS Code `launch.json` debug configurations covering both the Figma plugin sandbox and the UI iframe. Both are pure file-creation tasks — no dependency graph changes, no Vite config surgery.

The monorepo already has `test` and `test:watch` tasks declared in `turbo.json` with the correct Turborepo properties (`cache: false, persistent: true` on watch). What is missing is the per-package implementation: `vitest.config.ts`, `test` / `test:watch` scripts in each `package.json`, the `happy-dom` package for `packages/ui`, and the `.vscode/launch.json` file.

**Primary recommendation:** Install Vitest 4.x into each testable package directly (`packages/common` and `packages/ui`). Use `defineConfig` from `vitest/config` per package. Set `environment: 'node'` for `packages/common` and `environment: 'happy-dom'` for `packages/ui`. The `apps/figma-plugin` package contains no independently testable units (Figma API calls, dual-side messaging bootstrapping) — leave it without tests for now.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — all implementation choices are at Claude's discretion.

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Vitest configured with per-package `vitest.config.ts` files | Each package gets its own `vitest.config.ts` using `defineConfig` from `vitest/config` |
| TEST-02 | Each testable package has its own `test` script | Add `"test": "vitest run"` and `"test:watch": "vitest"` to `packages/common` and `packages/ui` package.json files |
| TEST-03 | `test:watch` task declared with `cache: false, persistent: true` in turbo.json | Already done in turbo.json — verify only |
| TEST-04 | `packages/common` tests run in node environment | `environment: 'node'` in `packages/common/vitest.config.ts` (node is the Vitest default) |
| TEST-05 | `packages/ui` tests run with DOM environment (happy-dom) | `environment: 'happy-dom'` in `packages/ui/vitest.config.ts`; install `happy-dom` as devDependency |
| VSDX-03 | `.vscode/launch.json` with debug configurations for plugin and UI | Two configurations: (1) Vitest node debug for plugin-side logic; (2) Chrome attach to Vite dev server for UI |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.4 | Test runner — replaces Jest in Vite-native stacks | Co-developed with Vite; reads vite config; ESM native; ~2-6x faster than Jest |
| happy-dom | 20.8.9 | DOM environment for UI tests | 2-4x faster than jsdom; recommended by Vitest docs for most React tests |
| @testing-library/react | 16.3.2 | React component test utilities | Industry standard; works with Vitest out of the box |
| @testing-library/jest-dom | 6.9.1 | Custom DOM matchers (`toBeInTheDocument`, etc.) | Pairs with @testing-library/react; works with Vitest globals |

[VERIFIED: npm registry — all versions confirmed 2026-04-09]

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitejs/plugin-react | 6.0.1 | JSX transform in Vitest for UI package | Required when testing React components; same plugin used in prod build |

[VERIFIED: npm registry]

### Not Needed for This Phase
| Library | Reason to Skip |
|---------|----------------|
| jsdom | happy-dom is faster and sufficient; jsdom only needed for advanced CSS/SVG/Canvas testing |
| @vitest/coverage-v8 | Coverage tooling is not a v1.0 requirement; can be added later |
| Root-level vitest.config.ts | Explicitly out of scope in REQUIREMENTS.md — breaks Turborepo per-package caching |

**Installation (packages/common):**
```bash
bun add -D vitest --filter @repo/common
```

**Installation (packages/ui):**
```bash
bun add -D vitest happy-dom @testing-library/react @testing-library/jest-dom --filter @repo/ui
```

---

## Architecture Patterns

### Per-Package Test Structure
```
packages/
├── common/
│   ├── src/
│   │   └── __tests__/           # Test files alongside source
│   │       └── networkSides.test.ts
│   ├── vitest.config.ts         # node environment
│   └── package.json             # adds test + test:watch scripts
└── ui/
    ├── src/
    │   ├── __tests__/           # or *.test.tsx alongside components
    │   │   ├── classes.util.test.ts
    │   │   └── Button.test.tsx
    │   └── test/
    │       └── setup.ts         # imports @testing-library/jest-dom
    ├── vitest.config.ts         # happy-dom environment
    └── package.json             # adds test + test:watch scripts
```

### Pattern 1: packages/common vitest.config.ts
**What:** Minimal Vitest config with explicit node environment
**When to use:** Any package that runs pure TypeScript logic (no DOM)
**Example:**
```typescript
// Source: https://vitest.dev/guide/environment
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```
[CITED: vitest.dev/guide/environment]

### Pattern 2: packages/ui vitest.config.ts
**What:** Vitest config with happy-dom environment, React plugin, and a setup file
**When to use:** React component packages needing DOM APIs
**Example:**
```typescript
// Source: https://vitest.dev/guide/environment + https://turborepo.dev/docs/guides/tools/vitest
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

The `globals: true` option enables `describe`, `it`, `expect` without imports — consistent with `@testing-library/jest-dom` conventions.
[CITED: vitest.dev/config, turborepo.dev/docs/guides/tools/vitest]

### Pattern 3: UI test setup file
```typescript
// src/test/setup.ts
// Source: https://vercel.com/academy/production-monorepos/set-up-vitest
import "@testing-library/jest-dom";
```

### Pattern 4: package.json test scripts
**What:** Two scripts per testable package matching turbo.json task names
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```
`vitest run` = single run, exits (cacheable by Turbo).
`vitest` = watch mode, persistent (matches `cache: false, persistent: true` in turbo.json).
[CITED: vitest.dev/guide, turborepo.dev/docs/guides/tools/vitest]

### Pattern 5: VS Code launch.json
**What:** Two configurations in `.vscode/launch.json`
**When to use:** Developer wants breakpoint debugging without browser DevTools

**Configuration 1 — Debug Vitest tests (node)**
Covers both packages. Points to workspace-root `node_modules/vitest/vitest.mjs` to allow running from any package.
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest (current file)",
  "autoAttachChildProcesses": true,
  "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
  "program": "${workspaceRoot}/node_modules/vitest/vitest.mjs",
  "args": ["run", "${relativeFile}"],
  "smartStep": true,
  "console": "integratedTerminal"
}
```
[CITED: vitest.dev/guide/debugging]

**Configuration 2 — Debug UI in Chrome (Vite dev server)**
Used when developer runs `bun run dev:ui-only` and wants to step through UI code in VS Code.
```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug UI (Chrome)",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/packages/ui/src",
  "skipFiles": ["<node_internals>/**"]
}
```
[CITED: github.com/vitejs/vite/discussions/4065]

**Configuration 3 — Debug Figma plugin (attach)**
Figma's sandbox runs in a sandboxed JS engine. The recommended official method is to enable "Plugins > Development > Use Developer VM" which routes plugin code through the browser JS engine — then attach Chrome DevTools. A VS Code "attach" config can connect to it.
```json
{
  "type": "chrome",
  "request": "attach",
  "name": "Attach to Figma Plugin (DevVM)",
  "port": 9222,
  "urlFilter": "*figma*",
  "skipFiles": ["<node_internals>/**"],
  "sourceMapPathOverrides": {
    "webpack:///src/*": "${workspaceFolder}/apps/figma-plugin/src/*"
  }
}
```
[CITED: developers.figma.com/docs/plugins/debugging, dev.to/svallory/debugging-figma-and-other-packaged-electron-apps]

> **Note on Figma debug config:** Figma must be running with `--remote-debugging-port=9222` for VS Code attach to work. This is only possible when launching Figma via CLI or a custom script. The more common workflow is to use Chrome DevTools directly via Figma's built-in "Open Console" shortcut. The launch.json attach config covers the advanced case for developers who want VS Code breakpoints. A simpler "Open Console" note in the config description is sufficient for most users.

### Anti-Patterns to Avoid
- **Root-level vitest.config.ts with `projects` array:** Explicitly out of scope. Would consolidate test runs and break Turborepo's per-package caching. The REQUIREMENTS.md `Out of Scope` table documents this decision.
- **`bun test` instead of `vitest run`:** Bun has its own test runner invoked by `bun test`. Using `bun run test` (which calls the `test` script = `vitest run`) is the correct approach.
- **Installing vitest at workspace root:** Vitest should be a devDependency per testable package, not at the root. This ensures each package's Turborepo cache is invalidated when its test dependencies change, not all packages simultaneously.
- **Using `jsdom` instead of `happy-dom` for UI tests:** The codebase uses no advanced CSS/SVG/Canvas APIs in unit tests. happy-dom is 2-4x faster and the REQUIREMENTS.md specifies happy-dom explicitly for TEST-05.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOM environment for tests | Custom JSDOM wrapper | `happy-dom` | Environment-specific event handling, timers, MutationObserver — complex to maintain |
| React component render + queries | Manual `ReactDOM.render` + DOM queries | `@testing-library/react` | Handles concurrent mode, cleanup, async waiting, accessibility queries |
| Custom DOM matchers | `expect(el.className).toContain(...)` | `@testing-library/jest-dom` | 20+ well-tested custom matchers; maintains consistency across projects |

**Key insight:** The testing stack (`vitest` + `happy-dom` + `@testing-library`) is a cohesive unit designed to work together. All three are needed for `packages/ui`; only `vitest` is needed for `packages/common`.

---

## Common Pitfalls

### Pitfall 1: `bun test` vs `bun run test`
**What goes wrong:** Running `bun test` triggers Bun's native test runner, not Vitest. Tests may silently pass or fail differently.
**Why it happens:** Bun has a built-in test runner that intercepts the `test` subcommand.
**How to avoid:** Always use `bun run test` (executes the `test` script in package.json) or `npx vitest run`.
**Warning signs:** No Vitest output; Bun's test reporter appears instead.
[VERIFIED: github.com/oven-sh/bun/discussions/8559]

### Pitfall 2: vitest.config.ts in a package that already has a vite.config.ts
**What goes wrong:** If a package has both `vite.config.ts` and `vitest.config.ts`, Vitest will prefer `vitest.config.ts` — this is intentional and correct. The issue arises if the UI package tries to reuse `apps/figma-plugin`'s Vite config for tests.
**Why it happens:** The UI package (`packages/ui`) has no Vite config of its own; all Vite config is in `apps/figma-plugin/vite.config.ui.ts`.
**How to avoid:** Create a standalone `vitest.config.ts` in `packages/ui` that only includes what's needed for tests. Don't reference `apps/figma-plugin` configs from package tests.
**Warning signs:** Import resolution errors for `@ui/` aliases or SCSS modules during tests.
[CITED: vitest.dev/config]

### Pitfall 3: SCSS imports in component tests
**What goes wrong:** `Button.tsx` imports `./Button.module.scss`. Vitest in happy-dom doesn't process SCSS — it throws an error on the import.
**Why it happens:** Vitest doesn't have a Vite config with the SCSS preprocessor enabled.
**How to avoid:** Two options: (a) add `css: { modules: { ... } }` to `vitest.config.ts` — but SCSS still needs processing; (b) mock CSS modules in `setupFiles` or use `moduleNameMapper`-equivalent. The cleanest solution for this codebase is to configure Vitest to transform CSS modules as identity (return empty object), which is what `vitest/config` does by default when `css.modules` is not configured.
**Actual recommended approach:** Add `css: true` (or leave default) in the Vitest config; Vitest will transform CSS modules to empty objects by default. SCSS compilation is handled by a preprocessor — install `sass` as devDependency in `packages/ui` as well.
**Warning signs:** `Failed to transform` error mentioning `.scss` or `.module.scss` file.
[ASSUMED — based on standard Vitest/SCSS interaction; verify during implementation]

### Pitfall 4: Figma global in non-Figma tests
**What goes wrong:** Any test that imports code calling `figma.*` at module load time will fail with `figma is not defined`.
**Why it happens:** The `figma` global is injected by Figma's sandbox, not available in Node or happy-dom environments.
**How to avoid:** The `packages/common` code (networkSides.ts) uses `Networker` from `monorepo-networker`, not `figma.*` directly — it is safe to test. The plugin-side code in `apps/figma-plugin/src/plugin/` is not testable without mocking the full Figma API — skip testing it for now.
**Warning signs:** `ReferenceError: figma is not defined` in test output.
[ASSUMED — based on codebase structure]

### Pitfall 5: Vitest not found when running from workspace root
**What goes wrong:** `turbo run test` works because Turbo runs `bun run test` in each package. But running `vitest run` directly from the workspace root fails if Vitest is not installed at root.
**Why it happens:** Vitest is installed per-package only.
**How to avoid:** Always use `turbo run test` or `bun run test` from within the package directory. The `.vscode/launch.json` debug config uses the workspaceRoot `node_modules/vitest/vitest.mjs` — this path must exist. Consider whether to also install vitest at root for the launch.json, or resolve it via the package path.
**Actual fix:** The launch.json `program` should point to the relevant package's vitest binary: `${workspaceFolder}/packages/ui/node_modules/.bin/vitest` (Bun places hoisted deps at root). Verify actual install location with `ls node_modules/.bin/vitest`.
**Warning signs:** `Cannot find module vitest.mjs` when using VS Code debug.

---

## Code Examples

### Minimal packages/common vitest.config.ts
```typescript
// Source: https://vitest.dev/config/
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
```

### packages/ui vitest.config.ts
```typescript
// Source: https://vitest.dev/guide/environment + turborepo.dev/docs/guides/tools/vitest
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
```

### packages/ui src/test/setup.ts
```typescript
// Source: https://vercel.com/academy/production-monorepos/set-up-vitest
import "@testing-library/jest-dom";
```

### Example test for classes.util.ts (packages/common or packages/ui)
```typescript
// Source: vitest standard pattern
import { describe, expect, it } from "vitest";
import { classes } from "../utils/classes.util";

describe("classes", () => {
  it("joins class names", () => {
    expect(classes("foo", "bar")).toBe("foo bar");
  });

  it("filters falsy values", () => {
    expect(classes("foo", undefined, null, false, "bar")).toBe("foo bar");
  });
});
```

### Example test for Button.tsx (packages/ui)
```typescript
// Source: @testing-library/react standard pattern
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../components/Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("passes className through classes util", () => {
    render(<Button className="custom">OK</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom");
  });
});
```

### Complete .vscode/launch.json
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest (current file)",
      "autoAttachChildProcesses": true,
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
      "program": "${workspaceRoot}/node_modules/.bin/vitest",
      "args": ["run", "${relativeFile}"],
      "smartStep": true,
      "console": "integratedTerminal"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug UI (Chrome, dev:ui-only)",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/packages/ui/src",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "chrome",
      "request": "attach",
      "name": "Attach to Figma Plugin (Developer VM)",
      "port": 9222,
      "urlFilter": "*figma*",
      "skipFiles": ["<node_internals>/**"],
      "pathMapping": {
        "/": "${workspaceFolder}/apps/figma-plugin/src/"
      }
    }
  ]
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest + Babel transform | Vitest + native ESM | ~2022 | No transpile step; co-locates with Vite config |
| Vitest `workspace` config | Vitest `projects` config | Vitest 3.x | `workspace` deprecated; `projects` is the API going forward |
| jsdom default | happy-dom recommended for speed | 2023-present | 2-4x faster for large test suites |

**Deprecated/outdated:**
- Vitest `workspace` key: Replaced by `projects` in Vitest 3+. The per-package approach used here avoids both — no root config at all.
- `@vitest/ui` browser mode (experimental): Available but not needed for this phase.

---

## Open Questions (RESOLVED)

1. **Vitest binary location after Bun workspace install**
   - What we know: Bun hoists dependencies to the workspace root `node_modules/` in most cases. When installed per-package, the binary typically appears at root `node_modules/.bin/vitest`.
   - What's unclear: Whether Bun places the binary at root `node_modules/.bin/` or per-package `node_modules/.bin/`. This affects the `program` path in `.vscode/launch.json`.
   - Recommendation: During Wave 1, run `ls node_modules/.bin/vitest packages/common/node_modules/.bin/vitest packages/ui/node_modules/.bin/vitest 2>/dev/null` to determine the actual location and adjust launch.json accordingly.
   - RESOLVED: The plan tasks for `.vscode/launch.json` use `${workspaceRoot}/node_modules/.bin/vitest` (Bun hoists to root) and include an inline verification step (`ls node_modules/.bin/vitest`) to confirm the path before writing the file. If hoisting does not occur, the executor adjusts to the per-package `.bin` path as documented in Pitfall 5.

2. **CSS Module handling in Vitest for packages/ui**
   - What we know: Vitest processes CSS modules by default (returns an identity proxy). SCSS preprocessing requires the `sass` package.
   - What's unclear: Whether Button.module.scss will resolve correctly without an explicit Vite plugin chain in the test config.
   - Recommendation: Add `sass` as a devDependency in `packages/ui`, and note in the plan that if `.module.scss` imports fail, adding `css: { modules: { ... } }` or mocking CSS in `setupFiles` is the fallback.
   - RESOLVED: The plan install task adds `sass` as a devDependency alongside `happy-dom`. The `packages/ui/vitest.config.ts` relies on Vitest's default CSS module identity transform (no explicit config needed). If `.module.scss` imports still fail during implementation, Pitfall 3's fallback (mock CSS in `setupFiles`) is the documented escape hatch.

3. **Figma plugin debug via VS Code attach**
   - What we know: Figma supports `--remote-debugging-port=9222` when launched from CLI. The "Developer VM" mode routes through the browser JS engine.
   - What's unclear: Whether the Figma desktop app on the developer's machine supports the attach workflow or only Chrome DevTools.
   - Recommendation: Document the attach configuration as the advanced option in launch.json, with a comment noting it requires Figma launched via CLI with `--remote-debugging-port=9222`.
   - RESOLVED: The plan includes the attach configuration as the third entry in `.vscode/launch.json` with an inline comment marking it as the advanced/optional workflow. The common case (Chrome DevTools via Figma's built-in console) is documented in the config name and description. No blocking dependency — the config is additive and harmless if the attach workflow is unsupported on the developer's machine.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest (node runtime) | Yes | v24.6.0 | — |
| Bun | Package manager | Yes | 1.3.11 | — |
| vitest | Test runner | Not yet installed | — | Install per-package |
| happy-dom | UI test DOM env | Not yet installed | — | jsdom (slower) |
| @testing-library/react | React component tests | Not yet installed | — | Manual render |

**Missing dependencies with no fallback:** None — all can be installed via `bun add -D`.

**Missing dependencies with fallback:** happy-dom (fallback: jsdom), but happy-dom is explicitly required by TEST-05.

---

## Validation Architecture

No test framework exists yet — Wave 0 of this phase creates the infrastructure.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 (to be installed) |
| Config file | `packages/common/vitest.config.ts` and `packages/ui/vitest.config.ts` |
| Quick run command | `bun run test --filter @repo/common` or `bun run test --filter @repo/ui` |
| Full suite command | `bun run test` (Turborepo runs all packages) |

### Phase Requirements — Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | vitest.config.ts per package | smoke (config load) | `bun run test` in each package | Wave 0 |
| TEST-02 | `test` script present | smoke | `bun run test --filter @repo/common` | Wave 0 |
| TEST-03 | test:watch in turbo.json cacheable=false | manual verification | `turbo run test:watch --dry` | Already done |
| TEST-04 | common tests run in node | unit | `bun run test --filter @repo/common` | Wave 0 |
| TEST-05 | UI tests run in happy-dom | unit + component | `bun run test --filter @repo/ui` | Wave 0 |
| VSDX-03 | launch.json exists with 3 configs | manual | Open VS Code Run & Debug panel | Wave 0 |

### Wave 0 Gaps
- [ ] `packages/common/vitest.config.ts` — TEST-01, TEST-04
- [ ] `packages/ui/vitest.config.ts` — TEST-01, TEST-05
- [ ] `packages/common/src/__tests__/networkSides.test.ts` — at least one test to confirm runner works
- [ ] `packages/ui/src/__tests__/classes.util.test.ts` — confirms happy-dom + util
- [ ] `packages/ui/src/__tests__/Button.test.tsx` — confirms React + happy-dom + RTL
- [ ] `packages/ui/src/test/setup.ts` — jest-dom matchers
- [ ] `.vscode/launch.json` — VSDX-03
- [ ] Install: `bun add -D vitest --filter @repo/common`
- [ ] Install: `bun add -D vitest happy-dom @testing-library/react @testing-library/jest-dom sass --filter @repo/ui`

---

## Security Domain

This phase adds test infrastructure and VS Code debug config only. No authentication, session handling, input validation, cryptography, or network exposure is introduced. Security domain is not applicable to this phase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | SCSS imports in vitest.config.ts will not throw without explicit sass config as long as `sass` is installed as devDep | Pitfall 3 | Build failure on first test run; fix: add explicit css preprocessor config or mock |
| A2 | `figma` global is not imported at module load time in `packages/common` | Pitfall 4 | Tests fail at import; fix: mock `figma` in setup file |
| A3 | Bun hoists vitest binary to workspace root `node_modules/.bin/vitest` | Open Questions #1 | launch.json `program` path wrong; fix: adjust to per-package `.bin` path |

---

## Sources

### Primary (HIGH confidence)
- [vitest.dev/guide/environment](https://vitest.dev/guide/environment) — environment options, package requirements
- [vitest.dev/guide/debugging](https://vitest.dev/guide/debugging) — VS Code launch.json for Vitest
- [vitest.dev/config/](https://vitest.dev/config/) — defineConfig syntax, environment option
- [turborepo.dev/docs/guides/tools/vitest](https://turborepo.dev/docs/guides/tools/vitest) — per-package Turborepo + Vitest pattern, test/test:watch task config
- npm registry — vitest@4.1.4, happy-dom@20.8.9, @testing-library/react@16.3.2, @testing-library/jest-dom@6.9.1, @vitejs/plugin-react@6.0.1

### Secondary (MEDIUM confidence)
- [vercel.com/academy/production-monorepos/set-up-vitest](https://vercel.com/academy/production-monorepos/set-up-vitest) — jsdom/happy-dom setup file pattern (cross-verified with vitest.dev)
- [developers.figma.com/docs/plugins/debugging](https://developers.figma.com/docs/plugins/debugging) — Figma Developer VM debug approach
- [dev.to/svallory/debugging-figma-and-other-packaged-electron-apps](https://dev.to/svallory/debugging-figma-and-other-packaged-electron-apps-in-visual-studio-code-4o8c) — full launch.json + tasks.json for Figma debug attach

### Tertiary (LOW confidence)
- WebSearch community results on happy-dom vs jsdom performance — consistent across multiple sources, treated as MEDIUM

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 5 |
|-----------|-------------------|
| No test framework configured (current state) | Phase 5 creates it from scratch |
| Two separate build processes (plugin + UI) | Tests are per-package, not per-build-process |
| `src/common/`, `src/plugin/`, `src/ui/` aliases | Now `packages/common/`, `packages/ui/` — test paths must use workspace package structure |
| Build command: `npm run build` / dev: `npm run dev` | Phase uses Bun scripts; tests via `bun run test` |
| Singlefile constraint on build | Irrelevant for tests; vitest runs source, not dist |

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry 2026-04-09
- Architecture: HIGH — patterns from official Vitest + Turborepo docs
- Pitfalls: MEDIUM — items A1-A3 in assumptions log need runtime verification
- VS Code launch.json: MEDIUM — vitest debug config from official docs; Figma attach config from community source (consistent with official Figma debugging docs)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (Vitest and testing-library are stable; Figma debug approach rarely changes)
