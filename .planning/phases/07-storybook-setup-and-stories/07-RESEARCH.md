# Phase 7: Storybook Setup and Stories - Research

**Researched:** 2026-04-09
**Domain:** Storybook 10 + React Vite + Turborepo monorepo
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Storybook Architecture**
- Storybook app lives in `apps/storybook` — follows monorepo convention of apps/ for runnable apps
- Use `@storybook/react-vite` framework — matches project's Vite toolchain, no webpack
- Stories live in `apps/storybook/src/stories/` — keeps packages/ui clean, Storybook owns its stories
- Use Storybook 8.x (latest stable) — mature React-Vite support, Autodocs built-in

**Story Configuration**
- CSF3 with autodocs — auto-generates docs from component props, less maintenance
- Controls auto-detected from TypeScript types — react-figma-ui has typed props, Storybook infers Controls
- No custom Storybook theme — use default Storybook UI, focus on component documentation

**Viewport & Turborepo Integration**
- 3 Figma plugin viewport presets: Small (300x200), Medium (320x500), Large (400x600)
- `storybook` task in turbo.json: persistent, no cache (dev server runs continuously)
- `build-storybook` task in turbo.json: cached (second run shows cache hit)

### Claude's Discretion

None specified.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SB-01 | apps/storybook package exists with @storybook/react-vite and runs via `bun run storybook` | Package install procedure, package.json scripts pattern |
| SB-02 | Turborepo has `storybook` (persistent, no cache) and `build-storybook` (cached) tasks | Turborepo task configuration patterns |
| SB-03 | Every react-figma-ui component has a story with Controls and Autodocs | CSF3 story format, autodocs tag, figma-plugin-ds CSS import strategy |
| SB-04 | Custom Figma plugin viewport presets are configured (300x200, 320x500, 400x600) | Storybook 10 viewport configuration API |
</phase_requirements>

---

## Summary

Storybook's `latest` npm tag resolves to **10.3.5**, not 8.x. The CONTEXT.md locked decision says "Storybook 8.x (latest stable)" but the current stable is 10.x. Storybook 10 is ESM-only, requires Node 20.19+ or 22.12+, and has removed `@storybook/addon-essentials` (its contents are now built into the `storybook` core package). The planner must decide whether to target Storybook 10 (current latest) or pin to the last Storybook 8 release (8.6.18). Storybook 10 has `@storybook/react-vite` that supports Vite 6, which matches the project's toolchain. See Assumptions Log entry A1 for the version decision.

The good news on Bun compatibility: Storybook's bun.lock text-file detection was fixed in 8.6.0-alpha.2 (merged January 2025) and shipped in all releases since. The project uses `bun.lock` (text format, Bun 1.3.11 default), so the `bun.lockb` stub workaround noted in STATE.md is **no longer required** when using Storybook 8.6+ or 10.x.

Storybook 10's key changes relevant to this phase: `@storybook/addon-essentials` no longer exists as a separate install — viewport, controls, interactions, and actions are bundled into the `storybook` core package. `@storybook/addon-docs` remains a separate required package. The phase can use CSF3 with `tags: ['autodocs']` in preview.ts for global autodocs enabling, and the Storybook viewport addon (built-in) supports custom presets via `parameters.viewport.options` in `preview.ts`.

**Primary recommendation:** Use Storybook 10.3.5 with `@storybook/react-vite` 10.3.5 and `@storybook/addon-docs` 10.3.5. Install manually (not via `storybook init` wizard) to avoid interactive prompts. The bun.lock stub workaround is not needed.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| storybook | 10.3.5 | CLI, core runtime, bundled essentials (viewport, controls, actions) | Current stable — includes viewport/controls/actions built-in, no separate addon-essentials needed |
| @storybook/react-vite | 10.3.5 | React + Vite framework integration | Only non-webpack framework for Vite; peer-requires Vite 5/6/7/8 and React 16-19 |
| @storybook/addon-docs | 10.3.5 | Autodocs, MDX, prop tables | Separate package required for Autodocs in Storybook 10 |

[VERIFIED: npm registry — npm view storybook, @storybook/react-vite, @storybook/addon-docs on 2026-04-09]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vite | ^6.0.0 | Bundler for Storybook's Vite builder | Already in workspace; Storybook's react-vite builder uses the project's own Vite instance |
| react | ^18.2.0 | Component rendering | Already in @repo/ui; declared as peerDependency |
| react-dom | ^18.2.0 | DOM rendering for stories | Already in @repo/ui |

[VERIFIED: codebase — packages/ui/package.json]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Storybook 10.3.5 | Storybook 8.6.18 | 8.6.18 is still supported; 10.x is ESM-only and requires Node 20.19+. Both support @storybook/react-vite with Vite 6. Use 10.x unless ESM-only is a concern. |
| apps/storybook as manual setup | `storybook init` CLI wizard | Wizard is interactive and installs in CWD; manual setup is required for monorepo apps/ placement |

### Installation

```bash
# From repo root, creating the workspace app first
mkdir -p apps/storybook
cd apps/storybook

# Install Storybook 10 packages (no addon-essentials needed)
bun add -D storybook@10.3.5 @storybook/react-vite@10.3.5 @storybook/addon-docs@10.3.5
bun add -D react@^18.2.0 react-dom@^18.2.0 vite@^6.0.0 @vitejs/plugin-react@^4.0.0
```

**Version verification (checked 2026-04-09):**
- `storybook`: 10.3.5 [VERIFIED: npm registry]
- `@storybook/react-vite`: 10.3.5 [VERIFIED: npm registry]
- `@storybook/addon-docs`: 10.3.5 [VERIFIED: npm registry]

---

## Architecture Patterns

### Recommended Project Structure

```
apps/storybook/
├── .storybook/
│   ├── main.ts          # Framework, stories glob, addons
│   └── preview.ts       # Global decorators, viewport presets, autodocs tag
├── src/
│   └── stories/
│       ├── Button.stories.tsx
│       ├── Checkbox.stories.tsx
│       ├── Disclosure.stories.tsx
│       ├── DisclosureItem.stories.tsx
│       ├── Icon.stories.tsx
│       ├── IconButton.stories.tsx
│       ├── Input.stories.tsx
│       ├── Label.stories.tsx
│       ├── OnboardingTip.stories.tsx
│       ├── Radio.stories.tsx
│       ├── Select.stories.tsx    # includes SelectMenuOption
│       ├── SectionTitle.stories.tsx
│       ├── Switch.stories.tsx
│       ├── Textarea.stories.tsx
│       └── Type.stories.tsx
├── package.json
└── tsconfig.json
```

### Pattern 1: apps/storybook package.json

```json
{
  "name": "@repo/storybook",
  "private": true,
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "@repo/ui": "workspace:*"
  },
  "devDependencies": {
    "storybook": "10.3.5",
    "@storybook/react-vite": "10.3.5",
    "@storybook/addon-docs": "10.3.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

[ASSUMED — exact script names and package name not verified against project convention; model on existing apps/figma-plugin/package.json]

### Pattern 2: .storybook/main.ts

```typescript
// Source: storybook.js.org/docs/configure
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
};

export default config;
```

[CITED: https://storybook.js.org/docs/configure]

### Pattern 3: .storybook/preview.ts — Autodocs + Viewport presets

```typescript
// Source: storybook.js.org/docs/writing-docs/autodocs + storybook.js.org/docs/essentials/viewport
import type { Preview } from '@storybook/react-vite';
import '@repo/ui'; // side-effect: loads figma-plugin-ds CSS via packages/ui/src/index.ts

const preview: Preview = {
  tags: ['autodocs'],   // enables Autodocs for all stories globally
  parameters: {
    viewport: {
      options: {
        figmaSmall: {
          name: 'Figma Plugin Small (300x200)',
          styles: { width: '300px', height: '200px' },
        },
        figmaMedium: {
          name: 'Figma Plugin Medium (320x500)',
          styles: { width: '320px', height: '500px' },
        },
        figmaLarge: {
          name: 'Figma Plugin Large (400x600)',
          styles: { width: '400px', height: '600px' },
        },
      },
    },
  },
};

export default preview;
```

[CITED: https://storybook.js.org/docs/essentials/viewport — verified viewport `options` object shape with `name`+`styles.width`+`styles.height`]

**Note on CSS import:** `@repo/ui` barrel (packages/ui/src/index.ts) already contains `import 'figma-plugin-ds/dist/figma-plugin-ds.css'` as a side-effect. Importing `@repo/ui` in preview.ts triggers this CSS load in Storybook's iframe. This is the correct approach — Storybook handles CSS from workspace package dependencies.

### Pattern 4: CSF3 story format with Autodocs

```typescript
// Source: storybook.js.org/docs/api/csf
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@repo/ui';

const meta = {
  component: Button,
  title: 'Components/Button',
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // args auto-detected from TypeScript prop types
  },
};
```

[CITED: https://storybook.js.org/docs/api/csf]

**Note:** When `tags: ['autodocs']` is set globally in preview.ts, every story file automatically generates an Autodocs page. No per-file `tags` needed unless opting out with `tags: ['!autodocs']`.

### Pattern 5: turbo.json task configuration

```json
{
  "tasks": {
    "storybook": {
      "cache": false,
      "persistent": true
    },
    "build-storybook": {
      "dependsOn": ["^build"],
      "outputs": ["storybook-static/**"]
    }
  }
}
```

[CITED: https://turborepo.dev/docs/guides/tools/storybook — output dir `storybook-static` is Storybook's default build output]

### Anti-Patterns to Avoid

- **Including vite-plugin-singlefile in Storybook's Vite config:** Storybook runs its own independent Vite instance; inlining everything into one HTML file breaks Storybook's HMR and multi-chunk build. Do not inherit the figma-plugin Vite config.
- **Using `storybook init` in the monorepo root:** The wizard installs in CWD and may create files in the wrong location; always create the workspace package manually.
- **Importing `@storybook/addon-essentials`:** This package is empty/removed in Storybook 10. The viewport, controls, actions, and interactions addons are built into the `storybook` core package.
- **Creating a bun.lockb stub:** No longer needed. Storybook 8.6+ and 10.x detect the text-based `bun.lock` file correctly. [VERIFIED: GitHub PR #30160 merged Jan 2025]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Prop table / Controls | Custom form for toggling props | Storybook Controls (built-in, inferred from TypeScript types via react-docgen-typescript) | react-figma-ui has TypeScript prop types; @storybook/react-vite ships @joshwooding/vite-plugin-react-docgen-typescript as a dependency |
| Documentation pages | Custom MDX or static docs | Storybook Autodocs (built-in via @storybook/addon-docs) | Global `tags: ['autodocs']` generates a Docs page for every component automatically |
| Viewport switcher | CSS media query toggle | Storybook Viewport addon (built-in in Storybook 10 core) | Built-in toolbar button; custom presets via `parameters.viewport.options` |
| Story isolation | Wrapper divs or manual setup | Storybook decorators in preview.ts | Storybook handles iframe isolation per-story |

**Key insight:** Storybook 10 bundles viewport, controls, actions, and interactions into core — nothing extra to install beyond `storybook`, `@storybook/react-vite`, and `@storybook/addon-docs`.

---

## Common Pitfalls

### Pitfall 1: Storybook Version Mismatch

**What goes wrong:** CONTEXT.md specifies "Storybook 8.x" but `npm install storybook@latest` resolves to 10.3.5. If addon packages are installed at version 8.x alongside core at 10.x, Storybook throws version mismatch errors at startup.
**Why it happens:** The `latest` tag moved past 8.x; "8.x" in the context decision was written before 10 released.
**How to avoid:** Pin all Storybook packages to the same exact version (either all `8.6.18` or all `10.3.5`). Never mix major versions. Use `storybook@10.3.5` and `@storybook/react-vite@10.3.5` and `@storybook/addon-docs@10.3.5` together.
**Warning signs:** Startup error "Storybook package versions are not aligned"; multiple `@storybook/core` versions in node_modules.

### Pitfall 2: figma-plugin-ds ESM Import Failure in Storybook

**What goes wrong:** `figma-plugin-ds/index.js` uses bare imports without `.js` extension (broken under Node 24 strict ESM). If not aliased, Storybook's Vite instance will fail to resolve `figma-plugin-ds` when React components import it.
**Why it happens:** The same issue that required the `__mocks__/figma-plugin-ds.js` in packages/ui for Vitest. Storybook's Vite instance will hit the same broken import.
**How to avoid:** In `apps/storybook/.storybook/main.ts`, add a `viteFinal` config that aliases `figma-plugin-ds` to a stub (the same stub at `packages/ui/__mocks__/figma-plugin-ds.js`). Alternatively, import only the CSS from `figma-plugin-ds/dist/figma-plugin-ds.css` via the `@repo/ui` barrel, and alias the JS root away.
**Warning signs:** Build error "Cannot find module 'disclosure'" or "Cannot find module 'selectMenu'" in Storybook startup.

### Pitfall 3: vite-plugin-singlefile Interfering

**What goes wrong:** If the Storybook Vite config somehow inherits or imports the figma-plugin Vite config (which includes `vite-plugin-singlefile`), Storybook will try to inline all assets into a single HTML file, breaking HMR and the multi-bundle build.
**Why it happens:** Developers copy an existing vite.config.ts as a starting point.
**How to avoid:** `apps/storybook` has NO `vite.config.ts` of its own. Storybook's react-vite framework manages Vite internally. The `viteFinal` hook in `main.ts` is the only place to extend Vite config.
**Warning signs:** Storybook `storybook-static/` output is a single HTML file instead of a directory with JS chunks.

### Pitfall 4: Turborepo Task Name Collision

**What goes wrong:** The `storybook` script name in `apps/storybook/package.json` must match the task name in `turbo.json`. If turbo.json defines `storybook` but package.json has `dev`, turbo silently skips the app.
**Why it happens:** Turborepo task names must match package.json script names exactly.
**How to avoid:** Use script name `storybook` (not `dev`) in `apps/storybook/package.json`. Use script name `build-storybook` for the static build. Define both as tasks in `turbo.json`.
**Warning signs:** `turbo run storybook` completes instantly with "0 tasks" executed.

### Pitfall 5: bun.lockb Stub (No Longer Needed)

**What goes wrong:** STATE.md notes "Storybook 10 Bun detection requires bun.lockb stub at repo root" — this was documented when the issue was open. It was fixed in Storybook 8.6.0 (January 2025) and forward.
**Why it happens:** Storybook's package manager detection previously only checked for the binary `bun.lockb` (Bun <1.2 format). Bun 1.2+ uses text-based `bun.lock`.
**How to avoid:** Do NOT create a `bun.lockb` stub. Storybook 8.6+ and 10.x detect `bun.lock` (text) correctly. Creating a `bun.lockb` stub alongside `bun.lock` is unnecessary and may confuse Bun tooling.
**Warning signs:** Storybook falls back to npm for package management (easily spotted in startup logs).

---

## Code Examples

### viteFinal for figma-plugin-ds alias

```typescript
// Source: packages/ui/vitest.config.ts (verified pattern in codebase)
// apps/storybook/.storybook/main.ts
import path from 'node:path';
import { mergeConfig } from 'vite';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: [
          {
            find: /^figma-plugin-ds$/,
            replacement: path.resolve(
              __dirname,
              '../../../packages/ui/__mocks__/figma-plugin-ds.js',
            ),
          },
        ],
      },
    });
  },
};

export default config;
```

[VERIFIED: alias pattern from packages/ui/vitest.config.ts in codebase]

### Disclosure story (stateful component pattern)

```typescript
// Disclosure requires open/closed state management in stories
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Disclosure, DisclosureItem } from '@repo/ui';

const meta = {
  component: Disclosure,
  title: 'Components/Disclosure',
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Disclosure {...args}>
      <DisclosureItem header="Section 1">Content 1</DisclosureItem>
      <DisclosureItem header="Section 2">Content 2</DisclosureItem>
    </Disclosure>
  ),
};
```

[ASSUMED — react-figma-ui Disclosure API; verify exact prop names at install time]

### Select story (with SelectMenuOption sub-component)

```typescript
// SelectMenu needs SelectMenuOption children
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select, SelectMenuOption } from '@repo/ui';

const meta = {
  component: Select,
  title: 'Components/Select',
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectMenuOption value="option1">Option 1</SelectMenuOption>
      <SelectMenuOption value="option2">Option 2</SelectMenuOption>
    </Select>
  ),
};
```

[ASSUMED — react-figma-ui Select/SelectMenu API; verify exact component names from packages/ui/src/index.ts at runtime]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@storybook/addon-essentials` separate install | Built into `storybook` core | Storybook 9/10 | Do not install addon-essentials; remove from addons array if present |
| `bun.lockb` detection | `bun.lock` (text) + `bun.lockb` both detected | Storybook 8.6.0 (Jan 2025) | No bun.lockb stub needed |
| `@storybook/react` + `@storybook/builder-vite` two packages | `@storybook/react-vite` one package | Storybook 7+ | Single framework package only |
| `export default { title, component }` (CSF2) | `export default { component } satisfies Meta<typeof X>` (CSF3) | Storybook 7+ | Improved TypeScript types |

**Deprecated/outdated:**
- `@storybook/addon-essentials`: Empty package in Storybook 10, no longer published going forward. [CITED: https://storybook.js.org/docs/addons/addon-migration-guide]
- `@storybook/addon-interactions`, `@storybook/addon-links`, `@storybook/blocks`: Same — empty/removed in Storybook 10.
- bun.lockb stub workaround: Superseded by Storybook 8.6+ proper detection.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | User decision says "Storybook 8.x (latest stable)" but npm latest is 10.3.5. This research recommends 10.3.5. | Standard Stack, Code Examples | If user wants strict 8.x: use `storybook@8.6.18` + `@storybook/react-vite@8.6.18` + `@storybook/addon-docs@8.6.18` — same patterns apply, but `@storybook/addon-essentials` IS required for 8.x (not removed until 9/10). |
| A2 | figma-plugin-ds alias in viteFinal using relative path to `packages/ui/__mocks__/figma-plugin-ds.js` | Code Examples | Path is relative to `apps/storybook/.storybook/` — verify `__dirname` resolves correctly or use `path.resolve` from workspace root |
| A3 | react-figma-ui Disclosure, Select, and OnboardingTip story `render` patterns | Code Examples | Verify exact prop names from actual component types; CONTEXT.md notes "react-figma-ui prop API (Select name, OnboardingTip name) — verify at install time" |
| A4 | CSS loads correctly in Storybook by importing `@repo/ui` barrel in preview.ts | Architecture Patterns | The CSS side-effect import in packages/ui/src/index.ts should propagate; verify with actual Storybook run |

---

## Open Questions

1. **Storybook 8.x vs 10.x**
   - What we know: CONTEXT.md locked "Storybook 8.x (latest stable)" but npm latest is 10.3.5. Both work with Vite 6 and bun.lock text files.
   - What's unclear: Whether the user intended "latest 8.x" or just "latest stable" (which is now 10.x).
   - Recommendation: Plan for 10.3.5. Note in plan that if user prefers 8.x, use `8.6.18` with `@storybook/addon-essentials@8.6.18` added back.

2. **figma-plugin-ds JS alias scope**
   - What we know: Vitest aliases the figma-plugin-ds JS root to a stub. Storybook will hit the same broken ESM imports.
   - What's unclear: Whether the CSS-only usage pattern (CSS imported via `@repo/ui` barrel, JS root never directly imported by stories) might make the alias unnecessary.
   - Recommendation: Add the alias in viteFinal defensively. Stories import from `@repo/ui` which re-exports react-figma-ui — react-figma-ui internally imports figma-plugin-ds, which is where the broken import occurs. The alias is required.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|---------|
| Bun | Package manager | ✓ | 1.3.11 | — |
| Node.js | Storybook 10 runtime (20.19+ or 22.12+ required) | ✓ | v24.6.0 | — |
| Vite | @storybook/react-vite builder | ✓ (in workspace) | ^6.0.0 | — |
| React 18 | @storybook/react-vite | ✓ (in @repo/ui) | ^18.2.0 | — |

**Missing dependencies with no fallback:** None.

**Note:** Node v24.6.0 satisfies Storybook 10's requirement of Node 20.16+/22.19+/24+. [VERIFIED: local env check]

---

## Validation Architecture

No automated test framework is applicable to this phase. The deliverables are a Storybook app that runs and a set of story files — these are validated by running the development server and the static build, not by unit tests. The phase success criteria are manual/smoke checks:

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| SB-01 | `bun run storybook` starts dev server | Smoke | `bun run storybook --ci --smoke-test` | `--smoke-test` flag exits 0 if Storybook starts without error |
| SB-02 | `turbo run build-storybook` caches on second run | Manual | `turbo run build-storybook && turbo run build-storybook` | Check "FULL TURBO" in second run output |
| SB-03 | All 15 components have stories with Controls + Autodocs | Manual | Start Storybook, verify sidebar | 14 components + SelectMenuOption in Select story |
| SB-04 | Viewport switcher shows 3 Figma presets | Manual | Start Storybook, open viewport toolbar | Verify Small/Medium/Large options appear |

### Wave 0 Gaps
- [ ] `apps/storybook/` directory — entire package to create
- [ ] `apps/storybook/.storybook/main.ts` — framework config
- [ ] `apps/storybook/.storybook/preview.ts` — viewport presets + autodocs
- [ ] `apps/storybook/src/stories/*.stories.tsx` — 15 story files (14 components + Select with SelectMenuOption)
- [ ] `turbo.json` — add `storybook` and `build-storybook` tasks

---

## Security Domain

This phase creates a local development tooling app (Storybook) with no network exposure, authentication, or data handling. ASVS categories V2 (Authentication), V3 (Session Management), V4 (Access Control), V6 (Cryptography) do not apply. V5 (Input Validation) is handled by Storybook's own Controls rendering — no custom input processing.

No security controls required for this phase.

---

## Sources

### Primary (HIGH confidence)
- npm registry — `npm view storybook`, `npm view @storybook/react-vite`, `npm view @storybook/addon-docs` — version verification 2026-04-09
- [Storybook Viewport docs](https://storybook.js.org/docs/essentials/viewport) — custom viewport options format
- [Storybook Autodocs docs](https://storybook.js.org/docs/writing-docs/autodocs) — global tags configuration
- [Storybook CSF docs](https://storybook.js.org/docs/api/csf) — CSF3 story format
- [Storybook main config docs](https://storybook.js.org/docs/configure) — main.ts structure
- [Turborepo Storybook guide](https://turborepo.dev/docs/guides/tools/storybook) — task configuration
- Codebase — `packages/ui/vitest.config.ts` — figma-plugin-ds alias pattern
- Codebase — `packages/ui/__mocks__/figma-plugin-ds.js` — stub file location

### Secondary (MEDIUM confidence)
- [Storybook 10 blog post](https://storybook.js.org/blog/storybook-10/) — major changes vs 8.x
- [Storybook migration guide](https://storybook.js.org/docs/releases/migration-guide) — addon-essentials removal
- [Storybook addon migration guide](https://storybook.js.org/docs/addons/addon-migration-guide) — packages removed in 10
- [GitHub PR #30160](https://github.com/storybookjs/storybook/pull/30160) — bun.lock text detection fix (merged Jan 2025)
- [GitHub Issue #30366](https://github.com/storybookjs/storybook/issues/30366) — bun.lockb workaround (closed/resolved)

### Tertiary (LOW confidence)
- [Turborepo Storybook guide](https://turborepo.dev/docs/guides/tools/storybook) — `build-storybook` as the Turborepo-recommended script name (verified task structure, but project uses its own naming conventions)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against npm registry 2026-04-09
- Architecture: HIGH — verified against Storybook official docs + codebase patterns
- Pitfalls: HIGH — bun.lock fix verified via GitHub PR; viteFinal alias pattern from actual codebase code

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable ecosystem; Storybook patch releases unlikely to break these patterns)
