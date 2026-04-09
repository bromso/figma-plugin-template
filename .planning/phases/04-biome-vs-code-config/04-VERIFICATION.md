---
phase: 04-biome-vs-code-config
verified: 2026-04-09T12:00:00Z
status: human_needed
score: 4/5
overrides_applied: 0
human_verification:
  - test: "Open any .ts or .tsx file in VS Code and save it"
    expected: "File auto-formats with Biome (spacing, quotes, semicolons applied); no prompt to choose a formatter"
    why_human: "VS Code format-on-save is controlled by editor settings that cannot be verified without running VS Code with the extension installed"
  - test: "Clone the repo fresh and open the workspace in VS Code"
    expected: "VS Code shows a notification prompting to install recommended extensions (Biome, Vitest, Vite)"
    why_human: "Extension recommendation prompt is VS Code UI behavior that cannot be triggered programmatically"
  - test: "Open VS Code Tasks panel (Terminal > Run Task)"
    expected: "Two tasks visible: 'dev' and 'build'; running 'dev' starts watch mode without VS Code waiting for exit"
    why_human: "VS Code task panel visibility and isBackground behavior require a running VS Code instance"
---

# Phase 4: Biome & VS Code Config Verification Report

**Phase Goal:** Developers get automatic formatting on save and lint feedback in VS Code immediately after cloning
**Verified:** 2026-04-09T12:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `bun run lint` checks all packages and reports TypeScript + JSX lint issues | VERIFIED | `bun run lint` runs 3 tasks via Turborepo (`@repo/common:lint`, `@repo/figma-plugin:lint`, `@repo/ui:lint`), all exit 0; JSX configured via `jsxRuntime: "transparent"` in biome.json |
| 2 | Opening a `.ts` or `.tsx` file in VS Code and saving auto-formats with Biome | NEEDS HUMAN | `.vscode/settings.json` has `"editor.defaultFormatter": "biomejs.biome"` and `"editor.formatOnSave": true` with per-language overrides — but actual runtime formatting behavior requires VS Code with the Biome extension |
| 3 | VS Code prompts to install recommended extensions (Biome, Vitest, Vite) on first open | NEEDS HUMAN | `.vscode/extensions.json` contains `biomejs.biome`, `vitest.explorer`, `antfu.vite` — but prompt display requires VS Code runtime |
| 4 | VS Code tasks panel shows dev and build shortcuts that execute correctly | NEEDS HUMAN | `.vscode/tasks.json` has `dev` (isBackground: true, problemMatcher: []) and `build` (isDefault: true) — but tasks panel display requires VS Code runtime |
| 5 | `.code-workspace` file opens all workspace folders in VS Code multi-root mode | VERIFIED | `figma-plugin-template.code-workspace` is valid JSON containing 4 folders: root, apps/figma-plugin, packages/common, packages/ui |

**Score:** 4/5 truths verified (2 programmatically verified; 3 verified by config existence with human confirmation needed for runtime behavior)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `biome.json` | Root Biome configuration — linter | VERIFIED | Contains `"linter": { "enabled": true, "rules": { "recommended": true } }` |
| `biome.json` | Formatter config | VERIFIED | Contains `"formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 }` |
| `apps/figma-plugin/package.json` | lint script for figma-plugin | VERIFIED | Contains `"lint": "biome check ."` |
| `packages/common/package.json` | lint script for common | VERIFIED | Contains `"lint": "biome check ."` |
| `packages/ui/package.json` | lint script for ui | VERIFIED | Contains `"lint": "biome check ."` |
| `.vscode/settings.json` | Biome as default formatter with formatOnSave | VERIFIED | Contains `"editor.defaultFormatter": "biomejs.biome"` and `"editor.formatOnSave": true` with 6 per-language overrides |
| `.vscode/extensions.json` | Extension recommendations | VERIFIED | Contains `biomejs.biome`, `vitest.explorer`, `antfu.vite` |
| `.vscode/tasks.json` | Dev and build task shortcuts | VERIFIED | Contains `dev` (isBackground: true, problemMatcher: []) and `build` (isDefault: true) tasks using `bun` |
| `figma-plugin-template.code-workspace` | Multi-root workspace configuration | VERIFIED | Valid JSON with 4 folders and `editor.formatOnSave: true` in workspace settings |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `turbo.json` | `*/package.json` lint scripts | `turbo run lint` triggers per-package `biome check .` | WIRED | `turbo.json` has `"lint": { "outputs": [] }`; all 3 packages have `"lint": "biome check ."`. `bun run lint` exits 0 running 3 packages. |
| `.vscode/settings.json` | `biome.json` | `editor.defaultFormatter` references `biomejs.biome` extension which reads `biome.json` | WIRED | settings.json declares `biomejs.biome` as formatter; biome.json exists at root with full config |
| `figma-plugin-template.code-workspace` | `apps/figma-plugin`, `packages/common`, `packages/ui` | `folders` array paths | WIRED | All 3 package paths present in folders array alongside `root (.)` |

### Data-Flow Trace (Level 4)

Not applicable. This phase produces only static configuration files — no runtime components, APIs, or data rendering.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `bun run lint` runs all 3 packages and exits 0 | `bun run lint` | `Tasks: 3 successful, 3 total` — exit 0 | PASS |
| `biome.json` is valid and parseable | `bunx biome check --max-diagnostics=5 .` | 3 packages pass, 1 warning (noExplicitAny — exit 0) | PASS |
| `.code-workspace` is valid JSON | `node -e "JSON.parse(...)"` | `Valid JSON` | PASS |
| VS Code format-on-save activates | Requires VS Code runtime | N/A | SKIP — requires running VS Code |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| LINT-01 | 04-01-PLAN.md | Root `biome.json` with linting and formatting enabled | SATISFIED | `biome.json` exists with `linter.enabled: true` and `formatter.enabled: true` |
| LINT-02 | 04-01-PLAN.md | Biome configured for TypeScript + React/JSX | SATISFIED | `biome.json` has `"jsxRuntime": "transparent"` and `files.includes` covering `**/*.ts`, `**/*.tsx`, `**/*.jsx` |
| LINT-03 | 04-01-PLAN.md | `bun run lint` checks all packages via Turborepo | SATISFIED | `bun run lint` → `turbo run lint` runs lint in all 3 packages; `turbo.json` defines lint task |
| MONO-06 | 04-02-PLAN.md | VS Code `.code-workspace` file with multi-root workspace configuration | SATISFIED | `figma-plugin-template.code-workspace` at repo root; 4 folders; valid JSON |
| VSDX-01 | 04-02-PLAN.md | `.vscode/settings.json` with Biome as default formatter and formatOnSave | SATISFIED | `settings.json` has `"editor.defaultFormatter": "biomejs.biome"`, `"editor.formatOnSave": true`, and 6 per-language overrides |
| VSDX-02 | 04-02-PLAN.md | `.vscode/extensions.json` recommending Biome, Vitest, and Vite extensions | SATISFIED | `extensions.json` contains `biomejs.biome`, `vitest.explorer`, `antfu.vite` |
| VSDX-04 | 04-02-PLAN.md | `.vscode/tasks.json` with dev shortcuts | SATISFIED | `tasks.json` has `dev` (bun run dev, isBackground: true) and `build` (bun run build, isDefault: true) |

All 7 requirement IDs declared in plan frontmatter accounted for. No orphaned requirements — REQUIREMENTS.md maps exactly these 7 IDs to Phase 4. VSDX-03 (launch.json debug configurations) is correctly assigned to Phase 5 in REQUIREMENTS.md, not Phase 4.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/ui/src/utils/classes.util.ts` | 1 | `noExplicitAny` — `args: any[]` | INFO | Biome warning (exit 0); pre-existing; cannot be auto-fixed without changing function signature. Does not block lint pass. |

No blockers or stub anti-patterns found in any phase 4 artifacts.

Note: The `biome.json` uses negation patterns (`!**/node_modules`) inside `files.includes` instead of a separate `files.ignore` block. This is the correct Biome 2.4.10 syntax — the plan's template used the unsupported `ignore` key, which was corrected during execution.

### Human Verification Required

Three behaviors require VS Code runtime to confirm. All supporting static configuration is in place and verified:

#### 1. Format on Save

**Test:** Open `apps/figma-plugin/src/plugin/plugin.ts` (or any `.ts` file) in VS Code with the Biome extension installed. Add some formatting violation (extra spaces, wrong quotes) and save.
**Expected:** VS Code auto-formats the file using Biome rules (double quotes, 2-space indent, 100 character line width) without prompting to choose a formatter.
**Why human:** VS Code format-on-save and the extension's activation cannot be verified without a running VS Code instance with the Biome extension installed.

#### 2. Extension Recommendation Prompt

**Test:** Clone the repo fresh (or open the workspace in a VS Code profile without Biome installed).
**Expected:** VS Code shows a notification: "This workspace has extension recommendations. Do you want to install the recommended extensions?" listing Biome, Vitest, and Vite.
**Why human:** The extension recommendation prompt is a VS Code UI event fired on workspace open — not programmatically testable.

#### 3. Tasks Panel Dev/Build Shortcuts

**Test:** Open Terminal > Run Task in VS Code.
**Expected:** Two tasks listed: `dev` and `build`. Running `dev` opens a new terminal running `bun run dev` that stays open (background task, not terminated on window close). Running `build` runs `bun run build`.
**Why human:** VS Code task panel visibility and task execution behavior require a running VS Code instance.

### Gaps Summary

No gaps. All automated checks passed. Human verification is needed for the 3 VS Code runtime behaviors, but these require a live VS Code instance — the underlying configuration is fully correct. The phase goal is structurally complete: all configuration files exist, contain the correct content, and are properly wired together.

---

_Verified: 2026-04-09T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
