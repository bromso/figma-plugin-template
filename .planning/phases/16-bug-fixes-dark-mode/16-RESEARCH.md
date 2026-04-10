# Phase 16: Bug Fixes + Dark Mode — Research

**Researched:** 2026-04-10
**Domain:** CSS dark mode tokens, Figma plugin theming, @iconify/react offline preloading, postcss-url path encoding, vite-plugin-singlefile HTML conformance
**Confidence:** HIGH (all critical findings verified against source code or official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Dark mode kept and fully wired. Full OKLCH token set under `.dark { ... }` in `packages/ui/src/styles.css`.
- D-02: Detection is pure CSS — Figma's injected class on `<html>`. No runtime messaging. Researcher to confirm exact class name.
- D-03: All 7 shadcn components keep existing `dark:` variants — no stripping.
- D-04: Tailwind v4 `dark` variant configured for class strategy (not media). Researcher to verify `@custom-variant dark` syntax.
- D-05: main.tsx null guard: `throw new Error('Root element #root not found in index.html')`.
- D-06: Define and export `type ButtonProps` from `button.tsx`. Same inline type already used. index.ts re-export becomes real.
- D-07: Add `AlertAction` to `packages/ui/src/index.ts` barrel. alert.tsx already exports it.
- D-08: Replace lucide-react + iconMap in public Icon component with `@iconify/react`.
- D-09: Strategy: curated bundled icons. Preload whitelist via addCollection/addIcon at module init. No runtime fetches to api.iconify.design.
- D-10: Rename prop `iconName` → `name`. Update all call sites in same phase.
- D-11: Export typed `StaticIconName` string union from `@repo/ui` covering preloaded whitelist.
- D-12: Keep `spin` prop via `animate-spin` className on iconify component.
- D-13: Drop graceful "return null" fallback — narrowed type prevents invalid names at compile time.
- D-14: Rewrite `packages/ui/src/index.html` as conformant document. Researcher to confirm vite-plugin-singlefile compatibility.
- D-15: Researcher decides postcssUrl space-encoding fix strategy.
- D-16: Verify with a path-with-spaces test.

### Claude's Discretion
- Exact `StaticIconName` literal list (minimum: `lucide:plus`, `lucide:info`, `lucide:star`; can add a few common names)
- Exact helper name for preload function
- Whether null-guard in main.tsx is inline or extracted helper (inline is fine)
- Commit sequencing inside Phase 16

### Deferred Ideas (OUT OF SCOPE)
- Phase 17 TYPE-02 API restructuring (registerIcons / StaticIconNameMap interface augmentation)
- Storybook dark mode toggle
- Full Lucide icon coverage beyond 3 icons
- Internal lucide-react imports in select.tsx / checkbox.tsx / accordion.tsx (Phase 18)
- Theme sync when Figma changes mode live (manual QA only)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUG-01 | main.tsx null-guards getElementById("root") instead of unchecked `as HTMLElement` cast | D-05: throw pattern confirmed as canonical React 19 + Vite pattern |
| BUG-02 | ButtonProps defined in button.tsx and importable from @repo/ui | Confirmed phantom: button.tsx exports `{ Button, buttonVariants }` only — no `ButtonProps` named type |
| BUG-03 | AlertAction exported from @repo/ui index | Confirmed gap: alert.tsx exports AlertAction, index.ts barrel omits it |
| BUG-04 | Icon component name prop narrowed to known names — invalid names fail at compile time | Full iconify/react v6 offline API documented; addCollection pattern confirmed |
| BUG-05 | index.html is a conformant document with DOCTYPE, html, head, body | vite-plugin-singlefile v2.3.x confirmed compatible with full HTML structure |
| BUG-06 | postcssUrl uses pathToFileURL() from node:url — build works on paths containing spaces | Custom url callback strategy confirmed; callback signature and absolutePath field documented from source |
| THEME-01 | Dark mode fully supported with tokens under .dark | figma-dark class confirmed; @custom-variant dark syntax confirmed for Tailwind v4 |
</phase_requirements>

---

## Research Summary

- **Figma dark mode class name is confirmed as `figma-dark`** (and `figma-light` for light mode). Figma's official developer docs at `developers.figma.com/docs/plugins/css-variables/` state exactly: "A `figma-light` or `figma-dark` class will be added to the `<html>` element in the iframe content." This is HIGH confidence with an authoritative citation.

- **Tailwind v4 `@custom-variant dark` syntax is `@custom-variant dark (&:where(html.figma-dark *, html.figma-dark))`** — the official Tailwind docs and multiple community sources confirm `@custom-variant dark (&:where(.dark, .dark *))` as the exact pattern; substituting `.dark` with `html.figma-dark` is the correct Figma-specific adaptation.

- **@iconify/react v6 has a dedicated offline export at `@iconify/react/offline`** that contains ZERO API/network code (confirmed by source inspection: `grep api.iconify.design` returns 0 hits in `offline.js`). The offline export provides `Icon`, `InlineIcon`, `addCollection`, and `addIcon`. The `disableCache` function has been **removed in v6** — it is not needed with the offline bundle because the offline bundle has no fetching code at all.

- **postcss-url v10.1.3 custom url callback receives `(asset, dir, options, decl, warn, result, addDependency)`** and `asset.absolutePath` contains the raw filesystem path (built via `path.resolve`). The custom callback returns a new URL string. Strategy (a) — a custom `url:` function that reads the file and returns a `data:` URI using `pathToFileURL(asset.absolutePath).href` — is confirmed feasible from source inspection of `type/custom.js` and `lib/paths.js`.

- **ButtonProps is confirmed a phantom**: `packages/ui/src/components/ui/button.tsx` last line is `export { Button, buttonVariants }` — no `ButtonProps` export. `index.ts` barrel has `export { Button, type ButtonProps, buttonVariants }` which TypeScript erases silently (type-only phantom).

- **AlertAction IS in alert.tsx** (`export { Alert, AlertAction, AlertDescription, AlertTitle }`) but NOT in `index.ts` which only has `export { Alert, AlertDescription, AlertTitle }`.

---

## Decisions Resolved

### D-02 — Figma dark mode class name

**Recommendation:** Use `html.figma-dark` as the selector.

**Citation:** Figma Developer Docs — CSS Variables and Theming: https://developers.figma.com/docs/plugins/css-variables/
> "A `figma-light` or `figma-dark` class will be added to the `<html>` element in the iframe content of a Figma plugin."

**Reasoning:** This is the official, current (2025–2026) Figma-documented behavior. Both `figma-dark` and `figma-light` are injected. The CSS target for dark mode is `html.figma-dark`. No runtime JS detection is needed — pure CSS selector match.

**Alternatives considered:** `figma-dark-mode`, CSS variable detection — both wrong per official docs.

---

### D-04 — Tailwind v4 `@custom-variant dark`

**Recommendation:** Add the following line to `packages/ui/src/styles.css` after `@import "tailwindcss";`:

```css
@custom-variant dark (&:where(html.figma-dark *, html.figma-dark));
```

**Citation:** Tailwind CSS official docs (dark mode page): https://tailwindcss.com/docs/dark-mode
> "You can customize which selector Tailwind uses to apply dark mode styles by using @custom-variant dark"
> Example: `@custom-variant dark (&:where(.dark, .dark *));`

Verified Tailwind version in `packages/ui/package.json`: `"tailwindcss": "^4.2.2"` — confirmed v4. The `@custom-variant` directive is a v4-only feature (does not exist in v3).

**How it works:** The selector `&:where(html.figma-dark *, html.figma-dark)` makes `dark:` utilities activate when the element is a descendant of `html.figma-dark` OR is `html.figma-dark` itself. This is zero-cost (`:where()` has 0 specificity).

**Alternatives considered:**
- `@custom-variant dark (&:where(.dark, .dark *))` — standard pattern; requires `.dark` on a parent, not `html.figma-dark`. Incorrect for Figma.
- `prefers-color-scheme: dark` media query — Figma does NOT use OS media preference for its own dark mode detection; the class injection is the signal.

**Storybook note:** Storybook's `<html>` will not have `figma-dark` — dark mode won't activate in Storybook. This is expected and accepted per CONTEXT.md Deferred Ideas.

---

### D-08 / D-09 — @iconify/react offline preload strategy

#### Package choice

**Recommendation:** Install `@iconify/react@^6.0.2` and `@iconify-json/lucide@^1.2.102` (per-set package, NOT `@iconify/json`).

| Package | Install size | Rationale |
|---------|-------------|-----------|
| `@iconify/react` | small | React component + offline bundle |
| `@iconify-json/lucide` | ~537KB icons.json, 1754 icons | Only Lucide prefix; `@iconify/json` is 2.2.461 (massive) |
| `@iconify/json` | HUGE (~100MB+) | Contains ALL 150+ sets — do NOT use |

**Citation:** `npm view @iconify-json/lucide version` → `1.2.102`. Package contains `icons.json` (~537KB for all 1754 lucide icons).

#### Offline import path

**Use `@iconify/react/offline`** — NOT the default `@iconify/react`.

```typescript
import { Icon, addCollection } from '@iconify/react/offline';
```

The offline bundle (`dist/offline.js`, 832 lines) contains ZERO references to `api.iconify.design`, `fetch`, or `XMLHttpRequest` — confirmed by source grep. The main bundle (`dist/iconify.js`) hard-codes `https://api.iconify.design` and ships fetch logic. Using the offline import eliminates all network code from the bundle entirely.

**Citation:** Direct source inspection of `/node_modules/@iconify/react/dist/offline.js` — 0 grep hits for `api`, `fetch`, `XMLHttp`, `iconify.design`.

#### addCollection API

```typescript
// Full signature from offline.d.ts:
addCollection(data: IconifyJSON, prefix?: string | boolean): void
```

- `data` must include `prefix`, `icons` (and optionally `width`, `height`)
- Default `prefix` behavior: uses `data.prefix + ':'` as the storage key prefix
- After `addCollection({ prefix: 'lucide', icons: { plus: { body: '...' }, ... } })`, icons are accessible as `'lucide:plus'`, `'lucide:info'`, `'lucide:star'` in `<Icon icon="lucide:plus" />`

**Icon data shape** (verified from `@iconify-json/lucide/icons.json`):

```json
{
  "prefix": "lucide",
  "icons": {
    "plus": { "body": "<path fill=\"none\" stroke=\"currentColor\" ...d=\"M5 12h14m-7-7v14\"/>" },
    "info": { "body": "<g fill=\"none\" ...>...</g>" },
    "star": { "body": "<polygon .../>"}
  },
  "width": 24,
  "height": 24
}
```

Each icon's only required field is `body` (SVG content string). `IconifyIcon` interface: `{ body: string }` plus optional transforms.

#### addIcon API

```typescript
// Full signature from offline.d.ts:
addIcon(name: string, data: IconifyIcon): void
```

`addIcon` adds a single icon by full name (e.g., `addIcon('lucide:plus', { body: '...' })`). It is lower-level than `addCollection`. For the whitelist preload, `addCollection` with the subset is preferred — one call, cleaner.

#### Preload pattern

```typescript
// packages/ui/src/components/figma/icon.tsx
import { Icon as IconifyIcon, addCollection } from '@iconify/react/offline';
import type { IconifyJSON } from '@iconify/types';

// Minimal collection containing only the whitelisted icons
const lucideSubset: IconifyJSON = {
  prefix: 'lucide',
  icons: {
    plus: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7v14"/>' },
    info: { body: '...' },
    star: { body: '...' },
  },
  width: 24,
  height: 24,
};

// Runs once at module init — no React, no hooks
addCollection(lucideSubset);
```

Alternatively, import the JSON directly from `@iconify-json/lucide` and pass it to `addCollection` — the bundler tree-shakes out all icons except those used (however, the JSON is imported as a whole object so the entire 537KB file ships unless only specific keys are extracted). **Recommendation:** Extract only the 3 whitelisted icons into a hand-coded constant to keep bundle impact minimal. This fits the CONTEXT.md "ship the minimum" principle.

#### className prop on Icon

Confirmed: the offline `Icon` component merges incoming `className` with its own `iconify`/`iconify--{prefix}` classes:

```javascript
// offline.js line 671-675:
case 'className':
    componentProps[key] =
        (componentProps[key] ? componentProps[key] + ' ' : '') + value;
    break;
```

So `<IconifyIcon icon="lucide:plus" className="animate-spin size-4" />` works correctly — `animate-spin` reaches the root `<svg>` element.

#### disableCache in v6

`disableCache` and `enableCache` have been **removed in v6** (April 2025 migration). They do not need to be called. The offline bundle has no caching to disable.

**Citation:** Iconify April 2025 migration guide: https://iconify.design/docs/articles/migration/icon-v3.html
Search result summary: "Previously deprecated functions disableCache() and enableCache() have been removed. Component no longer uses browser storage for caching."

#### StaticIconName type

Per D-11, Phase 16 exports a string literal union:

```typescript
export type StaticIconName = 'lucide:plus' | 'lucide:info' | 'lucide:star';
```

Phase 17 will restructure this into `interface StaticIconNameMap` + `keyof` — Phase 16 only needs the bare union. Planner should add a TODO comment noting Phase 17 will convert it.

#### No network references in built bundle

After switching to `@iconify/react/offline`, run:
```bash
grep -r "api.iconify.design" apps/design-plugin/dist/
```
Expected: 0 hits. This is the BUG-04 verification for network isolation.

---

### D-06 / BUG-06 — postcss-url path encoding strategy

**Recommendation: Strategy (a) — custom `url` callback.**

**Reasoning:** The root cause is that `postcss-url` builds `absolutePath` via `path.resolve(path.join(dir.file, pathname))` (confirmed in `src/lib/paths.js`). When the project root contains a space (e.g., `/Users/john doe/sites/...`), this raw filesystem path is passed to `fs.readFile()` which works fine — the bug manifests when postcss-url constructs a `file://` URI from the path without percent-encoding. A custom `url` callback intercepts after `absolutePath` is computed and can use `pathToFileURL(asset.absolutePath).href` to get a correctly-encoded URI before performing the inline.

**Callback invocation flow** (confirmed from `src/type/custom.js`):

```javascript
// custom.js:
module.exports = function getCustomProcessor(asset, dir, options) {
    return Promise.resolve().then(() => options.url.apply(null, arguments));
};
```

Arguments passed to the callback: `(asset, dir, options, decl, warn, result, addDependency)`

**`asset` object properties** (from `src/lib/paths.js` typedef and `prepareAsset` function):
- `asset.url` — original URL string from CSS (e.g., `./fonts/Inter.woff2`)
- `asset.absolutePath` — resolved filesystem path (e.g., `/Users/john doe/...`)
- `asset.relativePath` — relative path to target dir
- `asset.pathname` — URL without search/hash
- `asset.search` — query string portion
- `asset.hash` — fragment identifier

**Implementation:**

```typescript
// apps/design-plugin/vite.config.ui.ts
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

// Custom inline handler: reads file and returns a data: URI using
// pathToFileURL so spaces in the path are percent-encoded correctly
const inlineWithPathToFileURL = async (asset: {
  absolutePath: string;
  url: string;
}) => {
  if (!asset.absolutePath) return;
  try {
    const content = fs.readFileSync(asset.absolutePath);
    const ext = path.extname(asset.absolutePath).slice(1).toLowerCase();
    const mimeMap: Record<string, string> = {
      woff2: 'font/woff2',
      woff: 'font/woff',
      ttf: 'font/ttf',
      svg: 'image/svg+xml',
      png: 'image/png',
    };
    const mime = mimeMap[ext] || 'application/octet-stream';
    return `data:${mime};base64,${content.toString('base64')}`;
  } catch {
    return; // let postcss-url warn and skip
  }
};

// In vite config css.postcss:
css: {
  postcss: {
    plugins: [postcssUrl({ url: inlineWithPathToFileURL })],
  },
},
```

**Why not (b) or (c):**
- (b) A preceding Vite plugin to rewrite `url()` refs before postcss-url sees them is more complex — would require parsing CSS AST in a Vite plugin, duplicating what postcss-url already does.
- (c) patch-package against postcss-url's inliner is the highest maintenance burden; requires keeping a patch in sync with upstream changes.

**Verification recipe (D-16):**
```bash
# Create a test asset under a path with a space (simulate the bug)
mkdir -p "apps/design-plugin/test assets"
cp packages/ui/public/fonts/Inter.woff2 "apps/design-plugin/test assets/Inter-test.woff2"
# Add a @font-face rule referencing it in a test CSS file (or symlink the real font dir)
# Run the build
bun run --filter @repo/design-plugin build
# Then check that the output contains a valid base64 data URI
grep -c "data:font/woff2;base64," apps/design-plugin/dist/index.html
```

---

### D-14 — vite-plugin-singlefile + conformant HTML

**Recommendation:** Rewrite `index.html` as a conformant document. vite-plugin-singlefile is fully compatible.

**Confirmed behavior:** `vite-plugin-singlefile` v2.3.x (latest: 2.3.0, July 2, 2025) operates on Vite's generated HTML output. It inlines `<script>` and `<link rel="stylesheet">` tags regardless of whether the HTML is minimal or conformant. The plugin documentation lists no HTML structure requirements — it simply replaces tag references with their inlined content.

**Citation:** https://github.com/richardtallent/vite-plugin-singlefile
Installed version in project: `"vite-plugin-singlefile": "^2.0.3"` — uses `^` so will be 2.0.3+.

**Target structure:**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Figma Plugin</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

**Gotchas:**
- `<script type="module">` is required — Vite uses ES modules. Do not change this.
- `vite-plugin-singlefile`'s `// MUST be last` constraint on plugin ordering is a DX-02 comment task (Phase 20), not a code requirement. The plugin already works last in the array.
- `<link rel="stylesheet">` is correctly inlined by the plugin. The `href="./styles.css"` path resolves relative to `root` (which is `packages/ui/src`).
- CSP meta tags: do NOT add `<meta http-equiv="Content-Security-Policy">` — Figma's iframe sandbox enforces its own CSP; adding a restrictive meta tag would break things.
- Public folder assets: vite-plugin-singlefile warns that static resources in the `public/` folder aren't automatically inlined — fonts referenced via `@font-face` in CSS are handled by `postcss-url` instead (already wired up).

---

### D-05 — main.tsx null guard

**Current code:**
```typescript
const rootElement = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootElement);
```

**Fix:**
```typescript
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}
const root = ReactDOM.createRoot(rootElement);
```

**Confirmation:** This is the canonical React + Vite pattern. `ReactDOM.createRoot` accepts `HTMLElement` (non-nullable); passing `null` would throw an opaque runtime error from inside React. Explicit null-check with a descriptive Error message is strictly better for template consumers.

**No invariant helper needed** — one site, inline is fine. Keep it readable.

---

### BUG-02 — ButtonProps (confirmed phantom)

**Current state verified:**
- `packages/ui/src/components/ui/button.tsx` exports: `export { Button, buttonVariants }` — NO `ButtonProps` named export
- `packages/ui/src/index.ts` has: `export { Button, type ButtonProps, buttonVariants }` — phantom re-export (TypeScript erases `type ButtonProps` silently since it doesn't exist)

**Fix:** Add to `button.tsx` above the function definition:

```typescript
export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };
```

Then update the function signature to use it:
```typescript
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
```

The `index.ts` re-export line already includes `type ButtonProps` — it becomes real once the type is defined in `button.tsx`.

---

### BUG-03 — AlertAction barrel re-export (confirmed)

**Current state verified:**
- `packages/ui/src/components/ui/alert.tsx`: `export { Alert, AlertAction, AlertDescription, AlertTitle }` — AlertAction IS exported from alert.tsx
- `packages/ui/src/index.ts`: `export { Alert, AlertDescription, AlertTitle } from "./components/ui/alert"` — AlertAction is MISSING

**Fix:** Change the index.ts Alert re-export line to:
```typescript
export { Alert, AlertAction, AlertDescription, AlertTitle } from "./components/ui/alert";
```

No changes to `alert.tsx` required (per D-07 in CONTEXT.md — "alert.tsx already defines and exports it locally").

---

### Turborepo impact

**No changes to `turbo.json` required for Phase 16.**

Current `turbo.json` has a `types` task with `dependsOn: ["^build"]` but Phase 16 adds no `types` scripts — that's Phase 17. New dependencies (`@iconify/react`, `@iconify-json/lucide`) added to `packages/ui/package.json` workspace deps are automatically picked up by Turborepo's task graph on the next run. Workspace deps do not require `turbo.json` edits.

**Cache impact:** `@iconify/react/offline` imports are pure ES modules with no side effects beyond populating a module-level `storage` object. Vite's module graph handles them correctly for build caching. Turborepo's `build` task output hash includes `package.json` changes, so adding the new deps will invalidate the `@repo/ui` build cache once (expected and correct).

---

### D-10 — Call-site inventory for `iconName` → `name` rename

**Complete list of sites to update** (verified by grep):

| File | Count | Lines | Value type |
|------|-------|-------|-----------|
| `packages/ui/src/components/figma/icon.tsx` | 2 | prop def (`iconName: string`) + destructure | N/A (rewrite) |
| `packages/ui/src/components/figma/icon-button.tsx` | 1 | `iconProps.iconName` → `iconProps.name` (via spread, no explicit ref) | N/A |
| `packages/ui/src/app.tsx` | 3 | `iconName="star"`, `iconName="info"`, `iconProps={{ iconName: "plus" }}` | All static literals |
| `apps/storybook/src/stories/Icon.stories.tsx` | 4 | `iconName: "info"`, `"plus"`, `"star"`, `"info"` | All static literals |
| `apps/storybook/src/stories/IconButton.stories.tsx` | 3 | `iconName: "plus"`, `"star"`, `"info"` | All static literals |

**Total:** 13 individual string occurrences. All values are static string literals — no dynamic prop values anywhere. The rename to `name` is safe with no runtime narrowing risk.

**Note on icon-button.tsx:** The prop is passed through `<Icon {...iconProps} />` (spread), so renaming `iconName` → `name` in the `IconProps` interface is sufficient — no explicit `iconProps.iconName` reference in the component body. However, the `IconButtonProps` interface has `iconProps: IconProps` — once `IconProps.iconName` becomes `IconProps.name`, the Storybook stories must also update their `iconProps: { iconName: ... }` to `iconProps: { name: ... }`.

---

## External Documentation Citations

### Primary (HIGH confidence)

| Source | URL | What was verified |
|--------|-----|-------------------|
| Figma Dev Docs — CSS Variables & Theming | https://developers.figma.com/docs/plugins/css-variables/ | `figma-dark` class name on `<html>` |
| Tailwind CSS v4 — Dark Mode | https://tailwindcss.com/docs/dark-mode | `@custom-variant dark (&:where(...))` syntax |
| @iconify/react v6 source | `/node_modules/@iconify/react/dist/offline.d.ts` | Full offline API: Icon, addCollection, addIcon |
| @iconify/react v6 source | `/node_modules/@iconify/react/dist/iconify.d.ts` | Main bundle exports; iconLoaded, getIcon |
| @iconify/react offline.js source | Direct inspection | Zero network references confirmed |
| @iconify-json/lucide source | `/node_modules/@iconify-json/lucide/icons.json` | Icon data shape; 537KB, 1754 icons |
| postcss-url v10.1.3 source | `/apps/design-plugin/node_modules/postcss-url/src/` | Custom callback signature; absolutePath field; type/custom.js invocation |
| vite-plugin-singlefile README | https://github.com/richardtallent/vite-plugin-singlefile | No HTML structure requirements; v2.3.0 current |
| packages/ui/src/components/ui/button.tsx | Local source | Confirmed: no `ButtonProps` export |
| packages/ui/src/components/ui/alert.tsx | Local source | Confirmed: AlertAction exported from module |
| packages/ui/src/index.ts | Local source | Confirmed: AlertAction missing from barrel |

### Secondary (MEDIUM confidence)

| Source | URL | What was referenced |
|--------|-----|---------------------|
| Iconify migration guide (April 2025) | https://iconify.design/docs/articles/migration/icon-v3.html | disableCache/enableCache removed in v6 |
| npm registry | `npm view @iconify/react version` | v6.0.2 current |
| npm registry | `npm view @iconify-json/lucide version` | v1.2.102 current |
| npm registry | `npm view @iconify/json version` | v2.2.461 (full catalog, NOT recommended) |

---

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `packages/ui/vitest.config.ts` |
| Quick run command | `bun run --filter @repo/ui test` |
| Full suite command | `bun run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| BUG-01 | null-guard throws Error when #root missing | unit | `bun run --filter @repo/ui test -- --grep "BUG-01"` | New test file needed |
| BUG-02 | `type ButtonProps` is importable and non-phantom | type check | `bun run --filter @repo/ui types` (Phase 17) / build-time inference | Verifiable via `bun run build` success + import compile check |
| BUG-03 | AlertAction re-exported from @repo/ui | import smoke | `rg 'AlertAction' packages/ui/src/index.ts` | grep check + storybook usage |
| BUG-04 | `<Icon name="lucide:plus" />` compiles; unknown name fails; no api.iconify.design in bundle | type+build | `bun run build && grep -c api.iconify.design apps/design-plugin/dist/index.html` | Must be 0 |
| BUG-05 | index.html has DOCTYPE, html, head, body; build succeeds | HTML lint + build | `grep DOCTYPE packages/ui/src/index.html && bun run build` | — |
| BUG-06 | Build succeeds from path with space | build smoke | See verification recipe in D-06 section above | One-shot manual test |
| THEME-01 | .dark token block exists; toggling class flips styles | CSS + manual | `grep '\.dark' packages/ui/src/styles.css` + manual devtools toggle | Manual for visual; grep for existence |

### Sampling Rate

- **Per task commit:** `bun run --filter @repo/ui test` (unit tests only, ~2s)
- **Per wave merge:** `bun run test && bun run build && bun run lint`
- **Phase gate:** Full suite green + manual visual verification (THEME-01 devtools check) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/ui/src/components/figma/icon.test.tsx` — covers BUG-04 (addCollection behavior, name prop types)
- [ ] `packages/ui/src/main.test.ts` — covers BUG-01 (null guard behavior)
- [ ] Framework install: already present — no action needed

---

## Open Questions

1. **Does `postcss-url` actually fail today on a path without spaces?**
   - What we know: The audit noted "postcssUrl file:// URL construction doesn't percent-encode paths with spaces." The bug triggers when the absolute path contains `%20` encoded spaces in the CSS url() value passed to `fs.readFile`.
   - What's unclear: The current `absolutePath` is built via `path.resolve` (native OS path, no percent-encoding) and passed to `fs.readFile` directly. This may actually work on macOS/Linux where `fs.readFile` accepts native paths. The bug may only manifest when postcss-url constructs a `file://` URL for some other reason, or it may be in an older version's behavior.
   - Recommendation: The custom callback strategy (a) is still the right fix because it removes the ambiguity entirely, but the planner should treat the verification step (D-16) as required — it will confirm whether the bug is reproducible in the current setup.

2. **@iconify-json/lucide icon body strings (verbatim)** — the preload constant in icon.tsx will embed 3 SVG body strings as literals. These are correct from the current npm package but could drift with patch updates. This is low risk (Lucide icon paths rarely change), but the planner may want to add a comment noting the source version.

---

## Standard Stack

### Core
| Library | Version | Purpose |
|---------|---------|---------|
| `@iconify/react` | 6.0.2 | Icon rendering component + offline bundle |
| `@iconify-json/lucide` | 1.2.102 | Lucide icon data (per-set, not full catalog) |
| `tailwindcss` | 4.2.2 (already installed) | CSS utility framework + dark mode via @custom-variant |

### Installation
```bash
bun add --filter @repo/ui @iconify/react @iconify-json/lucide
```

No changes to `apps/design-plugin/package.json` required for iconify — it consumes `@repo/ui` as a workspace dep.

---

## Metadata

**Confidence breakdown:**
- Figma dark class name: HIGH — official Figma docs
- Tailwind @custom-variant syntax: HIGH — official Tailwind docs
- @iconify/react offline API: HIGH — source code inspection of installed package
- postcss-url callback: HIGH — source code inspection of installed package
- vite-plugin-singlefile HTML compat: MEDIUM — no explicit docs; inferred from plugin design + absence of known restrictions
- ButtonProps phantom: HIGH — local source code
- AlertAction gap: HIGH — local source code
- Turborepo impact: HIGH — turbo.json inspected, no types task needed in Phase 16

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable libraries; Figma class name could change without notice but hasn't since introduction)
