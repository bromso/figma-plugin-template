# Phase 13: shadcn/ui Component Migration - Research

**Researched:** 2026-04-09
**Domain:** shadcn/ui, Radix UI, Tailwind CSS 4, Figma design tokens, Vite monorepo
**Confidence:** HIGH (core stack verified via npm registry and official docs; some component implementation details ASSUMED from training)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — auto-generated infrastructure phase (discuss skipped).

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase (component library swap). Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions. Key decisions include: Figma design token values, component API surface, shadcn/ui theme configuration, and component-by-component migration approach.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | shadcn/ui installed with Radix primitives replacing react-figma-ui | shadcn/ui 4.x + radix-ui 1.4.x manual install in packages/ui; components.json monorepo pattern confirmed |
| UI-02 | Figma design tokens (colors, typography, spacing, radii) configured to match native Figma plugin appearance | figma-plugin-ds CSS variables extracted and mapped to shadcn @theme inline + :root block |
| UI-03 | All 14 component equivalents available | 10 direct shadcn/ui copies; 4 custom wrappers (Icon, IconButton, SectionTitle, Type) documented |
| UI-04 | react-figma-ui and figma-plugin-ds fully removed; postinstall workaround removed | Removal path clear once component wrappers in place; vitest mock cleanup documented |
</phase_requirements>

---

## Summary

Phase 13 replaces the `react-figma-ui` / `figma-plugin-ds` stack with `shadcn/ui` components backed by Radix UI primitives and styled with Tailwind CSS 4 design tokens derived from the native Figma plugin appearance. The migration lives entirely inside `packages/ui`; the `apps/figma-plugin` build pipeline is unaffected because it already has `@tailwindcss/vite` (installed in Phase 12). Tailwind CSS and `vite-plugin-singlefile` are already in place and are known to inline CSS correctly into the single HTML output.

shadcn/ui v4.x supports Tailwind CSS 4 natively via the `@theme inline` CSS directive. Components are copied into the project (not installed as a package import), so the `components.json` file is the critical configuration artifact. The existing monorepo uses `@repo/*` workspace aliases rather than the `@workspace/*` convention shadcn docs show — this is fine; only the `components.json` aliases and `tsconfig.json` paths need to match the actual monorepo convention.

The 10 shadcn/ui component copies (Button, Checkbox, Input, Label, Select, Switch, Textarea, RadioGroup, Accordion, Alert) cover 12 of the 14 react-figma-ui equivalents. The remaining two — `Icon` (Figma-specific SVG sprite with 84 named icons) and `Type`/`SectionTitle` (typography wrappers) — have no direct shadcn/ui counterpart and must be written as thin custom components in `packages/ui/src/components/`. `IconButton` is a `Button size="icon"` wrapper using the same Figma icon set.

**Primary recommendation:** Manual install of shadcn/ui dependencies into `packages/ui`, copy component source files via `bunx shadcn@latest add`, configure `components.json` with `@repo/ui` path aliases, declare Figma design tokens in `packages/ui/src/styles.css` using `@theme inline`, and write four custom components (Icon, IconButton, SectionTitle, Type). Remove react-figma-ui, figma-plugin-ds, the postinstall script, and all related test mocks/aliases.

---

## Project Constraints (from CLAUDE.md)

- **Package manager:** Bun 1.3.11 — use `bun add`, `bunx`; do NOT use pnpm/npm/yarn
- **Workspace imports:** Use `@repo/*` aliases, not relative paths across packages
- **Packages are JIT source-only:** No build step; Vite resolves via workspace symlinks
- **Single-file output constraint:** All CSS must be inlined by `vite-plugin-singlefile`; no external font or asset URLs
- **CSS Modules / SCSS:** Replaced by Tailwind CSS 4 in v1.2 (Phase 12)
- **Linting:** Biome 2.4.10 — no ESLint, no Prettier
- **Testing:** Vitest 4.x with happy-dom; test commands via Bun

---

## Standard Stack

### Core (installed into `packages/ui`)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn | 4.2.0 | CLI for adding component source files | Official shadcn/ui CLI; version confirmed `[VERIFIED: npm registry]` |
| radix-ui | 1.4.3 | Unified Radix primitives package | June 2025 migration to unified package; new-york style default `[VERIFIED: ui.shadcn.com/docs/changelog/2025-06-radix-ui]` |
| class-variance-authority | 0.7.1 | Typed variant definitions for components | shadcn/ui cva usage pattern `[VERIFIED: npm registry]` |
| tailwind-merge | 3.5.0 | Deduplicate Tailwind classes in cn() | Required by shadcn/ui cn utility `[VERIFIED: npm registry]` |
| clsx | 2.1.1 | Conditional class joining | Used alongside tailwind-merge in cn() `[VERIFIED: npm registry]` |
| lucide-react | 1.8.0 | Icon library (SVG icon set) | shadcn/ui default iconLibrary in components.json `[VERIFIED: npm registry]` |
| tw-animate-css | 1.4.0 | CSS animations (replaces tailwindcss-animate) | shadcn/ui deprecated tailwindcss-animate; tw-animate-css is the current replacement `[VERIFIED: ui.shadcn.com/docs/tailwind-v4]` |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | ^4.2.2 | Utility CSS (already in devDeps) | Provides @theme, @import, utility classes |
| @tailwindcss/vite | ^4.2.2 | Vite plugin for Tailwind 4 (already in figma-plugin devDeps) | Build-time CSS generation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| radix-ui (unified) | @radix-ui/react-* individual packages | radix-ui is the current default for new-york style; individual packages work but produce more package.json entries |
| lucide-react | figma-plugin-ds SVG sprite | figma-plugin-ds icons are Figma-specific (84 names); lucide-react has no equivalent. Custom Icon component is required. |
| shadcn/ui Accordion | custom disclosure | Accordion provides full accessibility; custom hand-roll not needed |

**Installation:**
```bash
# Run from packages/ui workspace directory
bun add radix-ui class-variance-authority tailwind-merge clsx lucide-react
bun add -d tw-animate-css shadcn
```

**Version verification:** [VERIFIED: npm registry 2026-04-09]
- shadcn: 4.2.0
- radix-ui: 1.4.3
- class-variance-authority: 0.7.1
- tailwind-merge: 3.5.0
- clsx: 2.1.1
- lucide-react: 1.8.0
- tw-animate-css: 1.4.0

---

## Architecture Patterns

### Recommended Project Structure

```
packages/ui/
├── components.json             # shadcn/ui CLI config — NEW
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui copied components (Button, Checkbox, etc.)
│   │   │   ├── button.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── accordion.tsx
│   │   │   └── alert.tsx
│   │   └── figma/              # Custom Figma-specific components — NEW
│   │       ├── icon.tsx        # Figma icon sprite wrapper
│   │       ├── icon-button.tsx # Button size="icon" + Figma icon
│   │       ├── section-title.tsx
│   │       └── type.tsx        # Typography text wrapper
│   ├── lib/
│   │   └── utils.ts            # cn() helper — NEW
│   ├── styles.css              # Tailwind + @theme inline Figma tokens — UPDATED
│   ├── index.ts                # Re-exports all components — UPDATED
│   └── app.tsx                 # Demo app — UPDATED
```

### Pattern 1: shadcn/ui components.json for Bun/Turborepo monorepo

**What:** `components.json` at `packages/ui/` root tells the shadcn CLI where to place component files and how to resolve workspace aliases.

**When to use:** Required for `bunx shadcn add <component>` to work correctly in the monorepo.

**Example:**
```json
// packages/ui/components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@repo/ui/components",
    "utils": "@repo/ui/lib/utils",
    "hooks": "@repo/ui/hooks",
    "lib": "@repo/ui/lib",
    "ui": "@repo/ui/components/ui"
  }
}
```

Source: [CITED: ui.shadcn.com/docs/monorepo — adapted for @repo/* aliases]

Note: `"style": "radix-nova"` uses the unified `radix-ui` package (February 2026 default). `"rsc": false` because Figma plugins are client-only. `"config": ""` because Tailwind 4 uses CSS-first config. [VERIFIED: ui.shadcn.com/docs/tailwind-v4]

### Pattern 2: Figma design tokens via `@theme inline`

**What:** Tailwind CSS 4 design tokens are declared as CSS custom properties in `:root` and exposed to Tailwind via `@theme inline`. This produces single-file-compatible inline CSS.

**When to use:** Required for shadcn/ui CSS variable system to work with Tailwind 4 in the Figma plugin iframe.

**Example:**
```css
/* packages/ui/src/styles.css */
@import "tailwindcss";
@import "tw-animate-css";

/* Scan this directory for utility classes */
@source ".";

/* Figma native design tokens mapped to shadcn/ui semantic variables */
:root {
  /* Colors — derived from figma-plugin-ds CSS variables */
  --background: oklch(1 0 0);                    /* --white: #ffffff */
  --foreground: oklch(0.2 0 0);                  /* --black8: rgba(0,0,0,.8) ≈ #333 */
  --primary: oklch(0.55 0.18 221);               /* --blue: #18a0fb */
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.97 0 0);                  /* --grey: #f0f0f0 */
  --secondary-foreground: oklch(0.2 0 0);
  --muted: oklch(0.94 0 0);                      /* --silver: #e5e5e5 */
  --muted-foreground: oklch(0.55 0 0);           /* --black3: rgba(0,0,0,.3) ≈ #b3b3b3 */
  --accent: oklch(0.94 0 0);
  --accent-foreground: oklch(0.2 0 0);
  --destructive: oklch(0.57 0.22 28);            /* --red: #f24822 */
  --border: oklch(0.9 0 0);                      /* --black1: rgba(0,0,0,.1) */
  --input: oklch(0.9 0 0);
  --ring: oklch(0.55 0.18 221);                  /* --blue focus ring */
  --radius: 0.375rem;                            /* --border-radius-large: 6px */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  /* Figma typography scale */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-size-xs: 11px;   /* --font-size-xsmall */
  --font-size-sm: 12px;   /* --font-size-small */
  --font-size-base: 13px; /* --font-size-large */
  --font-size-lg: 14px;   /* --font-size-xlarge */
}
```

Source: [CITED: ui.shadcn.com/docs/theming — token mapping to figma-plugin-ds values is ASSUMED best-effort; visual verification required]

### Pattern 3: `cn()` utility helper

**What:** Standard shadcn/ui class merge utility using clsx + tailwind-merge.

**Example:**
```typescript
// packages/ui/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Source: [CITED: ui.shadcn.com/docs/installation/manual]

### Pattern 4: Adding shadcn/ui component files via CLI

**What:** The CLI copies component source into your project; you own the code.

**Example:**
```bash
# Run from packages/ui directory (where components.json lives)
cd packages/ui
bunx shadcn@latest add button checkbox input label select switch textarea radio-group accordion alert
```

This installs component files to `src/components/ui/` and adds Radix UI peer deps to `packages/ui/package.json`. [CITED: turborepo.dev/docs/guides/tools/shadcn-ui]

### Pattern 5: Custom Figma-specific components

shadcn/ui has no `Icon`, `IconButton`, `SectionTitle`, or `Type` (typography text) component. These must be custom wrappers.

**Icon** — The existing react-figma-ui `Icon` renders Figma's 84-name SVG sprite using a `<div>` with a CSS background-image sourced from figma-plugin-ds. Because figma-plugin-ds is being removed, the icons must be re-implemented. Options:

1. **Lucide-react subset** — Map the 84 Figma icon names to lucide-react equivalents and render `<LucideIcon>` components. This requires a name-mapping table. [ASSUMED — no direct equivalents verified]
2. **Inline SVG sprites** — Bundle the 84 SVG icons as inline SVG or import each as `*.svg?component` using `vite-plugin-react-rich-svg`. This preserves exact Figma icons. [ASSUMED — technically feasible given project already uses rich-svg]
3. **CSS-only sprite (no-dep)** — Re-encode the figma-plugin-ds sprite as a data URI and include it in styles.css. Largest CSS bundle but zero extra files. [ASSUMED]

**Recommended:** Option 2 (inline SVG via rich-svg), or simply a thin wrapper that renders lucide-react icons for the small subset actually used in the demo `app.tsx`. The demo only uses `plus`, `info`, `star` — three icons. [VERIFIED: reading app.tsx]

**IconButton** — Thin wrapper over `Button size="icon"` with an Icon child:
```tsx
// packages/ui/src/components/figma/icon-button.tsx
import { Button, type ButtonProps } from '@/components/ui/button';
import { Icon, type IconProps } from './icon';

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  iconProps: IconProps;
  selected?: boolean;
}

export function IconButton({ iconProps, selected, className, ...props }: IconButtonProps) {
  return (
    <Button
      size="icon"
      variant={selected ? 'default' : 'ghost'}
      className={className}
      {...props}
    >
      <Icon {...iconProps} />
    </Button>
  );
}
```

**SectionTitle** — Typography label for panel sections:
```tsx
// packages/ui/src/components/figma/section-title.tsx
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
      {children}
    </p>
  );
}
```

**Type** — Text typography component replacing react-figma-ui `Type`:
```tsx
// packages/ui/src/components/figma/type.tsx
import { cn } from '@/lib/utils';

const sizeMap = { xsmall: 'text-[11px]', small: 'text-[12px]', large: 'text-[13px]', xlarge: 'text-[14px]' };
const weightMap = { normal: 'font-normal', medium: 'font-medium', bold: 'font-semibold' };

export function Type({ children, size = 'small', weight = 'normal', className, ...props }) {
  return (
    <p className={cn(sizeMap[size], weightMap[weight], 'font-sans', className)} {...props}>
      {children}
    </p>
  );
}
```

Source: [ASSUMED — API shape derived from react-figma-ui Type.d.ts type analysis]

### Pattern 6: tsconfig path alias for `@/` resolution

shadcn/ui component internals use `@/lib/utils` and `@/components/ui/...` imports. The `packages/ui` tsconfig.json must add this alias to resolve those imports inside the package.

```json
// packages/ui/tsconfig.json — add to compilerOptions
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

The Vite config for the UI (`vite.config.ui.ts` in `apps/figma-plugin`) must also have the matching resolve alias:
```typescript
resolve: {
  alias: {
    "@": path.resolve(uiSrcPath, "."),
  }
}
```

Source: [CITED: ui.shadcn.com/docs/installation/vite]

### Anti-Patterns to Avoid

- **Do not import from react-figma-ui** after migration; delete all imports and the package
- **Do not use `tailwind.config.js`** — Tailwind 4 is CSS-first; token values go in styles.css
- **Do not use HSL format** for CSS variables — shadcn/ui 4.x uses OKLCH; mixing formats causes color rendering differences [CITED: ui.shadcn.com/docs/theming]
- **Do not keep figma-plugin-ds CSS import** in `packages/ui/src/index.ts` — remove the side-effect import entirely
- **Do not keep the postinstall script** in `packages/ui/package.json` after removing figma-plugin-ds
- **Do not use external font URLs** (the existing figma-plugin-ds CSS loads Inter from rsms.me CDN) — the plugin runs offline in Figma's iframe, so Inter must be embedded or rely on Figma's built-in font rendering. Figma already uses Inter; the UI iframe inherits the system font stack. [ASSUMED — font URL behavior in Figma sandboxed iframe is not authoritatively documented]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Class merging with Tailwind | Custom string concat | `cn()` from clsx + tailwind-merge | tailwind-merge handles duplicate class deduplication correctly |
| Accessible select/dropdown | Native `<select>` | shadcn/ui Select (Radix) | Keyboard nav, ARIA roles, focus management handled |
| Accessible accordion | Custom toggle | shadcn/ui Accordion (Radix) | WAI-ARIA pattern, keyboard support built in |
| Accessible checkbox | `<input type="checkbox">` | shadcn/ui Checkbox (Radix) | Consistent styling + indeterminate state support |
| Accessible radio | `<input type="radio">` group | shadcn/ui RadioGroup (Radix) | roving tabindex, ARIA radiogroup |
| Accessible switch | `<input type="checkbox">` | shadcn/ui Switch (Radix) | ARIA role="switch" semantics |
| Alert/callout | `<div>` wrapper | shadcn/ui Alert | Icon + description slot, semantic ARIA |
| Component variants | Manual className checks | cva (class-variance-authority) | Type-safe variant props with defaultVariants |

**Key insight:** shadcn/ui components are copied source, not a dependency — you own and can modify them freely. There is no "upgrading" a component; you re-run the CLI to get a fresh copy if needed.

---

## Figma Design Token Mapping

The following values are extracted from `figma-plugin-ds.css` and need to be reflected in the shadcn/ui theme. [VERIFIED: direct file read of packages/ui/node_modules/figma-plugin-ds/dist/figma-plugin-ds.css]

### Colors (source → OKLCH approximation)

| figma-plugin-ds variable | Hex | shadcn semantic | OKLCH |
|--------------------------|-----|-----------------|-------|
| `--blue` | `#18a0fb` | `--primary` | `oklch(0.68 0.18 221)` |
| `--black8` / `--black8-opaque` | `#333333` | `--foreground` | `oklch(0.26 0 0)` |
| `--black3` / `--black3-opaque` | `#b3b3b3` | `--muted-foreground` | `oklch(0.73 0 0)` |
| `--white` | `#ffffff` | `--background` | `oklch(1 0 0)` |
| `--grey` | `#f0f0f0` | `--secondary` | `oklch(0.95 0 0)` |
| `--silver` | `#e5e5e5` | `--muted` / `--border` | `oklch(0.91 0 0)` |
| `--red` | `#f24822` | `--destructive` | `oklch(0.61 0.23 28)` |
| `--hover-fill` | `rgba(0,0,0,.06)` | custom `--hover` | `oklch(0.95 0 0)` |
| `--selection-a` | `#daebf7` | custom `--selection` | `oklch(0.92 0.03 221)` |

### Typography

| figma-plugin-ds variable | Value | Tailwind 4 CSS custom property |
|--------------------------|-------|-------------------------------|
| `--font-stack` | `'Inter', sans-serif` | `--font-sans: 'Inter', ...` |
| `--font-size-xsmall` | `11px` | `--font-size-xs: 11px` |
| `--font-size-small` | `12px` | `--font-size-sm: 12px` |
| `--font-size-large` | `13px` | `--font-size-base: 13px` |
| `--font-size-xlarge` | `14px` | `--font-size-lg: 14px` |
| `--font-weight-normal` | `400` | standard Tailwind `font-normal` |
| `--font-weight-medium` | `500` | standard Tailwind `font-medium` |
| `--font-weight-bold` | `600` | standard Tailwind `font-semibold` |
| `--font-line-height` | `16px` | `leading-4` (16px) |

### Spacing / Radii

| figma-plugin-ds variable | Value | Tailwind / shadcn token |
|--------------------------|-------|------------------------|
| `--border-radius-small` | `2px` | `--radius-sm` |
| `--border-radius-med` | `5px` | `--radius-md` |
| `--border-radius-large` | `6px` | `--radius` (base) |
| `--size-medium` (component height) | `32px` | `h-8` (32px) |
| `--size-xxsmall` | `8px` | `p-2` / `gap-2` |
| `--size-xsmall` | `16px` | `p-4` / `gap-4` |

---

## Component Migration Map

| react-figma-ui | Current API (key props) | shadcn/ui Replacement | Notes |
|----------------|------------------------|----------------------|-------|
| `Button` | `tint?: 'primary'\|'secondary'\|'tertiary'`, `destructive?` | `Button` (variant: default/secondary/ghost/destructive) | Map tint→variant |
| `Checkbox` | `children`, `defaultChecked`, `id` | `Checkbox` + `Label` | shadcn wraps Radix CheckboxPrimitive |
| `Input` | `placeholder` | `Input` | Direct copy |
| `Label` | `children` | `Label` | Direct copy |
| `Switch` | `children`, `id`, `defaultChecked` | `Switch` + `Label` | shadcn Switch needs adjacent label |
| `Textarea` | `placeholder`, `rows` | `Textarea` | Direct copy |
| `Radio` (single item) | `children`, `id`, `name` | `RadioGroup` + `RadioGroupItem` + `Label` | shadcn uses group pattern |
| `SelectMenu` / `Select` | `options`, `render` | `Select`, `SelectContent`, `SelectItem`, etc. | shadcn's composable Select replaces render-prop API |
| `SelectMenuOption` | `value`, `children` | `SelectItem` | rename only |
| `Disclosure` + `DisclosureTip` | `tips`, `render`, `heading`, `content`, `expanded` | `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | render-prop → composition pattern |
| `Icon` | `iconName`, `spin?`, `colorName?` | Custom `Icon` component | No shadcn equivalent; use lucide-react or SVG |
| `IconButton` | `iconProps`, `selected?` | Custom `IconButton` (Button size="icon" + Icon) | No shadcn equivalent |
| `SectionTitle` | `children` | Custom `SectionTitle` | Typography label; ~2 lines |
| `Onboarding` / `OnboardingTip` | `iconProps`, `children` | `Alert` + `AlertDescription` | shadcn Alert is the right primitive |
| `Type` | `size`, `weight`, `children` | Custom `Type` | Typography wrapper |

---

## Common Pitfalls

### Pitfall 1: `@/` path alias not resolved in Vite
**What goes wrong:** Component files use `import { cn } from "@/lib/utils"`. If the Vite resolve alias for `@` is missing in `vite.config.ui.ts`, the UI build fails with module-not-found errors.
**Why it happens:** `vite.config.ui.ts` sets `root` to `uiSrcPath` (packages/ui/src), so relative resolution works from there, but `@` must be explicitly aliased.
**How to avoid:** Add `"@": path.resolve(uiSrcPath)` to `resolve.alias` in `vite.config.ui.ts`. Also add `"paths": { "@/*": ["./src/*"] }` to `packages/ui/tsconfig.json`.
**Warning signs:** `Cannot find module '@/lib/utils'` in build output.

### Pitfall 2: shadcn CLI bun peer-dependency install gap
**What goes wrong:** `bunx shadcn add button` creates the component file but may not install the `radix-ui` peer dependency automatically.
**Why it happens:** Known issue with bunx not always auto-installing declared deps after CLI runs. [CITED: github.com/shadcn-ui/ui/issues/8356]
**How to avoid:** After running `bunx shadcn add`, verify `packages/ui/package.json` has `radix-ui` listed, then run `bun install` from repo root.
**Warning signs:** `Cannot find module 'radix-ui'` at runtime.

### Pitfall 3: Residual figma-plugin-ds test infrastructure
**What goes wrong:** After removing figma-plugin-ds, three artifacts remain that must be cleaned up: `packages/ui/__mocks__/figma-plugin-ds.js`, the vitest `resolve.alias` block in `vitest.config.ts`, and the `server.deps.inline` configuration. Leaving them causes dead mock references and Vitest warnings.
**Why it happens:** The mocking was added specifically to work around figma-plugin-ds ESM issues; it has no purpose after removal.
**How to avoid:** Remove all three artifacts as part of the same wave that deletes figma-plugin-ds from package.json.
**Warning signs:** Vitest prints "Cannot find module 'figma-plugin-ds'" or "Mock path not found".

### Pitfall 4: Exports test hardcoding react-figma-ui names
**What goes wrong:** `packages/ui/src/__tests__/exports.test.ts` checks for exact export names like `Disclosure`, `DisclosureItem`, `SelectMenuOption`. These names change after migration.
**Why it happens:** Tests were written against the react-figma-ui API shape.
**How to avoid:** Update the exports test to reflect the new component names (`Accordion`, `AccordionItem`, `SelectItem`, etc.) in the same wave as the migration.
**Warning signs:** `exports.test.ts` fails with `undefined` for renamed exports.

### Pitfall 5: Inter font loaded from CDN in old CSS — Figma offline
**What goes wrong:** `figma-plugin-ds.css` loads Inter from `rsms.me/inter/...`. Once that CSS is removed, the custom font loading is gone. If new styles.css references an external font URL, it will fail silently in Figma's sandboxed iframe (no network for external resources).
**Why it happens:** Figma plugin iframes cannot load external assets.
**How to avoid:** Do NOT add `@font-face` rules pointing to CDN URLs. Figma already renders Inter natively — the `font-family: 'Inter', sans-serif` CSS variable will resolve correctly in the Figma iframe without explicit font loading. [ASSUMED — Figma's iframe inherits the Inter font used by the Figma app itself; no official documentation confirms this]
**Warning signs:** Plugin UI text renders in a fallback sans-serif; font metrics look wrong.

### Pitfall 6: `vite-plugin-singlefile` and `@import "tw-animate-css"`
**What goes wrong:** tw-animate-css is a CSS package imported via `@import`. `vite-plugin-singlefile` inlines CSS but may not handle `@import` resolutions from node_modules.
**Why it happens:** The Tailwind CSS 4 `@import` preprocessor (run by `@tailwindcss/vite`) resolves `@import "tw-animate-css"` before Vite sees the file, so singlefile sees already-inlined CSS. This is the expected correct behavior.
**How to avoid:** Import tw-animate-css in `styles.css` (which Tailwind processes), not directly in a `<link>` or via bare Vite CSS import. [ASSUMED — based on Tailwind 4 preprocessor behavior; verify with `bun run dev:ui-only`]
**Warning signs:** Missing animation classes at runtime; build output lacks animation keyframes.

### Pitfall 7: shadcn Select replaces render-prop SelectMenu
**What goes wrong:** `app.tsx` uses the render-prop API: `<Select options={[...]} render={(opt) => <SelectMenuOption>} />`. shadcn/ui Select is composable (no render prop). Direct prop-compat is impossible.
**Why it happens:** Fundamentally different API paradigms.
**How to avoid:** Rewrite all Select usage to use the composable API:
```tsx
<Select>
  <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>
```
**Warning signs:** TypeScript errors on `options` and `render` props.

---

## Code Examples

### cn() utility
```typescript
// Source: ui.shadcn.com/docs/installation/manual
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Button with Figma tint mapping
```tsx
// Tint adapter — ASSUMED pattern
import { Button as ShadButton } from '@/components/ui/button';

const tintToVariant = {
  primary: 'default',
  secondary: 'secondary',
  tertiary: 'ghost',
} as const;

export function Button({ tint, destructive, children, ...props }) {
  return (
    <ShadButton
      variant={destructive ? 'destructive' : tintToVariant[tint ?? 'secondary']}
      {...props}
    >
      {children}
    </ShadButton>
  );
}
```

### Accordion replacing Disclosure
```tsx
// Source: CITED: ui.shadcn.com/docs/components/radix/accordion
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// Usage replacing Disclosure + DisclosureItem:
<Accordion type="multiple" defaultValue={["item-0"]}>
  <AccordionItem value="item-0">
    <AccordionTrigger>More info</AccordionTrigger>
    <AccordionContent>Details here.</AccordionContent>
  </AccordionItem>
</Accordion>
```

### Alert replacing OnboardingTip
```tsx
// Source: ASSUMED pattern from shadcn/ui Alert API
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

// Usage replacing OnboardingTip:
<Alert>
  <Info className="h-4 w-4" />
  <AlertDescription>This is a tip for new users.</AlertDescription>
</Alert>
```

### Updated index.ts re-export structure
```typescript
// packages/ui/src/index.ts — after migration
// Remove: import 'figma-plugin-ds/dist/figma-plugin-ds.css'

export { Button } from './components/figma/button';      // thin tint-mapping wrapper
export { Checkbox } from './components/ui/checkbox';
export { Input } from './components/ui/input';
export { Label } from './components/ui/label';
export { Select, SelectItem } from './components/ui/select'; // rename SelectMenuOption → SelectItem
export { Switch } from './components/ui/switch';
export { Textarea } from './components/ui/textarea';
export { RadioGroup as Radio, RadioGroupItem } from './components/ui/radio-group';
export { Accordion as Disclosure, AccordionItem as DisclosureItem,
         AccordionTrigger, AccordionContent } from './components/ui/accordion';
export { Alert as OnboardingTip, AlertDescription } from './components/ui/alert';
export { Icon } from './components/figma/icon';
export { IconButton } from './components/figma/icon-button';
export { SectionTitle } from './components/figma/section-title';
export { Type } from './components/figma/type';
export { cn as classes } from './lib/utils';
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@radix-ui/react-*` individual packages | `radix-ui` unified package | June 2025 + Feb 2026 | Single dependency; import style changed |
| `tailwindcss-animate` | `tw-animate-css` | Late 2024 / v4 era | New import path in styles.css |
| `tailwind.config.js` | CSS-first `@theme inline` in globals.css | Tailwind 4 (already done in Phase 12) | No JS config file needed |
| `"style": "default"` in components.json | `"style": "radix-vega"` or `"radix-nova"` | 2025 (cli v4) | Old "default" value no longer valid |
| HSL CSS variables (`0 0% 100%`) | OKLCH CSS variables | Late 2024 (new-york style) | Better perceptual uniformity |

**Deprecated/outdated:**
- `tailwindcss-animate`: replaced by `tw-animate-css` in shadcn/ui defaults
- `components.json` style `"default"` or `"new-york"`: replaced by `"radix-vega"`, `"radix-nova"`, etc.
- Individual `@radix-ui/react-*` packages: unified into `radix-ui`

---

## Environment Availability

> This phase only modifies package.json, TypeScript source files, and CSS in packages/ui. No external services, databases, or CLIs are required beyond bun and the shadcn CLI (run via bunx).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| bun | Package install + scripts | ✓ | 1.3.11 | — |
| shadcn CLI | Adding component files | via bunx | 4.2.0 (bunx fetches latest) | Manual copy from github.com/shadcn-ui/ui/tree/main/apps/www/registry |
| Node.js / npm | Version lookups | ✓ | system | — |

---

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
| UI-01 | shadcn/ui packages installed, react-figma-ui absent | smoke | `bun run --filter @repo/ui test` — imports resolve | ✅ exports.test.ts (needs update) |
| UI-02 | Figma design tokens in CSS | manual/visual | `bun run dev:ui-only` — visual check | ❌ no automated test for CSS values |
| UI-03 | All 14 exports defined and not undefined | unit | `bun run --filter @repo/ui test` — exports.test.ts | ✅ exists (needs update for new names) |
| UI-04 | postinstall script absent; bun install clean | smoke | `bun install --dry-run` or inspect package.json | ❌ no automated test |

### Sampling Rate

- **Per task commit:** `bun run --filter @repo/ui test`
- **Per wave merge:** `bun run test` (all packages)
- **Phase gate:** Full suite green + `bun run dev:ui-only` visual check before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `packages/ui/src/__tests__/exports.test.ts` — update expected export names (Accordion, RadioGroup, SelectItem, etc.)
- [ ] `packages/ui/src/__tests__/App.test.tsx` — update component usage in App sampler test after app.tsx is rewritten
- [ ] Visual test: `bun run dev:ui-only` — cannot be automated; document as manual gate

*(Existing test infrastructure is sufficient; updates to existing tests are required, not new test infrastructure)*

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Figma's plugin iframe inherits the Inter font from the host app; external @font-face URLs are not needed | Pitfall 5, Design Tokens | Text renders in wrong font; may need to embed subset or use system-ui fallback |
| A2 | tw-animate-css @import is processed by @tailwindcss/vite before vite-plugin-singlefile sees it, so animations are inlined correctly | Pitfall 6 | Animations absent from plugin UI; must add tw-animate-css as devDep and verify with dev:ui-only |
| A3 | lucide-react can adequately cover the Icon component use cases (only plus, info, star used in demo app.tsx) | Pattern 5 / Icon mapping | Additional icon names referenced elsewhere would break; full 84-name icon coverage would require SVG sprites |
| A4 | Type component API (size/weight props) matches react-figma-ui Type interface | Pattern 5 / Type component | App.tsx type errors if prop names differ from what consumers expect |
| A5 | OKLCH values in design token mapping are visually close to figma-plugin-ds hex values | Design Token section | Visual regression; colors won't match Figma native appearance; require manual calibration |
| A6 | `bunx shadcn@latest add` correctly handles `@repo/ui` aliases in components.json without requiring `@workspace/ui` naming | Pattern 1 / components.json | CLI may fail to resolve aliases; manual file copy fallback available |

---

## Open Questions

1. **Icon implementation depth**
   - What we know: The demo `app.tsx` uses only 3 icon names (`plus`, `info`, `star`). The full `IconName` type has 84 names.
   - What's unclear: Are any of the 84 names used outside the demo (e.g., Storybook stories, or future plugin code)?
   - Recommendation: Check all story files in `apps/storybook/src/stories/` for Icon.stories.tsx usage; if stories reference many names, implement lucide-react name mapping. For Phase 13, satisfy app.tsx + story coverage only.

2. **`@repo/ui` vs `@workspace/ui` alias in components.json**
   - What we know: Official shadcn/ui monorepo docs use `@workspace/ui`. This project uses `@repo/ui`.
   - What's unclear: Whether the shadcn CLI 4.x enforces `@workspace/*` format or accepts any alias.
   - Recommendation: Try `@repo/ui` in components.json first. If CLI fails, use manual component copy as fallback (copy files directly from GitHub registry).

3. **Radio group API compatibility**
   - What we know: react-figma-ui `Radio` is a single `<input type="radio">` item used standalone. shadcn/ui `RadioGroup` is a group primitive.
   - What's unclear: Whether existing usage always wraps Radio items in a shared name="" group (they do in app.tsx).
   - Recommendation: Export `RadioGroup` and `RadioGroupItem` from index.ts; update app.tsx to use group pattern. Existing consumers (app.tsx, stories) use name="" grouping already.

---

## Sources

### Primary (HIGH confidence)
- `npm view shadcn version` → 4.2.0 [VERIFIED]
- `npm view radix-ui version` → 1.4.3 [VERIFIED]
- `npm view class-variance-authority version` → 0.7.1 [VERIFIED]
- `npm view tailwind-merge version` → 3.5.0 [VERIFIED]
- `npm view clsx version` → 2.1.1 [VERIFIED]
- `npm view lucide-react version` → 1.8.0 [VERIFIED]
- `npm view tw-animate-css version` → 1.4.0 [VERIFIED]
- `packages/ui/node_modules/figma-plugin-ds/dist/figma-plugin-ds.css` — design token values extracted [VERIFIED: direct file read]
- `packages/ui/node_modules/react-figma-ui/lib/components/*.d.ts` — component prop types [VERIFIED: direct file read]
- [ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4) — tw-animate-css, @theme inline [CITED]
- [ui.shadcn.com/docs/installation/manual](https://ui.shadcn.com/docs/installation/manual) — dependencies, cn(), components.json [CITED]
- [ui.shadcn.com/docs/monorepo](https://ui.shadcn.com/docs/monorepo) — workspace components.json format [CITED]
- [ui.shadcn.com/docs/theming](https://ui.shadcn.com/docs/theming) — OKLCH CSS variable format [CITED]
- [ui.shadcn.com/docs/changelog/2025-06-radix-ui](https://ui.shadcn.com/docs/changelog/2025-06-radix-ui) — unified radix-ui package [CITED]
- [ui.shadcn.com/docs/changelog/2026-02-radix-ui](https://ui.shadcn.com/docs/changelog/2026-02-radix-ui) — February 2026 new-york style default [CITED]
- [turborepo.dev/docs/guides/tools/shadcn-ui](https://turborepo.dev/docs/guides/tools/shadcn-ui) — `bunx shadcn@canary add` pattern [CITED]

### Secondary (MEDIUM confidence)
- WebSearch + multiple community sources confirming bun CLI peer-dep gap (github.com/shadcn-ui/ui/issues/8356)
- WebSearch confirming radix-nova style is current default for new projects

### Tertiary (LOW confidence)
- OKLCH color approximations for Figma design tokens (A5 in Assumptions Log)
- Figma iframe Inter font inheritance behavior (A1 in Assumptions Log)

---

## Metadata

**Confidence breakdown:**
- Standard stack versions: HIGH — verified via npm registry
- shadcn/ui monorepo setup: HIGH — verified via official shadcn docs
- Component migration map: MEDIUM — API shapes verified from type defs; shadcn component props ASSUMED from docs descriptions
- Design token OKLCH values: LOW — approximations; require visual calibration

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (shadcn/ui releases frequently; re-verify CLI version before executing)
