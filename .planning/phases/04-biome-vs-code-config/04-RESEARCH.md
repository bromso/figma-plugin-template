# Phase 4: Biome & VS Code Config - Research

**Researched:** 2026-04-09
**Domain:** Biome linter/formatter setup + VS Code workspace configuration for Turborepo monorepo
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Claude's Discretion
All implementation choices (biome.json structure, VS Code file content, scripts, .code-workspace layout) are at Claude's discretion.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LINT-01 | Root `biome.json` with both linting and formatting enabled | Biome 2.x root config format documented; schema URL confirmed |
| LINT-02 | Biome configured for TypeScript + React/JSX | `javascript.jsxRuntime: "transparent"`, `jsx: "react-jsx"` in tsconfig — no extra Biome config needed; Biome auto-detects JSX in `.tsx` files |
| LINT-03 | `bun run lint` checks all packages via Turborepo | Two valid approaches: root task `//#lint` (Turborepo-recommended for Biome) or per-package `lint` scripts; documented tradeoffs |
| MONO-06 | VS Code `.code-workspace` file with multi-root workspace configuration | `.code-workspace` format documented; folders + settings structure confirmed |
| VSDX-01 | `.vscode/settings.json` with Biome as default formatter and formatOnSave | Extension ID `biomejs.biome`; exact settings.json keys verified |
| VSDX-02 | `.vscode/extensions.json` recommending Biome, Vitest, and Vite extensions | Extension IDs verified: `biomejs.biome`, `vitest.explorer`, `antfu.vite` |
| VSDX-04 | `.vscode/tasks.json` with dev shortcuts (`bun run dev`, `bun run build`) | tasks.json v2.0.0 format; `type: "shell"`, `command: "bun"`, `args: ["run", "dev"]` pattern |
</phase_requirements>

---

## Summary

Phase 4 adds the two layers of tooling that make the monorepo pleasant to work in: Biome (linter + formatter) and a VS Code workspace configuration. Neither requires any new dependencies beyond `@biomejs/biome` itself — no ESLint, no Prettier, no additional plugins. The whole phase is file creation and minor script additions.

Biome 2.x (currently 2.4.10, stable) is the correct target. The config format changed significantly from 1.x (new `includes` vs `ignore`/`include`, new `assist` block for import sorting). The VS Code extension (`biomejs.biome`) hooks into the language server protocol and needs `editor.defaultFormatter` set per language ID to avoid ambiguity when multiple formatters are installed. A root `.code-workspace` file is a simple JSON file pointing to the three workspace folders; VS Code renders it as a multi-root workspace with a single title bar.

The LINT-03 requirement says `bun run lint` via Turborepo. The Turborepo docs specifically recommend a **root task** approach for Biome (run from root, not per-package) because Biome is fast enough to scan the whole repo in one pass. However, since the existing `turbo.json` already has a `lint` task definition and the pattern in this project is per-package scripts driven by Turborepo, a per-package `lint` script (`biome check .` from each package directory) also works and aligns with the existing pipeline structure. Both approaches are documented below with their tradeoffs.

**Primary recommendation:** Root `biome.json` at repo root; per-package `lint` scripts using `biome check .`; root `.vscode/` directory with four files; root `.code-workspace` file.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @biomejs/biome | 1.9.4 | Lint + format TypeScript/JSX/JSON | Stable 1.x, widely adopted; 2.x is latest but breaking changes from 1.x — see version decision below |

### Version Decision: Biome 1.x vs 2.x

[VERIFIED: npm registry] Latest stable is `2.4.10`; latest 1.x stable is `1.9.4`.

Biome 2.x introduced significant breaking changes from 1.x:
- `ignore`/`include` fields replaced by single `includes` field [CITED: biomejs.dev/guides/upgrade-to-biome-v2]
- `organizeImports` moved to `assist.actions.source.organizeImports`
- New `extends: "//"` microsyntax for monorepo inheritance
- VS Code extension v3 requires full editor restart after upgrade

**Recommendation: Use Biome 2.x (2.4.10).** It is the current `latest` tag, has been stable since 2.0.0 in early 2025, and the monorepo `extends: "//"` feature is directly useful for LINT-F01 (future per-package configs). Using 1.x means migrating later. The breaking changes are well-documented and only affect configuration files, not runtime behavior.

**Installation:**
```bash
bun add -D -E @biomejs/biome
```

The `-E` flag pins the exact version (required for Biome; running `npx @biomejs/biome` without the exact version it was installed with causes a mismatch warning). [CITED: biomejs.dev/guides/getting-started]

---

## Architecture Patterns

### Recommended Project Structure

```
figma-plugin-template/              # repo root
├── biome.json                      # NEW — root Biome config
├── figma-plugin-template.code-workspace  # NEW — VS Code multi-root
├── .vscode/                        # NEW
│   ├── settings.json               # Biome as default formatter + formatOnSave
│   ├── extensions.json             # Biome, Vitest, Vite recommendations
│   └── tasks.json                  # dev + build shortcuts
├── apps/
│   └── figma-plugin/
│       └── package.json            # ADD: "lint": "biome check ."
├── packages/
│   ├── common/
│   │   └── package.json            # ADD: "lint": "biome check ."
│   └── ui/
│       └── package.json            # ADD: "lint": "biome check ."
└── package.json                    # already has "lint": "turbo run lint"
```

Note: `.vscode/` lives at the repo root (not inside any package). When opened via `.code-workspace` in multi-root mode, VS Code still reads the root `.vscode/` for shared settings.

### Pattern 1: Root biome.json (Biome 2.x)

**What:** Single config at repo root; all packages inherit automatically when run from their directories.
**When to use:** Always in this project (no per-package overrides in Phase 4).

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.10/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "es5"
    },
    "jsxRuntime": "transparent"
  },
  "files": {
    "includes": [
      "**/*.ts",
      "**/*.tsx",
      "**/*.js",
      "**/*.jsx",
      "**/*.json"
    ],
    "ignore": [
      "**/node_modules",
      "**/dist",
      "**/.turbo",
      "**/bun.lock"
    ]
  }
}
```

[CITED: biomejs.dev/reference/configuration — Biome 2.x schema]

**Key notes:**
- `jsxRuntime: "transparent"` is correct for React 17+ (no `import React` needed). [CITED: biomejs.dev/reference/configuration]
- `files.ignore` in Biome 2.x is a separate field from `files.includes`. The breaking change was merging `include`/`ignore` top-level into `files.includes` with negation (`!`). Inside the `files` object, `ignore` is still valid as a convenience. [CITED: biomejs.dev/guides/upgrade-to-biome-v2]
- `indentStyle: "space"` with `indentWidth: 2` matches the TypeScript convention used throughout the existing codebase.

### Pattern 2: Per-package lint scripts (LINT-03)

**What:** Each package runs `biome check .` on its own `src/` directory via a `lint` script.
**When to use:** Required — Turborepo's `lint` task drives `bun run lint` at the root.

Each package `package.json` gets:
```json
{
  "scripts": {
    "lint": "biome check --no-errors-on-unmatched ."
  }
}
```

[ASSUMED] The `--no-errors-on-unmatched` flag prevents exit code 1 when a package has no matching files. Verify this flag exists in Biome 2.x docs before using it. Alternatively, scope the path: `biome check src/`.

**Alternative approach (root task):** The Turborepo docs recommend running Biome as a root task for maximum caching efficiency:

```json
// turbo.json
{
  "tasks": {
    "//#lint": {}
  }
}
```

```json
// root package.json scripts
{
  "lint": "biome check ."
}
```

This means `bun run lint` at the root runs Biome once over everything. The tradeoff: one cache entry for the whole repo, not per-package. Since this is a template project and cache hit ratios matter less than simplicity, either approach is fine. The per-package approach aligns with the existing Turborepo task structure in this repo.

### Pattern 3: .vscode/settings.json

**What:** Per-language default formatter + formatOnSave.

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

[VERIFIED: biomejs.dev/reference/vscode — VS Code extension ID `biomejs.biome`, `formatOnSave`, `codeActionsOnSave` keys]

**Why per-language overrides:** VS Code may have other formatters installed (e.g., Prettier from a global extension). Per-language `editor.defaultFormatter` overrides ensure Biome wins for TS/JS/JSON even if another formatter is installed globally.

### Pattern 4: .vscode/extensions.json

```json
{
  "recommendations": [
    "biomejs.biome",
    "vitest.explorer",
    "antfu.vite"
  ]
}
```

[VERIFIED: marketplace.visualstudio.com — `biomejs.biome` extension page confirms ID]
[VERIFIED: marketplace.visualstudio.com — `vitest.explorer` is the official Vitest extension (formerly at `ZixuanChen.vitest-explorer`, now maintained at `vitest.explorer`)]
[VERIFIED: marketplace.visualstudio.com — `antfu.vite` is the Vite extension by Anthony Fu]

**Note on Vitest/Vite:** These are recommended for Phase 5 (Vitest) but including them now in Phase 4 satisfies VSDX-02 (which mentions Vitest and Vite) and avoids another edit to this file in Phase 5.

### Pattern 5: .vscode/tasks.json

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev",
      "type": "shell",
      "command": "bun",
      "args": ["run", "dev"],
      "group": "build",
      "isBackground": true,
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "build",
      "type": "shell",
      "command": "bun",
      "args": ["run", "build"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    }
  ]
}
```

[CITED: code.visualstudio.com/docs/debugtest/tasks — tasks.json v2.0.0 format, type "shell", command + args pattern]

**Key notes:**
- `isBackground: true` on the dev task prevents VS Code from waiting for it to exit.
- `problemMatcher: []` is needed for background tasks to prevent VS Code from hanging waiting for pattern match.
- Running from repo root (where `package.json` lives) — tasks in `.vscode/tasks.json` execute in the workspace root by default.

### Pattern 6: .code-workspace file

```json
{
  "folders": [
    { "name": "root", "path": "." },
    { "name": "apps/figma-plugin", "path": "apps/figma-plugin" },
    { "name": "packages/common", "path": "packages/common" },
    { "name": "packages/ui", "path": "packages/ui" }
  ],
  "settings": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  }
}
```

[CITED: code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces — folders + name + path + settings structure]

**Filename:** `figma-plugin-template.code-workspace` — place at repo root.

**Key notes:**
- Paths are relative to the `.code-workspace` file location.
- Including all four folders means each package's `node_modules/`, `src/`, and config files are browsable in the Explorer sidebar under their own named section.
- Settings in `.code-workspace` apply to the workspace; `.vscode/settings.json` at root also applies. They layer with `.code-workspace` settings taking higher priority than workspace folder `.vscode/settings.json`.
- Opening `figma-plugin-template.code-workspace` is what triggers VS Code to offer extension recommendations from `.vscode/extensions.json`. [ASSUMED — standard VS Code behavior, not re-verified in this session]

### Anti-Patterns to Avoid

- **Don't install biome globally or in each package.** Install once at root with `-E` (exact pin). Running `biome check` from a subdirectory finds the root `biome.json` automatically. [CITED: biomejs.dev/guides/big-projects]
- **Don't use Biome 1.x config with Biome 2.x.** The `ignore`/`include` top-level fields are gone in 2.x. Use `files.includes` with negation or `files.ignore` inside the `files` block. [CITED: biomejs.dev/guides/upgrade-to-biome-v2]
- **Don't set `"root": false` in root biome.json.** The root config file implicitly has `root: true`. Only nested package configs need `"root": false` (or `"extends": "//"` which implies it). [CITED: biomejs.dev/guides/big-projects]
- **Don't add Biome to lint SCSS files.** Biome does not support SCSS. This is a known gap acknowledged in STATE.md — acceptable, documented. The `.scss` files in `packages/ui/src/styles/` are excluded from Biome's scope.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript linting | Custom ESLint config | `@biomejs/biome` | Biome covers TS + JSX in one tool, no plugins needed |
| Code formatting | Prettier config | `@biomejs/biome` (formatter) | Already decided in STATE.md; Biome replaces Prettier |
| Import sorting | eslint-plugin-import | `assist.actions.source.organizeImports` in Biome 2.x | Built-in to Biome |
| SCSS linting | stylelint | (skip) | Out of scope; documented gap |

**Key insight:** Biome 2.x is a single binary that does formatting, linting, and import organization. There is no plugin ecosystem to wire up — the `biome.json` config is the entire setup.

---

## Common Pitfalls

### Pitfall 1: Biome version mismatch between installed binary and expected version
**What goes wrong:** `biome check` throws `"The version of the Biome binary is different from the one expected"`.
**Why it happens:** Running `npx @biomejs/biome` without exact version pinning, or installing without `-E`.
**How to avoid:** Always install with `bun add -D -E @biomejs/biome`. The `-E` flag pins the exact version so the installed binary and the version referenced in any config match.
**Warning signs:** Error message contains "version mismatch" when running `biome check`.

### Pitfall 2: Biome 2.x `includes` glob behavior change
**What goes wrong:** Files that were excluded in Biome 1.x (e.g., `dist/`, `node_modules/`) get picked up in 2.x.
**Why it happens:** Biome 2.x no longer prepends `**/` to glob patterns automatically — globs are treated literally.
**How to avoid:** Use `**/node_modules` not `node_modules` in `files.ignore`. Use `**/dist` not `dist`. [CITED: biomejs.dev/guides/upgrade-to-biome-v2]
**Warning signs:** Slow lint runs, errors from files in `dist/`.

### Pitfall 3: VS Code extension not picking up biome.json
**What goes wrong:** Biome VS Code extension shows "no configuration file" and falls back to defaults.
**Why it happens:** If `biome.requireConfiguration` is set to `true` (default in some setups) and the extension can't find `biome.json` relative to the workspace root.
**How to avoid:** Ensure `biome.json` is at the repo root — the same directory VS Code opens. When using `.code-workspace`, the workspace root is the directory containing the workspace file, so `biome.json` in the same directory is found correctly.
**Warning signs:** Biome extension status bar shows warning; format on save does nothing.

### Pitfall 4: `turbo run lint` fails because packages have no `lint` script
**What goes wrong:** Turborepo skips packages silently or errors with "missing script".
**Why it happens:** The `lint` task in `turbo.json` attempts to run `lint` in each package; packages without the script are either skipped (Turborepo default behavior) or cause an error depending on config.
**How to avoid:** Add `"lint": "biome check ."` to all three package.json files (`apps/figma-plugin`, `packages/common`, `packages/ui`). [ASSUMED — Turborepo skip vs error behavior may depend on turbo version; verify behavior with `turbo run lint --dry` before executing]
**Warning signs:** `turbo run lint` outputs "No tasks were run" or similar.

### Pitfall 5: `formatOnSave` uses wrong formatter for `.tsx` files
**What goes wrong:** VS Code formats `.tsx` with the default TypeScript formatter (or Prettier) instead of Biome.
**Why it happens:** The `editor.defaultFormatter` global setting is overridden or another extension has registered as a formatter for TypeScript React files.
**How to avoid:** Set per-language overrides for both `[typescript]` and `[typescriptreact]` in `.vscode/settings.json`. [VERIFIED: biomejs.dev/reference/vscode]

---

## Code Examples

### biome.json — full example for this project

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.10/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "es5"
    },
    "jsxRuntime": "transparent"
  },
  "files": {
    "includes": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.json"],
    "ignore": ["**/node_modules", "**/dist", "**/.turbo", "**/bun.lock"]
  }
}
```

[CITED: biomejs.dev/reference/configuration — Biome 2.x schema reference]

### Package lint script

```json
// In each package's package.json
{
  "scripts": {
    "lint": "biome check ."
  }
}
```

### Running lint

```bash
# From repo root — runs turbo which triggers each package's lint script
bun run lint

# Direct Biome run from root (bypasses Turborepo)
bunx biome check .

# With fixes applied
bunx biome check --write .
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ESLint + Prettier | Biome | 2023 (Biome 1.0) | Single tool, 10-100x faster, no plugin ecosystem |
| Biome 1.x `ignore`/`include` | Biome 2.x `files.includes` with negation | Biome 2.0 (2025) | Config syntax breaking change |
| `organizeImports` block | `assist.actions.source.organizeImports` | Biome 2.0 (2025) | Import sorting config moved |
| `extends: "../../biome.json"` | `extends: "//"` | Biome 2.0 (2025) | Cleaner monorepo inheritance |

**Deprecated/outdated:**
- Biome 1.x `pipeline` key in config: Removed in 2.x (was never standard anyway)
- `biome.lspBin` VS Code setting: Renamed to `biome.lsp.bin` in extension v3+
- `biome.requireConfigFile`: Renamed to `biome.requireConfiguration`

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `--no-errors-on-unmatched` flag exists in Biome 2.x for handling packages with no matching files | Architecture Patterns (Pattern 2) | Alternative: scope path to `src/` explicitly to avoid the issue entirely |
| A2 | Opening `.code-workspace` triggers VS Code extension recommendation popup from `.vscode/extensions.json` | Architecture Patterns (Pattern 6) | Low risk — standard VS Code behavior; if wrong, recommendations still appear on direct folder open |
| A3 | Turborepo skips (rather than errors) packages missing a `lint` script | Common Pitfalls (Pitfall 4) | If Turborepo errors instead of skipping, all packages need the lint script added before `bun run lint` works |
| A4 | Schema URL `https://biomejs.dev/schemas/2.4.10/schema.json` is valid for Biome 2.4.10 | Code Examples | If schema URL 404s, remove `$schema` field or use `https://biomejs.dev/schemas/2.3.11/schema.json` which was confirmed valid |

**Note on A3:** Running `turbo run lint --dry-run` before the actual run is a safe verification step the planner should include as a pre-check task.

---

## Open Questions

1. **Biome 1.9.4 vs 2.4.10**
   - What we know: 2.4.10 is latest stable; 1.9.4 is last 1.x stable; breaking config changes exist
   - What's unclear: Whether any other tool in the stack requires Biome 1.x (unlikely — Biome is a standalone CLI)
   - Recommendation: Use 2.4.10. No dependency in this project constrains Biome version. Using latest avoids a future migration.

2. **Turborepo root task vs per-package lint**
   - What we know: Turborepo docs recommend root task for Biome; this project uses per-package task pattern
   - What's unclear: Which approach the developer prefers for consistency
   - Recommendation: Per-package scripts (`biome check .` in each `package.json`) to match existing project pattern. All three packages get a `lint` script.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @biomejs/biome | LINT-01, LINT-02, LINT-03 | Not yet installed | — | Must install |
| bun | Package installation | Confirmed (bun.lock exists) | 1.3.11 (from packageManager field) | — |
| turbo | LINT-03 (turbo run lint) | Confirmed (turbo.json exists) | ^2.9.5 | — |
| VS Code | VSDX-01, VSDX-02, VSDX-04, MONO-06 | Assumed developer tool | — | Files are static JSON, always safe to create |

**Missing dependencies with no fallback:**
- `@biomejs/biome` must be installed at root as dev dependency. Install step: `bun add -D -E @biomejs/biome`

---

## Validation Architecture

No test framework is configured for this project (per CLAUDE.md). Phase 4 adds no test infrastructure — that is Phase 5's scope. Validation for this phase is behavioral:

### Phase Gate Verification (manual)

| Req ID | Behavior | How to Verify |
|--------|----------|---------------|
| LINT-01/02 | biome.json lints and formats | Run `bunx biome check .` from root; expect zero errors on clean code |
| LINT-03 | `bun run lint` via Turborepo | Run `bun run lint` at root; all three packages execute lint task |
| MONO-06 | .code-workspace opens multi-root | Open file in VS Code; verify 4 folders in Explorer sidebar |
| VSDX-01 | Format on save works | Open a `.ts` file, add extra whitespace, save; verify Biome formats it |
| VSDX-02 | Extensions recommended | Open workspace; verify VS Code shows "install recommended extensions" prompt |
| VSDX-04 | Tasks panel shows dev/build | Open VS Code Command Palette → "Tasks: Run Task"; verify dev and build appear |

---

## Security Domain

This phase creates only static configuration files and installs a dev-only CLI tool. No authentication, data handling, or network-exposed code is introduced. Security domain is not applicable.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 4 |
|-----------|------------------|
| No test framework configured | Validation Architecture section uses manual verification only |
| SCSS with CSS Modules (`*.module.scss`) | Biome does not lint SCSS — exclude `.scss` from `files.includes` or rely on default ignore |
| Path aliases `@common`, `@ui`, `@plugin` | Biome does not resolve path aliases during lint; this is fine — aliases are a TypeScript/Vite concern, not a linting concern |
| `src/plugin/` has no DOM access | Biome's browser globals may flag Figma-specific globals; configure `javascript.globals` if needed |
| Package manager is Bun | Use `bun add` not `npm install`; use `bunx biome` not `npx biome` |
| Commands use `npm run` in CLAUDE.md | CLAUDE.md is pre-monorepo migration; actual commands are `bun run` per STATE.md |

---

## Sources

### Primary (HIGH confidence)
- [biomejs.dev/reference/configuration](https://biomejs.dev/reference/configuration/) — biome.json schema structure, `files`, `linter`, `formatter`, `javascript` sections
- [biomejs.dev/reference/vscode](https://biomejs.dev/reference/vscode/) — VS Code extension ID `biomejs.biome`, settings.json keys, codeActionsOnSave
- [biomejs.dev/guides/upgrade-to-biome-v2](https://biomejs.dev/guides/upgrade-to-biome-v2/) — 1.x to 2.x breaking changes, glob behavior change
- [biomejs.dev/guides/big-projects](https://biomejs.dev/guides/big-projects/) — monorepo setup, `extends: "//"` microsyntax
- [turborepo.dev/docs/guides/tools/biome](https://turborepo.dev/docs/guides/tools/biome) — Turborepo root task recommendation for Biome
- [npm registry] `@biomejs/biome` — version 2.4.10 confirmed as latest stable; 1.9.4 as latest 1.x

### Secondary (MEDIUM confidence)
- [marketplace.visualstudio.com/items?itemName=biomejs.biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) — confirms extension ID
- [marketplace.visualstudio.com/items?itemName=vitest.explorer](https://marketplace.visualstudio.com/items?itemName=vitest.explorer) — confirms Vitest extension ID
- [marketplace.visualstudio.com/items?itemName=antfu.vite](https://marketplace.visualstudio.com/items?itemName=antfu.vite) — confirms Vite extension ID
- [code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces](https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces) — `.code-workspace` format (via WebSearch result)

### Tertiary (LOW confidence)
- WebSearch results for tasks.json format — cross-referenced with VS Code docs pattern; marked LOW only because not fetched from official URL directly

---

## Metadata

**Confidence breakdown:**
- Standard stack (Biome 2.4.10): HIGH — npm registry verified
- biome.json config format: HIGH — official Biome docs fetched
- VS Code settings.json pattern: HIGH — official Biome VS Code reference fetched
- Extension IDs: HIGH — Marketplace URLs verified via WebSearch
- .code-workspace format: MEDIUM — WebSearch result with official URL; page not directly fetched
- tasks.json format: MEDIUM — WebSearch with multiple consistent sources; standard pattern

**Research date:** 2026-04-09
**Valid until:** 2026-07-09 (90 days; Biome releases frequently but config format is stable in 2.x)
